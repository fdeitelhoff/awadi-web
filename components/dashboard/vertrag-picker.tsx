"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fetchVertraege } from "@/lib/actions/vertraege";
import type { Vertrag } from "@/lib/types/vertrag";
import { FileText } from "lucide-react";

interface VertragPickerProps {
  kundenId?: number;
  anlageId?: number;
}

function formatDateRange(ab?: string, bis?: string): string {
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  if (ab && bis) return `${fmt(ab)} – ${fmt(bis)}`;
  if (ab) return `ab ${fmt(ab)}`;
  if (bis) return `bis ${fmt(bis)}`;
  return "";
}

export function VertragPicker({ kundenId, anlageId }: VertragPickerProps) {
  const [vertraege, setVertraege] = useState<Vertrag[]>([]);
  const [selected, setSelected] = useState<Vertrag | null>(null);
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    fetchVertraege({
      kundenId,
      anlageId,
      pageSize: 50,
      sortField: "gueltig_ab",
      sortDirection: "desc",
    }).then((r) => {
      if (cancelled) return;
      setVertraege(r.data);
      const first = r.data.find((v) => v.aktiv) ?? r.data[0] ?? null;
      setSelected(first);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [kundenId, anlageId]);

  if (isLoading) {
    return (
      <div className="rounded-md border bg-muted/30 px-3 h-[52px] animate-pulse" />
    );
  }

  if (!selected) {
    return (
      <div className="rounded-md border bg-muted/30 px-3 py-2.5">
        <p className="text-sm text-muted-foreground">Kein Vertrag vorhanden.</p>
      </div>
    );
  }

  const dateRange = formatDateRange(selected.gueltig_ab, selected.gueltig_bis);

  return (
    <>
      <div className="flex items-start gap-2 rounded-md border bg-muted/30 px-3 py-2.5">
        <FileText className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-snug">
            {selected.anlagen_nr ? `Anlage ${selected.anlagen_nr}` : `Vertrag #${selected.id}`}
            {selected.aktiv && (
              <span className="ml-2 text-xs font-normal text-green-700 dark:text-green-400">
                Aktiv
              </span>
            )}
          </p>
          {dateRange && (
            <p className="text-xs text-muted-foreground mt-0.5">{dateRange}</p>
          )}
        </div>
        {vertraege.length > 1 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs shrink-0 ml-2"
            onClick={() => setOpen(true)}
          >
            Ändern
          </Button>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md p-0" aria-describedby={undefined}>
          <DialogHeader className="px-4 pt-4 pb-2">
            <DialogTitle>Wartungsvertrag auswählen</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[360px] border-t">
            <ul>
              {vertraege.map((v) => {
                const dr = formatDateRange(v.gueltig_ab, v.gueltig_bis);
                const isCurrent = v.id === selected?.id;
                return (
                  <li key={v.id}>
                    <button
                      type="button"
                      className={`w-full text-left px-4 py-2.5 hover:bg-accent transition-colors ${
                        isCurrent ? "bg-accent" : ""
                      }`}
                      onClick={() => {
                        setSelected(v);
                        setOpen(false);
                      }}
                    >
                      <p className="text-sm font-medium truncate">
                        {v.anlagen_nr ? `Anlage ${v.anlagen_nr}` : `Vertrag #${v.id}`}
                        {v.aktiv && (
                          <span className="ml-2 text-xs font-normal text-green-700 dark:text-green-400">
                            Aktiv
                          </span>
                        )}
                      </p>
                      {dr && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {dr}
                        </p>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
