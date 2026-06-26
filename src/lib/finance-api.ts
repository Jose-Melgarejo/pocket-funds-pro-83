import { supabase } from "@/integrations/supabase/client";

export type MovementType = "income" | "expense";

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
  category_id: string | null;
  amount: number;
  notes: string | null;
  created_at: string;
}

export interface MovementWithCategory extends Movement {
  category?: Category | null;
}

export const fmtMoney = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n || 0);

export const fmtDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
};

export async function listCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name");
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

export async function listMovements(filters?: {
  from?: string;
  to?: string;
  type?: MovementType | "all";
  categoryId?: string | "all";
  search?: string;
}): Promise<MovementWithCategory[]> {
  let q = supabase
    .from("movements")
    .select("*, category:categories(*)")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters?.from) q = q.gte("date", filters.from);
  if (filters?.to) q = q.lte("date", filters.to);
  if (filters?.type && filters.type !== "all") q = q.eq("type", filters.type);
  if (filters?.categoryId && filters.categoryId !== "all") q = q.eq("category_id", filters.categoryId);
  if (filters?.search) q = q.ilike("description", `%${filters.search}%`);

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as MovementWithCategory[];
}

export async function createMovement(input: {
  date: string;
  description?: string;
  type: MovementType;
  category_id: string;
  amount: number;
  notes?: string;
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

export function monthRange(d = new Date()) {
  const y = d.getFullYear();
  const m = d.getMonth();
  const first = new Date(y, m, 1);
  const last = new Date(y, m + 1, 0);
  const toIso = (x: Date) =>
    `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
  return { from: toIso(first), to: toIso(last) };
}

export function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
