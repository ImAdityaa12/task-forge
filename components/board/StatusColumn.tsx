"use client";

import { useState } from "react";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TicketCard } from "./TicketCard";
import { CreateTicketForm } from "./CreateTicketForm";
import { Skeleton } from "@/components/ui/skeleton";
import { useStore } from "@/store/useStore";
import { MoreHorizontal, Trash2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Status, Ticket } from "@/types";

interface StatusColumnProps {
  status: Status;
  tickets: Ticket[];
  isOver?: boolean;
}

export function StatusColumn({ status, tickets, isOver }: StatusColumnProps) {
  const updateStatus = useStore((s) => s.updateStatus);
  const deleteStatus = useStore((s) => s.deleteStatus);
  const isLoading = useStore((s) => s.isLoading);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(status.name);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { setNodeRef: setDropRef } = useDroppable({
    id: `column-${status.id}`,
    data: { type: "column", statusId: status.id },
  });

  const {
    attributes,
    listeners,
    setNodeRef: setSortRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `column-sort-${status.id}`,
    data: { type: "column-sort", statusId: status.id },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  function handleRename() {
    if (name.trim() && name.trim() !== status.name) {
      updateStatus(status.id, { name: name.trim() });
    } else {
      setName(status.name);
    }
    setEditing(false);
  }

  const ticketIds = tickets.map((t) => t.id);

  return (
    <div
      ref={setSortRef}
      style={style}
      className={cn(
        "flex flex-col w-[300px] min-w-[280px] max-w-[340px] shrink-0",
        isDragging && "opacity-50"
      )}
    >
      {/* Column Header */}
      <div className="flex items-center gap-2 px-2 pb-3">
        <button
          {...attributes}
          {...listeners}
          className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
          aria-label="Drag column"
        >
          <GripVertical className="size-4" />
        </button>
        <span
          className="size-2.5 rounded-full shrink-0"
          style={{ backgroundColor: status.color || "#6b7280" }}
        />
        {editing ? (
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRename();
              if (e.key === "Escape") {
                setName(status.name);
                setEditing(false);
              }
            }}
            className="h-7 text-sm font-semibold"
            autoFocus
          />
        ) : (
          <h3
            className="text-sm font-semibold flex-1 truncate cursor-pointer"
            onDoubleClick={() => setEditing(true)}
          >
            {status.name}
          </h3>
        )}
        <span className="text-xs text-muted-foreground tabular-nums">
          {tickets.length}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger
            className="text-muted-foreground hover:text-foreground p-0.5 rounded"
            aria-label="Column options"
          >
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setEditing(true)}>
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setDeleteOpen(true)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="size-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Column Body */}
      <div
        ref={setDropRef}
        className={cn(
          "flex-1 space-y-2 p-1 rounded-lg transition-all min-h-[100px]",
          isOver && "ring-2 ring-primary/20 bg-primary/5"
        )}
      >
        {isLoading ? (
          <>
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </>
        ) : (
          <SortableContext
            items={ticketIds}
            strategy={verticalListSortingStrategy}
          >
            {tickets.length === 0 && !isOver && (
              <Card className="border-dashed p-4 text-center">
                <p className="text-xs text-muted-foreground">
                  Drop tickets here
                </p>
              </Card>
            )}
            {tickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </SortableContext>
        )}
        <CreateTicketForm statusId={status.id} />
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &quot;{status.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the column and all {tickets.length} ticket(s) in
              it. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setDeleteOpen(false);
                deleteStatus(status.id);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
