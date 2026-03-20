import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  name: string;
  color: string | null;
}

export function StatusBadge({ name, color }: StatusBadgeProps) {
  return (
    <Badge variant="outline" className="text-xs gap-1.5">
      <span
        className="size-2 rounded-full shrink-0"
        style={{ backgroundColor: color || "#6b7280" }}
      />
      {name}
    </Badge>
  );
}
