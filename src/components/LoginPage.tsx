import type { CSSProperties } from "react";

export interface LoginPageProps {
  login: () => void | Promise<void>;
  /** Disables the button while a sign-in is in progress. */
  busy?: boolean;
  /** Message from a failed sign-in attempt. */
  error?: string | null;
  /** Optional app name shown as the heading. */
  title?: string;
}

/**
 * Purely presentational: it holds no auth state of its own. The layout decides
 * when to render it (e.g. `session.status === "signedOut"`).
 */
export default function LoginPage({
  login,
  busy = false,
  error = null,
  title = "Sign in",
}: LoginPageProps) {
  return (
    <main style={styles.screen}>
      <section style={styles.panel} aria-labelledby="login-title">
        <h1 id="login-title" style={styles.title}>
          {title}
        </h1>
        <p style={styles.hint}>Use your Google account to continue.</p>

        <button
          type="button"
          onClick={() => void login()}
          disabled={busy}
          style={{ ...styles.button, ...(busy ? styles.buttonBusy : null) }}
        >
          {busy ? "Waiting for Google..." : "Sign in with Google"}
        </button>

        {error && (
          <p role="alert" style={styles.error}>
            {error}
          </p>
        )}
      </section>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  screen: {
    minHeight: "100dvh",
    display: "grid",
    placeItems: "center",
    padding: "1.5rem",
    fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
    background: "#f6f7f9",
    color: "#1b1f24",
  },
  panel: {
    width: "100%",
    maxWidth: "22rem",
    padding: "2rem",
    background: "#fff",
    border: "1px solid #d8dce1",
    borderRadius: "8px",
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  title: { margin: 0, fontSize: "1.5rem", fontWeight: 650 },
  hint: { margin: 0, color: "#555d66", lineHeight: 1.5 },
  button: {
    marginTop: "0.5rem",
    padding: "0.7rem 1rem",
    font: "inherit",
    fontWeight: 600,
    color: "#fff",
    background: "#1b4fd8",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  buttonBusy: { opacity: 0.6, cursor: "progress" },
  error: { margin: 0, color: "#b3261e", lineHeight: 1.4 },
};