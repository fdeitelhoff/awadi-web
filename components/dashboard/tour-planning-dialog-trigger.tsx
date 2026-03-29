// components/dashboard/tour-planning-dialog-trigger.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { TourPlanningForm } from "@/components/dashboard/tour-planning-form";

export function TourPlanningDialogTrigger() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  function handleSuccess(tourId: number) {
    setOpen(false);
    router.push(`/master-data/tours/${tourId}`);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="success"><PlusIcon className="mr-2 h-4 w-4" />Neue Tourplanung</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Neue Tourplanung</DialogTitle></DialogHeader>
        <TourPlanningForm onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
