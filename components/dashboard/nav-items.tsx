"use client";

import { Button } from "@/components/ui/button";
import { Database, Wrench } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    label: "Wartung",
    href: "/",
    icon: Wrench,
  },
  {
    label: "Stammdaten",
    href: "/master-data",
    icon: Database,
  },
];

export function NavItems() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1">
      {navItems.map((item) => {
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);
        const Icon = item.icon;

        return (
          <Button
            key={item.href}
            variant={isActive ? "secondary" : "ghost"}
            size="sm"
            asChild
            className="gap-2"
          >
            <Link href={item.href}>
              <Icon className="h-4 w-4" />
              <span className="hidden md:inline">{item.label}</span>
            </Link>
          </Button>
        );
      })}
    </nav>
  );
}
