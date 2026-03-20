"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AssigneeManager } from "@/components/assignees/AssigneeManager";
import { useStore } from "@/store/useStore";
import { signOut } from "@/lib/auth-client";
import { Kanban, ArrowUpDown, LogOut } from "lucide-react";

export function BoardHeader() {
  const router = useRouter();
  const sortByPriority = useStore((s) => s.sortByPriority);
  const setSortByPriority = useStore((s) => s.setSortByPriority);
  const filterAssigneeId = useStore((s) => s.filterAssigneeId);
  const setFilterAssigneeId = useStore((s) => s.setFilterAssigneeId);
  const assignees = useStore((s) => s.assignees);

  async function handleSignOut() {
    await signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex items-center justify-between px-6 py-3 border-b bg-card shrink-0">
      <div className="flex items-center gap-3">
        <Kanban className="size-5 text-primary" />
        <h1 className="text-lg font-semibold">TaskForge</h1>
      </div>
      <div className="flex items-center gap-2">
        <Select
          value={filterAssigneeId ?? "all"}
          onValueChange={(v) => setFilterAssigneeId(v === "all" ? null : v)}
        >
          <SelectTrigger className="w-[160px] h-8 text-xs">
            {filterAssigneeId
              ? assignees.find((a) => a.id === filterAssigneeId)?.name ?? "All assignees"
              : "All assignees"}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All assignees</SelectItem>
            {assignees.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Toggle
          pressed={sortByPriority}
          onPressedChange={setSortByPriority}
          size="sm"
          aria-label="Sort by priority"
          className="gap-1.5"
        >
          <ArrowUpDown className="size-3.5" />
          Priority
        </Toggle>
        <AssigneeManager />
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={handleSignOut}
          aria-label="Sign out"
        >
          <LogOut className="size-4" />
        </Button>
      </div>
    </header>
  );
}
