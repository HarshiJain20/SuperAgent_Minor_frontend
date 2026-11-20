import { API_BASE_URL } from "@/lib/constants";
import type { DisplayItem, Conversation } from "@/types/chat";

export interface PersistedMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export async function listConversations(userId: string): Promise<Conversation[]> {
  return handleResponse<Conversation[]>(
    await fetch(
      `${API_BASE_URL}/chat/conversations?user_id=${encodeURIComponent(userId)}`,
    ),
  );
}

export async function getConversationHistory(
  userId: string,
  conversationId: string,
): Promise<PersistedMessage[]> {
  return handleResponse<PersistedMessage[]>(
    await fetch(
      `${API_BASE_URL}/chat/${encodeURIComponent(conversationId)}/history?user_id=${encodeURIComponent(userId)}`,
    ),
  );
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let detail = response.statusText;
    try {
      const body = await response.json();
      detail = body.detail ?? body.message ?? JSON.stringify(body);
    } catch {
      // Keep the HTTP status text when the backend did not return JSON.
    }
    throw new Error(detail);
  }
  return response.json() as Promise<T>;
}

export async function loadLatestConversation(
  userId: string,
): Promise<{ conversationId: string; displayItems: DisplayItem[] } | null> {
  const summaries = await listConversations(userId);
  const latest = summaries[0];
  if (!latest) return null;

  const messages = await getConversationHistory(userId, latest.conversation_id);

  return {
    conversationId: latest.conversation_id,
    displayItems: messages.map((message) => ({
      kind: "message",
      data: {
        id: message.id,
        role: message.role,
        content: message.content,
        timestamp: new Date(message.created_at),
      },
    })),
  };
}
