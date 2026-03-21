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
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Ticket } from "@/types";

const PRIORITY_BORDER: Record<Ticket["priority"], string> = {
  urgent: "border-l-[hsl(var(--priority-urgent))]",
  high: "border-l-[hsl(var(--priority-high))]",
  medium: "border-l-[hsl(var(--priority-medium))]",
  low: "border-l-[hsl(var(--priority-low))]",
  none: "border-l-transparent",
};

interface TicketCardProps {
  ticket: Ticket;
}

export function TicketCard({ ticket }: TicketCardProps) {
  const statuses = useStore((s) => s.statuses);
  const assignees = useStore((s) => s.assignees);
  const categories = useStore((s) => s.categories);
  const setSelectedTicketId = useStore((s) => s.setSelectedTicketId);
  const updateTicket = useStore((s) => s.updateTicket);
  const moveTicket = useStore((s) => s.moveTicket);

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
          onClick={() => setSelectedTicketId(ticket.id)}
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
