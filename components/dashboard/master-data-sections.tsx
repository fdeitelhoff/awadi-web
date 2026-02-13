"use client";

import { useState, type ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, MapPin, Users, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

type MasterDataSection = "kunden" | "anlagen" | "standorte" | "techniker";

interface SectionDef {
  id: MasterDataSection;
  title: string;
  description: string;
  icon: typeof Users;
  count: number | null;
}

const sections: SectionDef[] = [
  {
    id: "kunden",
    title: "Kunden",
    description: "Kundenstammdaten verwalten",
    icon: Users,
    count: null, // Will be replaced by server-provided count
  },
  {
    id: "anlagen",
    title: "Anlagen",
    description: "Kleinkläranlagen und Systeme",
    icon: Building2,
    count: 0,
  },
  {
    id: "standorte",
    title: "Standorte",
    description: "Standorte und Adressen",
    icon: MapPin,
    count: 0,
  },
  {
    id: "techniker",
    title: "Techniker",
    description: "Techniker und Personal",
    icon: Wrench,
    count: 3,
  },
];

interface MasterDataSectionsProps {
  customerCount: number;
  kundenContent: ReactNode;
}

export function MasterDataSections({
  customerCount,
  kundenContent,
}: MasterDataSectionsProps) {
  const [activeSection, setActiveSection] =
    useState<MasterDataSection>("kunden");

  const resolvedSections = sections.map((s) =>
    s.id === "kunden" ? { ...s, count: customerCount } : s
  );

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {resolvedSections.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;
          return (
            <Card
              key={section.id}
              className={cn(
                "hover:shadow-md transition-shadow cursor-pointer",
                isActive && "ring-2 ring-primary shadow-md"
              )}
              onClick={() => setActiveSection(section.id)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {section.title}
                </CardTitle>
                <Icon
                  className={cn(
                    "h-4 w-4",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {section.count === null ? "..." : section.count}
                </div>
                <p className="text-xs text-muted-foreground">
                  {section.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardContent className="pt-6">
          {activeSection === "kunden" ? (
            kundenContent
          ) : (
            <p className="text-center text-muted-foreground py-8">
              {resolvedSections.find((s) => s.id === activeSection)?.title}{" "}
              wird in Kürze verfügbar sein.
            </p>
          )}
        </CardContent>
      </Card>
    </>
  );
}
