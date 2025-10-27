export const MOBILE_APP_PLATFORMS = ['ios', 'android'];
export const MOBILE_APP_STATUSES = ['active', 'paused', 'retired'];
export const MOBILE_APP_RELEASE_CHANNELS = ['production', 'beta', 'internal'];
export const MOBILE_APP_COMPLIANCE_STATUSES = ['ok', 'review', 'blocked'];
export const MOBILE_APP_VERSION_STATUSES = ['draft', 'in_review', 'released', 'deprecated'];
export const MOBILE_APP_VERSION_TYPES = ['major', 'minor', 'patch', 'hotfix'];
export const MOBILE_APP_FEATURE_ROLLOUT_TYPES = ['global', 'percentage', 'cohort'];

export const MOBILE_APP_SUMMARY_KEYS = ['totalApps', 'pendingReviews', 'upcomingReleases', 'activeFeatures'];

export function createEmptyMobileAppSummary() {
  return MOBILE_APP_SUMMARY_KEYS.reduce(
    (accumulator, key) => ({ ...accumulator, [key]: 0 }),
    {},
  );
}

export default {
  MOBILE_APP_PLATFORMS,
  MOBILE_APP_STATUSES,
  MOBILE_APP_RELEASE_CHANNELS,
  MOBILE_APP_COMPLIANCE_STATUSES,
  MOBILE_APP_VERSION_STATUSES,
  MOBILE_APP_VERSION_TYPES,
  MOBILE_APP_FEATURE_ROLLOUT_TYPES,
  MOBILE_APP_SUMMARY_KEYS,
  createEmptyMobileAppSummary,
};
