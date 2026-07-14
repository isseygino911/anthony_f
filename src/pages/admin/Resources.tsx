import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { deleteDocument, updateDocument, uploadDocument } from '../../api/admin';
import { getDocuments } from '../../api/documents';
import { EmptyState, ErrorMessage } from '../../components/layout/AsyncState';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import type { DocumentResource } from '../../types';

export function AdminResources() {
  const [documents, setDocuments] = useState<DocumentResource[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  function load() {
    setDocuments(null);
    getDocuments()
      .then((res) => setDocuments(res.items))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load resources'));
  }

  useEffect(load, []);

  async function handleUpload(e: FormEvent) {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      await uploadDocument({ title, category: category || undefined, file });
      setTitle('');
      setCategory('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      load();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to upload resource');
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: number) {
    await deleteDocument(id);
    load();
  }

  async function handleRename(id: number, newTitle: string) {
    await updateDocument(id, { title: newTitle });
    load();
  }

  async function handleMove(doc: DocumentResource, sibling: DocumentResource) {
    await Promise.all([
      updateDocument(doc.id, { sort_order: sibling.sort_order }),
      updateDocument(sibling.id, { sort_order: doc.sort_order }),
    ]);
    load();
  }

  const groups = groupByCategory(documents ?? []);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Resources</h1>

      <form onSubmit={handleUpload} className="flex flex-col gap-4 rounded-lg border p-4">
        <p className="font-medium">Upload a resource</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-1">
            <Label htmlFor="doc-title">Title</Label>
            <Input id="doc-title" required value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="doc-category">Category (optional)</Label>
            <Input id="doc-category" value={category} onChange={(e) => setCategory(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="doc-file">PDF file</Label>
            <Input id="doc-file" type="file" accept="application/pdf" required ref={fileInputRef} />
          </div>
        </div>
        {uploadError && <ErrorMessage message={uploadError} />}
        <Button type="submit" disabled={uploading} className="w-fit">
          {uploading ? 'Uploading...' : 'Upload'}
        </Button>
      </form>

      {error && <ErrorMessage message={error} />}

      {documents === null && !error && <p className="text-muted-foreground">Loading...</p>}

      {documents !== null && documents.length === 0 && <EmptyState message="No resources yet." />}

      <div className="flex flex-col gap-6">
        {groups.map(([category, docs]) => (
          <div key={category} className="flex flex-col gap-2">
            <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">{category}</p>
            <div className="flex flex-col gap-2">
              {docs.map((doc, index) => (
                <DocumentRow
                  key={doc.id}
                  doc={doc}
                  isFirst={index === 0}
                  isLast={index === docs.length - 1}
                  onRename={(newTitle) => handleRename(doc.id, newTitle)}
                  onDelete={() => handleDelete(doc.id)}
                  onMoveUp={() => handleMove(doc, docs[index - 1])}
                  onMoveDown={() => handleMove(doc, docs[index + 1])}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DocumentRow({
  doc,
  isFirst,
  isLast,
  onRename,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  doc: DocumentResource;
  isFirst: boolean;
  isLast: boolean;
  onRename: (title: string) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(doc.title);

  function commit() {
    setEditing(false);
    if (value.trim() && value !== doc.title) onRename(value.trim());
    else setValue(doc.title);
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
      {editing ? (
        <Input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') {
              setValue(doc.title);
              setEditing(false);
            }
          }}
          className="max-w-sm"
        />
      ) : (
        <button type="button" onClick={() => setEditing(true)} className="truncate text-left text-sm">
          {doc.title}
        </button>
      )}

      <div className="flex shrink-0 items-center gap-1">
        <a
          href={doc.url}
          target="_blank"
          rel="noreferrer"
          className="px-2 text-xs font-medium text-muted-foreground hover:text-brand"
        >
          View
        </a>
        <Button variant="ghost" size="icon" onClick={onMoveUp} disabled={isFirst} aria-label="Move up">
          <ArrowUp className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onMoveDown} disabled={isLast} aria-label="Move down">
          <ArrowDown className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onDelete} aria-label="Delete resource">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function groupByCategory(documents: DocumentResource[]): [string, DocumentResource[]][] {
  const map = new Map<string, DocumentResource[]>();
  for (const doc of documents) {
    const key = doc.category ?? 'other';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(doc);
  }
  for (const docs of map.values()) {
    docs.sort((a, b) => a.sort_order - b.sort_order);
  }
  return Array.from(map.entries());
}
