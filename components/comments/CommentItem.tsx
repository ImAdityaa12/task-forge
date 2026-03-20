"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useStore } from "@/store/useStore";
import { getInitials, hashStringToColor } from "@/lib/utils";
import { Pencil, Trash2, Reply, Check, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Comment } from "@/types";

interface CommentItemProps {
  comment: Comment;
  replies: Comment[];
  allComments: Comment[];
  depth?: number;
}

export function CommentItem({
  comment,
  replies,
  allComments,
  depth = 0,
}: CommentItemProps) {
  const updateComment = useStore((s) => s.updateComment);
  const deleteComment = useStore((s) => s.deleteComment);
  const createComment = useStore((s) => s.createComment);

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState("");

  function handleSaveEdit() {
    if (!editContent.trim()) return;
    updateComment(comment.id, editContent.trim());
    setIsEditing(false);
  }

  function handleReply() {
    if (!replyContent.trim()) return;
    createComment(comment.ticketId, {
      content: replyContent.trim(),
      parentCommentId: comment.id,
    });
    setReplyContent("");
    setIsReplying(false);
  }

  function formatTime(d: string | null) {
    if (!d) return "";
    try {
      return formatDistanceToNow(new Date(d), { addSuffix: true });
    } catch {
      return "";
    }
  }

  return (
    <div className={depth > 0 ? "ml-4 pl-3 border-l border-border" : ""}>
      <div className="group py-2">
        <div className="flex items-start gap-2">
          <Avatar className="size-6 text-[10px] shrink-0 mt-0.5">
            <AvatarFallback
              style={{ backgroundColor: hashStringToColor(comment.authorName) }}
              className="text-white font-medium"
            >
              {getInitials(comment.authorName)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{comment.authorName}</span>
              <span className="text-xs text-muted-foreground font-mono">
                {formatTime(comment.createdAt)}
              </span>
            </div>

            {isEditing ? (
              <div className="mt-1 space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[60px] resize-none text-sm"
                  autoFocus
                />
                <div className="flex gap-1">
                  <Button size="sm" variant="default" onClick={handleSaveEdit}>
                    <Check className="size-3 mr-1" />
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setIsEditing(false);
                      setEditContent(comment.content);
                    }}
                  >
                    <X className="size-3 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-foreground/90 mt-0.5 whitespace-pre-wrap">
                {comment.content}
              </p>
            )}

            {!isEditing && (
              <div className="flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-muted-foreground"
                  onClick={() => setIsReplying(!isReplying)}
                >
                  <Reply className="size-3 mr-1" />
                  Reply
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-muted-foreground"
                  onClick={() => {
                    setEditContent(comment.content);
                    setIsEditing(true);
                  }}
                >
                  <Pencil className="size-3 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
                  onClick={() => deleteComment(comment.id)}
                >
                  <Trash2 className="size-3 mr-1" />
                  Delete
                </Button>
              </div>
            )}

            {isReplying && (
              <div className="mt-2 space-y-2">
                <Textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write a reply..."
                  className="min-h-[60px] resize-none text-sm"
                  autoFocus
                />
                <div className="flex gap-1">
                  <Button size="sm" variant="default" onClick={handleReply}>
                    Reply
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setIsReplying(false);
                      setReplyContent("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {replies.map((reply) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          replies={allComments.filter((c) => c.parentCommentId === reply.id)}
          allComments={allComments}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}
