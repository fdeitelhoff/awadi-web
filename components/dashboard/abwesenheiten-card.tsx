"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PlusCircle,
  Pencil,
  Trash2,
  Check,
  X,
  Loader2,
  CalendarOff,
} from "lucide-react";
import {
  createAbwesenheit,
  updateAbwesenheit,
  deleteAbwesenheit,
  type AbwesenheitInput,
} from "@/lib/actions/abwesenheiten";
import type { Abwesenheit } from "@/lib/types/abwesenheit";
import { ABWESENHEIT_TYPEN } from "@/lib/types/abwesenheit";

/** Format a timestamp string ("2026-03-28T08:00:00") to "28.03.2026 08:00". */
function formatDateTime(iso: string) {
  const [datePart, timePart] = iso.split("T");
  const [y, m, d] = datePart.split("-");
  const time = (timePart ?? "").slice(0, 5);
  return time ? `${d}.${m}.${y} ${time} Uhr` : `${d}.${m}.${y}`;
}

/** Normalise any ISO timestamp to the "YYYY-MM-DDTHH:mm" format required by datetime-local inputs. */
function toDatetimeInput(iso: string) {
  return iso.slice(0, 16);
}

// ── AbwesenheitItem ──────────────────────────────────────────────────────────

interface AbwesenheitItemProps {
  item: Abwesenheit;
  onUpdated: (updated: Abwesenheit) => void;
  onDeleted: (id: number) => void;
}

function AbwesenheitItem({ item, onUpdated, onDeleted }: AbwesenheitItemProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<AbwesenheitInput>({
    typ: item.typ,
    von: toDatetimeInput(item.von),
    bis: toDatetimeInput(item.bis),
    bemerkung: item.bemerkung ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!draft.von || !draft.bis) return;
    setSaving(true);
    setError(null);
    const result = await updateAbwesenheit(item.id, draft);
    setSaving(false);
    if (!result.success) {
      setError(result.error ?? "Fehler beim Speichern.");
    } else if (result.abwesenheit) {
      onUpdated(result.abwesenheit);
      setEditing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    const result = await deleteAbwesenheit(item.id);
    if (!result.success) {
      setDeleting(false);
      setConfirmDelete(false);
      setError(result.error ?? "Fehler beim Löschen.");
    } else {
      onDeleted(item.id);
    }
  };

  if (editing) {
    return (
      <div className="rounded-md border p-3 space-y-3 bg-muted/30">
        <div className="grid grid-cols-[1fr_1fr_1fr] gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Typ</Label>
            <Select
              value={draft.typ}
              onValueChange={(v) => setDraft((p) => ({ ...p, typ: v }))}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ABWESENHEIT_TYPEN.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Von</Label>
            <Input
              type="datetime-local"
              className="h-8 text-sm"
              value={draft.von}
              onChange={(e) => setDraft((p) => ({ ...p, von: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Bis</Label>
            <Input
              type="datetime-local"
              className="h-8 text-sm"
              value={draft.bis}
              onChange={(e) => setDraft((p) => ({ ...p, bis: e.target.value }))}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Bemerkung</Label>
          <Input
            className="h-8 text-sm"
            value={draft.bemerkung ?? ""}
            placeholder="Optional"
            onChange={(e) =>
              setDraft((p) => ({ ...p, bemerkung: e.target.value }))
            }
          />
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || !draft.von || !draft.bis}
          >
            {saving ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Check className="h-3 w-3" />
            )}
            Speichern
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setEditing(false);
              setDraft({ typ: item.typ, von: toDatetimeInput(item.von), bis: toDatetimeInput(item.bis), bemerkung: item.bemerkung ?? "" });
              setError(null);
            }}
            disabled={saving}
          >
            <X className="h-3 w-3" />
            Abbrechen
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium bg-muted text-foreground">
            {item.typ}
          </span>
          <span className="text-sm text-foreground">
            {formatDateTime(item.von)}
            {item.von !== item.bis && (
              <> &ndash; {formatDateTime(item.bis)}</>
            )}
          </span>
          {item.bemerkung && (
            <span className="text-xs text-muted-foreground truncate">
              {item.bemerkung}
            </span>
          )}
        </div>
        {error && <p className="text-xs text-destructive mt-1">{error}</p>}
      </div>

      <div className="shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={() => {
            setEditing(true);
            setConfirmDelete(false);
            setError(null);
          }}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>

        {confirmDelete ? (
          <>
            <Button
              type="button"
              size="icon"
              variant="destructive"
              className="h-6 w-6"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={() => setConfirmDelete(false)}
              disabled={deleting}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </>
        ) : (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-6 w-6 text-muted-foreground hover:text-destructive"
            onClick={handleDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}

// ── AbwesenheitenCard ────────────────────────────────────────────────────────

interface AbwesenheitenCardProps {
  userId: string | null;
  initialAbwesenheiten: Abwesenheit[];
}

const EMPTY_FORM: AbwesenheitInput = {
  typ: "Urlaub",
  von: "",
  bis: "",
  bemerkung: "",
};

export function AbwesenheitenCard({
  userId,
  initialAbwesenheiten,
}: AbwesenheitenCardProps) {
  const [items, setItems] = useState<Abwesenheit[]>(initialAbwesenheiten);
  const [adding, setAdding] = useState(false);
  const [newForm, setNewForm] = useState<AbwesenheitInput>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!userId || !newForm.von || !newForm.bis) return;
    setSaving(true);
    setAddError(null);
    const result = await createAbwesenheit(userId, newForm);
    setSaving(false);
    if (!result.success) {
      setAddError(result.error ?? "Fehler beim Speichern.");
    } else if (result.abwesenheit) {
      setItems((prev) =>
        [...prev, result.abwesenheit!].sort((a, b) => a.von.localeCompare(b.von))
      );
      setNewForm(EMPTY_FORM);
      setAdding(false);
    }
  };

  const handleUpdated = (updated: Abwesenheit) => {
    setItems((prev) =>
      prev
        .map((item) => (item.id === updated.id ? updated : item))
        .sort((a, b) => a.von.localeCompare(b.von))
    );
  };

  const handleDeleted = (id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            Abwesenheiten
            {items.length > 0 && (
              <span className="ml-1.5 text-sm font-normal text-muted-foreground">
                ({items.length})
              </span>
            )}
          </CardTitle>
          {userId && !adding && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-muted-foreground hover:text-foreground"
              onClick={() => setAdding(true)}
            >
              <PlusCircle className="h-4 w-4 mr-1" />
              Hinzufügen
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Add form */}
        {adding && (
          <div className="rounded-md border p-3 space-y-3 bg-muted/30">
            <div className="grid grid-cols-[1fr_1fr_1fr] gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Typ</Label>
                <Select
                  value={newForm.typ}
                  onValueChange={(v) => setNewForm((p) => ({ ...p, typ: v }))}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ABWESENHEIT_TYPEN.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Von</Label>
                <Input
                  type="datetime-local"
                  className="h-8 text-sm"
                  value={newForm.von}
                  onChange={(e) =>
                    setNewForm((p) => ({ ...p, von: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Bis</Label>
                <Input
                  type="datetime-local"
                  className="h-8 text-sm"
                  value={newForm.bis}
                  onChange={(e) =>
                    setNewForm((p) => ({ ...p, bis: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Bemerkung</Label>
              <Input
                className="h-8 text-sm"
                value={newForm.bemerkung ?? ""}
                placeholder="Optional"
                onChange={(e) =>
                  setNewForm((p) => ({ ...p, bemerkung: e.target.value }))
                }
              />
            </div>
            {addError && <p className="text-xs text-destructive">{addError}</p>}
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                onClick={handleAdd}
                disabled={saving || !newForm.von || !newForm.bis}
              >
                {saving ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Check className="h-3 w-3" />
                )}
                Speichern
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setAdding(false);
                  setNewForm(EMPTY_FORM);
                  setAddError(null);
                }}
                disabled={saving}
              >
                <X className="h-3 w-3" />
                Abbrechen
              </Button>
            </div>
          </div>
        )}

        {/* Placeholder for create form (no userId yet) */}
        {!userId && (
          <p className="text-sm text-muted-foreground py-2">
            Abwesenheiten können nach dem Anlegen des Benutzers hinzugefügt werden.
          </p>
        )}

        {/* Empty state */}
        {userId && items.length === 0 && !adding && (
          <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
            <CalendarOff className="h-8 w-8 mb-2 opacity-30" />
            <p className="text-sm">Keine Abwesenheiten eingetragen.</p>
          </div>
        )}

        {/* List */}
        {items.map((item) => (
          <AbwesenheitItem
            key={item.id}
            item={item}
            onUpdated={handleUpdated}
            onDeleted={handleDeleted}
          />
        ))}
      </CardContent>
    </Card>
  );
}
