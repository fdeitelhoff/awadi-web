"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UnsavedChangesDialog } from "@/components/dashboard/unsaved-changes-dialog";
import { InternalComments } from "@/components/dashboard/internal-comments";
import { VertragPicker } from "@/components/dashboard/vertrag-picker";
import { Loader2, ArrowLeft, Trash2 } from "lucide-react";
import { updateKunde, deleteKunde } from "@/lib/actions/customers";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { Kunde } from "@/lib/types/customer";
import type { InternalComment } from "@/lib/types/kommentar";
import {
  customerSchema,
  makeCustomerSnapshot,
  type CustomerFormValues,
} from "@/lib/schemas/customer";

interface CustomerEditFormProps {
  kunde: Kunde;
  initialKommentare: InternalComment[];
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

export function CustomerEditForm({ kunde, initialKommentare }: CustomerEditFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: makeCustomerSnapshot(kunde),
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

  const performSave = async (values: CustomerFormValues): Promise<boolean> => {
    if (isSaving) return false;
    setIsSaving(true);
    const result = await updateKunde(kunde.id, values);
    setIsSaving(false);
    if (!result.success) {
      toast.error(result.error ?? "Unbekannter Fehler.");
      return false;
    }
    form.reset(values); // update dirty baseline to the saved state
    return true;
  };

  const onSubmit = async (values: CustomerFormValues) => {
    const ok = await performSave(values);
    if (ok) toast.success("Gespeichert");
  };

  const handleBackClick = () => {
    if (isDirty) {
      setIsDialogOpen(true);
    } else {
      router.push("/master-data/customers");
    }
  };

  const handleLeave = () => {
    form.reset(); // revert to last saved baseline
    setIsDialogOpen(false);
    router.push("/master-data/customers");
  };

  const handleSaveAndLeave = async () => {
    const valid = await form.trigger();
    if (!valid) { setIsDialogOpen(false); return; }
    const ok = await performSave(form.getValues());
    if (ok) {
      toast.success("Gespeichert");
      setIsDialogOpen(false);
      router.push("/master-data/customers");
    } else {
      setIsDialogOpen(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteKunde(kunde.id);
    setIsDeleting(false);
    if (!result.success) {
      toast.error(result.error ?? "Löschen fehlgeschlagen.");
      return;
    }
    toast.success("Kunde gelöscht");
    router.push("/master-data/customers");
  };

  const namePart =
    kunde.firma ||
    [kunde.vorname, kunde.nachname].filter(Boolean).join(" ") ||
    "Kunde";

  const metaInfo = [
    kunde.kundennr   && `Kunden-Nr.: ${kunde.kundennr}`,
    kunde.created_at && `Erstellt: ${formatDateTime(kunde.created_at)}`,
    kunde.last_update && `Geändert: ${formatDateTime(kunde.last_update)}`,
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
                <h1 className="text-2xl font-semibold">Kunde: {namePart}</h1>
                {metaInfo && (
                  <p className="text-sm text-muted-foreground mt-0.5">{metaInfo}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="destructive" disabled={isSaving || isDeleting}>
                      {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Kunde löschen?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Möchten Sie den Kunden &ldquo;{namePart}&rdquo; wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Löschen
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <Button type="button" variant="outline" disabled={isSaving || isDeleting} onClick={handleSaveAndLeave}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Speichern & verlassen
                </Button>
                <Button type="submit" disabled={isSaving || isDeleting}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Speichern
                </Button>
              </div>
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

                <div className="grid grid-cols-[auto_1fr_1fr] gap-4 items-end">
                  <FormField
                    control={form.control}
                    name="ist_kunde"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel>Ist Kunde</FormLabel>
                        <div className="h-9 flex items-center">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="kundennr"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel>Kunden-Nr.</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="z. B. AS-001" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="space-y-1.5">
                    <FormLabel>Wartungsdaten</FormLabel>
                    <VertragPicker kundenId={kunde.id} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="anrede"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel>Anrede</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Auswählen…" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Herr">Herr</SelectItem>
                            <SelectItem value="Frau">Frau</SelectItem>
                            <SelectItem value="Divers">Divers</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="titel"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel>Titel</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="z. B. Dr." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="vorname"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel>Vorname</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="nachname"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel>
                          Nachname{" "}
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

                <FormField
                  control={form.control}
                  name="firma"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel>
                        Firma{" "}
                        <span className="text-destructive" aria-hidden="true">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} aria-required={true} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              </CardContent>
            </Card>

            {/* ── Adresse ──────────────────────────────────────────── */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Adresse</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">

                <div className="grid grid-cols-[1fr_100px] gap-4">
                  <FormField
                    control={form.control}
                    name="strasse"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel>Straße</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="hausnr"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel>Nr.</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-[64px_90px_1fr] gap-4">
                  <FormField
                    control={form.control}
                    name="laenderkennung"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel>Land</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="DE" maxLength={5} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="plz"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel>PLZ</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="ort"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel>Ort</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="ortsteil"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel>Ortsteil</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              </CardContent>
            </Card>

            {/* ── Kontakt ──────────────────────────────────────────── */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Kontakt</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="telefonnr"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel>Telefon</FormLabel>
                        <FormControl>
                          <Input {...field} type="tel" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="telefonnr_geschaeft"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel>Telefon (geschäftlich)</FormLabel>
                        <FormControl>
                          <Input {...field} type="tel" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="mobilnr"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel>Mobil</FormLabel>
                        <FormControl>
                          <Input {...field} type="tel" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="mobilnr2"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel>Mobil (geschäftlich)</FormLabel>
                        <FormControl>
                          <Input {...field} type="tel" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel>E-Mail</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email_secondary"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel>E-Mail (geschäftlich)</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="homepage"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel>Homepage</FormLabel>
                      <FormControl>
                        <Input {...field} type="url" placeholder="https://" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              </CardContent>
            </Card>

            {/* ── Anmerkungen ──────────────────────────────────────── */}
            <InternalComments
              refTable="kunden"
              refId={kunde.id}
              initialComments={initialKommentare}
            />

          </div>

          {/* ── Footer save ──────────────────────────────────────── */}
          <div className="flex justify-end gap-2 pb-8">
            <Button type="button" variant="outline" disabled={isSaving || isDeleting} onClick={handleSaveAndLeave}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Speichern & verlassen
            </Button>
            <Button type="submit" disabled={isSaving || isDeleting}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Speichern
            </Button>
          </div>

        </form>
      </Form>
    </>
  );
}
