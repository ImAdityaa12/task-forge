"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { PriorityBadge } from "@/components/tickets/PriorityBadge";
import { AssigneeAvatar } from "@/components/assignees/AssigneeAvatar";
import { useStore } from "@/store/useStore";
import { ArrowLeft, Kanban, CalendarIcon, Tag } from "lucide-react";
import { format, isPast, isToday, isTomorrow } from "date-fns";
import { cn } from "@/lib/utils";
import type { Ticket, Category } from "@/types";

const PRIORITY_BORDER: Record<Ticket["priority"], string> = {
  urgent: "border-l-[hsl(var(--priority-urgent))]",
  high: "border-l-[hsl(var(--priority-high))]",
  medium: "border-l-[hsl(var(--priority-medium))]",
  low: "border-l-[hsl(var(--priority-low))]",
  none: "border-l-transparent",
};

function formatDueDate(dateStr: string) {
  const date = new Date(dateStr);
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  return format(date, "MMM d");
}

export default function CategoriesPage() {
  const router = useRouter();
  const tickets = useStore((s) => s.tickets);
  const statuses = useStore((s) => s.statuses);
  const assignees = useStore((s) => s.assignees);
  const categories = useStore((s) => s.categories);
  const isLoading = useStore((s) => s.isLoading);
  const fetchAll = useStore((s) => s.fetchAll);

  useEffect(() => {
    if (statuses.length === 0 && isLoading) {
      fetchAll();
    }
  }, [statuses.length, isLoading, fetchAll]);

  const grouped = useMemo(() => {
    const map = new Map<string | null, Ticket[]>();
    for (const ticket of tickets) {
      const key = ticket.categoryId;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(ticket);
    }
    for (const group of map.values()) {
      group.sort((a, b) => a.position - b.position);
    }
    return map;
  }, [tickets]);

  const categoryGroups: { category: Category | null; tickets: Ticket[] }[] = useMemo(() => {
    const groups: { category: Category | null; tickets: Ticket[] }[] = [];

    for (const cat of categories) {
      groups.push({ category: cat, tickets: grouped.get(cat.id) ?? [] });
    }

    const uncategorized = grouped.get(null);
    if (uncategorized && uncategorized.length > 0) {
      groups.push({ category: null, tickets: uncategorized });
    }

    return groups;
  }, [categories, grouped]);

  if (isLoading && statuses.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b bg-card shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/")}
            className="gap-2"
          >
            <ArrowLeft className="size-4" />
            Board
          </Button>
          <div className="h-5 w-px bg-border" />
          <Tag className="size-4 text-primary" />
          <h1 className="text-lg font-semibold">Tickets by Category</h1>
        </div>
        <Badge variant="secondary" className="text-xs">
          {tickets.length} ticket{tickets.length !== 1 ? "s" : ""}
        </Badge>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-6">
        {categoryGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Kanban className="size-10 text-muted-foreground" />
            <p className="text-muted-foreground">No tickets yet</p>
            <Button variant="outline" onClick={() => router.push("/")}>
              Go to board
            </Button>
          </div>
        ) : (
          <Accordion>
            {categoryGroups.map(({ category, tickets: catTickets }) => {
              const key = category?.id ?? "__uncategorized";
              return (
                <AccordionItem key={key} value={key}>
                  <AccordionTrigger className="px-2">
                    <div className="flex items-center gap-3 flex-1">
                      <span
                        className="size-3 rounded-sm shrink-0"
                        style={{ backgroundColor: category?.color || "#6b7280" }}
                      />
                      <span className="font-medium">
                        {category?.name ?? "Uncategorized"}
                      </span>
                      <Badge variant="secondary" className="text-xs ml-1">
                        {catTickets.length}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    {catTickets.length === 0 ? (
                      <p className="text-sm text-muted-foreground px-2 py-3">
                        No tickets in this category
                      </p>
                    ) : (
                      <div className="space-y-2 pb-2 px-1">
                        {catTickets.map((ticket) => {
                          const assignee = assignees.find((a) => a.id === ticket.assigneeId) ?? null;
                          const status = statuses.find((s) => s.id === ticket.statusId);
                          return (
                            <Card
                              key={ticket.id}
                              className={cn(
                                "border-l-[3px] p-3 cursor-pointer transition-shadow hover:shadow-md",
                                PRIORITY_BORDER[ticket.priority]
                              )}
                              onClick={() => router.push(`/tickets/${ticket.id}`)}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0 space-y-1.5">
                                  <p className="text-sm font-medium leading-snug truncate">
                                    {ticket.title}
                                  </p>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {status && (
                                      <Badge variant="outline" className="text-xs gap-1.5 font-normal">
                                        <span
                                          className="size-1.5 rounded-full"
                                          style={{ backgroundColor: status.color || "#6b7280" }}
                                        />
                                        {status.name}
                                      </Badge>
                                    )}
                                    <PriorityBadge
                                      priority={ticket.priority}
                                      onChange={() => {}}
                                    />
                                    {ticket.dueAt && (
                                      <span
                                        className={cn(
                                          "flex items-center gap-1 text-xs",
                                          isPast(new Date(ticket.dueAt)) && !isToday(new Date(ticket.dueAt))
                                            ? "text-destructive"
                                            : isToday(new Date(ticket.dueAt))
                                              ? "text-orange-400"
                                              : "text-muted-foreground"
                                        )}
                                      >
                                        <CalendarIcon className="size-3" />
                                        {formatDueDate(ticket.dueAt)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <AssigneeAvatar assignee={assignee} size="sm" />
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </div>
    </div>
  );
}
