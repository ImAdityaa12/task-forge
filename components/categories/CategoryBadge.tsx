"use client";

import { Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Category } from "@/types";

interface CategoryBadgeProps {
  category: Category | null;
  className?: string;
}

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  if (!category) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium leading-none border",
        className
      )}
      style={{
        color: category.color || "#6b7280",
        borderColor: `${category.color || "#6b7280"}40`,
        backgroundColor: `${category.color || "#6b7280"}15`,
      }}
    >
      <Tag className="size-2.5 shrink-0" />
      {category.name}
    </span>
  );
}
