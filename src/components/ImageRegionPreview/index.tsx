import { useEffect, useMemo, useRef, useState } from "react";

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

/** Accepts raw base64 or a full data URL; returns a data URL. */
export function toDataUrl(base64: string, mime = "image/png"): string {
  return base64.startsWith("data:") ? base64 : `data:${mime};base64,${base64}`;
}

/**
 * Turn a sorted list of horizontal edges (y positions, including 0 and the
 * image height) into one Rect per row. Editing an edge only changes the two
 * rows that touch it.
 */
export function rowsFromEdges(edges: number[], imageWidth: number): Rect[] {
  const rows: Rect[] = [];
  for (let i = 0; i < edges.length - 1; i++) {
    rows.push({
      x: 0,
      y: edges[i],
      width: imageWidth,
      height: edges[i + 1] - edges[i],
    });
  }
  return rows;
}

/* ------------------------------------------------------------------ */
/* Decode the image once, share it across every preview                */
/* ------------------------------------------------------------------ */

export function useDecodedImage(src: string | null): HTMLImageElement | null {
  const [img, setImg] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!src) {
      setImg(null);
      return;
    }
    let cancelled = false;
    const el = new Image();
    el.onload = () => {
      if (!cancelled) setImg(el);
    };
    el.onerror = () => {
      if (!cancelled) setImg(null);
    };
    el.src = src;
    return () => {
      cancelled = true;
    };
  }, [src]);

  return img;
}

/* ------------------------------------------------------------------ */
/* CropCanvas: draws one region of the source image at a given zoom    */
/* ------------------------------------------------------------------ */

interface CropCanvasProps {
  image: HTMLImageElement;
  /** Region in source-image pixels. */
  region: Rect;
  /** 1 = native size, 0.5 = half size, etc. */
  zoom?: number;
  /**
   * Extra source pixels to show around the region (clamped to the image).
   * When > 0 the true region is outlined, which helps while dragging edges.
   */
  margin?: number;
}

export function CropCanvas({ image, region, zoom = 1, margin = 0 }: CropCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const iw = image.naturalWidth;
    const ih = image.naturalHeight;

    // Whole-pixel source rect, clamped to the image so drawImage never
    // samples outside it (which would produce blurry or transparent edges).
    const x0 = clamp(Math.round(region.x - margin), 0, iw);
    const y0 = clamp(Math.round(region.y - margin), 0, ih);
    const x1 = clamp(Math.round(region.x + region.width + margin), 0, iw);
    const y1 = clamp(Math.round(region.y + region.height + margin), 0, ih);
    const sw = x1 - x0;
    const sh = y1 - y0;

    const ctx = canvas.getContext("2d");
    if (!ctx || sw <= 0 || sh <= 0) {
      canvas.width = canvas.height = 0;
      return;
    }

    // Back the canvas with device pixels so it stays sharp on HiDPI screens.
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(sw * zoom * dpr));
    canvas.height = Math.max(1, Math.round(sh * zoom * dpr));
    canvas.style.width = `${sw * zoom}px`;
    canvas.style.height = `${sh * zoom}px`;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(image, x0, y0, sw, sh, 0, 0, canvas.width, canvas.height);

    if (margin > 0) {
      const scale = zoom * dpr;
      ctx.strokeStyle = "rgba(220, 38, 38, 0.9)";
      ctx.lineWidth = Math.max(1, dpr);
      ctx.strokeRect(
        (region.x - x0) * scale,
        (region.y - y0) * scale,
        region.width * scale,
        region.height * scale
      );
    }
  }, [image, region.x, region.y, region.width, region.height, zoom, margin]);

  return <canvas ref={ref} style={{ display: "block", maxWidth: "none" }} />;
}

/* ------------------------------------------------------------------ */
/* Example: split into rows, edit edges, zoom out                      */
/* ------------------------------------------------------------------ */

interface RowEditorProps {
  /** Raw base64 or a data URL. */
  base64: string;
  mime?: string;
  /** Initial interior edges (y positions). Defaults to 4 equal rows. */
  initialEdges?: number[];
}

export default function RowEditor({ base64, mime = "image/png", initialEdges }: RowEditorProps) {
  const src = useMemo(() => toDataUrl(base64, mime), [base64, mime]);
  const image = useDecodedImage(src);

  const [zoom, setZoom] = useState(1);
  const [margin, setMargin] = useState(0);
  const [interior, setInterior] = useState<number[] | null>(initialEdges ?? null);

  if (!image) return <p>Loading image…</p>;

  const w = image.naturalWidth;
  const h = image.naturalHeight;

  // Fall back to 3 interior edges (4 rows) once we know the image height.
  const interiorEdges =
    interior ?? [Math.round(h / 4), Math.round(h / 2), Math.round((3 * h) / 4)];
  const edges = [0, ...interiorEdges, h];
  const rows = rowsFromEdges(edges, w);

  const setEdge = (i: number, value: number) => {
    // Keep edges ordered: an edge can't cross its neighbours.
    const lo = (edges[i] ?? 0) + 1; // edges[i] is the previous edge in the full list
    const hi = (edges[i + 2] ?? h) - 1;
    const next = [...interiorEdges];
    next[i] = clamp(Math.round(value), lo, hi);
    setInterior(next);
  };

  return (
    <div style={{ fontFamily: "system-ui, sans-serif" }}>
      <div style={{ display: "flex", gap: 24, marginBottom: 16, flexWrap: "wrap" }}>
        <label>
          Zoom {Math.round(zoom * 100)}%
          <br />
          <input
            type="range"
            min={0.1}
            max={2}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
          />
        </label>
        <label>
          Context margin {margin}px
          <br />
          <input
            type="range"
            min={0}
            max={60}
            step={2}
            value={margin}
            onChange={(e) => setMargin(Number(e.target.value))}
          />
        </label>
      </div>

      {rows.map((row, i) => (
        <div key={i} style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, marginBottom: 4, display: "flex", gap: 12, alignItems: "center" }}>
            <span>
              Row {i + 1}: y {row.y}–{row.y + row.height} ({row.height}px)
            </span>
            {i < rows.length - 1 && (
              <label>
                bottom edge{" "}
                <input
                  type="number"
                  value={edges[i + 1]}
                  onChange={(e) => setEdge(i, Number(e.target.value))}
                  style={{ width: 70 }}
                />
              </label>
            )}
          </div>
          <div style={{ overflowX: "auto", border: "1px solid #ccc" }}>
            <CropCanvas image={image} region={row} zoom={zoom} margin={margin} />
          </div>
        </div>
      ))}
    </div>
  );
}