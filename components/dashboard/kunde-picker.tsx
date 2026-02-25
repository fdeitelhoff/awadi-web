"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { fetchCustomers } from "@/lib/actions/customers";
import type { Kunde } from "@/lib/types/customer";
import { Search, User, X } from "lucide-react";

export interface SelectedKunde {
  id: number;
  name: string;
  address: string;
}

export function formatKundeForPicker(k: {
  id: number;
  firma?: string;
  vorname?: string;
  nachname?: string;
  kundennr?: string;
  strasse?: string;
  hausnr?: string;
  plz?: string;
  ort?: string;
}): SelectedKunde {
  const name =
    k.firma ||
    [k.vorname, k.nachname].filter(Boolean).join(" ") ||
    `Kunde #${k.id}`;
  const street = [k.strasse, k.hausnr].filter(Boolean).join(" ");
  const city = [k.plz, k.ort].filter(Boolean).join(" ");
  const address = [street, city].filter(Boolean).join(", ");
  return { id: k.id, name, address };
}

interface KundePickerProps {
  value: number | null;
  onChange: (id: number | null) => void;
  initial?: SelectedKunde;
}

export function KundePicker({ value, onChange, initial }: KundePickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Kunde[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selected, setSelected] = useState<SelectedKunde | null>(
    initial ?? null
  );

  // Fetch results whenever the dialog is open or search changes
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setIsSearching(true);

    const delay = search.trim() ? 300 : 0;
    const timer = setTimeout(() => {
      fetchCustomers({
        search: search.trim(),
        pageSize: 15,
        sortField: "nachname",
        sortDirection: "asc",
      }).then((r) => {
        if (!cancelled) {
          setResults(r.data);
          setIsSearching(false);
        }
      });
    }, delay);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search, open]);

  const handleSelect = (kunde: Kunde) => {
    const sel = formatKundeForPicker(kunde);
    setSelected(sel);
    onChange(kunde.id);
    setOpen(false);
    setSearch("");
  };

  const handleClear = () => {
    setSelected(null);
    onChange(null);
  };

  const handleOpenChange = (o: boolean) => {
    setOpen(o);
    if (!o) setSearch("");
  };

  return (
    <>
      {selected ? (
        <div className="flex items-start gap-2 rounded-md border bg-muted/30 px-3 py-2.5">
          <User className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium leading-snug">{selected.name}</p>
            {selected.address && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {selected.address}
              </p>
            )}
          </div>
          <div className="flex gap-1 shrink-0 ml-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setOpen(true)}
            >
              Ändern
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              onClick={handleClear}
              aria-label="Eigentümer entfernen"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start text-muted-foreground font-normal h-10"
          onClick={() => setOpen(true)}
        >
          <Search className="h-4 w-4 mr-2 shrink-0" />
          Kunde suchen…
        </Button>
      )}

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-lg p-0" aria-describedby={undefined}>
          <DialogHeader className="px-4 pt-4 pb-2">
            <DialogTitle>Eigentümer auswählen</DialogTitle>
          </DialogHeader>

          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Name, Firma oder E-Mail suchen…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
                autoFocus
              />
            </div>
          </div>

          <div className="overflow-y-auto max-h-[360px] border-t">
            {isSearching ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Suche läuft…
              </p>
            ) : results.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Keine Kunden gefunden.
              </p>
            ) : (
              <ul>
                {results.map((k) => {
                  const fmt = formatKundeForPicker(k);
                  const isActive = k.id === value;
                  return (
                    <li key={k.id}>
                      <button
                        type="button"
                        className={`w-full text-left px-4 py-2.5 hover:bg-accent transition-colors ${
                          isActive ? "bg-accent" : ""
                        }`}
                        onClick={() => handleSelect(k)}
                      >
                        <p className="text-sm font-medium truncate">
                          {fmt.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {k.kundennr && (
                            <span className="font-mono mr-2">{k.kundennr}</span>
                          )}
                          {k.email && (
                            <span className="mr-2">{k.email}</span>
                          )}
                          {fmt.address}
                        </p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
