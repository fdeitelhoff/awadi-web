"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UnsavedChangesDialog } from "@/components/dashboard/unsaved-changes-dialog";
import { AnlTypBioFelderCard } from "@/components/dashboard/anl-typ-bio-felder-card";
import { Loader2, ArrowLeft } from "lucide-react";
import { createAnlTyp, createBioFeld } from "@/lib/actions/anl-typen";
import type { DraftBioFeld } from "@/components/dashboard/anl-typ-bio-felder-card";
import {
  anlTypSchema,
  ANL_TYP_EMPTY_FORM,
  type AnlTypFormValues,
} from "@/lib/schemas/anl-typ";

export function AnlTypCreateForm() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [pendingBioFelder, setPendingBioFelder] = useState<DraftBioFeld[]>([]);

  const form = useForm<AnlTypFormValues>({
    resolver: zodResolver(anlTypSchema),
    defaultValues: ANL_TYP_EMPTY_FORM,
  });

  const { isDirty } = form.formState;

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const handleDraftChange = useCallback((felder: DraftBioFeld[]) => {
    setPendingBioFelder(felder);
  }, []);

  const performSave = async (
    values: AnlTypFormValues,
  ): Promise<{ success: boolean; id?: number }> => {
    if (isSaving) return { success: false };
    setIsSaving(true);
    const result = await createAnlTyp(values);
    if (!result.success || !result.id) {
      setIsSaving(false);
      toast.error(result.error ?? "Unbekannter Fehler.");
      return { success: false };
    }
    // Persist pending bio fields
    for (let i = 0; i < pendingBioFelder.length; i++) {
      await createBioFeld(
        result.id,
        i + 1,
        pendingBioFelder[i].bio_key,
        pendingBioFelder[i].bio_name ?? undefined,
      );
    }
    setIsSaving(false);
    return { success: true, id: result.id };
  };

  const onSubmit = async (values: AnlTypFormValues) => {
    const result = await performSave(values);
    if (result.success && result.id) {
      toast.success("Anlagentyp angelegt");
      router.push(`/settings/facility-types/${result.id}`);
    }
  };

  const handleBackClick = () => {
    if (isDirty) {
      setIsDialogOpen(true);
    } else {
      router.push("/settings/facility-types");
    }
  };

  const handleLeave = () => {
    form.reset();
    setIsDialogOpen(false);
    router.push("/settings/facility-types");
  };

  const handleSaveAndLeave = async () => {
    const valid = await form.trigger();
    if (!valid) { setIsDialogOpen(false); return; }
    const result = await performSave(form.getValues());
    if (result.success) {
      toast.success("Anlagentyp angelegt");
      setIsDialogOpen(false);
      router.push("/settings/facility-types");
    } else {
      setIsDialogOpen(false);
    }
  };

  return (
    <>
      <UnsavedChangesDialog
        open={isDialogOpen}
        isSaving={isSaving}
        onStay={() => setIsDialogOpen(false)}
        onSaveAndLeave={handleSaveAndLeave}
        onLeave={handleLeave}
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>

          {/* ── Page header ──────────────────────────────────────────── */}
          <div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="-ml-2 mb-2"
              onClick={handleBackClick}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Zurück
            </Button>
            <div className="flex items-center justify-between gap-4">
              <h1 className="text-2xl font-semibold">Neuer Anlagentyp</h1>
              <Button type="submit" variant="success" disabled={isSaving} className="shrink-0">
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Speichern
              </Button>
            </div>
          </div>

          {/* ── Cards ────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* ── Stammdaten ───────────────────────────────────────── */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Stammdaten</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">

                <div className="grid grid-cols-[100px_1fr] gap-4">
                  <FormField
                    control={form.control}
                    name="sortiernr"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel>Sort-Nr.</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === "" ? undefined : Number(e.target.value),
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bezeichnung"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel>
                          Bezeichnung{" "}
                          <span className="text-destructive" aria-hidden="true">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input {...field} aria-required={true} autoFocus />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

              </CardContent>
            </Card>

            {/* ── Wartung ──────────────────────────────────────────── */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Wartung</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">

                <FormField
                  control={form.control}
                  name="wartungsintervall_monate"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel>Wartungsintervall (Monate)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === "" ? undefined : Number(e.target.value),
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dauer_wartung_minuten"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel>Dauer Wartung (Min.)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === "" ? undefined : Number(e.target.value),
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              </CardContent>
            </Card>

            {/* ── Bio-Felder ────────────────────────────────────────── */}
            <AnlTypBioFelderCard draft onDraftChange={handleDraftChange} />

          </div>

          {/* ── Footer save ──────────────────────────────────────── */}
          <div className="flex justify-end pb-8">
            <Button type="submit" variant="success" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Speichern
            </Button>
          </div>

        </form>
      </Form>
    </>
  );
}
