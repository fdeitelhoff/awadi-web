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
  von: string; // ISO datetime string, e.g. "2026-03-15T08:00:00Z"
  bis: string; // ISO datetime string, e.g. "2026-03-15T12:00:00Z"
  bemerkung?: string;
  created_at: string;
}
