import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  clearAuth,
  getStoredUser,
  setAuthTokens,
  login as apiLogin,
  loginWithGoogle as apiLoginWithGoogle,
  register as apiRegister,
  AUTH_CLEARED_EVENT,
  type LoginBody,
  type RegisterBody,
  type UserProfile,
} from '../api/client';

type AuthState = {
  user: UserProfile | null;
  isAuthenticated: boolean;
};

type AuthContextValue = AuthState & {
  login: (body: LoginBody) => Promise<UserProfile>;
  loginWithGoogle: (idToken: string) => Promise<UserProfile>;
  register: (body: RegisterBody) => Promise<void>;
  logout: () => void;
  setUser: (user: UserProfile | null) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<UserProfile | null>(() => getStoredUser());

  useEffect(() => {
    const onAuthCleared = () => setUserState(null);
    window.addEventListener(AUTH_CLEARED_EVENT, onAuthCleared);
    return () => window.removeEventListener(AUTH_CLEARED_EVENT, onAuthCleared);
  }, []);

  const setUser = useCallback((u: UserProfile | null) => {
    setUserState(u);
    if (!u) clearAuth();
  }, []);

  const login = useCallback(async (body: LoginBody) => {
    const data = await apiLogin(body);
    setAuthTokens(data.access_token, data.refresh_token, data.user);
    setUserState(data.user);
    return data.user;
  }, []);

  const loginWithGoogle = useCallback(async (idToken: string) => {
    const data = await apiLoginWithGoogle(idToken);
    setAuthTokens(data.access_token, data.refresh_token, data.user);
    setUserState(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (body: RegisterBody) => {
    await apiRegister(body);
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setUserState(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      login,
      loginWithGoogle,
      register,
      logout,
      setUser,
    }),
    [user, login, loginWithGoogle, register, logout, setUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
