"use client";

import { createClient } from "@/lib/supabase/client";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function LogoutMenuItem() {
  const router = useRouter();

  const logout = async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Sign out failed:", error.message);
      return;
    }
    router.replace("/auth/login");
  };

  return (
    <DropdownMenuItem
      onClick={logout}
      className="cursor-pointer text-destructive focus:text-destructive"
    >
      <LogOut className="h-4 w-4 mr-2" />
      Abmelden
    </DropdownMenuItem>
  );
}
