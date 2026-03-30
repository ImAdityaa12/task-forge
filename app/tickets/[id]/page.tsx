"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
import { PriorityBadge } from "@/components/tickets/PriorityBadge";
import { AssigneeCommand } from "@/components/assignees/AssigneeCommand";
import { AssigneeAvatar } from "@/components/assignees/AssigneeAvatar";
import { CategoryCommand } from "@/components/categories/CategoryCommand";
import { CategoryBadge } from "@/components/categories/CategoryBadge";
import { CommentSection } from "@/components/comments/CommentSection";
import { useStore } from "@/store/useStore";
import { ArrowLeft, Trash2, CalendarIcon, X } from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import type { Ticket } from "@/types";

export default function TicketDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const tickets = useStore((s) => s.tickets);
  const statuses = useStore((s) => s.statuses);
  const assignees = useStore((s) => s.assignees);
  const categories = useStore((s) => s.categories);
  const isLoading = useStore((s) => s.isLoading);
  const fetchAll = useStore((s) => s.fetchAll);
  const updateTicket = useStore((s) => s.updateTicket);
  const deleteTicket = useStore((s) => s.deleteTicket);

  const ticket = tickets.find((t) => t.id === params.id) ?? null;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Load store data if navigated directly to this URL
  useEffect(() => {
    if (statuses.length === 0 && isLoading) {
      fetchAll();
    }
  }, [statuses.length, isLoading, fetchAll]);

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

  async function handleDelete() {
    if (!ticket) return;
    setDeleteOpen(false);
    await deleteTicket(ticket.id);
    router.push("/");
  }

  const assignee = assignees.find((a) => a.id === ticket?.assigneeId) ?? null;
  const category = categories.find((c) => c.id === ticket?.categoryId) ?? null;
  const currentStatus = statuses.find((s) => s.id === ticket?.statusId);

  function formatDate(d: string | null) {
    if (!d) return "—";
    try {
      return format(new Date(d), "MMM d, yyyy 'at' h:mm a");
    } catch {
      return d;
    }
  }

  if (isLoading && !ticket) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-muted-foreground">Ticket not found</p>
        <Button variant="outline" onClick={() => router.push("/")}>
          <ArrowLeft className="size-4 mr-2" />
          Back to board
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b px-6 py-3 flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/")}
          className="gap-2"
        >
          <ArrowLeft className="size-4" />
          Back
        </Button>
        <Separator orientation="vertical" className="h-5" />
        {currentStatus && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: currentStatus.color || "#6b7280" }}
            />
            {currentStatus.name}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
        {/* Left — Main content */}
        <div className="space-y-6 min-w-0">
          {/* Title */}
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => {
              if (title.trim() && title !== ticket.title) {
                saveField("title", title.trim());
              }
            }}
            className="text-2xl font-bold border-transparent hover:border-border focus:border-border h-auto py-2 px-3"
          />

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs">Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => {
                if (description !== (ticket.description || "")) {
                  saveField("description", description);
                }
              }}
              placeholder="Add a description..."
              className="min-h-[200px] resize-y"
            />
          </div>

          {/* Comments */}
          <CommentSection ticketId={ticket.id} />
        </div>

        {/* Right — Sidebar */}
        <div className="space-y-5">
          {/* Status */}
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs">Status</Label>
            <Select
              value={ticket.statusId}
              onValueChange={(v) => saveField("statusId", v)}
            >
              <SelectTrigger>
                {currentStatus ? (
                  <span className="flex items-center gap-2">
                    <span
                      className="size-2 rounded-full shrink-0"
                      style={{ backgroundColor: currentStatus.color || "#6b7280" }}
                    />
                    {currentStatus.name}
                  </span>
                ) : (
                  <SelectValue />
                )}
              </SelectTrigger>
              <SelectContent>
                {statuses.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    <span className="flex items-center gap-2">
                      <span
                        className="size-2 rounded-full shrink-0"
                        style={{ backgroundColor: s.color || "#6b7280" }}
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
            <Label className="text-muted-foreground text-xs">Priority</Label>
            <div>
              <PriorityBadge
                priority={ticket.priority}
                onChange={(p) => saveField("priority", p)}
              />
            </div>
          </div>

          {/* Assignee */}
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs">Assignee</Label>
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

          {/* Category */}
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs">Category</Label>
            <CategoryCommand
              currentCategoryId={ticket.categoryId}
              onSelect={(id) => saveField("categoryId", id)}
            >
              <div className="flex items-center gap-2 p-2 rounded-md hover:bg-muted w-full text-left text-sm cursor-pointer">
                {category ? (
                  <CategoryBadge category={category} />
                ) : (
                  <span className="text-muted-foreground">No category</span>
                )}
              </div>
            </CategoryCommand>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs">Due Date</Label>
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger
                  render={
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "w-full justify-start text-left font-normal gap-2",
                        !ticket.dueAt && "text-muted-foreground",
                        ticket.dueAt &&
                          isPast(new Date(ticket.dueAt)) &&
                          !isToday(new Date(ticket.dueAt)) &&
                          "text-destructive border-destructive/50"
                      )}
                    />
                  }
                >
                  <CalendarIcon className="size-4" />
                  {ticket.dueAt
                    ? format(new Date(ticket.dueAt), "MMM d, yyyy")
                    : "Set due date"}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={
                      ticket.dueAt ? new Date(ticket.dueAt) : undefined
                    }
                    onSelect={(date) => {
                      saveField("dueAt", date ? date.toISOString() : null);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {ticket.dueAt && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0"
                  onClick={() => saveField("dueAt", null)}
                  aria-label="Clear due date"
                >
                  <X className="size-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Metadata */}
          <div className="space-y-1 pt-4 border-t">
            <p className="text-xs text-muted-foreground font-mono">
              Created: {formatDate(ticket.createdAt)}
            </p>
            <p className="text-xs text-muted-foreground font-mono">
              Updated: {formatDate(ticket.updatedAt)}
            </p>
          </div>

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
                <AlertDialogAction onClick={handleDelete}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
