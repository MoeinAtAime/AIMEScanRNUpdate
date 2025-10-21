// hooks/useAuth.ts
import {useState, useEffect, useCallback} from 'react';
import {getCurrentUser, fetchAuthSession, AuthUser} from 'aws-amplify/auth';

interface UseAuthReturn {
  user: string | null;
  setUser: (user: string | null) => void;
  isInitializing: boolean;
  error: string | null;
  refreshAuth: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCurrentUserSafe =
    useCallback(async (): Promise<AuthUser | null> => {
      try {
        const currentUser = await getCurrentUser();
        setError(null);
        return currentUser;
      } catch (err: any) {
        if (err?.name !== 'NotAuthorizedException') {
          console.error('Error fetching user:', err);
          setError('Failed to fetch user');
        }
        return null;
      }
    }, []);

  const fetchCurrentSession = useCallback(async () => {
    try {
      const {tokens} = await fetchAuthSession();
      return tokens;
    } catch (err: any) {
      if (err?.name !== 'NotAuthorizedException') {
        console.error('Error fetching session:', err);
      }
      return null;
    }
  }, []);

  const initAuth = useCallback(async () => {
    try {
      setIsInitializing(true);
      const tokens = await fetchCurrentSession();
      if (tokens) {
        const currentUser = await fetchCurrentUserSafe();
        if (currentUser) {
          setUser(currentUser.username);
        }
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Auth init error:', err);
      setError('Authentication initialization failed');
    } finally {
      setIsInitializing(false);
    }
  }, [fetchCurrentSession, fetchCurrentUserSafe]);

  useEffect(() => {
    initAuth();
  }, []);

  const refreshAuth = useCallback(async () => {
    setError(null);
    await initAuth();
  }, [initAuth]);

  return {user, setUser, isInitializing, error, refreshAuth};
}
