import { useContext } from 'react';
import { UserContext } from './UserContext';
import type { UserContextValue } from './UserContext';

export function useUser(): UserContextValue {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within a UserProvider');
  return context;
}
