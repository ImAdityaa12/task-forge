"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AssigneeAvatar } from "./AssigneeAvatar";
import { useStore } from "@/store/useStore";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
import type { Assignee } from "@/types";

export function AssigneeManager() {
  const assignees = useStore((s) => s.assignees);
  const createAssignee = useStore((s) => s.createAssignee);
  const updateAssignee = useStore((s) => s.updateAssignee);
  const deleteAssignee = useStore((s) => s.deleteAssignee);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Assignee | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  function openCreate() {
    setEditing(null);
    setName("");
    setEmail("");
    setDialogOpen(true);
  }

  function openEdit(a: Assignee) {
    setEditing(a);
    setName(a.name);
    setEmail(a.email || "");
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!name.trim()) return;
    if (editing) {
      await updateAssignee(editing.id, {
        name: name.trim(),
        email: email.trim() || null,
      });
    } else {
      await createAssignee({
        name: name.trim(),
        email: email.trim() || undefined,
      });
    }
    setDialogOpen(false);
  }

  return (
    <>
      <Sheet>
        <SheetTrigger render={<Button variant="outline" size="sm" className="gap-2" />}>
          <Users className="size-4" />
          Assignees
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Manage Assignees</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2"
              onClick={openCreate}
            >
              <Plus className="size-4" />
              Add Assignee
            </Button>
            <div className="space-y-1 mt-4">
              {assignees.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-muted"
                >
                  <AssigneeAvatar assignee={a} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{a.name}</p>
                    {a.email && (
                      <p className="text-xs text-muted-foreground truncate">
                        {a.email}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0"
                    onClick={() => openEdit(a)}
                    aria-label={`Edit ${a.name}`}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0 text-destructive"
                    onClick={() => deleteAssignee(a.id)}
                    aria-label={`Delete ${a.name}`}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))}
              {assignees.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No assignees yet. Add one to get started.
                </p>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Assignee" : "Add Assignee"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="assignee-name">Name</Label>
              <Input
                id="assignee-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assignee-email">Email (optional)</Label>
              <Input
                id="assignee-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!name.trim()}>
              {editing ? "Save" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
