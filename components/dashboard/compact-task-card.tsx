"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { TourEintrag } from "@/lib/types/tour";
import type { WartungsKalenderEintrag, KalenderTechniker } from "@/lib/types/wartung";
import { MapPin, Mail, Clock, CheckCircle2, XCircle } from "lucide-react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { sendTourEintragEmail, updateKundenStatus } from "@/lib/actions/tour-emails";
import { toast } from "sonner";

function truncate(s: string | undefined, max = 16): string {
  if (!s) return "—";
  return s.length > max ? s.slice(0, max) + "…" : s;
}

// ── Wartungs-entry card (replaces mock CompactTaskCard / TourTaskItem) ──────

interface WartungsEintragCardProps {
  eintrag: WartungsKalenderEintrag;
}

function WartungsEintragCard({ eintrag }: WartungsEintragCardProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-start gap-1.5 p-1.5 rounded bg-background hover:bg-muted/50 transition-colors cursor-default">
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-medium truncate">
                {truncate(eintrag.anlage_name) ?? `Anlage #${eintrag.anlage_id}`}
              </div>
              {eintrag.anlage_adresse && (
                <div className="text-[10px] text-muted-foreground truncate">
                  {eintrag.anlage_adresse}
                </div>
              )}
            </div>
            {eintrag.dauer_minuten != null && (
              <span className="text-[10px] text-muted-foreground shrink-0 flex items-center gap-0.5">
                <Clock className="h-2.5 w-2.5" />
                {eintrag.dauer_minuten} min
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <div className="space-y-1 text-xs">
            <div className="font-medium">{eintrag.anlage_name ?? `Anlage #${eintrag.anlage_id}`}</div>
            {eintrag.anlage_adresse && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3 w-3 text-muted-foreground" />
                <span>{eintrag.anlage_adresse}</span>
              </div>
            )}
            {eintrag.dauer_minuten != null && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span>{eintrag.dauer_minuten} Minuten</span>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ── Technician group for ungeplante Wartungen ────────────────────────────────

interface TechnicianWartungsGruppeProps {
  techniker: KalenderTechniker;
  eintraege: WartungsKalenderEintrag[];
}

export function TechnicianWartungsGruppe({ techniker, eintraege }: TechnicianWartungsGruppeProps) {
  return (
    <div
      className="rounded-lg border-l-4 bg-card/50 p-1.5"
      style={{ borderLeftColor: techniker.farbe }}
    >
      <div className="flex items-center gap-1.5 mb-1.5 px-1">
        <div
          className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
          style={{ backgroundColor: techniker.farbe }}
        >
          {techniker.kuerzel}
        </div>
        <span className="text-[10px] font-medium truncate">{techniker.name}</span>
        <span className="text-[10px] text-muted-foreground ml-auto">
          {eintraege.length} {eintraege.length === 1 ? "Wartung" : "Wartungen"}
        </span>
      </div>
      <div className="space-y-1">
        {eintraege.map((e) => (
          <WartungsEintragCard key={e.id} eintrag={e} />
        ))}
      </div>
    </div>
  );
}

// ── kunden_status badge config ───────────────────────────────────────────────

const KUNDEN_STATUS_CONFIG = {
  ausstehend:      { label: "Ausstehend",       className: "bg-info/15 text-info" },
  email_versendet: { label: "E-Mail versendet", className: "bg-warning/15 text-warning" },
  bestaetigt:      { label: "Bestätigt",        className: "bg-success/15 text-success" },
  abgelehnt:       { label: "Abgelehnt",        className: "bg-destructive/15 text-destructive" },
} as const;

// ── GeplantCard — published tour stop in the calendar ────────────────────────

interface GeplantCardProps {
  eintrag: TourEintrag;
  showEmailButton?: boolean;
  technikerFarbe?: string;
}

const DEFAULT_FARBE = "#6366f1";

export function GeplantCard({ eintrag, showEmailButton = true, technikerFarbe }: GeplantCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isWartung = eintrag.item_type === "wartung";
  const rawTitle = isWartung ? eintrag.anlage_name : eintrag.ticket_titel;
  const title = truncate(rawTitle);
  const time = eintrag.geplante_startzeit?.slice(0, 5);
  const statusCfg = KUNDEN_STATUS_CONFIG[eintrag.kunden_status];
  const farbe = technikerFarbe ?? DEFAULT_FARBE;
  const canSendEmail =
    showEmailButton && isWartung && eintrag.kunden_status === "ausstehend";

  function handleSendEmail() {
    startTransition(async () => {
      const result = await sendTourEintragEmail(eintrag.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("E-Mail versendet");
        router.refresh();
      }
    });
  }

  function handleMarkBestaetigt() {
    startTransition(async () => {
      const result = await updateKundenStatus(eintrag.id, "bestaetigt", eintrag.tour_id);
      if (result.error) toast.error(result.error);
      else router.refresh();
    });
  }

  return (
    <div
      className="rounded-lg border-l-4 bg-card/50 p-1.5 text-xs space-y-0.5"
      style={{ borderLeftColor: farbe }}
    >
      {/* Title row */}
      <div className="flex items-center gap-1 min-w-0">
        <span className="font-medium truncate flex-1">{title ?? "—"}</span>
        {time && <span className="text-muted-foreground shrink-0">▶ {time}</span>}
      </div>

      {/* Address (wartung only) */}
      {isWartung && eintrag.anlage_adresse && (
        <div className="flex items-center gap-1 text-muted-foreground min-w-0">
          <MapPin className="h-2.5 w-2.5 shrink-0" />
          <span className="truncate">{eintrag.anlage_adresse}</span>
        </div>
      )}

      {/* Meta row */}
      <div className="text-muted-foreground flex gap-2 flex-wrap min-w-0">
        {eintrag.fahrtzeit_minuten != null && <span className="shrink-0">🚗 {eintrag.fahrtzeit_minuten} min</span>}
        {eintrag.techniker_name && (
          <span className="truncate">{eintrag.techniker_name}</span>
        )}
      </div>

      <div className="flex items-center gap-1 flex-wrap">
        {statusCfg && (
          <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 font-normal ${statusCfg.className}`}>
            {statusCfg.label}
          </Badge>
        )}
        {canSendEmail && (
          <Button
            size="sm"
            variant="ghost"
            className="h-5 px-1 text-[10px] gap-0.5 text-info hover:text-info hover:bg-info/10"
            disabled={isPending}
            onClick={handleSendEmail}
          >
            <Mail className="h-2.5 w-2.5" />
            E-Mail
          </Button>
        )}
        {eintrag.kunden_status === "email_versendet" && (
          <Button
            size="sm"
            variant="ghost"
            className="h-5 px-1 text-[10px] gap-0.5 text-success hover:text-success hover:bg-success/10"
            disabled={isPending}
            onClick={handleMarkBestaetigt}
          >
            <CheckCircle2 className="h-2.5 w-2.5" />
            Bestätigen
          </Button>
        )}
      </div>
    </div>
  );
}

// ── KundenStatusBadge — standalone badge for tour detail views ───────────────

export function KundenStatusBadge({ status }: { status: TourEintrag["kunden_status"] }) {
  const cfg = KUNDEN_STATUS_CONFIG[status];
  if (!cfg) return null;
  return (
    <Badge variant="secondary" className={`font-normal ${cfg.className}`}>
      {cfg.label}
    </Badge>
  );
}

// ── Status action buttons for tour detail page ───────────────────────────────

interface KundenStatusActionsProps {
  eintrag: TourEintrag;
}

export function KundenStatusActions({ eintrag }: KundenStatusActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function act(status: TourEintrag["kunden_status"]) {
    startTransition(async () => {
      if (status === "email_versendet") {
        const result = await sendTourEintragEmail(eintrag.id);
        if (result.error) toast.error(result.error);
        else { toast.success("E-Mail versendet"); router.refresh(); }
      } else {
        const result = await updateKundenStatus(eintrag.id, status, eintrag.tour_id);
        if (result.error) toast.error(result.error);
        else router.refresh();
      }
    });
  }

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {eintrag.kunden_status === "ausstehend" && (
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" disabled={isPending} onClick={() => act("email_versendet")}>
          <Mail className="h-3 w-3" /> E-Mail senden
        </Button>
      )}
      {eintrag.kunden_status === "email_versendet" && (
        <>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-success border-success/30 hover:bg-success/10" disabled={isPending} onClick={() => act("bestaetigt")}>
            <CheckCircle2 className="h-3 w-3" /> Bestätigt
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-destructive border-destructive/30 hover:bg-destructive/10" disabled={isPending} onClick={() => act("abgelehnt")}>
            <XCircle className="h-3 w-3" /> Abgelehnt
          </Button>
        </>
      )}
      {(eintrag.kunden_status === "bestaetigt" || eintrag.kunden_status === "abgelehnt") && (
        <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground" disabled={isPending} onClick={() => act("ausstehend")}>
          Zurücksetzen
        </Button>
      )}
    </div>
  );
}
