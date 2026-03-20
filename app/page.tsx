"use client";

import { Board } from "@/components/board/Board";
import { BoardHeader } from "@/components/board/BoardHeader";
import { TicketDetailSheet } from "@/components/tickets/TicketDetailSheet";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function HomePage() {
  return (
    <ErrorBoundary>
      <div className="flex flex-col h-screen">
        <BoardHeader />
        <Board />
        <TicketDetailSheet />
      </div>
    </ErrorBoundary>
  );
}
