export type TicketStatus = "offen" | "eingeplant" | "gelöst" | "geschlossen";
export type TicketPriorität = "normal" | "hoch" | "dringend";
export type TicketSortField = "ticket_nr" | "titel" | "status" | "prioritaet" | "created_at";
export type SortDirection = "asc" | "desc";

export interface Ticket {
  id: number;
  ticket_nr?: string;  // nullable in DB (AFTER INSERT trigger sets it); display as ticket_nr ?? "—"
  titel: string;
  beschreibung?: string;
  status: TicketStatus;
  prioritaet: TicketPriorität;
  kunden_id?: number;
  anlage_id?: number;
  anlage_name?: string;
  vorname?: string;
  nachname?: string;
  email?: string;
  telefonnr?: string;
  strasse?: string;
  hausnr?: string;
  plz?: string;
  ort?: string;
  user_id?: string;
  user_name?: string;
  created_at: string;
  updated_at?: string;
}

// Extended with joined display fields from tickets_details view
export interface TicketListItem extends Ticket {
  kunden_name?: string;  // from kunden join (firma or nachname+vorname)
  anlagen_nr?: string;   // from anlagen join
}

export interface TicketQueryParams {
  search?: string;
  filterStatus?: TicketStatus | "all";
  filterPriorität?: TicketPriorität | "all";
  sortField?: TicketSortField;
  sortDirection?: SortDirection;
  page?: number;
  pageSize?: number;
}

export interface TicketQueryResult {
  data: TicketListItem[];
  totalCount: number;
}
