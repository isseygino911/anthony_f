import { useEffect, useRef, useState } from 'react';
import { getTheme, saveTheme, uploadLogo } from '../../api/theme';
import { ErrorMessage } from '../../components/layout/AsyncState';
import { SectionSurface } from '../../components/layout/SectionSurface';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Skeleton } from '../../components/ui/skeleton';
import { useTheme } from '../../hooks/useTheme';
import { cn } from '../../lib/utils';
import { CUSTOM_PALETTE_ID, PALETTES } from '../../theme/palettes';
import type { SectionKey, SectionStyle } from '../../types';

const SECTION_KEYS: { key: SectionKey; label: string }[] = [
  { key: 'hero', label: 'Hero' },
  { key: 'featured', label: 'Featured' },
  { key: 'groupBanner', label: 'Group banner' },
  { key: 'footer', label: 'Footer' },
];

export function ThemeSettings() {
  const { previewColors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [brandName, setBrandName] = useState('');
  const [tagline, setTagline] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [paletteId, setPaletteId] = useState<string>(CUSTOM_PALETTE_ID);
  const [customPrimary, setCustomPrimary] = useState('#2563eb');
  const [customSecondary, setCustomSecondary] = useState('#7c3aed');
  const [sectionStyles, setSectionStyles] = useState<Record<SectionKey, SectionStyle>>({
    hero: 'gradient',
    featured: 'flat',
    groupBanner: 'gradient',
    footer: 'flat',
  });
  const [defaultMode, setDefaultMode] = useState<'light' | 'dark' | 'auto'>('auto');

  useEffect(() => {
    getTheme()
      .then((data) => {
        setBrandName(data.brand_name);
        setTagline(data.tagline ?? '');
        setLogoUrl(data.logo_url ?? '');
        setSectionStyles(data.section_styles);
        setDefaultMode(data.default_mode);

        setPaletteId(data.palette_id);
        setCustomPrimary(data.custom_colors?.primary ?? data.resolvedColors.primary);
        setCustomSecondary(data.custom_colors?.secondary ?? data.resolvedColors.secondary);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load theme'))
      .finally(() => setLoading(false));
  }, []);

  function activeColors(): { primary: string; secondary: string } {
    if (paletteId === CUSTOM_PALETTE_ID) {
      return { primary: customPrimary, secondary: customSecondary };
    }
    const palette = PALETTES.find((p) => p.id === paletteId);
    return palette
      ? { primary: palette.accent, secondary: palette.accentSecondary }
      : { primary: customPrimary, secondary: customSecondary };
  }

  function handlePaletteSelect(id: string) {
    setPaletteId(id);
    const palette = PALETTES.find((p) => p.id === id);
    const colors = palette ? { primary: palette.accent, secondary: palette.accentSecondary } : { primary: customPrimary, secondary: customSecondary };
    previewColors(colors);
  }

  function handleCustomColorChange(which: 'primary' | 'secondary', value: string) {
    const next = which === 'primary' ? { primary: value, secondary: customSecondary } : { primary: customPrimary, secondary: value };
    if (which === 'primary') setCustomPrimary(value);
    else setCustomSecondary(value);
    previewColors(next);
  }

  function handleSectionStyleChange(key: SectionKey, style: SectionStyle) {
    setSectionStyles((prev) => ({ ...prev, [key]: style }));
  }

  async function handleLogoFileChange(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    const res = await uploadLogo(file);
    setLogoUrl(res.logo_url);
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const colors = activeColors();
      await saveTheme({
        brand_name: brandName,
        tagline,
        logo_url: logoUrl,
        palette_id: paletteId,
        custom_colors: paletteId === CUSTOM_PALETTE_ID ? colors : undefined,
        section_styles: sectionStyles,
        default_mode: defaultMode,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save theme');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Skeleton className="h-96 w-full" />;

  const colors = activeColors();

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Theme settings</h1>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save theme'}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Changes preview immediately below and across the app. Nothing is persisted until you click "Save theme" —
        navigating away discards unsaved edits.
      </p>

      {error && <ErrorMessage message={error} />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label>Brand name</Label>
          <Input value={brandName} onChange={(e) => setBrandName(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Tagline</Label>
          <Input value={tagline} onChange={(e) => setTagline(e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Logo</Label>
        <div className="flex items-center gap-4">
          {logoUrl && <img src={logoUrl} alt="Logo" className="h-12 w-12 rounded object-contain" />}
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleLogoFileChange(e.target.files)}
          />
          <Button type="button" variant="outline" onClick={() => logoInputRef.current?.click()}>
            Upload logo
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Color palette</Label>
        <div className="flex flex-wrap gap-3">
          {PALETTES.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handlePaletteSelect(p.id)}
              className={cn(
                'flex items-center gap-2 rounded-md border-2 px-3 py-2 text-sm',
                paletteId === p.id ? 'border-brand' : 'border-transparent',
              )}
            >
              <span
                className="h-5 w-5 rounded-full"
                style={{ background: `linear-gradient(135deg, ${p.accent}, ${p.accentSecondary})` }}
              />
              {p.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => handlePaletteSelect(CUSTOM_PALETTE_ID)}
            className={cn(
              'flex items-center gap-2 rounded-md border-2 px-3 py-2 text-sm',
              paletteId === CUSTOM_PALETTE_ID ? 'border-brand' : 'border-transparent',
            )}
          >
            Custom
          </button>
        </div>

        {paletteId === CUSTOM_PALETTE_ID && (
          <div className="flex gap-6 pt-2">
            <div className="space-y-1">
              <Label>Primary</Label>
              <input
                type="color"
                value={customPrimary}
                onChange={(e) => handleCustomColorChange('primary', e.target.value)}
                className="h-10 w-16 rounded border"
              />
            </div>
            <div className="space-y-1">
              <Label>Secondary</Label>
              <input
                type="color"
                value={customSecondary}
                onChange={(e) => handleCustomColorChange('secondary', e.target.value)}
                className="h-10 w-16 rounded border"
              />
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>Section styles</Label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {SECTION_KEYS.map(({ key, label }) => (
            <div key={key} className="space-y-1">
              <p className="text-sm">{label}</p>
              <Select
                value={sectionStyles[key]}
                onValueChange={(v) => handleSectionStyleChange(key, v as SectionStyle)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gradient">Gradient</SelectItem>
                  <SelectItem value="flat">Flat</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <Label>Default mode (for new visitors)</Label>
        <Select value={defaultMode} onValueChange={(v) => setDefaultMode(v as 'light' | 'dark' | 'auto')}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="light">Light</SelectItem>
            <SelectItem value="dark">Dark</SelectItem>
            <SelectItem value="auto">Auto (system)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Preview</Label>
        <div className="flex flex-col gap-3 overflow-hidden rounded-lg border">
          <SectionSurface variant={sectionStyles.hero}>
            <div className="p-8 text-center">
              <p className="text-2xl font-bold">{brandName || 'Brand name'}</p>
              {tagline && <p className="opacity-90">{tagline}</p>}
            </div>
          </SectionSurface>
          <SectionSurface variant={sectionStyles.footer} className="p-4 text-center text-sm">
            Footer preview — colors: {colors.primary} / {colors.secondary}
          </SectionSurface>
        </div>
      </div>
    </div>
  );
}
