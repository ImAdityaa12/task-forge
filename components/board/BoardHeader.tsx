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
import { CategoryManager } from "@/components/categories/CategoryManager";
import { useStore } from "@/store/useStore";
import { signOut } from "@/lib/auth-client";
import { useTheme } from "next-themes";
import { Kanban, ArrowUpDown, LogOut, Sun, Moon } from "lucide-react";

export function BoardHeader() {
  const router = useRouter();
  const sortByPriority = useStore((s) => s.sortByPriority);
  const setSortByPriority = useStore((s) => s.setSortByPriority);
  const filterAssigneeId = useStore((s) => s.filterAssigneeId);
  const setFilterAssigneeId = useStore((s) => s.setFilterAssigneeId);
  const filterCategoryId = useStore((s) => s.filterCategoryId);
  const setFilterCategoryId = useStore((s) => s.setFilterCategoryId);
  const assignees = useStore((s) => s.assignees);
  const categories = useStore((s) => s.categories);
  const { theme, setTheme } = useTheme();

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
        <Select
          value={filterCategoryId ?? "all"}
          onValueChange={(v) => setFilterCategoryId(v === "all" ? null : v)}
        >
          <SelectTrigger className="w-[150px] h-8 text-xs">
            {filterCategoryId
              ? categories.find((c) => c.id === filterCategoryId)?.name ?? "All categories"
              : "All categories"}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                <span className="flex items-center gap-2">
                  <span
                    className="size-2 rounded-sm shrink-0"
                    style={{ backgroundColor: c.color || "#6b7280" }}
                  />
                  {c.name}
                </span>
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
        <CategoryManager />
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
        >
          <Sun className="size-4 hidden dark:block" />
          <Moon className="size-4 block dark:hidden" />
        </Button>
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
