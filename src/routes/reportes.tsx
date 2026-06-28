import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listMovements, fmtMoney, amountForEntity } from "@/lib/finance-api";
import { useEntity } from "@/lib/entity-context";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from "recharts";

export const Route = createFileRoute("/reportes")({ component: ReportesPage });

const monthsBack = 6;

function buildMonths() {
  const arr: { key: string; label: string; from: string; to: string }[] = [];
  const d = new Date();
  for (let i = monthsBack - 1; i >= 0; i--) {
    const ref = new Date(d.getFullYear(), d.getMonth() - i, 1);
    const first = new Date(ref.getFullYear(), ref.getMonth(), 1);
    const last = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
    const iso = (x: Date) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
    arr.push({
      key: `${ref.getFullYear()}-${ref.getMonth() + 1}`,
      label: ref.toLocaleDateString("es-AR", { month: "short" }),
      from: iso(first),
      to: iso(last),
    });
  }
  return arr;
}

const palette = ["#10b981", "#ef4444", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

function ReportesPage() {
  const { activeEntityId } = useEntity();
  const [months] = useState(buildMonths);
  const first = months[0].from;
  const last = months[months.length - 1].to;
  const { data: movs = [] } = useQuery({
    queryKey: ["movements", { reportFrom: first, reportTo: last, entityId: activeEntityId }],
    queryFn: () => listMovements({ from: first, to: last, entityId: activeEntityId ?? undefined }),
  });

  const monthly = useMemo(() => {
    return months.map((m) => {
      const inM = movs.filter((mv) => mv.date >= m.from && mv.date <= m.to);
      let ingresos = 0, gastos = 0;
      for (const x of inM) {
        const amt = activeEntityId ? amountForEntity(x, activeEntityId) : (x.type === "income" ? x.amount : -x.amount);
        if (amt >= 0) ingresos += amt; else gastos += Math.abs(amt);
      }
      return { label: m.label, ingresos, gastos, balance: ingresos - gastos };
    });
  }, [months, movs, activeEntityId]);

  const currentFrom = months[months.length - 1].from;
  const currentTo = months[months.length - 1].to;
  const monthMovs = movs.filter((m) => m.date >= currentFrom && m.date <= currentTo);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const m of monthMovs) {
      const amt = activeEntityId ? amountForEntity(m, activeEntityId) : (m.type === "income" ? m.amount : -m.amount);
      if (amt < 0) {
        const k = m.category?.name ?? "Sin categoría";
        map.set(k, (map.get(k) ?? 0) + Math.abs(amt));
      }
    }
    return [...map.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [monthMovs, activeEntityId]);

  const top5 = byCategory.slice(0, 5);

  const dayStats = useMemo(() => {
    const today = new Date();
    const daysElapsed = Math.max(1, today.getDate());
    const byDay = new Map<string, number>();
    let totalGasto = 0;
    for (const m of monthMovs) {
      const amt = activeEntityId ? amountForEntity(m, activeEntityId) : (m.type === "income" ? m.amount : -m.amount);
      if (amt < 0) {
        totalGasto += Math.abs(amt);
        byDay.set(m.date, (byDay.get(m.date) ?? 0) + Math.abs(amt));
      }
    }
    let topDay: { date: string; amount: number } | null = null;
    byDay.forEach((amount, date) => {
      if (!topDay || amount > topDay.amount) topDay = { date, amount };
    });
    return { promedio: totalGasto / daysElapsed, topDay: topDay as { date: string; amount: number } | null };
  }, [monthMovs]);

  return (
    <div className="space-y-5">
      <Card title="Ingresos vs Gastos">
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthly} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.92 0.01 250)" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)} />
              <Tooltip formatter={(v: number) => fmtMoney(v)} />
              <Bar dataKey="ingresos" fill="oklch(0.62 0.17 155)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="gastos" fill="oklch(0.62 0.21 28)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card title="Evolución del balance">
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthly} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.92 0.01 250)" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => (Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)} />
              <Tooltip formatter={(v: number) => fmtMoney(v)} />
              <Line type="monotone" dataKey="balance" stroke="oklch(0.55 0.18 252)" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card title="Gastos por categoría (mes actual)">
        {byCategory.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Sin gastos este mes</p>
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
                  {byCategory.map((_, i) => (<Cell key={i} fill={palette[i % palette.length]} />))}
                </Pie>
                <Tooltip formatter={(v: number) => fmtMoney(v)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <Card title="Top 5 categorías de gasto">
        {top5.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Sin datos</p>
        ) : (
          <ul className="divide-y divide-border">
            {top5.map((c, i) => (
              <li key={c.name} className="flex items-center justify-between py-2.5 text-sm">
                <span className="flex items-center gap-2">
                  <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: palette[i % palette.length] }} />
                  {c.name}
                </span>
                <span className="font-semibold tabular-nums text-expense">{fmtMoney(c.value)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card title="Promedio diario de gasto">
          <p className="text-lg font-bold tabular-nums text-expense">{fmtMoney(dayStats.promedio)}</p>
          <p className="text-xs text-muted-foreground">del mes actual</p>
        </Card>
        <Card title="Día con mayor gasto">
          {dayStats.topDay ? (
            <>
              <p className="text-lg font-bold tabular-nums text-expense">{fmtMoney(dayStats.topDay.amount)}</p>
              <p className="text-xs text-muted-foreground">{dayStats.topDay.date}</p>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">Sin datos</p>
          )}
        </Card>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]">
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      {children}
    </section>
  );
}
