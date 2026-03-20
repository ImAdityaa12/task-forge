"use client";

import { useState, useEffect, useRef } from "react";
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
import { UserX, Globe } from "lucide-react";
import type { Assignee, AppUser } from "@/types";

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
  const [search, setSearch] = useState("");
  const [appUsers, setAppUsers] = useState<AppUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const assignees = useStore((s) => s.assignees);
  const assignAppUser = useStore((s) => s.assignAppUser);

  // Debounced fetch of app users
  useEffect(() => {
    clearTimeout(debounceRef.current);

    if (!search.trim()) {
      setAppUsers([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoadingUsers(true);
      try {
        const res = await fetch(
          `/api/users/search?q=${encodeURIComponent(search.trim())}`
        );
        if (res.ok) setAppUsers(await res.json());
      } catch {
        // ignore
      } finally {
        setLoadingUsers(false);
      }
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [search]);

  // Filter out app users already linked as assignees
  const linkedUserIds = new Set(
    assignees.filter((a) => a.linkedUserId).map((a) => a.linkedUserId)
  );
  const filteredAppUsers = appUsers.filter((u) => !linkedUserIds.has(u.id));

  // Client-side filter of existing assignees
  const lowerSearch = search.toLowerCase();
  const filteredAssignees = search
    ? assignees.filter(
        (a) =>
          a.name.toLowerCase().includes(lowerSearch) ||
          a.email?.toLowerCase().includes(lowerSearch)
      )
    : assignees;

  function handleSelectAssignee(assignee: Assignee | null) {
    onSelect(assignee?.id ?? null);
    setOpen(false);
    setSearch("");
  }

  async function handleSelectAppUser(appUser: AppUser) {
    try {
      const assigneeId = await assignAppUser(appUser);
      onSelect(assigneeId);
    } catch {
      // error handled in store
    }
    setOpen(false);
    setSearch("");
  }

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); if (!v) setSearch(""); }}>
      <PopoverTrigger
        render={<button className="inline-flex cursor-pointer" type="button" />}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search assignees or users..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {loadingUsers ? "Searching users..." : "No results found."}
            </CommandEmpty>

            {/* Existing assignees group */}
            {(filteredAssignees.length > 0 || !search) && (
              <CommandGroup heading="Assignees">
                <CommandItem
                  onSelect={() => handleSelectAssignee(null)}
                  className="gap-2"
                >
                  <UserX className="size-4 text-muted-foreground" />
                  <span>Unassigned</span>
                </CommandItem>
                {filteredAssignees.map((a) => (
                  <CommandItem
                    key={a.id}
                    onSelect={() => handleSelectAssignee(a)}
                    className="gap-2"
                    data-selected={a.id === currentAssigneeId}
                  >
                    <AssigneeAvatar assignee={a} size="sm" />
                    <span className="truncate">{a.name}</span>
                    {a.linkedUserId && (
                      <Globe className="size-3 text-muted-foreground ml-auto shrink-0" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* App users group */}
            {filteredAppUsers.length > 0 && (
              <CommandGroup heading="App Users">
                {filteredAppUsers.map((u) => (
                  <CommandItem
                    key={u.id}
                    onSelect={() => handleSelectAppUser(u)}
                    className="gap-2"
                  >
                    <Globe className="size-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <span className="truncate block text-sm">{u.name}</span>
                      <span className="truncate block text-xs text-muted-foreground">
                        {u.email}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
