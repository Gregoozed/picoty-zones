import { createContext } from 'react';

export interface User {
  email: string;
  role: string;
}

export interface UserContextValue {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const UserContext = createContext<UserContextValue | null>(null);
