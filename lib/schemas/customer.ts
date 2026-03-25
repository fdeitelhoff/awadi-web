// zod/v3 is a sub-path export of the installed Zod v4 package — not a separate install.
// It exposes the v3-compatible API surface, which avoids a TypeScript type-level mismatch
// between @hookform/resolvers (compiled against Zod v4.0.x) and Zod v4.3.x.
import { z } from "zod/v3";
import type { Kunde } from "@/lib/types/customer";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const urlRegex = /^https?:\/\/.+\..+/;

export const customerSchema = z
  .object({
    kundennr:             z.string(),
    ist_kunde:            z.boolean(),
    anrede:               z.string(),
    titel:                z.string(),
    vorname:              z.string(),
    nachname:             z.string(),
    firma:                z.string(),
    strasse:              z.string(),
    hausnr:               z.string(),
    laenderkennung:       z.string().max(5, "Maximal 5 Zeichen."),
    plz:                  z.string(),
    ort:                  z.string(),
    ortsteil:             z.string(),
    telefonnr:            z.string(),
    telefonnr_geschaeft:  z.string(),
    mobilnr:              z.string(),
    mobilnr2:             z.string(),
    email: z.string().refine(
      (v) => !v || emailRegex.test(v),
      { message: "Bitte eine gültige E-Mail-Adresse eingeben." },
    ),
    email_secondary: z.string().refine(
      (v) => !v || emailRegex.test(v),
      { message: "Bitte eine gültige E-Mail-Adresse eingeben." },
    ),
    homepage: z.string().refine(
      (v) => !v || urlRegex.test(v),
      { message: "Bitte eine gültige URL eingeben (z. B. https://example.de)." },
    ),
  })
  .superRefine((data, ctx) => {
    if (!data.nachname.trim() && !data.firma.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Nachname oder Firma ist erforderlich.",
        path: ["nachname"],
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Nachname oder Firma ist erforderlich.",
        path: ["firma"],
      });
    }
  });

export type CustomerFormValues = z.infer<typeof customerSchema>;

export const CUSTOMER_EMPTY_FORM: CustomerFormValues = {
  kundennr:            "",
  ist_kunde:           true,
  anrede:              "",
  titel:               "",
  vorname:             "",
  nachname:            "",
  firma:               "",
  strasse:             "",
  hausnr:              "",
  laenderkennung:      "",
  plz:                 "",
  ort:                 "",
  ortsteil:            "",
  telefonnr:           "",
  telefonnr_geschaeft: "",
  mobilnr:             "",
  mobilnr2:            "",
  email:               "",
  email_secondary:     "",
  homepage:            "",
};

export function makeCustomerSnapshot(kunde: Kunde): CustomerFormValues {
  return {
    kundennr:            kunde.kundennr            ?? "",
    ist_kunde:           kunde.ist_kunde           ?? false,
    anrede:              kunde.anrede              ?? "",
    titel:               kunde.titel               ?? "",
    vorname:             kunde.vorname             ?? "",
    nachname:            kunde.nachname            ?? "",
    firma:               kunde.firma               ?? "",
    strasse:             kunde.strasse             ?? "",
    hausnr:              kunde.hausnr              ?? "",
    laenderkennung:      kunde.laenderkennung      ?? "",
    plz:                 kunde.plz                 ?? "",
    ort:                 kunde.ort                 ?? "",
    ortsteil:            kunde.ortsteil            ?? "",
    telefonnr:           kunde.telefonnr           ?? "",
    telefonnr_geschaeft: kunde.telefonnr_geschaeft ?? "",
    mobilnr:             kunde.mobilnr             ?? "",
    mobilnr2:            kunde.mobilnr2            ?? "",
    email:               kunde.email               ?? "",
    email_secondary:     kunde.email_secondary     ?? "",
    homepage:            kunde.homepage            ?? "",
  };
}
