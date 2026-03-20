"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useStore } from "@/store/useStore";
import { CommentItem } from "./CommentItem";
import { MessageSquare } from "lucide-react";

interface CommentSectionProps {
  ticketId: string;
}

export function CommentSection({ ticketId }: CommentSectionProps) {
  const comments = useStore((s) => s.comments);
  const fetchComments = useStore((s) => s.fetchComments);
  const createComment = useStore((s) => s.createComment);

  const [content, setContent] = useState("");

  useEffect(() => {
    fetchComments(ticketId);
  }, [ticketId, fetchComments]);

  function handleSubmit() {
    if (!content.trim()) return;
    createComment(ticketId, { content: content.trim() });
    setContent("");
  }

  const rootComments = comments.filter((c) => !c.parentCommentId);

  return (
    <div className="space-y-3">
      <Separator />
      <div className="flex items-center gap-2">
        <MessageSquare className="size-4 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">
          Comments ({comments.length})
        </span>
      </div>

      <div className="space-y-1">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add a comment..."
          className="min-h-[70px] resize-none text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">
            Ctrl+Enter to submit
          </span>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!content.trim()}
          >
            Comment
          </Button>
        </div>
      </div>

      {rootComments.length > 0 && (
        <div className="space-y-0">
          {rootComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              replies={comments.filter(
                (c) => c.parentCommentId === comment.id
              )}
              allComments={comments}
            />
          ))}
        </div>
      )}
    </div>
  );
}
