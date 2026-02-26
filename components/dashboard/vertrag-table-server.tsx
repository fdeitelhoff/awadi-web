import { getVertraege, getVertragCount } from "@/lib/data/vertraege";
import { VertragTable } from "./vertrag-table";

export async function VertragPageContent() {
  const [vertragResult, vertragCount] = await Promise.all([
    getVertraege(),
    getVertragCount(),
  ]);

  return (
    <>
      <div className="shrink-0">
        <h1 className="text-2xl font-semibold">
          Wartungsverträge ({vertragCount.toLocaleString("de-DE")})
        </h1>
        <p className="text-muted-foreground">
          Verwalten Sie Ihre Wartungsverträge.
        </p>
      </div>

      <VertragTable
        initialData={vertragResult.data}
        initialCount={vertragResult.totalCount}
      />
    </>
  );
}
