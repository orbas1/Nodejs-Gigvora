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
    this.models = domainRegistry.getContextModels('platform');
    this.FeatureFlag = this.models.FeatureFlag;
    this.FeatureFlagAssignment = this.models.FeatureFlagAssignment;
    if (!this.FeatureFlag || !this.FeatureFlagAssignment) {
      throw new Error('Platform domain requires FeatureFlag and FeatureFlagAssignment models.');
    }
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
      where: { status: 'active' },
      include: [{ model: this.FeatureFlagAssignment, as: 'assignments' }],
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
      const isEnabled = this.isFlagEnabledForUser(flag, assignments, user, workspaceIds, normalizedTraits);
      evaluations[flag.key] = { enabled: isEnabled, metadata: flag.metadata ?? {} };
    }
    return evaluations;
  }

  isFlagEnabledForUser(flag, assignments, user, workspaceIds, traits) {
    if (flag.status !== 'active') {
      return false;
    }
    if (flag.rolloutType === 'global') {
      return true;
    }
    if (flag.rolloutType === 'percentage') {
      const percentage = flag.rolloutPercentage ?? 0;
      return hashToPercentage(`${flag.key}:${user.id}`) < percentage;
    }

    const effectiveAssignments = assignments.filter((assignment) => {
      if (assignment.expiresAt && new Date(assignment.expiresAt) < new Date()) {
        return false;
      }
      return true;
    });

    for (const assignment of effectiveAssignments) {
      if (assignment.audienceType === 'user' && Number(assignment.audienceValue) === Number(user.id)) {
        return true;
      }
      if (assignment.audienceType === 'workspace' && workspaceIds.includes(Number(assignment.audienceValue))) {
        return true;
      }
      if (assignment.audienceType === 'membership') {
        const membership = assignment.audienceValue?.toLowerCase();
        if (membership && traits.memberships.includes(membership)) {
          return true;
        }
      }
      if (assignment.audienceType === 'domain') {
        const domain = assignment.audienceValue?.toLowerCase();
        if (domain && traits.emailDomain && domain === traits.emailDomain) {
          return true;
        }
      }
      if (assignment.rolloutPercentage != null) {
        const seed = `${flag.key}:${assignment.audienceType}:${assignment.audienceValue}:${user.id}`;
        if (hashToPercentage(seed) < assignment.rolloutPercentage) {
          return true;
        }
      }
    }

    return false;
  }
}

export default FeatureFlagService;
