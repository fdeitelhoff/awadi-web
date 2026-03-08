"use client";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface UnsavedChangesDialogProps {
  open: boolean;
  isSaving?: boolean;
  onStay: () => void;
  onSaveAndLeave: () => void;
  onLeave: () => void;
}

export function UnsavedChangesDialog({
  open,
  isSaving = false,
  onStay,
  onSaveAndLeave,
  onLeave,
}: UnsavedChangesDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onStay()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Ungespeicherte Änderungen</AlertDialogTitle>
          <AlertDialogDescription>
            Sie haben ungespeicherte Änderungen. Möchten Sie die Seite wirklich
            verlassen?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="ghost" onClick={onStay} disabled={isSaving}>
            Auf der Seite bleiben
          </Button>
          <Button onClick={onSaveAndLeave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Speichern und verlassen
          </Button>
          <Button variant="destructive" onClick={onLeave} disabled={isSaving}>
            Verlassen
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
