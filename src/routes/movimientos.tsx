import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEntity } from "@/lib/entity-context";
import { toast } from "sonner";
import {
  deleteMovement,
  fmtDate,
  fmtMoney,
  listAccounts,
  listCategories,
  listMovements,
  amountForEntity,
  KIND_LABELS,
  type MovementKind,
  type MovementType,
  type MovementWithRefs,
} from "@/lib/finance-api";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ArrowDownCircle, ArrowUpCircle, Pencil, Search, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { MovementForm } from "@/components/MovementForm";

export const Route = createFileRoute("/movimientos")({ component: MovimientosPage });

function MovimientosPage() {
  const qc = useQueryClient();
  const { activeEntityId } = useEntity();
  const [type, setType] = useState<MovementType | "all">("all");
  const [categoryId, setCategoryId] = useState<string>("all");
  const [accountId, setAccountId] = useState<string>("all");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<MovementWithRefs | null>(null);
  const [toDelete, setToDelete] = useState<MovementWithRefs | null>(null);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories", activeEntityId],
    queryFn: () => listCategories(activeEntityId ?? undefined),
  });
  const { data: accounts = [] } = useQuery({ queryKey: ["accounts"], queryFn: listAccounts });
  const { data: movs = [], isLoading } = useQuery({
    queryKey: ["movements", { type, categoryId, accountId, from, to, search, entityId: activeEntityId }],
    queryFn: () => listMovements({
      type, categoryId, accountId,
      entityId: activeEntityId ?? undefined,
      from: from || undefined, to: to || undefined, search,
    }),
  });

  const totals = useMemo(() => {
    let i = 0, g = 0;
    for (const m of movs) {
      const amt = activeEntityId ? amountForEntity(m, activeEntityId) : (m.type === "income" ? m.amount : -m.amount);
      if (amt >= 0) i += amt;
      else g += Math.abs(amt);
    }
    return { i, g, balance: i - g };
  }, [movs, activeEntityId]);

  const del = useMutation({
    mutationFn: (id: string) => deleteMovement(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["movements"] });
      toast.success("Movimiento eliminado");
      setToDelete(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const kindLabel = (m: MovementWithRefs) => {
    if (m.kind) return KIND_LABELS[m.kind as MovementKind];
    return m.type === "income" ? "Ingreso" : "Gasto";
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="rounded-2xl border border-border bg-card p-3 shadow-[var(--shadow-soft)]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por descripción"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Select value={type} onValueChange={(v) => setType(v as MovementType | "all")}>
            <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              <SelectItem value="income">Ingresos</SelectItem>
              <SelectItem value="expense">Gastos</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger><SelectValue placeholder="Categoría" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categories.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
            </SelectContent>
          </Select>
          <Select value={accountId} onValueChange={setAccountId}>
            <SelectTrigger><SelectValue placeholder="Cuenta" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las cuentas</SelectItem>
              {accounts.map((a) => (<SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>))}
            </SelectContent>
          </Select>
          <div className="col-span-1" />
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="text-sm" />
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="text-sm" />
        </div>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat label="Ingresos" value={fmtMoney(totals.i)} className="text-income" />
        <Stat label="Gastos" value={fmtMoney(totals.g)} className="text-expense" />
        <Stat label="Balance" value={fmtMoney(totals.balance)} className={totals.balance >= 0 ? "text-income" : "text-expense"} />
      </div>

      {/* List */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {isLoading ? (
          <div className="p-6 text-center text-sm text-muted-foreground">Cargando…</div>
        ) : movs.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Sin resultados</div>
        ) : (
          <ul className="divide-y divide-border">
            {movs.map((m) => {
              const amt = activeEntityId ? amountForEntity(m, activeEntityId) : (m.type === "income" ? m.amount : -m.amount);
              const isIncoming = amt >= 0;
              const isInterOut = activeEntityId && m.entity_id === activeEntityId && !!m.to_entity_id;
              return (
              <li key={m.id} className="flex items-center gap-3 px-3 py-3">
                <div className={cn(
                  "grid h-9 w-9 shrink-0 place-items-center rounded-full",
                  isIncoming ? "bg-income-soft text-income" : "bg-expense-soft text-expense"
                )}>
                  {isIncoming ? <ArrowUpCircle className="h-5 w-5" /> : <ArrowDownCircle className="h-5 w-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{m.description || m.category?.name || "Movimiento"}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {isInterOut
                      ? `→ ${m.to_entity?.name ?? "otra entidad"}`
                      : m.to_entity_id && !isInterOut
                      ? `De ${m.entity?.name ?? "otra entidad"}`
                      : kindLabel(m)}
                    {m.account && <> · {m.account.name}</>}
                    {" · "}{fmtDate(m.date)}
                  </p>
                </div>
                <p className={cn(
                  "shrink-0 text-sm font-bold tabular-nums",
                  isIncoming ? "text-income" : "text-expense"
                )}>
                  {isIncoming ? "+" : "−"}{fmtMoney(Math.abs(amt))}
                </p>
                <div className="flex shrink-0 items-center gap-1">
                  <button onClick={() => setEditing(m)} className="rounded-md p-2 text-muted-foreground hover:bg-muted">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => setToDelete(m)} className="rounded-md p-2 text-expense hover:bg-expense-soft">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            );
            })}
          </ul>
        )}
      </div>

      {/* Edit sheet */}
      <Sheet open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl">
          <SheetHeader><SheetTitle>Editar movimiento</SheetTitle></SheetHeader>
          {editing && (
            <div className="mt-4">
              <MovementForm initial={editing} submitLabel="Guardar cambios" onSaved={() => setEditing(null)} />
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete confirm */}
      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar movimiento?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => toDelete && del.mutate(toDelete.id)}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Stat({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card px-2 py-3 shadow-[var(--shadow-soft)]">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-sm font-bold tabular-nums", className)}>{value}</p>
    </div>
  );
}
