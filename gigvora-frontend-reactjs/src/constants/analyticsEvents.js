export const ANALYTICS_EVENTS = Object.freeze({
  ACCOUNT_REGISTRATION_COMPLETED: {
    name: 'web_account_registration_completed',
    description:
      'Triggered when a user successfully creates an account through the standard email registration flow.',
  },
  ACCOUNT_REGISTRATION_SOCIAL_COMPLETED: {
    name: 'web_account_registration_social_completed',
    description: 'Triggered when a user successfully registers or signs in via an external identity provider.',
  },
  JOURNEY_CHECKPOINT_COMPLETED: {
    name: 'web_journey_checkpoint_completed',
    description: 'Broadcast whenever a shared journey checkpoint is completed for any persona.',
  },
  CREATION_STUDIO_QUICK_LAUNCH: {
    name: 'web_creation_studio_quick_launch',
    description: 'Captures quick launch workspace creations initiated from the creation studio wizard.',
  },
  PROJECT_AUTO_MATCH_REGENERATED: {
    name: 'web_project_auto_match_regenerated',
    description: 'Captured when a company or agency regenerates the auto-match queue.',
  },
  ROUTE_RENDER_FAILURE: {
    name: 'web_route_render_failure',
    description: 'Emitted when a route-level error boundary catches a rendering failure.',
  },
  ROUTE_NOT_FOUND_VISITED: {
    name: 'web_route_not_found',
    description: 'Logged when a visitor lands on a route that is not defined.',
  },
});

export function resolveAnalyticsEvent(key) {
  const descriptor = ANALYTICS_EVENTS[key];
  if (!descriptor) {
    throw new Error(`Unknown analytics event key: ${key}`);
  }
  return descriptor.name;
}

export default ANALYTICS_EVENTS;
