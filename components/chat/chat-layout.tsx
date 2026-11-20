"use client";

import { useState, useCallback, useEffect } from "react";
import type { Session } from "@supabase/supabase-js";
import { useWebSocket } from "@/hooks/use-websocket";
import type {
  Message,
  DisplayItem,
  ToolActivity,
  ChatEvent,
} from "@/types/chat";
import { ChatArea } from "./chat-area";
import { ConversationSidebar } from "./conversation-sidebar";
import { PdfUploadDialog } from "./pdf-upload-dialog";
import { AuthForm } from "@/components/auth/auth-form";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import { getConversationHistory, listConversations } from "@/lib/chat-api";
import type { Conversation } from "@/types/chat";
import { cn } from "@/lib/utils";

async function addConversationPreviews(
  userId: string,
  items: Conversation[],
): Promise<Conversation[]> {
  return Promise.all(
    items.map(async (conversation) => {
      if (conversation.preview) return conversation;

      try {
        const messages = await getConversationHistory(userId, conversation.conversation_id);
        const firstUserMessage = messages.find(
          (message) => message.role === "user" && message.content.trim(),
        );
        return {
          ...conversation,
          preview: firstUserMessage?.content.trim().slice(0, 80) || "Untitled chat",
        };
      } catch {
        return { ...conversation, preview: "Untitled chat" };
      }
    }),
  );
}

export function ChatLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(() => !isSupabaseConfigured());
  const [authError, setAuthError] = useState<string | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [displayItems, setDisplayItems] = useState<DisplayItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // PDF upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      return;
    }

    const supabase = getSupabaseClient();
    let mounted = true;

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      if (error) setAuthError(error.message);
      setSession(data.session);
      if (!data.session) {
        setActiveConversationId(null);
        setDisplayItems([]);
      }
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) {
        setActiveConversationId(null);
        setDisplayItems([]);
      }
      setAuthLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const userId = session?.user.id ?? null;

  useEffect(() => {
    if (!userId) return;

    let active = true;
    void listConversations(userId)
      .then(async (items) => {
        if (!active) return;
        const itemsWithPreviews = await addConversationPreviews(userId, items);
        if (!active) return;
        setConversations(itemsWithPreviews);

        const latest = itemsWithPreviews[0];
        if (!latest) return;

        const messages = await getConversationHistory(userId, latest.conversation_id);
        if (!active) return;
        setActiveConversationId(latest.conversation_id);
        setDisplayItems(
          messages.map((message) => ({
            kind: "message",
            data: {
              id: message.id,
              role: message.role,
              content: message.content,
              timestamp: new Date(message.created_at),
            },
          })),
        );
      })
      .catch((error: unknown) => {
        if (active) console.warn("Could not restore chat history:", error);
      })
      .finally(() => {
        if (active) setConversationsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [userId]);

  const refreshConversations = useCallback(async () => {
    if (!userId) return;
    try {
      const items = await listConversations(userId);
      setConversations(await addConversationPreviews(userId, items));
    } catch (error) {
      console.warn("Could not refresh conversations:", error);
    }
  }, [userId]);

  const handleSelectConversation = useCallback(
    async (conversationId: string) => {
      if (!userId) return;
      setIsLoading(false);
      try {
        const messages = await getConversationHistory(userId, conversationId);
        setActiveConversationId(conversationId);
        setDisplayItems(
          messages.map((message) => ({
            kind: "message",
            data: {
              id: message.id,
              role: message.role,
              content: message.content,
              timestamp: new Date(message.created_at),
            },
          })),
        );
        if (window.matchMedia("(max-width: 767px)").matches) {
          setSidebarOpen(false);
        }
      } catch (error) {
        console.warn("Could not load conversation:", error);
      }
    },
    [userId],
  );

  const handleEvent = useCallback((event: ChatEvent) => {
    switch (event.type) {
      case "rag_context":
      case "tool_search":
      case "tool_call":
      case "tool_result":
      case "connection_status":
      case "connection_required": {
        // Capture conversation_id so auth_completed can reference it
        if (event.data.conversation_id) {
          setActiveConversationId(event.data.conversation_id as string);
        }
        const connActivity = {
          type: event.type,
          data: event.data,
        } as unknown as ToolActivity;
        setDisplayItems((prev) => [
          ...prev,
          { kind: "tool", data: connActivity },
        ]);
        break;
      }
      case "connection_waiting":
      case "connection_established": {
        const toolActivity = {
          type: event.type,
          data: event.data,
        } as unknown as ToolActivity;
        setDisplayItems((prev) => [
          ...prev,
          { kind: "tool", data: toolActivity },
        ]);
        break;
      }
      case "reply": {
        const reply: Message = {
          id: `msg-${Date.now()}`,
          role: "assistant",
          content: (event.data.content as string) || "",
          timestamp: new Date(),
        };
        setDisplayItems((prev) => [...prev, { kind: "message", data: reply }]);
        setIsLoading(false);

        if (event.data.conversation_id) {
          const conversationId = event.data.conversation_id as string;
          setActiveConversationId(conversationId);
          void refreshConversations();
        }
        break;
      }
      case "error": {
        const errorMsg: Message = {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: `Error: ${event.data.message || "Something went wrong"}`,
          timestamp: new Date(),
        };
        setDisplayItems((prev) => [
          ...prev,
          { kind: "message", data: errorMsg },
        ]);
        setIsLoading(false);
        break;
      }
    }
  }, [refreshConversations]);

  const { sendMessage, sendRaw, status } = useWebSocket({
    onEvent: handleEvent,
    autoConnect: !!userId,
  });

  const handleSend = useCallback(
    (message: string) => {
      if (!userId) return;
      const conversationId = activeConversationId ?? crypto.randomUUID();
      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: message,
        timestamp: new Date(),
      };
      setActiveConversationId(conversationId);
      setDisplayItems((prev) => [...prev, { kind: "message", data: userMsg }]);
      setIsLoading(true);
      sendMessage(message, userId, conversationId);
    },
    [sendMessage, activeConversationId, userId],
  );

  const handleAuthCompleted = useCallback(() => {
    if (!userId || !activeConversationId) return;
    setIsLoading(true);
    sendRaw({
      type: "auth_completed",
      user_id: userId,
      conversation_id: activeConversationId,
    });
  }, [sendRaw, userId, activeConversationId]);

  const handleNewChat = useCallback(() => {
    setActiveConversationId(null);
    setDisplayItems([]);
    setIsLoading(false);
  }, []);

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      handleSend(suggestion);
    },
    [handleSend],
  );

  const handleFileSelect = useCallback((file: File) => {
    setUploadFile(file);
  }, []);

  const handleUploadClose = useCallback(() => {
    setUploadFile(null);
  }, []);

  if (authLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">Checking your account…</div>;
  }

  if (!isSupabaseConfigured() || !session) {
    return (
      <>
        <AuthForm />
        {authError && <p className="fixed bottom-4 left-0 right-0 text-center text-sm text-destructive">{authError}</p>}
      </>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/20 md:hidden"
        />
      )}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 h-full transition-transform duration-200 md:relative md:z-auto md:flex md:shrink-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:hidden",
        )}
      >
        <ConversationSidebar
          conversations={conversations}
          activeConversationId={activeConversationId}
          loading={conversationsLoading}
          userEmail={session.user.email ?? ""}
          onNewChat={handleNewChat}
          onSelectConversation={handleSelectConversation}
          onSignOut={() => void getSupabaseClient().auth.signOut()}
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <ChatArea
          displayItems={displayItems}
          isLoading={isLoading}
          hasConversation={displayItems.length > 0}
          onSend={handleSend}
          onFileSelect={handleFileSelect}
          onSuggestionClick={handleSuggestionClick}
          connectionStatus={status}
          onAuthCompleted={handleAuthCompleted}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((open) => !open)}
        />
      </div>

      {uploadFile && (
        <PdfUploadDialog
          file={uploadFile}
          userId={session.user.id}
          onClose={handleUploadClose}
        />
      )}
    </div>
  );
}
