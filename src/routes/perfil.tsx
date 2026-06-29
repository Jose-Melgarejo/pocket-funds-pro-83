import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import {
  listEntities, createEntity, updateEntity, deleteEntity,
  listAccounts, createAccount, updateAccount,
  type Entity, type Account,
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
import { Plus, Pencil, Trash2, Building2, User } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/perfil")({ component: PerfilPage });

// ─── Entity section ───────────────────────────────────────────────────────────

function EntitySection() {
  const qc = useQueryClient();
  const { data: entities = [] } = useQuery({ queryKey: ["entities"], queryFn: listEntities });
  const [editing, setEditing] = useState<Entity | null>(null);
  const [adding, setAdding] = useState(false);
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
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Entidades</h2>
        <Button size="sm" variant="outline" onClick={() => setAdding(true)}>
          <Plus className="h-4 w-4 mr-1" /> Agregar
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {entities.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">Sin entidades. Agregá una.</p>
        ) : (
          <ul className="divide-y divide-border">
            {entities.map((e) => (
              <li key={e.id} className="flex items-center gap-3 px-4 py-3">
                <div className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: e.color }} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{e.name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    {e.type === "personal" ? <User className="h-3 w-3" /> : <Building2 className="h-3 w-3" />}
                    {e.type === "personal" ? "Personal" : "Negocio"}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setEditing(e)} className="rounded-md p-2 text-muted-foreground hover:bg-muted">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => setToDelete(e)} className="rounded-md p-2 text-expense hover:bg-expense-soft">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Add sheet */}
      <EntitySheet
        open={adding}
        onClose={() => setAdding(false)}
        title="Nueva entidad"
        onSave={(v) => createMut.mutate(v)}
        loading={createMut.isPending}
      />

      {/* Edit sheet */}
      <EntitySheet
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Editar entidad"
        initial={editing ?? undefined}
        onSave={(v) => editing && updateMut.mutate({ id: editing.id, input: v })}
        loading={updateMut.isPending}
      />

      {/* Delete confirm */}
      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar "{toDelete?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Los movimientos asociados quedarán sin entidad asignada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => toDelete && deleteMut.mutate(toDelete.id)}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

const COLORS = ["#3b82f6", "#f59e0b", "#10b981", "#8b5cf6", "#ef4444", "#ec4899", "#06b6d4", "#84cc16"];

function EntitySheet({
  open, onClose, title, initial, onSave, loading,
}: {
  open: boolean; onClose: () => void; title: string;
  initial?: Entity; onSave: (v: { name: string; type: "personal" | "business"; color: string }) => void; loading: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState<"personal" | "business">(initial?.type ?? "business");
  const [color, setColor] = useState(initial?.color ?? COLORS[0]);

  // Reset on open
  useState(() => {
    setName(initial?.name ?? "");
    setType(initial?.type ?? "business");
    setColor(initial?.color ?? COLORS[0]);
  });

  const handleSave = () => {
    if (!name.trim()) { toast.error("El nombre es obligatorio"); return; }
    onSave({ name: name.trim(), type, color });
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader><SheetTitle>{title}</SheetTitle></SheetHeader>
        <div className="mt-4 space-y-4">
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
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn("h-8 w-8 rounded-full transition", color === c && "ring-2 ring-offset-2 ring-foreground")}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <Button onClick={handleSave} disabled={loading} className="w-full h-12">
            {loading ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Account section ──────────────────────────────────────────────────────────

function AccountSection() {
  const qc = useQueryClient();
  const { data: accounts = [] } = useQuery({ queryKey: ["accounts"], queryFn: listAccounts });
  const { data: entities = [] } = useQuery({ queryKey: ["entities"], queryFn: listEntities });
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);

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
  const deactivateMut = useMutation({
    mutationFn: (id: string) => updateAccount(id, { active: false }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["accounts"] }); toast.success("Cuenta desactivada"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const entityName = (entityId: string | null) => entities.find((e) => e.id === entityId)?.name ?? "Sin entidad";
  const entityColor = (entityId: string | null) => entities.find((e) => e.id === entityId)?.color ?? "#94a3b8";

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Cuentas / Billeteras</h2>
        <Button size="sm" variant="outline" onClick={() => setAdding(true)}>
          <Plus className="h-4 w-4 mr-1" /> Agregar
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {accounts.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">Sin cuentas.</p>
        ) : (
          <ul className="divide-y divide-border">
            {accounts.map((a) => (
              <li key={a.id} className="flex items-center gap-3 px-4 py-3">
                <div className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: entityColor(a.entity_id) }} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{a.name}</p>
                  <p className="text-xs text-muted-foreground">{entityName(a.entity_id)}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setEditing(a)} className="rounded-md p-2 text-muted-foreground hover:bg-muted">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => deactivateMut.mutate(a.id)} className="rounded-md p-2 text-expense hover:bg-expense-soft">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <AccountSheet
        open={adding}
        onClose={() => setAdding(false)}
        title="Nueva cuenta"
        entities={entities}
        onSave={(v) => createMut.mutate(v)}
        loading={createMut.isPending}
      />
      <AccountSheet
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Editar cuenta"
        initial={editing ?? undefined}
        entities={entities}
        onSave={(v) => editing && updateMut.mutate({ id: editing.id, input: v })}
        loading={updateMut.isPending}
      />
    </section>
  );
}

function AccountSheet({
  open, onClose, title, initial, entities, onSave, loading,
}: {
  open: boolean; onClose: () => void; title: string;
  initial?: Account; entities: Entity[];
  onSave: (v: { name: string; type: "personal" | "business"; entity_id: string | null }) => void;
  loading: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState<"personal" | "business">(initial?.type ?? "personal");
  const [entityId, setEntityId] = useState<string>(initial?.entity_id ?? "");

  const handleSave = () => {
    if (!name.trim()) { toast.error("El nombre es obligatorio"); return; }
    onSave({ name: name.trim(), type, entity_id: entityId || null });
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader><SheetTitle>{title}</SheetTitle></SheetHeader>
        <div className="mt-4 space-y-4">
          <div className="space-y-1">
            <Label>Nombre</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Banco Galicia" className="h-12" />
          </div>
          <div className="space-y-1">
            <Label>Entidad</Label>
            <Select value={entityId} onValueChange={setEntityId}>
              <SelectTrigger className="h-12"><SelectValue placeholder="Seleccioná entidad" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sin entidad</SelectItem>
                {entities.map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSave} disabled={loading} className="w-full h-12">
            {loading ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function PerfilPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  return (
    <div className="space-y-6">
      {/* Account info */}
      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Mi cuenta</h2>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
            {user?.email?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.email}</p>
            <p className="text-xs text-muted-foreground">Usuario registrado</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full rounded-xl border border-destructive/30 bg-destructive/5 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
        >
          Cerrar sesión
        </button>
      </div>

      <EntitySection />
      <AccountSection />
    </div>
  );
}
