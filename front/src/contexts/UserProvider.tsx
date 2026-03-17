import { useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { UserContext } from './UserContext';

export default function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ email: string; role: string } | null>(null);

  // TODO: PingOne — replace with real OAuth flow:
  //   1. Redirect to PingOne authorize endpoint
  //   2. Handle callback with authorization code
  //   3. Exchange code for tokens via backend
  //   4. Decode token to extract user info and role
  const login = useCallback(async (email: string, _password: string) => {
    void _password;
    // Placeholder: set a hardcoded user
    setUser({ email, role: 'admin' });
  }, []);

  // TODO: PingOne — revoke token and clear session
  const logout = useCallback(() => {
    setUser(null);
  }, []);

  return (
    <UserContext.Provider value={{ user, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}
