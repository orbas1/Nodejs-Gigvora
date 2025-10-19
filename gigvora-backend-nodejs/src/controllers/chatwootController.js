import chatwootService from '../services/chatwootService.js';
import { AuthenticationError } from '../utils/errors.js';

export async function session(req, res) {
  const userId = req.user?.id;
  if (!userId) {
    throw new AuthenticationError('Authentication required.');
  }
  const settings = await chatwootService.getWidgetSettingsForUser(userId, {
    ipAddress: req.ip,
    sessionId: req.session?.id ?? null,
  });
  res.json(settings);
}

export async function webhook(req, res) {
  const signature =
    req.headers['x-chatwoot-signature'] ?? req.headers['X-Chatwoot-Signature'] ?? req.headers['chatwoot-signature'];
  const eventName =
    req.headers['x-chatwoot-event'] ??
    req.headers['X-Chatwoot-Event'] ??
    req.body?.event ??
    req.body?.event_name ??
    req.query?.event;
  const rawBody = typeof req.rawBody === 'string' ? req.rawBody : JSON.stringify(req.body ?? {});
  await chatwootService.processWebhookEvent({ signature, eventName, payload: req.body, rawBody });
  res.status(202).json({ status: 'accepted' });
}

export default {
  session,
  webhook,
};
