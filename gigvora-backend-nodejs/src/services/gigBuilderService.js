import { literal } from 'sequelize';
import {
  Gig,
  GigPackage,
  GigAddon,
  GigMediaAsset,
  GigCallToAction,
  GigPreviewLayout,
  GigPerformanceSnapshot,
  User,
} from '../models/index.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

function assertFreelancer(user) {
  if (!user) {
    throw new NotFoundError('Freelancer not found.');
  }
  if (!['freelancer', 'agency'].includes(user.userType)) {
    throw new ValidationError('User does not have gig building permissions.');
  }
}

function normalizeId(value, label = 'id') {
  const numeric = Number(value);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new ValidationError(`${label} must be a positive integer.`);
  }
  return numeric;
}

function formatMoney(amount, currency = 'USD') {
  if (amount == null) {
    return null;
  }
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(amount));
  } catch (error) {
    return Number(amount);
  }
}

function buildPrice(amount, currency) {
  return {
    amount: amount == null ? null : Number(amount),
    currency: currency || 'USD',
    formatted: amount == null ? null : formatMoney(amount, currency || 'USD'),
  };
}

function computePriceRange(packages) {
  return packages.reduce(
    (acc, pkg) => {
      if (pkg.priceAmount == null) {
        return acc;
      }
      const price = Number(pkg.priceAmount);
      if (acc.min == null || price < acc.min) {
        acc.min = price;
      }
      if (acc.max == null || price > acc.max) {
        acc.max = price;
      }
      return acc;
    },
    { min: null, max: null },
  );
}

function decoratePackage(pkg) {
  const base = pkg.toBuilderObject();
  return {
    ...base,
    price: buildPrice(base.priceAmount, base.priceCurrency),
  };
}

function decorateAddon(addon) {
  const base = addon.toBuilderObject();
  return {
    ...base,
    price: buildPrice(base.priceAmount, base.priceCurrency),
  };
}

function decoratePreview(preview) {
  const base = preview.toBuilderObject();
  const layout = base.layoutSettings ?? {};
  return {
    ...base,
    layout,
    metrics: {
      conversionRate: base.conversionRate,
      formattedConversionRate:
        base.conversionRate == null ? null : `${Number(base.conversionRate).toFixed(1)}%`,
    },
  };
}

function decoratePerformance(snapshot, gig) {
  if (!snapshot) {
    return {
      periodLabel: null,
      conversionRate: null,
      averageOrderValue: null,
      completionRate: null,
      upsellTakeRate: null,
      reviewScore: null,
      bookingsLast30Days: null,
      experimentNotes: {},
      baseline: gig.analyticsSettings?.baseline ?? null,
    };
  }
  const base = snapshot.toBuilderObject();
  return {
    ...base,
    conversionRateFormatted:
      base.conversionRate == null ? null : `${Number(base.conversionRate).toFixed(1)}%`,
    averageOrderValueFormatted: buildPrice(base.averageOrderValue, 'USD').formatted,
    completionRateFormatted:
      base.completionRate == null ? null : `${Number(base.completionRate).toFixed(1)}%`,
    upsellTakeRateFormatted:
      base.upsellTakeRate == null ? null : `${Number(base.upsellTakeRate).toFixed(1)}%`,
    baseline: gig.analyticsSettings?.baseline ?? null,
  };
}

function selectActivePreview(previews) {
  if (!Array.isArray(previews) || previews.length === 0) {
    return null;
  }
  const priority = ['desktop', 'tablet', 'mobile'];
  return (
    previews.find((preview) => priority.includes(preview.deviceType)) || previews[0]
  );
}

export async function getFreelancerGigBuilder({ freelancerId, gigId, transaction } = {}) {
  const normalizedFreelancerId = normalizeId(freelancerId, 'freelancerId');
  const user = await User.findByPk(normalizedFreelancerId, { transaction });
  assertFreelancer(user);

  const gigWhere = { ownerId: normalizedFreelancerId };
  if (gigId) {
    gigWhere.id = normalizeId(gigId, 'gigId');
  }

  const gig = await Gig.findOne({
    where: gigWhere,
    include: [
      {
        model: GigPackage,
        as: 'packages',
        separate: true,
        order: [
          ['isBestValue', 'DESC'],
          ['priceAmount', 'ASC'],
        ],
      },
      {
        model: GigAddon,
        as: 'addons',
        separate: true,
        order: [['priceAmount', 'ASC']],
      },
      {
        model: GigMediaAsset,
        as: 'mediaAssets',
        separate: true,
        order: [['displayOrder', 'ASC']],
      },
      {
        model: GigCallToAction,
        as: 'callToActions',
        separate: true,
        order: [['expectedLift', 'DESC']],
      },
      {
        model: GigPreviewLayout,
        as: 'previewLayouts',
        separate: true,
        order: [['deviceType', 'ASC']],
      },
      {
        model: GigPerformanceSnapshot,
        as: 'performanceSnapshots',
        separate: true,
        limit: 3,
        order: [['snapshotDate', 'DESC']],
      },
    ],
    order: [
      [
        literal(
          `CASE "Gig"."status" WHEN 'published' THEN 0 WHEN 'preview' THEN 1 WHEN 'draft' THEN 2 ELSE 3 END`,
        ),
        'ASC',
      ],
      ['updatedAt', 'DESC'],
    ],
    transaction,
  });

  if (!gig) {
    throw new NotFoundError('Gig builder data not found for freelancer.');
  }

  const gigPayload = gig.toBuilderObject();
  const packages = (gig.packages || []).map(decoratePackage);
  const addons = (gig.addons || []).map(decorateAddon);
  const media = (gig.mediaAssets || []).map((asset) => asset.toBuilderObject());
  const callToActions = (gig.callToActions || []).map((cta) => cta.toBuilderObject());
  const previews = (gig.previewLayouts || []).map(decoratePreview);
  const latestSnapshot = Array.isArray(gig.performanceSnapshots)
    ? gig.performanceSnapshots[0] ?? null
    : null;

  const priceRange = computePriceRange(packages);
  const activePreview = selectActivePreview(previews);

  const response = {
    freelancer: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      userType: user.userType,
    },
    gig: gigPayload,
    pricing: {
      packages,
      priceRange,
      formattedRange:
        priceRange.min == null
          ? null
          : `${formatMoney(priceRange.min, packages[0]?.priceCurrency ?? 'USD')} - ${formatMoney(
              priceRange.max,
              packages[0]?.priceCurrency ?? 'USD',
            )}`,
    },
    addons,
    media,
    callToActions: callToActions.map((cta) => ({
      ...cta,
      expectedLiftFormatted:
        cta.expectedLift == null ? null : `+${Number(cta.expectedLift).toFixed(1)}%`,
    })),
    previews,
    previewSummary: {
      activeDevice: activePreview?.deviceType ?? null,
      activePreview,
      availableDevices: previews.map((preview) => preview.deviceType),
    },
    performance: decoratePerformance(latestSnapshot, gigPayload),
    requirements: gigPayload.requirements,
    sellingPoints: gigPayload.sellingPoints,
    faqs: gigPayload.faqs,
    conversionCopy: gigPayload.conversionCopy,
  };

  return response;
}

export default {
  getFreelancerGigBuilder,
};
