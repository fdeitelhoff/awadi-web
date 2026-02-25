import { getAnlagen, getAnlageCount } from "@/lib/data/anlagen";
import { AnlageTable } from "./anlage-table";

export async function AnlagePageContent() {
  const [anlageResult, anlageCount] = await Promise.all([
    getAnlagen(),
    getAnlageCount(),
  ]);

  return (
    <>
      <div className="shrink-0">
        <h1 className="text-2xl font-semibold">
          Anlagen ({anlageCount.toLocaleString("de-DE")})
        </h1>
        <p className="text-muted-foreground">
          Verwalten Sie Ihre Kleinkläranlagen.
        </p>
      </div>

      <AnlageTable
        initialData={anlageResult.data}
        initialCount={anlageResult.totalCount}
        initialFilterOrte={anlageResult.filterOptions.orte}
      />
    </>
  );
}
