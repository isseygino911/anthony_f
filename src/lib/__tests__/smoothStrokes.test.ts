import { describe, it, expect } from "vitest";
import {
  resample,
  simplify,
  smooth,
  refineStrokePoints,
  refineStrokes,
  fitTransform,
  type Stroke,
  type StrokePoint,
} from "../smoothStrokes";

function line(count: number, step = 10): StrokePoint[] {
  return Array.from({ length: count }, (_, i) => ({ x: i * step, y: 0 }));
}

// A straight run with alternating +/-1px error on each sample, which is what
// hand tremor and integer pixel snapping actually look like in the recording.
function jitteredLine(count: number, step = 10, amplitude = 1): StrokePoint[] {
  return Array.from({ length: count }, (_, i) => ({
    x: i * step,
    y: i % 2 === 0 ? amplitude : -amplitude,
  }));
}

// Endpoints are pinned by design, so tremor reduction is only observable on
// the interior points — measuring the endpoints would just report the input.
function maxInteriorDeviation(points: StrokePoint[]): number {
  const interior = points.slice(1, -1);
  return interior.length ? Math.max(...interior.map((p) => Math.abs(p.y))) : 0;
}

function stroke(paths: StrokePoint[], overrides: Partial<Stroke> = {}): Stroke {
  return { paths, strokeWidth: 6, strokeColor: "#000000", drawMode: true, ...overrides };
}

describe("resample", () => {
  it("drops the near-duplicate cluster a paused pointer emits", () => {
    const paused = [
      { x: 0, y: 0 },
      { x: 0.4, y: 0 },
      { x: 0.8, y: 0 },
      { x: 1.1, y: 0 },
      { x: 50, y: 0 },
    ];
    expect(resample(paused)).toEqual([
      { x: 0, y: 0 },
      { x: 50, y: 0 },
    ]);
  });

  it("keeps the true endpoint so a slow finish is not clipped short", () => {
    const points = [...line(5, 20), { x: 80.5, y: 0 }];
    const result = resample(points);
    expect(result[result.length - 1]).toEqual({ x: 80.5, y: 0 });
  });

  it("passes through strokes of two points or fewer", () => {
    expect(resample([{ x: 1, y: 1 }])).toEqual([{ x: 1, y: 1 }]);
  });
});

describe("simplify", () => {
  it("reduces a straight run to its endpoints", () => {
    expect(simplify(line(10))).toEqual([
      { x: 0, y: 0 },
      { x: 90, y: 0 },
    ]);
  });

  it("keeps a deliberate corner", () => {
    const corner: StrokePoint[] = [
      { x: 0, y: 0 },
      { x: 50, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 50 },
      { x: 100, y: 100 },
    ];
    expect(simplify(corner)).toContainEqual({ x: 100, y: 0 });
  });

  it("handles a long stroke without blowing the stack", () => {
    const long = Array.from({ length: 20000 }, (_, i) => ({ x: i, y: Math.sin(i / 50) * 40 }));
    expect(() => simplify(long)).not.toThrow();
    expect(simplify(long).length).toBeLessThan(long.length);
  });
});

describe("smooth", () => {
  it("reduces tremor amplitude on a jittered line", () => {
    const jittered = jitteredLine(20);
    const before = maxInteriorDeviation(jittered);
    const after = maxInteriorDeviation(smooth(jittered));
    expect(after).toBeLessThan(before / 2);
  });

  it("pins both endpoints so the stroke does not drift", () => {
    const points = jitteredLine(20);
    const result = smooth(points);
    expect(result[0]).toEqual(points[0]);
    expect(result[result.length - 1]).toEqual(points[points.length - 1]);
  });

  it("preserves the point count", () => {
    expect(smooth(jitteredLine(20))).toHaveLength(20);
  });
});

describe("refineStrokePoints", () => {
  it("collapses a jittered straight line to a clean straight run", () => {
    const refined = refineStrokePoints(jitteredLine(40, 5));
    // RDP recognises the tremor as noise around one straight line and keeps
    // only the endpoints; nothing between them wanders off the axis.
    expect(refined.length).toBeLessThan(5);
    expect(maxInteriorDeviation(refined)).toBeLessThan(1);
  });

  it("leaves very short strokes untouched", () => {
    const tick = [
      { x: 0, y: 0 },
      { x: 3, y: 4 },
    ];
    expect(refineStrokePoints(tick)).toEqual(tick);
  });

  it("keeps the overall shape of a deliberate curve", () => {
    const arc = Array.from({ length: 60 }, (_, i) => {
      const t = (i / 59) * Math.PI;
      return { x: Math.cos(t) * 100, y: Math.sin(t) * 100 };
    });
    const refined = refineStrokePoints(arc);
    // Still an arc that rises to roughly its original apex, not collapsed flat.
    expect(Math.max(...refined.map((p) => p.y))).toBeGreaterThan(80);
    expect(refined.length).toBeLessThan(arc.length);
  });

  it("survives malformed input", () => {
    expect(refineStrokePoints(undefined as unknown as StrokePoint[])).toEqual([]);
  });
});

describe("refineStrokes", () => {
  it("preserves stroke order, width and eraser mode", () => {
    const input = [
      stroke(jitteredLine(20)),
      stroke(jitteredLine(20), { drawMode: false, strokeWidth: 20 }),
    ];
    const result = refineStrokes(input);
    expect(result).toHaveLength(2);
    expect(result[1].drawMode).toBe(false);
    expect(result[1].strokeWidth).toBe(20);
  });

  it("drops empty strokes and tolerates junk", () => {
    expect(refineStrokes([stroke([])])).toHaveLength(0);
    expect(refineStrokes(undefined as unknown as Stroke[])).toEqual([]);
  });
});

describe("fitTransform", () => {
  it("centres the drawing's bounding box in the square", () => {
    const strokes = [
      stroke([
        { x: 0, y: 0 },
        { x: 100, y: 100 },
      ]),
    ];
    const { scale, offsetX, offsetY } = fitTransform(strokes);
    // Box centre (50,50) must land on the canvas centre (512,512).
    expect(50 * scale + offsetX).toBeCloseTo(512);
    expect(50 * scale + offsetY).toBeCloseTo(512);
  });

  it("scales a large drawing down to fit inside the padding", () => {
    const strokes = [
      stroke([
        { x: 0, y: 0 },
        { x: 4000, y: 4000 },
      ]),
    ];
    const { scale, offsetX } = fitTransform(strokes);
    expect(0 * scale + offsetX).toBeGreaterThanOrEqual(102);
    expect(4000 * scale + offsetX).toBeLessThanOrEqual(922);
  });

  it("caps enlargement of a tiny scribble", () => {
    const strokes = [
      stroke([
        { x: 0, y: 0 },
        { x: 2, y: 2 },
      ]),
    ];
    expect(fitTransform(strokes).scale).toBeLessThanOrEqual(4);
  });

  it("does not divide by zero on a single dot", () => {
    const { scale } = fitTransform([stroke([{ x: 5, y: 5 }])]);
    expect(Number.isFinite(scale)).toBe(true);
    expect(scale).toBe(1);
  });
});
