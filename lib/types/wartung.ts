export type KundenStatus = "ausstehend" | "email_versendet" | "bestaetigt" | "abgelehnt";

export interface WartungsKalenderEintrag {
  id: number;          // wartungsvertrag.id
  anlage_id: number;
  anlage_name?: string; // anlagen_nr
  anlage_adresse?: string;
  datum: string;        // datum_naechste_wartung (YYYY-MM-DD)
  techniker_id?: string;
  dauer_minuten?: number;
}

export interface KalenderTechniker {
  id: string;
  name: string;
  farbe: string;
  kuerzel: string;
}
