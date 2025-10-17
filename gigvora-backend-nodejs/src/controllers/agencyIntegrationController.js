import {
  listIntegrations,
  createIntegration,
  updateIntegration,
  rotateSecret,
  createWebhook,
  updateWebhook,
  deleteWebhook,
  testIntegrationConnection,
} from '../services/agencyIntegrationService.js';
import { ValidationError } from '../utils/errors.js';

function parseInteger(value) {
  if (value == null || value === '') {
    return null;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function resolveActor(req) {
  const actorId = parseInteger(req.user?.id ?? req.user?.userId);
  const actorRole = req.user?.type ?? req.user?.role ?? null;
  return { actorId, actorRole };
}

export async function index(req, res) {
  const workspaceId = parseInteger(req.query?.workspaceId);
  const context = resolveActor(req);
  const result = await listIntegrations({ workspaceId }, context);
  res.json(result);
}

export async function create(req, res) {
  const payload = {
    workspaceId: parseInteger(req.body?.workspaceId ?? req.query?.workspaceId),
    providerKey: req.body?.providerKey,
    displayName: req.body?.displayName,
    status: req.body?.status,
    syncFrequency: req.body?.syncFrequency,
    metadata: req.body?.metadata,
  };
  const context = resolveActor(req);
  const integration = await createIntegration(payload, context);
  res.status(201).json(integration);
}

export async function update(req, res) {
  const integrationId = parseInteger(req.params?.integrationId ?? req.params?.id);
  if (!integrationId) {
    throw new ValidationError('integrationId is required.');
  }
  const payload = {
    displayName: req.body?.displayName,
    status: req.body?.status,
    syncFrequency: req.body?.syncFrequency,
    metadata: req.body?.metadata,
  };
  const context = resolveActor(req);
  const integration = await updateIntegration(integrationId, payload, context);
  res.json(integration);
}

export async function rotateCredential(req, res) {
  const integrationId = parseInteger(req.params?.integrationId ?? req.params?.id);
  if (!integrationId) {
    throw new ValidationError('integrationId is required.');
  }
  const payload = {
    secretId: parseInteger(req.body?.secretId),
    name: req.body?.name,
    secretType: req.body?.secretType,
    secretValue: req.body?.secretValue ?? req.body?.value,
  };
  const context = resolveActor(req);
  const result = await rotateSecret(integrationId, payload, context);
  res.status(payload.secretId ? 200 : 201).json(result);
}

export async function createWebhookEndpoint(req, res) {
  const integrationId = parseInteger(req.params?.integrationId ?? req.params?.id);
  if (!integrationId) {
    throw new ValidationError('integrationId is required.');
  }
  const payload = {
    name: req.body?.name,
    status: req.body?.status,
    targetUrl: req.body?.targetUrl,
    eventTypes: req.body?.eventTypes,
    verificationToken: req.body?.verificationToken,
    secretId: parseInteger(req.body?.secretId),
    secretValue: req.body?.secretValue,
    metadata: req.body?.metadata,
  };
  const context = resolveActor(req);
  const webhook = await createWebhook(integrationId, payload, context);
  res.status(201).json(webhook);
}

export async function updateWebhookEndpoint(req, res) {
  const integrationId = parseInteger(req.params?.integrationId ?? req.params?.id);
  const webhookId = parseInteger(req.params?.webhookId);
  if (!integrationId || !webhookId) {
    throw new ValidationError('integrationId and webhookId are required.');
  }
  const payload = {
    name: req.body?.name,
    status: req.body?.status,
    targetUrl: req.body?.targetUrl,
    eventTypes: req.body?.eventTypes,
    verificationToken: req.body?.verificationToken,
    metadata: req.body?.metadata,
    secretValue: req.body?.secretValue,
  };
  const context = resolveActor(req);
  const webhook = await updateWebhook(integrationId, webhookId, payload, context);
  res.json(webhook);
}

export async function deleteWebhookEndpoint(req, res) {
  const integrationId = parseInteger(req.params?.integrationId ?? req.params?.id);
  const webhookId = parseInteger(req.params?.webhookId);
  if (!integrationId || !webhookId) {
    throw new ValidationError('integrationId and webhookId are required.');
  }
  const context = resolveActor(req);
  const result = await deleteWebhook(integrationId, webhookId, context);
  res.status(result.deleted ? 200 : 404).json(result);
}

export async function testConnection(req, res) {
  const integrationId = parseInteger(req.params?.integrationId ?? req.params?.id);
  if (!integrationId) {
    throw new ValidationError('integrationId is required.');
  }
  const context = resolveActor(req);
  const result = await testIntegrationConnection(integrationId, context);
  res.json(result);
}

export default {
  index,
  create,
  update,
  rotateCredential,
  createWebhookEndpoint,
  updateWebhookEndpoint,
  deleteWebhookEndpoint,
  testConnection,
};
