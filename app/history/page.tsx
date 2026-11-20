"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, History } from "lucide-react";
import { ConversationHistory } from "@/components/history/ConversationHistory";

export default function HistoryPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Chat
        </button>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-primary to-primary/80">
          <History className="h-4 w-4 text-primary-foreground" />
        </div>
        <h1 className="text-base font-semibold text-foreground">Conversation history</h1>
      </header>
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="mx-auto max-w-5xl">
          <ConversationHistory />
        </div>
      </main>
    </div>
  );
}
