import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  listMovements, listEntities, monthRange, fmtMoney, fmtDate,
  computeStats, amountForEntity, KIND_LABELS,
  type MovementKind, type Entity,
} from "@/lib/finance-api";
import { ArrowDownCircle, ArrowUpCircle, Plus, TrendingUp, TrendingDown, Wallet, ArrowRightLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({ component: Dashboard });

function Dashboard() {
  const { from, to } = monthRange();
  const [entityId, setEntityId] = useState<string | null>(null); // null = not loaded yet

  const { data: entities = [] } = useQuery({
    queryKey: ["entities"],
    queryFn: listEntities,
    staleTime: 60_000,
  });

  // Default to first entity (Personal) once loaded
  const activeEntity: Entity | undefined = entityId
    ? entities.find((e) => e.id === entityId)
    : entities[0];
  const activeId = activeEntity?.id ?? "";

  const { data: movs = [], isLoading } = useQuery({
    queryKey: ["movements", { from, to, entityId: activeId }],
    queryFn: () => listMovements({ from, to, entityId: activeId }),
    enabled: !!activeId,
  });

  const stats = computeStats(movs, activeId);
  const monthName = new Date().toLocaleDateString("es-AR", { month: "long", year: "numeric" });

  const kindLabel = (m: (typeof movs)[0]) => {
    if (m.kind) return KIND_LABELS[m.kind as MovementKind];
    return m.type === "income" ? "Ingreso" : "Gasto";
  };

  // For display: amount relative to active entity
  const displayAmount = (m: (typeof movs)[0]) => amountForEntity(m, activeId);

  return (
    <div className="space-y-5">
      {/* Entity selector */}
      {entities.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {entities.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => setEntityId(e.id)}
              className={cn(
                "shrink-0 rounded-full border px-4 py-1.5 text-xs font-semibold transition",
                (activeEntity?.id ?? entities[0]?.id) === e.id
                  ? "text-white shadow-sm"
                  : "border-border bg-card text-muted-foreground"
              )}
              style={
                (activeEntity?.id ?? entities[0]?.id) === e.id
                  ? { backgroundColor: e.color, borderColor: e.color }
                  : undefined
              }
            >
              {e.name}
            </button>
          ))}
        </div>
      )}

      {/* Balance card */}
      <section
        className="rounded-2xl p-5 text-white shadow-[var(--shadow-card)]"
        style={{
          background: activeEntity
            ? `linear-gradient(135deg, ${activeEntity.color}dd, ${activeEntity.color}aa)`
            : "linear-gradient(135deg, oklch(0.55 0.18 252), oklch(0.45 0.15 252))",
        }}
      >
        <p className="text-xs uppercase tracking-wider opacity-80">
          {activeEntity?.name ?? "—"} · {monthName}
        </p>
        <p className="mt-1 text-3xl font-black tabular-nums">{fmtMoney(stats.balance)}</p>
        <p className="mt-1 text-xs opacity-90">
          {stats.balance >= 0 ? "Balance positivo" : "Balance negativo"}
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-white/15 px-2 py-1">{movs.length} movimientos</span>
          {stats.transferencias_recibidas > 0 && (
            <span className="rounded-full bg-white/15 px-2 py-1">
              Recibido de otras entidades: {fmtMoney(stats.transferencias_recibidas)}
            </span>
          )}
          {stats.transferencias_enviadas > 0 && (
            <span className="rounded-full bg-white/15 px-2 py-1">
              Enviado a otras entidades: {fmtMoney(stats.transferencias_enviadas)}
            </span>
          )}
        </div>
      </section>

      {/* Ingresos / Gastos */}
      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]">
          <div className="flex items-center gap-2 text-income">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs font-medium">Ingresos</span>
          </div>
          <p className="mt-2 text-xl font-bold tabular-nums">{fmtMoney(stats.ingresos)}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]">
          <div className="flex items-center gap-2 text-expense">
            <TrendingDown className="h-4 w-4" />
            <span className="text-xs font-medium">Gastos</span>
          </div>
          <p className="mt-2 text-xl font-bold tabular-nums">{fmtMoney(stats.gastos)}</p>
        </div>
      </section>

      {/* CTA */}
      <Link
        to="/registrar"
        className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-4 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-card)] transition active:scale-[0.98]"
      >
        <Plus className="h-5 w-5" /> Registrar movimiento
      </Link>

      {/* Últimos movimientos */}
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
              Sin movimientos este mes.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {movs.slice(0, 6).map((m) => {
                const amt = displayAmount(m);
                const isIncoming = m.to_entity_id === activeId && m.entity_id !== activeId;
                const isOutgoing = m.entity_id === activeId && !!m.to_entity_id;
                return (
                  <li key={m.id} className="flex items-center gap-3 px-4 py-3">
                    <div className={cn(
                      "grid h-9 w-9 shrink-0 place-items-center rounded-full",
                      isIncoming || m.type === "income"
                        ? "bg-income-soft text-income"
                        : "bg-expense-soft text-expense"
                    )}>
                      {isOutgoing ? (
                        <ArrowRightLeft className="h-4 w-4" />
                      ) : amt >= 0 ? (
                        <ArrowUpCircle className="h-5 w-5" />
                      ) : (
                        <ArrowDownCircle className="h-5 w-5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {m.description || m.category?.name || "Movimiento"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {isIncoming
                          ? `De ${m.entity?.name ?? "otra entidad"}`
                          : isOutgoing
                          ? `→ ${m.to_entity?.name ?? "otra entidad"}`
                          : kindLabel(m)}
                        {" · "}{m.account?.name ?? m.category?.name ?? "Sin categoría"}
                        {" · "}{fmtDate(m.date)}
                      </p>
                    </div>
                    <p className={cn(
                      "shrink-0 text-sm font-bold tabular-nums",
                      amt >= 0 ? "text-income" : "text-expense"
                    )}>
                      {amt >= 0 ? "+" : "−"}{fmtMoney(Math.abs(amt))}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
