import { getAnlTypenFull, getAnlTypCount } from "@/lib/data/anl-typen";
import { AnlTypTable } from "@/components/dashboard/anl-typ-table";

export async function AnlTypPageContent() {
  const [result, totalCount] = await Promise.all([
    getAnlTypenFull({ sortField: "sortiernr", sortDirection: "asc", pageSize: 14 }),
    getAnlTypCount(),
  ]);

  return (
    <>
      <div className="shrink-0">
        <h1 className="text-2xl font-semibold">
          Anlagentypen ({totalCount.toLocaleString("de-DE")})
        </h1>
        <p className="text-muted-foreground">
          Verwalten Sie die verfügbaren Anlagentypen mit Wartungsintervallen und
          Preisen.
        </p>
      </div>

      <AnlTypTable initialData={result.data} initialCount={result.totalCount} />
    </>
  );
}
