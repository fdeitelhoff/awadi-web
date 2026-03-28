// components/dashboard/tour-planning-form.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Props {
  onSuccess: (tourId: number) => void;
}

export function TourPlanningForm({ onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [von, setVon] = useState("");
  const [bis, setBis] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !von || !bis) return;
    setLoading(true);
    try {
      const res = await fetch("/api/tours/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), von, bis }),
      });
      const data = await res.json() as { tourId?: number; warnings?: string[]; error?: string };
      if (!res.ok || !data.tourId) {
        toast.error(data.error ?? "Fehler bei der Tourplanung");
        return;
      }
      if (data.warnings && data.warnings.length > 0) {
        toast.warning(`Tour erstellt mit ${data.warnings.length} Hinweis(en)`);
      }
      onSuccess(data.tourId);
    } catch {
      toast.error("Netzwerkfehler");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="tour-name">Name</Label>
        <Input id="tour-name" value={name} onChange={e => setName(e.target.value)}
          placeholder="z.B. KW 14–16 2026" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="tour-von">Von</Label>
          <Input id="tour-von" type="date" value={von} onChange={e => setVon(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tour-bis">Bis</Label>
          <Input id="tour-bis" type="date" value={bis} onChange={e => setBis(e.target.value)} required />
        </div>
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Berechne Route…" : "Tour planen"}
      </Button>
      {loading && (
        <p className="text-xs text-muted-foreground text-center">
          Die Tourenplanung kann bis zu 60 Sekunden dauern.
        </p>
      )}
    </form>
  );
}
