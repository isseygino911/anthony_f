// Smoothing for the freehand "Draw" mode on the custom neon page.
//
// Customers draw with a mouse or a fingertip, so the raw pointer samples that
// react-sketch-canvas records are full of jitter: hand tremor, the stair-step
// of integer pixel coordinates, and a burst of near-duplicate points whenever
// the pointer pauses. Exporting that bitmap straight to the image model bakes
// the wobble into the reference the model traces.
//
// This module rebuilds each stroke from its recorded points before export:
// resample away the duplicates, drop noise vertices with Ramer-Douglas-Peucker,
// average the survivors, then render through Catmull-Rom curves. The result
// keeps what the customer meant while losing the tremor they didn't.
//
// Pure geometry — no DOM — so it is unit-testable on its own. The canvas
// rendering that consumes it lives in renderStrokesToFile().

export interface StrokePoint {
  readonly x: number;
  readonly y: number;
}

export interface Stroke {
  readonly paths: StrokePoint[];
  readonly strokeWidth: number;
  readonly strokeColor: string;
  readonly drawMode: boolean;
}

// Pointer samples closer together than this contribute tremor, not shape, so
// resampling collapses them. Tuned against 6px strokes: small enough to keep
// deliberate detail, large enough to swallow the cluster a paused pointer emits.
const MIN_POINT_SPACING = 2.5;

// Perpendicular distance below which RDP treats a vertex as noise. Under ~1.5px
// legitimate corners start rounding off, over ~3px gentle curves go polygonal.
const SIMPLIFY_TOLERANCE = 2;

// Window radius for the averaging pass. 2 (a 5-point window) removes residual
// waviness without visibly shrinking the tight arcs of small lettering.
const SMOOTH_WINDOW = 2;

// Averaging pulls a curve toward its chord, so repeated passes would slowly
// deflate loops. Two passes is where tremor is gone and shape loss is not yet
// visible.
const SMOOTH_PASSES = 2;

// Below this many points a stroke is a dot, a tick, or a deliberate short mark.
// Smoothing those does nothing useful and can erase them, so they pass through.
const MIN_POINTS_TO_SMOOTH = 4;

function distance(a: StrokePoint, b: StrokePoint): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

// Perpendicular distance from `point` to the infinite line through a-b, with a
// degenerate-segment guard so a zero-length chord falls back to point distance
// instead of dividing by zero.
function perpendicularDistance(point: StrokePoint, a: StrokePoint, b: StrokePoint): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSq = dx * dx + dy * dy;
  if (lengthSq === 0) return distance(point, a);
  const cross = Math.abs(dy * point.x - dx * point.y + b.x * a.y - b.y * a.x);
  return cross / Math.sqrt(lengthSq);
}

// Drops points closer than MIN_POINT_SPACING to the last kept one. The final
// point is always preserved so the stroke keeps its true endpoint — otherwise
// strokes ending in a slow pause would be visibly clipped short.
export function resample(points: StrokePoint[], minSpacing = MIN_POINT_SPACING): StrokePoint[] {
  if (points.length <= 2) return [...points];
  const out: StrokePoint[] = [points[0]];
  for (let i = 1; i < points.length - 1; i += 1) {
    if (distance(out[out.length - 1], points[i]) >= minSpacing) out.push(points[i]);
  }
  out.push(points[points.length - 1]);
  return out;
}

// Ramer-Douglas-Peucker, iterative rather than recursive so a very long stroke
// (a scribble can run to thousands of points) cannot blow the call stack.
export function simplify(points: StrokePoint[], tolerance = SIMPLIFY_TOLERANCE): StrokePoint[] {
  if (points.length <= 2) return [...points];

  const keep = new Array<boolean>(points.length).fill(false);
  keep[0] = true;
  keep[points.length - 1] = true;

  const stack: Array<[number, number]> = [[0, points.length - 1]];
  while (stack.length) {
    const [start, end] = stack.pop()!;
    let maxDistance = 0;
    let index = -1;
    for (let i = start + 1; i < end; i += 1) {
      const d = perpendicularDistance(points[i], points[start], points[end]);
      if (d > maxDistance) {
        maxDistance = d;
        index = i;
      }
    }
    // Splitting at the farthest outlier keeps it; everything between the new
    // bounds is retested against the tighter chords.
    if (index !== -1 && maxDistance > tolerance) {
      keep[index] = true;
      stack.push([start, index], [index, end]);
    }
  }

  return points.filter((_, i) => keep[i]);
}

// Moving average over a fixed window. Endpoints are pinned so a stroke never
// drifts away from where the customer started and finished it.
export function smooth(points: StrokePoint[], window = SMOOTH_WINDOW, passes = SMOOTH_PASSES): StrokePoint[] {
  if (points.length <= 2) return [...points];

  let current = points;
  for (let pass = 0; pass < passes; pass += 1) {
    const next: StrokePoint[] = [current[0]];
    for (let i = 1; i < current.length - 1; i += 1) {
      const from = Math.max(0, i - window);
      const to = Math.min(current.length - 1, i + window);
      let sumX = 0;
      let sumY = 0;
      for (let j = from; j <= to; j += 1) {
        sumX += current[j].x;
        sumY += current[j].y;
      }
      const count = to - from + 1;
      next.push({ x: sumX / count, y: sumY / count });
    }
    next.push(current[current.length - 1]);
    current = next;
  }
  return current;
}

// resample -> simplify -> smooth, in that order: resampling first means RDP
// judges real geometry instead of duplicate clusters, and smoothing last works
// on the reduced point set so the window spans a meaningful arc length.
export function refineStrokePoints(points: StrokePoint[]): StrokePoint[] {
  if (!Array.isArray(points) || points.length < MIN_POINTS_TO_SMOOTH) {
    return Array.isArray(points) ? [...points] : [];
  }
  return smooth(simplify(resample(points)));
}

// Refines every stroke while preserving order and per-stroke settings, so
// eraser strokes (drawMode false) keep erasing exactly what they covered.
export function refineStrokes(strokes: Stroke[]): Stroke[] {
  if (!Array.isArray(strokes)) return [];
  return strokes
    .filter((stroke) => stroke && Array.isArray(stroke.paths) && stroke.paths.length > 0)
    .map((stroke) => ({ ...stroke, paths: refineStrokePoints(stroke.paths) }));
}

// Draws a refined stroke as a Catmull-Rom spline converted to cubic Béziers,
// which turns the polyline into continuous curvature — the last of the faceting
// that survives simplification disappears here.
export function strokeToPath2D(points: StrokePoint[]): Path2D {
  const path = new Path2D();
  if (!points.length) return path;

  path.moveTo(points[0].x, points[0].y);
  if (points.length === 1) return path;
  if (points.length === 2) {
    path.lineTo(points[1].x, points[1].y);
    return path;
  }

  for (let i = 0; i < points.length - 1; i += 1) {
    // Clamp at the ends so the first and last segments reuse the endpoint as
    // their missing neighbour, giving a natural tangent instead of overshoot.
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : points.length - 1];
    // Standard uniform Catmull-Rom to Bézier control points (tension 1/6).
    path.bezierCurveTo(
      p1.x + (p2.x - p0.x) / 6,
      p1.y + (p2.y - p0.y) / 6,
      p2.x - (p3.x - p1.x) / 6,
      p2.y - (p3.y - p1.y) / 6,
      p2.x,
      p2.y,
    );
  }
  return path;
}

// Output geometry, matching the text-mode renderer so every design type reaches
// the model as the same square, same padding, same white-on-black contrast.
const OUTPUT_SIZE = 1024;
const OUTPUT_PADDING = 0.1;

// The on-screen canvas is full-width with a fixed height, so its aspect ratio
// varies by viewport and never matches the square the model expects. Fitting the
// drawing's own bounding box (rather than the canvas bounds) into the square
// both normalises that and centres the sketch — a small drawing in one corner
// arrives as a large centred one, which is a far better reference to trace.
function boundsOf(strokes: Stroke[]) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const stroke of strokes) {
    for (const point of stroke.paths) {
      if (point.x < minX) minX = point.x;
      if (point.y < minY) minY = point.y;
      if (point.x > maxX) maxX = point.x;
      if (point.y > maxY) maxY = point.y;
    }
  }
  return { minX, minY, maxX, maxY };
}

// Uniform scale (never stretched) that fits the bounding box into the padded
// square, capped at 4x so a tiny scribble is enlarged without turning its
// stroke width into a shapeless blob.
const MAX_UPSCALE = 4;

export function fitTransform(strokes: Stroke[], size = OUTPUT_SIZE, padding = OUTPUT_PADDING) {
  const { minX, minY, maxX, maxY } = boundsOf(strokes);
  const available = size * (1 - 2 * padding);
  const width = maxX - minX;
  const height = maxY - minY;
  // A single dot or a perfectly straight line has zero extent on one axis;
  // fall back to scale 1 rather than dividing by zero.
  const extent = Math.max(width, height);
  const scale = extent > 0 ? Math.min(available / extent, MAX_UPSCALE) : 1;
  return {
    scale,
    offsetX: size / 2 - (minX + width / 2) * scale,
    offsetY: size / 2 - (minY + height / 2) * scale,
  };
}

// Renders refined strokes to a square PNG File, white tubing on black, ready to
// hand to the image model in place of the raw jittery canvas bitmap.
export async function renderStrokesToFile(rawStrokes: Stroke[], filename = "drawing.png"): Promise<File> {
  const strokes = refineStrokes(rawStrokes);
  if (!strokes.length) throw new Error("Draw something on the canvas first.");

  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

  const { scale, offsetX, offsetY } = fitTransform(strokes);
  ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);
  // Round joins and caps are what make the polyline read as bent tubing rather
  // than as a chain of straight segments with mitred corners.
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (const stroke of strokes) {
    if (!stroke.paths.length) continue;
    // Eraser strokes are replayed as destination-out so they cut the strokes
    // beneath them exactly as they did on screen.
    ctx.globalCompositeOperation = stroke.drawMode ? "source-over" : "destination-out";
    ctx.strokeStyle = "#ffffff";
    // Divide by scale so the on-screen stroke weight is preserved rather than
    // being multiplied along with the geometry.
    ctx.lineWidth = stroke.strokeWidth / scale;
    if (stroke.paths.length === 1) {
      // A lone point is a dot: stroking a zero-length path draws nothing, so
      // fill a circle of the same diameter instead.
      const [point] = stroke.paths;
      ctx.beginPath();
      ctx.arc(point.x, point.y, stroke.strokeWidth / scale / 2, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      continue;
    }
    ctx.stroke(strokeToPath2D(stroke.paths));
  }
  ctx.globalCompositeOperation = "source-over";

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(new File([blob!], filename, { type: "image/png" }));
    }, "image/png");
  });
}
