// app/(dashboard)/master-data/tours/page.tsx
import { getTouren } from "@/lib/data/touren";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { TourPlanningDialogTrigger } from "@/components/dashboard/tour-planning-dialog-trigger";

export default async function ToursPage() {
  const { data: tours } = await getTouren({ pageSize: 50 });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Touren</h1>
          <p className="text-muted-foreground">Planen und verwalten Sie Ihre Wartungstouren</p>
        </div>
        <TourPlanningDialogTrigger />
      </div>

      {tours.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center">Noch keine Touren erstellt.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Zeitraum</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Techniker</TableHead>
              <TableHead>Stopps</TableHead>
              <TableHead>Erstellt von</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tours.map(tour => (
              <TableRow key={tour.id}>
                <TableCell className="font-medium">{tour.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(tour.von).toLocaleDateString("de-DE")} –{" "}
                  {new Date(tour.bis).toLocaleDateString("de-DE")}
                </TableCell>
                <TableCell>
                  <Badge variant={tour.status === "veröffentlicht" ? "default" : "secondary"}>
                    {tour.status === "veröffentlicht" ? "Veröffentlicht" : "Entwurf"}
                  </Badge>
                  {tour.partial && (
                    <Badge variant="destructive" className="ml-1">Unvollständig</Badge>
                  )}
                </TableCell>
                <TableCell>{tour.techniker_count ?? 0}</TableCell>
                <TableCell>{tour.stop_count ?? 0}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{tour.created_by_name ?? "—"}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/master-data/tours/${tour.id}`}>Öffnen</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
