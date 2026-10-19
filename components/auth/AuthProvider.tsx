'use client';

import { createContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AuthService, AuthStatus, AuthUser } from '../../services/authService';
import { authService as clientService } from '../../services/authClient';

export type AuthContextValue = {
  status: AuthStatus;
  user: AuthUser | null;
  service: AuthService;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
  service?: AuthService;
};

export function AuthProvider({ children, service = clientService }: AuthProviderProps) {
  const [state, setState] = useState<{ status: AuthStatus; user: AuthUser | null }>({
    status: 'loading',
    user: null,
  });

  useEffect(() => {
    return service.onUserChange((user) =>
      setState({ status: user ? 'authenticated' : 'unauthenticated', user }),
    );
  }, [service]);

  const value = useMemo(() => ({ ...state, service }), [state, service]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
