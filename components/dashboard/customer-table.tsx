"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
import type { Customer, SortField, SortDirection } from "@/lib/types/customer";
import { fetchCustomers } from "@/lib/actions/customers";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const PAGE_SIZE = 10;

export function CustomerTable() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("nachname");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [filterOrt, setFilterOrt] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [filterOrte, setFilterOrte] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Debounce search input
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setCurrentPage(1);
    }, 300);
  }, []);

  // Cleanup debounce timer
  useEffect(() => {
    return () => clearTimeout(debounceRef.current);
  }, []);

  // Fetch data when params change
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    fetchCustomers({
      search: debouncedSearch,
      filterOrt,
      sortField,
      sortDirection,
      page: currentPage,
      pageSize: PAGE_SIZE,
    }).then((result) => {
      if (cancelled) return;
      setCustomers(result.data);
      setTotalCount(result.totalCount);
      setFilterOrte(result.filterOptions.orte);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, filterOrt, sortField, sortDirection, currentPage]);

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

  const formatAddress = (c: Customer) => {
    const parts = [];
    if (c.strasse) {
      parts.push(c.strasse + (c.hausNr ? " " + c.hausNr : ""));
    }
    if (c.plz || c.ort) {
      parts.push([c.plz, c.ort].filter(Boolean).join(" "));
    }
    return parts.join(", ");
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Kunden suchen..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-8"
          />
        </div>
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
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button
                  onClick={() => handleSort("eigentuemerNr")}
                  className="flex items-center font-medium hover:text-foreground"
                >
                  Kd-Nr.
                  <SortIcon field="eigentuemerNr" />
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
              <TableHead>
                <button
                  onClick={() => handleSort("vorname")}
                  className="flex items-center font-medium hover:text-foreground"
                >
                  Vorname
                  <SortIcon field="vorname" />
                </button>
              </TableHead>
              <TableHead className="hidden lg:table-cell">Adresse</TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort("ort")}
                  className="flex items-center font-medium hover:text-foreground"
                >
                  Ort
                  <SortIcon field="ort" />
                </button>
              </TableHead>
              <TableHead className="hidden md:table-cell">
                <button
                  onClick={() => handleSort("telefonNr")}
                  className="flex items-center font-medium hover:text-foreground"
                >
                  Telefon
                  <SortIcon field="telefonNr" />
                </button>
              </TableHead>
              <TableHead className="hidden sm:table-cell">
                <button
                  onClick={() => handleSort("email")}
                  className="flex items-center font-medium hover:text-foreground"
                >
                  E-Mail
                  <SortIcon field="email" />
                </button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j} className={j >= 5 ? "hidden sm:table-cell" : j >= 4 ? "hidden md:table-cell" : j === 3 ? "hidden lg:table-cell" : ""}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  Keine Kunden gefunden.
                </TableCell>
              </TableRow>
            ) : (
              customers.map((customer) => (
                <TableRow key={customer.anlId}>
                  <TableCell className="font-medium text-muted-foreground">
                    {customer.eigentuemerNr}
                  </TableCell>
                  <TableCell className="font-medium">
                    {customer.nachname}
                  </TableCell>
                  <TableCell>{customer.vorname}</TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">
                    {formatAddress(customer)}
                  </TableCell>
                  <TableCell>{customer.ort}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {customer.telefonNr}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {customer.email}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {totalCount} Kunde{totalCount !== 1 && "n"}
          {filterOrt !== "all" || debouncedSearch ? " (gefiltert)" : ""}
        </p>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              Seite {currentPage} von {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
