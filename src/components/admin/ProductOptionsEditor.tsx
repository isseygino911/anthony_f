import { Plus, Trash2 } from 'lucide-react';
import type { ProductOptionGroupInput } from '../../api/admin';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface ProductOptionsEditorProps {
  groups: ProductOptionGroupInput[];
  onChange: (groups: ProductOptionGroupInput[]) => void;
}

// Admin editor for a configurable product's option groups/choices (e.g.
// "Controller: Motion sensor +$250 / None +$0"). Saved as a full replace via
// PUT /admin/products/:id/options (setProductOptions, api/admin.ts) — this
// component only manages local form state, the parent form saves it.
export function ProductOptionsEditor({ groups, onChange }: ProductOptionsEditorProps) {
  function addGroup() {
    onChange([
      ...groups,
      { key: '', label: '', type: 'single_select', sortOrder: groups.length, choices: [] },
    ]);
  }

  function updateGroup(index: number, patch: Partial<ProductOptionGroupInput>) {
    onChange(groups.map((g, i) => (i === index ? { ...g, ...patch } : g)));
  }

  function removeGroup(index: number) {
    onChange(groups.filter((_, i) => i !== index));
  }

  function addChoice(groupIndex: number) {
    const group = groups[groupIndex];
    updateGroup(groupIndex, {
      choices: [
        ...group.choices,
        { key: '', label: '', priceDelta: 0, extra: null, sortOrder: group.choices.length },
      ],
    });
  }

  function updateChoice(groupIndex: number, choiceIndex: number, patch: Partial<ProductOptionGroupInput['choices'][number]>) {
    const group = groups[groupIndex];
    updateGroup(groupIndex, {
      choices: group.choices.map((c, i) => (i === choiceIndex ? { ...c, ...patch } : c)),
    });
  }

  function removeChoice(groupIndex: number, choiceIndex: number) {
    const group = groups[groupIndex];
    updateGroup(groupIndex, { choices: group.choices.filter((_, i) => i !== choiceIndex) });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="font-medium">Option groups (controller, power supply, installation, etc.)</p>
        <Button type="button" variant="outline" size="sm" onClick={addGroup}>
          <Plus className="h-4 w-4" /> Add group
        </Button>
      </div>

      {groups.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No option groups yet. Add one for each customer choice that affects price (e.g. controller, power
          supply, installation).
        </p>
      )}

      {groups.map((group, groupIndex) => (
        <div key={groupIndex} className="flex flex-col gap-3 rounded-md border p-3">
          <div className="flex items-start gap-2">
            <div className="grid flex-1 grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Key (e.g. &quot;controller&quot;)</Label>
                <Input
                  value={group.key}
                  onChange={(e) => updateGroup(groupIndex, { key: e.target.value })}
                  placeholder="controller"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Label shown to customer</Label>
                <Input
                  value={group.label}
                  onChange={(e) => updateGroup(groupIndex, { label: e.target.value })}
                  placeholder="Option 1: Controller"
                />
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="mt-6"
              onClick={() => removeGroup(groupIndex)}
              aria-label="Remove group"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex flex-col gap-2 pl-2">
            {group.choices.map((choice, choiceIndex) => (
              <div key={choiceIndex} className="flex items-center gap-2">
                <Input
                  className="flex-1"
                  value={choice.key}
                  onChange={(e) => updateChoice(groupIndex, choiceIndex, { key: e.target.value })}
                  placeholder="key (e.g. motion_sensor)"
                />
                <Input
                  className="flex-1"
                  value={choice.label}
                  onChange={(e) => updateChoice(groupIndex, choiceIndex, { label: e.target.value })}
                  placeholder="Label (e.g. Motion sensor controller)"
                />
                <Input
                  className="w-28"
                  type="number"
                  step="0.01"
                  value={choice.priceDelta}
                  onChange={(e) => updateChoice(groupIndex, choiceIndex, { priceDelta: Number(e.target.value) })}
                  placeholder="+$"
                />
                <Input
                  className="w-24"
                  type="number"
                  min="0"
                  value={choice.extra?.wattageCapacity ?? ''}
                  onChange={(e) =>
                    updateChoice(groupIndex, choiceIndex, {
                      extra: {
                        ...choice.extra,
                        wattageCapacity: e.target.value ? Number(e.target.value) : undefined,
                      },
                    })
                  }
                  placeholder="Watts"
                  title="Max wattage this choice can support (leave blank if not a power supply)"
                />
                <label className="flex items-center gap-1 text-xs text-muted-foreground" title="One-time fee, not multiplied by quantity (e.g. installation)">
                  <Checkbox
                    checked={Boolean(choice.extra?.isFlatFee)}
                    onCheckedChange={(checked) =>
                      updateChoice(groupIndex, choiceIndex, {
                        extra: { ...choice.extra, isFlatFee: Boolean(checked) },
                      })
                    }
                  />
                  Flat fee
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeChoice(groupIndex, choiceIndex)}
                  aria-label="Remove choice"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="ghost" size="sm" onClick={() => addChoice(groupIndex)} className="w-fit">
              <Plus className="h-3.5 w-3.5" /> Add choice
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
