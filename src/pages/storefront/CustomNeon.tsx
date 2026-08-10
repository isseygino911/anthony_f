import { Loader2, Pencil, Plus, Sparkles, Type as TypeIcon, Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  NEON_SIZE_LABELS,
  NEON_SIZE_PRICES,
  confirmDesign,
  createDesign,
  getActiveDesign,
  getDesign,
  getShowcaseDesigns,
  type ShowcaseDesign,
} from "../../api/customNeon";
import { ApiError } from "../../api/client";
import { ErrorMessage } from "../../components/layout/AsyncState";
import { DesignStatusBadge } from "../../components/product/DesignStatusBadge";
import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Textarea } from "../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { useScrollReveal } from "../../hooks/useScrollReveal";
import { useStaggerReveal } from "../../hooks/useStaggerReveal";
import { useAuth } from "../../hooks/useAuth";
import { useCart } from "../../hooks/useCart";
import { cn, formatCurrency } from "../../lib/utils";
import type { CustomNeonDesign, DesignType, NeonColor, NeonSize } from "../../types";
import { ReactSketchCanvas } from "react-sketch-canvas";
import type { ReactSketchCanvasRef } from "react-sketch-canvas";

type Mode = DesignType;

const MODES: { value: Mode; label: string; icon: typeof Upload }[] = [
  { value: "upload", label: "Upload Image", icon: Upload },
  { value: "draw", label: "Draw", icon: Pencil },
  { value: "text", label: "Type Text", icon: TypeIcon },
];

const SIZE_OPTIONS: { value: NeonSize; label: string; price: number }[] = (
  ["small", "medium", "large"] as const
).map((value) => ({ value, label: NEON_SIZE_LABELS[value], price: NEON_SIZE_PRICES[value] }));

const COLOR_OPTIONS: { value: NeonColor; label: string; swatch: string }[] = [
  { value: "amber", label: "Amber", swatch: "#f5b400" },
  { value: "pink", label: "Pink", swatch: "#ec4899" },
  { value: "blue", label: "Blue", swatch: "#38bdf8" },
  { value: "white", label: "White", swatch: "#f8fafc" },
];

const FONT_OPTIONS = [
  { value: '"Dancing Script", cursive', label: "Dancing Script" },
  { value: '"Pacifico", cursive', label: "Pacifico" },
  { value: '"Caveat", cursive', label: "Caveat" },
  { value: '"Great Vibes", cursive', label: "Great Vibes" },
  { value: '"Permanent Marker", cursive', label: "Permanent Marker" },
];

// Shown until the real community designs load (or if that fetch fails).
const FALLBACK_COMMUNITY: ShowcaseDesign[] = [
  { id: -1, label: "Eevee outline · cyan", dimensions: '12"x12"', imageUrl: "/assets/neon-gallery-1.png" },
  { id: -2, label: "Jigglypuff outline · pink", dimensions: '24"x24"', imageUrl: "/assets/neon-gallery-2.png" },
  { id: -3, label: "Gengar outline · purple", dimensions: '36"x36"', imageUrl: "/assets/neon-gallery-3.png" },
  { id: -4, label: "Charmander outline · orange", dimensions: '24"x24"', imageUrl: "/assets/neon-gallery-4.png" },
  { id: -5, label: "Pikachu outline · yellow", dimensions: '12"x12"', imageUrl: "/assets/neon-gallery-5.png" },
];

const POLL_INTERVAL_MS = 3000;

// Text-mode canvas geometry. Square to match the square product sizes
// (12"x12" / 24"x24" / 36"x36") and Gemini's tendency to return 1:1.
const CANVAS_SIZE = 1024;
// Safe margin on each side so glyph ascenders/descenders and the italic
// overhang of the script faces aren't shaved off at the canvas edge.
const CANVAS_PADDING = 0.1;
const MAX_FONT_PX = 200;
const MIN_FONT_PX = 24;
const LINE_HEIGHT = 1.25;
const MAX_TEXT_LENGTH = 60;
const MAX_LINES = 4;

async function dataUrlToFile(dataUrl: string, filename: string): Promise<File> {
  const blob = await (await fetch(dataUrl)).blob();
  return new File([blob], filename, { type: blob.type || "image/png" });
}

// Splits on newlines and drops blank leading/trailing lines, so a stray
// trailing Enter doesn't push the text off-centre. Shared by the canvas
// renderer and the live preview so the two always agree.
function toLines(text: string): string[] {
  const lines = text.split("\n").map((line) => line.trim());
  while (lines.length && !lines[0]) lines.shift();
  while (lines.length && !lines[lines.length - 1]) lines.pop();
  const capped = lines.slice(0, MAX_LINES);
  return capped.length ? capped : ["Your Text"];
}

// Largest font size at which every line fits inside the padded box, both
// horizontally (widest line) and vertically (stacked line height).
function fitFontSize(ctx: CanvasRenderingContext2D, lines: string[], fontFamily: string, available: number) {
  for (let fontSize = MAX_FONT_PX; fontSize > MIN_FONT_PX; fontSize -= 2) {
    ctx.font = `${fontSize}px ${fontFamily}`;
    const widest = Math.max(...lines.map((line) => ctx.measureText(line).width));
    const stacked = lines.length * fontSize * LINE_HEIGHT;
    if (widest <= available && stacked <= available) return fontSize;
  }
  return MIN_FONT_PX;
}

async function renderTextToFile(text: string, fontFamily: string): Promise<File> {
  // The fonts load with display=swap, so without this the face may not be in
  // the cache yet — measureText would silently report fallback-cursive
  // metrics and we'd fit the text to the wrong typeface.
  try {
    await document.fonts.load(`${MAX_FONT_PX}px ${fontFamily}`);
    await document.fonts.ready;
  } catch {
    // Font loading unavailable/failed — render with whatever is cached
    // rather than blocking the user's generation.
  }

  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const lines = toLines(text);
  const available = CANVAS_SIZE * (1 - 2 * CANVAS_PADDING);
  const fontSize = fitFontSize(ctx, lines, fontFamily, available);
  ctx.font = `${fontSize}px ${fontFamily}`;

  const lineHeight = fontSize * LINE_HEIGHT;
  lines.forEach((line, i) => {
    const y = CANVAS_SIZE / 2 + (i - (lines.length - 1) / 2) * lineHeight;
    // maxWidth is the last-resort guard: at MIN_FONT_PX a pathological string
    // condenses to fit instead of being clipped at the canvas edge.
    ctx.fillText(line, CANVAS_SIZE / 2, y, available);
  });

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(new File([blob!], "text-design.png", { type: "image/png" }));
    }, "image/png");
  });
}

// Rendered by both the mobile and desktop layouts — the only difference is
// the preview box sizing, which the caller passes in.
function TextModeControls({
  text,
  onTextChange,
  fontFamily,
  onFontChange,
  previewClassName,
  previewTextClassName,
}: {
  text: string;
  onTextChange: (value: string) => void;
  fontFamily: string;
  onFontChange: (value: string) => void;
  previewClassName: string;
  previewTextClassName: string;
}) {
  // Enter inserts a real line break; this keeps the user from stacking more
  // lines than the canvas renderer will draw.
  function handleChange(value: string) {
    const lines = value.split("\n");
    onTextChange(lines.length > MAX_LINES ? lines.slice(0, MAX_LINES).join("\n") : value);
  }

  return (
    <div className="flex flex-col gap-3">
      <Textarea
        placeholder="Enter your text"
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        maxLength={MAX_TEXT_LENGTH}
        rows={3}
      />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Press Enter for a new line</span>
        <span>
          {text.length}/{MAX_TEXT_LENGTH}
        </span>
      </div>
      <Select value={fontFamily} onValueChange={onFontChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {FONT_OPTIONS.map((f) => (
            <SelectItem key={f.value} value={f.value}>
              {f.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className={previewClassName}>
        <p
          className={previewTextClassName}
          style={{ fontFamily, textShadow: "0 0 12px rgba(255,255,255,0.6)" }}
        >
          {text.trim() ? text : "Your Text"}
        </p>
      </div>
    </div>
  );
}

export function CustomNeon() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refresh: refreshCart } = useCart();
  const canvasRef = useRef<ReactSketchCanvasRef>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const [mode, setMode] = useState<Mode>("upload");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [fontFamily, setFontFamily] = useState(FONT_OPTIONS[0].value);

  const [size, setSize] = useState<NeonSize>("small");
  const [neonColor, setNeonColor] = useState<NeonColor>("amber");

  const [design, setDesign] = useState<CustomNeonDesign | null>(null);
  const [generating, setGenerating] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmNewOpen, setConfirmNewOpen] = useState(false);

  // Keeps ?designId= in sync with the in-progress/finished design so a
  // refresh (or sharing the URL) can reattach to it instead of losing it —
  // generation itself is server-side and keeps running either way, this is
  // purely about the client not losing its reference to it. Clearing the
  // design (Generate New) has to drop the param too, or a refresh would
  // reattach to the design the user just walked away from.
  useEffect(() => {
    if (design) {
      setSearchParams({ designId: String(design.id) }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  }, [design, setSearchParams]);

  // On mount: reattach to a design already in progress rather than showing a
  // blank "Generate" form the user could accidentally resubmit into. Prefer
  // the URL's designId (works even across a hard refresh); otherwise ask the
  // API if this user already has one active (covers a fresh tab/no query
  // param) — the server-side guard in createDesign/regenerate already blocks
  // starting a second one regardless, this just makes the UI reflect that.
  useEffect(() => {
    const designId = searchParams.get("designId");
    (async () => {
      try {
        if (designId) {
          const found = await getDesign(Number(designId));
          setDesign(found);
          setSize(found.size ?? "small");
          setNeonColor(found.neonColor ?? "amber");
          return;
        }
        const { design: active } = await getActiveDesign();
        if (active) {
          setDesign(active);
          setSize(active.size ?? "small");
          setNeonColor(active.neonColor ?? "amber");
        }
      } catch {
        // Unknown/foreign designId, or not logged in yet — fall back to a
        // fresh "Generate" form rather than blocking the page.
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!design || (design.status !== "pending" && design.status !== "processing")) return;
    const interval = setInterval(async () => {
      try {
        const updated = await getDesign(design.id);
        setDesign(updated);
      } catch {
        // transient poll failure — next tick will retry
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [design]);

  function handleUploadChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setUploadFile(file);
    setUploadPreviewUrl(file ? URL.createObjectURL(file) : null);
  }

  const buildFileForMode = useCallback(async (): Promise<{ file: File; strokes?: unknown }> => {
    if (mode === "upload") {
      if (!uploadFile) throw new Error("Choose an image to upload first.");
      return { file: uploadFile };
    }
    if (mode === "draw") {
      const dataUrl = await canvasRef.current?.exportImage("png");
      if (!dataUrl) throw new Error("Draw something on the canvas first.");
      const strokes = await canvasRef.current?.exportPaths();
      const file = await dataUrlToFile(dataUrl, "drawing.png");
      return { file, strokes };
    }
    if (!text.trim()) throw new Error("Type some text first.");
    const file = await renderTextToFile(text.trim(), fontFamily);
    return { file };
  }, [mode, uploadFile, text, fontFamily]);

  async function handleGenerate() {
    setError(null);
    setGenerating(true);
    try {
      const { file, strokes } = await buildFileForMode();
      const created = await createDesign({
        designType: mode,
        file,
        strokes,
        text: mode === "text" ? text.trim() : undefined,
        fontFamily: mode === "text" ? fontFamily : undefined,
        size,
        neonColor,
      });
      setDesign(created);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to generate preview");
    } finally {
      setGenerating(false);
    }
  }

  // Abandons the current design and returns the designer to its default
  // state so the user can create something else — the finished design is
  // left untouched on the server and stays listed under My Designs.
  function handleGenerateNew() {
    setConfirmNewOpen(false);
    setDesign(null);
    setError(null);
    setSize("small");
    setNeonColor("amber");
    setText("");
    setUploadFile(null);
    // handleUploadChange creates this with URL.createObjectURL and nothing
    // else revokes it, so dropping the reference without revoking leaks it.
    setUploadPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
    canvasRef.current?.clearCanvas();
  }

  // My Designs is auth-gated, so a signed-out visitor who resets has no way
  // back to the preview they just generated — confirm before discarding it.
  // Logged-in users can always find it again, so they reset immediately.
  function requestGenerateNew() {
    if (user) {
      handleGenerateNew();
      return;
    }
    setConfirmNewOpen(true);
  }

  async function handleConfirm() {
    if (!design) return;
    setError(null);
    setConfirming(true);
    try {
      await confirmDesign(design.id);
      await refreshCart();
      navigate("/cart");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to confirm design");
    } finally {
      setConfirming(false);
    }
  }

  const isReady = design?.status === "ready";
  const isBusy = design?.status === "pending" || design?.status === "processing";
  // The preview image was rendered for design.size/design.neonColor — if the
  // user has since changed the live selection, the picture on screen no
  // longer matches what they'd be buying, so Confirm is gated until they
  // either re-run the preview or switch back to the generated values.
  const matchesGenerated = Boolean(design) && design?.size === size && design?.neonColor === neonColor;
  const selectedPrice = SIZE_OPTIONS.find((s) => s.value === size)?.price ?? 0;

  return (
    <div className="pb-24">
      {/* Hero */}
      <section className="px-6 pb-8 pt-8 text-left lg:pb-12 lg:pt-24 lg:text-center">
        <h1 className="font-display text-3xl text-foreground lg:text-5xl lg:sm:text-6xl lg:md:text-7xl">
          Custom AI Creation
        </h1>
        <p className="mt-3 max-w-2xl text-base text-muted-foreground lg:mx-auto lg:mt-4 lg:text-lg">
          Upload a photo, draw a sketch, or type a name &mdash; our AI turns it into a realistic preview of a
          handcrafted neon masterpiece.
        </p>
      </section>

      <CommunityCreations />

      {/* Configuration — mobile (segmented tabs, floating preview controls, sticky bottom bar) */}
      <div className="lg:hidden">
        <section className="px-4 pb-6">
          <div className="flex gap-2 rounded-xl bg-card p-1">
            {MODES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                disabled={Boolean(design)}
                onClick={() => setMode(value)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                  mode === value ? "bg-card-highest text-brand" : "text-muted-foreground",
                )}
              >
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </div>
        </section>

        {!design && (
          <section className="px-4 pb-6">
            {mode === "upload" && (
              <div className="flex flex-col gap-3">
                <label className="group flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-border bg-card/60 p-10 text-center backdrop-blur-xl">
                  <Upload className="mb-3 h-8 w-8 text-muted-foreground group-hover:text-brand" />
                  <p className="mb-1 text-sm font-semibold text-foreground">
                    Tap to <span className="text-brand underline">browse</span>
                  </p>
                  <p className="text-xs text-muted-foreground">PNG, JPG or SVG (Max 10MB)</p>
                  <input type="file" accept="image/*" className="hidden" onChange={handleUploadChange} />
                </label>
                {uploadPreviewUrl && (
                  <div className="flex h-40 items-center justify-center overflow-hidden rounded-xl border border-border bg-background">
                    <img src={uploadPreviewUrl} alt="Upload preview" className="h-full w-full object-contain" />
                  </div>
                )}
              </div>
            )}

            {mode === "draw" && (
              <div className="flex flex-col gap-3">
                <div className="h-56 overflow-hidden rounded-2xl border border-border">
                  <ReactSketchCanvas
                    ref={canvasRef}
                    width="100%"
                    height="100%"
                    canvasColor="#ffffff"
                    strokeColor="#000000"
                    strokeWidth={6}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => canvasRef.current?.undo()}>
                    Undo
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => canvasRef.current?.clearCanvas()}>
                    Clear
                  </Button>
                </div>
              </div>
            )}

            {mode === "text" && (
              <TextModeControls
                text={text}
                onTextChange={setText}
                fontFamily={fontFamily}
                onFontChange={setFontFamily}
                previewClassName="flex h-28 items-center justify-center overflow-hidden rounded-2xl border border-border bg-background"
                previewTextClassName="whitespace-pre-line px-6 text-center text-2xl leading-tight text-foreground"
              />
            )}
          </section>
        )}

        {/* Interactive preview with floating studio controls */}
        <section className="px-4 pb-6">
          <div className="relative aspect-square overflow-hidden rounded-3xl border border-border bg-card/60 backdrop-blur-xl">
            <div
              className="pointer-events-none absolute inset-0 opacity-50"
              style={{
                background:
                  'radial-gradient(circle at center, color-mix(in srgb, var(--brand-primary) 15%, transparent) 0%, transparent 70%)',
              }}
            />
            {design?.generatedImageUrl ? (
              <img
                src={design.generatedImageUrl}
                alt="AI-generated neon preview"
                className="relative z-10 h-full w-full object-contain"
              />
            ) : isBusy ? (
              <div className="relative z-10 flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-muted-foreground">
                <Loader2 className="h-10 w-10 animate-spin text-brand" />
                <p className="text-xs">
                  This can take a minute — feel free to close this tab, your preview will keep generating and
                  you'll find it under My Designs when it's ready.
                </p>
              </div>
            ) : design?.status === "failed" ? (
              <div className="relative z-10 flex h-full items-center justify-center p-10 text-center text-muted-foreground">
                Generation failed &mdash; try again below.
              </div>
            ) : (
              <div className="relative z-10 flex h-full flex-col items-center justify-center p-10 text-center">
                <Sparkles className="mb-4 h-12 w-12 text-brand/20" />
                <p className="text-sm text-muted-foreground">Your AI-generated neon preview will appear here.</p>
              </div>
            )}
            {design && (
              <div className="absolute inset-x-4 bottom-4 z-20 flex items-center justify-between">
                <button
                  type="button"
                  onClick={requestGenerateNew}
                  disabled={isBusy}
                  aria-label="Generate new design"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card/80 text-foreground backdrop-blur-xl disabled:opacity-40"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <DesignStatusBadge status={design.status} />
                {design.generatedImageUrl ? (
                  <a
                    href={design.generatedImageUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Open full-size preview"
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card/80 text-foreground backdrop-blur-xl"
                  >
                    <Sparkles className="h-4 w-4" />
                  </a>
                ) : (
                  <span className="h-11 w-11" />
                )}
              </div>
            )}
          </div>

          {!design && (
            <Button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              className="neon-button-glow mt-4 h-auto w-full gap-3 rounded-xl bg-brand py-5 font-display uppercase tracking-wide text-brand-foreground hover:bg-brand"
            >
              <Sparkles className="h-5 w-5" />
              {generating ? "Processing magic…" : "Generate AI preview"}
            </Button>
          )}

          {design?.status === "failed" && (
            <div className="mt-3">
              <ErrorMessage message="We couldn't generate a preview for this design. Tap the + button to start a new one." />
            </div>
          )}

          {isReady && !matchesGenerated && (
            <p className="mt-3 text-xs text-amber-500">
              This preview was generated for {design?.size} / {design?.neonColor}. Switch back to those values to
              confirm it, or start a new design to build one at your new selection.
            </p>
          )}
        </section>

        {/* Dimensions */}
        <section className="px-4 pb-6">
          <h3 className="mb-4 font-display text-xl text-foreground">Select Dimensions</h3>
          <div className="grid grid-cols-3 gap-3">
            {SIZE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSize(opt.value)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-2xl border-2 bg-card/60 p-4 backdrop-blur-xl transition-colors",
                  size === opt.value ? "border-brand" : "border-transparent",
                )}
              >
                <span className="text-sm font-bold text-foreground">{opt.label}</span>
                <span className={cn("text-xs", size === opt.value ? "text-brand" : "text-muted-foreground")}>
                  {formatCurrency(opt.price)}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Colors */}
        <section className="px-4 pb-6">
          <h3 className="mb-4 font-display text-xl text-foreground">Neon Color</h3>
          <div className="flex gap-4">
            {COLOR_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                aria-label={opt.label}
                onClick={() => setNeonColor(opt.value)}
                className={cn(
                  "h-11 w-11 rounded-full border-4 transition-transform",
                  neonColor === opt.value ? "scale-110 border-brand" : "border-transparent",
                )}
                style={{ backgroundColor: opt.swatch }}
              />
            ))}
          </div>
        </section>

        {error && (
          <section className="px-4 pb-6">
            <ErrorMessage message={error} />
          </section>
        )}

        {/* Spacer so content isn't hidden behind the sticky bar */}
        <div className="h-24" />

        {/* Sticky bottom action bar */}
        <div className="fixed inset-x-0 bottom-0 z-40 p-4">
          <div className="flex items-center justify-between gap-4 rounded-3xl border border-border bg-card/90 p-4 shadow-2xl backdrop-blur-xl">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Subtotal</span>
              <span className="font-display text-2xl text-foreground">{formatCurrency(selectedPrice)}</span>
            </div>
            <Button
              type="button"
              disabled={!isReady || !matchesGenerated || confirming}
              onClick={handleConfirm}
              className="h-auto rounded-2xl px-6 py-4"
            >
              {confirming ? "Adding…" : "Confirm Design"}
            </Button>
          </div>
        </div>
      </div>

      {/* Configuration — desktop */}
      <section className="hidden border-t border-border bg-card/50 py-16 lg:block">
        <div className="container grid grid-cols-1 gap-16 lg:grid-cols-2">
          {/* Left: preview */}
          <div className="space-y-8">
            <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl border border-border bg-card/60 backdrop-blur-xl">
              {design?.generatedImageUrl ? (
                <img
                  src={design.generatedImageUrl}
                  alt="AI-generated neon preview"
                  className="h-full w-full object-contain"
                />
              ) : isBusy ? (
                <div className="flex flex-col items-center gap-3 px-12 text-center text-muted-foreground">
                  <Loader2 className="h-10 w-10 animate-spin text-brand" />
                  <p>Generating your neon preview&hellip;</p>
                  <p className="text-xs">
                    This can take a minute — feel free to close this tab, your preview will keep generating and
                    you'll find it under My Designs when it's ready.
                  </p>
                </div>
              ) : design?.status === "failed" ? (
                <p className="px-12 text-center text-muted-foreground">Generation failed &mdash; try again below.</p>
              ) : (
                <div className="p-12 text-center">
                  <Sparkles className="mx-auto mb-6 h-16 w-16 text-brand/20" />
                  <p className="text-muted-foreground">Your AI-generated neon preview will appear here.</p>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card/60 p-4 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/20">
                  <span className="text-brand">i</span>
                </div>
                <span className="text-sm text-foreground">
                  Final design might have slight technical optimizations.
                </span>
              </div>
              <a href="/resources" className="shrink-0 text-sm font-semibold text-brand hover:underline">
                See Technical Guide
              </a>
            </div>
          </div>

          {/* Right: controls */}
          <div className="space-y-12">
            <div>
              <div className="mb-8 flex gap-8 border-b border-border">
                {MODES.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    disabled={Boolean(design)}
                    onClick={() => setMode(value)}
                    className={cn(
                      "flex items-center gap-2 pb-4 font-display text-lg transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                      mode === value
                        ? "border-b-2 border-brand text-brand"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" /> {label}
                  </button>
                ))}
              </div>

              {!design && (
                <div className="flex flex-col gap-3">
                  {mode === "upload" && (
                    <>
                      <label className="group flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-border p-12 text-center transition-colors hover:border-brand/50">
                        <Upload className="mb-4 h-10 w-10 text-muted-foreground transition-transform group-hover:-translate-y-1 group-hover:text-brand" />
                        <p className="mb-2 font-semibold text-foreground">
                          Drop your image here or <span className="text-brand underline">browse</span>
                        </p>
                        <p className="text-sm text-muted-foreground">PNG, JPG or SVG (Max 10MB)</p>
                        <input type="file" accept="image/*" className="hidden" onChange={handleUploadChange} />
                      </label>
                      {uploadPreviewUrl && (
                        <div className="flex h-48 items-center justify-center overflow-hidden rounded-lg border border-border bg-background">
                          <img src={uploadPreviewUrl} alt="Upload preview" className="h-full w-full object-contain" />
                        </div>
                      )}
                    </>
                  )}

                  {mode === "draw" && (
                    <>
                      <div className="h-72 overflow-hidden rounded-xl border border-border">
                        <ReactSketchCanvas
                          ref={canvasRef}
                          width="100%"
                          height="100%"
                          canvasColor="#ffffff"
                          strokeColor="#000000"
                          strokeWidth={6}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => canvasRef.current?.undo()}>
                          Undo
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => canvasRef.current?.clearCanvas()}
                        >
                          Clear
                        </Button>
                      </div>
                    </>
                  )}

                  {mode === "text" && (
                    <TextModeControls
                      text={text}
                      onTextChange={setText}
                      fontFamily={fontFamily}
                      onFontChange={setFontFamily}
                      previewClassName="flex h-32 items-center justify-center overflow-hidden rounded-xl border border-border bg-background"
                      previewTextClassName="whitespace-pre-line px-6 text-center text-3xl leading-tight text-foreground"
                    />
                  )}
                </div>
              )}

              {design && (
                <div className="flex items-center gap-3">
                  <DesignStatusBadge status={design.status} />
                  {!isBusy && (
                    <button
                      type="button"
                      onClick={requestGenerateNew}
                      className="flex items-center gap-1 text-xs uppercase tracking-wide text-muted-foreground hover:text-foreground"
                    >
                      <Plus className="h-3 w-3" /> Generate new
                    </button>
                  )}
                </div>
              )}

              {design?.status === "failed" && (
                <ErrorMessage message="We couldn't generate a preview for this design. Use “Generate new” to start another." />
              )}

              {isReady && !matchesGenerated && (
                <p className="text-xs text-amber-500">
                  This preview was generated for {design?.size} / {design?.neonColor}. Switch back to those values
                  to confirm it, or start a new design to build one at your new selection.
                </p>
              )}

              {!design && (
                <Button
                  type="button"
                  onClick={handleGenerate}
                  disabled={generating}
                  className="neon-button-glow mt-6 h-auto w-full gap-3 rounded-xl bg-brand py-6 font-display text-lg uppercase tracking-wide text-brand-foreground hover:bg-brand"
                >
                  <Sparkles className="h-5 w-5" />
                  {generating ? "Processing magic…" : "Generate AI preview"}
                </Button>
              )}
            </div>

            {/* Dimensions */}
            <div>
              <h3 className="mb-4 font-label text-xs uppercase tracking-widest text-brand">Select Dimensions</h3>
              <div className="grid grid-cols-3 gap-4">
                {SIZE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSize(opt.value)}
                    className={cn(
                      "rounded-xl border-2 bg-card/60 p-4 text-left backdrop-blur-xl transition-colors sm:p-6",
                      size === opt.value ? "border-brand" : "border-transparent hover:border-border",
                    )}
                  >
                    <span
                      className={cn(
                        "mb-1 block text-lg font-bold sm:text-xl",
                        size === opt.value ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {opt.label}
                    </span>
                    <span className={size === opt.value ? "font-semibold text-brand" : "text-muted-foreground"}>
                      {formatCurrency(opt.price)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Colors */}
            <div>
              <h3 className="mb-4 font-label text-xs uppercase tracking-widest text-brand">Neon Color</h3>
              <div className="flex gap-4">
                {COLOR_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    aria-label={opt.label}
                    onClick={() => setNeonColor(opt.value)}
                    className={cn(
                      "h-12 w-12 rounded-full border-4 transition-transform",
                      neonColor === opt.value ? "scale-110 border-brand" : "border-transparent hover:border-border",
                    )}
                    style={{ backgroundColor: opt.swatch }}
                  />
                ))}
              </div>
            </div>

            {error && <ErrorMessage message={error} />}

            {/* Summary & CTA */}
            <div className="space-y-6 border-t border-border pt-8">
              <div className="flex items-center justify-between">
                <span className="text-lg text-muted-foreground">Subtotal</span>
                <span className="font-display text-3xl text-foreground">{formatCurrency(selectedPrice)}</span>
              </div>
              <Button
                type="button"
                disabled={!isReady || !matchesGenerated || confirming}
                onClick={handleConfirm}
                className="h-auto w-full rounded-xl bg-secondary py-6 font-display text-lg uppercase tracking-widest text-secondary-foreground transition-all duration-500 hover:bg-foreground hover:text-background"
              >
                {confirming ? "Adding to cart…" : "Confirm Custom Design"}
              </Button>
              <p className="text-center text-xs uppercase tracking-widest text-muted-foreground">
                Taxes and shipping calculated at checkout.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Signed-out only: My Designs is auth-gated, so starting over is the
          point of no return for a visitor without an account. */}
      <Dialog open={confirmNewOpen} onOpenChange={setConfirmNewOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Start a new design?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            You're not signed in, so this preview won't be saved anywhere you can get back to it. Sign in first to
            keep it under My Designs.
          </p>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setConfirmNewOpen(false)}>
              Keep this design
            </Button>
            <Button type="button" onClick={handleGenerateNew}>
              Start over
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CommunityCreations() {
  const [items, setItems] = useState<ShowcaseDesign[]>(FALLBACK_COMMUNITY);
  const headRef = useScrollReveal<HTMLDivElement>();
  const trackRef = useStaggerReveal<HTMLDivElement>(".community-card", [items]);

  useEffect(() => {
    getShowcaseDesigns(10)
      .then((res) => {
        if (res.items.length > 0) setItems(res.items);
      })
      .catch(() => {
        // Keep the fallback demo images.
      });
  }, []);

  return (
    <section className="container pb-12">
      <div ref={headRef} className="mb-4 flex items-end justify-between">
        <h2 className="font-label text-xs uppercase tracking-widest text-brand">Community Creations</h2>
      </div>
      <div ref={trackRef} className="no-scrollbar flex snap-x gap-6 overflow-x-auto pb-8">
        {items.map((item) => (
          <div key={item.id} className="community-card w-72 flex-none snap-start sm:w-80">
            <div className="group overflow-hidden rounded-xl border border-border bg-card/60 backdrop-blur-xl">
              <div className="relative aspect-square">
                <img src={item.imageUrl} alt={item.label} className="h-full w-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="rounded-full bg-brand px-4 py-2 text-sm font-bold text-brand-foreground">
                    Inspired?
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between p-4">
                <span className="font-semibold text-foreground">{item.label}</span>
                {item.dimensions && <span className="text-sm text-muted-foreground">{item.dimensions}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
