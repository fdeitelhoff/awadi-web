"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import type {
  AnlageListItem,
  SortField,
  SortDirection,
} from "@/lib/types/anlage";
import { fetchAnlagen, deleteAnlage } from "@/lib/actions/anlagen";
import {
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import { SortIcon } from "@/components/ui/sort-icon";

const PAGE_SIZE = 14;
const ROW_HEIGHT = "h-[46px]";

interface AnlageTableProps {
  initialData: AnlageListItem[];
  initialCount: number;
  initialFilterOrte: string[];
}

export function AnlageTable({
  initialData,
  initialCount,
  initialFilterOrte,
}: AnlageTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("anlagen_nr");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [filterOrt, setFilterOrt] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [anlagen, setAnlagen] = useState<AnlageListItem[]>(initialData);
  const [totalCount, setTotalCount] = useState(initialCount);
  const [filterOrte, setFilterOrte] = useState<string[]>(initialFilterOrte);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  const handleDeleteClick = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setDeleteError(null);
    setPendingDeleteId(id);
  };

  const handleDeleteConfirm = async () => {
    if (pendingDeleteId === null) return;
    const id = pendingDeleteId;
    setPendingDeleteId(null);
    setDeletingId(id);
    const result = await deleteAnlage(id);
    if (result.success) {
      setAnlagen((prev) => prev.filter((a) => a.id !== id));
      setTotalCount((c) => c - 1);
    } else {
      setDeleteError(result.error ?? "Löschen fehlgeschlagen.");
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

    fetchAnlagen({
      search: activeSearch,
      filterOrt,
      sortField,
      sortDirection,
      page: currentPage,
      pageSize: PAGE_SIZE,
    }).then((result) => {
      if (cancelled) return;
      setAnlagen(result.data);
      setTotalCount(result.totalCount);
      setFilterOrte(result.filterOptions.orte);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [activeSearch, filterOrt, sortField, sortDirection, currentPage]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const handleFilterChange = (value: string) => {
    setFilterOrt(value);
    setCurrentPage(1);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  const fillerCount = Math.max(0, PAGE_SIZE - anlagen.length);
  const COLSPAN = 11;

  return (
    <div className="flex flex-col min-h-0 flex-1">
      {/* Confirm delete dialog */}
      <AlertDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => { if (!open) setPendingDeleteId(null); }}
      >
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Anlage löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Dieser Vorgang kann nicht rückgängig gemacht werden. Die Anlage
              sowie alle zugehörigen Biologie-Daten und Wartungsverträge werden
              dauerhaft entfernt.
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

      {/* Error dialog */}
      <AlertDialog
        open={deleteError !== null}
        onOpenChange={(open) => { if (!open) setDeleteError(null); }}
      >
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Löschen fehlgeschlagen</AlertDialogTitle>
            <AlertDialogDescription>{deleteError}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setDeleteError(null)}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Toolbar */}
      <div className="flex items-center justify-between shrink-0 pb-4 gap-3">
        {/* Left: search + pagination */}
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Anlagen suchen…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1 ml-2">
              <Button
                variant="outline"
                size="sm"
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
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages || isLoading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Right: filter + new */}
        <div className="flex items-center gap-2">
          <Select value={filterOrt} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Ort filtern" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Orte</SelectItem>
              {filterOrte.map((ort) => (
                <SelectItem key={ort} value={ort}>
                  {ort}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => router.push("/master-data/facilities/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Neue Anlage
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-auto flex-1 min-h-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[110px]">
                <button
                  onClick={() => handleSort("anlagen_nr")}
                  className="flex items-center font-medium hover:text-foreground"
                >
                  Anl.-Nr.
                  <SortIcon field="anlagen_nr" sortField={sortField} sortDirection={sortDirection} />
                </button>
              </TableHead>
              <TableHead>Typ</TableHead>
              <TableHead>Eigentümer</TableHead>
              <TableHead>Ansprechpartner</TableHead>
              <TableHead>Telefon</TableHead>
              <TableHead>E-Mail</TableHead>
              <TableHead>Straße</TableHead>
              <TableHead className="w-[80px]">Hausnr.</TableHead>
              <TableHead className="w-[90px]">
                <button
                  onClick={() => handleSort("plz")}
                  className="flex items-center font-medium hover:text-foreground"
                >
                  PLZ
                  <SortIcon field="plz" sortField={sortField} sortDirection={sortDirection} />
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort("ort")}
                  className="flex items-center font-medium hover:text-foreground"
                >
                  Ort
                  <SortIcon field="ort" sortField={sortField} sortDirection={sortDirection} />
                </button>
              </TableHead>
              <TableHead className="w-[90px]" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <TableRow key={`sk-${i}`} className={ROW_HEIGHT}>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-14" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell />
                </TableRow>
              ))
            ) : anlagen.length === 0 ? (
              <>
                <TableRow className={ROW_HEIGHT}>
                  <TableCell
                    colSpan={COLSPAN}
                    className="text-center text-muted-foreground"
                  >
                    Keine Anlagen gefunden.
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
                {anlagen.map((anlage) => (
                  <TableRow
                    key={anlage.id}
                    className={`${ROW_HEIGHT} cursor-pointer`}
                    onClick={() =>
                      router.push(`/master-data/facilities/${anlage.id}`)
                    }
                  >
                    <TableCell className="font-medium">
                      {anlage.anlagen_nr ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {anlage.anl_typ_bezeichnung ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {anlage.owner_name ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {anlage.kontakt_name ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {anlage.kontakt_telefonnr ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {anlage.kontakt_email ? (
                        <a
                          href={`mailto:${anlage.kontakt_email}`}
                          onClick={(e) => e.stopPropagation()}
                          className="hover:underline"
                        >
                          {anlage.kontakt_email}
                        </a>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {anlage.strasse}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {anlage.hausnr}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {anlage.plz}
                    </TableCell>
                    <TableCell>{anlage.ort}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={deletingId === anlage.id}
                        onClick={(e) => handleDeleteClick(e, anlage.id)}
                      >
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
