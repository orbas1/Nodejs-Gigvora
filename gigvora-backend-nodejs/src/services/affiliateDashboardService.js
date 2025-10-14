import { Op } from 'sequelize';
import { ClientSuccessAffiliateLink } from '../models/index.js';
import { getAffiliateSettings } from './affiliateSettingsService.js';
import { ValidationError } from '../utils/errors.js';

function normaliseUserId(userId) {
  const numeric = Number.parseInt(userId, 10);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new ValidationError('A valid user id is required for affiliate analytics.');
  }
  return numeric;
}

function centsToAmount(cents) {
  if (cents == null) {
    return 0;
  }
  const numeric = Number(cents);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return Math.max(0, numeric) / 100;
}

function calculateTierForAmount(tiers, amount) {
  if (!Array.isArray(tiers) || !tiers.length) {
    return null;
  }
  const sorted = [...tiers].sort((a, b) => (a.minValue ?? 0) - (b.minValue ?? 0));
  return (
    sorted.find((tier) => {
      if (tier.maxValue == null) {
        return amount >= (tier.minValue ?? 0);
      }
      return amount >= (tier.minValue ?? 0) && amount <= tier.maxValue;
    }) ?? sorted[sorted.length - 1]
  );
}

function computeCommissionForAmount(amount, settings) {
  const tier = calculateTierForAmount(settings.tiers, amount);
  const applicableRate = tier?.rate ?? settings.defaultCommissionRate ?? 0;
  const commission = Number(((amount * applicableRate) / 100).toFixed(2));
  return { commission, rate: applicableRate, tier };
}

function buildPayoutSchedule(settings, overview) {
  const frequency = settings.payouts?.frequency ?? 'monthly';
  const now = new Date();
  const nextPayout = new Date(now);
  if (frequency === 'weekly') {
    nextPayout.setDate(now.getDate() + 7);
  } else if (frequency === 'biweekly') {
    nextPayout.setDate(now.getDate() + 14);
  } else if (frequency === 'quarterly') {
    nextPayout.setMonth(now.getMonth() + 3);
  } else {
    nextPayout.setMonth(now.getMonth() + 1);
  }

  const recurrence = settings.payouts?.recurrence ?? { type: 'infinite', limit: null };
  let remaining = null;
  if (recurrence.type === 'finite') {
    const cap = Number(recurrence.limit ?? 0);
    if (Number.isFinite(cap) && cap > 0) {
      const consumed = Number(overview.totalCommissionedConversions ?? 0);
      remaining = Math.max(cap - consumed, 0);
    }
  } else if (recurrence.type === 'one_time') {
    remaining = overview.totalCommissionedConversions > 0 ? 0 : 1;
  }

  return {
    frequency,
    nextPayoutAt: nextPayout.toISOString(),
    minimumThreshold: settings.payouts?.minimumPayoutThreshold ?? 0,
    autoApprove: Boolean(settings.payouts?.autoApprove),
    recurrence,
    remainingEligibleConversions: remaining,
  };
}

function normaliseReferralActivity(link) {
  const metadata = link.metadata ?? {};
  const referrals = Array.isArray(metadata.referrals) ? metadata.referrals : [];
  return referrals
    .map((referral, index) => {
      const amount = Number(referral.amount ?? referral.value ?? 0);
      const currency = referral.currency ?? link.revenueCurrency ?? 'USD';
      const convertedAmount = Number.isFinite(amount) ? amount : 0;
      return {
        id: referral.id ?? `${link.id}-${index}`,
        name: referral.name ?? referral.email ?? 'Referral',
        status: referral.status ?? 'pending',
        occurredAt: referral.occurredAt ?? referral.createdAt ?? link.updatedAt,
        amount: convertedAmount,
        currency,
        source: referral.source ?? metadata.source ?? 'direct',
      };
    })
    .sort((a, b) => new Date(b.occurredAt ?? 0).getTime() - new Date(a.occurredAt ?? 0).getTime());
}

function calculateOverview(links, settings) {
  let lifetimeRevenue = 0;
  let lifetimeCommission = 0;
  let lifetimeClicks = 0;
  let lifetimeConversions = 0;
  let paidOut = 0;
  let pendingPayouts = 0;
  const referralActivity = [];

  links.forEach((link) => {
    lifetimeRevenue += centsToAmount(link.totalRevenueCents);
    lifetimeClicks += Number(link.totalClicks ?? 0);
    lifetimeConversions += Number(link.totalConversions ?? 0);
    const { commission } = computeCommissionForAmount(centsToAmount(link.totalRevenueCents), settings);
    lifetimeCommission += commission;

    const payouts = Array.isArray(link.metadata?.payouts) ? link.metadata.payouts : [];
    payouts.forEach((payout) => {
      const amount = Number(payout.amount ?? 0);
      if (payout.status === 'paid') {
        paidOut += amount;
      } else if (payout.status === 'pending') {
        pendingPayouts += amount;
      }
    });

    referralActivity.push(...normaliseReferralActivity(link));
  });

  const conversionRate = lifetimeClicks > 0 ? Number(((lifetimeConversions / lifetimeClicks) * 100).toFixed(2)) : 0;

  return {
    lifetimeRevenue: Number(lifetimeRevenue.toFixed(2)),
    lifetimeEarnings: Number(lifetimeCommission.toFixed(2)),
    pendingPayouts: Number(pendingPayouts.toFixed(2)),
    paidOut: Number(paidOut.toFixed(2)),
    lifetimeClicks,
    lifetimeConversions,
    conversionRate,
    referralActivity,
    totalCommissionedConversions: lifetimeConversions,
  };
}

function decorateLinks(links, settings) {
  return links.map((link) => {
    const revenueAmount = centsToAmount(link.totalRevenueCents);
    const commissionContext = computeCommissionForAmount(revenueAmount, settings);
    const referrals = normaliseReferralActivity(link);
    const topReferral = referrals[0] ?? null;

    return {
      id: link.id,
      label: link.label ?? `Affiliate ${link.code}`,
      code: link.code,
      status: link.status,
      destinationUrl: link.destinationUrl,
      commissionRate: commissionContext.rate,
      estimatedCommission: commissionContext.commission,
      totalRevenue: Number(revenueAmount.toFixed(2)),
      currency: link.revenueCurrency ?? settings.currency ?? 'USD',
      totalClicks: Number(link.totalClicks ?? 0),
      totalConversions: Number(link.totalConversions ?? 0),
      tier: commissionContext.tier ? commissionContext.tier.name : null,
      topReferral,
      createdAt: link.createdAt,
      updatedAt: link.updatedAt,
    };
  });
}

function buildInsights(overview, links) {
  const topLink = [...links].sort((a, b) => b.estimatedCommission - a.estimatedCommission)[0] ?? null;
  return {
    topPerformer: topLink
      ? {
          label: topLink.label,
          commission: topLink.estimatedCommission,
          conversions: topLink.totalConversions,
        }
      : null,
    conversionHealth: overview.conversionRate >= 30 ? 'excellent' : overview.conversionRate >= 15 ? 'healthy' : 'emerging',
    diversificationScore: links.length >= 5 ? 'broad' : links.length >= 3 ? 'focused' : 'limited',
  };
}

export async function getAffiliateDashboard(userId) {
  const normalizedUserId = normaliseUserId(userId);
  const [settings, linkRows] = await Promise.all([
    getAffiliateSettings(),
    ClientSuccessAffiliateLink.findAll({
      where: { freelancerId: normalizedUserId, status: { [Op.ne]: 'archived' } },
      order: [['updatedAt', 'DESC']],
    }),
  ]);

  const publicLinks = linkRows.map((row) => row.toPublicObject?.() ?? row.get?.({ plain: true }) ?? row);
  const overview = calculateOverview(publicLinks, settings);
  const links = decorateLinks(publicLinks, settings);
  const payoutSchedule = buildPayoutSchedule(settings, overview);
  const insights = buildInsights(overview, links);

  const securityPosture = {
    twoFactorRequired: Boolean(settings.compliance?.twoFactorRequired),
    kycRequired: Boolean(settings.compliance?.payoutKyc),
    requiredDocuments: Array.isArray(settings.compliance?.requiredDocuments)
      ? settings.compliance.requiredDocuments
      : [],
  };

  return {
    overview: {
      ...overview,
      currency: settings.currency ?? 'USD',
      referralWindowDays: settings.referralWindowDays,
    },
    links,
    referrals: overview.referralActivity,
    tiers: settings.tiers,
    payoutSchedule,
    settings: {
      enabled: settings.enabled,
      defaultCommissionRate: settings.defaultCommissionRate,
      referralWindowDays: settings.referralWindowDays,
      currency: settings.currency,
      payouts: settings.payouts,
    },
    insights,
    security: securityPosture,
    updatedAt: new Date().toISOString(),
  };
}

export default {
  getAffiliateDashboard,
};
