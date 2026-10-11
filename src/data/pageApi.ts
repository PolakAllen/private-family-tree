import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  Timestamp,
  Bytes,
  type DocumentData,
  type Firestore,
} from "firebase/firestore";
import type { Page } from "./page";
import type { FetchPage, PageApi, TrySavePage } from "./VirtualPage/types";
import { staticApi } from "./staticData";

export const PAGES_COLLECTION = "scanPages";

/** Thrown by `fetch` when no document exists for the requested idx. */
export class PageNotFoundError extends Error {
  constructor(idx: number) {
    super(`Page ${idx} does not exist`);
    this.name = "PageNotFoundError";
  }
}

// ---------------------------------------------------------------------------
// Serialisation
//
// Firestore has two restrictions that matter for `Page`:
//   1. Arrays may not directly contain other arrays, so `cells: Cell[][]`
//      is stored as an array of `{ cols: Cell[] }` maps.
//   2. `undefined` is rejected anywhere in a document (unless the SDK is
//      initialised with `ignoreUndefinedProperties`), so it becomes `null`
//      inside arrays and is dropped from objects.
// ---------------------------------------------------------------------------

type StoredRow = { cols: unknown[] };

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return (
    v !== null &&
    typeof v === "object" &&
    Object.getPrototypeOf(v) === Object.prototype
  );
}

/** Recursively replace `undefined`. Leaves Timestamps / FieldValues untouched. */
function sanitize(value: unknown): unknown {
  if (value === undefined) return null;
  if (Array.isArray(value)) return Array.from(value, sanitize); // Array.from fills sparse holes
  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, sanitize(v)]),
    );
  }
  return value;
}

const WEBP_PREFIX = "data:image/webp;base64,";

export function imageStrToBytes(image: string): Bytes {
  if (!image.startsWith(WEBP_PREFIX)) {
    throw new Error(`Expected image string to start with "${WEBP_PREFIX}"`);
  }
  return Bytes.fromBase64String(image.slice(WEBP_PREFIX.length));
}

export function imageBytesToStr(raw: Bytes): string {
  return WEBP_PREFIX + raw.toBase64();
}
function encodePage(page: Page, email: string): DocumentData {
  const { cells, contributors, image, ...rest } = page;

  return sanitize({
    ...rest,
    cells: Array.from(cells ?? [], (row) => ({
      cols: Array.from(row ?? [], (c) => c ?? null),
    })),
    image: imageStrToBytes(image),
    // Record who saved last; existing contributors are preserved.
    contributors: { ...contributors, [email]: serverTimestamp() },
    // The server assigns the new version stamp (avoids client clock skew).
    updated: serverTimestamp(),
  }) as DocumentData;
}

function decodePage(id: string, data: DocumentData): Page {
  const updated = data.updated as Timestamp | null | undefined;
  if (!updated) throw new Error(`Page ${id} has no 'updated' timestamp`);
  return {
    ...data,
    idx: typeof data.idx === "number" ? data.idx : Number(id),
    image: imageBytesToStr(data['image']),
    updated,
    cells: ((data.cells ?? []) as StoredRow[]).map((r) => r.cols),
  } as Page;
}

// ---------------------------------------------------------------------------
// API factory
// ---------------------------------------------------------------------------

function pageRef(db: Firestore, idx: number) {
  if (!Number.isInteger(idx)) throw new Error(`Invalid page idx: ${idx}`);
  return doc(db, PAGES_COLLECTION, String(idx));
}

/**
 * Builds a PageApi bound to a Firestore instance and the signed-in user's
 * email (recorded in `contributors` on each accepted save).
 */
export function createPageApi(db: Firestore, email: string): PageApi {
  const fetch: FetchPage = async (idx) => {
    const snap = await getDoc(pageRef(db, idx));
    if (!snap.exists()) {
      console.log('using static API fallback')
      return await staticApi.fetch(idx)
    }
    return decodePage(snap.id, snap.data());
  };

  /**
   * Optimistic-lock save, atomic via a transaction:
   *  - doc missing                       -> create it, return true
   *  - doc exists, stored.updated equals last_seen -> overwrite, return true
   *  - doc exists, stored.updated differs          -> write nothing, return false
   *
   * The saved document gets a fresh server timestamp, so callers should
   * `fetch` again to obtain the new `updated` value after a successful save.
   * Genuine failures (permissions, network) reject rather than return false.
   */
  const try_save: TrySavePage = (last_seen, page) => {
    const ref = pageRef(db, page.idx);
    return runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (snap.exists()) {
        const stored = snap.data().updated as Timestamp | undefined;
        if (!stored || !stored.isEqual(last_seen)) return false;
      }
      tx.set(ref, encodePage(page, email));
      return true;
    });
  };

  return { fetch, try_save };
}