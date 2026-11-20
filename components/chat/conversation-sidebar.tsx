"use client";

import Link from "next/link";
import {
  BookOpen,
  Loader2,
  LogOut,
  MessageSquare,
  MessageSquarePlus,
  User,
} from "lucide-react";
import type { Conversation } from "@/types/chat";
import { cn } from "@/lib/utils";

interface ConversationSidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  loading: boolean;
  userEmail: string;
  onNewChat: () => void;
  onSelectConversation: (conversationId: string) => void;
  onSignOut: () => void;
}

export function ConversationSidebar({
  conversations,
  activeConversationId,
  loading,
  userEmail,
  onNewChat,
  onSelectConversation,
  onSignOut,
}: ConversationSidebarProps) {
  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-r border-border bg-muted/30">
      <div className="flex h-14 items-center gap-3 border-b border-border px-4">
        <span className="text-sm font-semibold text-foreground">SuperAgent</span>
      </div>

      <div className="p-3">
        <button
          type="button"
          onClick={onNewChat}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <MessageSquarePlus className="h-4 w-4" />
          New chat
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        <p className="px-3 pb-2 pt-1 text-xs font-medium text-muted-foreground">Recent conversations</p>
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : conversations.length === 0 ? (
          <p className="px-3 py-6 text-center text-xs leading-5 text-muted-foreground">
            Your conversations will appear here.
          </p>
        ) : (
          <div className="space-y-1">
            {conversations.map((conversation) => (
              <button
                key={conversation.conversation_id}
                type="button"
                onClick={() => onSelectConversation(conversation.conversation_id)}
                className={cn(
                  "w-full rounded-lg px-3 py-2.5 text-left transition-colors",
                  activeConversationId === conversation.conversation_id
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent/70 hover:text-foreground",
                )}
              >
                <div className="flex items-start gap-2">
                  <MessageSquare className="mt-0.5 h-4 w-4 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {conversation.preview || "Conversation"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(conversation.last_message_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-1 border-t border-border p-3">
        <Link
          href="/rag"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <BookOpen className="h-4 w-4" />
          Knowledge base
        </Link>
        <Link
          href="/history"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <MessageSquare className="h-4 w-4" />
          Full history
        </Link>
        <div className="flex items-center gap-3 px-3 py-2 text-xs text-muted-foreground" title={userEmail}>
          <User className="h-4 w-4 shrink-0" />
          <span className="truncate">{userEmail}</span>
        </div>
        <button
          type="button"
          onClick={onSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
