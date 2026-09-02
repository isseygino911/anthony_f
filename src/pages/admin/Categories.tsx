import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { createCategory, deleteCategory, updateCategory } from '../../api/admin';
import { ApiError } from '../../api/client';
import { getCategories } from '../../api/products';
import { EmptyState, ErrorMessage } from '../../components/layout/AsyncState';
import { Button } from '../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import type { Category } from '../../types';

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function Categories() {
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  function load() {
    setCategories(null);
    getCategories()
      .then((res) => setCategories(res.items))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load categories'));
  }

  useEffect(load, []);

  function handleNameChange(value: string) {
    setNewName(value);
    if (!slugTouched) setNewSlug(slugify(value));
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      await createCategory({ name: newName, slug: newSlug });
      setNewName('');
      setNewSlug('');
      setSlugTouched(false);
      setCreateOpen(false);
      load();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create category');
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(category: Category) {
    if (!confirm(`Delete "${category.name}"?`)) return;
    try {
      await deleteCategory(category.id);
      load();
    } catch (err) {
      // The 409 body distinguishes live products from soft-deleted ones still
      // holding the foreign key — those are invisible in the product list, so
      // showing a generic "has products" here would send the admin looking for
      // rows they cannot see. Prefer the server's wording.
      if (err instanceof ApiError && err.status === 409) {
        alert(err.message || 'This category still has products assigned to it.');
      } else {
        alert(err instanceof Error ? err.message : 'Failed to delete category');
      }
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Categories</h1>
          <p className="text-sm text-muted-foreground">
            Products are organized under these. Used in the storefront nav and the product form&apos;s category
            picker.
          </p>
        </div>
        <Dialog
          open={createOpen}
          onOpenChange={(open) => {
            setCreateOpen(open);
            if (!open) {
              setNewName('');
              setNewSlug('');
              setSlugTouched(false);
              setCreateError(null);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" /> New category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New category</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div className="space-y-1">
                <Label htmlFor="cat-name">Name</Label>
                <Input
                  id="cat-name"
                  required
                  value={newName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Cabinets"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cat-slug">Slug</Label>
                <Input
                  id="cat-slug"
                  required
                  value={newSlug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setNewSlug(e.target.value);
                  }}
                  placeholder="cabinets"
                />
                <p className="text-xs text-muted-foreground">Used in storefront URLs — auto-filled from the name.</p>
              </div>
              {createError && <ErrorMessage message={createError} />}
              <DialogFooter>
                <Button type="submit" disabled={creating}>
                  {creating ? 'Creating...' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && <ErrorMessage message={error} />}
      {categories === null && !error && <p className="text-muted-foreground">Loading...</p>}
      {categories !== null && categories.length === 0 && <EmptyState message="No categories yet." />}

      <div className="flex flex-col gap-2">
        {categories?.map((category) => (
          <CategoryRow key={category.id} category={category} onSaved={load} onDelete={() => handleDelete(category)} />
        ))}
      </div>
    </div>
  );
}

function CategoryRow({
  category,
  onSaved,
  onDelete,
}: {
  category: Category;
  onSaved: () => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const [slug, setSlug] = useState(category.slug);
  const [saving, setSaving] = useState(false);
  const [rowError, setRowError] = useState<string | null>(null);

  function startEdit() {
    setName(category.name);
    setSlug(category.slug);
    setRowError(null);
    setEditing(true);
  }

  async function handleSave() {
    setSaving(true);
    setRowError(null);
    try {
      await updateCategory(category.id, { name, slug });
      setEditing(false);
      onSaved();
    } catch (err) {
      setRowError(err instanceof Error ? err.message : 'Failed to save category');
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-2 rounded-lg border p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex gap-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} className="flex-1" aria-label="Name" />
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} className="flex-1" aria-label="Slug" />
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button size="icon" onClick={handleSave} disabled={saving} aria-label="Save">
              <Check className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setEditing(false)} aria-label="Cancel">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {rowError && <ErrorMessage message={rowError} />}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div>
        <p className="font-medium">{category.name}</p>
        <p className="text-xs text-muted-foreground">/{category.slug}</p>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={startEdit} aria-label="Edit category">
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onDelete} aria-label="Delete category">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
