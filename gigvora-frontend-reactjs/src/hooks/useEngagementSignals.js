import { useMemo } from 'react';
import {
  generateConnectionSuggestions,
  generateGroupSuggestions,
  generateLiveMoments,
  resolveUserInterests,
} from '../services/engagementService.js';

export default function useEngagementSignals({ session, feedPosts = [], limit = 6 } = {}) {
  return useMemo(() => {
    const interests = resolveUserInterests(session);
    const connectionSuggestions = generateConnectionSuggestions({ session, feedPosts, limit });
    const groupSuggestions = generateGroupSuggestions({ session, limit: Math.max(3, Math.floor(limit / 2)) });
    const liveMoments = generateLiveMoments({ session, feedPosts, limit: Math.max(4, Math.floor(limit * 0.75)) });

    return {
      interests,
      connectionSuggestions,
      groupSuggestions,
      liveMoments,
    };
  }, [session, feedPosts, limit]);
}
