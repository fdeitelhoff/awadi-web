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
  TicketListItem,
  TicketStatus,
  TicketPriorität,
  TicketSortField,
  SortDirection,
} from "@/lib/types/ticket";
import { fetchTickets, deleteTicket } from "@/lib/actions/tickets";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";

const PAGE_SIZE = 14;
const ROW_HEIGHT = "h-[46px]";
const COLSPAN = 9;

// ── Badge helpers ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: TicketStatus }) {
  const config: Record<TicketStatus, { label: string; className: string }> = {
    offen:       { label: "Offen",       className: "bg-info/15 text-info" },
    eingeplant:  { label: "Eingeplant",  className: "bg-warning/15 text-warning" },
    "gelöst":    { label: "Gelöst",      className: "bg-success/15 text-success" },
    geschlossen: { label: "Geschlossen", className: "bg-muted text-muted-foreground" },
  };
  const { label, className } = config[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

function PrioritätBadge({ priorität }: { priorität: TicketPriorität }) {
  const config: Record<TicketPriorität, { label: string; className: string }> = {
    normal:   { label: "Normal",   className: "bg-muted text-muted-foreground" },
    hoch:     { label: "Hoch",     className: "bg-warning/15 text-warning" },
    dringend: { label: "Dringend", className: "bg-destructive/15 text-destructive" },
  };
  const { label, className } = config[priorität];
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface TicketTableProps {
  initialData: TicketListItem[];
  initialCount: number;
}

export function TicketTable({ initialData, initialCount }: TicketTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [sortField, setSortField] = useState<TicketSortField>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [filterStatus, setFilterStatus] = useState<TicketStatus | "all">("all");
  const [filterPriorität, setFilterPriorität] = useState<TicketPriorität | "all">("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [tickets, setTickets] = useState<TicketListItem[]>(initialData);
  const [totalCount, setTotalCount] = useState(initialCount);
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
    const result = await deleteTicket(id);
    if (result.success) {
      setTickets((prev) => prev.filter((t) => t.id !== id));
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

    fetchTickets({
      search: activeSearch,
      filterStatus,
      filterPriorität,
      sortField,
      sortDirection,
      page: currentPage,
      pageSize: PAGE_SIZE,
    }).then((result) => {
      if (cancelled) return;
      setTickets(result.data);
      setTotalCount(result.totalCount);
      setIsLoading(false);
    });

    return () => { cancelled = true; };
  }, [activeSearch, filterStatus, filterPriorität, sortField, sortDirection, currentPage]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const fillerCount = Math.max(0, PAGE_SIZE - tickets.length);

  const handleSort = (field: TicketSortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  const SortIcon = ({ field }: { field: TicketSortField }) => {
    if (sortField !== field)
      return <ArrowUpDown className="ml-1 h-3 w-3 text-muted-foreground/50" />;
    return sortDirection === "asc"
      ? <ArrowUp className="ml-1 h-3 w-3" />
      : <ArrowDown className="ml-1 h-3 w-3" />;
  };

  return (
    <div className="flex flex-col min-h-0 flex-1">
      {/* Confirm delete dialog */}
      <AlertDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => { if (!open) setPendingDeleteId(null); }}
      >
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Ticket löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Dieser Vorgang kann nicht rückgängig gemacht werden. Das Ticket
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
            <AlertDialogAction onClick={() => setDeleteError(null)}>OK</AlertDialogAction>
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
              placeholder="Tickets suchen…"
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
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || isLoading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Right: filters + new */}
        <div className="flex items-center gap-2">
          <Select
            value={filterStatus}
            onValueChange={(v) => {
              setFilterStatus(v as TicketStatus | "all");
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Status</SelectItem>
              <SelectItem value="offen">Offen</SelectItem>
              <SelectItem value="eingeplant">Eingeplant</SelectItem>
              <SelectItem value="gelöst">Gelöst</SelectItem>
              <SelectItem value="geschlossen">Geschlossen</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filterPriorität}
            onValueChange={(v) => {
              setFilterPriorität(v as TicketPriorität | "all");
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Prioritäten</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="hoch">Hoch</SelectItem>
              <SelectItem value="dringend">Dringend</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={() => router.push("/tickets/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Neues Ticket
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-auto flex-1 min-h-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[130px]">
                <button
                  onClick={() => handleSort("ticket_nr")}
                  className="flex items-center font-medium hover:text-foreground"
                >
                  Ticket-Nr.
                  <SortIcon field="ticket_nr" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort("titel")}
                  className="flex items-center font-medium hover:text-foreground"
                >
                  Titel
                  <SortIcon field="titel" />
                </button>
              </TableHead>
              <TableHead className="w-[120px]">
                <button
                  onClick={() => handleSort("status")}
                  className="flex items-center font-medium hover:text-foreground"
                >
                  Status
                  <SortIcon field="status" />
                </button>
              </TableHead>
              <TableHead className="w-[110px]">
                <button
                  onClick={() => handleSort("prioritaet")}
                  className="flex items-center font-medium hover:text-foreground"
                >
                  Priorität
                  <SortIcon field="prioritaet" />
                </button>
              </TableHead>
              <TableHead>Kontakt</TableHead>
              <TableHead>E-Mail</TableHead>
              <TableHead>Anlage</TableHead>
              <TableHead className="w-[120px]">
                <button
                  onClick={() => handleSort("created_at")}
                  className="flex items-center font-medium hover:text-foreground"
                >
                  Erstellt am
                  <SortIcon field="created_at" />
                </button>
              </TableHead>
              <TableHead className="w-[90px]" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <TableRow key={`sk-${i}`} className={ROW_HEIGHT}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell />
                </TableRow>
              ))
            ) : tickets.length === 0 ? (
              <>
                <TableRow className={ROW_HEIGHT}>
                  <TableCell
                    colSpan={COLSPAN}
                    className="text-center text-muted-foreground"
                  >
                    Keine Tickets gefunden.
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
                {tickets.map((ticket) => (
                  <TableRow
                    key={ticket.id}
                    className={`${ROW_HEIGHT} cursor-pointer`}
                    onClick={() => router.push(`/tickets/${ticket.id}`)}
                  >
                    <TableCell className="font-medium text-muted-foreground">
                      {ticket.ticket_nr ?? "—"}
                    </TableCell>
                    <TableCell className="font-medium">{ticket.titel}</TableCell>
                    <TableCell>
                      <StatusBadge status={ticket.status} />
                    </TableCell>
                    <TableCell>
                      <PrioritätBadge priorität={ticket.prioritaet} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {ticket.kunden_name ??
                        ([ticket.vorname, ticket.nachname]
                          .filter(Boolean)
                          .join(" ") || "—")}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {ticket.email ? (
                        <a
                          href={`mailto:${ticket.email}`}
                          onClick={(e) => e.stopPropagation()}
                          className="hover:underline"
                        >
                          {ticket.email}
                        </a>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {ticket.anlagen_nr ?? ticket.anlage_name ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(ticket.created_at).toLocaleDateString("de-DE")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={deletingId === ticket.id}
                        onClick={(e) => handleDeleteClick(e, ticket.id)}
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
