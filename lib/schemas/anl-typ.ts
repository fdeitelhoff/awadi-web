// zod/v3 is a sub-path export of the installed Zod v4 package — not a separate install.
// It exposes the v3-compatible API surface, which avoids a TypeScript type-level mismatch
// between @hookform/resolvers (compiled against Zod v4.0.x) and Zod v4.3.x.
import { z } from "zod/v3";
import type { AnlTypFull } from "@/lib/types/anl-typ";

export const anlTypSchema = z.object({
  sortiernr:                z.number().int().nonnegative().optional(),
  bezeichnung:              z.string().min(1, "Bitte eine Bezeichnung angeben."),
  wartungsintervall_monate: z.number().int().min(1, "Mindestens 1 Monat."),
  dauer_wartung_minuten:    z.number().int().nonnegative(),
});

export type AnlTypFormValues = z.infer<typeof anlTypSchema>;

export const ANL_TYP_EMPTY_FORM: AnlTypFormValues = {
  sortiernr:                undefined,
  bezeichnung:              "",
  wartungsintervall_monate: 12,
  dauer_wartung_minuten:    60,
};

export function makeAnlTypSnapshot(typ: AnlTypFull): AnlTypFormValues {
  return {
    sortiernr:                typ.sortiernr,
    bezeichnung:              typ.bezeichnung,
    wartungsintervall_monate: typ.wartungsintervall_monate,
    dauer_wartung_minuten:    typ.dauer_wartung_minuten,
  };
}
