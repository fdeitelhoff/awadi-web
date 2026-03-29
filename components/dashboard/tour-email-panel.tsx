"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { TourEintrag } from "@/lib/types/tour";
import { sendAllTourEmails } from "@/lib/actions/tour-emails";
import { KundenStatusBadge, KundenStatusActions } from "@/components/dashboard/compact-task-card";
import { ChevronDown, ChevronUp, Mail, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface TourEmailPanelProps {
  tourId: number;
  eintraege: TourEintrag[];
}

export function TourEmailPanel({ tourId, eintraege }: TourEmailPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const wartungen = eintraege.filter((e) => e.item_type === "wartung");
  if (wartungen.length === 0) return null;

  const counts = {
    ausstehend:      wartungen.filter((e) => e.kunden_status === "ausstehend").length,
    email_versendet: wartungen.filter((e) => e.kunden_status === "email_versendet").length,
    bestaetigt:      wartungen.filter((e) => e.kunden_status === "bestaetigt").length,
    abgelehnt:       wartungen.filter((e) => e.kunden_status === "abgelehnt").length,
  };

  function handleSendAll() {
    startTransition(async () => {
      const result = await sendAllTourEmails(tourId);
      if (result.errors.length > 0) {
        toast.error(`${result.sent} E-Mails versendet, ${result.errors.length} Fehler`);
      } else {
        toast.success(`${result.sent} E-Mails versendet`);
      }
      router.refresh();
    });
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="flex items-center gap-3 px-4 py-2 border-b bg-muted/30 flex-wrap">
        <div className="flex items-center gap-1.5 text-sm font-medium">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span>Kundenkommunikation</span>
        </div>

        {/* Status summary badges */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {counts.ausstehend > 0 && (
            <Badge variant="secondary" className="bg-muted text-muted-foreground font-normal">
              {counts.ausstehend} ausstehend
            </Badge>
          )}
          {counts.email_versendet > 0 && (
            <Badge variant="secondary" className="bg-warning/15 text-warning font-normal">
              {counts.email_versendet} versendet
            </Badge>
          )}
          {counts.bestaetigt > 0 && (
            <Badge variant="secondary" className="bg-success/15 text-success font-normal">
              {counts.bestaetigt} bestätigt
            </Badge>
          )}
          {counts.abgelehnt > 0 && (
            <Badge variant="secondary" className="bg-destructive/15 text-destructive font-normal">
              {counts.abgelehnt} abgelehnt
            </Badge>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {counts.ausstehend > 0 && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 gap-1.5 text-xs"
              disabled={isPending}
              onClick={handleSendAll}
            >
              <Mail className="h-3.5 w-3.5" />
              Alle benachrichtigen ({counts.ausstehend})
            </Button>
          )}
          <CollapsibleTrigger asChild>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
              {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
        </div>
      </div>

      <CollapsibleContent>
        <div className="px-4 py-2 border-b bg-muted/10 space-y-1 max-h-48 overflow-y-auto">
          {wartungen.map((e) => (
            <div
              key={e.id}
              className="flex items-center gap-3 py-1.5 border-b border-border/50 last:border-0 flex-wrap"
            >
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-sm font-medium truncate">
                  {e.anlage_name ?? `Anlage #${e.anlage_id}`}
                </span>
                {e.anlage_adresse && (
                  <span className="text-xs text-muted-foreground truncate hidden sm:block">
                    {e.anlage_adresse}
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground shrink-0">
                {new Date(e.datum + "T12:00:00Z").toLocaleDateString("de-DE", {
                  weekday: "short",
                  day: "2-digit",
                  month: "2-digit",
                })}
                {e.geplante_startzeit && ` · ${e.geplante_startzeit.slice(0, 5)}`}
              </div>
              <KundenStatusBadge status={e.kunden_status} />
              <KundenStatusActions eintrag={e} />
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
