import { createContext, useContext } from 'react';

export const MentoringContext = createContext(null);

export function MentoringDataProvider({ children }) {
  return children;
}

export function useMentoringData() {
  return useContext(MentoringContext) || {};
}

export default MentoringContext;
