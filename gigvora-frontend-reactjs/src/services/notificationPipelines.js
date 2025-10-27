import apiClient from './apiClient.js';

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function normaliseTotals(totals = {}) {
  return {
    total: totals.total ?? 0,
    pending: totals.pending ?? 0,
    delivered: totals.delivered ?? 0,
    read: totals.read ?? 0,
    dismissed: totals.dismissed ?? 0,
    unread: totals.unread ?? 0,
    criticalOpen: totals.criticalOpen ?? 0,
  };
}

function normaliseChannels(channels = {}) {
  return {
    totalPreferences: channels.totalPreferences ?? 0,
    emailEnabled: channels.emailEnabled ?? 0,
    pushEnabled: channels.pushEnabled ?? 0,
    smsEnabled: channels.smsEnabled ?? 0,
    inAppEnabled: channels.inAppEnabled ?? 0,
    quietHoursConfigured: channels.quietHoursConfigured ?? 0,
    digest: channels.digest ?? {},
    lastUpdatedAt: channels.lastUpdatedAt ?? null,
  };
}

function normaliseSystemConfig(systemConfig = {}) {
  const providers = systemConfig.providers ?? {};
  return {
    providers: {
      email: providers.email ?? null,
      sms: providers.sms ?? null,
    },
    broadcastChannels: ensureArray(systemConfig.broadcastChannels),
    incidentWebhookUrl: systemConfig.incidentWebhookUrl ?? null,
  };
}

export const FALLBACK_NOTIFICATION_PIPELINE_SNAPSHOT = Object.freeze({
  generatedAt: new Date().toISOString(),
  totals: normaliseTotals(),
  averages: { deliverySeconds: null },
  channels: normaliseChannels(),
  recent: [],
  campaigns: [],
  systemConfig: normaliseSystemConfig(),
});

export function normaliseNotificationPipelineSnapshot(snapshot = {}) {
  return {
    generatedAt: snapshot.generatedAt ?? new Date().toISOString(),
    totals: normaliseTotals(snapshot.totals),
    averages: {
      deliverySeconds:
        typeof snapshot.averages?.deliverySeconds === 'number'
          ? snapshot.averages.deliverySeconds
          : snapshot.averages?.deliverySeconds ?? null,
    },
    channels: normaliseChannels(snapshot.channels),
    recent: ensureArray(snapshot.recent),
    campaigns: ensureArray(snapshot.campaigns),
    systemConfig: normaliseSystemConfig(snapshot.systemConfig),
  };
}

export async function fetchNotificationPipelineSnapshot(client = apiClient) {
  const response = await client.get('/admin/runtime/operations/notifications/pipeline');
  return normaliseNotificationPipelineSnapshot(response.data);
}

export async function queueOperationalNotificationCampaign(payload = {}, client = apiClient) {
  const response = await client.post('/admin/runtime/operations/notifications/campaigns', payload);
  return response.data;
}

export default fetchNotificationPipelineSnapshot;
