import { useMemo, useRef, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { ProductOptionGroupInput } from '../../api/admin';
import { parensBalanced, tokenizeForDisplay, validate } from '../../lib/formulaExpression';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Textarea } from '../ui/textarea';

// Variables every formula can read, regardless of the product's options.
// Mirrors BUILT_IN_VARS in anthony_b/src/services/pricingFormulas/validateConfig.js.
const BUILT_INS = [
  { name: 'sizeInches', hint: 'The size the customer entered' },
  { name: 'optionsTotal', hint: 'Sum of the selected add-on prices' },
];

const OPERATORS = [
  { insert: '+', display: '+' },
  { insert: '-', display: '−' },
  { insert: '*', display: '×' },
  { insert: '/', display: '÷' },
  { insert: '(', display: '(' },
  { insert: ')', display: ')' },
];

const FUNCTION_CHIPS = ['ceil(', 'floor(', 'round(', 'min(', 'max(', 'abs('];

export interface FormulaBuilderProps {
  value: string;
  onChange: (next: string) => void;
  optionGroups: ProductOptionGroupInput[];
  constants: Record<string, number>;
  onConstantsChange: (next: Record<string, number>) => void;
  /** Extra variables valid only in this field (e.g. `watts` for auto-quantity). */
  extraVariables?: { name: string; hint: string }[];
  label: string;
  description?: string;
}

// Every numeric attribute an option group's choices define becomes a
// `<groupKey>_<attr>` variable — this is how wattageCapacity and any custom
// attribute an admin adds become usable in a formula.
function groupVariables(groups: ProductOptionGroupInput[]) {
  const vars: { name: string; hint: string }[] = [];
  groups.forEach((group) => {
    if (!group.key) return;
    vars.push({ name: group.key, hint: `Price of the selected ${group.label || group.key}` });
    const attrs = new Set<string>();
    group.choices.forEach((choice) => {
      Object.entries(choice.extra || {}).forEach(([attr, val]) => {
        if (typeof val === 'number') attrs.add(attr);
      });
    });
    attrs.forEach((attr) => {
      vars.push({ name: `${group.key}_${attr}`, hint: `${attr} of the selected ${group.label || group.key}` });
    });
  });
  return vars;
}

export function FormulaBuilder({
  value,
  onChange,
  optionGroups,
  constants,
  onConstantsChange,
  extraVariables = [],
  label,
  description,
}: FormulaBuilderProps) {
  const [textMode, setTextMode] = useState(false);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [newConstName, setNewConstName] = useState('');
  const [newConstValue, setNewConstValue] = useState('');
  const canvasRef = useRef<HTMLDivElement>(null);

  const variables = useMemo(
    () => [...BUILT_INS, ...extraVariables, ...groupVariables(optionGroups)],
    [extraVariables, optionGroups],
  );

  const allowedNames = useMemo(
    () => [...variables.map((v) => v.name), ...Object.keys(constants)],
    [variables, constants],
  );

  const tokens = useMemo(() => tokenizeForDisplay(value), [value]);
  const result = useMemo(
    () => (value.trim() === '' ? { ok: true } : validate(value, allowedNames)),
    [value, allowedNames],
  );
  const balanced = parensBalanced(value);

  // Appending needs a separator so `ceil(` + `sizeInches` doesn't become one
  // identifier, but never after an open paren or before a close paren.
  function append(fragment: string) {
    const trimmed = value.trimEnd();
    const needsSpace =
      trimmed !== '' && !trimmed.endsWith('(') && !/^[)]/.test(fragment) && !fragment.startsWith(',');
    onChange(`${trimmed}${needsSpace ? ' ' : ''}${fragment}`);
  }

  function insertAtToken(fragment: string, index: number) {
    if (index >= tokens.length) {
      append(fragment);
      return;
    }
    const at = tokens[index].position;
    const before = value.slice(0, at).trimEnd();
    const after = value.slice(at).trimStart();
    onChange(`${before}${before ? ' ' : ''}${fragment} ${after}`.trim());
  }

  // Native HTML5 drag-and-drop: the payload is just the text to splice in, so
  // no drag library is needed for what is a linear caret insert.
  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pills = Array.from(canvas.querySelectorAll('[data-token-index]')) as HTMLElement[];
    let nearest = pills.length;
    for (let i = 0; i < pills.length; i += 1) {
      const rect = pills[i].getBoundingClientRect();
      if (event.clientX < rect.left + rect.width / 2) {
        nearest = i;
        break;
      }
    }
    setDropIndex(nearest);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const fragment = event.dataTransfer.getData('text/plain');
    if (fragment) insertAtToken(fragment, dropIndex ?? tokens.length);
    setDropIndex(null);
  }

  // Deletes a whole variable at once rather than one character — the main
  // reason the canvas beats a plain text field.
  function backspaceToken() {
    if (tokens.length === 0) {
      onChange('');
      return;
    }
    onChange(value.slice(0, tokens[tokens.length - 1].position).trimEnd());
  }

  function addConstant() {
    const name = newConstName.trim();
    if (!name || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) return;
    onConstantsChange({ ...constants, [name]: Number(newConstValue) || 0 });
    setNewConstName('');
    setNewConstValue('');
  }

  function removeConstant(name: string) {
    const next = { ...constants };
    delete next[name];
    onConstantsChange(next);
  }

  function chipClass(kind: 'var' | 'const' | 'fn') {
    if (kind === 'var') return 'bg-primary/10 text-primary hover:bg-primary/20';
    if (kind === 'const') return 'bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 dark:text-amber-400';
    return 'bg-muted hover:bg-muted/70';
  }

  function renderChip(name: string, hint: string, kind: 'var' | 'const' | 'fn') {
    return (
      <button
        key={name}
        type="button"
        draggable
        title={`${hint} — click to append, or drag into the formula`}
        onDragStart={(e) => e.dataTransfer.setData('text/plain', name)}
        onClick={() => append(name)}
        className={`cursor-grab rounded-md px-2 py-1 font-mono text-xs transition-colors active:cursor-grabbing ${chipClass(kind)}`}
      >
        {name}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-md border p-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">{label}</p>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        <label className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
          <Switch checked={textMode} onCheckedChange={setTextMode} />
          Edit as text
        </label>
      </div>

      {/* Palette */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-1">
          <span className="mr-1 text-xs text-muted-foreground">Values</span>
          {variables.map((v) => renderChip(v.name, v.hint, 'var'))}
          {Object.entries(constants).map(([name, val]) => (
            <span key={name} className="inline-flex items-center gap-1">
              {renderChip(name, `Constant = ${val}`, 'const')}
              <button
                type="button"
                onClick={() => removeConstant(name)}
                className="text-muted-foreground hover:text-destructive"
                aria-label={`Remove constant ${name}`}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1">
          <span className="mr-1 text-xs text-muted-foreground">Operators</span>
          {OPERATORS.map((op) => (
            <Button
              key={op.insert}
              type="button"
              variant="outline"
              size="sm"
              className="h-7 w-8 p-0 font-mono"
              onClick={() => append(op.insert)}
            >
              {op.display}
            </Button>
          ))}
          {FUNCTION_CHIPS.map((fn) => renderChip(fn, `${fn.slice(0, -1)}() function`, 'fn'))}
        </div>
      </div>

      {/* Canvas or raw text */}
      {textMode ? (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={2}
          className="font-mono text-sm"
          placeholder="basePrice + ceil(sizeInches / 12) * 25"
        />
      ) : (
        <div
          ref={canvasRef}
          onDragOver={handleDragOver}
          onDragLeave={() => setDropIndex(null)}
          onDrop={handleDrop}
          className="flex min-h-14 flex-wrap items-center gap-1 rounded-md border border-dashed bg-muted/30 p-2"
        >
          {tokens.length === 0 && (
            <span className="text-xs text-muted-foreground">
              Drag values and operators here, or type a number below.
            </span>
          )}
          {tokens.map((token, i) => (
            <span key={`${token.position}-${i}`} className="contents">
              {dropIndex === i && <span className="h-5 w-0.5 bg-primary" />}
              <span
                data-token-index={i}
                className={`rounded px-1.5 py-0.5 font-mono text-sm ${
                  token.type === 'ident'
                    ? 'bg-primary/10 text-primary'
                    : token.type === 'number'
                      ? 'text-foreground'
                      : (token.type === 'lparen' || token.type === 'rparen') && !balanced
                        ? 'bg-destructive/15 text-destructive'
                        : 'text-muted-foreground'
                }`}
              >
                {token.value}
              </span>
            </span>
          ))}
          {dropIndex !== null && dropIndex >= tokens.length && <span className="h-5 w-0.5 bg-primary" />}
        </div>
      )}

      {/* Manual number entry + backspace */}
      {!textMode && (
        <div className="flex flex-wrap items-center gap-2">
          <Input
            className="w-28"
            type="number"
            step="any"
            placeholder="Number"
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return;
              e.preventDefault();
              const input = e.currentTarget;
              if (input.value !== '') {
                append(input.value);
                input.value = '';
              }
            }}
            onBlur={(e) => {
              if (e.currentTarget.value !== '') {
                append(e.currentTarget.value);
                e.currentTarget.value = '';
              }
            }}
            title="Type a number and press Enter to add it"
          />
          <Button type="button" variant="outline" size="sm" onClick={backspaceToken}>
            Backspace
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange('')}>
            Clear
          </Button>
        </div>
      )}

      {/* Add a named constant */}
      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Constant name</Label>
          <Input
            className="w-36"
            value={newConstName}
            onChange={(e) => setNewConstName(e.target.value)}
            placeholder="setupFee"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Value</Label>
          <Input
            className="w-24"
            type="number"
            step="any"
            value={newConstValue}
            onChange={(e) => setNewConstValue(e.target.value)}
            placeholder="15"
          />
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addConstant}>
          <Plus className="h-3.5 w-3.5" /> Add constant
        </Button>
      </div>

      {!result.ok && <p className="text-xs text-destructive">{result.message}</p>}
    </div>
  );
}
