import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { sendAssistantMessage } from '../api/assistant';
import { ApiError } from '../api/client';
import type { AssistantMessage } from '../types';

interface AssistantContextValue {
  messages: AssistantMessage[];
  sending: boolean;
  error: string | null;
  sendMessage: (text: string) => Promise<void>;
}

const AssistantContext = createContext<AssistantContextValue | null>(null);

export function AssistantProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'user', content: trimmed }]);
      setSending(true);
      setError(null);

      try {
        const reply = await sendAssistantMessage(trimmed, conversationId ?? undefined);
        setConversationId(reply.conversationId);
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: reply.reply,
            products: reply.products,
            documents: reply.documents,
          },
        ]);
      } catch (err) {
        if (err instanceof ApiError && err.status === 429) {
          setError("You've sent a lot of messages — please wait a bit before trying again.");
        } else if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError('Something went wrong. Please try again.');
        }
      } finally {
        setSending(false);
      }
    },
    [conversationId],
  );

  const value = useMemo(
    () => ({ messages, sending, error, sendMessage }),
    [messages, sending, error, sendMessage],
  );

  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>;
}

export function useAssistant() {
  const ctx = useContext(AssistantContext);
  if (!ctx) throw new Error('useAssistant must be used within an AssistantProvider');
  return ctx;
}
