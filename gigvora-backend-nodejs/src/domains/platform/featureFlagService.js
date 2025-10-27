import crypto from 'node:crypto';

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
  return logger.child({ module: 'FeatureFlagService' });
}

function hashToPercentage(seed) {
  const hash = crypto.createHash('sha256').update(seed).digest('hex');
  const slice = hash.slice(0, 8);
  const value = parseInt(slice, 16);
  return (value % 10000) / 100;
}

export class FeatureFlagService {
  constructor({ domainRegistry, logger }) {
    this.registry = domainRegistry;
    this.logger = createLogger(logger);
    this.contextName = 'platform';
    this.models = domainRegistry.getContextModels('platform');
    this.FeatureFlag = this.models.FeatureFlag;
    this.FeatureFlagAssignment = this.models.FeatureFlagAssignment;
    if (!this.FeatureFlag || !this.FeatureFlagAssignment) {
      throw new Error('Platform domain requires FeatureFlag and FeatureFlagAssignment models.');
    }
  }

  static normalisePercentage(value) {
    if (value == null) {
      return null;
    }
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return null;
    }
    if (numeric <= 0) {
      return 0;
    }
    if (numeric >= 100) {
      return 100;
    }
    return Number(numeric.toFixed(2));
  }

  static toIsoDate(value) {
    if (!value) {
      return null;
    }
    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value.toISOString();
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }

  buildEvaluation(flag, { assignments, user, workspaceIds, traits }) {
    const baseMetadata = flag.metadata ?? {};
    const evaluation = {
      enabled: false,
      status: flag.status,
      variant: baseMetadata.defaultVariant ?? null,
      metadata: { ...baseMetadata },
      rolloutType: flag.rolloutType,
      rolloutPercentage: FeatureFlagService.normalisePercentage(flag.rolloutPercentage),
      evaluatedAt: new Date().toISOString(),
      matchedAudience: null,
      reason: 'flag_disabled',
      updatedAt: FeatureFlagService.toIsoDate(flag.updatedAt),
    };

    if (flag.status !== 'active') {
      return evaluation;
    }

    if (flag.rolloutType === 'global') {
      evaluation.enabled = true;
      evaluation.reason = 'global_rollout';
      return evaluation;
    }

    if (flag.rolloutType === 'percentage') {
      const percentage = FeatureFlagService.normalisePercentage(flag.rolloutPercentage);
      const enabled = percentage != null ? hashToPercentage(`${flag.key}:${user.id}`) < percentage : false;
      evaluation.enabled = enabled;
      evaluation.reason = enabled ? 'percentage_rollout_match' : 'percentage_rollout_hold';
      if (enabled && baseMetadata.percentageVariant && !evaluation.variant) {
        evaluation.variant = baseMetadata.percentageVariant;
      }
      return evaluation;
    }

    const result = this.evaluateAssignments(flag, assignments, user, workspaceIds, traits);
    if (result.matched) {
      evaluation.enabled = true;
      evaluation.reason = result.reason;
      evaluation.matchedAudience = result.matchedAudience;
      if (result.variant && !evaluation.variant) {
        evaluation.variant = result.variant;
      }
      if (result.metadata && Object.keys(result.metadata).length) {
        evaluation.metadata = { ...evaluation.metadata, ...result.metadata };
      }
    } else {
      evaluation.reason = result.reason;
    }

    return evaluation;
  }

  evaluateAssignments(flag, assignments, user, workspaceIds, traits) {
    if (!Array.isArray(assignments) || !assignments.length) {
      return { matched: false, reason: 'no_assignments' };
    }

    const now = Date.now();
    for (const assignment of assignments) {
      if (assignment.expiresAt) {
        const expiresAt = new Date(assignment.expiresAt).getTime();
        if (Number.isFinite(expiresAt) && expiresAt < now) {
          continue;
        }
      }

      const evaluation = this.evaluateAssignment(flag, assignment, user, workspaceIds, traits);
      if (evaluation.matched) {
        return evaluation;
      }
    }

    return { matched: false, reason: 'no_matching_assignment' };
  }

  evaluateAssignment(flag, assignment, user, workspaceIds, traits) {
    const matchedAudience = {
      type: assignment.audienceType,
      value: assignment.audienceValue,
      assignmentId: assignment.id ?? null,
    };

    const conditions =
      assignment.conditions && typeof assignment.conditions === 'object' ? assignment.conditions : {};
    const variant =
      conditions.variant ??
      conditions.variantKey ??
      conditions.bucket ??
      conditions.segment ??
      conditions.assignment ??
      null;

    const metadata =
      conditions.metadata && typeof conditions.metadata === 'object' ? conditions.metadata : undefined;

    const applyRolloutGate = () => {
      if (assignment.rolloutPercentage == null) {
        return true;
      }
      const percentage = FeatureFlagService.normalisePercentage(assignment.rolloutPercentage);
      if (percentage === null) {
        return true;
      }
      if (percentage <= 0) {
        return false;
      }
      if (percentage >= 100) {
        return true;
      }
      const seed = `${flag.key}:${assignment.audienceType}:${assignment.audienceValue}:${user.id}`;
      return hashToPercentage(seed) < percentage;
    };

    const lowerValue = typeof assignment.audienceValue === 'string'
      ? assignment.audienceValue.toLowerCase()
      : assignment.audienceValue;

    switch (assignment.audienceType) {
      case 'user': {
        if (Number(lowerValue) === Number(user.id) && applyRolloutGate()) {
          return { matched: true, reason: 'target_user', variant, metadata, matchedAudience };
        }
        break;
      }
      case 'workspace': {
        const numericWorkspaceIds = (workspaceIds ?? []).map((value) => Number(value));
        if (numericWorkspaceIds.includes(Number(lowerValue)) && applyRolloutGate()) {
          return { matched: true, reason: 'target_workspace', variant, metadata, matchedAudience };
        }
        break;
      }
      case 'membership': {
        const membership = typeof lowerValue === 'string' ? lowerValue : `${lowerValue ?? ''}`;
        if (membership && traits.memberships.includes(membership) && applyRolloutGate()) {
          return { matched: true, reason: 'target_membership', variant, metadata, matchedAudience };
        }
        break;
      }
      case 'domain': {
        if (traits.emailDomain && traits.emailDomain === lowerValue && applyRolloutGate()) {
          return { matched: true, reason: 'target_domain', variant, metadata, matchedAudience };
        }
        break;
      }
      default: {
        if (applyRolloutGate()) {
          return { matched: true, reason: 'target_assignment', variant, metadata, matchedAudience };
        }
        break;
      }
    }

    return { matched: false, reason: 'assignment_not_matched' };
  }

  async upsertFlag(payload, { transaction } = {}) {
    const [flag] = await this.FeatureFlag.findOrCreate({
      where: { key: payload.key },
      defaults: {
        key: payload.key,
        name: payload.name ?? payload.key,
        description: payload.description || '',
        status: payload.status || 'draft',
        rolloutType: payload.rolloutType || 'global',
        rolloutPercentage: payload.rolloutPercentage ?? null,
        metadata: payload.metadata ?? {},
      },
      transaction,
    });

    if (payload.status && flag.status !== payload.status) {
      await flag.update({ status: payload.status }, { transaction });
    }
    if (payload.rolloutPercentage != null && flag.rolloutPercentage !== payload.rolloutPercentage) {
      await flag.update({ rolloutPercentage: payload.rolloutPercentage }, { transaction });
    }
    if (payload.metadata) {
      await flag.update({ metadata: { ...flag.metadata, ...payload.metadata } }, { transaction });
    }

    if (Array.isArray(payload.assignments)) {
      await this.FeatureFlagAssignment.destroy({ where: { flagId: flag.id }, transaction });
      await this.FeatureFlagAssignment.bulkCreate(
        payload.assignments.map((assignment) => ({
          flagId: flag.id,
          audienceType: assignment.audienceType,
          audienceValue: assignment.audienceValue,
          rolloutPercentage: assignment.rolloutPercentage ?? null,
          conditions: assignment.conditions ?? null,
          expiresAt: assignment.expiresAt ?? null,
        })),
        { transaction },
      );
    }

    this.logger.info({ flagKey: flag.key }, 'Upserted feature flag configuration.');
    return flag.get({ plain: true });
  }

  async evaluateForUser(user, { workspaceIds = [], traits = {}, transaction } = {}) {
    if (!user || !user.id) {
      throw new Error('evaluateForUser requires a user with an id.');
    }
    const flags = await this.FeatureFlag.findAll({
      include: [{ model: this.FeatureFlagAssignment, as: 'assignments' }],
      order: [['updatedAt', 'DESC']],
      transaction,
    });

    const normalizedTraits = {
      emailDomain: user.email?.split('@')[1]?.toLowerCase() ?? null,
      memberships: Array.isArray(user.memberships) ? user.memberships.map((item) => item.toLowerCase()) : [],
      ...traits,
    };

    const evaluations = {};
    for (const flag of flags) {
      const assignments = Array.isArray(flag.assignments) ? flag.assignments : [];
      evaluations[flag.key] = this.buildEvaluation(flag, {
        assignments,
        user,
        workspaceIds,
        traits: normalizedTraits,
      });
    }
    return evaluations;
  }

  isFlagEnabledForUser(flag, assignments, user, workspaceIds, traits) {
    return this.buildEvaluation(flag, { assignments, user, workspaceIds, traits }).enabled;
  }

  describeCapabilities() {
    return {
      key: 'platform',
      contextName: this.contextName,
      description: 'Feature flag orchestration, rollouts, and cohort assignments.',
      operations: ['upsertFlag', 'evaluateForUser', 'isFlagEnabledForUser'],
      models: Object.keys(this.models),
    };
  }
}

export default FeatureFlagService;
