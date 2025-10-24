export function trackDashboardEvent(eventName, payload = {}) {
  if (!eventName) {
    return;
  }

  const normalizedEvent = {
    event: eventName,
    timestamp: Date.now(),
    payload,
  };

  try {
    if (typeof window !== 'undefined') {
      const globalLayer = window.dataLayer || window.GigvoraDataLayer;
      if (Array.isArray(globalLayer)) {
        globalLayer.push(normalizedEvent);
      } else if (Array.isArray(window.dataLayer)) {
        window.dataLayer.push(normalizedEvent);
      }
    }
  } catch (error) {
    // Non-blocking analytics failure.
  }

  if (process.env.NODE_ENV !== 'production') {
    // Provide lightweight visibility during development without spamming logs in production.
    console.info('[dashboard-analytics]', normalizedEvent);
  }
}

export default {
  trackDashboardEvent,
};
