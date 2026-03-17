"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Building2,
  ChevronDown,
  Contact,
  Database,
  Factory,
  FileText,
  MapPin,
  Route,
  Settings,
  Ticket,
  Users,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const masterDataItems = [
  { label: "Kunden", href: "/master-data/customers", icon: Users },
  { label: "Anlagen", href: "/master-data/facilities", icon: Factory },
  { label: "Kontakte", href: "/master-data/contacts", icon: Contact, hidden: true },
  { label: "Wartungsdaten", href: "/master-data/maintenance", icon: FileText },
  { label: "Touren", href: "/master-data/tours", icon: Route },
];

const settingsItems = [
  { label: "Anlagentypen", href: "/settings/facility-types", icon: Building2 },
  { label: "Benutzer", href: "/settings/users", icon: Users },
  { label: "Gemeinden", href: "/settings/communities", icon: MapPin },
];

export function NavItems() {
  const pathname = usePathname();

  const isMaintenance = pathname === "/";
  const isMasterData = pathname.startsWith("/master-data");
  const isTickets = pathname.startsWith("/tickets");
  const isSettings = pathname.startsWith("/settings");

  return (
    <nav className="flex items-center gap-1">
      {/* Wartung - simple link */}
      <Button
        variant={isMaintenance ? "secondary" : "ghost"}
        size="sm"
        asChild
        className="gap-2 cursor-pointer"
      >
        <Link href="/">
          <Wrench className="h-4 w-4" />
          <span className="hidden md:inline">Wartung</span>
        </Link>
      </Button>

      {/* Tickets - simple link */}
      <Button
        variant={isTickets ? "secondary" : "ghost"}
        size="sm"
        asChild
        className="gap-2 cursor-pointer"
      >
        <Link href="/tickets">
          <Ticket className="h-4 w-4" />
          <span className="hidden md:inline">Tickets</span>
        </Link>
      </Button>

      {/* Stammdaten - dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={isMasterData ? "secondary" : "ghost"}
            size="sm"
            className="gap-2 cursor-pointer"
          >
            <Database className="h-4 w-4" />
            <span className="hidden md:inline">Stammdaten</span>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {masterDataItems.filter((item) => !item.hidden).map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <DropdownMenuItem key={item.href} asChild>
                <Link
                  href={item.href}
                  className={isActive ? "bg-accent cursor-pointer" : "cursor-pointer"}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {item.label}
                </Link>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Einstellungen - dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={isSettings ? "secondary" : "ghost"}
            size="sm"
            className="gap-2 cursor-pointer"
          >
            <Settings className="h-4 w-4" />
            <span className="hidden md:inline">Einstellungen</span>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {settingsItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <DropdownMenuItem key={item.href} asChild>
                <Link
                  href={item.href}
                  className={isActive ? "bg-accent cursor-pointer" : "cursor-pointer"}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {item.label}
                </Link>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
}
