"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useStore } from "@/store/useStore";
import { Tag, Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Category } from "@/types";

const PRESET_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
  "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#3b82f6", "#6b7280",
];

interface EditRowProps {
  category: Category;
  onDone: () => void;
}

function EditRow({ category, onDone }: EditRowProps) {
  const updateCategory = useStore((s) => s.updateCategory);
  const [name, setName] = useState(category.name);
  const [color, setColor] = useState(category.color || "#6b7280");

  async function handleSave() {
    if (!name.trim()) return;
    await updateCategory(category.id, { name: name.trim(), color });
    onDone();
  }

  return (
    <div className="space-y-3 rounded-md border p-3 bg-muted/30">
      <div className="space-y-1.5">
        <Label className="text-xs">Name</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") onDone();
          }}
          autoFocus
          className="h-8 text-sm"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Color</Label>
        <div className="flex gap-1.5 flex-wrap">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={cn(
                "size-5 rounded-sm transition-transform hover:scale-110",
                color === c && "ring-2 ring-offset-1 ring-foreground"
              )}
              style={{ backgroundColor: c }}
              onClick={() => setColor(c)}
              aria-label={c}
            />
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" className="h-7 text-xs" onClick={handleSave} disabled={!name.trim()}>
          <Check className="size-3 mr-1" />
          Save
        </Button>
        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onDone}>
          <X className="size-3 mr-1" />
          Cancel
        </Button>
      </div>
    </div>
  );
}

function CreateRow({ onDone }: { onDone: () => void }) {
  const createCategory = useStore((s) => s.createCategory);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#6366f1");

  async function handleCreate() {
    if (!name.trim()) return;
    await createCategory({ name: name.trim(), color });
    setName("");
    onDone();
  }

  return (
    <div className="space-y-3 rounded-md border border-dashed p-3">
      <div className="space-y-1.5">
        <Label className="text-xs">Name</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleCreate();
            if (e.key === "Escape") onDone();
          }}
          placeholder="e.g. Frontend, Bug, Feature..."
          autoFocus
          className="h-8 text-sm"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Color</Label>
        <div className="flex gap-1.5 flex-wrap">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={cn(
                "size-5 rounded-sm transition-transform hover:scale-110",
                color === c && "ring-2 ring-offset-1 ring-foreground"
              )}
              style={{ backgroundColor: c }}
              onClick={() => setColor(c)}
              aria-label={c}
            />
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" className="h-7 text-xs" onClick={handleCreate} disabled={!name.trim()}>
          <Plus className="size-3 mr-1" />
          Create
        </Button>
        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

export function CategoryManager() {
  const categories = useStore((s) => s.categories);
  const deleteCategory = useStore((s) => s.deleteCategory);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" />
        }
      >
        <Tag className="size-3.5" />
        Categories
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-sm overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Tag className="size-4" />
            Manage Categories
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-3 px-1">
          {categories.map((cat) =>
            editingId === cat.id ? (
              <EditRow
                key={cat.id}
                category={cat}
                onDone={() => setEditingId(null)}
              />
            ) : (
              <div
                key={cat.id}
                className="flex items-center justify-between gap-2 rounded-md border px-3 py-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="size-3 rounded-sm shrink-0"
                    style={{ backgroundColor: cat.color || "#6b7280" }}
                  />
                  <span className="text-sm truncate">{cat.name}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={() => {
                      setShowCreate(false);
                      setEditingId(cat.id);
                    }}
                    aria-label="Edit category"
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <AlertDialog
                    open={deleteId === cat.id}
                    onOpenChange={(open) => !open && setDeleteId(null)}
                  >
                    <AlertDialogTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-destructive hover:text-destructive"
                          aria-label="Delete category"
                        />
                      }
                      onClick={() => setDeleteId(cat.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete category?</AlertDialogTitle>
                        <AlertDialogDescription>
                          &quot;{cat.name}&quot; will be removed from all tickets. This
                          cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            setDeleteId(null);
                            deleteCategory(cat.id);
                          }}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            )
          )}

          {categories.length === 0 && !showCreate && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No categories yet. Create one to organize your tickets.
            </p>
          )}

          {showCreate ? (
            <CreateRow onDone={() => setShowCreate(false)} />
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 border-dashed"
              onClick={() => {
                setEditingId(null);
                setShowCreate(true);
              }}
            >
              <Plus className="size-4" />
              New Category
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
