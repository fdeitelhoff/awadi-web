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
import { Badge } from "@/components/ui/badge";
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
  Profile,
  ProfileSortField,
  SortDirection,
  UserRolle,
} from "@/lib/types/profile";
import { fetchProfiles, deleteProfile } from "@/lib/actions/profiles";
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
const COLSPAN = 7;

interface UserTableProps {
  initialData: Profile[];
  initialCount: number;
  rollen: UserRolle[];
}

export function UserTable({ initialData, initialCount, rollen }: UserTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [sortField, setSortField] = useState<ProfileSortField>("nachname");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [filterRollenId, setFilterRollenId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [profiles, setProfiles] = useState<Profile[]>(initialData);
  const [totalCount, setTotalCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
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

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteError(null);
    setPendingDeleteId(id);
  };

  const handleDeleteConfirm = async () => {
    if (pendingDeleteId === null) return;
    const id = pendingDeleteId;
    setPendingDeleteId(null);
    setDeletingId(id);
    const result = await deleteProfile(id);
    if (result.success) {
      setProfiles((prev) => prev.filter((p) => p.id !== id));
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

    fetchProfiles({
      search: activeSearch,
      filterRollenId: filterRollenId ?? undefined,
      sortField,
      sortDirection,
      page: currentPage,
      pageSize: PAGE_SIZE,
    }).then((result) => {
      if (cancelled) return;
      setProfiles(result.data);
      setTotalCount(result.totalCount);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [activeSearch, filterRollenId, sortField, sortDirection, currentPage]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const handleFilterChange = (value: string) => {
    setFilterRollenId(value === "all" ? null : parseInt(value, 10));
    setCurrentPage(1);
  };

  const handleSort = (field: ProfileSortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  const SortIcon = ({ field }: { field: ProfileSortField }) => {
    if (sortField !== field)
      return <ArrowUpDown className="ml-1 h-3 w-3 text-muted-foreground/50" />;
    return sortDirection === "asc" ? (
      <ArrowUp className="ml-1 h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3" />
    );
  };

  const fillerCount = Math.max(0, PAGE_SIZE - profiles.length);

  return (
    <div className="flex flex-col min-h-0 flex-1">
      <AlertDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => { if (!open) setPendingDeleteId(null); }}
      >
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Benutzer löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Dieser Vorgang kann nicht rückgängig gemacht werden. Das Profil
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
              placeholder="Benutzer suchen…"
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

        {/* Right: role filter + new */}
        <div className="flex items-center gap-2">
          <Select
            value={filterRollenId == null ? "all" : String(filterRollenId)}
            onValueChange={handleFilterChange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Rolle filtern" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Rollen</SelectItem>
              {rollen.map((r) => (
                <SelectItem key={r.id} value={String(r.id)}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => router.push("/settings/users/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Neuer Benutzer
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-auto flex-1 min-h-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Aktiv</TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort("email")}
                  className="flex items-center font-medium hover:text-foreground"
                >
                  E-Mail
                  <SortIcon field="email" />
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
              <TableHead>
                <button
                  onClick={() => handleSort("rollen_id")}
                  className="flex items-center font-medium hover:text-foreground"
                >
                  Rolle
                  <SortIcon field="rollen_id" />
                </button>
              </TableHead>
              <TableHead>Telefon</TableHead>
              <TableHead className="w-[90px]" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <TableRow key={`sk-${i}`} className={ROW_HEIGHT}>
                  <TableCell><Skeleton className="h-5 w-12 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell />
                </TableRow>
              ))
            ) : profiles.length === 0 ? (
              <>
                <TableRow className={ROW_HEIGHT}>
                  <TableCell
                    colSpan={COLSPAN}
                    className="text-center text-muted-foreground"
                  >
                    Keine Benutzer gefunden.
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
                {profiles.map((profile) => (
                  <TableRow
                    key={profile.id}
                    className={`${ROW_HEIGHT} cursor-pointer`}
                    onClick={() => router.push(`/settings/users/${profile.id}`)}
                  >
                    <TableCell>
                      {profile.aktiv ? (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          Aktiv
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          Inaktiv
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{profile.email}</TableCell>
                    <TableCell>{profile.vorname}</TableCell>
                    <TableCell>{profile.nachname}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {profile.rollen_name ?? profile.rollen_id}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{profile.telefonnr}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={deletingId === profile.id}
                        onClick={(e) => handleDeleteClick(e, profile.id)}
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
