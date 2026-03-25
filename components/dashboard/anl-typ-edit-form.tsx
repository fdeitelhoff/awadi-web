"use client";

import { useEffect, useState } from "react";
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
import { InternalComments } from "@/components/dashboard/internal-comments";
import { AnlTypBioFelderCard } from "@/components/dashboard/anl-typ-bio-felder-card";
import { Loader2, ArrowLeft } from "lucide-react";
import { updateAnlTyp } from "@/lib/actions/anl-typen";
import type { AnlTypBioFeld, AnlTypFull } from "@/lib/types/anl-typ";
import type { InternalComment } from "@/lib/types/kommentar";
import {
  anlTypSchema,
  makeAnlTypSnapshot,
  type AnlTypFormValues,
} from "@/lib/schemas/anl-typ";

interface AnlTypEditFormProps {
  typ: AnlTypFull;
  initialKommentare: InternalComment[];
  initialBioFelder: AnlTypBioFeld[];
}

function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AnlTypEditForm({ typ, initialKommentare, initialBioFelder }: AnlTypEditFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<AnlTypFormValues>({
    resolver: zodResolver(anlTypSchema),
    defaultValues: makeAnlTypSnapshot(typ),
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

  const performSave = async (values: AnlTypFormValues): Promise<boolean> => {
    if (isSaving) return false;
    setIsSaving(true);
    const result = await updateAnlTyp(typ.id, values);
    setIsSaving(false);
    if (!result.success) {
      toast.error(result.error ?? "Unbekannter Fehler.");
      return false;
    }
    form.reset(values); // update dirty baseline to the saved state
    return true;
  };

  const onSubmit = async (values: AnlTypFormValues) => {
    const ok = await performSave(values);
    if (ok) toast.success("Gespeichert");
  };

  const handleBackClick = () => {
    if (isDirty) {
      setIsDialogOpen(true);
    } else {
      router.push("/settings/facility-types");
    }
  };

  const handleLeave = () => {
    form.reset(); // revert to last saved baseline
    setIsDialogOpen(false);
    router.push("/settings/facility-types");
  };

  const handleSaveAndLeave = async () => {
    const valid = await form.trigger();
    if (!valid) { setIsDialogOpen(false); return; }
    const ok = await performSave(form.getValues());
    if (ok) {
      toast.success("Gespeichert");
      setIsDialogOpen(false);
      router.push("/settings/facility-types");
    } else {
      setIsDialogOpen(false);
    }
  };

  const metaInfo = [
    `ID: ${typ.id}`,
    typ.created_at && `Erstellt: ${formatDateTime(typ.created_at)}`,
    typ.last_update && `Geändert: ${formatDateTime(typ.last_update)}`,
  ]
    .filter(Boolean)
    .join(" · ");

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
              <div>
                <h1 className="text-2xl font-semibold">Anlagentyp: {typ.bezeichnung}</h1>
                {metaInfo && (
                  <p className="text-sm text-muted-foreground mt-0.5">{metaInfo}</p>
                )}
              </div>
              <Button type="submit" disabled={isSaving} className="shrink-0">
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
                          <Input {...field} aria-required={true} />
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
            <AnlTypBioFelderCard
              anl_typ_id={typ.id}
              initialFelder={initialBioFelder}
            />

            {/* ── Anmerkungen ───────────────────────────────────────── */}
            <InternalComments
              refTable="anl_typen"
              refId={typ.id}
              initialComments={initialKommentare}
            />

          </div>

          {/* ── Footer save ──────────────────────────────────────── */}
          <div className="flex justify-end pb-8">
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Speichern
            </Button>
          </div>

        </form>
      </Form>
    </>
  );
}
