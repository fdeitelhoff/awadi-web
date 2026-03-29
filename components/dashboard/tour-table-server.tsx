import { getTouren } from "@/lib/data/touren";
import { TourTable } from "./tour-table";

export async function TourPageContent() {
  const result = await getTouren({ page: 1, pageSize: 14 });

  return (
    <>
      <div className="shrink-0">
        <h1 className="text-2xl font-semibold">
          Touren ({result.totalCount.toLocaleString("de-DE")})
        </h1>
        <p className="text-muted-foreground">
          Planen und verwalten Sie Ihre Wartungstouren.
        </p>
      </div>

      <TourTable initialData={result.data} initialCount={result.totalCount} />
    </>
  );
}
