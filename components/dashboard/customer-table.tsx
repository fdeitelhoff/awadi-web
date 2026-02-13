"use client";

import { useState, useMemo } from "react";
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
import { Customer } from "@/lib/types/customer";
import { customers } from "@/lib/data/mock-customers";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type SortField =
  | "eigentuemerNr"
  | "nachname"
  | "vorname"
  | "ort"
  | "plz"
  | "email"
  | "telefonNr";
type SortDirection = "asc" | "desc";

const PAGE_SIZE = 10;

export function CustomerTable() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("nachname");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [filterOrt, setFilterOrt] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Get unique cities for filter
  const uniqueOrte = useMemo(() => {
    const orte = new Set(customers.map((c) => c.ort).filter(Boolean));
    return Array.from(orte).sort() as string[];
  }, []);

  // Filter, search, sort
  const filteredCustomers = useMemo(() => {
    let result = [...customers];

    // Filter by Ort
    if (filterOrt !== "all") {
      result = result.filter((c) => c.ort === filterOrt);
    }

    // Search across multiple fields
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.nachname.toLowerCase().includes(query) ||
          c.vorname.toLowerCase().includes(query) ||
          (c.firma && c.firma.toLowerCase().includes(query)) ||
          (c.eigentuemerNr && c.eigentuemerNr.toLowerCase().includes(query)) ||
          (c.ort && c.ort.toLowerCase().includes(query)) ||
          (c.plz && c.plz.toLowerCase().includes(query)) ||
          (c.email && c.email.toLowerCase().includes(query)) ||
          (c.strasse && c.strasse.toLowerCase().includes(query))
      );
    }

    // Sort
    result.sort((a, b) => {
      const aVal = (a[sortField] ?? "").toString().toLowerCase();
      const bVal = (b[sortField] ?? "").toString().toLowerCase();
      const cmp = aVal.localeCompare(bVal, "de");
      return sortDirection === "asc" ? cmp : -cmp;
    });

    return result;
  }, [searchQuery, sortField, sortDirection, filterOrt]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / PAGE_SIZE));
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // Reset page when filters change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };
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
              {uniqueOrte.map((ort) => (
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
            {paginatedCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  Keine Kunden gefunden.
                </TableCell>
              </TableRow>
            ) : (
              paginatedCustomers.map((customer) => (
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
          {filteredCustomers.length} Kunde{filteredCustomers.length !== 1 && "n"}
          {filterOrt !== "all" || searchQuery ? " (gefiltert)" : ""}
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
