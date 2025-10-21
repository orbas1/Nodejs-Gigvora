import { Op } from 'sequelize';

import { domainRegistry } from '../models/index.js';
import logger from '../utils/logger.js';
import { ValidationError } from '../utils/errors.js';
import { AuthDomainService } from './auth/authDomainService.js';
import { MarketplaceDomainService } from './marketplace/marketplaceDomainService.js';
import { FeatureFlagService } from './platform/featureFlagService.js';

function createLogger(scopeLogger, moduleName) {
  if (!scopeLogger) {
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
  return scopeLogger.child({ module: moduleName });
}

class VolunteeringDomainService {
  constructor({ domainRegistry: registry, logger: scopeLogger }) {
    this.registry = registry;
    this.logger = createLogger(scopeLogger, 'VolunteeringDomainService');
    this.contextName = 'volunteering';
    this.models = registry.getContextModels(this.contextName);

    const requiredModels = [
      'VolunteeringPost',
      'VolunteeringApplication',
      'VolunteeringApplicationResponse',
      'VolunteeringInterview',
      'VolunteeringContract',
      'VolunteeringContractSpend',
      'VolunteerApplication',
      'VolunteerResponse',
      'VolunteerContract',
      'VolunteerContractSpend',
      'VolunteerContractReview',
    ];

    requiredModels.forEach((modelName) => {
      if (!this.models[modelName]) {
        throw new Error(`Volunteering domain requires model "${modelName}" to be registered.`);
      }
    });

    this.VolunteeringPost = this.models.VolunteeringPost;
    this.VolunteeringApplication = this.models.VolunteeringApplication;
    this.VolunteeringApplicationResponse = this.models.VolunteeringApplicationResponse;
    this.VolunteeringInterview = this.models.VolunteeringInterview;
    this.VolunteeringContract = this.models.VolunteeringContract;
    this.VolunteeringContractSpend = this.models.VolunteeringContractSpend;
    this.VolunteerApplication = this.models.VolunteerApplication;
    this.VolunteerResponse = this.models.VolunteerResponse;
    this.VolunteerContract = this.models.VolunteerContract;
    this.VolunteerContractSpend = this.models.VolunteerContractSpend;
    this.VolunteerContractReview = this.models.VolunteerContractReview;
  }

  normaliseWorkspaceId(workspaceId) {
    const numeric = Number.parseInt(workspaceId, 10);
    if (!Number.isInteger(numeric) || numeric <= 0) {
      throw new ValidationError('A valid workspaceId must be provided.');
    }
    return numeric;
  }

  normaliseUserId(userId) {
    const numeric = Number.parseInt(userId, 10);
    if (!Number.isInteger(numeric) || numeric <= 0) {
      throw new ValidationError('A valid userId must be provided.');
    }
    return numeric;
  }

  resolveDateRange({ lookbackDays, from, to } = {}) {
    let start = from ? new Date(from) : null;
    let end = to ? new Date(to) : null;
    if (start && Number.isNaN(start.getTime())) {
      start = null;
    }
    if (end && Number.isNaN(end.getTime())) {
      end = null;
    }
    const lookback = Number.parseInt(lookbackDays, 10);
    if (!start && Number.isInteger(lookback) && lookback > 0) {
      start = new Date();
      start.setUTCDate(start.getUTCDate() - Math.min(Math.max(lookback, 1), 365));
    }
    return { from: start ?? null, to: end ?? null };
  }

  withTemporalRange(baseWhere, range, field = 'createdAt') {
    if (!range.from && !range.to) {
      return { ...baseWhere };
    }
    const clause = { ...(baseWhere[field] ?? {}) };
    if (range.from) {
      clause[Op.gte] = range.from;
    }
    if (range.to) {
      clause[Op.lte] = range.to;
    }
    return { ...baseWhere, [field]: clause };
  }

  async getWorkspaceMetrics({ workspaceId, lookbackDays = 90, from, to } = {}) {
    const id = this.normaliseWorkspaceId(workspaceId);
    const range = this.resolveDateRange({ lookbackDays, from, to });
    const baseWhere = { workspaceId: id };

    const [
      totalPosts,
      openPosts,
      totalApplications,
      activeApplications,
      totalResponses,
      totalInterviews,
      totalContracts,
      openContracts,
      totalSpend,
      lastApplicationActivity,
      lastContractActivity,
      lastSpendActivity,
    ] = await Promise.all([
      this.VolunteeringPost.count({ where: this.withTemporalRange(baseWhere, range) }),
      this.VolunteeringPost.count({
        where: this.withTemporalRange(
          { ...baseWhere, status: { [Op.notIn]: ['closed', 'archived'] } },
          range,
        ),
      }),
      this.VolunteeringApplication.count({ where: this.withTemporalRange(baseWhere, range) }),
      this.VolunteeringApplication.count({
        where: this.withTemporalRange(
          { ...baseWhere, status: { [Op.notIn]: ['declined', 'withdrawn'] } },
          range,
        ),
      }),
      this.VolunteeringApplicationResponse.count({ where: this.withTemporalRange(baseWhere, range) }),
      this.VolunteeringInterview.count({
        where: this.withTemporalRange(
          { ...baseWhere, status: { [Op.not]: 'cancelled' } },
          range,
        ),
      }),
      this.VolunteeringContract.count({ where: this.withTemporalRange(baseWhere, range) }),
      this.VolunteeringContract.count({
        where: this.withTemporalRange(
          { ...baseWhere, status: { [Op.in]: ['draft', 'active'] } },
          range,
        ),
      }),
      this.VolunteeringContractSpend.sum('amount', {
        where: this.withTemporalRange(baseWhere, range, 'spentAt'),
      }),
      this.VolunteeringApplication.max('updatedAt', { where: { workspaceId: id } }),
      this.VolunteeringContract.max('updatedAt', { where: { workspaceId: id } }),
      this.VolunteeringContractSpend.max('spentAt', { where: { workspaceId: id } }),
    ]);

    const lastActivityCandidate = [lastApplicationActivity, lastContractActivity, lastSpendActivity]
      .map((value) => (value ? new Date(value) : null))
      .filter((date) => date && !Number.isNaN(date.getTime()))
      .sort((a, b) => b.getTime() - a.getTime())[0] || null;

    const lastActivityAt = lastActivityCandidate ? lastActivityCandidate.toISOString() : null;

    const interviewConversionRate = totalApplications
      ? Number(((totalInterviews / totalApplications) * 100).toFixed(2))
      : 0;
    const placementRate = totalApplications
      ? Number(((totalContracts / totalApplications) * 100).toFixed(2))
      : 0;

    return {
      workspaceId: id,
      posts: { total: totalPosts, open: openPosts },
      applications: { total: totalApplications, active: activeApplications },
      responses: totalResponses,
      interviews: { total: totalInterviews, conversionRate: interviewConversionRate },
      contracts: { total: totalContracts, open: openContracts, placementRate },
      spend: {
        total: Number(totalSpend ?? 0),
      },
      lastActivityAt,
      lookback: { from: range.from ? range.from.toISOString() : null, to: range.to ? range.to.toISOString() : null },
    };
  }

  async getVolunteerEngagementSnapshot({ userId, lookbackDays = 180 } = {}) {
    const id = this.normaliseUserId(userId);
    const range = this.resolveDateRange({ lookbackDays });
    const baseWhere = { userId: id };

    const addRange = (where, field = 'createdAt') => this.withTemporalRange({ ...where }, range, field);

    const [
      totalApplications,
      activeApplications,
      totalResponses,
      totalContracts,
      activeContracts,
      contractSpend,
      totalReviews,
    ] = await Promise.all([
      this.VolunteerApplication.count({ where: addRange(baseWhere) }),
      this.VolunteerApplication.count({
        where: addRange({ ...baseWhere, status: { [Op.notIn]: ['withdrawn', 'rejected'] } }),
      }),
      this.VolunteerResponse.count({
        distinct: true,
        where: addRange({}, 'createdAt'),
        include: [
          {
            model: this.VolunteerApplication,
            as: 'application',
            attributes: [],
            required: true,
            where: { userId: id },
          },
        ],
      }),
      this.VolunteerContract.count({
        where: addRange({ userId: id }),
      }),
      this.VolunteerContract.count({
        where: addRange({ userId: id, status: { [Op.in]: ['draft', 'active'] } }),
      }),
      this.VolunteerContractSpend.sum('amount', {
        where: addRange({ recordedById: id }, 'incurredAt'),
      }),
      this.VolunteerContractReview.count({
        where: addRange({ reviewerId: id }),
      }),
    ]);

    return {
      userId: id,
      applications: { total: totalApplications, active: activeApplications },
      responses: totalResponses ?? 0,
      contracts: { total: totalContracts ?? 0, active: activeContracts ?? 0 },
      spend: Number(contractSpend ?? 0),
      reviewsPublished: totalReviews ?? 0,
      lookback: { from: range.from ? range.from.toISOString() : null, to: range.to ? range.to.toISOString() : null },
    };
  }

  describeCapabilities() {
    return {
      key: 'volunteering',
      contextName: this.contextName,
      description: 'Volunteer programme telemetry, workspace metrics, and engagement snapshots.',
      operations: ['getWorkspaceMetrics', 'getVolunteerEngagementSnapshot'],
      models: Object.keys(this.models),
    };
  }
}

const services = {
  auth: new AuthDomainService({ domainRegistry, logger }),
  marketplace: new MarketplaceDomainService({ domainRegistry, logger }),
  platform: new FeatureFlagService({ domainRegistry, logger }),
  volunteering: new VolunteeringDomainService({ domainRegistry, logger }),
};

export function getAuthDomainService() {
  return services.auth;
}

export function getMarketplaceDomainService() {
  return services.marketplace;
}

export function getFeatureFlagService() {
  return services.platform;
}

export function getVolunteeringDomainService() {
  return services.volunteering;
}

export function getDomainServicesSnapshot() {
  const capabilities = Object.fromEntries(
    Object.entries(services).map(([key, service]) => [
      key,
      typeof service.describeCapabilities === 'function' ? service.describeCapabilities() : null,
    ]),
  );
  return {
    contexts: domainRegistry.snapshot(),
    services: capabilities,
  };
}

export default services;
