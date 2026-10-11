import { useCallback, useEffect, useMemo, useState } from "react";
import { FirebaseError } from "firebase/app";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { auth, db, googleProvider } from "./firebase";
import { createPageApi } from "./pageApi";
import type { PageApi } from "./VirtualPage/types"; // <- adjust to wherever PageApi lives

/**
 * The part of the session that depends on auth state. A discriminated union,
 * so `status === "signedIn"` narrows `user`, `email` and `pageApi` to non-null.
 */
type SessionState =
  | { status: "loading"; user: null; email: null; pageApi: null }
  | { status: "signedOut"; user: null; email: null; pageApi: null }
  | { status: "signedIn"; user: User; email: string; pageApi: PageApi };

export type Session = SessionState & {
  /** Last auth error, if any. Cleared automatically on the next login attempt. */
  error: string | null;
  /** True while the sign-in popup / sign-out is in flight. */
  busy: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
};

// Closing the popup is the user's choice, not an error worth showing.
const BENIGN_CODES = new Set([
  "auth/popup-closed-by-user",
  "auth/cancelled-popup-request",
]);

function toMessage(e: unknown): string | null {
  if (e instanceof FirebaseError && BENIGN_CODES.has(e.code)) return null;
  return e instanceof Error ? e.message : String(e);
}

export function useSession(): Session {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tracks login state; also restores the session on page reload.
  useEffect(
    () =>
      onAuthStateChanged(
        auth,
        (u) => {
          if (u && !u.email) {
            // We key contributors by email, so an email-less account can't be used.
            // Signing out triggers this callback again with u === null.
            setError("This account has no email address.");
            void signOut(auth);
            return;
          }
          setUser(u);
          setReady(true);
        },
        (e) => {
          setError(toMessage(e));
          setReady(true);
        },
      ),
    [],
  );

  const email = user?.email ?? null;

  // Stable for as long as the same account is signed in.
  const pageApi = useMemo(
    () => (email ? createPageApi(db, email) : null),
    [email],
  );

  const login = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      setError(toMessage(e));
    } finally {
      setBusy(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setBusy(true);
    try {
      await signOut(auth);
    } catch (e) {
      setError(toMessage(e));
    } finally {
      setBusy(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return useMemo<Session>(() => {
    const common = { error, busy, login, logout, clearError };
    if (!ready) {
      return { status: "loading", user: null, email: null, pageApi: null, ...common };
    }
    if (!user || !email || !pageApi) {
      return { status: "signedOut", user: null, email: null, pageApi: null, ...common };
    }
    return { status: "signedIn", user, email, pageApi, ...common };
  }, [ready, user, email, pageApi, error, busy, login, logout, clearError]);
}