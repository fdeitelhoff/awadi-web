"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SortIcon } from "@/components/ui/sort-icon";
import { TourPlanningDialogTrigger } from "@/components/dashboard/tour-planning-dialog-trigger";
import { fetchTouren } from "@/lib/actions/touren";
import type { Tour } from "@/lib/types/tour";
import {
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

const PAGE_SIZE = 14;
const ROW_HEIGHT = "h-[46px]";
const COLSPAN = 7;

type EmailCounts = NonNullable<Tour["email_status_counts"]>;

function EmailStatusSummary({ counts }: { counts?: EmailCounts }) {
  if (!counts || (counts.ausstehend === 0 && counts.email_versendet === 0 && counts.bestaetigt === 0 && counts.abgelehnt === 0)) {
    return <span className="text-muted-foreground">—</span>;
  }
  const parts: React.ReactNode[] = [];
  if (counts.bestaetigt > 0)
    parts.push(<span key="b" className="text-success">{counts.bestaetigt} bestätigt</span>);
  if (counts.email_versendet > 0)
    parts.push(<span key="v" className="text-warning">{counts.email_versendet} versendet</span>);
  if (counts.ausstehend > 0)
    parts.push(<span key="a" className="text-muted-foreground">{counts.ausstehend} ausstehend</span>);
  if (counts.abgelehnt > 0)
    parts.push(<span key="ab" className="text-destructive">{counts.abgelehnt} abgelehnt</span>);
  return (
    <span className="flex items-center gap-1.5 text-sm flex-wrap">
      {parts.map((p, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-muted-foreground/40">·</span>}
          {p}
        </span>
      ))}
    </span>
  );
}

type TourSortField = "name" | "von" | "status" | "created_at";
type SortDirection = "asc" | "desc";

interface TourTableProps {
  initialData: Tour[];
  initialCount: number;
}

export function TourTable({ initialData, initialCount }: TourTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [sortField, setSortField] = useState<TourSortField>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = useState(1);

  const [tours, setTours] = useState<Tour[]>(initialData);
  const [totalCount, setTotalCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const isInitialRender = useRef(true);

  const handleSearch = () => {
    setActiveSearch(searchQuery);
    setCurrentPage(1);
  };

  const handleClear = () => {
    setSearchQuery("");
    setActiveSearch("");
    setCurrentPage(1);
  };

  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    fetchTouren({
      search: activeSearch,
      sortField,
      sortDirection,
      page: currentPage,
      pageSize: PAGE_SIZE,
    }).then((result) => {
      if (cancelled) return;
      setTours(result.data);
      setTotalCount(result.totalCount);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [activeSearch, sortField, sortDirection, currentPage]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const handleSort = (field: TourSortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  const fillerCount = Math.max(0, PAGE_SIZE - tours.length);

  return (
    <div className="flex flex-col min-h-0 flex-1">
      {/* Toolbar */}
      <div className="flex items-center justify-between shrink-0 pb-4 gap-3">
        {/* Left: search + pagination */}
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Touren suchen…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
                if (e.key === "Escape") handleClear();
              }}
              className="pl-8 pr-8 w-full"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                aria-label="Suche löschen"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button onClick={handleSearch}>Suchen</Button>

          {totalPages > 1 && (
            <div className="flex items-center gap-1 ml-2">
              <Button
                variant="outline"
                size="sm"
                aria-label="Erste Seite"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1 || isLoading}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                aria-label="Vorherige Seite"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1 || isLoading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground tabular-nums px-1">
                Seite <b>{currentPage}</b> von <b>{totalPages}</b>
              </span>
              <Button
                variant="outline"
                size="sm"
                aria-label="Nächste Seite"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || isLoading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                aria-label="Letzte Seite"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages || isLoading}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Right: new tour */}
        <TourPlanningDialogTrigger />
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-auto flex-1 min-h-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button
                  onClick={() => handleSort("name")}
                  className="flex items-center font-medium hover:text-foreground"
                >
                  Name
                  <SortIcon field="name" sortField={sortField} sortDirection={sortDirection} />
                </button>
              </TableHead>
              <TableHead className="w-[200px]">
                <button
                  onClick={() => handleSort("von")}
                  className="flex items-center font-medium hover:text-foreground"
                >
                  Zeitraum
                  <SortIcon field="von" sortField={sortField} sortDirection={sortDirection} />
                </button>
              </TableHead>
              <TableHead className="w-[180px]">
                <button
                  onClick={() => handleSort("status")}
                  className="flex items-center font-medium hover:text-foreground"
                >
                  Status
                  <SortIcon field="status" sortField={sortField} sortDirection={sortDirection} />
                </button>
              </TableHead>
              <TableHead className="w-[100px]">Techniker</TableHead>
              <TableHead className="w-[80px]">Stopps</TableHead>
              <TableHead className="w-[220px]">E-Mail Status</TableHead>
              <TableHead>Erstellt von</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <TableRow key={`sk-${i}`} className={ROW_HEIGHT}>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-6" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-6" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                </TableRow>
              ))
            ) : tours.length === 0 ? (
              <>
                <TableRow className={ROW_HEIGHT}>
                  <TableCell colSpan={COLSPAN} className="text-center text-muted-foreground">
                    Keine Touren gefunden.
                  </TableCell>
                </TableRow>
                {Array.from({ length: PAGE_SIZE - 1 }).map((_, i) => (
                  <TableRow
                    key={`filler-${i}`}
                    className={`${ROW_HEIGHT} border-b-0 hover:bg-transparent`}
                  >
                    <TableCell colSpan={COLSPAN} className="p-0" />
                  </TableRow>
                ))}
              </>
            ) : (
              <>
                {tours.map((tour) => (
                  <TableRow
                    key={tour.id}
                    className={`${ROW_HEIGHT} cursor-pointer`}
                    onClick={() => router.push(`/master-data/tours/${tour.id}`)}
                  >
                    <TableCell className="font-medium">{tour.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(tour.von).toLocaleDateString("de-DE")} –{" "}
                      {new Date(tour.bis).toLocaleDateString("de-DE")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Badge variant={tour.status === "veröffentlicht" ? "default" : "secondary"}>
                          {tour.status === "veröffentlicht" ? "Veröffentlicht" : "Entwurf"}
                        </Badge>
                        {tour.partial && (
                          <Badge variant="destructive">Unvollständig</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{tour.techniker_count ?? 0}</TableCell>
                    <TableCell>{tour.stop_count ?? 0}</TableCell>
                    <TableCell>
                      <EmailStatusSummary counts={tour.email_status_counts} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {tour.created_by_name ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
                {Array.from({ length: fillerCount }).map((_, i) => (
                  <TableRow
                    key={`filler-${i}`}
                    className={`${ROW_HEIGHT} border-b-0 hover:bg-transparent`}
                  >
                    <TableCell colSpan={COLSPAN} className="p-0" />
                  </TableRow>
                ))}
              </>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
