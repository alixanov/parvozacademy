import { store } from '../app/store.js';

/**
 * Downloads a private T3 Storage file.
 *
 * Uses window.location.assign(presignedUrl) — no popup window, no Safari popup
 * blocker issues. The presigned URL is generated with Content-Disposition:attachment
 * so the browser downloads the file and stays on the current page.
 */
export async function openPrivateFile(fileUrl) {
  if (!fileUrl) return;

  // Wait for auth to finish initializing (max 1s — token should be in localStorage)
  for (let i = 0; i < 10; i++) {
    if (!store.getState().auth.initializing) break;
    await new Promise((r) => setTimeout(r, 100));
  }

  const token = store.getState().auth?.accessToken;

  if (token) {
    try {
      const res = await fetch(
        `/api/v1/uploads/presign?key=${encodeURIComponent(fileUrl)}&dl=1`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (res.ok) {
        const json = await res.json();
        const url = json?.data?.url;
        if (url) {
          // Same-window navigation — browser downloads file, stays on page
          window.location.assign(url);
          return;
        }
      }
    } catch { /* fall through to fallback */ }
  }

  // Fallback: open raw URL in new tab
  window.open(fileUrl, '_blank', 'noopener,noreferrer');
}
