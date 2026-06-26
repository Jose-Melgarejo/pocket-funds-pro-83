import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listMovements, monthRange, fmtMoney, fmtDate } from "@/lib/finance-api";
import { ArrowDownCircle, ArrowUpCircle, Plus, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

function Dashboard() {
  const { from, to } = monthRange();
  const { data: movs = [], isLoading } = useQuery({
    queryKey: ["movements", { from, to }],
    queryFn: () => listMovements({ from, to }),
  });

  const ingresos = movs.filter((m) => m.type === "income").reduce((s, m) => s + Number(m.amount), 0);
  const gastos = movs.filter((m) => m.type === "expense").reduce((s, m) => s + Number(m.amount), 0);
  const balance = ingresos - gastos;
  const monthName = new Date().toLocaleDateString("es-AR", { month: "long", year: "numeric" });

  return (
    <div className="space-y-5">
      <section
        className={cn(
          "rounded-2xl p-5 text-white shadow-[var(--shadow-card)]",
          balance >= 0
            ? "bg-gradient-to-br from-[oklch(0.55_0.18_252)] to-[oklch(0.45_0.15_252)]"
            : "bg-gradient-to-br from-[oklch(0.6_0.22_28)] to-[oklch(0.45_0.18_28)]"
        )}
      >
        <p className="text-xs uppercase tracking-wider opacity-80">Balance · {monthName}</p>
        <p className="mt-1 text-3xl font-black tabular-nums">{fmtMoney(balance)}</p>
        <p className="mt-1 text-xs opacity-90">
          {balance >= 0 ? "Te sobró dinero este mes" : "Gastaste más de lo que ingresó"}
        </p>
        <div className="mt-4 flex items-center gap-2 text-xs">
          <span className="rounded-full bg-white/15 px-2 py-1">{movs.length} movimientos</span>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]">
          <div className="flex items-center gap-2 text-income">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs font-medium">Ingresos</span>
          </div>
          <p className="mt-2 text-xl font-bold tabular-nums">{fmtMoney(ingresos)}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]">
          <div className="flex items-center gap-2 text-expense">
            <TrendingDown className="h-4 w-4" />
            <span className="text-xs font-medium">Gastos</span>
          </div>
          <p className="mt-2 text-xl font-bold tabular-nums">{fmtMoney(gastos)}</p>
        </div>
      </section>

      <Link
        to="/registrar"
        className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-4 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-card)] transition active:scale-[0.98]"
      >
        <Plus className="h-5 w-5" /> Registrar movimiento
      </Link>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Últimos movimientos</h2>
          <Link to="/movimientos" className="text-xs font-medium text-primary">Ver todos</Link>
        </div>
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          {isLoading ? (
            <div className="p-6 text-center text-sm text-muted-foreground">Cargando…</div>
          ) : movs.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-8 text-center text-sm text-muted-foreground">
              <Wallet className="h-8 w-8 opacity-50" />
              Sin movimientos este mes. Empezá registrando el primero.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {movs.slice(0, 6).map((m) => (
                <li key={m.id} className="flex items-center gap-3 px-4 py-3">
                  <div
                    className={cn(
                      "grid h-9 w-9 shrink-0 place-items-center rounded-full",
                      m.type === "income" ? "bg-income-soft text-income" : "bg-expense-soft text-expense"
                    )}
                  >
                    {m.type === "income" ? <ArrowUpCircle className="h-5 w-5" /> : <ArrowDownCircle className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{m.description || m.category?.name || "Movimiento"}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {m.category?.name ?? "Sin categoría"} · {fmtDate(m.date)}
                    </p>
                  </div>
                  <p className={cn("shrink-0 text-sm font-bold tabular-nums", m.type === "income" ? "text-income" : "text-expense")}>
                    {m.type === "income" ? "+" : "−"}{fmtMoney(Number(m.amount))}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
