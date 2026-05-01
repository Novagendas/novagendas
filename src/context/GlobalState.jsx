import React from 'react';
import { GlobalContext } from './GlobalContext';

/**
 * GlobalProvider
 * Note: Components have been migrated to fetch and manage data directly from Supabase.
 * This context is kept for future shared global state if needed.
 */
export const GlobalProvider = ({ children }) => {
  return (
    <GlobalContext.Provider value={{}}>
      {children}
    </GlobalContext.Provider>
  );
};
