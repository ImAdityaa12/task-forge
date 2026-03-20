"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStore } from "@/store/useStore";
import { Plus, X } from "lucide-react";

interface CreateTicketFormProps {
  statusId: string;
}

export function CreateTicketForm({ statusId }: CreateTicketFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const createTicket = useStore((s) => s.createTicket);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    await createTicket({ title: title.trim(), statusId });
    setTitle("");
    setIsOpen(false);
  }

  if (!isOpen) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start gap-2 text-muted-foreground"
        onClick={() => setIsOpen(true)}
      >
        <Plus className="size-4" />
        Add ticket
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Ticket title..."
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Escape") setIsOpen(false);
        }}
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={!title.trim()}>
          Add
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => setIsOpen(false)}
          aria-label="Cancel"
        >
          <X className="size-4" />
        </Button>
      </div>
    </form>
  );
}
