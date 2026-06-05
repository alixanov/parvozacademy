import { useEffect, useRef } from 'react';
import { useSelector }       from 'react-redux';
import { io }                from 'socket.io-client';
import { selectUser, selectIsAuth, selectAccessToken } from '../features/auth/authSlice.js';

let socketInstance = null;

export function useSocket() {
  const user            = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuth);
  const accessToken     = useSelector(selectAccessToken);
  const ref             = useRef(null);

  useEffect(() => {
    if (!isAuthenticated || !user || !accessToken) {
      if (socketInstance) {
        socketInstance.disconnect();
        socketInstance = null;
        ref.current = null;
      }
      return;
    }

    if (!socketInstance) {
      // VITE_SOCKET_URL is empty in production (same-origin) → io() auto-connects
      const socketUrl = import.meta.env.VITE_SOCKET_URL || undefined;
      socketInstance = io(socketUrl, {
        /* Send both userId + signed token — server can verify identity */
        auth: { userId: user._id, token: accessToken },
        withCredentials: true,
        transports: ['websocket'],
      });
    }
    ref.current = socketInstance;

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
        socketInstance = null;
        ref.current = null;
      }
    };
  }, [isAuthenticated, user?._id, accessToken]); // eslint-disable-line

  return ref.current;
}
