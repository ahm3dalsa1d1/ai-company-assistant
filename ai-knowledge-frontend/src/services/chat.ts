import {
  API_URL,
  getAuthHeaders,
} from "./api";

import type {
  ChatSource,
  Conversation,
  Message,
} from "../types";


export async function getConversations():
  Promise<Conversation[]> {

  const response = await fetch(
    `${API_URL}/chat/conversations`,
    {
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(
      "Failed to load conversations"
    );
  }

  return response.json();
}


export async function getConversationMessages(
  conversationId: number
): Promise<Message[]> {

  const response = await fetch(
    `${API_URL}/chat/conversations/${conversationId}`,
    {
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(
      "Failed to load conversation"
    );
  }

  return response.json();
}

interface StreamCallbacks {
  onMetadata?: (
    conversationId: number,
    sources: ChatSource[]
  ) => void;

  onToken?: (token: string) => void;

  onDone?: () => void;
}


export async function streamChat(
  question: string,
  conversationId: number | null,
  callbacks: StreamCallbacks
): Promise<void> {

  const response = await fetch(
    `${API_URL}/chat/stream`,
    {
      method: "POST",

      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        question,
        limit: 3,
        conversation_id: conversationId,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      "Failed to send message"
    );
  }

  if (!response.body) {
    throw new Error(
      "Streaming response unavailable"
    );
  }

  const reader =
    response.body.getReader();

  const decoder =
    new TextDecoder();

  let buffer = "";

  while (true) {
    const {
      value,
      done,
    } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(
      value,
      {
        stream: true,
      }
    );

    const events =
      buffer.split("\n\n");

    buffer =
      events.pop() ?? "";

    for (const event of events) {

      const lines =
        event.split("\n");

      let eventType = "";
      let data = "";

      for (const line of lines) {

        if (
          line.startsWith("event:")
        ) {
          eventType =
            line
              .slice(6)
              .trim();
        }

        if (
          line.startsWith("data:")
        ) {
          data =
            line
              .slice(5)
              .trim();
        }
      }

      if (
        eventType === "metadata"
      ) {

        const metadata =
          JSON.parse(data);

        callbacks.onMetadata?.(
          metadata.conversation_id,
          metadata.sources ?? []
        );
      }

      if (
        eventType === "token"
      ) {

        const token =
          JSON.parse(data);

        callbacks.onToken?.(
          token
        );
      }

      if (
        eventType === "done"
      ) {
        callbacks.onDone?.();
      }
    }
  }
}

export async function deleteConversation(
  conversationId: number
): Promise<void> {

  const response = await fetch(
    `${API_URL}/chat/conversations/${conversationId}`,
    {
      method: "DELETE",
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {

    const errorData =
      await response.json()
        .catch(() => null);

    throw new Error(
      errorData?.detail
      || "Failed to delete conversation"
    );
  }
}