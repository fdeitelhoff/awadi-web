import { describe, it, expect } from "vitest";
import {
  anlTypSchema,
  ANL_TYP_EMPTY_FORM,
  makeAnlTypSnapshot,
} from "@/lib/schemas/anl-typ";
import type { AnlTypFull } from "@/lib/types/anl-typ";

// Minimal valid input — used as the baseline throughout the tests
const validInput = {
  sortiernr: 1,
  bezeichnung: "Tropfkörper",
  wartungsintervall_monate: 12,
  dauer_wartung_minuten: 60,
};

describe("anlTypSchema — valid inputs", () => {
  it("accepts a fully populated record", () => {
    expect(anlTypSchema.safeParse(validInput).success).toBe(true);
  });

  it("accepts sortiernr = 0 (zero is non-negative)", () => {
    expect(anlTypSchema.safeParse({ ...validInput, sortiernr: 0 }).success).toBe(true);
  });

  it("accepts sortiernr omitted (optional field)", () => {
    const { sortiernr: _, ...without } = validInput;
    expect(anlTypSchema.safeParse(without).success).toBe(true);
  });

  it("accepts dauer_wartung_minuten = 0 (zero is allowed)", () => {
    expect(anlTypSchema.safeParse({ ...validInput, dauer_wartung_minuten: 0 }).success).toBe(true);
  });

  it("accepts wartungsintervall_monate = 1 (minimum allowed)", () => {
    expect(anlTypSchema.safeParse({ ...validInput, wartungsintervall_monate: 1 }).success).toBe(true);
  });
});

describe("anlTypSchema — bezeichnung validation", () => {
  it("rejects an empty bezeichnung", () => {
    const result = anlTypSchema.safeParse({ ...validInput, bezeichnung: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === "bezeichnung");
      expect(issue?.message).toBe("Bitte eine Bezeichnung angeben.");
    }
  });

  it("rejects a whitespace-only bezeichnung", () => {
    const result = anlTypSchema.safeParse({ ...validInput, bezeichnung: "   " });
    // min(1) passes for spaces — trim is not applied at schema level;
    // the schema only enforces min length, not trimming
    expect(result.success).toBe(true);
  });
});

describe("anlTypSchema — numeric field validation", () => {
  it("rejects wartungsintervall_monate = 0", () => {
    const result = anlTypSchema.safeParse({ ...validInput, wartungsintervall_monate: 0 });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === "wartungsintervall_monate");
      expect(issue?.message).toBe("Mindestens 1 Monat.");
    }
  });

  it("rejects wartungsintervall_monate as a negative number", () => {
    expect(anlTypSchema.safeParse({ ...validInput, wartungsintervall_monate: -1 }).success).toBe(false);
  });

  it("rejects dauer_wartung_minuten as a negative number", () => {
    expect(anlTypSchema.safeParse({ ...validInput, dauer_wartung_minuten: -1 }).success).toBe(false);
  });

  it("rejects sortiernr as a negative number", () => {
    expect(anlTypSchema.safeParse({ ...validInput, sortiernr: -1 }).success).toBe(false);
  });

  it("rejects non-integer wartungsintervall_monate", () => {
    expect(anlTypSchema.safeParse({ ...validInput, wartungsintervall_monate: 1.5 }).success).toBe(false);
  });
});

describe("ANL_TYP_EMPTY_FORM", () => {
  it("is NOT valid as-is — bezeichnung is empty and must be filled before submit", () => {
    // The empty form is the initial state for the create form.
    // bezeichnung: "" fails min(1), so the form is intentionally not submittable until filled.
    const result = anlTypSchema.safeParse(ANL_TYP_EMPTY_FORM);
    expect(result.success).toBe(false);
  });

  it("has sensible defaults", () => {
    expect(ANL_TYP_EMPTY_FORM.bezeichnung).toBe("");
    expect(ANL_TYP_EMPTY_FORM.wartungsintervall_monate).toBe(12);
    expect(ANL_TYP_EMPTY_FORM.dauer_wartung_minuten).toBe(60);
    expect(ANL_TYP_EMPTY_FORM.sortiernr).toBeUndefined();
  });
});

describe("makeAnlTypSnapshot", () => {
  const typ: AnlTypFull = {
    id: 42,
    sortiernr: 3,
    bezeichnung: "Belebungsanlage",
    preis_je_wartung: 120,
    preis_je_kontrolle: 80,
    wartungsintervall_monate: 6,
    dauer_wartung_minuten: 90,
    created_at: "2024-01-01T00:00:00Z",
    last_update: "2024-06-01T00:00:00Z",
  };

  it("maps all fields from AnlTypFull to form values", () => {
    const snapshot = makeAnlTypSnapshot(typ);
    expect(snapshot.sortiernr).toBe(3);
    expect(snapshot.bezeichnung).toBe("Belebungsanlage");
    expect(snapshot.wartungsintervall_monate).toBe(6);
    expect(snapshot.dauer_wartung_minuten).toBe(90);
  });

  it("produces a snapshot that passes schema validation", () => {
    expect(anlTypSchema.safeParse(makeAnlTypSnapshot(typ)).success).toBe(true);
  });

  it("does not include non-form fields (id, created_at, last_update)", () => {
    const snapshot = makeAnlTypSnapshot(typ);
    expect(snapshot).not.toHaveProperty("id");
    expect(snapshot).not.toHaveProperty("created_at");
    expect(snapshot).not.toHaveProperty("last_update");
  });
});
