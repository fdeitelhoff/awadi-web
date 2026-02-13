// Customer/Owner (Eigentümer) - based on Tblanl_eigentuemer
export interface Customer {
  anlId: number;
  firma?: string;
  nachname: string;
  vorname: string;
  titel?: string;
  anrede?: string;
  strasse?: string;
  hausNr?: string;
  plz?: string;
  ort?: string;
  ortsteil?: string;
  eigentuemerNr?: string;
  telefonNr?: string;
  telefonNrGesch?: string;
  mobilNr?: string;
  email?: string;
  anmerkungen?: string;
}
