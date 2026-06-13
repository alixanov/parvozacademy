import { store } from '../app/store.js';

/**
 * Opens a private T3 Storage file in a new browser tab via a presigned URL.
 * Reads the JWT token directly from the Redux store so it's always current.
 *
 * @param {string} fileUrl - The T3 file URL stored in MongoDB
 */
export async function openPrivateFile(fileUrl) {
  if (!fileUrl) return;

  const token = store.getState().auth?.accessToken;

  try {
    const res = await fetch(
      `/api/v1/uploads/presign?key=${encodeURIComponent(fileUrl)}`,
      { headers: token ? { Authorization: `Bearer ${token}` } : {} },
    );
    if (res.ok) {
      const json = await res.json();
      const presigned = json?.data?.url;
      if (presigned) {
        window.open(presigned, '_blank', 'noopener,noreferrer');
        return;
      }
    }
  } catch {
    // fallback to direct URL
  }
  window.open(fileUrl, '_blank', 'noopener,noreferrer');
}
