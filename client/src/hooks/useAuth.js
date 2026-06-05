import { useSelector } from 'react-redux';
import { selectUser, selectIsAuth, selectInitializing } from '../features/auth/authSlice.js';

export function useAuth() {
  return {
    user:          useSelector(selectUser),
    isAuthenticated: useSelector(selectIsAuth),
    initializing:  useSelector(selectInitializing),
  };
}
