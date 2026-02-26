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
import { fetchAnlagen } from "@/lib/actions/anlagen";
import type { AnlageListItem } from "@/lib/types/anlage";
import { Search, Building2, X } from "lucide-react";

export interface SelectedAnlage {
  id: number;
  anlagen_nr?: string;
  info?: string;
}

interface AnlagePickerProps {
  value: number | null;
  onChange: (id: number | null) => void;
  initial?: SelectedAnlage;
}

export function AnlagePicker({ value, onChange, initial }: AnlagePickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<AnlageListItem[]>([]);
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
      fetchAnlagen({
        search: search.trim(),
        pageSize: 15,
        sortField: "anlagen_nr",
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

  const handleSelect = (anlage: AnlageListItem) => {
    const cityParts = [anlage.plz, anlage.ort].filter(Boolean).join(" ");
    const streetParts = [anlage.strasse, anlage.hausnr]
      .filter(Boolean)
      .join(" ");
    const info = [streetParts, cityParts].filter(Boolean).join(", ");

    const sel: SelectedAnlage = {
      id: anlage.id,
      anlagen_nr: anlage.anlagen_nr,
      info: info || undefined,
    };
    setSelected(sel);
    onChange(anlage.id);
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
          <Building2 className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium leading-snug">
              {selected.anlagen_nr ?? `Anlage #${selected.id}`}
            </p>
            {selected.info && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {selected.info}
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
                placeholder="Anlagen-Nr. oder Ort suchen…"
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
                {results.map((anlage) => {
                  const cityParts = [anlage.plz, anlage.ort]
                    .filter(Boolean)
                    .join(" ");
                  const streetParts = [anlage.strasse, anlage.hausnr]
                    .filter(Boolean)
                    .join(" ");
                  const address = [streetParts, cityParts]
                    .filter(Boolean)
                    .join(", ");
                  const isActive = anlage.id === value;
                  return (
                    <li key={anlage.id}>
                      <button
                        type="button"
                        className={`w-full text-left px-4 py-2.5 hover:bg-accent transition-colors ${
                          isActive ? "bg-accent" : ""
                        }`}
                        onClick={() => handleSelect(anlage)}
                      >
                        <p className="text-sm font-medium truncate">
                          {anlage.anlagen_nr ?? `Anlage #${anlage.id}`}
                        </p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {anlage.owner_name && (
                            <span className="mr-2">{anlage.owner_name}</span>
                          )}
                          {address}
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
