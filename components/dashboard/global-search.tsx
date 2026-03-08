"use client";

import { useRef, useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  Users,
  Factory,
  Contact,
  FileText,
  Building2,
  User,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  searchAll,
  type SearchResult,
  type SearchResultType,
} from "@/lib/actions/search";

const TYPE_CONFIG: Record<
  SearchResultType,
  { label: string; icon: React.ElementType }
> = {
  kunde: { label: "Kunden", icon: Users },
  anlage: { label: "Anlagen", icon: Factory },
  kontakt: { label: "Kontakte", icon: Contact },
  wartungsvertrag: { label: "Wartungsverträge", icon: FileText },
  anlagentyp: { label: "Anlagentypen", icon: Building2 },
  benutzer: { label: "Benutzer", icon: User },
};

const TYPE_ORDER: SearchResultType[] = [
  "kunde",
  "anlage",
  "kontakt",
  "wartungsvertrag",
  "anlagentyp",
  "benutzer",
];

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setResults([]);
    setIsOpen(true);
    startTransition(async () => {
      const data = await searchAll(query.trim());
      setResults(data);
    });
  }

  function handleClear() {
    setQuery("");
    setResults([]);
    setIsOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      if (isOpen) {
        setIsOpen(false);
      } else {
        setQuery("");
        setResults([]);
      }
    }
  }

  function handleSelect(href: string) {
    setIsOpen(false);
    router.push(href);
  }

  const grouped = TYPE_ORDER.map((type) => ({
    type,
    config: TYPE_CONFIG[type],
    items: results.filter((r) => r.type === type),
  })).filter((g) => g.items.length > 0);

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Suchen… (Enter)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-9 pr-8 h-9 w-full bg-muted/50"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Suche leeren"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>

      {isOpen && (
        <div className="absolute top-full mt-1 left-0 right-0 z-50 rounded-md border bg-popover text-popover-foreground shadow-lg overflow-hidden">
          {isPending ? (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
              <span className="animate-spin inline-block h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
              Suche läuft…
            </div>
          ) : grouped.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Keine Ergebnisse
            </div>
          ) : (
            <div className="max-h-[420px] overflow-y-auto py-1">
              {grouped.map(({ type, config, items }) => {
                const Icon = config.icon;
                return (
                  <div key={type}>
                    <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide select-none">
                      {config.label}
                    </div>
                    {items.map((result) => (
                      <button
                        key={result.id}
                        type="button"
                        onClick={() => handleSelect(result.href)}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors text-left"
                      >
                        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="flex-1 truncate font-medium">
                          {result.label}
                        </span>
                        {result.sublabel && (
                          <span className="text-muted-foreground text-xs truncate max-w-[45%]">
                            {result.sublabel}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
