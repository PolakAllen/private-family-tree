import type { Timestamp } from "firebase/firestore";

// Adjust these two if `Timestamp` is not epoch-millis.
export const nowTs = (): Timestamp => Date.now() as unknown as Timestamp;

export const formatTimestamp = (ts: Timestamp): string =>
  new Date(ts as unknown as number | string).toLocaleString();