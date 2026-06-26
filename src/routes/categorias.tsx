import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createCategory, deleteCategory, listCategories, listMovements, updateCategory,
  fmtMoney, monthRange,
} from "@/lib/finance-api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/categorias")({ component: CategoriasPage });

type SuggestedType = "income" | "expense" | "both";

function CategoriasPage() {
  const qc = useQueryClient();
  const { from, to } = monthRange();
  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: listCategories });
  const { data: movs = [] } = useQuery({
    queryKey: ["movements", { from, to }],
    queryFn: () => listMovements({ from, to }),
  });
  const totalsByCat = new Map<string, { income: number; expense: number }>();
  movs.forEach((m) => {
    const k = m.category_id ?? "";
    const cur = totalsByCat.get(k) ?? { income: 0, expense: 0 };
    cur[m.type] += Number(m.amount);
    totalsByCat.set(k, cur);
  });

  const [name, setName] = useState("");
  const [type, setType] = useState<SuggestedType>("expense");
  const [toDelete, setToDelete] = useState<{ id: string; name: string } | null>(null);

  const create = useMutation({
    mutationFn: () => createCategory({ name: name.trim(), suggested_type: type }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      setName("");
      toast.success("Categoría creada");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => updateCategory(id, { active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Categoría eliminada");
      setToDelete(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]">
        <h3 className="mb-3 text-sm font-semibold">Nueva categoría</h3>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return toast.error("El nombre es obligatorio");
            create.mutate();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="cname">Nombre</Label>
            <Input id="cname" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Suscripciones" />
          </div>
          <div className="space-y-1.5">
            <Label>Tipo sugerido</Label>
            <Select value={type} onValueChange={(v) => setType(v as SuggestedType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">Gasto</SelectItem>
                <SelectItem value="income">Ingreso</SelectItem>
                <SelectItem value="both">Ambos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={create.isPending}>
            <Plus className="mr-1 h-4 w-4" /> Agregar
          </Button>
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="border-b border-border px-4 py-2.5">
          <h3 className="text-sm font-semibold">Categorías ({categories.length})</h3>
          <p className="text-[11px] text-muted-foreground">Totales del mes actual</p>
        </div>
        <ul className="divide-y divide-border">
          {categories.map((c) => {
            const t = totalsByCat.get(c.id) ?? { income: 0, expense: 0 };
            return (
              <li key={c.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{c.name}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {c.suggested_type === "income" ? "Ingreso" : c.suggested_type === "expense" ? "Gasto" : "Ambos"}
                    {t.expense > 0 && <span className="ml-2 text-expense">−{fmtMoney(t.expense)}</span>}
                    {t.income > 0 && <span className="ml-2 text-income">+{fmtMoney(t.income)}</span>}
                  </p>
                </div>
                <Switch
                  checked={c.active}
                  onCheckedChange={(v) => toggle.mutate({ id: c.id, active: v })}
                />
                <button
                  onClick={() => setToDelete({ id: c.id, name: c.name })}
                  className="rounded-md p-2 text-expense hover:bg-expense-soft"
                  aria-label="Eliminar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar "{toDelete?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Los movimientos existentes quedarán sin categoría.
            </AlertDialogDescription>
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
