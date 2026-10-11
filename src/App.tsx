import { staticColumns, staticFirstPageIdx, staticPageCount } from './data/staticData';
import PageEditor from './components/PageEditor';
import { useSession } from './data/useSession';
import LoginPage from './components/LoginPage';
import type { ReactElement } from 'react';

export default function App() {
  const session = useSession();
  let page : ReactElement;
  // Restoring a previous session after reload: show a neutral splash.
  if (session.status === "loading") {
    page = <p>Loading...</p>;
  } else if (session.status === "signedOut") {
    page = (
      <LoginPage
        login={session.login}
        busy={session.busy}
        error={session.error}
      />
    );
  } else {
    const { email, pageApi } = session;
    page = <PageEditor 
      api={pageApi} 
      columnDefs={staticColumns} 
      pageCount={staticPageCount} 
      startingIdx={staticFirstPageIdx} 
      userId={email}
      edgeDragPreviewHeight={40} 
    />
  }
 
  // Narrowed: user, email and pageApi are all non-null from here on.

  return (
    <main style={{ width: '100vw', height: '100dvh' }}>{page}</main>
  );
}
