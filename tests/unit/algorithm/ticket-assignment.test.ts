import { describe, it, expect } from "vitest";
import { resolveTicketTechnician, PRIORITY_ORDER, sortTicketsByPriority } from "@/lib/algorithm/ticket-assignment";
import type { Ticket } from "@/lib/types/ticket";

const baseTicket: Ticket = {
  id: 1,
  titel: "Pumpe defekt",
  status: "offen",
  prioritaet: "normal",
  created_at: "2026-01-01T00:00:00Z",
};

describe("PRIORITY_ORDER", () => {
  it("dringend sorts before hoch before normal", () => {
    const priorities = ["normal", "hoch", "dringend"] as const;
    const sorted = [...priorities].sort((a, b) => PRIORITY_ORDER[a] - PRIORITY_ORDER[b]);
    expect(sorted).toEqual(["dringend", "hoch", "normal"]);
  });
});

describe("resolveTicketTechnician", () => {
  it("uses ticket.techniker_id when set", () => {
    const ticket = { ...baseTicket, techniker_id: "tech-explicit" };
    const result = resolveTicketTechnician(ticket, {}, []);
    expect(result).toBe("tech-explicit");
  });

  it("falls back to anlage techniker_id when ticket has no techniker_id", () => {
    const ticket = { ...baseTicket, anlage_id: 10 };
    const anlageMap = { 10: "tech-from-anlage" };
    const result = resolveTicketTechnician(ticket, anlageMap, []);
    expect(result).toBe("tech-from-anlage");
  });

  it("returns first available technician when no explicit assignment", () => {
    const ticket = { ...baseTicket };
    const result = resolveTicketTechnician(ticket, {}, ["tech-geo"]);
    expect(result).toBe("tech-geo");
  });

  it("returns null when no technician can be resolved", () => {
    const result = resolveTicketTechnician(baseTicket, {}, []);
    expect(result).toBeNull();
  });

  it("ticket.techniker_id takes precedence over anlage map entry", () => {
    const ticket = { ...baseTicket, anlage_id: 10, techniker_id: "tech-explicit" };
    const anlageMap = { 10: "tech-from-anlage" };
    const result = resolveTicketTechnician(ticket, anlageMap, ["tech-fallback"]);
    expect(result).toBe("tech-explicit");
  });
});

describe("sortTicketsByPriority", () => {
  it("sorts dringend before hoch before normal", () => {
    const tickets: Ticket[] = [
      { ...baseTicket, id: 1, prioritaet: "normal" },
      { ...baseTicket, id: 2, prioritaet: "dringend" },
      { ...baseTicket, id: 3, prioritaet: "hoch" },
    ];
    const sorted = sortTicketsByPriority(tickets);
    expect(sorted.map(t => t.prioritaet)).toEqual(["dringend", "hoch", "normal"]);
  });

  it("breaks priority ties by created_at (oldest first)", () => {
    const tickets: Ticket[] = [
      { ...baseTicket, id: 1, prioritaet: "normal", created_at: "2026-01-03T00:00:00Z" },
      { ...baseTicket, id: 2, prioritaet: "normal", created_at: "2026-01-01T00:00:00Z" },
      { ...baseTicket, id: 3, prioritaet: "normal", created_at: "2026-01-02T00:00:00Z" },
    ];
    const sorted = sortTicketsByPriority(tickets);
    expect(sorted.map(t => t.id)).toEqual([2, 3, 1]);
  });

  it("does not mutate original array", () => {
    const tickets: Ticket[] = [
      { ...baseTicket, id: 1, prioritaet: "normal" },
      { ...baseTicket, id: 2, prioritaet: "dringend" },
    ];
    const original = [...tickets];
    sortTicketsByPriority(tickets);
    expect(tickets).toEqual(original);
  });
});
