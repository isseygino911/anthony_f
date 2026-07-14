import type { KeyboardEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { useAssistant } from '../../hooks/useAssistant';
import { ErrorMessage } from '../layout/AsyncState';
import { Button } from '../ui/button';
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '../ui/sheet';
import { AssistantMessageBubble } from './AssistantMessageBubble';

interface AssistantDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssistantDrawer({ open, onOpenChange }: AssistantDrawerProps) {
  const { messages, sending, error, sendMessage } = useAssistant();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    await sendMessage(text);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="gap-0 p-0">
        <SheetHeader className="border-b border-border px-6 py-5">
          <SheetTitle>Product assistant</SheetTitle>
        </SheetHeader>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
              <p className="text-sm text-muted-foreground">
                Ask me what you're looking for and I'll help you find it.
              </p>
              <p className="text-xs text-muted-foreground">
                Try something like "I need a durable option for daily use."
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {messages.map((message) => (
                <AssistantMessageBubble key={message.id} message={message} />
              ))}
              {sending && (
                <div className="flex items-start">
                  <div className="rounded-2xl bg-muted px-4 py-2.5 text-sm text-muted-foreground">Thinking…</div>
                </div>
              )}
            </div>
          )}
        </div>

        <SheetFooter className="border-t border-border px-6 py-4">
          {error && <ErrorMessage message={error} />}
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={sending}
              placeholder="Ask about a product…"
              rows={1}
              aria-label="Message the product assistant"
              className="max-h-28 min-h-[2.5rem] flex-1 resize-none rounded-md border border-border bg-background px-3 py-2 text-sm normal-case placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
            />
            <Button size="icon" onClick={handleSend} disabled={sending || !input.trim()} aria-label="Send message">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
