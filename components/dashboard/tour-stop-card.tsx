// components/dashboard/tour-stop-card.tsx
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { TourEintrag } from "@/lib/types/tour";

interface TourStopCardProps {
  stop: TourEintrag;
  className?: string;
}

function formatTime(time?: string): string {
  if (!time) return "—";
  return time.slice(0, 5); // "HH:MM"
}

export function TourStopCard({ stop, className }: TourStopCardProps) {
  const isTicket = stop.item_type === "ticket";
  const title = isTicket ? stop.ticket_titel : stop.anlage_name;
  const address = stop.anlage_adresse;

  return (
    <Card className={cn("text-xs border-l-2", isTicket ? "border-l-red-500" : "border-l-blue-500", className)}>
      <CardContent className="p-2 space-y-0.5">
        <div className="flex items-center gap-1 flex-wrap">
          <span className="font-medium truncate">{title ?? "—"}</span>
          {isTicket && <Badge variant="destructive" className="h-4 text-[10px]">Ticket</Badge>}
          {stop.original_techniker_id && (
            <Badge variant="outline" className="h-4 text-[10px] border-amber-500 text-amber-600">Vertretung</Badge>
          )}
        </div>
        {address && <div className="text-muted-foreground truncate">{address}</div>}
        <div className="flex gap-2 text-muted-foreground">
          <span>▶ {formatTime(stop.geplante_startzeit)}</span>
          {stop.fahrtzeit_minuten != null && <span>🚗 {stop.fahrtzeit_minuten} min</span>}
          {stop.dauer_minuten != null && <span>⏱ {stop.dauer_minuten} min</span>}
        </div>
      </CardContent>
    </Card>
  );
}
