import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createMovement,
  listCategories,
  todayIso,
  updateMovement,
  type MovementType,
  type MovementWithCategory,
} from "@/lib/finance-api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  initial?: MovementWithCategory | null;
  onSaved?: () => void;
  submitLabel?: string;
}

export function MovementForm({ initial, onSaved, submitLabel = "Registrar" }: Props) {
  const qc = useQueryClient();
  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: listCategories });

  const [date, setDate] = useState(initial?.date ?? todayIso());
  const [description, setDescription] = useState(initial?.description ?? "");
  const [type, setType] = useState<MovementType>(initial?.type ?? "expense");
  const [categoryId, setCategoryId] = useState<string>(initial?.category_id ?? "");
  const [amount, setAmount] = useState<string>(initial ? String(initial.amount) : "");
  const [notes, setNotes] = useState(initial?.notes ?? "");

  useEffect(() => {
    if (initial) return;
    // reset categoryId if it no longer matches the type
    const cat = categories?.find((c) => c.id === categoryId);
    if (cat && cat.suggested_type !== "both" && cat.suggested_type !== type) setCategoryId("");
  }, [type, categories, categoryId, initial]);

  const activeCategories = (categories ?? [])
    .filter((c) => c.active)
    .filter((c) => c.suggested_type === "both" || c.suggested_type === type);

  const mut = useMutation({
    mutationFn: async () => {
      if (!date) throw new Error("La fecha es obligatoria");
      if (!type) throw new Error("Elegí Ingreso o Gasto");
      if (!categoryId) throw new Error("Elegí una categoría");
      const num = Number(amount);
      if (!num || num <= 0) throw new Error("El monto debe ser mayor a 0");
      const payload = {
        date,
        description: description.trim() || null,
        type,
        category_id: categoryId,
        amount: num,
        notes: notes.trim() || null,
      };
      if (initial) await updateMovement(initial.id, payload);
      else await createMovement(payload as never);
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
      }
      onSaved?.();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        mut.mutate();
      }}
    >
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setType("expense")}
          className={cn(
            "flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold transition",
            type === "expense"
              ? "border-expense bg-expense-soft text-expense"
              : "border-border bg-card text-muted-foreground"
          )}
        >
          <ArrowDownCircle className="h-4 w-4" /> Gasto
        </button>
        <button
          type="button"
          onClick={() => setType("income")}
          className={cn(
            "flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold transition",
            type === "income"
              ? "border-income bg-income-soft text-income"
              : "border-border bg-card text-muted-foreground"
          )}
        >
          <ArrowUpCircle className="h-4 w-4" /> Ingreso
        </button>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="amount">Monto</Label>
        <Input
          id="amount"
          inputMode="decimal"
          placeholder="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(",", "."))}
          className="h-14 text-2xl font-bold"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Categoría</Label>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger className="h-11">
            <SelectValue placeholder="Elegí una categoría" />
          </SelectTrigger>
          <SelectContent>
            {activeCategories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="date">Fecha</Label>
          <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="desc">Descripción</Label>
          <Input id="desc" placeholder="Opcional" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Observación</Label>
        <Textarea id="notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      <Button type="submit" className="h-12 w-full text-base font-semibold" disabled={mut.isPending}>
        {mut.isPending ? "Guardando…" : submitLabel}
      </Button>
    </form>
  );
}
