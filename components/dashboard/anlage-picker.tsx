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
import {
  fetchAnlagenForPicker,
  type AnlagePickerResult,
} from "@/lib/actions/anlagen";
import { Search, Building2, X } from "lucide-react";

export interface SelectedAnlage {
  id: number;
  label: string;    // anlagen_nr (primary display)
  sublabel?: string; // anl_typ_bezeichnung + ort (secondary)
}

interface AnlagePickerProps {
  value: number | null;
  onChange: (id: number | null, details: AnlagePickerResult | null) => void;
  initial?: SelectedAnlage;
}

export function AnlagePicker({ value, onChange, initial }: AnlagePickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<AnlagePickerResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selected, setSelected] = useState<SelectedAnlage | null>(
    initial ?? null
  );

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setIsSearching(true);

    const delay = search.trim() ? 300 : 0;
    const timer = setTimeout(() => {
      fetchAnlagenForPicker(search.trim()).then((r) => {
        if (!cancelled) {
          setResults(r);
          setIsSearching(false);
        }
      });
    }, delay);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search, open]);

  const handleSelect = (anlage: AnlagePickerResult) => {
    const parts = [anlage.anl_typ_bezeichnung, anlage.ort].filter(Boolean);
    const sel: SelectedAnlage = {
      id: anlage.id,
      label: anlage.anlagen_nr ?? `Anlage #${anlage.id}`,
      sublabel: parts.join(" · ") || undefined,
    };
    setSelected(sel);
    onChange(anlage.id, anlage);
    setOpen(false);
    setSearch("");
  };

  const handleClear = () => {
    setSelected(null);
    onChange(null, null);
  };

  const handleOpenChange = (o: boolean) => {
    setOpen(o);
    if (!o) setSearch("");
  };

  return (
    <>
      {selected ? (
        <div className="flex items-start gap-2 rounded-md border bg-muted/30 px-3 py-2.5">
          <Building2 className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium leading-snug">{selected.label}</p>
            {selected.sublabel && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {selected.sublabel}
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
              aria-label="Anlage entfernen"
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
          Anlage suchen…
        </Button>
      )}

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-lg p-0" aria-describedby={undefined}>
          <DialogHeader className="px-4 pt-4 pb-2">
            <DialogTitle>Anlage auswählen</DialogTitle>
          </DialogHeader>

          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Anlagen-Nr., Typ oder Ort suchen…"
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
                Keine Anlagen gefunden.
              </p>
            ) : (
              <ul>
                {results.map((a) => {
                  const isActive = a.id === value;
                  const parts = [a.anl_typ_bezeichnung, a.ort].filter(Boolean);
                  return (
                    <li key={a.id}>
                      <button
                        type="button"
                        className={`w-full text-left px-4 py-2.5 hover:bg-accent transition-colors ${
                          isActive ? "bg-accent" : ""
                        }`}
                        onClick={() => handleSelect(a)}
                      >
                        <p className="text-sm font-medium truncate font-mono">
                          {a.anlagen_nr ?? `Anlage #${a.id}`}
                        </p>
                        {parts.length > 0 && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {parts.join(" · ")}
                          </p>
                        )}
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
