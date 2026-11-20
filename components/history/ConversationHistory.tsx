"use client";

import { useEffect, useState } from "react";
import { History, Loader2, MessageSquare } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase";
import {
  getConversationHistory,
  listConversations,
  type PersistedMessage,
} from "@/lib/chat-api";
import type { Conversation } from "@/types/chat";

export function ConversationHistory() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<PersistedMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void getSupabaseClient()
      .auth.getUser()
      .then(async ({ data, error: userError }) => {
        if (userError) throw userError;
        if (!data.user) return [];
        return listConversations(data.user.id);
      })
      .then((items) => {
        if (!active) return;
        setConversations(items);
        setSelectedId(items[0]?.conversation_id ?? null);
      })
      .catch((caught: unknown) => {
        if (active) setError(caught instanceof Error ? caught.message : "Failed to load history");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedId) {
      return;
    }

    let active = true;
    void getSupabaseClient()
      .auth.getUser()
      .then(async ({ data, error: userError }) => {
        if (userError) throw userError;
        if (!data.user) return [];
        return getConversationHistory(data.user.id, selectedId);
      })
      .then((items) => {
        if (active) setMessages(items);
      })
      .catch((caught: unknown) => {
        if (active) setError(caught instanceof Error ? caught.message : "Failed to load messages");
      })
      .finally(() => {
        if (active) setMessagesLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedId]);

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</p>;
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <MessageSquare className="h-8 w-8 text-muted-foreground" />
        <h2 className="mt-4 text-base font-semibold text-foreground">No conversations yet</h2>
        <p className="mt-1 text-sm text-muted-foreground">Your chat history will appear here.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-[220px_1fr]">
      <div className="space-y-2">
        {conversations.map((conversation) => (
          <button
            key={conversation.conversation_id}
            type="button"
            onClick={() => {
              setMessagesLoading(true);
              setSelectedId(conversation.conversation_id);
            }}
            className={`w-full rounded-xl border px-3 py-3 text-left transition-colors ${
              selectedId === conversation.conversation_id
                ? "border-primary bg-primary/10"
                : "border-border bg-card hover:bg-muted/50"
            }`}
          >
            <p className="truncate text-sm font-medium text-foreground">Conversation</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {conversation.message_count} message{conversation.message_count === 1 ? "" : "s"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {new Date(conversation.last_message_at).toLocaleString()}
            </p>
          </button>
        ))}
      </div>

      <section className="rounded-xl border border-border bg-card p-4">
        <div className="mb-4 flex items-center gap-2 border-b border-border pb-3">
          <History className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Conversation messages</h2>
        </div>
        {messagesLoading ? (
          <LoadingState />
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <article key={message.id} className="rounded-lg bg-muted/50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-medium uppercase text-muted-foreground">{message.role}</span>
                  <time className="text-xs text-muted-foreground">
                    {new Date(message.created_at).toLocaleString()}
                  </time>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{message.content}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function LoadingState() {
  return <div className="flex items-center justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
}
