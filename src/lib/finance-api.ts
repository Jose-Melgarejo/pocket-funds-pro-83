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

/** Maps a kind to its income/expense bucket for balance calculations */
export function kindToType(kind: MovementKind): MovementType {
  return kind === "ingreso_personal" || kind === "retiro_negocio" ? "income" : "expense";
}

export const KIND_LABELS: Record<MovementKind, string> = {
  ingreso_personal:  "Ingreso personal",
  gasto_personal:    "Gasto personal",
  gasto_negocio:     "Gasto negocio",
  retiro_negocio:    "Retiro negocio",
  transferencia:     "Transferencia",
  pago_tarjeta:      "Pago tarjeta",
  ahorro_inversion:  "Ahorro / inversión",
};

export interface Account {
  id: string;
  name: string;
  type: "personal" | "business";
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
  is_planned: boolean;
  amount: number;
  notes: string | null;
  created_at: string;
}

export interface MovementWithCategory extends Movement {
  category?: Category | null;
  account?: Account | null;
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

// ─── Accounts ─────────────────────────────────────────────────────────────────

export async function listAccounts(): Promise<Account[]> {
  const { data, error } = await supabase.from("accounts").select("*").eq("active", true).order("name");
  if (error) throw error;
  return data as Account[];
}

export async function createAccount(input: { name: string; type: "personal" | "business" }) {
  const { error } = await supabase.from("accounts").insert(input);
  if (error) throw error;
}

export async function updateAccount(id: string, input: Partial<Pick<Account, "name" | "type" | "active">>) {
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

export async function listMovements(filters?: {
  from?: string;
  to?: string;
  type?: MovementType | "all";
  kind?: MovementKind | "all";
  categoryId?: string | "all";
  accountId?: string | "all";
  search?: string;
}): Promise<MovementWithCategory[]> {
  let q = supabase
    .from("movements")
    .select("*, category:categories(*), account:accounts!account_id(*)")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters?.from) q = q.gte("date", filters.from);
  if (filters?.to) q = q.lte("date", filters.to);
  if (filters?.type && filters.type !== "all") q = q.eq("type", filters.type);
  if (filters?.kind && filters.kind !== "all") q = q.eq("kind", filters.kind);
  if (filters?.categoryId && filters.categoryId !== "all") q = q.eq("category_id", filters.categoryId);
  if (filters?.accountId && filters.accountId !== "all") q = q.eq("account_id", filters.accountId);
  if (filters?.search) q = q.ilike("description", `%${filters.search}%`);

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as MovementWithCategory[];
}

export async function createMovement(input: {
  date: string;
  description?: string | null;
  type: MovementType;
  kind?: MovementKind | null;
  category_id: string;
  account_id?: string | null;
  to_account_id?: string | null;
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
