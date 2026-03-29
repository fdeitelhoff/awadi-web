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
import { MapPin, Car, Mail, Clock, CheckCircle2, XCircle } from "lucide-react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { sendTourEintragEmail, updateKundenStatus } from "@/lib/actions/tour-emails";
import { toast } from "sonner";

function truncate(s: string | undefined, max = 16): string {
  if (!s) return "—";
  return s.length > max ? s.slice(0, max) + "…" : s;
}

// ── Shared address block ─────────────────────────────────────────────────────

function AddressLines({
  zeile1,
  zeile2,
  className = "",
}: {
  zeile1?: string;
  zeile2?: string;
  className?: string;
}) {
  if (!zeile1 && !zeile2) return null;
  return (
    <div className={`flex items-start gap-1 text-muted-foreground min-w-0 ${className}`}>
      <MapPin className="h-2.5 w-2.5 shrink-0 mt-0.5" />
      <div className="min-w-0">
        {zeile1 && <div className="truncate">{zeile1}</div>}
        {zeile2 && <div className="truncate">{zeile2}</div>}
      </div>
    </div>
  );
}

function AddressTooltipLines({ zeile1, zeile2 }: { zeile1?: string; zeile2?: string }) {
  if (!zeile1 && !zeile2) return null;
  return (
    <div className="flex items-start gap-1.5">
      <MapPin className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
      <div>
        {zeile1 && <div>{zeile1}</div>}
        {zeile2 && <div>{zeile2}</div>}
      </div>
    </div>
  );
}

// ── Wartungs-entry card ──────────────────────────────────────────────────────

const DEFAULT_FARBE = "#6366f1";

interface WartungsEintragCardProps {
  eintrag: WartungsKalenderEintrag;
  technikerFarbe?: string;
}

function WartungsEintragCard({ eintrag, technikerFarbe }: WartungsEintragCardProps) {
  const farbe = technikerFarbe ?? DEFAULT_FARBE;
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="rounded-lg border-l-4 bg-card/50 p-1.5 text-xs space-y-0.5 cursor-default"
            style={{ borderLeftColor: farbe }}
          >
            <div className="font-medium truncate">
              {truncate(eintrag.anlage_name) ?? `Anlage #${eintrag.anlage_id}`}
            </div>
            <AddressLines zeile1={eintrag.anlage_adresse} zeile2={eintrag.anlage_adresse_zeile2} />
            {eintrag.dauer_minuten != null && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-2.5 w-2.5" />
                <span>{eintrag.dauer_minuten} min</span>
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <div className="space-y-1 text-xs">
            <div className="font-medium">{eintrag.anlage_name ?? `Anlage #${eintrag.anlage_id}`}</div>
            <AddressTooltipLines zeile1={eintrag.anlage_adresse} zeile2={eintrag.anlage_adresse_zeile2} />
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
    <div className="space-y-1">
      {/* Technician label row */}
      <div className="flex items-center gap-1.5 px-0.5">
        <div
          className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
          style={{ backgroundColor: techniker.farbe }}
        >
          {techniker.kuerzel}
        </div>
        <span className="text-[10px] font-medium truncate text-muted-foreground">{techniker.name}</span>
        <span className="text-[10px] text-muted-foreground ml-auto shrink-0">
          {eintraege.length} {eintraege.length === 1 ? "Wartung" : "Wartungen"}
        </span>
      </div>
      {eintraege.map((e) => (
        <WartungsEintragCard key={e.id} eintrag={e} technikerFarbe={techniker.farbe} />
      ))}
    </div>
  );
}

// ── Technician group for geplante Einträge ──────────────────────────────────

interface TechnicianGeplantGruppeProps {
  techniker: KalenderTechniker;
  eintraege: TourEintrag[];
  showEmailButton?: boolean;
}

export function TechnicianGeplantGruppe({
  techniker,
  eintraege,
  showEmailButton = true,
}: TechnicianGeplantGruppeProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 px-0.5">
        <div
          className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
          style={{ backgroundColor: techniker.farbe }}
        >
          {techniker.kuerzel}
        </div>
        <span className="text-[10px] font-medium truncate text-muted-foreground">{techniker.name}</span>
        <span className="text-[10px] text-muted-foreground ml-auto shrink-0">
          {eintraege.length} {eintraege.length === 1 ? "Termin" : "Termine"}
        </span>
      </div>
      {eintraege.map((e) => (
        <GeplantCard key={e.id} eintrag={e} showEmailButton={showEmailButton} technikerFarbe={techniker.farbe} />
      ))}
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
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
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
            {isWartung && (
              <AddressLines zeile1={eintrag.anlage_adresse} zeile2={eintrag.anlage_adresse_zeile2} />
            )}

            {/* Meta row — travel time + duration, aligned with address icon */}
            {(eintrag.fahrtzeit_minuten != null || eintrag.dauer_minuten != null) && (
              <div className="flex items-center gap-2 text-muted-foreground flex-wrap min-w-0">
                {eintrag.fahrtzeit_minuten != null && (
                  <span className="flex items-center gap-1 shrink-0">
                    <Car className="h-2.5 w-2.5 shrink-0" />
                    {eintrag.fahrtzeit_minuten} min
                  </span>
                )}
                {eintrag.dauer_minuten != null && (
                  <span className="flex items-center gap-1 shrink-0">
                    <Clock className="h-2.5 w-2.5 shrink-0" />
                    {eintrag.dauer_minuten} min
                  </span>
                )}
              </div>
            )}

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
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <div className="space-y-1 text-xs">
            <div className="font-medium">{rawTitle ?? "—"}</div>
            {isWartung && (
              <AddressTooltipLines
                zeile1={eintrag.anlage_adresse}
                zeile2={eintrag.anlage_adresse_zeile2}
              />
            )}
            {time && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span>{time} Uhr</span>
              </div>
            )}
            {eintrag.fahrtzeit_minuten != null && (
              <div className="text-muted-foreground">🚗 {eintrag.fahrtzeit_minuten} min Fahrt</div>
            )}
            {eintrag.dauer_minuten != null && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span>{eintrag.dauer_minuten} Minuten</span>
              </div>
            )}
            {statusCfg && <div className="text-muted-foreground">{statusCfg.label}</div>}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
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
