"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Navigation, Route } from "lucide-react";

export function RouteMapPanel() {
  return (
    <Card className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <CardHeader className="pb-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Route className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Tagesroute</CardTitle>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Navigation className="h-4 w-4" />
            <span>—</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 min-h-0 pt-0 pb-3 px-3 overflow-hidden">
        {/* Map mockup */}
        <div className="h-full rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/30 flex flex-col items-center justify-center gap-4">
          {/* Map placeholder with styled background */}
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Decorative map grid lines */}
            <div className="absolute inset-4 opacity-10">
              <div className="w-full h-full grid grid-cols-6 grid-rows-6">
                {Array.from({ length: 36 }).map((_, i) => (
                  <div key={i} className="border border-muted-foreground/50" />
                ))}
              </div>
            </div>

            {/* Mock route path */}
            <svg
              className="absolute inset-0 w-full h-full opacity-20"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <path
                d="M20,80 Q30,60 40,65 T60,40 T80,25"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
                strokeDasharray="2,1"
                className="text-primary"
              />
            </svg>

            {/* Mock location markers */}
            <div className="absolute top-[20%] left-[25%]">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
            </div>
            <div className="absolute top-[40%] left-[45%]">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
            </div>
            <div className="absolute top-[55%] left-[60%]">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
            </div>
            <div className="absolute top-[75%] left-[30%]">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
            </div>

            {/* Center content */}
            <div className="relative z-10 text-center p-6 bg-background/80 rounded-lg shadow-sm">
              <Route className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <h3 className="font-medium text-muted-foreground mb-1">
                Routenplanung
              </h3>
              <p className="text-sm text-muted-foreground/70 max-w-48">
                Wählen Sie einen Techniker und Tag aus, um die optimierte Route anzuzeigen
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
