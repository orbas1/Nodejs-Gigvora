import { Op, fn, col } from 'sequelize';
import {
  User,
  Profile,
  ProfileReference,
  EscrowAccount,
  EscrowTransaction,
  SupportCase,
  DisputeCase,
  AnalyticsEvent,
  Notification,
  ESCROW_ACCOUNT_STATUSES,
  ESCROW_TRANSACTION_STATUSES,
  SUPPORT_CASE_STATUSES,
  SUPPORT_CASE_PRIORITIES,
  DISPUTE_PRIORITIES,
  DISPUTE_STAGES,
  ANALYTICS_ACTOR_TYPES,
} from '../models/index.js';
import { getLaunchpadDashboard } from './launchpadService.js';
import { appCache, buildCacheKey } from '../utils/cache.js';
import { getAdDashboardSnapshot } from './adService.js';

const DASHBOARD_CACHE_TTL = 45; // seconds

function parseInteger(value) {
  const number = Number.parseInt(value ?? 0, 10);
  return Number.isNaN(number) ? 0 : number;
}

function parseDecimal(value, precision = 2) {
  const number = Number.parseFloat(value ?? 0);
  if (Number.isNaN(number)) {
    return 0;
  }
  return Number.parseFloat(number.toFixed(precision));
}

function normaliseCounts(rows, key) {
  return rows.reduce((acc, row) => {
    const label = row[key];
    if (!label) {
      return acc;
    }
    const countValue = row.count ?? row.dataValues?.count;
    acc[label] = parseInteger(countValue);
    return acc;
  }, {});
}

function ensureAllKeys(source, keys) {
  const result = {};
  keys.forEach((key) => {
    result[key] = source[key] ?? 0;
  });
  return result;
}

function computeAverageDurations(records, { startKey, endKey }) {
  if (!Array.isArray(records) || !records.length) {
    return 0;
  }
  let total = 0;
  let count = 0;
  records.forEach((record) => {
    const start = record[startKey] ? new Date(record[startKey]) : null;
    const end = record[endKey] ? new Date(record[endKey]) : null;
    if (start && end && end.getTime() >= start.getTime()) {
      total += end.getTime() - start.getTime();
      count += 1;
    }
  });
  if (!count) {
    return 0;
  }
  return total / count / (1000 * 60); // minutes
}

function buildDailyCounts(events) {
  const buckets = new Map();
  events.forEach((event) => {
    const occurredAt = event.occurredAt ? new Date(event.occurredAt) : null;
    if (!occurredAt) {
      return;
    }
    const dateKey = occurredAt.toISOString().slice(0, 10);
    buckets.set(dateKey, (buckets.get(dateKey) ?? 0) + 1);
  });
  return Array.from(buckets.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([date, count]) => ({ date, count }));
}

export async function getAdminDashboardSnapshot(options = {}) {
  const lookbackDays = Number.isFinite(options.lookbackDays) && options.lookbackDays > 0 ? options.lookbackDays : 30;
  const eventWindowDays = Number.isFinite(options.eventWindowDays) && options.eventWindowDays > 0 ? options.eventWindowDays : 7;

  const now = new Date();
  const lookbackDate = new Date(now.getTime() - lookbackDays * 24 * 60 * 60 * 1000);
  const eventWindowDate = new Date(now.getTime() - eventWindowDays * 24 * 60 * 60 * 1000);

  const cacheKey = buildCacheKey('admin:dashboard', { lookbackDays, eventWindowDays });

  return appCache.remember(cacheKey, DASHBOARD_CACHE_TTL, async () => {
    const [
      userBreakdownRows,
      newUserBreakdownRows,
      totalProfiles,
      activeProfiles,
      highTrustProfiles,
      avgProfileCompletionRow,
      verifiedReferences,
      escrowAggregateRow,
      transactionsByStatusRows,
      accountsByStatusRows,
      recentTransactionRecords,
      disputesOpenCount,
      disputesByStageRows,
      disputesByPriorityRows,
      recentDisputeRecords,
      supportStatusRows,
      supportPriorityRows,
      recentSupportRecords,
      supportResponseSamples,
      supportResolutionSamples,
      analyticsEventsWindowRows,
      analyticsActorRows,
      analyticsByEventRows,
      latestAnalyticsRows,
      notificationStatusRows,
      criticalNotificationsCount,
      launchpadDashboard,
    ] = await Promise.all([
      User.findAll({
        attributes: ['userType', [fn('COUNT', col('id')), 'count']],
        group: ['userType'],
        raw: true,
      }),
      User.findAll({
        attributes: ['userType', [fn('COUNT', col('id')), 'count']],
        where: { createdAt: { [Op.gte]: lookbackDate } },
        group: ['userType'],
        raw: true,
      }),
      Profile.count(),
      Profile.count({ where: { availabilityStatus: { [Op.ne]: 'unavailable' } } }),
      Profile.count({ where: { trustScore: { [Op.gte]: 80 } } }),
      Profile.findOne({ attributes: [[fn('AVG', col('profileCompletion')), 'avgCompletion']], raw: true }),
      ProfileReference.count({ where: { isVerified: true } }),
      EscrowTransaction.findOne({
        attributes: [
          [fn('COALESCE', fn('SUM', col('amount')), 0), 'grossVolume'],
          [fn('COALESCE', fn('SUM', col('feeAmount')), 0), 'fees'],
          [fn('COALESCE', fn('SUM', col('netAmount')), 0), 'netVolume'],
        ],
        where: { createdAt: { [Op.gte]: lookbackDate } },
        raw: true,
      }),
      EscrowTransaction.findAll({
        attributes: ['status', [fn('COUNT', col('id')), 'count']],
        group: ['status'],
        raw: true,
      }),
      EscrowAccount.findAll({
        attributes: [
          'status',
          [fn('COUNT', col('id')), 'count'],
          [fn('COALESCE', fn('SUM', col('pendingReleaseTotal')), 0), 'pendingTotal'],
        ],
        group: ['status'],
        raw: true,
      }),
      EscrowTransaction.findAll({
        include: [{ model: EscrowAccount, as: 'account', attributes: ['id', 'provider', 'currencyCode'] }],
        order: [['createdAt', 'DESC']],
        limit: 5,
      }),
      DisputeCase.count({ where: { status: { [Op.ne]: 'closed' } } }),
      DisputeCase.findAll({
        attributes: ['stage', [fn('COUNT', col('id')), 'count']],
        group: ['stage'],
        raw: true,
      }),
      DisputeCase.findAll({
        attributes: ['priority', [fn('COUNT', col('id')), 'count']],
        group: ['priority'],
        raw: true,
      }),
      DisputeCase.findAll({
        include: [
          {
            model: EscrowTransaction,
            as: 'transaction',
            attributes: ['id', 'reference', 'amount', 'currencyCode', 'status', 'type'],
          },
        ],
        order: [['updatedAt', 'DESC']],
        limit: 5,
      }),
      SupportCase.findAll({
        attributes: ['status', [fn('COUNT', col('id')), 'count']],
        group: ['status'],
        raw: true,
      }),
      SupportCase.findAll({
        attributes: ['priority', [fn('COUNT', col('id')), 'count']],
        group: ['priority'],
        raw: true,
      }),
      SupportCase.findAll({
        order: [['updatedAt', 'DESC']],
        limit: 5,
      }),
      SupportCase.findAll({
        attributes: ['escalatedAt', 'firstResponseAt'],
        where: { firstResponseAt: { [Op.ne]: null } },
        order: [['firstResponseAt', 'DESC']],
        limit: 200,
        raw: true,
      }),
      SupportCase.findAll({
        attributes: ['escalatedAt', 'resolvedAt'],
        where: { resolvedAt: { [Op.ne]: null } },
        order: [['resolvedAt', 'DESC']],
        limit: 200,
        raw: true,
      }),
      AnalyticsEvent.findAll({
        where: { occurredAt: { [Op.gte]: eventWindowDate } },
        order: [['occurredAt', 'ASC']],
        limit: 1000,
        raw: true,
      }),
      AnalyticsEvent.findAll({
        attributes: ['actorType', [fn('COUNT', col('id')), 'count']],
        where: { occurredAt: { [Op.gte]: eventWindowDate } },
        group: ['actorType'],
        raw: true,
      }),
      AnalyticsEvent.findAll({
        attributes: ['eventName', [fn('COUNT', col('id')), 'count']],
        where: { occurredAt: { [Op.gte]: eventWindowDate } },
        group: ['eventName'],
        raw: true,
      }),
      AnalyticsEvent.findAll({ order: [['occurredAt', 'DESC']], limit: 5 }),
      Notification.findAll({
        attributes: ['status', [fn('COUNT', col('id')), 'count']],
        group: ['status'],
        raw: true,
      }),
      Notification.count({ where: { priority: 'critical', status: { [Op.ne]: 'read' } } }),
      getLaunchpadDashboard(undefined, { lookbackDays: Math.max(lookbackDays, 60) }),
    ]);

    const userBreakdown = ensureAllKeys(normaliseCounts(userBreakdownRows, 'userType'), [
      'user',
      'company',
      'freelancer',
      'agency',
      'admin',
    ]);
    const newUserBreakdown = ensureAllKeys(normaliseCounts(newUserBreakdownRows, 'userType'), [
      'user',
      'company',
      'freelancer',
      'agency',
      'admin',
    ]);

    const transactionsByStatus = ensureAllKeys(normaliseCounts(transactionsByStatusRows, 'status'), ESCROW_TRANSACTION_STATUSES);
    const accountsByStatus = ensureAllKeys(normaliseCounts(accountsByStatusRows, 'status'), ESCROW_ACCOUNT_STATUSES);
    const disputesByStage = ensureAllKeys(normaliseCounts(disputesByStageRows, 'stage'), DISPUTE_STAGES);
    const disputesByPriority = ensureAllKeys(normaliseCounts(disputesByPriorityRows, 'priority'), DISPUTE_PRIORITIES);
    const supportCasesByStatus = ensureAllKeys(normaliseCounts(supportStatusRows, 'status'), SUPPORT_CASE_STATUSES);
    const supportCasesByPriority = ensureAllKeys(normaliseCounts(supportPriorityRows, 'priority'), SUPPORT_CASE_PRIORITIES);
    const analyticsByActor = ensureAllKeys(normaliseCounts(analyticsActorRows, 'actorType'), ANALYTICS_ACTOR_TYPES);
    const notificationsByStatus = normaliseCounts(notificationStatusRows, 'status');

    const recentTransactions = recentTransactionRecords.map((record) => {
      const transaction = record.toPublicObject();
      const account = record.account ? record.account.toPublicObject() : null;
      return {
        ...transaction,
        account,
      };
    });

    const recentDisputes = recentDisputeRecords.map((record) => {
      const dispute = record.toPublicObject();
      const transaction = record.transaction ? record.transaction.toPublicObject() : null;
      return {
        ...dispute,
        transaction,
      };
    });

    const recentSupportCases = recentSupportRecords.map((record) => record.get({ plain: true }));

    const averageFirstResponseMinutes = computeAverageDurations(supportResponseSamples, {
      startKey: 'escalatedAt',
      endKey: 'firstResponseAt',
    });

    const averageResolutionMinutes = computeAverageDurations(supportResolutionSamples, {
      startKey: 'escalatedAt',
      endKey: 'resolvedAt',
    });

    const analyticsEventsByName = analyticsByEventRows
      .map((row) => ({ eventName: row.eventName, count: parseInteger(row.count) }))
      .sort((a, b) => b.count - a.count);

    const topAnalyticsEvents = analyticsEventsByName.slice(0, 5);

    const analyticsDaily = buildDailyCounts(analyticsEventsWindowRows);

    const latestAnalyticsEvents = latestAnalyticsRows.map((record) => record.get({ plain: true }));

    const grossVolume = parseDecimal(escrowAggregateRow?.grossVolume ?? 0, 2);
    const fees = parseDecimal(escrowAggregateRow?.fees ?? 0, 2);
    const netVolume = parseDecimal(escrowAggregateRow?.netVolume ?? 0, 2);

    const pendingReleaseTotal = accountsByStatusRows.reduce((sum, row) => {
      const pending = parseDecimal(row.pendingTotal ?? 0, 2);
      return sum + pending;
    }, 0);

    const adKeywordHints = [
      ...Object.keys(userBreakdown ?? {}),
      ...topAnalyticsEvents.map((event) => event.eventName),
    ].filter(Boolean);

    const ads = await getAdDashboardSnapshot({
      surfaces: ['admin_dashboard', 'global_dashboard'],
      context: { keywordHints: adKeywordHints },
    });

    return {
      refreshedAt: new Date().toISOString(),
      lookbackDays,
      eventWindowDays,
      summary: {
        totals: {
          userBreakdown,
          totalUsers: Object.values(userBreakdown).reduce((sum, value) => sum + value, 0),
          totalProfiles,
          activeProfiles,
          highTrustProfiles,
          averageProfileCompletion: parseDecimal(avgProfileCompletionRow?.avgCompletion ?? 0, 1),
          verifiedReferences,
        },
        growth: {
          newUsers: newUserBreakdown,
          totalNewUsers: Object.values(newUserBreakdown).reduce((sum, value) => sum + value, 0),
        },
      },
      financials: {
        grossEscrowVolume: grossVolume,
        escrowFees: fees,
        netEscrowVolume: netVolume,
        pendingReleaseTotal: parseDecimal(pendingReleaseTotal, 2),
        transactionsByStatus,
        accountsByStatus,
        recentTransactions,
      },
      trust: {
        openDisputes: disputesOpenCount,
        disputesByStage,
        disputesByPriority,
        recentDisputes,
      },
      support: {
        openCases: Object.entries(supportCasesByStatus)
          .filter(([status]) => !['resolved', 'closed'].includes(status))
          .reduce((sum, [, count]) => sum + count, 0),
        casesByStatus: supportCasesByStatus,
        casesByPriority: supportCasesByPriority,
        averageFirstResponseMinutes: parseDecimal(averageFirstResponseMinutes, 1),
        averageResolutionMinutes: parseDecimal(averageResolutionMinutes, 1),
        recentCases: recentSupportCases,
      },
      analytics: {
        eventsLastWindow: analyticsEventsWindowRows.length,
        eventsByActorType: analyticsByActor,
        topEvents: topAnalyticsEvents,
        dailyEvents: analyticsDaily,
        latestEvents: latestAnalyticsEvents,
      },
      notifications: {
        byStatus: notificationsByStatus,
        criticalOpen: parseInteger(criticalNotificationsCount),
      },
      launchpad: launchpadDashboard,
      ads,
    };
  });
}

export default {
  getAdminDashboardSnapshot,
};
