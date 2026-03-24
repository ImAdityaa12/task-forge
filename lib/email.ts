import { Resend } from "resend";
import { db } from "./db";
import { assignees, user } from "./schema";
import { eq } from "drizzle-orm";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const fromEmail = process.env.RESEND_FROM_EMAIL || "TaskForge <onboarding@resend.dev>";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function sendEmail(to: string, subject: string, html: string) {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set, skipping email to:", to);
    return;
  }
  try {
    console.log("[email] Sending to:", to, "| subject:", subject);
    const result = await resend.emails.send({ from: fromEmail, to, subject, html });
    console.log("[email] Send result:", JSON.stringify(result));
  } catch (err) {
    console.error("[email] Failed to send email:", err);
  }
}

async function resolveAssigneeEmail(assigneeId: string): Promise<string | null> {
  const [assignee] = await db
    .select({ email: assignees.email, linkedUserId: assignees.linkedUserId })
    .from(assignees)
    .where(eq(assignees.id, assigneeId));

  if (!assignee) return null;

  if (assignee.linkedUserId) {
    const [linked] = await db
      .select({ email: user.email })
      .from(user)
      .where(eq(user.id, assignee.linkedUserId));
    if (linked?.email) return linked.email;
  }

  return assignee.email || null;
}

async function resolveCreatorEmail(userId: string): Promise<string | null> {
  const [creator] = await db
    .select({ email: user.email })
    .from(user)
    .where(eq(user.id, userId));
  return creator?.email || null;
}

async function resolveActorEmail(userId: string): Promise<string | null> {
  const [actor] = await db
    .select({ email: user.email })
    .from(user)
    .where(eq(user.id, userId));
  return actor?.email || null;
}

function buildEmailHtml(body: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #e5e5e5; background-color: #0f0f0f; border-radius: 8px;">
      ${body}
      <hr style="border: none; border-top: 1px solid #262626; margin: 24px 0;" />
      <p style="font-size: 12px; color: #737373;">Sent by TaskForge</p>
    </div>
  `;
}

// --- Assignment Notification ---

interface AssignmentParams {
  ticketId: string;
  ticketTitle: string;
  ticketCreatorUserId: string;
  newAssigneeId: string;
  actorUserId: string;
  actorName: string;
}

async function _notifyAssignment(params: AssignmentParams) {
  const { ticketTitle, ticketCreatorUserId, newAssigneeId, actorUserId, actorName } = params;

  const actorEmail = await resolveActorEmail(actorUserId);
  console.log("[email:assign] actor:", actorUserId, actorEmail);

  const recipients: string[] = [];

  const creatorEmail = await resolveCreatorEmail(ticketCreatorUserId);
  console.log("[email:assign] creator:", ticketCreatorUserId, creatorEmail);
  if (creatorEmail && creatorEmail !== actorEmail) {
    recipients.push(creatorEmail);
  }

  const assigneeEmail = await resolveAssigneeEmail(newAssigneeId);
  console.log("[email:assign] assignee:", newAssigneeId, assigneeEmail);
  if (assigneeEmail && assigneeEmail !== actorEmail && !recipients.includes(assigneeEmail)) {
    recipients.push(assigneeEmail);
  }

  console.log("[email:assign] recipients:", recipients);
  if (recipients.length === 0) {
    console.log("[email:assign] No recipients (all excluded as actor). Skipping.");
    return;
  }

  const subject = `Ticket assigned: ${ticketTitle}`;
  const html = buildEmailHtml(`
    <h2 style="font-size: 18px; margin: 0 0 16px;">Ticket Assigned</h2>
    <p style="margin: 0 0 8px;"><strong>${escapeHtml(actorName)}</strong> assigned the ticket:</p>
    <div style="background-color: #1a1a1a; border-left: 3px solid #6366f1; padding: 12px 16px; border-radius: 4px; margin: 12px 0;">
      <strong>${escapeHtml(ticketTitle)}</strong>
    </div>
  `);

  for (const to of recipients) {
    await sendEmail(to, subject, html);
  }
}

export function notifyAssignment(params: AssignmentParams) {
  void _notifyAssignment(params);
}

// --- Comment Notification ---

interface CommentParams {
  ticketId: string;
  ticketTitle: string;
  ticketCreatorUserId: string;
  ticketAssigneeId: string | null;
  commenterUserId: string;
  commenterName: string;
  commentContent: string;
}

async function _notifyComment(params: CommentParams) {
  const {
    ticketTitle,
    ticketCreatorUserId,
    ticketAssigneeId,
    commenterUserId,
    commenterName,
    commentContent,
  } = params;

  const commenterEmail = await resolveActorEmail(commenterUserId);
  console.log("[email:comment] commenter:", commenterUserId, commenterEmail);

  const recipients: string[] = [];

  const creatorEmail = await resolveCreatorEmail(ticketCreatorUserId);
  console.log("[email:comment] creator:", ticketCreatorUserId, creatorEmail);
  if (creatorEmail && creatorEmail !== commenterEmail) {
    recipients.push(creatorEmail);
  }

  if (ticketAssigneeId) {
    const assigneeEmail = await resolveAssigneeEmail(ticketAssigneeId);
    console.log("[email:comment] assignee:", ticketAssigneeId, assigneeEmail);
    if (assigneeEmail && assigneeEmail !== commenterEmail && !recipients.includes(assigneeEmail)) {
      recipients.push(assigneeEmail);
    }
  }

  console.log("[email:comment] recipients:", recipients);
  if (recipients.length === 0) {
    console.log("[email:comment] No recipients (all excluded as commenter). Skipping.");
    return;
  }

  const subject = `New comment on: ${ticketTitle}`;
  const html = buildEmailHtml(`
    <h2 style="font-size: 18px; margin: 0 0 16px;">New Comment</h2>
    <p style="margin: 0 0 8px;"><strong>${escapeHtml(commenterName)}</strong> commented on:</p>
    <div style="background-color: #1a1a1a; border-left: 3px solid #6366f1; padding: 12px 16px; border-radius: 4px; margin: 12px 0;">
      <strong>${escapeHtml(ticketTitle)}</strong>
    </div>
    <div style="background-color: #1a1a1a; padding: 12px 16px; border-radius: 4px; margin: 12px 0; white-space: pre-wrap;">
      ${escapeHtml(commentContent)}
    </div>
  `);

  for (const to of recipients) {
    await sendEmail(to, subject, html);
  }
}

export function notifyComment(params: CommentParams) {
  void _notifyComment(params);
}
