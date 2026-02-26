import { getKontakte, getKontaktCount } from "@/lib/data/kontakte";
import { KontaktTable } from "./kontakt-table";

export async function KontaktPageContent() {
  const [kontaktResult, kontaktCount] = await Promise.all([
    getKontakte(),
    getKontaktCount(),
  ]);

  return (
    <>
      <div className="shrink-0">
        <h1 className="text-2xl font-semibold">
          Kontakte ({kontaktCount.toLocaleString("de-DE")})
        </h1>
        <p className="text-muted-foreground">
          Verwalten Sie Ihre Ansprechpartner und Kontakte.
        </p>
      </div>

      <KontaktTable
        initialData={kontaktResult.data}
        initialCount={kontaktResult.totalCount}
        initialFilterOrte={kontaktResult.filterOptions.orte}
      />
    </>
  );
}
