import { useCallback, useMemo } from 'react';
import useCachedResource from './useCachedResource.js';
import { fetchFreelancerLearningHub } from '../services/learningHub.js';

export function useLearningHub({ freelancerId = 2, includeEmpty = false, enabled = true } = {}) {
  const cacheKey = useMemo(
    () => `learning-hub:${freelancerId}:${includeEmpty ? 'all' : 'activity'}`,
    [freelancerId, includeEmpty],
  );

  const fetcher = useCallback(
    ({ signal } = {}) => fetchFreelancerLearningHub({ freelancerId, includeEmpty, signal }),
    [freelancerId, includeEmpty],
  );

  const state = useCachedResource(cacheKey, fetcher, {
    enabled,
    dependencies: [freelancerId, includeEmpty],
    ttl: 1000 * 45,
  });

  const summaryCards = useMemo(() => {
    if (!state.data?.summary) {
      return [];
    }
    const { summary } = state.data;
    return [
      {
        label: 'Active courses',
        value: summary.inProgressCourses,
        helper: `${summary.totalCourses} total`,
      },
      {
        label: 'Completion rate',
        value: summary.completionRate != null ? `${summary.completionRate}%` : '—',
        helper: `${summary.completedCourses} completed`,
      },
      {
        label: 'Mentoring sessions',
        value: summary.mentoringSessionsScheduled,
        helper: 'scheduled',
      },
      {
        label: 'Upcoming renewals',
        value: summary.upcomingRenewals,
        helper: summary.nextRenewal?.name ? `Next: ${summary.nextRenewal.name}` : '—',
      },
    ];
  }, [state.data]);

  const upcomingRenewalCopy = useMemo(() => {
    const renewal = state.data?.summary?.nextRenewal;
    if (!renewal) {
      return null;
    }
    const expiresOn = renewal.expirationDate ? new Date(renewal.expirationDate) : null;
    const daysRemaining = renewal.daysUntilExpiration ?? null;
    const formattedDate = expiresOn ? expiresOn.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : null;
    return {
      name: renewal.name,
      organization: renewal.issuingOrganization,
      formattedDate,
      daysRemaining,
    };
  }, [state.data]);

  return {
    ...state,
    summaryCards,
    upcomingRenewalCopy,
    serviceLines: state.data?.serviceLines ?? [],
    summary: state.data?.summary ?? null,
    certifications: state.data?.certifications ?? [],
    recommendations: state.data?.recommendations ?? [],
  };
}

export default useLearningHub;
