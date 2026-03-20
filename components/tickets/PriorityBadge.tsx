"use client";

import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Ticket } from "@/types";

const PRIORITIES: { value: Ticket["priority"]; label: string; colorClass: string }[] = [
  { value: "urgent", label: "Urgent", colorClass: "bg-[hsl(var(--priority-urgent))]" },
  { value: "high", label: "High", colorClass: "bg-[hsl(var(--priority-high))]" },
  { value: "medium", label: "Medium", colorClass: "bg-[hsl(var(--priority-medium))]" },
  { value: "low", label: "Low", colorClass: "bg-[hsl(var(--priority-low))]" },
  { value: "none", label: "None", colorClass: "bg-[hsl(var(--priority-none))]" },
];

interface PriorityBadgeProps {
  priority: Ticket["priority"];
  onChange?: (priority: Ticket["priority"]) => void;
  interactive?: boolean;
}

export function PriorityBadge({
  priority,
  onChange,
  interactive = true,
}: PriorityBadgeProps) {
  const current = PRIORITIES.find((p) => p.value === priority) ?? PRIORITIES[4];

  const badgeContent = (
    <>
      <span
        className={cn("size-2 rounded-full shrink-0", current.colorClass)}
      />
      {current.label}
    </>
  );

  if (!interactive || !onChange) {
    return (
      <Badge variant="outline" className="text-xs gap-1.5">
        {badgeContent}
      </Badge>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex items-center gap-1.5 rounded-md border border-input px-2 py-0.5 text-xs cursor-pointer hover:bg-muted transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {badgeContent}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {PRIORITIES.map((p) => (
          <DropdownMenuItem
            key={p.value}
            onClick={(e) => {
              e.stopPropagation();
              onChange(p.value);
            }}
            className="gap-2"
          >
            <span
              className={cn("size-2 rounded-full shrink-0", p.colorClass)}
            />
            {p.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
