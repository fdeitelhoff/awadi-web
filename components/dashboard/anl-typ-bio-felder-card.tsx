"use client";

import { useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { AnlTypBioFeld } from "@/lib/types/anl-typ";
import {
  createBioFeld,
  updateBioFeld,
  deleteBioFeld,
  reorderBioFelder,
} from "@/lib/actions/anl-typen";
import {
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Loader2,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

export type DraftBioFeld = { bio_key: string; bio_name: string | null };

type LiveProps = {
  draft?: false;
  anl_typ_id: number;
  initialFelder: AnlTypBioFeld[];
  onDraftChange?: never;
};

type DraftProps = {
  draft: true;
  anl_typ_id?: never;
  initialFelder?: never;
  onDraftChange: (felder: DraftBioFeld[]) => void;
};

type Props = LiveProps | DraftProps;

type Row = { id: number; sortiernr: number; bio_key: string; bio_name: string | null };

type EditState =
  | { mode: "none" }
  | { mode: "edit"; id: number; key: string; name: string }
  | { mode: "new"; key: string; name: string };

let draftIdCounter = -1;
const nextDraftId = () => draftIdCounter--;

// ── Sortable row wrapper ───────────────────────────────────────────────────────

interface SortableRowProps {
  row: Row;
  index: number;
  total: number;
  isBusy: boolean;
  editMode: EditState["mode"];
  deletingId: number | null;
  edit: EditState;
  saving: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onStartEdit: () => void;
  onDelete: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onEditField: (field: "key" | "name", value: string) => void;
}

function SortableRow({
  row,
  index,
  total,
  isBusy,
  editMode,
  deletingId,
  edit,
  saving,
  onMoveUp,
  onMoveDown,
  onStartEdit,
  onDelete,
  onSaveEdit,
  onCancelEdit,
  onEditField,
}: SortableRowProps) {
  const isEditing = edit.mode === "edit" && edit.id === row.id;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: row.id, disabled: editMode !== "none" || isBusy });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    cursor: editMode !== "none" || isBusy ? "default" : "grab",
  };

  if (isEditing) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="grid grid-cols-[20px_36px_1fr_1fr_auto] gap-2 items-center"
      >
        <span className="text-xs text-muted-foreground text-right">{index + 1}.</span>
        <span />
        <Input
          value={edit.key}
          onChange={(e) => onEditField("key", e.target.value)}
          placeholder="Key"
          className="h-8 text-sm font-mono"
          autoFocus
          onKeyDown={(e) => { if (e.key === "Enter") onSaveEdit(); if (e.key === "Escape") onCancelEdit(); }}
        />
        <Input
          value={edit.name}
          onChange={(e) => onEditField("name", e.target.value)}
          placeholder="Name (optional)"
          className="h-8 text-sm"
          onKeyDown={(e) => { if (e.key === "Enter") onSaveEdit(); if (e.key === "Escape") onCancelEdit(); }}
        />
        <div className="flex gap-1">
          <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={onSaveEdit} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 text-green-600" />}
          </Button>
          <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={onCancelEdit} disabled={saving}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="grid grid-cols-[20px_36px_1fr_1fr_auto] gap-2 items-center rounded-md px-1 py-0.5 hover:bg-muted/40 group select-none"
    >
      <span className="text-xs text-muted-foreground text-right">{index + 1}.</span>
      <div
        className="flex gap-px"
        // prevent the click events on buttons from triggering drag
        onPointerDown={(e) => e.stopPropagation()}
      >
        <Button
          type="button" size="icon" variant="ghost" className="h-6 w-[17px] p-0"
          onClick={onMoveUp}
          disabled={index === 0 || isBusy || editMode !== "none"}
        >
          <ChevronUp className="h-3 w-3" />
        </Button>
        <Button
          type="button" size="icon" variant="ghost" className="h-6 w-[17px] p-0"
          onClick={onMoveDown}
          disabled={index === total - 1 || isBusy || editMode !== "none"}
        >
          <ChevronDown className="h-3 w-3" />
        </Button>
      </div>
      <span className="text-sm font-mono truncate">{row.bio_key}</span>
      <span className="text-sm text-muted-foreground truncate">{row.bio_name ?? "—"}</span>
      <div
        className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <Button
          type="button" size="icon" variant="ghost" className="h-7 w-7"
          onClick={onStartEdit}
          disabled={isBusy || editMode !== "none"}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button" size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive"
          onClick={onDelete}
          disabled={deletingId === row.id || editMode !== "none"}
        >
          {deletingId === row.id
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <Trash2 className="h-3.5 w-3.5" />}
        </Button>
      </div>
    </div>
  );
}

// ── Main card ─────────────────────────────────────────────────────────────────

export function AnlTypBioFelderCard(props: Props) {
  const isDraft = props.draft === true;

  const [felder, setFelder] = useState<Row[]>(
    isDraft ? [] : (props.initialFelder ?? []).map((f) => ({ ...f }))
  );
  const [edit, setEdit] = useState<EditState>({ mode: "none" });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const notifyDraft = (updated: Row[]) => {
    if (isDraft) {
      props.onDraftChange(
        updated.map((f) => ({ bio_key: f.bio_key, bio_name: f.bio_name }))
      );
    }
  };

  const cancelEdit = () => { setEdit({ mode: "none" }); setError(null); };
  const startEdit = (row: Row) => {
    setEdit({ mode: "edit", id: row.id, key: row.bio_key, name: row.bio_name ?? "" });
    setError(null);
  };
  const startNew = () => { setEdit({ mode: "new", key: "", name: "" }); setError(null); };

  const handleSaveEdit = async () => {
    if (edit.mode !== "edit") return;
    if (!edit.key.trim()) { setError("Key darf nicht leer sein."); return; }

    if (isDraft) {
      const updated = felder.map((f) =>
        f.id === edit.id
          ? { ...f, bio_key: edit.key.trim(), bio_name: edit.name.trim() || null }
          : f
      );
      setFelder(updated);
      notifyDraft(updated);
      setEdit({ mode: "none" });
      return;
    }

    setSaving(true);
    setError(null);
    const result = await updateBioFeld(edit.id, edit.key, edit.name || null);
    setSaving(false);
    if (!result.success) { setError(result.error ?? "Fehler beim Speichern."); return; }
    setFelder((prev) =>
      prev.map((f) =>
        f.id === edit.id
          ? { ...f, bio_key: edit.key.trim(), bio_name: edit.name.trim() || null }
          : f
      )
    );
    setEdit({ mode: "none" });
  };

  const handleSaveNew = async () => {
    if (edit.mode !== "new") return;
    if (!edit.key.trim()) { setError("Key darf nicht leer sein."); return; }

    const nextSortiernr = felder.length + 1;

    if (isDraft) {
      const newRow: Row = {
        id: nextDraftId(),
        sortiernr: nextSortiernr,
        bio_key: edit.key.trim(),
        bio_name: edit.name.trim() || null,
      };
      const updated = [...felder, newRow];
      setFelder(updated);
      notifyDraft(updated);
      setEdit({ mode: "none" });
      return;
    }

    setSaving(true);
    setError(null);
    const result = await createBioFeld(props.anl_typ_id, nextSortiernr, edit.key, edit.name || undefined);
    setSaving(false);
    if (!result.success || !result.id) { setError(result.error ?? "Fehler beim Erstellen."); return; }
    setFelder((prev) => [
      ...prev,
      { id: result.id!, sortiernr: nextSortiernr, bio_key: edit.key.trim(), bio_name: edit.name.trim() || null },
    ]);
    setEdit({ mode: "none" });
  };

  const handleDelete = async (id: number) => {
    if (isDraft) {
      const updated = felder
        .filter((f) => f.id !== id)
        .map((f, i) => ({ ...f, sortiernr: i + 1 }));
      setFelder(updated);
      notifyDraft(updated);
      if (edit.mode === "edit" && edit.id === id) setEdit({ mode: "none" });
      return;
    }

    setDeletingId(id);
    const result = await deleteBioFeld(id);
    setDeletingId(null);
    if (!result.success) { setError(result.error ?? "Fehler beim Löschen."); return; }
    setFelder((prev) => prev.filter((f) => f.id !== id));
    if (edit.mode === "edit" && edit.id === id) setEdit({ mode: "none" });
  };

  const applyReorder = async (updated: Row[]) => {
    setFelder(updated);
    notifyDraft(updated);
    if (!isDraft) {
      await reorderBioFelder(updated.map((f) => ({ id: f.id, sortiernr: f.sortiernr })));
    }
  };

  const moveRow = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= felder.length) return;
    const reindexed = arrayMove(felder, index, targetIndex).map((f, i) => ({
      ...f,
      sortiernr: i + 1,
    }));
    await applyReorder(reindexed);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = felder.findIndex((f) => f.id === active.id);
    const newIndex = felder.findIndex((f) => f.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reindexed = arrayMove(felder, oldIndex, newIndex).map((f, i) => ({
      ...f,
      sortiernr: i + 1,
    }));
    await applyReorder(reindexed);
  };

  const setEditField = (field: "key" | "name", value: string) => {
    if (edit.mode === "none") return;
    setEdit((prev) => ({ ...prev, [field]: value }));
  };

  const isBusy = saving || deletingId !== null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">Bio-Felder</CardTitle>
        {edit.mode === "none" && (
          <Button type="button" variant="outline" size="sm" onClick={startNew}>
            <Plus className="h-4 w-4 mr-1" />
            Hinzufügen
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-1 pt-0">

        {felder.length > 0 && (
          <div className="grid grid-cols-[20px_36px_1fr_1fr_auto] gap-2 px-1 pb-1">
            <span />
            <span />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Key</span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Name</span>
            <span />
          </div>
        )}

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={felder.map((f) => f.id)} strategy={verticalListSortingStrategy}>
            {felder.map((row, index) => (
              <SortableRow
                key={row.id}
                row={row}
                index={index}
                total={felder.length}
                isBusy={isBusy}
                editMode={edit.mode}
                deletingId={deletingId}
                edit={edit}
                saving={saving}
                onMoveUp={() => moveRow(index, -1)}
                onMoveDown={() => moveRow(index, 1)}
                onStartEdit={() => startEdit(row)}
                onDelete={() => handleDelete(row.id)}
                onSaveEdit={handleSaveEdit}
                onCancelEdit={cancelEdit}
                onEditField={setEditField}
              />
            ))}
          </SortableContext>
        </DndContext>

        {edit.mode === "new" && (
          <div className="grid grid-cols-[20px_36px_1fr_1fr_auto] gap-2 items-center pt-1 border-t">
            <span className="text-xs text-muted-foreground text-right">{felder.length + 1}.</span>
            <span />
            <Input
              value={edit.key}
              onChange={(e) => setEditField("key", e.target.value)}
              placeholder="Key"
              className="h-8 text-sm font-mono"
              autoFocus
              onKeyDown={(e) => { if (e.key === "Enter") handleSaveNew(); if (e.key === "Escape") cancelEdit(); }}
            />
            <Input
              value={edit.name}
              onChange={(e) => setEditField("name", e.target.value)}
              placeholder="Name (optional)"
              className="h-8 text-sm"
              onKeyDown={(e) => { if (e.key === "Enter") handleSaveNew(); if (e.key === "Escape") cancelEdit(); }}
            />
            <div className="flex gap-1">
              <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={handleSaveNew} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 text-green-600" />}
              </Button>
              <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={cancelEdit} disabled={saving}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {felder.length === 0 && edit.mode === "none" && (
          <p className="text-sm text-muted-foreground py-2 text-center">
            Keine Bio-Felder definiert.
          </p>
        )}

        {error && <p className="text-xs text-destructive pt-1">{error}</p>}
      </CardContent>
    </Card>
  );
}
