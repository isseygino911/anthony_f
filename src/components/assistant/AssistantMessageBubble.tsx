import { FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import type { AssistantMessage } from '../../types';
import { ProductCard } from '../product/ProductCard';

export function AssistantMessageBubble({ message }: { message: AssistantMessage }) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex flex-col gap-2', isUser ? 'items-end' : 'items-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed normal-case',
          isUser ? 'bg-brand text-brand-foreground' : 'bg-muted text-foreground',
        )}
      >
        {message.content}
      </div>

      {message.products && message.products.length > 0 && (
        <div className="w-full max-w-[85%]">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Recommended for you
          </p>
          <div className="flex flex-col gap-3">
            {message.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}

      {message.documents && message.documents.length > 0 && (
        <div className="w-full max-w-[85%]">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Related resources
          </p>
          <div className="flex flex-col gap-1.5">
            {message.documents.map((doc) => (
              <Link
                key={doc.id}
                to={`/resources/${doc.id}`}
                className="flex items-center gap-2 text-xs text-brand underline-offset-4 hover:underline"
              >
                <FileText className="h-3.5 w-3.5 shrink-0" />
                {doc.title}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
