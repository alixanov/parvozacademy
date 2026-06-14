import { store } from '../app/store.js';

/**
 * Opens a private T3 Storage file in a new browser tab via a presigned URL.
 * Waits for auth to initialize before requesting presign (important on mobile).
 */
export async function openPrivateFile(fileUrl) {
  if (!fileUrl) return;

  // Wait until auth finishes initializing (mobile: refresh cookie fetch is async)
  for (let i = 0; i < 20; i++) {
    const auth = store.getState().auth;
    if (!auth.initializing) break;
    await new Promise((r) => setTimeout(r, 300));
  }

  const token = store.getState().auth?.accessToken;
  if (!token) {
    // Not authenticated — try direct URL as fallback
    window.open(fileUrl, '_blank', 'noopener,noreferrer');
    return;
  }

  try {
    const res = await fetch(
      `/api/v1/uploads/presign?key=${encodeURIComponent(fileUrl)}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (res.ok) {
      const json = await res.json();
      const presigned = json?.data?.url;
      if (presigned) {
        window.open(presigned, '_blank', 'noopener,noreferrer');
        return;
      }
    }
  } catch { /* fall through */ }

  window.open(fileUrl, '_blank', 'noopener,noreferrer');
}
