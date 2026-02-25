import { createClient } from "@/lib/supabase/server";
import type { Kontakt } from "@/lib/types/kontakt";

export async function getKontaktById(id: number): Promise<Kontakt | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("kontakte")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data as Kontakt;
}
