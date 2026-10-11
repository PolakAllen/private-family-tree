import { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import { auth, db, googleProvider } from "./firebase";

export default function Test() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track login state (also restores the session on page reload)
  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
    });
  }, []);

  // Once signed in, list the rows
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const snap = await getDocs(collection(db, "appData"));
        console.log(`Found ${snap.size} docs`);
        snap.forEach((d) => console.log(d.id, d.data()));
        setError(null);
      } catch (e) {
        console.error(e);
        setError((e as Error).message);
      }
    })();
  }, [user]);

  const login = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  if (!authReady) return <p>Loading…</p>;

  return (
    <div>
      {user ? (
        <>
          <p>Signed in as {user.email}</p>
          <button onClick={() => signOut(auth)}>Sign out</button>
        </>
      ) : (
        <button onClick={login}>Sign in with Google</button>
      )}
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      <p>Check the console for results.</p>
    </div>
  );
}