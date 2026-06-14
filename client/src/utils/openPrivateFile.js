import { store } from '../app/store.js';

/**
 * Opens a private T3 Storage file via presigned URL.
 *
 * Safari fix: window.open() MUST be called synchronously during a user gesture.
 * Any await before window.open() causes Safari to block the popup.
 * Solution: open about:blank immediately, then set location after presign.
 */
export async function openPrivateFile(fileUrl) {
  if (!fileUrl) return;

  // Open blank window immediately (synchronous — Safari allows this)
  const win = window.open('about:blank', '_blank');

  try {
    // Wait for auth to finish initializing (max 6s)
    for (let i = 0; i < 20; i++) {
      const auth = store.getState().auth;
      if (!auth.initializing) break;
      await new Promise((r) => setTimeout(r, 300));
    }

    const token = store.getState().auth?.accessToken;

    if (token) {
      const res = await fetch(
        `/api/v1/uploads/presign?key=${encodeURIComponent(fileUrl)}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (res.ok) {
        const json = await res.json();
        const presigned = json?.data?.url;
        if (presigned && win) {
          win.location.href = presigned;
          return;
        }
      }
    }
  } catch { /* fall through */ }

  // Fallback: navigate to raw URL (will show AccessDenied for private files,
  // but at least the window is already open so Safari won't block it)
  if (win) win.location.href = fileUrl;
}
