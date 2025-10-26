import { Op } from 'sequelize';
import {
  sequelize,
  Job,
  Gig,
  Project,
  ExperienceLaunchpad,
  Volunteering,
  MentorProfile,
  MentorAvailabilitySlot,
  MentorPackage,
  MentorReview,
  MentorshipOrder,
  User,
  Profile,
  OpportunityTaxonomyAssignment,
  OpportunityTaxonomy,
  MENTOR_AVAILABILITY_STATUSES,
  MENTOR_PRICE_TIERS,
} from '../models/index.js';
import { appCache, buildCacheKey } from '../utils/cache.js';
import { ApplicationError, ValidationError } from '../utils/errors.js';

import {
  searchOpportunityIndex,
  searchAcrossOpportunityIndexes,
  isRemoteRole,
  parseBudgetValue,
  extractCurrencyCode,
  determineDurationCategory,
} from './searchIndexService.js';
import {
  CATEGORY_FACETS,
  TAXONOMY_ENABLED_CATEGORIES,
  parseFiltersInput,
  normaliseViewport,
  applyStructuredFilters,
  resolveSortExpressions,
  normalisePage,
  normalisePageSize,
  normaliseLimit,
  normaliseTaxonomyFilterTokens,
} from './opportunityQueryNormaliser.js';
import { annotateWithScores } from './opportunityScoringService.js';

const DIALECT = sequelize.getDialect();
const SNAPSHOT_CACHE_TTL_SECONDS = 60;

const opportunityModels = {
  job: Job,
  gig: Gig,
  project: Project,
  launchpad: ExperienceLaunchpad,
  volunteering: Volunteering,
};

const PRICE_TIER_LABELS = {
  tier_entry: 'Up to £150/session',
  tier_growth: '£150-£300/session',
  tier_scale: '£300+/session',
};

const AVAILABILITY_LABELS = {
  open: 'Open slots',
  waitlist: 'Waitlist',
  booked_out: 'Booked out',
};

const CURRENCY_SYMBOLS = {
  GBP: '£',
  USD: '$',
  EUR: '€',
  CAD: '$',
  AUD: '$',
  SGD: '$',
};

function coerceArray(value) {
  if (Array.isArray(value)) {
    return value
      .map((entry) => (entry == null ? '' : `${entry}`.trim()))
      .filter((entry) => entry.length > 0);
  }
  if (value == null || value === '') {
    return [];
  }
  const trimmed = `${value}`.trim();
  return trimmed ? [trimmed] : [];
}

function normaliseClientFilters(raw = {}) {
  const filters = {};

  const assign = (sourceKeys, targetKey) => {
    const values = sourceKeys.flatMap((key) => coerceArray(raw[key]));
    if (values.length) {
      filters[targetKey] = values;
    }
  };

  assign(['employmentType', 'employmentTypes'], 'employmentType');
  assign(['employmentCategory', 'employmentCategories'], 'employmentCategory');
  assign(['durationCategory', 'durationCategories', 'deliverySpeed', 'deliverySpeeds'], 'durationCategory');
  assign(['budgetCurrency', 'budgetCurrencies'], 'budgetCurrency');
  assign(['status', 'statuses'], 'status');
  assign(['track', 'tracks'], 'track');
  assign(['organization', 'organizations'], 'organization');
  assign(['location', 'locations'], 'location');
  assign(['geoCountry', 'countries'], 'geoCountry');
  assign(['geoRegion', 'regions'], 'geoRegion');
  assign(['geoCity', 'cities'], 'geoCity');
  assign(['taxonomySlugs'], 'taxonomySlugs');
  assign(['taxonomyTypes'], 'taxonomyTypes');

  if (raw.isRemote !== undefined) {
    filters.isRemote = raw.isRemote === true || raw.isRemote === 'true' || raw.isRemote === '1';
  }

  if (raw.updatedWithin) {
    filters.updatedWithin = `${raw.updatedWithin}`;
  }

  const parseBudgetNumber = (value) => {
    if (value == null || value === '') {
      return null;
    }
    const numeric = Number.parseFloat(`${value}`.replace(/[^0-9.]/g, ''));
    if (!Number.isFinite(numeric)) {
      return null;
    }
    return Math.max(0, Math.round(numeric));
  };

  const minBudget = parseBudgetNumber(raw.budgetValueMin ?? raw.budgetMin);
  if (minBudget != null) {
    filters.budgetValueMin = minBudget;
  }

  const maxBudget = parseBudgetNumber(raw.budgetValueMax ?? raw.budgetMax);
  if (maxBudget != null) {
    filters.budgetValueMax = maxBudget;
  }

  if (Array.isArray(filters.durationCategory) && filters.durationCategory.length) {
    const uniqueDurations = Array.from(
      new Set(
        filters.durationCategory
          .map((value) => `${value}`.trim())
          .filter((value) => value.length > 0),
      ),
    );
    filters.durationCategory = uniqueDurations;
    if (!filters.durationCategory.length) {
      delete filters.durationCategory;
    }
  }

  return filters;
}

function resolveCurrencySymbol(currency) {
  if (!currency) {
    return null;
  }
  const trimmed = `${currency}`.trim();
  if (!trimmed) {
    return null;
  }
  const upper = trimmed.toUpperCase();
  if (CURRENCY_SYMBOLS[upper]) {
    return CURRENCY_SYMBOLS[upper];
  }
  return upper.length === 3 ? upper : trimmed;
}

function normaliseStringList(value) {
  return coerceArray(value);
}

function formatCurrencyLabel(amount, currency) {
  if (amount == null || Number.isNaN(Number(amount))) {
    return null;
  }

  const numericAmount = Number(amount);
  const currencyCode = typeof currency === 'string' && currency.trim().length ? currency.trim().toUpperCase() : 'GBP';
  const symbol = resolveCurrencySymbol(currencyCode);

  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currencyCode,
      currencyDisplay: symbol && symbol.length === 1 ? 'symbol' : 'code',
      minimumFractionDigits: numericAmount % 1 === 0 ? 0 : 2,
      maximumFractionDigits: numericAmount % 1 === 0 ? 0 : 2,
    }).format(numericAmount);
  } catch (error) {
    const formatted = numericAmount % 1 === 0 ? numericAmount.toFixed(0) : numericAmount.toFixed(2);
    return `${symbol ?? currencyCode} ${formatted}`.trim();
  }
}

function normaliseAvailabilitySlots(rows = []) {
  return rows
    .map((row) => {
      if (!row) return null;
      const start = new Date(row.startTime ?? row.start);
      if (Number.isNaN(start.getTime())) {
        return null;
      }
      const endCandidate = row.endTime ?? row.end ?? new Date(start.getTime() + 60 * 60 * 1000).toISOString();
      const end = new Date(endCandidate);
      const safeEnd = Number.isNaN(end.getTime()) ? new Date(start.getTime() + 60 * 60 * 1000) : end;

      const timeFormatter = new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
      });

      return {
        id: row.id ?? `${row.mentorId ?? 'mentor'}-${start.toISOString()}`,
        mentorId: row.mentorId ?? null,
        start: start.toISOString(),
        end: safeEnd.toISOString(),
        format: row.format ?? 'Session',
        capacity: row.capacity != null ? Number(row.capacity) : 1,
        dayOfWeek: row.dayOfWeek ?? null,
        label: `${timeFormatter.format(start)} - ${timeFormatter.format(safeEnd)}`,
      };
    })
    .filter(Boolean)
    .sort((a, b) => new Date(a.start) - new Date(b.start));
}

function summariseAvailability(slots = []) {
  if (!slots.length) {
    return null;
  }

  const now = Date.now();
  const ordered = [...slots].sort((a, b) => new Date(a.start) - new Date(b.start));
  const nextSlot = ordered.find((slot) => new Date(slot.start).getTime() >= now) ?? ordered[0];
  if (!nextSlot) {
    return null;
  }

  const start = new Date(nextSlot.start);
  if (Number.isNaN(start.getTime())) {
    return null;
  }

  const dateFormatter = new Intl.DateTimeFormat('en-GB', { weekday: 'short', month: 'short', day: 'numeric' });
  const timeFormatter = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' });

  const parts = [dateFormatter.format(start), `• ${timeFormatter.format(start)}`];
  if (nextSlot.format) {
    parts.push(`• ${nextSlot.format}`);
  }

  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

function normalisePackageEntries(profilePackages = [], dbPackages = []) {
  const entries = [];
  const seen = new Set();

  const register = (pack) => {
    if (!pack || typeof pack !== 'object') {
      return;
    }

    const name = pack.name ? `${pack.name}`.trim() : null;
    if (!name || seen.has(name.toLowerCase())) {
      return;
    }

    seen.add(name.toLowerCase());
    entries.push({
      id: pack.id ?? `package-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      name,
      description: pack.description ?? pack.outcome ?? null,
      outcome: pack.outcome ?? pack.description ?? null,
      currency: pack.currency ?? null,
      price: pack.price != null ? Number(pack.price) : null,
      sessions: pack.sessions != null ? Number(pack.sessions) : null,
      format: pack.format ?? null,
    });
  };

  profilePackages.forEach(register);
  dbPackages.forEach(register);

  return entries;
}

function computeCompatibilityScore({ rankingScore = 0, rating = null, reviewCount = 0, successRate = null, menteesServed = null }) {
  const safeRanking = Number.isFinite(Number(rankingScore)) ? Number(rankingScore) : 0;
  const safeRating = Number.isFinite(Number(rating)) ? Number(rating) : 0;
  const safeReviews = Number.isFinite(Number(reviewCount)) ? Number(reviewCount) : 0;
  const safeSuccess = Number.isFinite(Number(successRate)) ? Number(successRate) : 0;
  const safeMentees = Number.isFinite(Number(menteesServed)) ? Number(menteesServed) : 0;

  const weightedScore =
    safeRanking * 0.5 +
    safeRating * 10 * 0.3 +
    Math.min(safeReviews, 50) * 0.5 +
    safeSuccess * 0.4 +
    Math.min(safeMentees, 50) * 0.2;

  return Math.round(Math.max(0, Math.min(100, weightedScore)));
}

function normaliseMentorFilters(raw = {}) {
  const filters = {
    discipline: [],
    priceTier: [],
    availability: [],
  };

  const pushValues = (key, value, { toLowerCase = false } = {}) => {
    const entries = coerceArray(value)
      .map((entry) => {
        const trimmed = entry.trim();
        return toLowerCase ? trimmed.toLowerCase() : trimmed;
      })
      .filter(Boolean);
    if (!entries.length) {
      return;
    }
    const existing = new Set(filters[key]);
    entries.forEach((entry) => existing.add(entry));
    filters[key] = Array.from(existing);
  };

  pushValues('discipline', raw.discipline ?? raw.disciplines ?? raw.focus ?? raw.focusAreas);
  pushValues('priceTier', raw.priceTier ?? raw.priceTiers ?? raw.pricing ?? raw.priceTierIds, {
    toLowerCase: true,
  });
  pushValues(
    'availability',
    raw.availability ?? raw.availabilityStatus ?? raw.availabilityStatuses,
    { toLowerCase: true },
  );

  filters.priceTier = filters.priceTier.filter((value) => MENTOR_PRICE_TIERS.includes(value));
  filters.availability = filters.availability.filter((value) =>
    MENTOR_AVAILABILITY_STATUSES.includes(value),
  );

  return filters;
}

async function enrichMentorProfiles(records = []) {
  if (!records.length) {
    return new Map();
  }

  const plainProfiles = records.map((record) => (typeof record.get === 'function' ? record.get({ plain: true }) : record));
  const userIds = Array.from(
    new Set(
      plainProfiles
        .map((profile) => Number(profile.userId))
        .filter((value) => Number.isInteger(value) && value > 0),
    ),
  );

  const now = new Date();
  const horizon = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000);

  const [userRows, availabilityRows, packageRows, reviewRows, orderRows] = await Promise.all([
    userIds.length
      ? User.findAll({
          where: { id: { [Op.in]: userIds } },
          attributes: ['id', 'firstName', 'lastName', 'email', 'title'],
          include: [{ model: Profile, as: 'Profile', attributes: ['headline', 'timezone', 'availabilityStatus', 'location', 'avatarUrl'] }],
        })
      : [],
    userIds.length
      ? MentorAvailabilitySlot.findAll({
          where: {
            mentorId: { [Op.in]: userIds },
            startTime: { [Op.gte]: now, [Op.lte]: horizon },
          },
          order: [['startTime', 'ASC']],
          raw: true,
        })
      : [],
    userIds.length
      ? MentorPackage.findAll({
          where: { mentorId: { [Op.in]: userIds } },
          order: [['price', 'ASC']],
          raw: true,
        })
      : [],
    userIds.length
      ? MentorReview.findAll({
          attributes: [
            'mentorId',
            [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
            [sequelize.fn('AVG', sequelize.col('rating')), 'average'],
            [sequelize.fn('SUM', sequelize.literal("CASE WHEN rating >= 4 THEN 1 ELSE 0 END")), 'positive'],
          ],
          where: { mentorId: { [Op.in]: userIds } },
          group: ['mentorId'],
          raw: true,
        })
      : [],
    userIds.length
      ? MentorshipOrder.findAll({
          where: { mentorId: { [Op.in]: userIds } },
          attributes: ['mentorId', 'userId', 'sessionsPurchased', 'sessionsRedeemed'],
          raw: true,
        })
      : [],
  ]);

  const userMap = new Map(userRows.map((user) => [user.id, user.get({ plain: true })]));

  const availabilityByMentor = new Map();
  availabilityRows.forEach((slot) => {
    const mentorId = Number(slot.mentorId);
    if (!Number.isInteger(mentorId)) {
      return;
    }
    if (!availabilityByMentor.has(mentorId)) {
      availabilityByMentor.set(mentorId, []);
    }
    availabilityByMentor.get(mentorId).push(slot);
  });

  const packageByMentor = new Map();
  packageRows.forEach((pack) => {
    const mentorId = Number(pack.mentorId);
    if (!Number.isInteger(mentorId)) {
      return;
    }
    if (!packageByMentor.has(mentorId)) {
      packageByMentor.set(mentorId, []);
    }
    packageByMentor.get(mentorId).push({
      id: pack.id,
      name: pack.name,
      description: pack.description,
      outcome: pack.outcome,
      currency: pack.currency,
      price: pack.price != null ? Number(pack.price) : null,
      sessions: pack.sessions != null ? Number(pack.sessions) : null,
      format: pack.format ?? null,
    });
  });

  const reviewMap = new Map();
  reviewRows.forEach((row) => {
    const mentorId = Number(row.mentorId);
    if (!Number.isInteger(mentorId)) {
      return;
    }
    reviewMap.set(mentorId, {
      total: Number(row.total ?? 0),
      average: row.average != null ? Number(row.average) : null,
      positive: Number(row.positive ?? 0),
    });
  });

  const orderMap = new Map();
  orderRows.forEach((row) => {
    const mentorId = Number(row.mentorId);
    if (!Number.isInteger(mentorId)) {
      return;
    }
    if (!orderMap.has(mentorId)) {
      orderMap.set(mentorId, { menteeIds: new Set(), sessionsPurchased: 0, sessionsRedeemed: 0 });
    }
    const bucket = orderMap.get(mentorId);
    if (row.userId != null) {
      bucket.menteeIds.add(Number(row.userId));
    }
    bucket.sessionsPurchased += Number(row.sessionsPurchased ?? 0);
    bucket.sessionsRedeemed += Number(row.sessionsRedeemed ?? 0);
  });

  const extrasMap = new Map();
  plainProfiles.forEach((profile) => {
    const mentorId = Number(profile.userId);
    const availabilitySlots = Number.isInteger(mentorId)
      ? normaliseAvailabilitySlots(availabilityByMentor.get(mentorId) ?? [])
      : [];
    const dbPackages = Number.isInteger(mentorId) ? packageByMentor.get(mentorId) ?? [] : [];
    const reviewStats = Number.isInteger(mentorId) ? reviewMap.get(mentorId) ?? null : null;
    const orderStats = Number.isInteger(mentorId) ? orderMap.get(mentorId) ?? null : null;

    const metrics = {
      rating:
        reviewStats?.average != null
          ? Number(reviewStats.average)
          : profile.rating != null
          ? Number(profile.rating)
          : null,
      reviewCount: reviewStats?.total != null ? Number(reviewStats.total) : Number(profile.reviewCount ?? 0),
      successRate:
        reviewStats?.total
          ? Math.round((Number(reviewStats.positive ?? 0) / Number(reviewStats.total)) * 100)
          : null,
      menteesServed: orderStats ? orderStats.menteeIds.size : null,
      sessionsPurchased: orderStats ? Number(orderStats.sessionsPurchased ?? 0) : null,
      sessionsRedeemed: orderStats ? Number(orderStats.sessionsRedeemed ?? 0) : null,
      responseTimeHours: profile.responseTimeHours != null ? Number(profile.responseTimeHours) : null,
    };

    const availabilitySummary = summariseAvailability(availabilitySlots) ?? profile.availabilityNotes ?? null;

    extrasMap.set(profile.id, {
      user: Number.isInteger(mentorId) ? userMap.get(mentorId) ?? null : null,
      availabilitySlots,
      availabilitySummary,
      packages: dbPackages,
      metrics,
    });
  });

  return extrasMap;
}

function toMentorDto(record, extras = {}) {
  const plain = typeof record.get === 'function' ? record.get({ plain: true }) : record;

  const expertise = normaliseStringList(plain.expertise);
  const testimonials = Array.isArray(plain.testimonials) ? plain.testimonials.filter(Boolean) : [];
  const profilePackages = Array.isArray(plain.packages) ? plain.packages.filter(Boolean) : [];

  const sessionAmount = Number(plain.sessionFeeAmount);
  const hasSessionFee = Number.isFinite(sessionAmount);
  const sessionCurrency = plain.sessionFeeCurrency ?? extras.sessionFeeCurrency ?? null;
  const sessionCurrencySymbol = resolveCurrencySymbol(sessionCurrency);
  const sessionFee = hasSessionFee
    ? {
        amount: sessionAmount,
        currency: sessionCurrencySymbol ?? sessionCurrency ?? '£',
        unit: plain.sessionFeeUnit ?? 'session',
      }
    : null;

  const packages = normalisePackageEntries(profilePackages, extras.packages ?? []);

  const responseTimeHours = extras.metrics?.responseTimeHours ?? (plain.responseTimeHours != null ? Number(plain.responseTimeHours) : null);
  const resolvedResponseTime =
    Number.isFinite(responseTimeHours) && responseTimeHours >= 0
      ? new Date(Date.now() + responseTimeHours * 60 * 60 * 1000).toISOString()
      : null;

  const metrics = {
    rating:
      extras.metrics?.rating != null
        ? extras.metrics.rating
        : plain.rating != null
        ? Number(plain.rating)
        : null,
    reviewCount:
      extras.metrics?.reviewCount != null
        ? extras.metrics.reviewCount
        : Number.isFinite(Number(plain.reviewCount))
        ? Number(plain.reviewCount)
        : 0,
    successRate: extras.metrics?.successRate ?? null,
    menteesServed: extras.metrics?.menteesServed ?? null,
    sessionsPurchased: extras.metrics?.sessionsPurchased ?? null,
    sessionsRedeemed: extras.metrics?.sessionsRedeemed ?? null,
    responseTimeHours,
  };

  const languages = normaliseStringList(plain.languages ?? extras.languages);
  const industries = normaliseStringList(plain.industries ?? extras.industries ?? (plain.discipline ? [plain.discipline] : []));
  const goals = normaliseStringList(plain.goalTags ?? extras.goalTags);

  const availabilitySlots = Array.isArray(extras.availabilitySlots) ? extras.availabilitySlots : [];
  const availabilitySummary = extras.availabilitySummary ?? summariseAvailability(availabilitySlots) ?? plain.availabilityNotes ?? null;

  const sessionTypes = (() => {
    const entries = [];
    if (sessionFee) {
      entries.push({
        id: `session-${plain.id}`,
        label: 'Book a 1:1 session',
        description: plain.headline ?? 'Dedicated mentorship session tailored to your goals.',
        duration: '60 min',
        durationMinutes: 60,
        price: formatCurrencyLabel(sessionFee.amount, sessionCurrency ?? 'GBP'),
        priceAmount: sessionFee.amount,
        currency: sessionCurrency ?? 'GBP',
        kind: 'single',
      });
    }

    packages.forEach((pack, index) => {
      entries.push({
        id: pack.id ?? `package-${plain.id}-${index}`,
        label: pack.name,
        description: pack.outcome ?? pack.description ?? null,
        duration: pack.sessions ? `${pack.sessions} session${pack.sessions > 1 ? 's' : ''}` : null,
        durationMinutes: pack.sessions ? Number(pack.sessions) * 60 : null,
        price: formatCurrencyLabel(pack.price, pack.currency ?? sessionCurrency ?? 'GBP'),
        priceAmount: pack.price,
        currency: pack.currency ?? sessionCurrency ?? 'GBP',
        kind: 'package',
      });
    });

    return entries;
  })();

  const stories = testimonials.map((testimonial) => {
    if (typeof testimonial === 'string') {
      return { quote: testimonial, name: null, company: null };
    }
    return {
      quote: testimonial.quote ?? testimonial.text ?? null,
      name: testimonial.author ?? testimonial.name ?? null,
      company: testimonial.company ?? null,
      attribution: testimonial.attribution ?? testimonial.author ?? testimonial.name ?? null,
    };
  });

  const compatibilityScore = computeCompatibilityScore({
    rankingScore: plain.rankingScore,
    rating: metrics.rating,
    reviewCount: metrics.reviewCount,
    successRate: metrics.successRate,
    menteesServed: metrics.menteesServed,
  });

  const user = extras.user ?? null;
  const firstName = user?.firstName ?? null;
  const lastName = user?.lastName ?? null;
  const fallbackName = [firstName, lastName].filter(Boolean).join(' ').trim();
  const displayName = plain.name ?? (fallbackName ? fallbackName : null);

  return {
    id: plain.id,
    userId: plain.userId ?? null,
    slug: plain.slug ?? null,
    name: displayName,
    firstName,
    lastName,
    title: plain.name ?? null,
    headline: plain.headline ?? null,
    description: plain.bio ?? null,
    summary: plain.bio ?? null,
    bio: plain.bio ?? null,
    region: plain.region ?? user?.Profile?.location ?? null,
    timezone: user?.Profile?.timezone ?? null,
    discipline: plain.discipline ?? null,
    industries,
    expertise,
    focusAreas: expertise,
    languages,
    goals,
    sessionFee: sessionFee ?? undefined,
    priceTier: plain.priceTier ?? null,
    availabilityStatus: plain.availabilityStatus ?? 'open',
    availabilityNotes: plain.availabilityNotes ?? null,
    availabilitySummary,
    availabilitySlots,
    responseTimeHours: responseTimeHours != null ? responseTimeHours : null,
    responseTime: resolvedResponseTime,
    reviews: metrics.reviewCount,
    rating: metrics.rating,
    metrics,
    compatibilityScore,
    isVerified: Boolean(plain.verificationBadge),
    verificationLabel: plain.verificationBadge ?? null,
    testimonialHighlight: plain.testimonialHighlight ?? null,
    testimonialHighlightAuthor: plain.testimonialHighlightAuthor ?? null,
    testimonials: stories,
    stories,
    packages,
    sessionTypes,
    avatarUrl: plain.avatarUrl ?? user?.Profile?.avatarUrl ?? null,
    promoted: Boolean(plain.promoted),
    isFeatured: Boolean(plain.promoted),
    rankingScore: Number.isFinite(Number(plain.rankingScore)) ? Number(plain.rankingScore) : 0,
    lastActiveAt: plain.lastActiveAt ?? null,
    updatedAt: plain.updatedAt ?? null,
    createdAt: plain.createdAt ?? null,
    category: 'mentor',
  };
}

function toGeoDto(geoLocation, fallbackLocation = null) {
  if (!geoLocation) {
    return null;
  }

  const source = typeof geoLocation === 'string' ? { label: geoLocation } : geoLocation;
  const lat = Number.parseFloat(source.lat ?? source.latitude);
  const lng = Number.parseFloat(source.lng ?? source.longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return {
    lat,
    lng,
    city: source.city ?? source.town ?? source.locality ?? null,
    region: source.region ?? source.state ?? source.stateCode ?? null,
    country: source.country ?? source.countryCode ?? null,
    label:
      source.label ??
      source.name ??
      source.formatted ??
      source.displayName ??
      fallbackLocation ??
      null,
    isRemote: typeof source.isRemote === 'boolean' ? source.isRemote : null,
  };
}

function toOpportunityDto(record, category) {
  if (!record) {
    return null;
  }

  const plain = typeof record.get === 'function' ? record.get({ plain: true }) : record;
  const geo = toGeoDto(plain.geoLocation ?? plain.geo, plain.location);
  const taxonomies = extractTaxonomies(plain);
  const taxonomySlugs = Array.from(new Set(taxonomies.map((entry) => entry.slug).filter(Boolean)));
  const taxonomyTypes = Array.from(new Set(taxonomies.map((entry) => entry.type).filter(Boolean)));
  const taxonomyLabels = Array.from(new Set(taxonomies.map((entry) => entry.label).filter(Boolean)));

  const base = {
    id: plain.id,
    category,
    title: plain.title,
    description: plain.description,
    updatedAt: plain.updatedAt ?? plain.createdAt ?? new Date(),
    location: plain.location ?? null,
    geo,
    taxonomies,
    taxonomySlugs,
    taxonomyTypes,
    taxonomyLabels,
    aiSignals: plain.aiSignals ?? null,
  };

  switch (category) {
    case 'job':
      return {
        ...base,
        employmentType: plain.employmentType ?? null,
        employmentCategory: plain.employmentCategory ?? null,
        isRemote: geo?.isRemote ?? isRemoteRole(plain.location, plain.description),
      };
    case 'gig': {
      const derivedDurationCategory =
        plain.durationCategory ?? determineDurationCategory(plain.duration ?? null);
      const derivedBudgetCurrency =
        plain.budgetCurrency ?? extractCurrencyCode(plain.budget ?? plain.metadata?.budgetLabel ?? null);
      const parsedBudgetAmount =
        plain.budgetAmount != null && Number.isFinite(Number(plain.budgetAmount))
          ? Number(plain.budgetAmount)
          : parseBudgetValue(plain.budget ?? plain.metadata?.budgetLabel ?? null);
      const normalisedBudgetAmount = Number.isFinite(parsedBudgetAmount) ? Number(parsedBudgetAmount) : null;

      return {
        ...base,
        budget: plain.budget ?? null,
        budgetCurrency: derivedBudgetCurrency ?? null,
        budgetAmount: normalisedBudgetAmount,
        duration: plain.duration ?? null,
        durationCategory: derivedDurationCategory ?? null,
        isRemote: geo?.isRemote ?? isRemoteRole(plain.location, plain.description),
      };
    }
    case 'project':
      return {
        ...base,
        status: plain.status ?? null,
        isRemote: geo?.isRemote ?? isRemoteRole(plain.location, plain.description),
        autoAssignEnabled: plain.autoAssignEnabled == null ? null : Boolean(plain.autoAssignEnabled),
        autoAssignStatus: plain.autoAssignStatus ?? null,
        autoAssignLastQueueSize: plain.autoAssignLastQueueSize ?? null,
        autoAssignLastRunAt: plain.autoAssignLastRunAt ?? null,
        autoAssignSettings: plain.autoAssignSettings ?? null,
      };
    case 'launchpad':
      return {
        ...base,
        track: plain.track ?? null,
        isRemote: geo?.isRemote ?? false,
      };
    case 'volunteering':
      return {
        ...base,
        organization: plain.organization ?? null,
        isRemote: geo?.isRemote ?? isRemoteRole(plain.location, plain.description),
      };
    default:
      throw new ValidationError(`Unsupported opportunity category "${category}".`);
  }
}

function buildTaxonomyInclude(category, filters = {}) {
  if (!TAXONOMY_ENABLED_CATEGORIES.has(category)) {
    return null;
  }

  const slugTokens = normaliseTaxonomyFilterTokens(filters.taxonomySlugs ?? []);
  const typeTokens = normaliseTaxonomyFilterTokens(filters.taxonomyTypes ?? []);

  const include = {
    model: OpportunityTaxonomyAssignment,
    as: 'taxonomyAssignments',
    required: false,
    attributes: ['id', 'taxonomyId', 'targetType', 'targetId', 'weight', 'source'],
    include: [
      {
        model: OpportunityTaxonomy,
        as: 'taxonomy',
        attributes: ['id', 'slug', 'label', 'type'],
        required: false,
      },
    ],
  };

  if (slugTokens.length || typeTokens.length) {
    include.required = true;
    include.include[0].required = true;
    const taxonomyWhere = {};
    if (slugTokens.length) {
      taxonomyWhere.slug = { [Op.in]: slugTokens };
    }
    if (typeTokens.length) {
      taxonomyWhere.type = { [Op.in]: typeTokens };
    }
    include.include[0].where = taxonomyWhere;
  }

  return include;
}

function extractTaxonomies(record) {
  if (!record) {
    return [];
  }

  if (Array.isArray(record.taxonomies) && record.taxonomies.length) {
    const seen = new Set();
    return record.taxonomies
      .map((entry) => ({
        id: entry.id ?? null,
        slug: entry.slug ?? entry.Slug ?? null,
        label: entry.label ?? entry.Label ?? null,
        type: entry.type ?? entry.Type ?? null,
      }))
      .filter((entry) => {
        const key = entry.slug ? `${entry.slug}`.toLowerCase() : null;
        if (!key || seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      });
  }

  const slugs = Array.isArray(record.taxonomySlugs) ? record.taxonomySlugs : [];
  const labels = Array.isArray(record.taxonomyLabels) ? record.taxonomyLabels : [];
  const types = Array.isArray(record.taxonomyTypes) ? record.taxonomyTypes : [];

  const fromLists = slugs
    .map((slug, index) => ({
      id: null,
      slug,
      label: labels[index] ?? null,
      type: types[index] ?? null,
    }))
    .filter((entry) => entry.slug);

  const assignments = Array.isArray(record.taxonomyAssignments) ? record.taxonomyAssignments : [];
  const fromAssignments = assignments
    .map((assignment) => {
      const taxonomy = assignment.taxonomy
        ? typeof assignment.taxonomy.get === 'function'
          ? assignment.taxonomy.get({ plain: true })
          : assignment.taxonomy
        : null;
      if (!taxonomy && assignment.slug) {
        return {
          id: assignment.taxonomyId ?? null,
          slug: assignment.slug,
          label: assignment.label ?? null,
          type: assignment.type ?? assignment.targetType ?? null,
        };
      }
      if (!taxonomy) {
        return null;
      }
      return {
        id: taxonomy.id ?? assignment.taxonomyId ?? null,
        slug: taxonomy.slug,
        label: taxonomy.label ?? null,
        type: taxonomy.type ?? null,
      };
    })
    .filter(Boolean);

  const combined = [...fromAssignments, ...fromLists];
  const deduped = [];
  const seen = new Set();

  combined.forEach((entry) => {
    const key = entry.slug ? `${entry.slug}`.toLowerCase() : null;
    if (!key || seen.has(key)) {
      return;
    }
    seen.add(key);
    deduped.push(entry);
  });

  return deduped;
}

function buildLikeExpression(value) {
  if (DIALECT === 'postgres' || DIALECT === 'postgresql') {
    return { [Op.iLike]: `%${value}%` };
  }

  return { [Op.like]: `%${value}%` };
}

function buildSearchWhereClause(category, query) {
  const trimmed = query?.trim();
  if (!trimmed) {
    return {};
  }

  const likeExpression = buildLikeExpression(trimmed);
  const baseClause = [{ title: likeExpression }];
  if (category === 'job' || category === 'gig' || category === 'project') {
    baseClause.push({ description: likeExpression });
  }

  return {
    [Op.or]: baseClause,
  };
}

async function listOpportunities(category, { page, pageSize, query, filters, sort, includeFacets = false, viewport } = {}) {
  if (!opportunityModels[category]) {
    throw new ValidationError(`Unknown opportunity category "${category}".`);
  }

  const safePage = normalisePage(page);
  const safeSize = normalisePageSize(pageSize);
  const offset = (safePage - 1) * safeSize;

  const searchQuery = query?.trim() ?? '';

  const rawFilters = parseFiltersInput(filters);
  const normalisedFilters = normaliseClientFilters(rawFilters);
  const normalisedViewport = normaliseViewport(viewport);
  const sortExpressions = Array.isArray(sort) ? sort : resolveSortExpressions(category, sort);
  const facetFields = includeFacets ? CATEGORY_FACETS[category] : undefined;
  const taxonomyInclude = buildTaxonomyInclude(category, normalisedFilters);
  const includes = [];
  if (taxonomyInclude) {
    includes.push(taxonomyInclude);
  }

  const searchResult = await searchOpportunityIndex(
    category,
    {
      query: searchQuery,
      page: safePage,
      pageSize: safeSize,
      filters: rawFilters,
      sort: sortExpressions,
      facets: facetFields,
      viewport: normalisedViewport,
    },
  );

  if (searchResult) {
    const totalPages = Math.max(1, Math.ceil(searchResult.total / safeSize));
    const items = annotateWithScores(
      searchResult.hits.map((hit) => toOpportunityDto(hit, category)),
      { query: searchQuery, filters: normalisedFilters, viewport: normalisedViewport, category },
    );

    return {
      items,
      total: searchResult.total,
      page: safePage,
      pageSize: safeSize,
      totalPages,
      facets: searchResult.facetDistribution ?? null,
      metrics: {
        source: 'internal_search',
        processingTimeMs: searchResult.processingTimeMs ?? null,
        query: searchResult.query ?? searchQuery,
      },
      appliedFilters: normalisedFilters,
      viewport: normalisedViewport,
    };
  }

  const where = buildSearchWhereClause(category, query);
  applyStructuredFilters(where, category, normalisedFilters);

  if (category === 'gig') {
    const minBudget = Number(normalisedFilters.budgetValueMin);
    const maxBudget = Number(normalisedFilters.budgetValueMax);
    if (Number.isFinite(minBudget) || Number.isFinite(maxBudget)) {
      if (!where[Op.and]) {
        where[Op.and] = [];
      }
      const numericType = DIALECT === 'postgres' ? 'numeric' : 'decimal';
      const sanitizedBudget = sequelize.fn('REGEXP_REPLACE', sequelize.col('Gig.budget'), '[^0-9.]', '');
      const castBudget = sequelize.cast(sequelize.fn('NULLIF', sanitizedBudget, ''), numericType);
      if (Number.isFinite(minBudget)) {
        where[Op.and].push(
          sequelize.where(castBudget, {
            [Op.gte]: Math.max(0, Math.round(minBudget)),
          }),
        );
      }
      if (Number.isFinite(maxBudget)) {
        where[Op.and].push(
          sequelize.where(castBudget, {
            [Op.lte]: Math.max(0, Math.round(maxBudget)),
          }),
        );
      }
    }
  }

  if (normalisedFilters.isRemote === true || normalisedFilters.isRemote === 'true' || normalisedFilters.isRemote === '1') {
    const remoteLike = buildLikeExpression('remote');
    if (!where[Op.and]) {
      where[Op.and] = [];
    }
    where[Op.and].push({
      [Op.or]: [
        { location: remoteLike },
        { description: remoteLike },
      ],
    });
  }

  let rows;
  let count;
  try {
    ({ rows, count } = await opportunityModels[category].findAndCountAll({
      where,
      order: [
        ['updatedAt', 'DESC'],
        ['id', 'DESC'],
      ],
      limit: safeSize,
      offset,
      subQuery: false,
      distinct: includes.length > 0,
      include: includes,
    }));
  } catch (error) {
    throw new ApplicationError(`Unable to list discovery opportunities: ${error.message}`, 500, {
      category,
      query,
      cause: error,
    });
  }

  const items = annotateWithScores(
    rows.map((row) => toOpportunityDto(row, category)),
    { query: searchQuery, filters: normalisedFilters, viewport: normalisedViewport, category },
  );

  return {
    items,
    total: count,
    page: safePage,
    pageSize: safeSize,
    totalPages: Math.ceil(count / safeSize) || 1,
    facets: null,
    metrics: { source: 'database' },
    appliedFilters: normalisedFilters,
    viewport: normalisedViewport,
  };
}

export async function listJobs(options = {}) {
  return listOpportunities('job', options);
}

export async function listGigs(options = {}) {
  return listOpportunities('gig', options);
}

export async function listProjects(options = {}) {
  return listOpportunities('project', options);
}

export async function listLaunchpads(options = {}) {
  return listOpportunities('launchpad', options);
}

export async function listVolunteering(options = {}) {
  return listOpportunities('volunteering', options);
}

export async function listMentors(options = {}) {
  const safePage = normalisePage(options.page);
  const safeSize = normalisePageSize(options.pageSize);
  const offset = (safePage - 1) * safeSize;

  const query = options.query?.trim() ?? '';
  const likeExpression = query ? buildLikeExpression(query) : null;
  const searchClause = likeExpression
    ? {
        [Op.or]: [
          { name: likeExpression },
          { headline: likeExpression },
          { discipline: likeExpression },
          { region: likeExpression },
          { bio: likeExpression },
          { searchVector: buildLikeExpression(query.toLowerCase()) },
        ],
      }
    : null;

  const rawFilters = parseFiltersInput(options.filters);
  const normalisedFilters = normaliseMentorFilters(rawFilters);

  const filterConditions = {
    discipline: normalisedFilters.discipline.length
      ? { discipline: { [Op.in]: normalisedFilters.discipline } }
      : null,
    priceTier: normalisedFilters.priceTier.length
      ? { priceTier: { [Op.in]: normalisedFilters.priceTier } }
      : null,
    availability: normalisedFilters.availability.length
      ? { availabilityStatus: { [Op.in]: normalisedFilters.availability } }
      : null,
  };

  const buildWhere = (excludeKey = null) => {
    const conditions = [];
    if (searchClause) {
      conditions.push(searchClause);
    }
    Object.entries(filterConditions).forEach(([key, condition]) => {
      if (condition && key !== excludeKey) {
        conditions.push(condition);
      }
    });
    if (!conditions.length) {
      return {};
    }
    if (conditions.length === 1) {
      return conditions[0];
    }
    return { [Op.and]: conditions };
  };

  const sortKey = typeof options.sort === 'string' ? options.sort.trim().toLowerCase() : null;
  const order = [
    ['promoted', 'DESC'],
    ['rankingScore', 'DESC'],
    ['reviewCount', 'DESC'],
    ['updatedAt', 'DESC'],
  ];

  if (sortKey === 'alphabetical') {
    order.unshift(['name', 'ASC']);
  } else if (sortKey === 'price_asc') {
    order.unshift(['sessionFeeAmount', 'ASC']);
  } else if (sortKey === 'price_desc') {
    order.unshift(['sessionFeeAmount', 'DESC']);
  }

  let rows;
  let count;
  try {
    ({ rows, count } = await MentorProfile.findAndCountAll({
      where: buildWhere(),
      order,
      limit: safeSize,
      offset,
    }));
  } catch (error) {
    throw new ApplicationError(`Unable to list mentors: ${error.message}`, 500, {
      cause: error,
      query,
      filters: rawFilters,
    });
  }

  const plainRows = rows.map((row) => (typeof row.get === 'function' ? row.get({ plain: true }) : row));
  const extrasMap = await enrichMentorProfiles(plainRows);
  const annotated = annotateWithScores(
    plainRows.map((plain) => toMentorDto(plain, extrasMap.get(plain.id) ?? {})),
    { query, filters: rawFilters, category: 'mentor' },
  );

  let facets = null;
  if (options.includeFacets) {
    const [disciplineRows, priceRows, availabilityRows] = await Promise.all([
      MentorProfile.findAll({
        attributes: [
          'discipline',
          [MentorProfile.sequelize.fn('COUNT', MentorProfile.sequelize.col('id')), 'count'],
        ],
        where: buildWhere('discipline'),
        group: ['discipline'],
        order: [['discipline', 'ASC']],
        raw: true,
      }),
      MentorProfile.findAll({
        attributes: [
          'priceTier',
          [MentorProfile.sequelize.fn('COUNT', MentorProfile.sequelize.col('id')), 'count'],
        ],
        where: buildWhere('priceTier'),
        group: ['priceTier'],
        raw: true,
      }),
      MentorProfile.findAll({
        attributes: [
          'availabilityStatus',
          [MentorProfile.sequelize.fn('COUNT', MentorProfile.sequelize.col('id')), 'count'],
        ],
        where: buildWhere('availability'),
        group: ['availabilityStatus'],
        raw: true,
      }),
    ]);

    const formatFacet = (rows, field, labels = {}) =>
      rows
        .filter((row) => row[field])
        .map((row) => ({
          value: row[field],
          label: labels[row[field]] ?? row[field],
          count: Number(row.count ?? 0),
        }))
        .sort((a, b) => a.label.localeCompare(b.label));

    facets = {
      discipline: formatFacet(disciplineRows, 'discipline'),
      priceTier: formatFacet(priceRows, 'priceTier', PRICE_TIER_LABELS),
      availability: formatFacet(availabilityRows, 'availabilityStatus', AVAILABILITY_LABELS),
    };
  }

  const totalPages = Math.ceil(count / safeSize) || 1;
  const hasMore = offset + rows.length < count;

  return {
    items: annotated,
    total: count,
    page: safePage,
    pageSize: safeSize,
    totalPages,
    facets,
    metrics: { source: 'database' },
    appliedFilters: normalisedFilters,
    meta: {
      total: count,
      page: safePage,
      pageSize: safeSize,
      totalPages,
      hasMore,
    },
  };
}

export async function getDiscoverySnapshot({ limit } = {}) {
  const safeLimit = normaliseLimit(limit);
  const cacheKey = buildCacheKey('discovery:snapshot', { limit: safeLimit });

  return appCache.remember(cacheKey, SNAPSHOT_CACHE_TTL_SECONDS, async () => {
    const [jobs, gigs, projects, launchpads, volunteering, mentors] = await Promise.all([
      listJobs({ page: 1, pageSize: safeLimit }),
      listGigs({ page: 1, pageSize: safeLimit }),
      listProjects({ page: 1, pageSize: safeLimit }),
      listLaunchpads({ page: 1, pageSize: safeLimit }),
      listVolunteering({ page: 1, pageSize: safeLimit }),
      listMentors({ page: 1, pageSize: safeLimit }),
    ]);

    return {
      jobs: { total: jobs.total, items: jobs.items },
      gigs: { total: gigs.total, items: gigs.items },
      projects: { total: projects.total, items: projects.items },
      launchpads: { total: launchpads.total, items: launchpads.items },
      volunteering: { total: volunteering.total, items: volunteering.items },
      mentors: { total: mentors.total, items: mentors.items },
    };
  });
}

export async function searchOpportunitiesAcrossCategories(query, { limit } = {}) {
  const safeLimit = normaliseLimit(limit);
  const trimmed = query?.trim();
  if (!trimmed) {
    return {
      jobs: [],
      gigs: [],
      projects: [],
      launchpads: [],
      volunteering: [],
      mentors: [],
    };
  }

  const searchHits = await searchAcrossOpportunityIndexes(trimmed, { limit: safeLimit });

  if (searchHits) {
    const mentors = await listMentors({ page: 1, pageSize: safeLimit, query: trimmed });
    return {
      jobs: annotateWithScores(
        (searchHits.job ?? []).map((hit) => toOpportunityDto(hit, 'job')),
        { query: trimmed, filters: {}, category: 'job' },
      ),
      gigs: annotateWithScores(
        (searchHits.gig ?? []).map((hit) => toOpportunityDto(hit, 'gig')),
        { query: trimmed, filters: {}, category: 'gig' },
      ),
      projects: annotateWithScores(
        (searchHits.project ?? []).map((hit) => toOpportunityDto(hit, 'project')),
        { query: trimmed, filters: {}, category: 'project' },
      ),
      launchpads: annotateWithScores(
        (searchHits.launchpad ?? []).map((hit) => toOpportunityDto(hit, 'launchpad')),
        { query: trimmed, filters: {}, category: 'launchpad' },
      ),
      volunteering: annotateWithScores(
        (searchHits.volunteering ?? []).map((hit) => toOpportunityDto(hit, 'volunteering')),
        { query: trimmed, filters: {}, category: 'volunteering' },
      ),
      mentors: mentors.items,
    };
  }

  const [jobs, gigs, projects, launchpads, volunteering, mentors] = await Promise.all([
    listJobs({ page: 1, pageSize: safeLimit, query: trimmed }),
    listGigs({ page: 1, pageSize: safeLimit, query: trimmed }),
    listProjects({ page: 1, pageSize: safeLimit, query: trimmed }),
    listLaunchpads({ page: 1, pageSize: safeLimit, query: trimmed }),
    listVolunteering({ page: 1, pageSize: safeLimit, query: trimmed }),
    listMentors({ page: 1, pageSize: safeLimit, query: trimmed }),
  ]);

  return {
    jobs: jobs.items,
    gigs: gigs.items,
    projects: projects.items,
    launchpads: launchpads.items,
    volunteering: volunteering.items,
    mentors: mentors.items,
  };
}

export default {
  listJobs,
  listGigs,
  listProjects,
  listLaunchpads,
  listVolunteering,
  listMentors,
  getDiscoverySnapshot,
  searchOpportunitiesAcrossCategories,
  toOpportunityDto,
};
