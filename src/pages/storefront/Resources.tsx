import { FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDocuments } from "../../api/documents";
import { EmptyState, ErrorMessage } from "../../components/layout/AsyncState";
import { Skeleton } from "../../components/ui/skeleton";
import type { DocumentResource } from "../../types";

export function Resources() {
  const [documents, setDocuments] = useState<DocumentResource[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getDocuments()
      .then((res) => {
        if (!cancelled) setDocuments(res.items);
      })
      .catch((err) => {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Failed to load resources",
          );
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const groups = groupByCategory(documents ?? []);

  return (
    <div className="container flex flex-col gap-8 py-12">
      <h1 className="font-display text-3xl uppercase leading-none tracking-normal sm:text-4xl">
        Resources
      </h1>

      {error && <ErrorMessage message={error} />}

      {documents === null && !error && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      )}

      {documents !== null && documents.length === 0 && (
        <EmptyState message="No resources available yet." />
      )}

      {documents !== null && documents.length > 0 && (
        <div className="flex flex-col gap-10">
          {groups.map(([category, docs]) => (
            <section key={category} className="flex flex-col gap-4">
              <h2 className="border-b border-border pb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {category}
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {docs.map((doc) => (
                  <Link
                    key={doc.id}
                    to={`/resources/${doc.id}`}
                    className="flex items-center gap-3 border border-border p-4 transition-colors hover:border-foreground"
                  >
                    <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
                    <span className="text-sm">{doc.title}</span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function groupByCategory(
  documents: DocumentResource[],
): [string, DocumentResource[]][] {
  const map = new Map<string, DocumentResource[]>();
  for (const doc of documents) {
    const key = doc.category ?? "other";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(doc);
  }
  return Array.from(map.entries());
}
