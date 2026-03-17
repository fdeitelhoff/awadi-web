import { createClient } from "@/lib/supabase/server";
import type {
  TicketListItem,
  TicketQueryParams,
  TicketQueryResult,
} from "@/lib/types/ticket";

function mapRowToTicket(row: Record<string, unknown>): TicketListItem {
  return {
    id: row.id as number,
    ticket_nr: row.ticket_nr as string | undefined,
    titel: row.titel as string,
    beschreibung: row.beschreibung as string | undefined,
    status: row.status as TicketListItem["status"],
    prioritaet: row.prioritaet as TicketListItem["prioritaet"],
    kunden_id: row.kunden_id as number | undefined,
    anlage_id: row.anlage_id as number | undefined,
    anlage_name: row.anlage_name as string | undefined,
    vorname: row.vorname as string | undefined,
    nachname: row.nachname as string | undefined,
    email: row.email as string | undefined,
    telefonnr: row.telefonnr as string | undefined,
    strasse: row.strasse as string | undefined,
    hausnr: row.hausnr as string | undefined,
    plz: row.plz as string | undefined,
    ort: row.ort as string | undefined,
    user_id: row.user_id as string | undefined,
    user_name: row.user_name as string | undefined,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string | undefined,
    kunden_name: row.kunden_name as string | undefined,
    anlagen_nr: row.anlagen_nr as string | undefined,
  };
}

export async function getTickets(
  params: TicketQueryParams = {}
): Promise<TicketQueryResult> {
  const {
    search,
    filterStatus = "all",
    filterPriorität = "all",
    sortField = "created_at",
    sortDirection = "desc",
    page = 1,
    pageSize = 14,
  } = params;

  const supabase = await createClient();
  let query = supabase
    .from("tickets_details")
    .select("*", { count: "exact" });

  if (search?.trim()) {
    const pattern = `%${search.trim()}%`;
    query = query.or(
      [
        `ticket_nr.ilike.${pattern}`,
        `titel.ilike.${pattern}`,
        `nachname.ilike.${pattern}`,
        `vorname.ilike.${pattern}`,
        `email.ilike.${pattern}`,
        `kunden_name.ilike.${pattern}`,
        `anlagen_nr.ilike.${pattern}`,
        `anlage_name.ilike.${pattern}`,
      ].join(",")
    );
  }

  if (filterStatus !== "all") {
    query = query.eq("status", filterStatus);
  }

  if (filterPriorität !== "all") {
    query = query.eq("prioritaet", filterPriorität);
  }

  query = query.order(sortField, { ascending: sortDirection === "asc" });

  const offset = (page - 1) * pageSize;
  query = query.range(offset, offset + pageSize - 1);

  const { data, count, error } = await query;
  if (error) {
    console.error("Error fetching tickets:", error);
    return { data: [], totalCount: 0 };
  }

  return {
    data: (data ?? []).map(mapRowToTicket),
    totalCount: count ?? 0,
  };
}

export async function getTicketById(id: number): Promise<TicketListItem | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tickets_details")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return mapRowToTicket(data);
}

export async function getTicketCount(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("tickets")
    .select("*", { count: "exact", head: true });
  return count ?? 0;
}
