import { createContext, useContext } from 'react';
import useInboxController from './useInboxController.js';

const InboxContext = createContext(null);

export function InboxProvider({ children }) {
  const controller = useInboxController();
  return <InboxContext.Provider value={controller}>{children}</InboxContext.Provider>;
}

export function useInbox() {
  const context = useContext(InboxContext);
  if (!context) {
    throw new Error('useInbox must be used within an InboxProvider.');
  }
  return context;
}
