"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PriorityBadge } from "./PriorityBadge";
import { AssigneeCommand } from "@/components/assignees/AssigneeCommand";
import { AssigneeAvatar } from "@/components/assignees/AssigneeAvatar";
import { CommentSection } from "@/components/comments/CommentSection";
import { useStore } from "@/store/useStore";
import { Trash2 } from "lucide-react";
import { format } from "date-fns";
import type { Ticket } from "@/types";

export function TicketDetailSheet() {
  const selectedTicketId = useStore((s) => s.selectedTicketId);
  const setSelectedTicketId = useStore((s) => s.setSelectedTicketId);
  const tickets = useStore((s) => s.tickets);
  const statuses = useStore((s) => s.statuses);
  const assignees = useStore((s) => s.assignees);
  const updateTicket = useStore((s) => s.updateTicket);
  const deleteTicket = useStore((s) => s.deleteTicket);

  const ticket = tickets.find((t) => t.id === selectedTicketId) ?? null;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    if (ticket) {
      setTitle(ticket.title);
      setDescription(ticket.description || "");
    }
  }, [ticket]);

  const saveField = useCallback(
    (field: keyof Ticket, value: unknown) => {
      if (!ticket) return;
      updateTicket(ticket.id, { [field]: value } as Partial<Ticket>);
    },
    [ticket, updateTicket]
  );

  const assignee = assignees.find((a) => a.id === ticket?.assigneeId) ?? null;

  function formatDate(d: string | null) {
    if (!d) return "—";
    try {
      return format(new Date(d), "MMM d, yyyy 'at' h:mm a");
    } catch {
      return d;
    }
  }

  return (
    <Sheet
      open={!!selectedTicketId}
      onOpenChange={(open) => {
        if (!open) setSelectedTicketId(null);
      }}
    >
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        {ticket && (
          <>
            <SheetHeader>
              <SheetTitle className="sr-only">Ticket Details</SheetTitle>
            </SheetHeader>
            <div className="space-y-5 mt-2 px-4">
              {/* Title */}
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => {
                  if (title.trim() && title !== ticket.title) {
                    saveField("title", title.trim());
                  }
                }}
                className="text-lg font-semibold border-transparent hover:border-border focus:border-border px-2 -mx-2"
              />

              {/* Description */}
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs">
                  Description
                </Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={() => {
                    if (description !== (ticket.description || "")) {
                      saveField("description", description);
                    }
                  }}
                  placeholder="Add a description..."
                  className="min-h-[100px] resize-none"
                />
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs">Status</Label>
                <Select
                  value={ticket.statusId}
                  onValueChange={(v) => saveField("statusId", v)}
                >
                  <SelectTrigger>
                    {(() => {
                      const current = statuses.find((s) => s.id === ticket.statusId);
                      return current ? (
                        <span className="flex items-center gap-2">
                          <span
                            className="size-2 rounded-full shrink-0"
                            style={{ backgroundColor: current.color || "#6b7280" }}
                          />
                          {current.name}
                        </span>
                      ) : (
                        <SelectValue />
                      );
                    })()}
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        <span className="flex items-center gap-2">
                          <span
                            className="size-2 rounded-full shrink-0"
                            style={{
                              backgroundColor: s.color || "#6b7280",
                            }}
                          />
                          {s.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs">
                  Priority
                </Label>
                <div>
                  <PriorityBadge
                    priority={ticket.priority}
                    onChange={(p) => saveField("priority", p)}
                  />
                </div>
              </div>

              {/* Assignee */}
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs">
                  Assignee
                </Label>
                <AssigneeCommand
                  currentAssigneeId={ticket.assigneeId}
                  onSelect={(id) => saveField("assigneeId", id)}
                >
                  <div className="flex items-center gap-2 p-2 rounded-md hover:bg-muted w-full text-left text-sm cursor-pointer">
                    <AssigneeAvatar assignee={assignee} size="sm" />
                    <span>{assignee?.name || "Unassigned"}</span>
                  </div>
                </AssigneeCommand>
              </div>

              {/* Metadata */}
              <div className="space-y-1 pt-2 border-t">
                <p className="text-xs text-muted-foreground font-mono">
                  Created: {formatDate(ticket.createdAt)}
                </p>
                <p className="text-xs text-muted-foreground font-mono">
                  Updated: {formatDate(ticket.updatedAt)}
                </p>
              </div>

              {/* Comments */}
              <CommentSection ticketId={ticket.id} />

              {/* Delete */}
              <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogTrigger
                  render={
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full gap-2"
                    />
                  }
                >
                  <Trash2 className="size-4" />
                  Delete Ticket
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete ticket?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete
                      &quot;{ticket.title}&quot;.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        setDeleteOpen(false);
                        deleteTicket(ticket.id);
                      }}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
