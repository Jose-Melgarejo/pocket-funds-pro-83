import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  listEntities, createEntity, updateEntity, deleteEntity,
  listAccounts, createAccount, updateAccount,
  listCategoriesForEntity, createCategory, updateCategory, deleteCategory,
  type Entity, type Account, type Category,
} from "@/lib/finance-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, LogOut, User, KeyRound, Wallet, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/perfil")({ component: PerfilPage });

const COLORS = ["#3b82f6", "#f59e0b", "#10b981", "#8b5cf6", "#ef4444", "#ec4899", "#06b6d4", "#84cc16"];

// ─── Shared small sheet ───────────────────────────────────────────────────────

function BottomSheet({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode;
}) {
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl pb-8">
        <SheetHeader><SheetTitle>{title}</SheetTitle></SheetHeader>
        <div className="mt-4">{children}</div>
      </SheetContent>
    </Sheet>
  );
}

function ConfirmDelete({ open, name, description, onConfirm, onCancel, loading }: {
  open: boolean; name: string; description?: string;
  onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar "{name}"?</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={loading}>
            {loading ? "Eliminando…" : "Eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── User profile card ────────────────────────────────────────────────────────

function UserCard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [editingName, setEditingName] = useState(false);
  const [editingPass, setEditingPass] = useState(false);
  const [name, setName] = useState(user?.user_metadata?.full_name ?? "");
  const [newPass, setNewPass] = useState("");
  const [loading, setLoading] = useState(false);

  const displayName = user?.user_metadata?.full_name as string | undefined;
  const initials = displayName
    ? displayName.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? "?";

  const saveName = async () => {
    if (!name.trim()) { toast.error("El nombre no puede estar vacío"); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ data: { full_name: name.trim() } });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Nombre actualizado");
    setEditingName(false);
  };

  const savePass = async () => {
    if (newPass.length < 6) { toast.error("Mínimo 6 caracteres"); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPass });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Contraseña actualizada");
    setNewPass("");
    setEditingPass(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 p-5 border-b border-border">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-base leading-tight truncate">
            {displayName ?? "Sin nombre"}
          </p>
          <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="divide-y divide-border">
        <button
          onClick={() => { setName(displayName ?? ""); setEditingName(true); }}
          className="flex w-full items-center gap-3 px-5 py-3.5 text-sm hover:bg-muted/50 transition-colors text-left"
        >
          <User className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="flex-1">Editar nombre</span>
        </button>
        <button
          onClick={() => { setNewPass(""); setEditingPass(true); }}
          className="flex w-full items-center gap-3 px-5 py-3.5 text-sm hover:bg-muted/50 transition-colors text-left"
        >
          <KeyRound className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="flex-1">Cambiar contraseña</span>
        </button>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 px-5 py-3.5 text-sm text-destructive hover:bg-destructive/5 transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span>Cerrar sesión</span>
        </button>
      </div>

      {/* Edit name sheet */}
      <BottomSheet open={editingName} onClose={() => setEditingName(false)} title="Editar nombre">
        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Nombre completo</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" className="h-12"
              onKeyDown={(e) => e.key === "Enter" && saveName()} />
          </div>
          <Button onClick={saveName} disabled={loading} className="w-full h-12">
            {loading ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      </BottomSheet>

      {/* Change password sheet */}
      <BottomSheet open={editingPass} onClose={() => setEditingPass(false)} title="Cambiar contraseña">
        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Nueva contraseña</Label>
            <Input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)}
              placeholder="••••••••" className="h-12"
              onKeyDown={(e) => e.key === "Enter" && savePass()} />
          </div>
          <Button onClick={savePass} disabled={loading} className="w-full h-12">
            {loading ? "Guardando…" : "Cambiar contraseña"}
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}

// ─── Categories subsection inside an entity ───────────────────────────────────

function CategoryList({ entity }: { entity: Entity }) {
  const qc = useQueryClient();
  const { data: cats = [] } = useQuery({
    queryKey: ["categories-entity", entity.id],
    queryFn: () => listCategoriesForEntity(entity.id),
  });
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [toDelete, setToDelete] = useState<Category | null>(null);
  const [catName, setCatName] = useState("");
  const [catType, setCatType] = useState<"income" | "expense" | "both">("expense");

  const createMut = useMutation({
    mutationFn: createCategory,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["categories-entity", entity.id] }); qc.invalidateQueries({ queryKey: ["categories"] }); toast.success("Categoría creada"); setAdding(false); },
    onError: (e: Error) => toast.error(e.message),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof updateCategory>[1] }) => updateCategory(id, input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["categories-entity", entity.id] }); qc.invalidateQueries({ queryKey: ["categories"] }); toast.success("Categoría actualizada"); setEditing(null); },
    onError: (e: Error) => toast.error(e.message),
  });
  const deleteMut = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["categories-entity", entity.id] }); qc.invalidateQueries({ queryKey: ["categories"] }); toast.success("Categoría eliminada"); setToDelete(null); },
    onError: (e: Error) => toast.error(e.message),
  });

  const openAdd = () => { setCatName(""); setCatType("expense"); setAdding(true); };
  const openEdit = (c: Category) => { setCatName(c.name); setCatType(c.suggested_type); setEditing(c); };

  const incomes = cats.filter((c) => c.suggested_type === "income");
  const expenses = cats.filter((c) => c.suggested_type === "expense");

  return (
    <div>
      <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-muted/30">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          <Tag className="h-3 w-3" /> Categorías
        </span>
        <button onClick={openAdd} className="flex items-center gap-1 text-xs text-primary font-medium py-1 px-2 rounded-md hover:bg-primary/10">
          <Plus className="h-3 w-3" /> Agregar
        </button>
      </div>

      {cats.length === 0 ? (
        <p className="px-4 py-3 text-xs text-muted-foreground">Sin categorías. Agregá una.</p>
      ) : (
        <div className="divide-y divide-border/50">
          {[{ label: "Ingresos", items: incomes }, { label: "Gastos", items: expenses }].map(({ label, items }) =>
            items.length > 0 && (
              <div key={label}>
                <p className="px-4 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">{label}</p>
                {items.map((c) => (
                  <div key={c.id} className="flex items-center gap-2 px-4 py-2">
                    <span className="flex-1 text-sm">{c.name}</span>
                    <button onClick={() => openEdit(c)} className="p-1.5 rounded-md text-muted-foreground hover:bg-muted">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setToDelete(c)} className="p-1.5 rounded-md text-destructive/70 hover:bg-destructive/10">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}

      {/* Add/edit sheet */}
      <BottomSheet open={adding || !!editing} onClose={() => { setAdding(false); setEditing(null); }} title={editing ? "Editar categoría" : "Nueva categoría"}>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Nombre</Label>
            <Input value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="Ej: Proveedores" className="h-12" />
          </div>
          <div className="space-y-1">
            <Label>Tipo</Label>
            <Select value={catType} onValueChange={(v) => setCatType(v as "income" | "expense" | "both")}>
              <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Ingreso</SelectItem>
                <SelectItem value="expense">Gasto</SelectItem>
                <SelectItem value="both">Ambos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={() => {
              if (!catName.trim()) { toast.error("El nombre es obligatorio"); return; }
              if (editing) updateMut.mutate({ id: editing.id, input: { name: catName.trim(), suggested_type: catType } });
              else createMut.mutate({ name: catName.trim(), suggested_type: catType, entity_id: entity.id });
            }}
            disabled={createMut.isPending || updateMut.isPending}
            className="w-full h-12"
          >
            {(createMut.isPending || updateMut.isPending) ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      </BottomSheet>

      <ConfirmDelete
        open={!!toDelete} name={toDelete?.name ?? ""}
        description="Los movimientos con esta categoría quedarán sin categoría."
        onConfirm={() => toDelete && deleteMut.mutate(toDelete.id)}
        onCancel={() => setToDelete(null)}
        loading={deleteMut.isPending}
      />
    </div>
  );
}

// ─── Accounts subsection inside an entity ─────────────────────────────────────

function AccountList({ entity }: { entity: Entity }) {
  const qc = useQueryClient();
  const { data: allAccounts = [] } = useQuery({ queryKey: ["accounts"], queryFn: listAccounts });
  const accounts = allAccounts.filter((a) => a.entity_id === entity.id);

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [toDelete, setToDelete] = useState<Account | null>(null);
  const [accName, setAccName] = useState("");

  const createMut = useMutation({
    mutationFn: createAccount,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["accounts"] }); toast.success("Cuenta creada"); setAdding(false); },
    onError: (e: Error) => toast.error(e.message),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof updateAccount>[1] }) => updateAccount(id, input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["accounts"] }); toast.success("Cuenta actualizada"); setEditing(null); },
    onError: (e: Error) => toast.error(e.message),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => updateAccount(id, { active: false }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["accounts"] }); toast.success("Cuenta eliminada"); setToDelete(null); },
    onError: (e: Error) => toast.error(e.message),
  });

  const openAdd = () => { setAccName(""); setAdding(true); };
  const openEdit = (a: Account) => { setAccName(a.name); setEditing(a); };

  return (
    <div>
      <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-muted/30">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          <Wallet className="h-3 w-3" /> Cuentas
        </span>
        <button onClick={openAdd} className="flex items-center gap-1 text-xs text-primary font-medium py-1 px-2 rounded-md hover:bg-primary/10">
          <Plus className="h-3 w-3" /> Agregar
        </button>
      </div>

      {accounts.length === 0 ? (
        <p className="px-4 py-3 text-xs text-muted-foreground">Sin cuentas. Agregá una.</p>
      ) : (
        <div className="divide-y divide-border/50">
          {accounts.map((a) => (
            <div key={a.id} className="flex items-center gap-2 px-4 py-2">
              <span className="flex-1 text-sm">{a.name}</span>
              <button onClick={() => openEdit(a)} className="p-1.5 rounded-md text-muted-foreground hover:bg-muted">
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setToDelete(a)} className="p-1.5 rounded-md text-destructive/70 hover:bg-destructive/10">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <BottomSheet open={adding || !!editing} onClose={() => { setAdding(false); setEditing(null); }} title={editing ? "Editar cuenta" : "Nueva cuenta"}>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Nombre</Label>
            <Input value={accName} onChange={(e) => setAccName(e.target.value)} placeholder="Ej: Efectivo, Banco, Mercado Pago" className="h-12" />
          </div>
          <Button
            onClick={() => {
              if (!accName.trim()) { toast.error("El nombre es obligatorio"); return; }
              if (editing) updateMut.mutate({ id: editing.id, input: { name: accName.trim() } });
              else createMut.mutate({ name: accName.trim(), type: entity.type, entity_id: entity.id });
            }}
            disabled={createMut.isPending || updateMut.isPending}
            className="w-full h-12"
          >
            {(createMut.isPending || updateMut.isPending) ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      </BottomSheet>

      <ConfirmDelete
        open={!!toDelete} name={toDelete?.name ?? ""}
        description="La cuenta quedará desactivada y no aparecerá en nuevos movimientos."
        onConfirm={() => toDelete && deleteMut.mutate(toDelete.id)}
        onCancel={() => setToDelete(null)}
        loading={deleteMut.isPending}
      />
    </div>
  );
}

// ─── Entity card (expandable) ─────────────────────────────────────────────────

function EntityCard({ entity, onEdit, onDelete }: {
  entity: Entity; onEdit: () => void; onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Entity header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-4 py-4 hover:bg-muted/30 transition-colors"
      >
        <div className="h-4 w-4 shrink-0 rounded-full" style={{ backgroundColor: entity.color }} />
        <div className="flex-1 min-w-0 text-left">
          <p className="font-semibold text-sm">{entity.name}</p>
          <p className="text-xs text-muted-foreground">{entity.type === "personal" ? "Personal" : "Negocio"}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="p-2 rounded-md text-muted-foreground hover:bg-muted"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-2 rounded-md text-destructive/70 hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          {open ? <ChevronUp className="h-4 w-4 text-muted-foreground ml-1" /> : <ChevronDown className="h-4 w-4 text-muted-foreground ml-1" />}
        </div>
      </button>

      {/* Expandable content */}
      {open && (
        <>
          <AccountList entity={entity} />
          <CategoryList entity={entity} />
        </>
      )}
    </div>
  );
}

// ─── Entities section ─────────────────────────────────────────────────────────

function EntitiesSection() {
  const qc = useQueryClient();
  const { data: entities = [] } = useQuery({ queryKey: ["entities"], queryFn: listEntities });
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Entity | null>(null);
  const [toDelete, setToDelete] = useState<Entity | null>(null);

  const createMut = useMutation({
    mutationFn: createEntity,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["entities"] }); toast.success("Entidad creada"); setAdding(false); },
    onError: (e: Error) => toast.error(e.message),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof updateEntity>[1] }) => updateEntity(id, input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["entities"] }); toast.success("Entidad actualizada"); setEditing(null); },
    onError: (e: Error) => toast.error(e.message),
  });
  const deleteMut = useMutation({
    mutationFn: deleteEntity,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["entities"] }); toast.success("Entidad eliminada"); setToDelete(null); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Entidades</h2>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 text-sm font-medium text-primary py-1.5 px-3 rounded-xl border border-primary/30 hover:bg-primary/5"
        >
          <Plus className="h-4 w-4" /> Nueva entidad
        </button>
      </div>

      <div className="space-y-3">
        {entities.map((e) => (
          <EntityCard
            key={e.id}
            entity={e}
            onEdit={() => setEditing(e)}
            onDelete={() => setToDelete(e)}
          />
        ))}
      </div>

      {/* Add/edit entity sheet */}
      <EntitySheet
        open={adding || !!editing}
        onClose={() => { setAdding(false); setEditing(null); }}
        title={editing ? "Editar entidad" : "Nueva entidad"}
        initial={editing ?? undefined}
        onSave={(v) => editing ? updateMut.mutate({ id: editing.id, input: v }) : createMut.mutate(v)}
        loading={createMut.isPending || updateMut.isPending}
      />

      <ConfirmDelete
        open={!!toDelete} name={toDelete?.name ?? ""}
        description="Se eliminarán también sus cuentas, categorías y movimientos."
        onConfirm={() => toDelete && deleteMut.mutate(toDelete.id)}
        onCancel={() => setToDelete(null)}
        loading={deleteMut.isPending}
      />
    </div>
  );
}

function EntitySheet({ open, onClose, title, initial, onSave, loading }: {
  open: boolean; onClose: () => void; title: string;
  initial?: Entity;
  onSave: (v: { name: string; type: "personal" | "business"; color: string }) => void;
  loading: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState<"personal" | "business">(initial?.type ?? "business");
  const [color, setColor] = useState(initial?.color ?? COLORS[0]);

  const handleSave = () => {
    if (!name.trim()) { toast.error("El nombre es obligatorio"); return; }
    onSave({ name: name.trim(), type, color });
  };

  return (
    <BottomSheet open={open} onClose={onClose} title={title}>
      <div className="space-y-4">
        <div className="space-y-1">
          <Label>Nombre</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: iFixCell" className="h-12" />
        </div>
        <div className="space-y-1">
          <Label>Tipo</Label>
          <Select value={type} onValueChange={(v) => setType(v as "personal" | "business")}>
            <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="personal">Personal</SelectItem>
              <SelectItem value="business">Negocio</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Color</Label>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button
                key={c} type="button" onClick={() => setColor(c)}
                className={cn("h-8 w-8 rounded-full transition-transform", color === c && "ring-2 ring-offset-2 ring-foreground scale-110")}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
        <Button onClick={handleSave} disabled={loading} className="w-full h-12">
          {loading ? "Guardando…" : "Guardar"}
        </Button>
      </div>
    </BottomSheet>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function PerfilPage() {
  return (
    <div className="space-y-6 pb-4">
      <UserCard />
      <EntitiesSection />
    </div>
  );
}
