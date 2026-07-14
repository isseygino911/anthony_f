import { useCallback, useState } from 'react';
import { sendAdminAnalyticsQuery } from '../api/adminAnalytics';
import { ApiError } from '../api/client';
import type { AdminChatMessage, AdminChatTurn } from '../types';

const HISTORY_LIMIT = 6;

/**
 * Page-local chat state for the Admin AI Insights page. Unlike `useAssistant`,
 * this is a plain hook (not a context provider) — the conversation only ever
 * lives on the one `/admin/insights` page and resets on refresh by design
 * (the server is stateless; the client resends recent history each request).
 */
export function useAdminAnalytics() {
  const [messages, setMessages] = useState<AdminChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const history: AdminChatTurn[] = messages
        .slice(-HISTORY_LIMIT)
        .map((message) => ({ role: message.role, content: message.content }));

      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'user', content: trimmed }]);
      setSending(true);
      setError(null);

      try {
        const result = await sendAdminAnalyticsQuery(trimmed, history);
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: 'assistant', content: result.reply, result },
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
    [messages],
  );

  return { messages, sending, error, sendMessage };
}
