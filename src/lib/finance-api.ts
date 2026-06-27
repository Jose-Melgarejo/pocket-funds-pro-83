import { supabase } from "@/integrations/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type MovementType = "income" | "expense";

export type MovementKind =
  | "ingreso_personal"
  | "gasto_personal"
  | "gasto_negocio"
  | "retiro_negocio"
  | "transferencia"
  | "pago_tarjeta"
  | "ahorro_inversion";

export function kindToType(kind: MovementKind): MovementType {
  return kind === "ingreso_personal" || kind === "retiro_negocio" ? "income" : "expense";
}

export const KIND_LABELS: Record<MovementKind, string> = {
  ingreso_personal:  "Ingreso",
  gasto_personal:    "Gasto",
  gasto_negocio:     "Gasto negocio",
  retiro_negocio:    "Retiro / Sueldo",
  transferencia:     "Transferencia",
  pago_tarjeta:      "Pago tarjeta",
  ahorro_inversion:  "Ahorro / inversión",
};

export const KIND_GROUPS_PERSONAL: { label: string; kinds: MovementKind[] }[] = [
  { label: "Movimientos", kinds: ["ingreso_personal", "gasto_personal", "pago_tarjeta", "ahorro_inversion"] },
];

export const KIND_GROUPS_BUSINESS: { label: string; kinds: MovementKind[] }[] = [
  { label: "Movimientos", kinds: ["ingreso_personal", "gasto_negocio"] },
  { label: "Intercompany", kinds: ["retiro_negocio", "transferencia"] },
];

export interface Entity {
  id: string;
  name: string;
  type: "personal" | "business";
  color: string;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: string;
  name: string;
  type: "personal" | "business";
  entity_id: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  suggested_type: "income" | "expense" | "both";
  active: boolean;
}

export interface Movement {
  id: string;
  date: string;
  description: string | null;
  type: MovementType;
  kind: MovementKind | null;
  category_id: string | null;
  account_id: string | null;
  to_account_id: string | null;
  entity_id: string | null;
  to_entity_id: string | null;
  is_planned: boolean;
  amount: number;
  notes: string | null;
  created_at: string;
}

export interface MovementWithRefs extends Movement {
  category?: Category | null;
  account?: Account | null;
  entity?: Entity | null;
  to_entity?: Entity | null;
}

// ─── Formatters ───────────────────────────────────────────────────────────────

export const fmtMoney = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n || 0);

export const fmtDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
};

export function monthRange(d = new Date()) {
  const y = d.getFullYear();
  const m = d.getMonth();
  const toIso = (x: Date) =>
    `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
  return { from: toIso(new Date(y, m, 1)), to: toIso(new Date(y, m + 1, 0)) };
}

export function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ─── Entities ─────────────────────────────────────────────────────────────────

export async function listEntities(): Promise<Entity[]> {
  const { data, error } = await supabase
    .from("entities")
    .select("*")
    .eq("active", true)
    .order("sort_order");
  if (error) throw error;
  return data as Entity[];
}

export async function createEntity(input: { name: string; type: "personal" | "business"; color: string }) {
  const { error } = await supabase.from("entities").insert(input);
  if (error) throw error;
}

export async function updateEntity(id: string, input: Partial<Pick<Entity, "name" | "type" | "color" | "active" | "sort_order">>) {
  const { error } = await supabase.from("entities").update(input).eq("id", id);
  if (error) throw error;
}

export async function deleteEntity(id: string) {
  const { error } = await supabase.from("entities").delete().eq("id", id);
  if (error) throw error;
}

// ─── Accounts ─────────────────────────────────────────────────────────────────

export async function listAccounts(): Promise<Account[]> {
  const { data, error } = await supabase.from("accounts").select("*").eq("active", true).order("name");
  if (error) throw error;
  return data as Account[];
}

export async function createAccount(input: { name: string; type: "personal" | "business"; entity_id?: string | null }) {
  const { error } = await supabase.from("accounts").insert(input);
  if (error) throw error;
}

export async function updateAccount(id: string, input: Partial<Pick<Account, "name" | "type" | "entity_id" | "active">>) {
  const { error } = await supabase.from("accounts").update(input).eq("id", id);
  if (error) throw error;
}

// ─── Categories ───────────────────────────────────────────────────────────────

export async function listCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from("categories").select("*").order("name");
  if (error) throw error;
  return data as Category[];
}

export async function createCategory(input: { name: string; suggested_type: "income" | "expense" | "both" }) {
  const { error } = await supabase.from("categories").insert(input);
  if (error) throw error;
}

export async function updateCategory(id: string, input: Partial<Pick<Category, "name" | "suggested_type" | "active">>) {
  const { error } = await supabase.from("categories").update(input).eq("id", id);
  if (error) throw error;
}

export async function deleteCategory(id: string) {
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
}

// ─── Movements ────────────────────────────────────────────────────────────────

const MOVEMENT_SELECT = "*, category:categories(*), account:accounts!account_id(*), entity:entities!entity_id(*), to_entity:entities!to_entity_id(*)";

export async function listMovements(filters?: {
  from?: string;
  to?: string;
  entityId?: string | "all";
  type?: MovementType | "all";
  kind?: MovementKind | "all";
  categoryId?: string | "all";
  accountId?: string | "all";
  search?: string;
}): Promise<MovementWithRefs[]> {
  let q = supabase
    .from("movements")
    .select(MOVEMENT_SELECT)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters?.from) q = q.gte("date", filters.from);
  if (filters?.to) q = q.lte("date", filters.to);
  if (filters?.entityId && filters.entityId !== "all") {
    // Show movements that belong to this entity OR are intercompany TO this entity
    q = q.or(`entity_id.eq.${filters.entityId},to_entity_id.eq.${filters.entityId}`);
  }
  if (filters?.type && filters.type !== "all") q = q.eq("type", filters.type);
  if (filters?.kind && filters.kind !== "all") q = q.eq("kind", filters.kind);
  if (filters?.categoryId && filters.categoryId !== "all") q = q.eq("category_id", filters.categoryId);
  if (filters?.accountId && filters.accountId !== "all") q = q.eq("account_id", filters.accountId);
  if (filters?.search) q = q.ilike("description", `%${filters.search}%`);

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as MovementWithRefs[];
}

/** For a given movement, compute the amount sign relative to an entity.
 *  - If entity_id matches → normal (positive income, negative expense)
 *  - If to_entity_id matches → it's an incoming transfer (positive)
 */
export function amountForEntity(m: MovementWithRefs, entityId: string): number {
  if (m.to_entity_id === entityId && m.entity_id !== entityId) {
    // intercompany arriving here → always positive
    return m.amount;
  }
  if (m.entity_id === entityId && m.to_entity_id) {
    // intercompany sent from here → always negative
    return -m.amount;
  }
  return m.type === "income" ? m.amount : -m.amount;
}

export async function createMovement(input: {
  date: string;
  description?: string | null;
  type: MovementType;
  kind?: MovementKind | null;
  category_id: string;
  account_id?: string | null;
  entity_id?: string | null;
  to_entity_id?: string | null;
  is_planned?: boolean;
  amount: number;
  notes?: string | null;
}) {
  const { error } = await supabase.from("movements").insert(input);
  if (error) throw error;
}

export async function updateMovement(id: string, input: Partial<Omit<Movement, "id" | "created_at">>) {
  const { error } = await supabase.from("movements").update(input).eq("id", id);
  if (error) throw error;
}

export async function deleteMovement(id: string) {
  const { error } = await supabase.from("movements").delete().eq("id", id);
  if (error) throw error;
}

// ─── Dashboard stats per entity ───────────────────────────────────────────────

export interface EntityStats {
  ingresos: number;
  gastos: number;
  balance: number;
  transferencias_enviadas: number;
  transferencias_recibidas: number;
}

export function computeStats(movs: MovementWithRefs[], entityId: string): EntityStats {
  let ingresos = 0;
  let gastos = 0;
  let enviadas = 0;
  let recibidas = 0;

  for (const m of movs) {
    const isOrigin = m.entity_id === entityId;
    const isDest   = m.to_entity_id === entityId;
    const isInter  = !!m.to_entity_id;

    if (isOrigin && isInter) {
      // Intercompany sent from this entity
      enviadas += m.amount;
      gastos   += m.amount;
    } else if (isDest && !isOrigin) {
      // Intercompany received by this entity
      recibidas += m.amount;
      ingresos  += m.amount;
    } else if (isOrigin) {
      if (m.type === "income") ingresos += m.amount;
      else gastos += m.amount;
    }
  }

  return { ingresos, gastos, balance: ingresos - gastos, transferencias_enviadas: enviadas, transferencias_recibidas: recibidas };
}
