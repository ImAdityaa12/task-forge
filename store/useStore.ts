import { create } from "zustand";
import { toast } from "sonner";
import type {
  Status,
  Ticket,
  Assignee,
  Category,
  AppUser,
  Comment,
  CreateTicketInput,
  CreateStatusInput,
  CreateAssigneeInput,
  CreateCategoryInput,
  CreateCommentInput,
} from "@/types";

interface AppState {
  statuses: Status[];
  tickets: Ticket[];
  assignees: Assignee[];
  categories: Category[];
  comments: Comment[];

  activeTicketId: string | null;
  selectedTicketId: string | null;
  sortByPriority: boolean;
  filterAssigneeId: string | null;
  filterCategoryId: string | null;
  isLoading: boolean;

  setActiveTicketId: (id: string | null) => void;
  setSelectedTicketId: (id: string | null) => void;
  setSortByPriority: (value: boolean) => void;
  setFilterAssigneeId: (id: string | null) => void;
  setFilterCategoryId: (id: string | null) => void;

  fetchAll: () => Promise<void>;
  moveTicket: (
    ticketId: string,
    targetStatusId: string,
    newPosition: number
  ) => Promise<void>;
  createTicket: (data: CreateTicketInput) => Promise<void>;
  updateTicket: (id: string, data: Partial<Ticket>) => Promise<void>;
  deleteTicket: (id: string) => Promise<void>;
  createStatus: (data: CreateStatusInput) => Promise<void>;
  updateStatus: (id: string, data: Partial<Status>) => Promise<void>;
  deleteStatus: (id: string) => Promise<void>;
  reorderStatuses: (orderedIds: string[]) => Promise<void>;
  createAssignee: (data: CreateAssigneeInput) => Promise<void>;
  updateAssignee: (id: string, data: Partial<Assignee>) => Promise<void>;
  deleteAssignee: (id: string) => Promise<void>;
  assignAppUser: (appUser: AppUser) => Promise<string>;
  createCategory: (data: CreateCategoryInput) => Promise<void>;
  updateCategory: (id: string, data: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  fetchComments: (ticketId: string) => Promise<void>;
  createComment: (ticketId: string, data: CreateCommentInput) => Promise<void>;
  updateComment: (id: string, content: string) => Promise<void>;
  deleteComment: (id: string) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  statuses: [],
  tickets: [],
  assignees: [],
  categories: [],
  comments: [],

  activeTicketId: null,
  selectedTicketId: null,
  sortByPriority: false,
  filterAssigneeId: null,
  filterCategoryId: null,
  isLoading: true,

  setActiveTicketId: (id) => set({ activeTicketId: id }),
  setSelectedTicketId: (id) => set({ selectedTicketId: id }),
  setSortByPriority: (value) => set({ sortByPriority: value }),
  setFilterAssigneeId: (id) => set({ filterAssigneeId: id }),
  setFilterCategoryId: (id) => set({ filterCategoryId: id }),

  fetchAll: async () => {
    set({ isLoading: true });
    try {
      const [statusesRes, ticketsRes, assigneesRes, categoriesRes] = await Promise.all([
        fetch("/api/statuses"),
        fetch("/api/tickets"),
        fetch("/api/assignees"),
        fetch("/api/categories"),
      ]);

      if (!statusesRes.ok || !ticketsRes.ok || !assigneesRes.ok || !categoriesRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const [statuses, tickets, assignees, categories] = await Promise.all([
        statusesRes.json(),
        ticketsRes.json(),
        assigneesRes.json(),
        categoriesRes.json(),
      ]);

      set({ statuses, tickets, assignees, categories, isLoading: false });
    } catch {
      toast.error("Failed to load board data");
      set({ isLoading: false });
    }
  },

  moveTicket: async (ticketId, targetStatusId, newPosition) => {
    const prev = get().tickets;

    // Optimistic update
    set({
      tickets: prev.map((t) =>
        t.id === ticketId
          ? { ...t, statusId: targetStatusId, position: newPosition }
          : t
      ),
    });

    try {
      const res = await fetch("/api/tickets/move", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId, targetStatusId, newPosition }),
      });
      if (!res.ok) throw new Error();
      // Refetch to get accurate positions
      const ticketsRes = await fetch("/api/tickets");
      if (ticketsRes.ok) {
        set({ tickets: await ticketsRes.json() });
      }
    } catch {
      set({ tickets: prev });
      toast.error("Failed to move ticket");
    }
  },

  createTicket: async (data) => {
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      const ticket = await res.json();
      set({ tickets: [...get().tickets, ticket] });
      toast.success("Ticket created");
    } catch {
      toast.error("Failed to create ticket");
    }
  },

  updateTicket: async (id, data) => {
    const prev = get().tickets;
    set({
      tickets: prev.map((t) => (t.id === id ? { ...t, ...data } : t)),
    });

    try {
      const res = await fetch(`/api/tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      set({
        tickets: get().tickets.map((t) => (t.id === id ? updated : t)),
      });
    } catch {
      set({ tickets: prev });
      toast.error("Failed to update ticket");
    }
  },

  deleteTicket: async (id) => {
    const prev = get().tickets;
    set({ tickets: prev.filter((t) => t.id !== id), selectedTicketId: null });

    try {
      const res = await fetch(`/api/tickets/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Ticket deleted");
    } catch {
      set({ tickets: prev });
      toast.error("Failed to delete ticket");
    }
  },

  createStatus: async (data) => {
    try {
      const res = await fetch("/api/statuses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      const status = await res.json();
      set({ statuses: [...get().statuses, status] });
      toast.success("Status created");
    } catch {
      toast.error("Failed to create status");
    }
  },

  updateStatus: async (id, data) => {
    const prev = get().statuses;
    set({
      statuses: prev.map((s) => (s.id === id ? { ...s, ...data } : s)),
    });

    try {
      const res = await fetch(`/api/statuses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      set({
        statuses: get().statuses.map((s) => (s.id === id ? updated : s)),
      });
    } catch {
      set({ statuses: prev });
      toast.error("Failed to update status");
    }
  },

  deleteStatus: async (id) => {
    const prev = get().statuses;

    if (prev.length <= 1) {
      toast.error("Cannot delete the last status column");
      return;
    }

    set({
      statuses: prev.filter((s) => s.id !== id),
      tickets: get().tickets.filter((t) => t.statusId !== id),
    });

    try {
      const res = await fetch(`/api/statuses/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Status deleted");
    } catch {
      set({ statuses: prev });
      toast.error("Failed to delete status");
    }
  },

  reorderStatuses: async (orderedIds) => {
    const prev = get().statuses;
    const reordered = orderedIds
      .map((id, i) => {
        const s = prev.find((s) => s.id === id);
        return s ? { ...s, position: i } : null;
      })
      .filter(Boolean) as Status[];

    set({ statuses: reordered });

    try {
      const res = await fetch("/api/statuses/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds }),
      });
      if (!res.ok) throw new Error();
    } catch {
      set({ statuses: prev });
      toast.error("Failed to reorder statuses");
    }
  },

  createAssignee: async (data) => {
    try {
      const res = await fetch("/api/assignees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      const assignee = await res.json();
      set({ assignees: [...get().assignees, assignee] });
      toast.success("Assignee added");
    } catch {
      toast.error("Failed to create assignee");
    }
  },

  updateAssignee: async (id, data) => {
    const prev = get().assignees;
    set({
      assignees: prev.map((a) => (a.id === id ? { ...a, ...data } : a)),
    });

    try {
      const res = await fetch(`/api/assignees/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      set({
        assignees: get().assignees.map((a) => (a.id === id ? updated : a)),
      });
    } catch {
      set({ assignees: prev });
      toast.error("Failed to update assignee");
    }
  },

  assignAppUser: async (appUser) => {
    // Check if already linked
    const existing = get().assignees.find(
      (a) => a.linkedUserId === appUser.id
    );
    if (existing) return existing.id;

    const res = await fetch("/api/assignees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: appUser.name,
        email: appUser.email,
        avatarUrl: appUser.image,
        linkedUserId: appUser.id,
      }),
    });
    if (!res.ok) throw new Error("Failed to create assignee from app user");
    const assignee: Assignee = await res.json();
    // Only add to store if not already present (server dedup may return existing)
    if (!get().assignees.find((a) => a.id === assignee.id)) {
      set({ assignees: [...get().assignees, assignee] });
    }
    return assignee.id;
  },

  deleteAssignee: async (id) => {
    const prev = get().assignees;
    set({
      assignees: prev.filter((a) => a.id !== id),
      tickets: get().tickets.map((t) =>
        t.assigneeId === id ? { ...t, assigneeId: null } : t
      ),
    });

    try {
      const res = await fetch(`/api/assignees/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Assignee removed");
    } catch {
      set({ assignees: prev });
      toast.error("Failed to delete assignee");
    }
  },

  createCategory: async (data) => {
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      const category = await res.json();
      set({ categories: [...get().categories, category] });
      toast.success("Category created");
    } catch {
      toast.error("Failed to create category");
    }
  },

  updateCategory: async (id, data) => {
    const prev = get().categories;
    set({
      categories: prev.map((c) => (c.id === id ? { ...c, ...data } : c)),
    });

    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      set({
        categories: get().categories.map((c) => (c.id === id ? updated : c)),
      });
    } catch {
      set({ categories: prev });
      toast.error("Failed to update category");
    }
  },

  deleteCategory: async (id) => {
    const prev = get().categories;
    set({
      categories: prev.filter((c) => c.id !== id),
      tickets: get().tickets.map((t) =>
        t.categoryId === id ? { ...t, categoryId: null } : t
      ),
    });

    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Category deleted");
    } catch {
      set({ categories: prev });
      toast.error("Failed to delete category");
    }
  },

  fetchComments: async (ticketId) => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}/comments`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      set({ comments: data });
    } catch {
      toast.error("Failed to load comments");
    }
  },

  createComment: async (ticketId, data) => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      const comment = await res.json();
      set({ comments: [...get().comments, comment] });
      toast.success("Comment added");
    } catch {
      toast.error("Failed to add comment");
    }
  },

  updateComment: async (id, content) => {
    const prev = get().comments;
    set({
      comments: prev.map((c) => (c.id === id ? { ...c, content } : c)),
    });

    try {
      const res = await fetch(`/api/comments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      set({
        comments: get().comments.map((c) => (c.id === id ? updated : c)),
      });
    } catch {
      set({ comments: prev });
      toast.error("Failed to update comment");
    }
  },

  deleteComment: async (id) => {
    const prev = get().comments;
    // Remove the comment and all its descendants
    const idsToRemove = new Set<string>();
    function collectChildren(parentId: string) {
      idsToRemove.add(parentId);
      for (const c of prev) {
        if (c.parentCommentId === parentId) collectChildren(c.id);
      }
    }
    collectChildren(id);
    set({ comments: prev.filter((c) => !idsToRemove.has(c.id)) });

    try {
      const res = await fetch(`/api/comments/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Comment deleted");
    } catch {
      set({ comments: prev });
      toast.error("Failed to delete comment");
    }
  },
}));
