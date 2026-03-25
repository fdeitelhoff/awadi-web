import { describe, it, expect } from "vitest";
import {
  customerSchema,
  CUSTOMER_EMPTY_FORM,
  makeCustomerSnapshot,
} from "@/lib/schemas/customer";
import type { Kunde } from "@/lib/types/customer";

// Minimal valid input — all string fields empty except one identity anchor
const validInput = {
  kundennr: "K-001",
  ist_kunde: true,
  anrede: "",
  titel: "",
  vorname: "Max",
  nachname: "Mustermann",
  firma: "",
  strasse: "",
  hausnr: "",
  laenderkennung: "",
  plz: "",
  ort: "",
  ortsteil: "",
  telefonnr: "",
  telefonnr_geschaeft: "",
  mobilnr: "",
  mobilnr2: "",
  email: "",
  email_secondary: "",
  homepage: "",
};

describe("customerSchema — valid inputs", () => {
  it("accepts a record with nachname filled", () => {
    expect(customerSchema.safeParse(validInput).success).toBe(true);
  });

  it("accepts a record with firma filled and nachname empty", () => {
    const input = { ...validInput, nachname: "", firma: "Muster GmbH" };
    expect(customerSchema.safeParse(input).success).toBe(true);
  });

  it("accepts both nachname and firma filled", () => {
    const input = { ...validInput, firma: "Muster GmbH" };
    expect(customerSchema.safeParse(input).success).toBe(true);
  });

  it("accepts empty email (optional field)", () => {
    expect(customerSchema.safeParse({ ...validInput, email: "" }).success).toBe(true);
  });

  it("accepts a valid email address", () => {
    expect(customerSchema.safeParse({ ...validInput, email: "max@example.de" }).success).toBe(true);
  });

  it("accepts an empty homepage (optional field)", () => {
    expect(customerSchema.safeParse({ ...validInput, homepage: "" }).success).toBe(true);
  });

  it("accepts a valid https homepage URL", () => {
    expect(customerSchema.safeParse({ ...validInput, homepage: "https://example.de" }).success).toBe(true);
  });

  it("accepts a valid http homepage URL", () => {
    expect(customerSchema.safeParse({ ...validInput, homepage: "http://example.de" }).success).toBe(true);
  });

  it("accepts laenderkennung up to 5 characters", () => {
    expect(customerSchema.safeParse({ ...validInput, laenderkennung: "DE" }).success).toBe(true);
    expect(customerSchema.safeParse({ ...validInput, laenderkennung: "DEABC" }).success).toBe(true);
  });
});

describe("customerSchema — nachname/firma cross-field validation", () => {
  it("rejects when both nachname and firma are empty", () => {
    const input = { ...validInput, nachname: "", firma: "" };
    const result = customerSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("adds an error to the nachname path when both are empty", () => {
    const result = customerSchema.safeParse({ ...validInput, nachname: "", firma: "" });
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === "nachname");
      expect(issue?.message).toBe("Nachname oder Firma ist erforderlich.");
    }
  });

  it("adds an error to the firma path when both are empty", () => {
    const result = customerSchema.safeParse({ ...validInput, nachname: "", firma: "" });
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === "firma");
      expect(issue?.message).toBe("Nachname oder Firma ist erforderlich.");
    }
  });

  it("rejects when both fields contain only whitespace", () => {
    const result = customerSchema.safeParse({ ...validInput, nachname: "  ", firma: "  " });
    expect(result.success).toBe(false);
  });
});

describe("customerSchema — email validation", () => {
  it("rejects an invalid email format", () => {
    const result = customerSchema.safeParse({ ...validInput, email: "not-an-email" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === "email");
      expect(issue?.message).toBe("Bitte eine gültige E-Mail-Adresse eingeben.");
    }
  });

  it("rejects an invalid email_secondary format", () => {
    const result = customerSchema.safeParse({ ...validInput, email_secondary: "bad@" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === "email_secondary");
      expect(issue?.message).toBe("Bitte eine gültige E-Mail-Adresse eingeben.");
    }
  });

  it("rejects email missing the domain part", () => {
    expect(customerSchema.safeParse({ ...validInput, email: "user@" }).success).toBe(false);
  });
});

describe("customerSchema — homepage validation", () => {
  it("rejects a URL without protocol", () => {
    const result = customerSchema.safeParse({ ...validInput, homepage: "example.de" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === "homepage");
      expect(issue?.message).toBe("Bitte eine gültige URL eingeben (z. B. https://example.de).");
    }
  });

  it("rejects a URL with ftp:// protocol", () => {
    expect(customerSchema.safeParse({ ...validInput, homepage: "ftp://example.de" }).success).toBe(false);
  });
});

describe("customerSchema — laenderkennung validation", () => {
  it("rejects laenderkennung longer than 5 characters", () => {
    const result = customerSchema.safeParse({ ...validInput, laenderkennung: "TOOLONG" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === "laenderkennung");
      expect(issue?.message).toBe("Maximal 5 Zeichen.");
    }
  });
});

describe("CUSTOMER_EMPTY_FORM", () => {
  it("is valid according to the schema — empty form is not submittable as-is", () => {
    // Both nachname and firma are empty → the cross-field rule fires
    const result = customerSchema.safeParse(CUSTOMER_EMPTY_FORM);
    expect(result.success).toBe(false);
  });

  it("has ist_kunde defaulting to true", () => {
    expect(CUSTOMER_EMPTY_FORM.ist_kunde).toBe(true);
  });

  it("has all string fields defaulting to empty string", () => {
    const stringFields = Object.entries(CUSTOMER_EMPTY_FORM).filter(
      ([, v]) => typeof v === "string"
    );
    for (const [, value] of stringFields) {
      expect(value).toBe("");
    }
  });
});

describe("makeCustomerSnapshot", () => {
  const kunde: Kunde = {
    id: 7,
    kundennr: "K-007",
    ist_kunde: false,
    anrede: "Herr",
    titel: "Dr.",
    vorname: "James",
    nachname: "Bond",
    strasse: "Geheimweg",
    hausnr: "7",
    laenderkennung: "GB",
    plz: "12345",
    ort: "London",
    email: "james@mi6.gov.uk",
    created_at: "2024-01-01T00:00:00Z",
    // optional fields intentionally omitted to exercise the ?? "" fallback in makeCustomerSnapshot
  };

  it("maps all fields from Kunde to form values", () => {
    const snapshot = makeCustomerSnapshot(kunde);
    expect(snapshot.kundennr).toBe("K-007");
    expect(snapshot.ist_kunde).toBe(false);
    expect(snapshot.nachname).toBe("Bond");
    expect(snapshot.email).toBe("james@mi6.gov.uk");
    expect(snapshot.laenderkennung).toBe("GB");
  });

  it("converts undefined/missing optional fields to empty strings", () => {
    const snapshot = makeCustomerSnapshot(kunde);
    expect(snapshot.firma).toBe("");
    expect(snapshot.ortsteil).toBe("");
    expect(snapshot.homepage).toBe("");
    expect(snapshot.mobilnr).toBe("");
  });

  it("produces a snapshot that passes schema validation", () => {
    expect(customerSchema.safeParse(makeCustomerSnapshot(kunde)).success).toBe(true);
  });

  it("does not include non-form fields (id, created_at, last_update)", () => {
    const snapshot = makeCustomerSnapshot(kunde);
    expect(snapshot).not.toHaveProperty("id");
    expect(snapshot).not.toHaveProperty("created_at");
    expect(snapshot).not.toHaveProperty("last_update");
  });
});
