// auth/context.ts
import {createContext} from 'react';

export interface AuthContextType {
  user: string | null;
  setUser: (user: string | null) => void;
  refreshAuth: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  refreshAuth: async () => {},
  isAuthenticated: false,
});

export default AuthContext;
