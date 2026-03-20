import { create } from "zustand";
import { toast } from "sonner";
import type {
  Status,
  Ticket,
  Assignee,
  CreateTicketInput,
  CreateStatusInput,
  CreateAssigneeInput,
} from "@/types";

interface AppState {
  statuses: Status[];
  tickets: Ticket[];
  assignees: Assignee[];

  activeTicketId: string | null;
  selectedTicketId: string | null;
  sortByPriority: boolean;
  filterAssigneeId: string | null;
  isLoading: boolean;

  setActiveTicketId: (id: string | null) => void;
  setSelectedTicketId: (id: string | null) => void;
  setSortByPriority: (value: boolean) => void;
  setFilterAssigneeId: (id: string | null) => void;

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
}

export const useStore = create<AppState>((set, get) => ({
  statuses: [],
  tickets: [],
  assignees: [],

  activeTicketId: null,
  selectedTicketId: null,
  sortByPriority: false,
  filterAssigneeId: null,
  isLoading: true,

  setActiveTicketId: (id) => set({ activeTicketId: id }),
  setSelectedTicketId: (id) => set({ selectedTicketId: id }),
  setSortByPriority: (value) => set({ sortByPriority: value }),
  setFilterAssigneeId: (id) => set({ filterAssigneeId: id }),

  fetchAll: async () => {
    set({ isLoading: true });
    try {
      const [statusesRes, ticketsRes, assigneesRes] = await Promise.all([
        fetch("/api/statuses"),
        fetch("/api/tickets"),
        fetch("/api/assignees"),
      ]);

      if (!statusesRes.ok || !ticketsRes.ok || !assigneesRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const [statuses, tickets, assignees] = await Promise.all([
        statusesRes.json(),
        ticketsRes.json(),
        assigneesRes.json(),
      ]);

      set({ statuses, tickets, assignees, isLoading: false });
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
    } catch {
      set({ assignees: prev });
      toast.error("Failed to delete assignee");
    }
  },
}));
