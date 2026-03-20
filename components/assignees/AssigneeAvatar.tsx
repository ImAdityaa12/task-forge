"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials, hashStringToColor, cn } from "@/lib/utils";
import type { Assignee } from "@/types";

interface AssigneeAvatarProps {
  assignee: Assignee | null;
  size?: "sm" | "md";
  className?: string;
}

export function AssigneeAvatar({
  assignee,
  size = "sm",
  className,
}: AssigneeAvatarProps) {
  const sizeClass = size === "sm" ? "size-6 text-[10px]" : "size-8 text-xs";

  if (!assignee) {
    return (
      <Avatar className={cn(sizeClass, className)}>
        <AvatarFallback className="bg-muted text-muted-foreground">
          ?
        </AvatarFallback>
      </Avatar>
    );
  }

  return (
    <Avatar className={cn(sizeClass, className)}>
      {assignee.avatarUrl && <AvatarImage src={assignee.avatarUrl} alt={assignee.name} />}
      <AvatarFallback
        style={{ backgroundColor: hashStringToColor(assignee.name) }}
        className="text-white font-medium"
      >
        {getInitials(assignee.name)}
      </AvatarFallback>
    </Avatar>
  );
}
