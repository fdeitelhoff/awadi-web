// Kontakt — maps 1:1 to public.kontakte table (id is auto-generated)
export interface Kontakt {
  id: number;
  firma?: string;
  nachname?: string;
  vorname?: string;
  titel?: string;
  anrede?: string;
  strasse?: string;
  hausnr?: string;
  laenderkennung?: string;
  plz?: string;
  ort?: string;
  ortsteil?: string;
  telefonnr?: string;
  mobilnr?: string;
  email?: string;
  anmerkungen?: string;
  last_update?: string;
  created_at: string;
}

export interface KontaktFormData {
  firma?: string;
  nachname?: string;
  vorname?: string;
  titel?: string;
  anrede?: string;
  strasse?: string;
  hausnr?: string;
  laenderkennung?: string;
  plz?: string;
  ort?: string;
  ortsteil?: string;
  telefonnr?: string;
  mobilnr?: string;
  email?: string;
  anmerkungen?: string;
}
