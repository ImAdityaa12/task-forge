"use client";

import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useStore } from "@/store/useStore";
import { Tag, X } from "lucide-react";

interface CategoryCommandProps {
  currentCategoryId: string | null;
  onSelect: (id: string | null) => void;
  children: React.ReactNode;
}

export function CategoryCommand({
  currentCategoryId,
  onSelect,
  children,
}: CategoryCommandProps) {
  const [open, setOpen] = useState(false);
  const categories = useStore((s) => s.categories);

  function handleSelect(id: string | null) {
    onSelect(id);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={<button className="inline-flex cursor-pointer" type="button" />}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </PopoverTrigger>
      <PopoverContent className="p-0 w-52" align="start" onClick={(e) => e.stopPropagation()}>
        <Command>
          <CommandInput placeholder="Search categories..." />
          <CommandList>
            <CommandEmpty>No categories found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="none"
                onSelect={() => handleSelect(null)}
                className="gap-2"
              >
                <X className="size-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">No category</span>
              </CommandItem>
              {categories.map((cat) => (
                <CommandItem
                  key={cat.id}
                  value={cat.name}
                  onSelect={() => handleSelect(cat.id)}
                  className="gap-2"
                >
                  <span
                    className="size-2.5 rounded-sm shrink-0"
                    style={{ backgroundColor: cat.color || "#6b7280" }}
                  />
                  <span>{cat.name}</span>
                  {currentCategoryId === cat.id && (
                    <span className="ml-auto text-xs text-muted-foreground">✓</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
