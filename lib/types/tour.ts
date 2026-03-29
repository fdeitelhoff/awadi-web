import type { KundenStatus } from "@/lib/types/wartung";

export type TourStatus = "entwurf" | "veröffentlicht";
export type TourItemType = "wartung" | "ticket";

export interface Tour {
  id: number;
  name: string;
  von: string;         // ISO date
  bis: string;         // ISO date
  status: TourStatus;
  created_by: string;  // uuid
  partial: boolean;
  created_at: string;
  updated_at?: string;
  // joined display fields
  created_by_name?: string;
  techniker_count?: number;
  stop_count?: number;
}

export interface TourEintrag {
  id: number;
  tour_id: number;
  techniker_id: string;
  datum: string;           // ISO date
  position: number;
  item_type: TourItemType;
  anlage_id?: number;
  ticket_id?: number;
  geplante_startzeit?: string; // "HH:MM:SS"
  fahrtzeit_minuten?: number;
  dauer_minuten?: number;
  original_techniker_id?: string;
  notizen?: string;
  kunden_status: KundenStatus;
  created_at: string;
  // joined display fields
  techniker_name?: string;
  anlage_name?: string;
  anlage_adresse?: string;
  anlage_lat?: number;
  anlage_lng?: number;
  ticket_titel?: string;
  kontakt_name?: string;
  kontakt_email?: string;
}

export interface TourQueryResult {
  data: Tour[];
  totalCount: number;
}

export interface TourDraftResult {
  tourId: number;
  warnings: string[];
  partial: boolean;
}
