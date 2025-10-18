import {
  getApiRegistry,
  createApiProvider,
  updateApiProvider,
  createApiClient,
  updateApiClient,
  createApiClientKey,
  revokeApiClientKey,
  rotateWebhookSecret,
  getClientAuditEvents,
  listWalletAccounts,
  recordClientUsage,
} from '../services/apiManagementService.js';

export async function registry(req, res) {
  const snapshot = await getApiRegistry();
  res.json(snapshot);
}

export async function createProviderHandler(req, res) {
  const provider = await createApiProvider(req.body ?? {}, req.user?.id ?? null);
  res.status(201).json(provider);
}

export async function updateProviderHandler(req, res) {
  const provider = await updateApiProvider(req.params.providerId, req.body ?? {}, req.user?.id ?? null);
  res.json(provider);
}

export async function createClientHandler(req, res) {
  const result = await createApiClient(req.body ?? {}, req.user?.id ?? null);
  res.status(201).json(result);
}

export async function updateClientHandler(req, res) {
  const client = await updateApiClient(req.params.clientId, req.body ?? {}, req.user?.id ?? null);
  res.json(client);
}

export async function createClientKeyHandler(req, res) {
  const result = await createApiClientKey(req.params.clientId, req.body ?? {}, req.user?.id ?? null);
  res.status(201).json(result);
}

export async function revokeClientKeyHandler(req, res) {
  const key = await revokeApiClientKey(req.params.clientId, req.params.keyId, req.user?.id ?? null);
  res.json(key);
}

export async function rotateWebhookHandler(req, res) {
  const result = await rotateWebhookSecret(req.params.clientId, req.user?.id ?? null);
  res.json(result);
}

export async function listAuditEventsHandler(req, res) {
  const events = await getClientAuditEvents(req.params.clientId, req.query ?? {});
  res.json({ events });
}

export async function listWalletAccountsHandler(req, res) {
  const accounts = await listWalletAccounts(req.query ?? {});
  res.json({ accounts });
}

export async function recordUsageHandler(req, res) {
  const usage = await recordClientUsage(req.params.clientId, req.body ?? {}, req.user?.id ?? null);
  res.status(201).json(usage);
}

export default {
  registry,
  createProviderHandler,
  updateProviderHandler,
  createClientHandler,
  updateClientHandler,
  createClientKeyHandler,
  revokeClientKeyHandler,
  rotateWebhookHandler,
  listAuditEventsHandler,
  listWalletAccountsHandler,
  recordUsageHandler,
};
