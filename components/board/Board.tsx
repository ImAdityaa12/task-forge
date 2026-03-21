"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { StatusColumn } from "./StatusColumn";
import { CreateStatusPopover } from "./CreateStatusPopover";
import { BoardSkeleton } from "./BoardSkeleton";
import { TicketCard } from "./TicketCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useStore } from "@/store/useStore";
import type { Ticket } from "@/types";

const PRIORITY_ORDER: Record<Ticket["priority"], number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
  none: 4,
};

function BoardSkeleton() {
  return (
    <div className="flex-1 overflow-x-auto p-6">
      <div className="flex gap-4 items-start">
        {Array.from({ length: 4 }).map((_, colIdx) => (
          <div
            key={colIdx}
            className="w-[300px] shrink-0 flex flex-col gap-3"
          >
            <div className="flex items-center gap-2 px-1 mb-1">
              <Skeleton className="h-5 w-24 rounded" />
              <Skeleton className="h-5 w-6 rounded-full" />
            </div>
            {Array.from({ length: 3 }).map((_, cardIdx) => (
              <Skeleton
                key={cardIdx}
                className="h-[88px] w-full rounded-lg"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function Board() {
  const fetchAll = useStore((s) => s.fetchAll);
  const statuses = useStore((s) => s.statuses);
  const tickets = useStore((s) => s.tickets);
  const isLoading = useStore((s) => s.isLoading);
  const sortByPriority = useStore((s) => s.sortByPriority);
  const filterAssigneeId = useStore((s) => s.filterAssigneeId);
  const moveTicket = useStore((s) => s.moveTicket);
  const reorderStatuses = useStore((s) => s.reorderStatuses);

  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [overColumnId, setOverColumnId] = useState<string | null>(null);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const filteredTickets = useMemo(() => {
    let result = tickets;
    if (filterAssigneeId) {
      result = result.filter((t) => t.assigneeId === filterAssigneeId);
    }
    return result;
  }, [tickets, filterAssigneeId]);

  const getColumnTickets = useCallback(
    (statusId: string) => {
      const columnTickets = filteredTickets
        .filter((t) => t.statusId === statusId)
        .sort((a, b) => a.position - b.position);

      if (sortByPriority) {
        return [...columnTickets].sort(
          (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
        );
      }
      return columnTickets;
    },
    [filteredTickets, sortByPriority]
  );

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    const data = active.data.current;

    if (data?.type === "ticket") {
      setActiveTicket(data.ticket);
    }
  }

  function handleDragOver(event: DragOverEvent) {
    const { over } = event;
    if (!over) {
      setOverColumnId(null);
      return;
    }

    const overData = over.data.current;
    if (overData?.type === "column") {
      setOverColumnId(overData.statusId);
    } else if (overData?.type === "ticket") {
      const overTicket = tickets.find((t) => t.id === over.id);
      if (overTicket) {
        setOverColumnId(overTicket.statusId);
      }
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTicket(null);
    setOverColumnId(null);

    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    // Column reorder
    if (activeData?.type === "column-sort" && overData?.type === "column-sort") {
      const oldIndex = statuses.findIndex(
        (s) => `column-sort-${s.id}` === active.id
      );
      const newIndex = statuses.findIndex(
        (s) => `column-sort-${s.id}` === over.id
      );
      if (oldIndex !== newIndex) {
        const reordered = arrayMove(statuses, oldIndex, newIndex);
        reorderStatuses(reordered.map((s) => s.id));
      }
      return;
    }

    // Ticket move
    if (activeData?.type === "ticket") {
      const ticketId = active.id as string;
      let targetStatusId: string;
      let newPosition: number;

      if (overData?.type === "column") {
        targetStatusId = overData.statusId;
        newPosition = getColumnTickets(targetStatusId).length;
      } else if (overData?.type === "ticket") {
        const overTicket = tickets.find((t) => t.id === over.id);
        if (!overTicket) return;
        targetStatusId = overTicket.statusId;
        const columnTickets = getColumnTickets(targetStatusId);
        const overIndex = columnTickets.findIndex((t) => t.id === over.id);
        newPosition = overIndex >= 0 ? overIndex : columnTickets.length;
      } else {
        return;
      }

      const ticket = tickets.find((t) => t.id === ticketId);
      if (!ticket) return;

      // Skip if same position
      if (
        ticket.statusId === targetStatusId &&
        ticket.position === newPosition
      ) {
        return;
      }

      moveTicket(ticketId, targetStatusId, newPosition);
    }
  }

  const isLoading = useStore((s) => s.isLoading);
  const sortedStatuses = [...statuses].sort((a, b) => a.position - b.position);
  const columnSortIds = sortedStatuses.map((s) => `column-sort-${s.id}`);

  if (isLoading && statuses.length === 0) {
    return <BoardSkeleton />;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex-1 overflow-x-auto p-6">
        <div className="flex gap-4 items-start">
          <SortableContext
            items={columnSortIds}
            strategy={horizontalListSortingStrategy}
          >
            {sortedStatuses.map((status) => (
              <StatusColumn
                key={status.id}
                status={status}
                tickets={getColumnTickets(status.id)}
                isOver={overColumnId === status.id}
              />
            ))}
          </SortableContext>
          <CreateStatusPopover />
        </div>
      </div>

      <DragOverlay>
        {activeTicket && <TicketCard ticket={activeTicket} />}
      </DragOverlay>
    </DndContext>
  );
}
