import { Loader2, Pencil, RefreshCw, Type as TypeIcon, Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { NEON_SIZE_LABELS, confirmDesign, createDesign, getDesign, regenerateDesign } from "../../api/customNeon";
import { ApiError } from "../../api/client";
import { ErrorMessage } from "../../components/layout/AsyncState";
import { DesignStatusBadge } from "../../components/product/DesignStatusBadge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { useCart } from "../../hooks/useCart";
import { formatCurrency } from "../../lib/utils";
import type { CustomNeonDesign, DesignType, NeonColor, NeonSize } from "../../types";
import { ReactSketchCanvas } from "react-sketch-canvas";
import type { ReactSketchCanvasRef } from "react-sketch-canvas";

type Mode = DesignType;

const MODES: { value: Mode; label: string; icon: typeof Upload }[] = [
  { value: "upload", label: "Upload Image", icon: Upload },
  { value: "draw", label: "Draw", icon: Pencil },
  { value: "text", label: "Type Text", icon: TypeIcon },
];

const SIZE_OPTIONS: { value: NeonSize; label: string; price: number }[] = [
  { value: "small", label: NEON_SIZE_LABELS.small, price: 249.99 },
  { value: "medium", label: NEON_SIZE_LABELS.medium, price: 399.99 },
  { value: "large", label: NEON_SIZE_LABELS.large, price: 524.99 },
];

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

// Split from a single reference collage (5 real neon signs) into individual
// thumbnails — purely a showcase/inspiration gallery, not tied to any order.
const GALLERY_IMAGES = [
  { src: "/assets/neon-gallery-1.png", alt: "Custom neon sign example — Eevee, \"Mia\"" },
  { src: "/assets/neon-gallery-2.png", alt: "Custom neon sign example — Jigglypuff, \"Zoey\"" },
  { src: "/assets/neon-gallery-3.png", alt: "Custom neon sign example — Gengar, \"Max\"" },
  { src: "/assets/neon-gallery-4.png", alt: "Custom neon sign example — Charmander, \"Leo\"" },
  { src: "/assets/neon-gallery-5.png", alt: "Custom neon sign example — Pikachu, \"Layla\"" },
];

const POLL_INTERVAL_MS = 3000;

async function dataUrlToFile(dataUrl: string, filename: string): Promise<File> {
  const blob = await (await fetch(dataUrl)).blob();
  return new File([blob], filename, { type: blob.type || "image/png" });
}

function renderTextToFile(text: string, fontFamily: string): Promise<File> {
  const canvas = document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 400;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `64px ${fontFamily}`;
  ctx.fillText(text || "Your Text", canvas.width / 2, canvas.height / 2);
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(new File([blob!], "text-design.png", { type: "image/png" }));
    }, "image/png");
  });
}

export function CustomNeon() {
  const navigate = useNavigate();
  const { refresh: refreshCart } = useCart();
  const canvasRef = useRef<ReactSketchCanvasRef>(null);

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
      setError(err instanceof Error ? err.message : "Failed to generate preview");
    } finally {
      setGenerating(false);
    }
  }

  // Sends the currently selected size/color so changing either and hitting
  // "Re-run AI preview" regenerates with the new values, not the old ones.
  async function handleRegenerate() {
    if (!design) return;
    setError(null);
    try {
      const updated = await regenerateDesign(design.id, { size, neon_color: neonColor });
      setDesign(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to re-run preview");
    }
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

  // Once a design exists, the server always has a signed URL for whatever
  // was actually sent to the AI (upload's sourceImageUrl, or draw/text's
  // flattened renderedImageUrl) — used as the "before" side of the
  // source-vs-generated comparison below.
  const sourcePreviewUrl = design?.inputPayload.sourceImageUrl || design?.inputPayload.renderedImageUrl || null;

  return (
    <div className="py-12">
      <div className="container flex flex-col gap-10">
        <div>
          <h1 className="font-display text-3xl tracking-tight">Custom AI Creation</h1>
          <p className="mt-2 text-sm text-neutral-400">
            Upload a photo, draw a sketch, or type a name — our AI turns it into a realistic preview of a
            manufactured neon sign.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
            See what others have created
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {GALLERY_IMAGES.map((img) => (
              <div key={img.src} className="aspect-square overflow-hidden rounded-lg border border-neutral-800 bg-black">
                <img src={img.src} alt={img.alt} className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-6 lg:max-w-2xl">
          <div className="flex gap-2 border-b border-neutral-800 pb-4">
            {MODES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                disabled={Boolean(design)}
                onClick={() => setMode(value)}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                  mode === value ? "bg-white text-black" : "bg-neutral-900 text-neutral-300 hover:bg-neutral-800"
                }`}
              >
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </div>

          {!design && (
            <div className="flex flex-col gap-3">
              {mode === "upload" && (
                <>
                  <Input type="file" accept="image/*" onChange={handleUploadChange} />
                  {uploadPreviewUrl && (
                    <div className="flex h-48 items-center justify-center overflow-hidden rounded-lg border border-neutral-800 bg-black">
                      <img src={uploadPreviewUrl} alt="Upload preview" className="h-full w-full object-contain" />
                    </div>
                  )}
                </>
              )}

              {mode === "draw" && (
                <>
                  <div className="h-72 overflow-hidden rounded-lg border border-neutral-800">
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
                </>
              )}

              {mode === "text" && (
                <div className="flex flex-col gap-3">
                  <Input
                    placeholder="Enter your text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    maxLength={40}
                  />
                  <Select value={fontFamily} onValueChange={setFontFamily}>
                    <SelectTrigger className="bg-neutral-900 text-neutral-100">
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
                  <div className="flex h-32 items-center justify-center overflow-hidden rounded-lg border border-neutral-800 bg-black">
                    <p
                      className="px-6 text-center text-3xl text-white"
                      style={{ fontFamily, textShadow: "0 0 12px rgba(255,255,255,0.6)" }}
                    >
                      {text || "Your Text"}
                    </p>
                  </div>
                </div>
              )}

              <Button type="button" onClick={handleGenerate} disabled={generating}>
                {generating ? "Generating…" : "Generate AI preview"}
              </Button>
            </div>
          )}

          {design && (
            <div className="flex items-center gap-3">
              <DesignStatusBadge status={design.status} />
              {!isBusy && (
                <button
                  type="button"
                  onClick={handleRegenerate}
                  className="flex items-center gap-1 text-xs uppercase tracking-wide text-neutral-400 hover:text-white"
                >
                  <RefreshCw className="h-3 w-3" /> Re-run AI preview
                </button>
              )}
            </div>
          )}

          {design?.status === "failed" && (
            <ErrorMessage message="We couldn't generate a preview for this design. Try re-running it or start a new one." />
          )}

          {isReady && !matchesGenerated && (
            <p className="text-xs text-amber-400">
              This preview was generated for {design?.size} / {design?.neonColor}. Re-run the preview to see your
              new selection before confirming.
            </p>
          )}

          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Select dimensions</p>
            <div className="grid grid-cols-3 gap-3">
              {SIZE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSize(opt.value)}
                  className={`rounded-md border p-3 text-left transition-colors ${
                    size === opt.value ? "border-white bg-neutral-900" : "border-neutral-800 hover:border-neutral-600"
                  }`}
                >
                  <p className="font-medium">{opt.label}</p>
                  <p className="text-xs text-neutral-400">{formatCurrency(opt.price)}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Neon color</p>
            <div className="flex gap-3">
              {COLOR_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  aria-label={opt.label}
                  onClick={() => setNeonColor(opt.value)}
                  className={`h-9 w-9 rounded-full border-2 transition-transform ${
                    neonColor === opt.value ? "scale-110 border-white" : "border-transparent"
                  }`}
                  style={{ backgroundColor: opt.swatch }}
                />
              ))}
            </div>
          </div>

          {error && <ErrorMessage message={error} />}

          <div className="flex flex-col gap-3 border-t border-neutral-800 pt-4">
            <div className="flex justify-between text-sm text-neutral-400">
              <span>Subtotal</span>
              <span className="font-display text-lg text-white">{formatCurrency(selectedPrice)}</span>
            </div>
            <Button type="button" size="lg" disabled={!isReady || !matchesGenerated || confirming} onClick={handleConfirm}>
              {confirming ? "Adding to cart…" : "Confirm custom design"}
            </Button>
            <p className="text-center text-xs text-neutral-500">Taxes and shipping calculated at checkout.</p>
          </div>
        </div>

        {design && (
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Preview comparison</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <p className="text-xs text-neutral-500">Source</p>
                <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg border border-neutral-800 bg-black">
                  {sourcePreviewUrl ? (
                    <img src={sourcePreviewUrl} alt="Your source design" className="h-full w-full object-contain" />
                  ) : (
                    <p className="text-sm text-neutral-500">No source image</p>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-xs text-neutral-500">AI generated</p>
                <div
                  className="flex aspect-square items-center justify-center overflow-hidden rounded-lg border border-neutral-800 bg-black"
                  style={design.generatedImageUrl ? { boxShadow: "0 0 60px -10px rgba(245,180,0,0.35)" } : undefined}
                >
                  {design.generatedImageUrl ? (
                    <img
                      src={design.generatedImageUrl}
                      alt="AI-generated neon preview"
                      className="h-full w-full object-contain"
                    />
                  ) : isBusy ? (
                    <div className="flex flex-col items-center gap-3 text-neutral-400">
                      <Loader2 className="h-8 w-8 animate-spin" />
                      <p className="text-sm">Generating your neon preview…</p>
                    </div>
                  ) : (
                    <p className="text-sm text-neutral-500">Generation failed</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
