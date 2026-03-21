export interface Status {
  id: string;
  userId: string;
  name: string;
  color: string | null;
  position: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  color: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface Ticket {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  statusId: string;
  assigneeId: string | null;
  categoryId: string | null;
  priority: "urgent" | "high" | "medium" | "low" | "none";
  position: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface Assignee {
  id: string;
  userId: string;
  name: string;
  avatarUrl: string | null;
  email: string | null;
  linkedUserId: string | null;
  createdAt: string | null;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

export interface CreateTicketInput {
  title: string;
  description?: string;
  statusId: string;
  assigneeId?: string;
  priority?: Ticket["priority"];
}

export interface CreateStatusInput {
  name: string;
  color?: string;
}

export interface CreateAssigneeInput {
  name: string;
  email?: string;
  avatarUrl?: string;
}

export interface CreateCategoryInput {
  name: string;
  color?: string;
}

export interface Comment {
  id: string;
  userId: string;
  ticketId: string;
  parentCommentId: string | null;
  content: string;
  authorName: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CreateCommentInput {
  content: string;
  parentCommentId?: string;
}
