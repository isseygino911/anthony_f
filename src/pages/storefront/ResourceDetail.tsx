import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getDocumentDetail } from '../../api/documents';
import { ErrorMessage } from '../../components/layout/AsyncState';
import { Skeleton } from '../../components/ui/skeleton';
import type { DocumentResource } from '../../types';

export function ResourceDetail() {
  const { id } = useParams<{ id: string }>();
  const [doc, setDoc] = useState<DocumentResource | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setDoc(null);
    setError(null);
    getDocumentDetail(id)
      .then((res) => {
        if (!cancelled) setDoc(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load resource');
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="container flex flex-col gap-6 py-12">
      <Link
        to="/resources"
        className="inline-flex w-fit items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-brand"
      >
        <ArrowLeft className="h-4 w-4" /> Back to resources
      </Link>

      {error && <ErrorMessage message={error} />}

      {!doc && !error && (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-[80vh] w-full" />
        </div>
      )}

      {doc && (
        <>
          <h1 className="font-display text-3xl uppercase leading-none tracking-normal sm:text-4xl">{doc.title}</h1>
          <iframe
            src={`${doc.url}#toolbar=0&navpanes=0`}
            title={doc.title}
            className="h-[80vh] w-full border border-border"
          />
        </>
      )}
    </div>
  );
}
