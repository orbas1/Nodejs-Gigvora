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

const ACTIVE_STATUS_ALIASES = new Set(['active', 'execution', 'live', 'in_progress', 'delivery']);
const COMPLETED_STATUS_ALIASES = new Set(['complete', 'completed', 'launch', 'closed', 'archived']);
const BLOCKED_STATUS_ALIASES = new Set(['blocked', 'on_hold', 'paused']);

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
      updates.healthScore = Number(metrics.healthScore.toFixed(2));
    }
    if (typeof metrics.velocityScore === 'number') {
      updates.velocityScore = Number(metrics.velocityScore.toFixed(2));
    }
    if (typeof metrics.progressPercent === 'number') {
      updates.progressPercent = Math.max(0, Math.min(100, Number(metrics.progressPercent.toFixed(2))));
    }
    if (typeof metrics.clientSatisfaction === 'number') {
      updates.clientSatisfaction = Math.max(0, Math.min(5, Number(metrics.clientSatisfaction.toFixed(2))));
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
