import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createMovement,
  kindToType,
  listAccounts,
  listCategories,
  todayIso,
  updateMovement,
  KIND_LABELS,
  type MovementKind,
  type MovementWithCategory,
} from "@/lib/finance-api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const KIND_GROUPS: { label: string; kinds: MovementKind[] }[] = [
  { label: "Personal", kinds: ["gasto_personal", "ingreso_personal", "pago_tarjeta", "ahorro_inversion"] },
  { label: "Negocio",  kinds: ["retiro_negocio", "gasto_negocio", "transferencia"] },
];

const KIND_COLOR: Record<MovementKind, string> = {
  gasto_personal:   "border-expense bg-expense-soft text-expense",
  ingreso_personal: "border-income bg-income-soft text-income",
  pago_tarjeta:     "border-expense bg-expense-soft text-expense",
  ahorro_inversion: "border-blue-500 bg-blue-50 text-blue-700",
  retiro_negocio:   "border-amber-500 bg-amber-50 text-amber-700",
  gasto_negocio:    "border-orange-500 bg-orange-50 text-orange-700",
  transferencia:    "border-muted-foreground bg-muted text-muted-foreground",
};

interface Props {
  initial?: MovementWithCategory | null;
  onSaved?: () => void;
  onSavedAndNew?: () => void;
  submitLabel?: string;
}

export function MovementForm({ initial, onSaved, onSavedAndNew, submitLabel = "Registrar" }: Props) {
  const qc = useQueryClient();
  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: listCategories });
  const { data: accounts } = useQuery({ queryKey: ["accounts"], queryFn: listAccounts });

  const defaultKind: MovementKind = (initial?.kind as MovementKind) ?? "gasto_personal";

  const [date, setDate] = useState(initial?.date ?? todayIso());
  const [description, setDescription] = useState(initial?.description ?? "");
  const [kind, setKind] = useState<MovementKind>(defaultKind);
  const [categoryId, setCategoryId] = useState<string>(initial?.category_id ?? "");
  const [accountId, setAccountId] = useState<string>(initial?.account_id ?? "");
  const [amount, setAmount] = useState<string>(initial ? String(initial.amount) : "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [saveAndNew, setSaveAndNew] = useState(false);

  const type = kindToType(kind);

  useEffect(() => {
    if (initial) return;
    const cat = categories?.find((c) => c.id === categoryId);
    if (cat && cat.suggested_type !== "both" && cat.suggested_type !== type) setCategoryId("");
  }, [kind, categories, categoryId, type, initial]);

  const activeCategories = (categories ?? [])
    .filter((c) => c.active)
    .filter((c) => c.suggested_type === "both" || c.suggested_type === type);

  const activeAccounts = (accounts ?? []).filter((a) => a.active);

  const mut = useMutation({
    mutationFn: async () => {
      if (!date) throw new Error("La fecha es obligatoria");
      if (!categoryId) throw new Error("Elegí una categoría");
      const num = Number(amount);
      if (!num || num <= 0) throw new Error("El monto debe ser mayor a 0");
      const payload = {
        date,
        description: description.trim() || null,
        type,
        kind,
        category_id: categoryId,
        account_id: accountId || null,
        amount: num,
        notes: notes.trim() || null,
      };
      if (initial) await updateMovement(initial.id, payload);
      else await createMovement(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["movements"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(initial ? "Movimiento actualizado" : "Movimiento registrado");
      if (!initial) {
        setDescription("");
        setAmount("");
        setNotes("");
        setCategoryId("");
        setDate(todayIso());
        if (saveAndNew) onSavedAndNew?.();
        else onSaved?.();
      } else {
        onSaved?.();
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleSubmit = (andNew: boolean) => {
    setSaveAndNew(andNew);
    mut.mutate();
  };

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => { e.preventDefault(); handleSubmit(false); }}
    >
      {/* Kind chips */}
      <div className="space-y-3">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Tipo de movimiento</Label>
        {KIND_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">{group.label}</p>
            <div className="flex flex-wrap gap-2">
              {group.kinds.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(k)}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-xs font-semibold transition active:scale-95",
                    kind === k ? KIND_COLOR[k] : "border-border bg-card text-muted-foreground"
                  )}
                >
                  {KIND_LABELS[k]}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Amount */}
      <div className="space-y-1">
        <Label htmlFor="amount" className="text-xs uppercase tracking-wider text-muted-foreground">Monto</Label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-muted-foreground">$</span>
          <Input
            id="amount"
            type="number"
            inputMode="numeric"
            min="0"
            step="1"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="pl-8 text-2xl font-bold tabular-nums h-14"
            autoFocus={!initial}
          />
        </div>
      </div>

      {/* Category */}
      <div className="space-y-1">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Categoría</Label>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger className="h-12">
            <SelectValue placeholder="Seleccioná una categoría" />
          </SelectTrigger>
          <SelectContent>
            {activeCategories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Account */}
      <div className="space-y-1">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Cuenta / Billetera</Label>
        <Select value={accountId} onValueChange={setAccountId}>
          <SelectTrigger className="h-12">
            <SelectValue placeholder="¿Desde qué cuenta?" />
          </SelectTrigger>
          <SelectContent>
            {activeAccounts.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.name}
                {a.type === "business" && <span className="ml-1 text-xs text-amber-600"> (negocio)</span>}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date + Description */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="date" className="text-xs uppercase tracking-wider text-muted-foreground">Fecha</Label>
          <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-12" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="description" className="text-xs uppercase tracking-wider text-muted-foreground">Descripción</Label>
          <Input
            id="description"
            placeholder="Opcional"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="h-12"
          />
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-1">
        <Label htmlFor="notes" className="text-xs uppercase tracking-wider text-muted-foreground">Notas</Label>
        <Textarea
          id="notes"
          placeholder="Observaciones opcionales"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button type="submit" disabled={mut.isPending} className="h-12 flex-1 text-base font-semibold">
          {mut.isPending ? "Guardando…" : submitLabel}
        </Button>
        {!initial && (
          <Button
            type="button"
            variant="outline"
            disabled={mut.isPending}
            className="h-12 whitespace-nowrap px-4 text-sm"
            onClick={() => handleSubmit(true)}
          >
            + Otro
          </Button>
        )}
      </div>
    </form>
  );
}
