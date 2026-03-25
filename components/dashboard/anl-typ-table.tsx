"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { AnlTypFull, AnlTypSortField } from "@/lib/types/anl-typ";
import { fetchAnlTypen, deleteAnlTyp } from "@/lib/actions/anl-typen";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
  Search,
  X,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Plus,
} from "lucide-react";

const PAGE_SIZE = 14;
const ROW_HEIGHT = "h-[46px]";
const COLSPAN = 5;

interface AnlTypTableProps {
  initialData: AnlTypFull[];
  initialCount: number;
}

function formatPrice(value: number): string {
  return value.toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  });
}

export function AnlTypTable({ initialData, initialCount }: AnlTypTableProps) {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [sortField, setSortField] = useState<AnlTypSortField>("sortiernr");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);

  const [typen, setTypen] = useState<AnlTypFull[]>(initialData);
  const [totalCount, setTotalCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

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

  const handleDeleteClick = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setPendingDeleteId(id);
  };

  const handleDeleteConfirm = async () => {
    if (pendingDeleteId === null) return;
    const id = pendingDeleteId;
    setPendingDeleteId(null);
    setDeletingId(id);
    const result = await deleteAnlTyp(id);
    if (result.success) {
      setTypen((prev) => prev.filter((t) => t.id !== id));
      setTotalCount((c) => c - 1);
      toast.success("Anlagentyp gelöscht");
    } else {
      toast.error(result.error ?? "Löschen fehlgeschlagen.");
    }
    setDeletingId(null);
  };

  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    fetchAnlTypen({
      search: activeSearch,
      sortField,
      sortDirection,
      page: currentPage,
      pageSize: PAGE_SIZE,
    }).then((result) => {
      if (cancelled) return;
      setTypen(result.data);
      setTotalCount(result.totalCount);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [activeSearch, sortField, sortDirection, currentPage]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const handleSort = (field: AnlTypSortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  const SortIcon = ({ field }: { field: AnlTypSortField }) => {
    if (sortField !== field)
      return <ArrowUpDown className="ml-1 h-3 w-3 text-muted-foreground/50" />;
    return sortDirection === "asc" ? (
      <ArrowUp className="ml-1 h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3" />
    );
  };

  const fillerCount = Math.max(0, PAGE_SIZE - typen.length);

  return (
    <div className="flex flex-col min-h-0 flex-1">

      {/* ── Confirm delete dialog ──────────────────────────────── */}
      <AlertDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => { if (!open) setPendingDeleteId(null); }}
      >
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Anlagentyp löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Dieser Vorgang kann nicht rückgängig gemacht werden. Der Typ
              wird dauerhaft aus der Datenbank entfernt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteConfirm}
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Toolbar ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between shrink-0 pb-4 gap-3">

        {/* Left: search + pagination */}
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Typen suchen…"
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

        {/* Right: new button */}
        <Button variant="success" onClick={() => router.push("/settings/facility-types/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Neuer Typ
        </Button>
      </div>

      {/* ── Table ──────────────────────────────────────────────── */}
      <div className="rounded-md border overflow-auto flex-1 min-h-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[90px]">
                <button
                  onClick={() => handleSort("sortiernr")}
                  className="flex items-center font-medium hover:text-foreground"
                >
                  Sort-Nr.
                  <SortIcon field="sortiernr" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort("bezeichnung")}
                  className="flex items-center font-medium hover:text-foreground"
                >
                  Bezeichnung
                  <SortIcon field="bezeichnung" />
                </button>
              </TableHead>
              <TableHead className="w-[140px]">
                <button
                  onClick={() => handleSort("wartungsintervall_monate")}
                  className="flex items-center font-medium hover:text-foreground"
                >
                  Intervall (Mon.)
                  <SortIcon field="wartungsintervall_monate" />
                </button>
              </TableHead>
              <TableHead className="w-[140px]">
                Dauer Wartung
              </TableHead>
              <TableHead className="w-[90px]" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <TableRow key={`sk-${i}`} className={ROW_HEIGHT}>
                  <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell />
                </TableRow>
              ))
            ) : typen.length === 0 ? (
              <>
                <TableRow className={ROW_HEIGHT}>
                  <TableCell
                    colSpan={COLSPAN}
                    className="text-center text-muted-foreground"
                  >
                    Keine Anlagentypen gefunden.
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
                {typen.map((typ) => (
                  <TableRow
                    key={typ.id}
                    className={`${ROW_HEIGHT} cursor-pointer`}
                    onClick={() =>
                      router.push(`/settings/facility-types/${typ.id}`)
                    }
                  >
                    <TableCell className="font-mono text-muted-foreground">
                      {typ.sortiernr ?? "—"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {typ.bezeichnung}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {typ.wartungsintervall_monate} Mon.
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {typ.dauer_wartung_minuten} Min.
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={deletingId === typ.id}
                        onClick={(e) => handleDeleteClick(e, typ.id)}
                      >
                        {deletingId === typ.id && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Löschen
                      </Button>
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
