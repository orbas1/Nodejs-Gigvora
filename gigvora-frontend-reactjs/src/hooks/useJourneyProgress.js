import { useContext } from 'react';
import { JourneyProgressContext } from '../context/JourneyProgressContext.jsx';

export default function useJourneyProgress() {
  const context = useContext(JourneyProgressContext);
  if (!context) {
    throw new Error('useJourneyProgress must be used within a JourneyProgressProvider.');
  }
  return context;
}
