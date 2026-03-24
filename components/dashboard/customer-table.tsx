"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
import type { Kunde, SortField, SortDirection, KundeFilterAktiv } from "@/lib/types/customer";
import { fetchCustomers, deleteKunde } from "@/lib/actions/customers";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Plus,
  Loader2,
} from "lucide-react";

const PAGE_SIZE = 14;
// Fixed row height keeps the table stable while data loads
const ROW_HEIGHT = "h-[46px]";

interface CustomerTableProps {
  initialData: Kunde[];
  initialCount: number;
  initialFilterOrte: string[];
}

export function CustomerTable({
  initialData,
  initialCount,
  initialFilterOrte,
}: CustomerTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("nachname");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [filterAktiv, setFilterAktiv] = useState<KundeFilterAktiv>("all");
  const [filterOrt, setFilterOrt] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [kunden, setKunden] = useState<Kunde[]>(initialData);
  const [totalCount, setTotalCount] = useState(initialCount);
  const [filterOrte, setFilterOrte] = useState<string[]>(initialFilterOrte);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

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
    setPendingDeleteId(id);
  };

  const handleDeleteConfirm = async () => {
    if (pendingDeleteId === null) return;
    const id = pendingDeleteId;
    setPendingDeleteId(null);
    setDeletingId(id);
    const result = await deleteKunde(id);
    if (result.success) {
      setKunden((prev) => prev.filter((k) => k.id !== id));
      setTotalCount((c) => c - 1);
      toast.success("Kunde gelöscht");
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

    fetchCustomers({
      search: activeSearch,
      filterOrt,
      filterAktiv,
      sortField,
      sortDirection,
      page: currentPage,
      pageSize: PAGE_SIZE,
    }).then((result) => {
      if (cancelled) return;
      setKunden(result.data);
      setTotalCount(result.totalCount);
      setFilterOrte(result.filterOptions.orte);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [activeSearch, filterAktiv, filterOrt, sortField, sortDirection, currentPage]);

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

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field)
      return <ArrowUpDown className="ml-1 h-3 w-3 text-muted-foreground/50" />;
    return sortDirection === "asc" ? (
      <ArrowUp className="ml-1 h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3" />
    );
  };

  // ── Stable-height row rendering ──────────────────────────────────────────
  // Always emit exactly PAGE_SIZE rows. Loading → skeletons. Data → real rows
  // plus transparent filler rows so the table height never changes.
  const fillerCount = Math.max(0, PAGE_SIZE - kunden.length);

  const COLSPAN = 11;

  return (
    <div className="flex flex-col min-h-0 flex-1">
      <AlertDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => { if (!open) setPendingDeleteId(null); }}
      >
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Kunde löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Dieser Vorgang kann nicht rückgängig gemacht werden. Der Kunde
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

      {/* Toolbar */}
      <div className="flex items-center justify-between shrink-0 pb-4 gap-3">
        {/* Left: search + pagination */}
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Kunden suchen…"
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

        {/* Right: filter + new */}
        <div className="flex items-center gap-2">
          <Select
            value={filterAktiv}
            onValueChange={(v) => {
              setFilterAktiv(v as KundeFilterAktiv);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle</SelectItem>
              <SelectItem value="aktiv">Ist Kunde</SelectItem>
              <SelectItem value="inaktiv">Kein Kunde</SelectItem>
            </SelectContent>
          </Select>
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
          <Button onClick={() => router.push("/master-data/customers/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Neuer Kunde
          </Button>
        </div>
      </div>

      {/* Table — flex-1 min-h-0 fills the space between toolbar and pagination */}
      <div className="rounded-md border overflow-auto flex-1 min-h-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[70px]">
                <button
                  onClick={() => handleSort("ist_kunde")}
                  className="flex items-center font-medium hover:text-foreground"
                >
                  Status
                  <SortIcon field="ist_kunde" />
                </button>
              </TableHead>
              <TableHead className="w-[100px]">
                <button
                  onClick={() => handleSort("kundennr")}
                  className="flex items-center font-medium hover:text-foreground"
                >
                  Kd.-Nr.
                  <SortIcon field="kundennr" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort("vorname")}
                  className="flex items-center font-medium hover:text-foreground"
                >
                  Vorname
                  <SortIcon field="vorname" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort("nachname")}
                  className="flex items-center font-medium hover:text-foreground"
                >
                  Nachname
                  <SortIcon field="nachname" />
                </button>
              </TableHead>
              <TableHead>Straße</TableHead>
              <TableHead className="w-[80px]">Hausnr.</TableHead>
              <TableHead className="w-[90px]">
                <button
                  onClick={() => handleSort("plz")}
                  className="flex items-center font-medium hover:text-foreground"
                >
                  PLZ
                  <SortIcon field="plz" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort("ort")}
                  className="flex items-center font-medium hover:text-foreground"
                >
                  Ort
                  <SortIcon field="ort" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort("telefonnr")}
                  className="flex items-center font-medium hover:text-foreground"
                >
                  Telefon
                  <SortIcon field="telefonnr" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort("email")}
                  className="flex items-center font-medium hover:text-foreground"
                >
                  E-Mail
                  <SortIcon field="email" />
                </button>
              </TableHead>
              <TableHead className="w-[90px]" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              // ── Loading: 15 skeleton rows ────────────────────────────────
              Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <TableRow key={`sk-${i}`} className={ROW_HEIGHT}>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-14" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell />
                </TableRow>
              ))
            ) : kunden.length === 0 ? (
              // ── Empty state + filler rows ────────────────────────────────
              <>
                <TableRow className={ROW_HEIGHT}>
                  <TableCell
                    colSpan={COLSPAN}
                    className="text-center text-muted-foreground"
                  >
                    Keine Kunden gefunden.
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
              // ── Data rows + filler rows ──────────────────────────────────
              <>
                {kunden.map((kunde) => (
                  <TableRow
                    key={kunde.id}
                    className={`${ROW_HEIGHT} cursor-pointer`}
                    onClick={() => router.push(`/master-data/customers/${kunde.id}`)}
                  >
                    <TableCell>
                      {kunde.ist_kunde ? (
                        <span className="text-success text-sm font-medium">
                          Kunde
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          Kein Kunde
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {kunde.kundennr}
                    </TableCell>
                    <TableCell>{kunde.vorname}</TableCell>
                    <TableCell className="font-medium">{kunde.nachname}</TableCell>
                    <TableCell className="text-muted-foreground">{kunde.strasse}</TableCell>
                    <TableCell className="text-muted-foreground">{kunde.hausnr}</TableCell>
                    <TableCell className="text-muted-foreground">{kunde.plz}</TableCell>
                    <TableCell>{kunde.ort}</TableCell>
                    <TableCell className="text-muted-foreground">{kunde.telefonnr}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {kunde.email ? (
                        <a
                          href={`mailto:${kunde.email}`}
                          onClick={(e) => e.stopPropagation()}
                          className="hover:underline"
                        >
                          {kunde.email}
                        </a>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={deletingId === kunde.id}
                        onClick={(e) => handleDeleteClick(e, kunde.id)}
                      >
                        {deletingId === kunde.id && (
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
