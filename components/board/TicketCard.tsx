"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/components/ui/card";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { PriorityBadge } from "@/components/tickets/PriorityBadge";
import { AssigneeAvatar } from "@/components/assignees/AssigneeAvatar";
import { AssigneeCommand } from "@/components/assignees/AssigneeCommand";
import { CategoryBadge } from "@/components/categories/CategoryBadge";
import { useStore } from "@/store/useStore";
import { useRouter } from "next/navigation";
import { GripVertical, CalendarIcon, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isPast, isToday, isTomorrow } from "date-fns";
import type { Ticket } from "@/types";

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

interface TicketCardProps {
  ticket: Ticket;
}

export function TicketCard({ ticket }: TicketCardProps) {
  const statuses = useStore((s) => s.statuses);
  const assignees = useStore((s) => s.assignees);
  const categories = useStore((s) => s.categories);
  const updateTicket = useStore((s) => s.updateTicket);
  const moveTicket = useStore((s) => s.moveTicket);
  const router = useRouter();

  const assignee = assignees.find((a) => a.id === ticket.assigneeId) ?? null;
  const category = categories.find((c) => c.id === ticket.categoryId) ?? null;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: ticket.id,
    data: { type: "ticket", ticket },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <Card
          ref={setNodeRef}
          style={style}
          className={cn(
            "border-l-[3px] p-3 cursor-pointer transition-shadow hover:shadow-md",
            PRIORITY_BORDER[ticket.priority],
            isDragging && "opacity-50 shadow-lg scale-[1.02]"
          )}
          onClick={() => router.push(`/tickets/${ticket.id}`)}
        >
          <div className="flex items-start gap-2">
            <button
              {...attributes}
              {...listeners}
              className="mt-0.5 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing shrink-0"
              aria-label="Drag handle"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="size-4" />
            </button>
            <div className="flex-1 min-w-0 space-y-2">
              <p className="text-sm font-medium leading-snug truncate">
                {ticket.title}
              </p>
              {category && (
                <CategoryBadge category={category} />
              )}
              {ticket.dueAt && (
                <div
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
                </div>
              )}
              <div className="flex items-center justify-between gap-2">
                <PriorityBadge
                  priority={ticket.priority}
                  onChange={(p) => updateTicket(ticket.id, { priority: p })}
                />
                <AssigneeCommand
                  currentAssigneeId={ticket.assigneeId}
                  onSelect={(id) =>
                    updateTicket(ticket.id, { assigneeId: id })
                  }
                >
                  <AssigneeAvatar assignee={assignee} size="sm" />
                </AssigneeCommand>
              </div>
            </div>
          </div>
        </Card>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem
          onClick={() => router.push(`/tickets/${ticket.id}`)}
          className="gap-2"
        >
          <ExternalLink className="size-4" />
          Open ticket
        </ContextMenuItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger>Move to</ContextMenuSubTrigger>
          <ContextMenuSubContent>
            {statuses
              .filter((s) => s.id !== ticket.statusId)
              .map((s) => (
                <ContextMenuItem
                  key={s.id}
                  onClick={() => moveTicket(ticket.id, s.id, 0)}
                  className="gap-2"
                >
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: s.color || "#6b7280" }}
                  />
                  {s.name}
                </ContextMenuItem>
              ))}
          </ContextMenuSubContent>
        </ContextMenuSub>
      </ContextMenuContent>
    </ContextMenu>
  );
}
