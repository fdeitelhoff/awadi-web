import { UserMenu } from "./user-menu";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { NavItems } from "./nav-items";
import { GlobalSearch } from "./global-search";

export function DashboardNav() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-[hsl(var(--nav-background))] border-[hsl(var(--nav-border))] text-[hsl(var(--nav-foreground))]">
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

        {/* ATB logo */}
        <a
          href="https://www.atbwater.de/shop/"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0"
        >
          <Image
            src="/atb-logo.svg"
            alt="ATB Water"
            width={86}
            height={28}
          />
        </a>

        <Separator orientation="vertical" className="h-6" />

        {/* Navigation - client component for active state */}
        <Suspense
          fallback={
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
          }
        >
          <NavItems />
        </Suspense>
        

        {/* Search - client component for input handling */}
        <div className="flex-1 flex justify-center max-w-md mx-auto">
          <GlobalSearch />
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-[hsl(var(--nav-foreground))]">
            <ThemeSwitcher />
          </div>
          <Suspense
            fallback={
              <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
            }
          >
            <UserMenu />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
