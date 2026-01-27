import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, MapPin, Users, Wrench } from "lucide-react";

export default function MasterDataPage() {
  const masterDataSections = [
    {
      title: "Kunden",
      description: "Kundenstammdaten verwalten",
      icon: Users,
      count: 0,
    },
    {
      title: "Anlagen",
      description: "Kleinkläranlagen und Systeme",
      icon: Building2,
      count: 0,
    },
    {
      title: "Standorte",
      description: "Standorte und Adressen",
      icon: MapPin,
      count: 0,
    },
    {
      title: "Techniker",
      description: "Techniker und Personal",
      icon: Wrench,
      count: 3,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Stammdaten</h1>
        <p className="text-muted-foreground">
          Verwalten Sie Ihre Kunden, Anlagen und Techniker
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {masterDataSections.map((section) => {
          const Icon = section.icon;
          return (
            <Card
              key={section.title}
              className="hover:shadow-md transition-shadow cursor-pointer"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {section.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{section.count}</div>
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
          <p className="text-center text-muted-foreground py-8">
            Stammdatenverwaltung wird in Kürze verfügbar sein.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
