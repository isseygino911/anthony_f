import type { KeyboardEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { AnalyticsResult } from "../../components/admin/analytics/AnalyticsResult";
import { ErrorMessage } from "../../components/layout/AsyncState";
import { Button } from "../../components/ui/button";
import { useAdminAnalytics } from "../../hooks/useAdminAnalytics";
import { cn } from "../../lib/utils";

const EXAMPLE_QUESTIONS = [
  "What's my revenue trend?",
  "What are my most popular products?",
  "Project next month's sales",
];

export function Insights() {
  const { messages, sending, error, sendMessage } = useAdminAnalytics();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, sending]);

  async function handleSend(text?: string) {
    const value = (text ?? input).trim();
    if (!value || sending) return;
    setInput("");
    await sendMessage(value);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex h-[calc(100vh-8.5rem)] flex-col gap-4 max-w-4xl mx-auto">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-brand" />
        <h1 className="text-2xl font-semibold">AI Insights</h1>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto rounded-md border border-border p-6"
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <p className="text-sm text-muted-foreground">
              Ask a question about your store's analytics — revenue trends, top
              products, or sales projections.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              {EXAMPLE_QUESTIONS.map((question) => (
                <Button
                  key={question}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSend(question)}
                >
                  {question}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex flex-col gap-3",
                  message.role === "user" ? "items-end" : "items-start",
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                    message.role === "user"
                      ? "bg-brand text-brand-foreground"
                      : "bg-muted text-foreground",
                  )}
                >
                  {message.content}
                </div>
                {message.result && (
                  <div className="w-full">
                    <AnalyticsResult result={message.result} />
                  </div>
                )}
              </div>
            ))}
            {sending && (
              <div className="flex items-start">
                <div className="rounded-2xl bg-muted px-4 py-2.5 text-sm text-muted-foreground">
                  Thinking…
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {error && <ErrorMessage message={error} />}
      <div className="flex items-end gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={sending}
          placeholder="Ask about your store's analytics…"
          rows={1}
          aria-label="Message the AI insights assistant"
          className="max-h-28 min-h-[2.5rem] flex-1 resize-none rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
        />
        <Button
          size="icon"
          onClick={() => handleSend()}
          disabled={sending || !input.trim()}
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
