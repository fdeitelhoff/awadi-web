import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

interface SortIconProps {
  field: string;
  sortField: string;
  sortDirection: "asc" | "desc";
}

export function SortIcon({ field, sortField, sortDirection }: SortIconProps) {
  if (sortField !== field)
    return <ArrowUpDown className="ml-1 h-3 w-3 text-muted-foreground/50" />;
  return sortDirection === "asc" ? (
    <ArrowUp className="ml-1 h-3 w-3" />
  ) : (
    <ArrowDown className="ml-1 h-3 w-3" />
  );
}
