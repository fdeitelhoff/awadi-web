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
import { Loader2, ArrowLeft } from "lucide-react";
import { createKunde } from "@/lib/actions/customers";
import {
  customerSchema,
  CUSTOMER_EMPTY_FORM,
  type CustomerFormValues,
} from "@/lib/schemas/customer";

export function CustomerCreateForm() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: CUSTOMER_EMPTY_FORM,
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

  const performSave = async (
    values: CustomerFormValues,
  ): Promise<{ success: boolean; id?: number }> => {
    if (isSaving) return { success: false };
    setIsSaving(true);
    const result = await createKunde(values);
    setIsSaving(false);
    if (!result.success) {
      toast.error(result.error ?? "Unbekannter Fehler.");
      return { success: false };
    }
    return { success: true, id: result.id };
  };

  const onSubmit = async (values: CustomerFormValues) => {
    const result = await performSave(values);
    if (result.success && result.id) {
      toast.success("Kunde angelegt");
      router.push(`/master-data/customers/${result.id}`);
    }
  };

  const handleBackClick = () => {
    if (isDirty) {
      setIsDialogOpen(true);
    } else {
      router.push("/master-data/customers");
    }
  };

  const handleLeave = () => {
    form.reset();
    setIsDialogOpen(false);
    router.push("/master-data/customers");
  };

  const handleSaveAndLeave = async () => {
    const valid = await form.trigger();
    if (!valid) { setIsDialogOpen(false); return; }
    const result = await performSave(form.getValues());
    if (result.success) {
      toast.success("Kunde angelegt");
      setIsDialogOpen(false);
      router.push("/master-data/customers");
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
              <h1 className="text-2xl font-semibold">Neuer Kunde</h1>
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

                <div className="grid grid-cols-[auto_1fr] gap-4 items-end">
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
