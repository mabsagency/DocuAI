import { supabase } from "./supabase";

export async function query() {
  throw new Error("Utilisez Supabase (supabase) directement; query SQL non supporté pour l'instant.");
}

export default supabase;
