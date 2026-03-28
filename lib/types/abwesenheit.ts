export const ABWESENHEIT_TYPEN = [
  "Urlaub",
  "Krankheit",
  "Fortbildung",
  "Sonstiges",
] as const;

export type AbwesenheitTyp = (typeof ABWESENHEIT_TYPEN)[number];

export interface Abwesenheit {
  id: number;
  user_id: string;
  typ: string;
  von: string; // ISO date string, e.g. "2026-03-15"
  bis: string; // ISO date string
  bemerkung?: string;
  created_at: string;
}
