import asyncHandler from '../utils/asyncHandler.js';
import trustService from '../services/trustService.js';
import { AuthorizationError, ValidationError } from '../utils/errors.js';
import { resolveRequestPermissions, resolveRequestUserId } from '../utils/requestContext.js';

const TRUST_VIEW_PERMISSIONS = new Set(['trust:view', 'escrow:view', 'disputes:view', 'operations:trust']);
const TRUST_MANAGE_PERMISSIONS = new Set(['trust:manage', 'escrow:manage', 'disputes:manage']);
const TRUST_VIEW_ROLES = new Set([
  'admin',
  'platform_admin',
  'operations',
  'operations_lead',
  'support',
  'success',
  'finance',
  'trust',
]);
const TRUST_MANAGE_ROLES = new Set(['admin', 'platform_admin', 'operations', 'operations_lead', 'finance', 'trust']);

function normalise(value) {
  if (!value) {
    return null;
  }
  return `${value}`.trim().toLowerCase();
}

function collectRoles(req) {
  const roles = new Set();
  const primary = normalise(req.user?.type ?? req.user?.role);
  if (primary) {
    roles.add(primary);
  }
  if (Array.isArray(req.user?.roles)) {
    req.user.roles.forEach((role) => {
      const normalised = normalise(role);
      if (normalised) {
        roles.add(normalised);
      }
    });
  }
  const headerRoles = req.headers?.['x-roles'];
  if (typeof headerRoles === 'string') {
    headerRoles
      .split(',')
      .map((entry) => normalise(entry))
      .filter(Boolean)
      .forEach((role) => roles.add(role));
  }
  return roles;
}

function collectPermissions(req) {
  return new Set(resolveRequestPermissions(req).map((permission) => normalise(permission)).filter(Boolean));
}

function hasAny(candidateSet, allowedSet) {
  for (const value of candidateSet) {
    if (allowedSet.has(value)) {
      return true;
    }
  }
  return false;
}

function ensureTrustAccess(req, { manage = false } = {}) {
  const actorId = resolveRequestUserId(req);
  if (!actorId) {
    throw new AuthorizationError('Authentication is required for trust operations.');
  }

  const roles = collectRoles(req);
  const permissions = collectPermissions(req);

  const hasView =
    hasAny(roles, TRUST_VIEW_ROLES) ||
    hasAny(permissions, TRUST_VIEW_PERMISSIONS) ||
    hasAny(roles, TRUST_MANAGE_ROLES);

  if (!hasView) {
    throw new AuthorizationError('Trust and escrow operations are restricted to finance and support teams.');
  }

  const canManage =
    hasAny(roles, TRUST_MANAGE_ROLES) ||
    hasAny(permissions, TRUST_MANAGE_PERMISSIONS);

  if (manage && !canManage) {
    throw new AuthorizationError('Trust management privileges are required for this action.');
  }

  return { actorId, canManage };
}

function parsePositiveInteger(value, label) {
  const numeric = Number.parseInt(value, 10);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new ValidationError(`${label} must be a positive integer.`);
  }
  return numeric;
}

function parseOptionalPositiveInteger(value) {
  if (value == null || value === '') {
    return undefined;
  }
  const numeric = Number.parseInt(value, 10);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new ValidationError('Identifier values must be positive integers.');
  }
  return numeric;
}

function ensurePayloadObject(body, label) {
  if (body == null) {
    return {};
  }
  if (typeof body !== 'object' || Array.isArray(body)) {
    throw new ValidationError(`${label} must be provided as an object.`);
  }
  return { ...body };
}

function parseBoolean(value, fallback = undefined) {
  if (value == null) {
    return fallback;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  const normalised = normalise(value);
  if (normalised == null) {
    return fallback;
  }
  if (['1', 'true', 'yes', 'y'].includes(normalised)) {
    return true;
  }
  if (['0', 'false', 'no', 'n'].includes(normalised)) {
    return false;
  }
  return fallback;
}

function normaliseDisputeFilters(query = {}) {
  const filters = { ...query };

  if (filters.limit != null && filters.pageSize == null) {
    filters.pageSize = filters.limit;
  }

  if (filters.offset != null && filters.page == null && filters.pageSize != null) {
    const pageSize = Number.parseInt(filters.pageSize, 10);
    const offset = Number.parseInt(filters.offset, 10);
    if (Number.isInteger(pageSize) && pageSize > 0 && Number.isInteger(offset)) {
      filters.page = Math.floor(offset / pageSize) + 1;
    }
  }

  if (filters.includeClosed != null && filters.openOnly == null) {
    const includeClosed = parseBoolean(filters.includeClosed);
    filters.openOnly = includeClosed === undefined ? filters.openOnly : !includeClosed;
  }
  delete filters.includeClosed;

  if (filters.openOnly != null) {
    const parsed = parseBoolean(filters.openOnly);
    if (parsed !== undefined) {
      filters.openOnly = parsed;
    }
  }

  return filters;
}

function withTrustAccess(handler, { manage = false } = {}) {
  return asyncHandler(async (req, res) => {
    const context = ensureTrustAccess(req, { manage });
    await handler(req, res, context);
  });
}

export const createEscrowAccount = withTrustAccess(async (req, res) => {
  const account = await trustService.ensureEscrowAccount(ensurePayloadObject(req.body, 'escrow account'));
  res.status(201).json({ account });
}, { manage: true });

export const updateEscrowAccount = withTrustAccess(async (req, res) => {
  const accountId = parsePositiveInteger(req.params.accountId, 'accountId');
  const account = await trustService.updateEscrowAccount(accountId, ensurePayloadObject(req.body, 'escrow account update'));
  res.json({ account });
}, { manage: true });

export const initiateEscrow = withTrustAccess(async (req, res) => {
  const transaction = await trustService.initiateEscrowTransaction(ensurePayloadObject(req.body, 'escrow transaction'));
  res.status(201).json({ transaction });
}, { manage: true });

export const updateEscrowTransaction = withTrustAccess(async (req, res) => {
  const transactionId = parsePositiveInteger(req.params.transactionId, 'transactionId');
  const transaction = await trustService.updateEscrowTransaction(
    transactionId,
    ensurePayloadObject(req.body, 'escrow transaction update'),
  );
  res.json({ transaction });
}, { manage: true });

export const releaseEscrow = withTrustAccess(async (req, res) => {
  const transactionId = parsePositiveInteger(req.params.transactionId, 'transactionId');
  const transaction = await trustService.releaseEscrowTransaction(
    transactionId,
    ensurePayloadObject(req.body, 'escrow release payload'),
  );
  res.json({ transaction });
}, { manage: true });

export const refundEscrow = withTrustAccess(async (req, res) => {
  const transactionId = parsePositiveInteger(req.params.transactionId, 'transactionId');
  const transaction = await trustService.refundEscrowTransaction(
    transactionId,
    ensurePayloadObject(req.body, 'escrow refund payload'),
  );
  res.json({ transaction });
}, { manage: true });

export const createDispute = withTrustAccess(async (req, res) => {
  const dispute = await trustService.createDisputeCase(ensurePayloadObject(req.body, 'dispute case'));
  res.status(201).json({ dispute });
}, { manage: true });

export const appendDisputeEvent = withTrustAccess(async (req, res) => {
  const disputeId = parsePositiveInteger(req.params.disputeId, 'disputeId');
  const result = await trustService.appendDisputeEvent(disputeId, ensurePayloadObject(req.body, 'dispute event'));
  res.status(201).json(result);
}, { manage: true });

export const listDisputes = withTrustAccess(async (req, res) => {
  const filters = normaliseDisputeFilters(req.query ?? {});
  const result = await trustService.listDisputeCases(filters);
  res.json(result);
});

export const getDispute = withTrustAccess(async (req, res) => {
  const disputeId = parsePositiveInteger(req.params.disputeId, 'disputeId');
  const dispute = await trustService.getDisputeCaseById(disputeId);
  res.json(dispute);
});

export const updateDispute = withTrustAccess(async (req, res) => {
  const disputeId = parsePositiveInteger(req.params.disputeId, 'disputeId');
  const dispute = await trustService.updateDisputeCase(disputeId, ensurePayloadObject(req.body, 'dispute update'));
  res.json(dispute);
}, { manage: true });

export const getTrustOverview = withTrustAccess(async (req, res) => {
  const overview = await trustService.getTrustOverview();
  res.json({ overview });
});

export const getDisputeSettings = withTrustAccess(async (req, res) => {
  const workspaceId = parseOptionalPositiveInteger(req.query?.workspaceId);
  const result = await trustService.getDisputeWorkflowSettings({ workspaceId });
  res.json(result);
});

export const updateDisputeSettings = withTrustAccess(async (req, res) => {
  const payload = ensurePayloadObject(req.body, 'dispute workflow settings');
  if (payload.workspaceId != null) {
    payload.workspaceId = parseOptionalPositiveInteger(payload.workspaceId);
  }
  const result = await trustService.saveDisputeWorkflowSettings(payload);
  res.json(result);
}, { manage: true });

export const listDisputeTemplates = withTrustAccess(async (req, res) => {
  const workspaceId = parseOptionalPositiveInteger(req.query?.workspaceId);
  const includeGlobal = parseBoolean(req.query?.includeGlobal, true);
  const result = await trustService.listDisputeTemplates({ workspaceId, includeGlobal });
  res.json(result);
});

export const createDisputeTemplate = withTrustAccess(async (req, res) => {
  const result = await trustService.createDisputeTemplate(ensurePayloadObject(req.body, 'dispute template'));
  res.status(201).json(result);
}, { manage: true });

export const updateDisputeTemplate = withTrustAccess(async (req, res) => {
  const templateId = parsePositiveInteger(req.params.templateId, 'templateId');
  const result = await trustService.updateDisputeTemplate(templateId, ensurePayloadObject(req.body, 'dispute template update'));
  res.json(result);
}, { manage: true });

export const deleteDisputeTemplate = withTrustAccess(async (req, res) => {
  const templateId = parsePositiveInteger(req.params.templateId, 'templateId');
  await trustService.deleteDisputeTemplate(templateId);
  res.status(204).send();
}, { manage: true });

export default {
  createEscrowAccount,
  updateEscrowAccount,
  initiateEscrow,
  updateEscrowTransaction,
  releaseEscrow,
  refundEscrow,
  createDispute,
  appendDisputeEvent,
  listDisputes,
  getDispute,
  updateDispute,
  getTrustOverview,
  getDisputeSettings,
  updateDisputeSettings,
  listDisputeTemplates,
  createDisputeTemplate,
  updateDisputeTemplate,
  deleteDisputeTemplate,
};

