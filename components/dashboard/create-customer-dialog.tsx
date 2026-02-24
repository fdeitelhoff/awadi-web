"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createKunde,
  type CreateKundeInput,
} from "@/lib/actions/customers";
import { Loader2 } from "lucide-react";

interface CreateCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

const EMPTY_FORM: CreateKundeInput = {
  kundennr: "",
  anrede: "",
  titel: "",
  vorname: "",
  nachname: "",
  firma: "",
  strasse: "",
  hausnr: "",
  plz: "",
  ort: "",
  telefonnr: "",
  email: "",
};

export function CreateCustomerDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateCustomerDialogProps) {
  const [form, setForm] = useState<CreateKundeInput>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (field: keyof CreateKundeInput, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleOpenChange = (nextOpen: boolean) => {
    if (!isSubmitting) {
      if (!nextOpen) {
        setForm(EMPTY_FORM);
        setError(null);
      }
      onOpenChange(nextOpen);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nachname?.trim() && !form.firma?.trim()) {
      setError("Bitte Nachname oder Firma angeben.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await createKunde(form);

    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error ?? "Unbekannter Fehler.");
      return;
    }

    setForm(EMPTY_FORM);
    onCreated();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Neuer Kunde</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="max-h-[65vh] overflow-y-auto pr-1 space-y-6 py-2">

            {/* Kunden-Nr */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="kundennr">Kunden-Nr.</Label>
                <Input
                  id="kundennr"
                  value={form.kundennr}
                  onChange={(e) => set("kundennr", e.target.value)}
                  placeholder="z. B. AS-001"
                />
              </div>
            </div>

            {/* Anrede / Titel */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="anrede">Anrede</Label>
                <Select
                  value={form.anrede}
                  onValueChange={(v) => set("anrede", v)}
                >
                  <SelectTrigger id="anrede">
                    <SelectValue placeholder="Auswählen…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Herr">Herr</SelectItem>
                    <SelectItem value="Frau">Frau</SelectItem>
                    <SelectItem value="Divers">Divers</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="titel">Titel</Label>
                <Input
                  id="titel"
                  value={form.titel}
                  onChange={(e) => set("titel", e.target.value)}
                  placeholder="z. B. Dr."
                />
              </div>
            </div>

            {/* Vorname / Nachname */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="vorname">Vorname</Label>
                <Input
                  id="vorname"
                  value={form.vorname}
                  onChange={(e) => set("vorname", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nachname">
                  Nachname <span className="text-muted-foreground text-xs">(oder Firma)</span>
                </Label>
                <Input
                  id="nachname"
                  value={form.nachname}
                  onChange={(e) => set("nachname", e.target.value)}
                />
              </div>
            </div>

            {/* Firma */}
            <div className="space-y-1.5">
              <Label htmlFor="firma">Firma</Label>
              <Input
                id="firma"
                value={form.firma}
                onChange={(e) => set("firma", e.target.value)}
              />
            </div>

            {/* Adresse */}
            <div className="grid grid-cols-[1fr_120px] gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="strasse">Straße</Label>
                <Input
                  id="strasse"
                  value={form.strasse}
                  onChange={(e) => set("strasse", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="hausnr">Nr.</Label>
                <Input
                  id="hausnr"
                  value={form.hausnr}
                  onChange={(e) => set("hausnr", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-[120px_1fr] gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="plz">PLZ</Label>
                <Input
                  id="plz"
                  value={form.plz}
                  onChange={(e) => set("plz", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ort">Ort</Label>
                <Input
                  id="ort"
                  value={form.ort}
                  onChange={(e) => set("ort", e.target.value)}
                />
              </div>
            </div>

            {/* Kontakt */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="telefonnr">Telefon</Label>
                <Input
                  id="telefonnr"
                  type="tel"
                  value={form.telefonnr}
                  onChange={(e) => set("telefonnr", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">E-Mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                />
              </div>
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive mt-3">{error}</p>
          )}

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Kunde anlegen
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
