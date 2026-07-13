
  import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
  import "./index.css";

  // After each deployment, JS chunk filenames change (cache-busting hashes).
  // If a browser tab was left open from before a new deploy, lazy-loading a
  // chunk it doesn't have cached (e.g. clicking into LMS) can fail because
  // the old filename no longer exists on the server — the server returns
  // the SPA fallback (index.html) instead, which the browser rejects since
  // it isn't valid JS. The fix is simply to reload once to pick up the
  // latest index.html (with correct, current chunk filenames).
  const RELOAD_FLAG = 'toefl_chunk_reload_once';
  const isStaleChunkError = (message: string) =>
    /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed/i.test(message);

  window.addEventListener('vite:preloadError', () => {
    if (!sessionStorage.getItem(RELOAD_FLAG)) {
      sessionStorage.setItem(RELOAD_FLAG, '1');
      window.location.reload();
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    const message = String(event.reason?.message || event.reason || '');
    if (isStaleChunkError(message) && !sessionStorage.getItem(RELOAD_FLAG)) {
      sessionStorage.setItem(RELOAD_FLAG, '1');
      window.location.reload();
    }
  });

  window.addEventListener('error', (event) => {
    const message = String(event.message || '');
    if (isStaleChunkError(message) && !sessionStorage.getItem(RELOAD_FLAG)) {
      sessionStorage.setItem(RELOAD_FLAG, '1');
      window.location.reload();
    }
  });

  createRoot(document.getElementById("root")!).render(<App />);
  