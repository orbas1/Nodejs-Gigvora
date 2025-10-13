import crypto from 'node:crypto';
import {
  sequelize,
  User,
  DeliverableVault,
  DeliverableVaultItem,
  DeliverableVersion,
  DeliverableDeliveryPackage,
  DELIVERABLE_ITEM_STATUSES,
  DELIVERABLE_ITEM_NDA_STATUSES,
  DELIVERABLE_ITEM_WATERMARK_MODES,
  DELIVERABLE_RETENTION_POLICIES,
  DELIVERABLE_VAULT_WATERMARK_MODES,
} from '../models/index.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

const CDN_BASE_URL = process.env.DELIVERABLE_VAULT_CDN_URL || 'https://cdn.gigvora.test';
const RETENTION_SHORT_TERM_MONTHS = 18;
const RETENTION_STANDARD_YEARS = 7;
const METRIC_DECIMAL_PLACES = 2;

function formatBytes(bytes = 0) {
  if (!bytes || Number.isNaN(Number(bytes))) {
    return '0 B';
  }
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = Number(bytes);
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function normalizeTags(rawTags) {
  if (!rawTags) {
    return [];
  }
  if (Array.isArray(rawTags)) {
    return [...new Set(rawTags.map((tag) => `${tag}`.trim()).filter(Boolean))];
  }
  if (typeof rawTags === 'string') {
    return [...new Set(rawTags.split(',').map((tag) => tag.trim()).filter(Boolean))];
  }
  return [];
}

function normalizeStatus(status) {
  if (!status) {
    return 'draft';
  }
  const normalized = `${status}`.toLowerCase();
  if (!DELIVERABLE_ITEM_STATUSES.includes(normalized)) {
    throw new ValidationError('Invalid deliverable status provided.', { status });
  }
  return normalized;
}

function normalizeNdaStatus(ndaStatus, { ndaRequired } = {}) {
  if (!ndaRequired) {
    return 'not_required';
  }
  if (!ndaStatus) {
    return 'pending';
  }
  const normalized = `${ndaStatus}`.toLowerCase();
  if (!DELIVERABLE_ITEM_NDA_STATUSES.includes(normalized)) {
    throw new ValidationError('Invalid NDA status provided.', { ndaStatus });
  }
  return normalized;
}

function normalizeWatermarkMode(mode, { allowInherit = true } = {}) {
  if (!mode) {
    return allowInherit ? 'inherit' : 'dynamic';
  }
  const normalized = `${mode}`.toLowerCase();
  const options = allowInherit ? DELIVERABLE_ITEM_WATERMARK_MODES : DELIVERABLE_VAULT_WATERMARK_MODES;
  if (!options.includes(normalized)) {
    throw new ValidationError('Invalid watermark mode provided.', { mode });
  }
  return normalized;
}

function normalizeRetentionPolicy(policy) {
  if (!policy) {
    return 'standard_7_year';
  }
  const normalized = `${policy}`.toLowerCase();
  if (!DELIVERABLE_RETENTION_POLICIES.includes(normalized)) {
    throw new ValidationError('Invalid retention policy provided.', { policy });
  }
  return normalized;
}

function determineRetentionUntil(retentionPolicy, retentionUntil) {
  if (retentionPolicy === 'indefinite') {
    return null;
  }
  if (retentionPolicy === 'client_defined') {
    return retentionUntil ? new Date(retentionUntil) : null;
  }
  const baseDate = new Date();
  if (retentionPolicy === 'short_term') {
    baseDate.setMonth(baseDate.getMonth() + RETENTION_SHORT_TERM_MONTHS);
    return baseDate;
  }
  baseDate.setFullYear(baseDate.getFullYear() + RETENTION_STANDARD_YEARS);
  return baseDate;
}

function buildAuditEntry(eventType, actorId, payload = {}) {
  return {
    id: crypto.randomUUID(),
    eventType,
    actorId,
    payload,
    occurredAt: new Date().toISOString(),
  };
}

async function ensureFreelancerExists(freelancerId, transaction) {
  const user = await User.findByPk(freelancerId, { transaction });
  if (!user) {
    throw new NotFoundError('Freelancer not found.', { freelancerId });
  }
  return user;
}

async function getOrCreateVault(freelancerId, { transaction } = {}) {
  const [vault] = await DeliverableVault.findOrCreate({
    where: { freelancerId },
    defaults: {
      title: 'Client deliverables',
      watermarkMode: 'dynamic',
      retentionPolicy: 'standard_7_year',
      settings: {
        watermarking: { defaultMode: 'dynamic', enforceOnDownload: true },
        nda: { autoEnforce: true, reminderDays: 3 },
        delivery: { bundleAssets: true, checksumValidation: true },
      },
    },
    transaction,
  });
  return vault;
}

function computeSummary(items = []) {
  const now = new Date();
  const summary = {
    totalItems: items.length,
    activeCount: 0,
    deliveredCount: 0,
    pendingNdaCount: 0,
    archivedCount: 0,
    watermarkedDeliverables: 0,
    packagesGenerated: 0,
    storageUsageBytes: 0,
    storageUsageFormatted: '0 B',
    ndaCoverage: 100,
    expiringRetentionCount: 0,
    retentionBreakdown: {},
    statusBreakdown: {},
  };

  let ndaRequiredCount = 0;
  let ndaSignedCount = 0;

  for (const item of items) {
    const plain = item;
    const versions = Array.isArray(plain.versions) ? plain.versions : [];
    const packages = Array.isArray(plain.deliveryPackages) ? plain.deliveryPackages : [];

    summary.statusBreakdown[plain.status] = (summary.statusBreakdown[plain.status] || 0) + 1;
    summary.retentionBreakdown[plain.retentionPolicy] = (summary.retentionBreakdown[plain.retentionPolicy] || 0) + 1;

    if (plain.status === 'delivered') {
      summary.deliveredCount += 1;
    }
    if (plain.status === 'archived' || plain.isArchived) {
      summary.archivedCount += 1;
    }
    if (plain.ndaRequired) {
      ndaRequiredCount += 1;
      if (plain.ndaStatus === 'signed') {
        ndaSignedCount += 1;
      } else if (plain.ndaStatus === 'pending') {
        summary.pendingNdaCount += 1;
      }
    }

    const latestVersion = versions[0];
    if (latestVersion?.watermarkApplied) {
      summary.watermarkedDeliverables += 1;
    }
    summary.packagesGenerated += packages.length;

    for (const version of versions) {
      if (version.fileSize) {
        summary.storageUsageBytes += Number(version.fileSize);
      }
    }

    if (plain.retentionUntil) {
      const retentionDate = new Date(plain.retentionUntil);
      const ninetyDaysFromNow = new Date();
      ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);
      if (retentionDate <= ninetyDaysFromNow && retentionDate >= now) {
        summary.expiringRetentionCount += 1;
      }
    }
  }

  summary.activeCount = summary.totalItems - summary.archivedCount;
  summary.storageUsageFormatted = formatBytes(summary.storageUsageBytes);
  if (ndaRequiredCount) {
    summary.ndaCoverage = Number(((ndaSignedCount / ndaRequiredCount) * 100).toFixed(METRIC_DECIMAL_PLACES));
  } else {
    summary.ndaCoverage = 100;
  }

  return summary;
}

function sanitizeOverviewItems(items = []) {
  return items.map((item) => item.toPublicObject({ includeVersions: true, includePackages: true }));
}

async function buildVaultOverview({ freelancerId, transaction } = {}) {
  const vault = await getOrCreateVault(freelancerId, { transaction });
  const items = await DeliverableVaultItem.findAll({
    where: { vaultId: vault.id },
    include: [
      { model: DeliverableVersion, as: 'versions', attributes: ['id', 'itemId', 'versionNumber', 'fileSize', 'watermarkApplied', 'uploadedAt'] },
      { model: DeliverableDeliveryPackage, as: 'deliveryPackages', attributes: ['id', 'itemId', 'generatedAt'] },
    ],
    order: [['updatedAt', 'DESC']],
    transaction,
  });
  const publicItems = sanitizeOverviewItems(items);
  const summary = computeSummary(publicItems);

  return {
    vault: vault.toPublicObject(),
    summary,
    items: publicItems,
  };
}

export async function getVaultOverview({ freelancerId }) {
  if (!freelancerId) {
    throw new ValidationError('freelancerId is required.');
  }
  await ensureFreelancerExists(freelancerId);
  return buildVaultOverview({ freelancerId });
}

export async function getVaultItem({ itemId, freelancerId }) {
  if (!itemId) {
    throw new ValidationError('itemId is required.');
  }
  const where = { id: itemId };
  const include = [
    {
      model: DeliverableVersion,
      as: 'versions',
      include: [{ model: User, as: 'uploadedBy', attributes: ['id', 'firstName', 'lastName', 'email'] }],
      order: [['versionNumber', 'DESC']],
    },
    {
      model: DeliverableDeliveryPackage,
      as: 'deliveryPackages',
      include: [{ model: User, as: 'generatedBy', attributes: ['id', 'firstName', 'lastName', 'email'] }],
      order: [['generatedAt', 'DESC']],
    },
    { model: DeliverableVault, as: 'vault' },
  ];

  const item = await DeliverableVaultItem.findOne({ where, include });
  if (!item) {
    throw new NotFoundError('Deliverable not found.', { itemId });
  }
  if (freelancerId && item.vault?.freelancerId !== Number(freelancerId)) {
    throw new NotFoundError('Deliverable not found for freelancer.', { itemId, freelancerId });
  }

  return { item: item.toPublicObject({ includePackages: true, includeVersions: true }) };
}

async function appendAuditTrail(item, auditEntry, { transaction } = {}) {
  const metadata = item.metadata && typeof item.metadata === 'object' ? { ...item.metadata } : {};
  const trail = Array.isArray(metadata.auditTrail) ? metadata.auditTrail.slice(-49) : [];
  trail.push(auditEntry);
  metadata.auditTrail = trail;
  await item.update({ metadata }, { transaction });
  item.metadata = metadata; // keep instance in sync
}

async function createVersionInternal({ item, actorId, versionInput, transaction }) {
  if (!versionInput || typeof versionInput !== 'object') {
    throw new ValidationError('initialVersion payload must be provided when adding a deliverable version.');
  }
  if (!versionInput.fileName || !versionInput.fileUrl) {
    throw new ValidationError('fileName and fileUrl are required for deliverable versions.');
  }

  const currentMax = await DeliverableVersion.max('versionNumber', {
    where: { itemId: item.id },
    transaction,
  });
  const nextVersionNumber = Number.isInteger(currentMax) ? currentMax + 1 : 1;
  const fileExt = versionInput.fileName.includes('.')
    ? versionInput.fileName.split('.').pop().toLowerCase()
    : null;
  const checksum = versionInput.checksum || crypto.createHash('sha256').update(`${versionInput.fileUrl}`).digest('hex');
  const record = await DeliverableVersion.create(
    {
      itemId: item.id,
      versionNumber: nextVersionNumber,
      storageKey: versionInput.storageKey || `deliverables/${item.id}/${Date.now()}-${nextVersionNumber}`,
      fileUrl: versionInput.fileUrl,
      fileName: versionInput.fileName,
      fileExt,
      fileSize: versionInput.fileSize ?? null,
      checksum,
      uploadedById: actorId,
      uploadedAt: versionInput.uploadedAt ? new Date(versionInput.uploadedAt) : new Date(),
      watermarkApplied: Boolean(versionInput.watermarkApplied ?? true),
      notes: versionInput.notes ?? null,
      storageRegion: versionInput.storageRegion ?? null,
      metadata: versionInput.metadata ?? null,
    },
    { transaction },
  );

  await item.update(
    {
      currentVersionId: record.id,
      lastTouchedById: actorId,
      status: item.status === 'draft' ? 'in_review' : item.status,
    },
    { transaction },
  );

  await appendAuditTrail(item, buildAuditEntry('deliverable_version_added', actorId, { versionNumber: record.versionNumber }), {
    transaction,
  });

  return record;
}

export async function createVaultItem({ freelancerId, actorId, payload }) {
  if (!freelancerId) {
    throw new ValidationError('freelancerId is required.');
  }
  if (!payload?.title) {
    throw new ValidationError('title is required.');
  }
  const actingUserId = actorId || freelancerId;

  await ensureFreelancerExists(freelancerId);

  const item = await sequelize.transaction(async (transaction) => {
    const vault = await getOrCreateVault(freelancerId, { transaction });
    const status = normalizeStatus(payload.status);
    const retentionPolicy = normalizeRetentionPolicy(payload.retentionPolicy);
    const ndaStatus = normalizeNdaStatus(payload.ndaStatus, { ndaRequired: payload.ndaRequired });
    const retentionUntil = determineRetentionUntil(retentionPolicy, payload.retentionUntil);
    const watermarkMode = normalizeWatermarkMode(payload.watermarkMode);

    const itemRecord = await DeliverableVaultItem.create(
      {
        vaultId: vault.id,
        projectId: payload.projectId ?? null,
        clientName: payload.clientName?.trim() || null,
        title: payload.title.trim(),
        description: payload.description ?? null,
        status,
        ndaRequired: Boolean(payload.ndaRequired),
        ndaStatus,
        ndaSignedAt: payload.ndaSignedAt ?? null,
        ndaReferenceId: payload.ndaReferenceId ?? null,
        watermarkMode,
        retentionPolicy,
        retentionUntil,
        deliveredAt: payload.deliveredAt ?? null,
        currentVersionId: null,
        latestPackageId: null,
        tags: normalizeTags(payload.tags),
        successSummary: payload.successSummary ?? null,
        successMetrics: payload.successMetrics ?? null,
        metadata: payload.metadata && typeof payload.metadata === 'object' ? { ...payload.metadata } : {},
        isArchived: Boolean(payload.isArchived) || status === 'archived',
        createdById: actingUserId,
        lastTouchedById: actingUserId,
      },
      { transaction },
    );

    await appendAuditTrail(itemRecord, buildAuditEntry('deliverable_created', actingUserId, { status }), { transaction });

    if (payload.initialVersion) {
      await createVersionInternal({ item: itemRecord, actorId: actingUserId, versionInput: payload.initialVersion, transaction });
    }

    return itemRecord;
  });

  const detail = await getVaultItem({ itemId: item.id, freelancerId });
  const overview = await buildVaultOverview({ freelancerId });
  return { item: detail.item, overview };
}

export async function updateVaultItem({ itemId, freelancerId, actorId, changes }) {
  if (!itemId) {
    throw new ValidationError('itemId is required.');
  }
  if (!changes || typeof changes !== 'object') {
    throw new ValidationError('changes payload is required.');
  }
  const actingUserId = actorId || freelancerId;

  return sequelize.transaction(async (transaction) => {
    const { item } = await getVaultItem({ itemId, freelancerId });
    const itemRecord = await DeliverableVaultItem.findByPk(itemId, { transaction });
    if (!itemRecord) {
      throw new NotFoundError('Deliverable not found.', { itemId });
    }

    const updates = {};
    if (changes.title) updates.title = changes.title.trim();
    if (changes.description !== undefined) updates.description = changes.description;
    if (changes.status) updates.status = normalizeStatus(changes.status);
    if (changes.clientName !== undefined) updates.clientName = changes.clientName?.trim() || null;
    if (changes.projectId !== undefined) updates.projectId = changes.projectId ?? null;
    if (changes.ndaRequired !== undefined) updates.ndaRequired = Boolean(changes.ndaRequired);
    if (changes.ndaStatus) updates.ndaStatus = normalizeNdaStatus(changes.ndaStatus, { ndaRequired: updates.ndaRequired ?? item.ndaRequired });
    if (changes.ndaSignedAt !== undefined) updates.ndaSignedAt = changes.ndaSignedAt ? new Date(changes.ndaSignedAt) : null;
    if (changes.ndaReferenceId !== undefined) updates.ndaReferenceId = changes.ndaReferenceId ?? null;
    if (changes.watermarkMode) updates.watermarkMode = normalizeWatermarkMode(changes.watermarkMode);
    if (changes.retentionPolicy) {
      updates.retentionPolicy = normalizeRetentionPolicy(changes.retentionPolicy);
      updates.retentionUntil = determineRetentionUntil(updates.retentionPolicy, changes.retentionUntil ?? item.retentionUntil);
    } else if (changes.retentionUntil !== undefined) {
      updates.retentionUntil = changes.retentionUntil ? new Date(changes.retentionUntil) : null;
    }
    if (changes.deliveredAt !== undefined) updates.deliveredAt = changes.deliveredAt ? new Date(changes.deliveredAt) : null;
    if (changes.tags !== undefined) updates.tags = normalizeTags(changes.tags);
    if (changes.successSummary !== undefined) updates.successSummary = changes.successSummary ?? null;
    if (changes.successMetrics !== undefined) updates.successMetrics = changes.successMetrics ?? null;
    if (changes.metadata && typeof changes.metadata === 'object') {
      updates.metadata = { ...itemRecord.metadata, ...changes.metadata };
    }
    if (changes.isArchived !== undefined) updates.isArchived = Boolean(changes.isArchived);

    if (Object.keys(updates).length) {
      updates.lastTouchedById = actingUserId;
      await itemRecord.update(updates, { transaction });
      await appendAuditTrail(
        itemRecord,
        buildAuditEntry('deliverable_updated', actingUserId, { fields: Object.keys(updates) }),
        { transaction },
      );
    }

    const detail = await getVaultItem({ itemId, freelancerId });
    const overview = await buildVaultOverview({ freelancerId });
    return { item: detail.item, overview };
  });
}

export async function addDeliverableVersion({ itemId, freelancerId, actorId, version }) {
  if (!itemId) {
    throw new ValidationError('itemId is required.');
  }
  if (!version || typeof version !== 'object') {
    throw new ValidationError('version payload is required.');
  }
  const actingUserId = actorId || freelancerId;

  await ensureFreelancerExists(freelancerId);

  return sequelize.transaction(async (transaction) => {
    const itemRecord = await DeliverableVaultItem.findByPk(itemId, { transaction });
    if (!itemRecord) {
      throw new NotFoundError('Deliverable not found.', { itemId });
    }
    await createVersionInternal({ item: itemRecord, actorId: actingUserId, versionInput: version, transaction });

    const detail = await getVaultItem({ itemId, freelancerId });
    const overview = await buildVaultOverview({ freelancerId });
    return { item: detail.item, overview };
  });
}

function deriveSuccessMetrics(item, versions, overrides = {}) {
  const metrics = {
    versionCount: versions.length,
    watermarkedVersions: versions.filter((v) => v.watermarkApplied).length,
    totalFileSizeBytes: versions.reduce((acc, version) => acc + (Number(version.fileSize) || 0), 0),
    ndaCoverage: item.ndaRequired ? (item.ndaStatus === 'signed' ? 100 : 0) : 100,
    ...overrides,
  };

  if (metrics.totalFileSizeBytes) {
    metrics.totalFileSizeFormatted = formatBytes(metrics.totalFileSizeBytes);
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(metrics)) {
    sanitized[key] = typeof value === 'number' ? Number(Number(value).toFixed(METRIC_DECIMAL_PLACES)) : value;
  }
  return sanitized;
}

function generateDeliverySummary(item, metrics) {
  const parts = [];
  parts.push(`${item.title} packaged for ${item.clientName || 'client'} with ${metrics.versionCount} version${
    metrics.versionCount === 1 ? '' : 's'
  }.`);
  if (metrics.ndaCoverage !== undefined) {
    parts.push(`NDA coverage: ${metrics.ndaCoverage}%`);
  }
  if (metrics.watermarkedVersions !== undefined) {
    parts.push(`Watermarked revisions: ${metrics.watermarkedVersions}`);
  }
  if (metrics.totalFileSizeFormatted) {
    parts.push(`Bundle size: ${metrics.totalFileSizeFormatted}`);
  }
  return parts.join(' ');
}

export async function generateDeliveryPackage({
  itemId,
  freelancerId,
  actorId,
  summary,
  metrics,
  expiresInDays,
  includesWatermark,
}) {
  if (!itemId) {
    throw new ValidationError('itemId is required.');
  }
  const actingUserId = actorId || freelancerId;

  await ensureFreelancerExists(freelancerId);

  return sequelize.transaction(async (transaction) => {
    const itemRecord = await DeliverableVaultItem.findByPk(itemId, {
      include: [
        { model: DeliverableVersion, as: 'versions' },
        { model: DeliverableDeliveryPackage, as: 'deliveryPackages' },
      ],
      transaction,
    });
    if (!itemRecord) {
      throw new NotFoundError('Deliverable not found.', { itemId });
    }

    const versions = Array.isArray(itemRecord.versions) ? itemRecord.versions : [];
    if (!versions.length) {
      throw new ValidationError('At least one version is required before generating a delivery package.');
    }

    const computedMetrics = deriveSuccessMetrics(itemRecord.toPublicObject(), versions.map((v) => v.toPublicObject?.() || v), metrics);
    const deliverySummary = summary || generateDeliverySummary(itemRecord, computedMetrics);
    const expiresAt = expiresInDays
      ? new Date(Date.now() + Number(expiresInDays) * 24 * 60 * 60 * 1000)
      : null;

    const packageKey = `deliverables/${itemRecord.vaultId}/${itemRecord.id}/${Date.now()}-${crypto.randomUUID()}`;
    const packageUrl = `${CDN_BASE_URL.replace(/\/$/, '')}/${packageKey}`;
    const checksum = crypto.createHash('sha256').update(`${packageKey}:${deliverySummary}`).digest('hex');

    const packageRecord = await DeliverableDeliveryPackage.create(
      {
        itemId: itemRecord.id,
        packageKey,
        packageUrl,
        checksum,
        generatedById: actingUserId,
        generatedAt: new Date(),
        expiresAt,
        includesWatermark: includesWatermark ?? true,
        deliverySummary,
        deliveryMetrics: computedMetrics,
        ndaSnapshot: {
          required: itemRecord.ndaRequired,
          status: itemRecord.ndaStatus,
          signedAt: itemRecord.ndaSignedAt,
          referenceId: itemRecord.ndaReferenceId,
        },
        metadata: {
          versionCount: versions.length,
          generatedFromVersionId: itemRecord.currentVersionId,
        },
      },
      { transaction },
    );

    await itemRecord.update(
      {
        latestPackageId: packageRecord.id,
        successSummary: deliverySummary,
        successMetrics: computedMetrics,
        status: itemRecord.status === 'approved' ? 'delivered' : itemRecord.status,
        deliveredAt: itemRecord.deliveredAt ?? new Date(),
        lastTouchedById: actingUserId,
      },
      { transaction },
    );

    await appendAuditTrail(
      itemRecord,
      buildAuditEntry('delivery_package_generated', actingUserId, {
        packageId: packageRecord.id,
        expiresAt,
      }),
      { transaction },
    );

    const detail = await getVaultItem({ itemId, freelancerId });
    const overview = await buildVaultOverview({ freelancerId });
    return { item: detail.item, package: packageRecord.toPublicObject(), overview };
  });
}

export default {
  getVaultOverview,
  getVaultItem,
  createVaultItem,
  updateVaultItem,
  addDeliverableVersion,
  generateDeliveryPackage,
};
