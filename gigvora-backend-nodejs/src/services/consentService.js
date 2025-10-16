import assert from 'node:assert/strict';
import { Op } from 'sequelize';
import sequelize from '../models/sequelizeClient.js';
import {
  ConsentPolicy,
  ConsentPolicyVersion,
  UserConsent,
  ConsentAuditEvent,
  normaliseConsentCode,
  activatePolicyVersion,
  supersedePolicyVersion,
} from '../models/consentModels.js';
import { NotFoundError, ConflictError, ValidationError } from '../utils/errors.js';

function normaliseAudience(value) {
  return normaliseConsentCode(value) ?? 'user';
}

function normaliseRegion(value) {
  return normaliseConsentCode(value) ?? 'global';
}

function ensureLegalBasis(value) {
  if (!value) {
    throw new ValidationError('legalBasis is required for consent policies.');
  }
  return value.trim();
}

export function sanitisePolicyPayload(payload = {}) {
  const {
    code,
    title,
    description,
    audience,
    region,
    legalBasis,
    required = false,
    revocable = true,
    retentionPeriodDays = null,
    metadata = {},
  } = payload;

  if (!title || !title.trim()) {
    throw new ValidationError('title is required for consent policies.');
  }

  const normalisedCode = normaliseConsentCode(code ?? title);
  if (!normalisedCode) {
    throw new ValidationError('code must contain at least two alphanumeric characters.');
  }

  const policyPayload = {
    code: normalisedCode,
    title: title.trim(),
    description: description?.trim() ?? null,
    audience: normaliseAudience(audience),
    region: normaliseRegion(region),
    legalBasis: ensureLegalBasis(legalBasis),
    required: Boolean(required),
    revocable: Boolean(revocable),
    retentionPeriodDays: retentionPeriodDays ?? null,
    metadata: metadata ?? {},
  };

  if (policyPayload.required && policyPayload.revocable === true) {
    // Required policies must explicitly state whether they can be withdrawn; default to false.
    policyPayload.revocable = Boolean(revocable);
  }

  if (policyPayload.retentionPeriodDays !== null) {
    const value = Number(policyPayload.retentionPeriodDays);
    if (!Number.isFinite(value) || value < 1 || value > 3650) {
      throw new ValidationError('retentionPeriodDays must be between 1 and 3650.');
    }
    policyPayload.retentionPeriodDays = value;
  }

  return policyPayload;
}

export function sanitiseVersionPayload(payload = {}) {
  const {
    version,
    documentUrl,
    content,
    summary,
    effectiveAt,
    metadata = {},
    createdBy = null,
  } = payload;

  const effectiveDate = effectiveAt ? new Date(effectiveAt) : new Date();
  if (!Number.isFinite(effectiveDate.getTime())) {
    throw new ValidationError('effectiveAt must be a valid ISO date.');
  }

  let resolvedVersion = version ?? null;
  if (resolvedVersion !== null) {
    const parsed = Number(resolvedVersion);
    if (!Number.isFinite(parsed) || parsed < 1) {
      throw new ValidationError('version must be a positive integer.');
    }
    resolvedVersion = Math.floor(parsed);
  }

  return {
    version: resolvedVersion,
    documentUrl: documentUrl?.trim() ?? null,
    content: content ?? null,
    summary: summary?.trim() ?? null,
    effectiveAt: effectiveDate,
    metadata: metadata ?? {},
    createdBy,
  };
}

export async function listConsentPolicies({ audience, region, includeInactive = false } = {}) {
  const where = {};
  if (audience) {
    where.audience = normaliseAudience(audience);
  }
  if (region) {
    where.region = normaliseRegion(region);
  }
  if (!includeInactive) {
    where.activeVersionId = { [Op.not]: null };
  }

  const policies = await ConsentPolicy.findAll({
    where,
    include: [
      {
        model: ConsentPolicyVersion,
        as: 'versions',
        required: false,
        order: [['effectiveAt', 'DESC']],
      },
    ],
    order: [
      ['required', 'DESC'],
      ['title', 'ASC'],
    ],
  });
  return policies.map((policy) => policy.toSummary({ includeVersions: true }));
}

export async function getConsentPolicyByCode(code, { includeVersions = false } = {}) {
  const normalisedCode = normaliseConsentCode(code);
  if (!normalisedCode) {
    throw new NotFoundError('Consent policy not found.');
  }

  const policy = await ConsentPolicy.findOne({
    where: { code: normalisedCode },
    include: includeVersions
      ? [
          {
            model: ConsentPolicyVersion,
            as: 'versions',
            required: false,
            order: [['effectiveAt', 'DESC']],
          },
        ]
      : [],
  });

  if (!policy) {
    throw new NotFoundError(`Consent policy "${normalisedCode}" does not exist.`);
  }

  return policy;
}

export async function createConsentPolicy(policyPayload, versionPayload, options = {}) {
  const { actorId = null, actorType = 'admin', transaction: externalTx } = options;
  const sanitisedPolicy = sanitisePolicyPayload(policyPayload);
  const sanitisedVersion = sanitiseVersionPayload(versionPayload);

  const transaction = externalTx ?? (await sequelize.transaction());
  let createdPolicy;
  try {
    createdPolicy = await ConsentPolicy.create(
      {
        ...sanitisedPolicy,
        createdBy: actorId,
        updatedBy: actorId,
      },
      { transaction },
    );

    const nextVersionNumber = sanitisedVersion.version ?? 1;
    const versionRecord = await ConsentPolicyVersion.create(
      {
        ...sanitisedVersion,
        policyId: createdPolicy.id,
        version: nextVersionNumber,
      },
      { transaction },
    );

    await activatePolicyVersion(createdPolicy, versionRecord, { transaction });

    await ConsentAuditEvent.create(
      {
        policyId: createdPolicy.id,
        policyVersionId: versionRecord.id,
        actorId,
        actorType,
        action: 'policy_created',
        metadata: {
          version: versionRecord.version,
          required: createdPolicy.required,
          revocable: createdPolicy.revocable,
        },
      },
      { transaction },
    );

    if (!externalTx) {
      await transaction.commit();
    }

    const reloaded = await ConsentPolicy.findByPk(createdPolicy.id, {
      include: [{ model: ConsentPolicyVersion, as: 'versions' }],
    });
    return reloaded.toSummary({ includeVersions: true });
  } catch (error) {
    if (!externalTx) {
      await transaction.rollback();
    }
    if (error.name === 'SequelizeUniqueConstraintError') {
      throw new ConflictError(`A consent policy with code "${sanitisedPolicy.code}" already exists.`);
    }
    throw error;
  }
}

export async function createPolicyVersion(policyId, payload, options = {}) {
  const { actorId = null, supersedeActive = true, transaction: externalTx } = options;
  const sanitisedVersion = sanitiseVersionPayload(payload);
  const transaction = externalTx ?? (await sequelize.transaction());

  try {
    const policy = await ConsentPolicy.findByPk(policyId, {
      include: [{ model: ConsentPolicyVersion, as: 'versions', separate: true }],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!policy) {
      throw new NotFoundError('Consent policy not found.');
    }

    const currentMaxVersion = Math.max(0, ...policy.versions.map((version) => version.version ?? 0));
    const nextVersion = sanitisedVersion.version ?? currentMaxVersion + 1;
    if (nextVersion <= currentMaxVersion) {
      throw new ConflictError('version must be greater than the current active version.');
    }

    const versionRecord = await ConsentPolicyVersion.create(
      {
        ...sanitisedVersion,
        policyId: policy.id,
        version: nextVersion,
      },
      { transaction },
    );

    if (supersedeActive && policy.activeVersionId) {
      const activeVersion = policy.versions.find((entry) => entry.id === policy.activeVersionId);
      if (activeVersion) {
        await supersedePolicyVersion(activeVersion, { actorId, transaction });
      }
    }

    await activatePolicyVersion(policy, versionRecord, { transaction });

    await ConsentAuditEvent.create(
      {
        policyId: policy.id,
        policyVersionId: versionRecord.id,
        actorId,
        actorType: actorId ? 'admin' : 'system',
        action: 'policy_version_created',
        metadata: {
          version: versionRecord.version,
          supersededVersionId: policy.activeVersionId,
        },
      },
      { transaction },
    );

    if (!externalTx) {
      await transaction.commit();
    }

    return versionRecord;
  } catch (error) {
    if (!externalTx) {
      await transaction.rollback();
    }
    throw error;
  }
}

export async function updateConsentPolicy(policyId, payload = {}, options = {}) {
  const { actorId = null, transaction: externalTx } = options;

  const transaction = externalTx ?? (await sequelize.transaction());
  try {
    const policy = await ConsentPolicy.findByPk(policyId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!policy) {
      throw new NotFoundError('Consent policy not found.');
    }

    const merged = {
      code: policy.code,
      title: payload.title ?? policy.title,
      description: payload.description ?? policy.description,
      audience: payload.audience ?? policy.audience,
      region: payload.region ?? policy.region,
      legalBasis: payload.legalBasis ?? policy.legalBasis,
      required: payload.required ?? policy.required,
      revocable: payload.revocable ?? policy.revocable,
      retentionPeriodDays:
        payload.retentionPeriodDays !== undefined ? payload.retentionPeriodDays : policy.retentionPeriodDays,
      metadata: payload.metadata ?? policy.metadata,
    };

    const sanitisedPolicy = sanitisePolicyPayload(merged);
    delete sanitisedPolicy.code;

    await policy.update({ ...sanitisedPolicy, updatedBy: actorId ?? policy.updatedBy }, { transaction });

    await ConsentAuditEvent.create(
      {
        policyId: policy.id,
        policyVersionId: policy.activeVersionId,
        actorId,
        actorType: actorId ? 'admin' : 'system',
        action: 'policy_updated',
        metadata: {
          required: policy.required,
          revocable: policy.revocable,
        },
      },
      { transaction },
    );

    if (!externalTx) {
      await transaction.commit();
    }

    const refreshed = await ConsentPolicy.findByPk(policy.id, {
      include: [{ model: ConsentPolicyVersion, as: 'versions' }],
    });
    return refreshed.toSummary({ includeVersions: true });
  } catch (error) {
    if (!externalTx) {
      await transaction.rollback();
    }
    throw error;
  }
}

export async function recordUserConsentDecision(
  userId,
  policyCode,
  { status, ipAddress = null, userAgent = null, source = 'self_service', metadata = {}, actorId = null } = {},
) {
  assert(userId, 'userId is required when recording consent decisions.');

  const normalisedStatus = status === 'withdrawn' ? 'withdrawn' : 'granted';
  const policy = await getConsentPolicyByCode(policyCode, { includeVersions: true });
  if (!policy.activeVersionId) {
    throw new ConflictError('Consent policy does not have an active version.');
  }

  if (normalisedStatus === 'withdrawn' && policy.required && !policy.revocable) {
    throw new ConflictError('This consent policy is required and cannot be withdrawn.');
  }

  const activeVersion = policy.versions?.find((version) => version.id === policy.activeVersionId);
  if (!activeVersion) {
    throw new ConflictError('The active version for this consent policy could not be located.');
  }

  return sequelize.transaction(async (transaction) => {
    const existing = await UserConsent.findOne({
      where: { userId, policyId: policy.id },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    const timestamp = new Date();
    if (existing) {
      const unchangedStatus = existing.status === normalisedStatus && existing.policyVersionId === activeVersion.id;
      if (unchangedStatus) {
        return existing;
      }

      await existing.update(
        {
          status: normalisedStatus,
          policyVersionId: activeVersion.id,
          grantedAt: normalisedStatus === 'granted' ? timestamp : existing.grantedAt,
          withdrawnAt: normalisedStatus === 'withdrawn' ? timestamp : null,
          source,
          ipAddress,
          userAgent,
          metadata,
        },
        { transaction },
      );

      await ConsentAuditEvent.create(
        {
          policyId: policy.id,
          policyVersionId: activeVersion.id,
          userConsentId: existing.id,
          actorId: actorId ?? String(userId),
          actorType: actorId ? 'admin' : 'user',
          action: normalisedStatus === 'granted' ? 'consent_granted' : 'consent_withdrawn',
          metadata: { source, ipAddress, userAgent },
        },
        { transaction },
      );

      return existing;
    }

    const consent = await UserConsent.create(
      {
        userId,
        policyId: policy.id,
        policyVersionId: activeVersion.id,
        status: normalisedStatus,
        grantedAt: normalisedStatus === 'granted' ? timestamp : null,
        withdrawnAt: normalisedStatus === 'withdrawn' ? timestamp : null,
        source,
        ipAddress,
        userAgent,
        metadata,
      },
      { transaction },
    );

    await ConsentAuditEvent.create(
      {
        policyId: policy.id,
        policyVersionId: activeVersion.id,
        userConsentId: consent.id,
        actorId: actorId ?? String(userId),
        actorType: actorId ? 'admin' : 'user',
        action: normalisedStatus === 'granted' ? 'consent_granted' : 'consent_withdrawn',
        metadata: { source, ipAddress, userAgent },
      },
      { transaction },
    );

    return consent;
  });
}

function serialiseAuditEvent(event) {
  const plain = event.get({ plain: true });
  return {
    id: plain.id,
    action: plain.action,
    occurredAt: plain.createdAt ? new Date(plain.createdAt).toISOString() : null,
    actor: {
      id: plain.actorId ?? null,
      type: plain.actorType ?? 'system',
    },
    reason: plain.reason ?? null,
    metadata: plain.metadata ?? {},
    policyVersion: plain.policyVersion
      ? {
          id: plain.policyVersion.id,
          version: plain.policyVersion.version,
          effectiveAt: plain.policyVersion.effectiveAt
            ? new Date(plain.policyVersion.effectiveAt).toISOString()
            : null,
          supersededAt: plain.policyVersion.supersededAt
            ? new Date(plain.policyVersion.supersededAt).toISOString()
            : null,
        }
      : null,
    userConsent: plain.userConsent
      ? {
          id: plain.userConsent.id,
          status: plain.userConsent.status,
          grantedAt: plain.userConsent.grantedAt
            ? new Date(plain.userConsent.grantedAt).toISOString()
            : null,
          withdrawnAt: plain.userConsent.withdrawnAt
            ? new Date(plain.userConsent.withdrawnAt).toISOString()
            : null,
        }
      : null,
  };
}

async function fetchAuditTrailForPolicy(policyId, userConsentId) {
  const orConditions = [{ userConsentId: null }];
  if (userConsentId) {
    orConditions.push({ userConsentId });
  }

  const events = await ConsentAuditEvent.findAll({
    where: {
      policyId,
      [Op.or]: orConditions,
    },
    include: [
      {
        model: ConsentPolicyVersion,
        as: 'policyVersion',
        attributes: ['id', 'version', 'effectiveAt', 'supersededAt'],
        required: false,
      },
      {
        model: UserConsent,
        as: 'userConsent',
        attributes: ['id', 'status', 'grantedAt', 'withdrawnAt'],
        required: false,
      },
    ],
    order: [['createdAt', 'DESC']],
    limit: 20,
  });

  return events.map(serialiseAuditEvent);
}

export async function getUserConsentSnapshot(userId, { audience, region } = {}) {
  assert(userId, 'userId is required when reading consent snapshots.');

  const policies = await listConsentPolicies({ audience, region, includeInactive: false });
  const policyIds = policies.map((policy) => policy.id);
  if (!policyIds.length) {
    return { outstandingRequired: 0, policies: [] };
  }

  const consents = await UserConsent.findAll({
    where: { userId, policyId: { [Op.in]: policyIds } },
  });

  const consentMap = new Map(consents.map((consent) => [consent.policyId, consent.toSnapshot()]));

  const policiesWithAudit = await Promise.all(
    policies.map(async (policy) => {
      const consent = consentMap.get(policy.id) ?? null;
      const auditTrail = await fetchAuditTrailForPolicy(policy.id, consent?.id ?? null);
      return {
        policy,
        consent,
        auditTrail,
      };
    }),
  );

  const outstandingRequired = policiesWithAudit.filter((entry) => {
    if (!entry.policy.required) {
      return false;
    }
    const status = entry.consent?.status ?? null;
    return status !== 'granted';
  }).length;

  return {
    outstandingRequired,
    policies: policiesWithAudit,
  };
}

export async function deleteConsentPolicy(policyId, options = {}) {
  const { actorId = null, transaction: externalTx } = options;
  const transaction = externalTx ?? (await sequelize.transaction());
  try {
    const policy = await ConsentPolicy.findByPk(policyId, { transaction });
    if (!policy) {
      throw new NotFoundError('Consent policy not found.');
    }

    await ConsentAuditEvent.create(
      {
        policyId: policy.id,
        policyVersionId: policy.activeVersionId,
        actorId,
        actorType: actorId ? 'admin' : 'system',
        action: 'policy_deleted',
      },
      { transaction },
    );

    await policy.destroy({ transaction });

    if (!externalTx) {
      await transaction.commit();
    }
  } catch (error) {
    if (!externalTx) {
      await transaction.rollback();
    }
    throw error;
  }
}

export default {
  listConsentPolicies,
  getConsentPolicyByCode,
  createConsentPolicy,
  createPolicyVersion,
  updateConsentPolicy,
  recordUserConsentDecision,
  getUserConsentSnapshot,
  deleteConsentPolicy,
  sanitisePolicyPayload,
  sanitiseVersionPayload,
};
