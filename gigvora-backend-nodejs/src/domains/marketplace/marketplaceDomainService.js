import { ValidationError } from '../../utils/errors.js';

function createLogger(logger) {
  if (!logger) {
    return {
      child() {
        return this;
      },
      debug() {},
      info() {},
      warn() {},
      error() {},
    };
  }
  return logger.child({ module: 'MarketplaceDomainService' });
}

const BRIEFING_STATUS_ALIASES = new Set(['briefing', 'planning', 'intake', 'kickoff']);
const ACTIVE_STATUS_ALIASES = new Set(['active', 'execution', 'live', 'in_progress', 'delivery']);
const COMPLETED_STATUS_ALIASES = new Set(['complete', 'completed', 'launch', 'closed', 'archived']);
const BLOCKED_STATUS_ALIASES = new Set(['blocked', 'on_hold', 'paused', 'at_risk']);

function clamp(value, { min, max }) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return Math.max(min, Math.min(max, parsed));
}

function normaliseBillingStatus(value) {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed.slice(0, 80) : null;
}

function parseDate(value) {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normaliseStatusCandidate(value) {
  if (!value) {
    return '';
  }
  return value.toString().trim().toLowerCase();
}

export class MarketplaceDomainService {
  constructor({ domainRegistry, logger }) {
    this.registry = domainRegistry;
    this.logger = createLogger(logger);
    this.contextName = 'marketplace';
    this.models = domainRegistry.getContextModels('marketplace');
    this.Project = this.models.Project;
    this.ProjectWorkspace = this.models.ProjectWorkspace;
    if (!this.Project || !this.ProjectWorkspace) {
      throw new Error('Marketplace domain requires Project and ProjectWorkspace models.');
    }
  }

  deriveWorkspaceStatus(projectStatus, fallbackStatuses) {
    const normalized = normaliseStatusCandidate(projectStatus);
    if (BLOCKED_STATUS_ALIASES.has(normalized)) {
      return 'blocked';
    }
    if (COMPLETED_STATUS_ALIASES.has(normalized)) {
      return 'completed';
    }
    if (ACTIVE_STATUS_ALIASES.has(normalized)) {
      return 'active';
    }
    if (BRIEFING_STATUS_ALIASES.has(normalized)) {
      return 'briefing';
    }
    if (Array.isArray(fallbackStatuses) && fallbackStatuses.includes('briefing')) {
      return 'briefing';
    }
    if (Array.isArray(fallbackStatuses) && fallbackStatuses.length) {
      return fallbackStatuses[0];
    }
    return 'active';
  }

  async ensureWorkspaceForProject(projectInstance, { actorId, transaction } = {}) {
    if (!projectInstance) {
      throw new ValidationError('A project instance must be provided when syncing workspaces.');
    }
    const workspaceStatus = this.deriveWorkspaceStatus(
      projectInstance.status,
      this.ProjectWorkspace.rawAttributes.status.values,
    );
    const [workspace] = await this.ProjectWorkspace.findOrCreate({
      where: { projectId: projectInstance.id },
      defaults: {
        projectId: projectInstance.id,
        status: workspaceStatus,
        updatedById: actorId || null,
        lastActivityAt: projectInstance.updatedAt || projectInstance.createdAt || new Date(),
      },
      transaction,
    });

    const needsUpdate = workspace.status !== workspaceStatus || workspace.updatedById !== actorId;
    if (needsUpdate) {
      await workspace.update(
        {
          status: workspaceStatus,
          updatedById: actorId || workspace.updatedById,
          lastActivityAt: projectInstance.updatedAt || new Date(),
        },
        { transaction },
      );
    }
    return workspace;
  }

  async syncWorkspaceMetrics(projectInstance, { metrics = {}, transaction } = {}) {
    if (!projectInstance) {
      throw new ValidationError('syncWorkspaceMetrics requires a project instance.');
    }
    const workspace = await this.ProjectWorkspace.findOne({
      where: { projectId: projectInstance.id },
      transaction,
    });
    if (!workspace) {
      return null;
    }
    const updates = {};
    if (typeof metrics.healthScore === 'number') {
      const health = clamp(metrics.healthScore, { min: 0, max: 100 });
      if (health != null) {
        updates.healthScore = Number(health.toFixed(2));
      }
    }
    if (typeof metrics.velocityScore === 'number') {
      const velocity = clamp(metrics.velocityScore, { min: 0, max: 100 });
      if (velocity != null) {
        updates.velocityScore = Number(velocity.toFixed(2));
      }
    }
    if (typeof metrics.progressPercent === 'number') {
      const progress = clamp(metrics.progressPercent, { min: 0, max: 100 });
      if (progress != null) {
        updates.progressPercent = Number(progress.toFixed(2));
      }
    }
    if (typeof metrics.clientSatisfaction === 'number') {
      const satisfaction = clamp(metrics.clientSatisfaction, { min: 0, max: 5 });
      if (satisfaction != null) {
        updates.clientSatisfaction = Number(satisfaction.toFixed(2));
      }
    }
    if (typeof metrics.automationCoverage === 'number') {
      const automation = clamp(metrics.automationCoverage, { min: 0, max: 100 });
      if (automation != null) {
        updates.automationCoverage = Number(automation.toFixed(2));
      }
    }
    if (typeof metrics.billingStatus === 'string') {
      updates.billingStatus = normaliseBillingStatus(metrics.billingStatus);
    }
    if (typeof metrics.riskLevel === 'string') {
      const allowedRiskLevels = this.ProjectWorkspace.rawAttributes.riskLevel?.values ?? [];
      const normalizedRisk = normaliseStatusCandidate(metrics.riskLevel);
      const matchedRisk = allowedRiskLevels.find(
        (risk) => risk.toLowerCase() === normalizedRisk,
      );
      if (matchedRisk) {
        updates.riskLevel = matchedRisk;
      }
    }
    if (metrics.metricsSnapshot && typeof metrics.metricsSnapshot === 'object') {
      updates.metricsSnapshot = metrics.metricsSnapshot;
    }
    if (metrics.lastActivityAt) {
      const parsed = parseDate(metrics.lastActivityAt);
      if (parsed) {
        updates.lastActivityAt = parsed;
      }
    }
    if (Object.keys(updates).length === 0) {
      return workspace;
    }
    await workspace.update(updates, { transaction });
    this.logger.debug({ projectId: projectInstance.id, updates }, 'Updated workspace metrics.');
    return workspace;
  }

  describeCapabilities() {
    return {
      key: 'marketplace',
      contextName: this.contextName,
      description: 'Marketplace orchestration, workspaces, and delivery telemetry.',
      operations: [
        'deriveWorkspaceStatus',
        'ensureWorkspaceForProject',
        'syncWorkspaceMetrics',
      ],
      models: Object.keys(this.models),
    };
  }
}

export default MarketplaceDomainService;
