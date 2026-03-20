"use client";

import { useState } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { AssigneeAvatar } from "./AssigneeAvatar";
import { useStore } from "@/store/useStore";
import { UserX } from "lucide-react";
import type { Assignee } from "@/types";

interface AssigneeCommandProps {
  currentAssigneeId: string | null;
  onSelect: (assigneeId: string | null) => void;
  children: React.ReactNode;
}

export function AssigneeCommand({
  currentAssigneeId,
  onSelect,
  children,
}: AssigneeCommandProps) {
  const [open, setOpen] = useState(false);
  const assignees = useStore((s) => s.assignees);

  function handleSelect(assignee: Assignee | null) {
    onSelect(assignee?.id ?? null);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={<span className="inline-flex cursor-pointer" />}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-52 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search assignees..." />
          <CommandList>
            <CommandEmpty>No assignees found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                onSelect={() => handleSelect(null)}
                className="gap-2"
              >
                <UserX className="size-4 text-muted-foreground" />
                <span>Unassigned</span>
              </CommandItem>
              {assignees.map((a) => (
                <CommandItem
                  key={a.id}
                  onSelect={() => handleSelect(a)}
                  className="gap-2"
                  data-selected={a.id === currentAssigneeId}
                >
                  <AssigneeAvatar assignee={a} size="sm" />
                  <span>{a.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
