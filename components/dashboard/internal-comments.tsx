"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  PlusCircle,
  Pencil,
  Trash2,
  Check,
  X,
  Loader2,
  MessageSquare,
} from "lucide-react";
import {
  createInternalComment,
  updateInternalComment,
  deleteInternalComment,
} from "@/lib/actions/kommentare";
import type { InternalComment } from "@/lib/types/kommentar";

interface InternalCommentsProps {
  refTable: string;
  refId: number | string;
  initialComments: InternalComment[];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getInitials(name?: string): string {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

interface CommentItemProps {
  comment: InternalComment;
  onUpdated: (updated: InternalComment) => void;
  onDeleted: (id: number) => void;
}

function CommentItem({ comment, onUpdated, onDeleted }: CommentItemProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.kommentar);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing) {
      textareaRef.current?.focus();
      const len = draft.length;
      textareaRef.current?.setSelectionRange(len, len);
    }
  }, [editing, draft.length]);

  const handleSave = async () => {
    if (!draft.trim()) return;
    setSaving(true);
    setError(null);
    const result = await updateInternalComment(comment.id, draft);
    setSaving(false);
    if (!result.success) {
      setError(result.error ?? "Fehler beim Speichern.");
    } else if (result.comment) {
      onUpdated(result.comment);
      setEditing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    const result = await deleteInternalComment(comment.id);
    if (!result.success) {
      setDeleting(false);
      setConfirmDelete(false);
      setError(result.error ?? "Fehler beim Löschen.");
    } else {
      onDeleted(comment.id);
    }
  };

  const wasEdited =
    comment.updated_at && comment.updated_at !== comment.created_at;

  return (
    <div className="flex gap-3 group">
      {/* Avatar */}
      <div className="shrink-0 mt-0.5">
        <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-semibold text-muted-foreground select-none">
          {getInitials(comment.user_name)}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        {/* Meta row */}
        <div className="flex items-baseline gap-2 flex-wrap mb-1">
          <span className="text-xs font-medium text-foreground">
            {comment.user_name ?? "Unbekannt"}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatDate(comment.created_at)}
          </span>
          {wasEdited && (
            <span className="text-[10px] text-muted-foreground italic">
              (bearbeitet {formatDate(comment.updated_at!)})
            </span>
          )}
        </div>

        {/* Content / Edit mode */}
        {editing ? (
          <div className="space-y-2">
            <Textarea
              ref={textareaRef}
              rows={3}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setEditing(false);
                  setDraft(comment.kommentar);
                  setError(null);
                }
              }}
              className="text-sm resize-none"
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving || !draft.trim()}
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
                  setDraft(comment.kommentar);
                  setError(null);
                }}
                disabled={saving}
              >
                <X className="h-3 w-3" />
                Abbrechen
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm whitespace-pre-wrap break-words text-foreground/90">
              {comment.kommentar}
            </p>
            {error && (
              <p className="text-xs text-destructive mt-1">{error}</p>
            )}
          </div>
        )}
      </div>

      {/* Action buttons — visible on hover */}
      {!editing && (
        <div className="shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">
          <Button
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
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-muted-foreground hover:text-destructive"
              onClick={handleDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export function InternalComments({
  refTable,
  refId,
  initialComments,
}: InternalCommentsProps) {
  const [comments, setComments] = useState<InternalComment[]>(initialComments);
  const [adding, setAdding] = useState(false);
  const [newText, setNewText] = useState("");
  const [saving, setSaving] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const addTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (adding) {
      addTextareaRef.current?.focus();
    }
  }, [adding]);

  const handleAdd = async () => {
    if (!newText.trim()) return;
    setSaving(true);
    setAddError(null);
    const result = await createInternalComment(refTable, refId, newText);
    setSaving(false);
    if (!result.success) {
      setAddError(result.error ?? "Fehler beim Speichern.");
    } else if (result.comment) {
      setComments((prev) => [result.comment!, ...prev]);
      setNewText("");
      setAdding(false);
    }
  };

  const handleUpdated = (updated: InternalComment) => {
    setComments((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c))
    );
  };

  const handleDeleted = (id: number) => {
    setComments((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            Interne Anmerkungen
            {comments.length > 0 && (
              <span className="ml-1.5 text-sm font-normal text-muted-foreground">
                ({comments.length})
              </span>
            )}
          </CardTitle>
          {!adding && (
            <Button
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

      {/* Add form — pinned above the scroll area */}
      {adding && (
        <div className="px-6 pb-4 shrink-0 border-b space-y-2">
          <Textarea
            ref={addTextareaRef}
            rows={3}
            placeholder="Anmerkung eingeben…"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setAdding(false);
                setNewText("");
                setAddError(null);
              }
            }}
            className="text-sm resize-none"
          />
          {addError && (
            <p className="text-xs text-destructive">{addError}</p>
          )}
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={saving || !newText.trim()}
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
                setAdding(false);
                setNewText("");
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

      {/* Scrollable comment list */}
      <CardContent className="overflow-y-auto max-h-[320px] space-y-4 pt-4">
        {comments.length === 0 && (
          <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
            <MessageSquare className="h-8 w-8 mb-2 opacity-30" />
            <p className="text-sm">Noch keine Anmerkungen vorhanden.</p>
          </div>
        )}

        {comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            onUpdated={handleUpdated}
            onDeleted={handleDeleted}
          />
        ))}
      </CardContent>
    </Card>
  );
}
