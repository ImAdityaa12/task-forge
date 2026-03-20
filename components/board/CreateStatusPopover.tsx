"use client";

import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/store/useStore";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const PRESET_COLORS = [
  "#6b7280",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
];

export function CreateStatusPopover() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const createStatus = useStore((s) => s.createStatus);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await createStatus({ name: name.trim(), color });
    setName("");
    setColor(PRESET_COLORS[0]);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={<Button variant="outline" size="icon" className="shrink-0" />}
        aria-label="Add status column"
      >
        <Plus className="size-4" />
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. In Review"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={cn(
                    "size-6 rounded-full border-2 transition-transform hover:scale-110",
                    color === c
                      ? "border-foreground scale-110"
                      : "border-transparent"
                  )}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
          </div>
          <Button type="submit" size="sm" className="w-full" disabled={!name.trim()}>
            Add Column
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}
