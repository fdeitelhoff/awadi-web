import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { NavItems } from "./nav-items";
import { SearchInput } from "./search-input";

export function DashboardNav() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image
            src="/logo.png"
            alt="AWADI"
            width={32}
            height={32}
            className="rounded"
          />
          <span className="font-semibold text-lg hidden sm:inline">AWADI</span>
        </Link>

        <Separator orientation="vertical" className="h-6" />

        {/* Navigation - client component for active state */}
        <NavItems />

        {/* Search - client component for input handling */}
        <div className="flex-1 flex justify-center max-w-md mx-auto">
          <SearchInput />
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 shrink-0">
          <ThemeSwitcher />
          <Suspense
            fallback={
              <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
            }
          >
            <AuthButton />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
