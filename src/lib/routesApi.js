import { supabase } from "./supabaseClient";

export async function getUserRoutes(userId) {
  const { data, error } = await supabase
    .from("user_routes")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getRoute(id) {
  const { data, error } = await supabase
    .from("user_routes")
    .select("*")
    .eq("id", id)
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return data ?? null;
}

export async function createRoute(userId, routeData) {
  const { data, error } = await supabase
    .from("user_routes")
    .insert({ user_id: userId, ...routeData })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateRoute(id, updates) {
  const { data, error } = await supabase
    .from("user_routes")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteRoute(id) {
  const { error } = await supabase.from("user_routes").delete().eq("id", id);
  if (error) throw error;
}
