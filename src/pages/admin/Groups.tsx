import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { createGroup, deleteGroup, replaceGroupProducts } from '../../api/admin';
import { getGroupProducts, getGroups, getProducts } from '../../api/products';
import { EmptyState, ErrorMessage } from '../../components/layout/AsyncState';
import { Button } from '../../components/ui/button';
import { Checkbox } from '../../components/ui/checkbox';
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
import { Textarea } from '../../components/ui/textarea';
import type { Product, ProductGroup } from '../../types';

export function Groups() {
  const [groups, setGroups] = useState<ProductGroup[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  function load() {
    setGroups(null);
    getGroups()
      .then((res) => setGroups(res.items))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load groups'));
  }

  useEffect(load, []);
  useEffect(() => {
    getProducts({ pageSize: 100 })
      .then((res) => setAllProducts(res.items))
      .catch(() => setAllProducts([]));
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      await createGroup({ name: newName, description: newDescription || undefined });
      setNewName('');
      setNewDescription('');
      setCreateOpen(false);
      load();
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this group? Product memberships will be removed, products themselves are untouched.')) return;
    await deleteGroup(id);
    load();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Groups</h1>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" /> New group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New group</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div className="space-y-1">
                <Label htmlFor="group-name">Name</Label>
                <Input id="group-name" required value={newName} onChange={(e) => setNewName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="group-description">Description (optional)</Label>
                <Textarea
                  id="group-description"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={creating}>
                  Create
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && <ErrorMessage message={error} />}
      {groups === null && !error && <p className="text-muted-foreground">Loading...</p>}
      {groups !== null && groups.length === 0 && <EmptyState message="No groups yet." />}

      <div className="flex flex-col gap-4">
        {groups?.map((group) => (
          <GroupRow key={group.id} group={group} allProducts={allProducts} onDelete={() => handleDelete(group.id)} />
        ))}
      </div>
    </div>
  );
}

function GroupRow({
  group,
  allProducts,
  onDelete,
}: {
  group: ProductGroup;
  allProducts: Product[];
  onDelete: () => void;
}) {
  const [memberIds, setMemberIds] = useState<Set<number>>(new Set());
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getGroupProducts(group.id, { pageSize: 100 })
      .then((res) => setMemberIds(new Set(res.items.map((p) => p.id))))
      .catch(() => setMemberIds(new Set()))
      .finally(() => setLoaded(true));
  }, [group.id]);

  function toggle(productId: number) {
    setMemberIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      await replaceGroupProducts(group.id, Array.from(memberIds));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">{group.name}</p>
          {group.description && <p className="text-sm text-muted-foreground">{group.description}</p>}
        </div>
        <Button variant="ghost" size="icon" onClick={onDelete} aria-label="Delete group">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {loaded && (
        <div className="mt-4 flex flex-col gap-2">
          <p className="text-sm font-medium">Products in this group</p>
          <div className="flex flex-wrap gap-3">
            {allProducts.map((product) => (
              <label key={product.id} className="flex items-center gap-2 text-sm">
                <Checkbox checked={memberIds.has(product.id)} onCheckedChange={() => toggle(product.id)} />
                {product.name}
              </label>
            ))}
          </div>
          <Button size="sm" className="w-fit" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save membership'}
          </Button>
        </div>
      )}
    </div>
  );
}
