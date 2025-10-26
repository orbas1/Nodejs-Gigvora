import { Op } from 'sequelize';
import {
  User,
  Profile,
  FreelancerProfile,
  ReputationTestimonial,
  ReputationSuccessStory,
  ReputationMetric,
  ReputationBadge,
  ReputationReviewWidget,
  FreelancerReview,
  REPUTATION_TESTIMONIAL_SOURCES,
  REPUTATION_TESTIMONIAL_STATUSES,
  REPUTATION_SUCCESS_STORY_STATUSES,
  REPUTATION_METRIC_TREND_DIRECTIONS,
  REPUTATION_REVIEW_WIDGET_STATUSES,
  FREELANCER_REVIEW_VISIBILITIES,
  FREELANCER_REVIEW_PERSONAS,
  sequelize,
} from '../models/index.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import {
  analyseTestimonial,
  analyseSuccessStory,
  verifyClientIdentity,
} from './reputationModerationService.js';
import { renderWidgetHtml } from './reputationWidgetRenderer.js';

function normalizeFreelancerId(value) {
  const id = Number.parseInt(value, 10);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ValidationError('freelancerId must be a positive integer');
  }
  return id;
}

async function ensureFreelancerExists(freelancerId) {
  const record = await User.findByPk(freelancerId, {
    attributes: ['id', 'userType', 'firstName', 'lastName'],
  });
  if (!record || record.userType !== 'freelancer') {
    throw new NotFoundError('Freelancer not found');
  }
  return record;
}

function sanitizeString(value, { maxLength = 255, allowNull = true } = {}) {
  if (value == null) {
    return allowNull ? null : '';
  }
  const trimmed = `${value}`.trim();
  if (!trimmed) {
    return allowNull ? null : '';
  }
  return trimmed.slice(0, maxLength);
}

function sanitizeEmail(value) {
  if (!value) {
    return null;
  }
  const trimmed = `${value}`.trim().toLowerCase();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(trimmed)) {
    throw new ValidationError('clientEmail must be a valid email address');
  }
  return trimmed.slice(0, 320);
}

function sanitizeUrl(value) {
  if (!value) {
    return null;
  }
  try {
    const url = new URL(value);
    return url.toString().slice(0, 500);
  } catch (error) {
    throw new ValidationError('Invalid URL provided');
  }
}

function parseDecimal(value, { allowNull = false, min = undefined, max = undefined } = {}) {
  if (value == null) {
    if (allowNull) return null;
    throw new ValidationError('A numeric value is required');
  }
  const numeric = Number.parseFloat(value);
  if (!Number.isFinite(numeric)) {
    throw new ValidationError('Value must be numeric');
  }
  if (min != null && numeric < min) {
    throw new ValidationError(`Value must be greater than or equal to ${min}`);
  }
  if (max != null && numeric > max) {
    throw new ValidationError(`Value must be less than or equal to ${max}`);
  }
  return numeric;
}

function parseDate(value, { allowNull = true } = {}) {
  if (value == null || value === '') {
    return allowNull ? null : new Date();
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError('Invalid date provided');
  }
  return date;
}

function sanitizeThemeTokens(value) {
  if (value == null) {
    return null;
  }
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new ValidationError('themeTokens must be an object if provided');
  }
  const tokens = ['background', 'border', 'text', 'accent', 'muted'].reduce((accumulator, key) => {
    if (value[key] != null && `${value[key]}`.trim()) {
      accumulator[key] = `${value[key]}`.trim();
    }
    return accumulator;
  }, {});
  return Object.keys(tokens).length ? tokens : null;
}

function generateSlug(value) {
  const base = sanitizeString(value, { allowNull: false }).toLowerCase();
  const normalized = base
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 90);
  return normalized || `entry-${Date.now()}`;
}

async function ensureUniqueSlug(model, freelancerId, desiredSlug) {
  const baseSlug = desiredSlug || `entry-${Date.now()}`;
  let attempt = 0;
  let slug = baseSlug;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    // eslint-disable-next-line no-await-in-loop
    const existing = await model.findOne({
      attributes: ['id'],
      where: { freelancerId, slug },
    });
    if (!existing) {
      return slug;
    }
    attempt += 1;
    slug = `${baseSlug}-${attempt}`;
  }
}

function formatMetricValue(value, unit) {
  if (value == null) {
    return null;
  }
  switch (unit) {
    case 'percentage':
      return `${Number(value).toFixed(1)}%`;
    case 'csat':
      return Number(value).toFixed(2);
    case 'count':
      return `${Math.round(Number(value))}`;
    case 'currency_usd':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: Math.abs(Number(value)) >= 1000 ? 0 : 2,
      }).format(Number(value));
    default:
      return `${Number(value)}`;
  }
}

function formatTrendLabel(metric) {
  if (metric.trendValue == null) {
    return null;
  }
  const absolute = Math.abs(Number(metric.trendValue));
  const prefix = metric.trendDirection === 'down' ? '-' : '+';
  switch (metric.unit) {
    case 'percentage':
      return `${prefix}${absolute.toFixed(1)} pts`;
    case 'csat':
      return `${prefix}${absolute.toFixed(2)} vs prev.`;
    default:
      return `${prefix}${absolute}`;
  }
}

function formatPeriodLabel(period) {
  if (!period) {
    return null;
  }
  switch (period) {
    case 'rolling_12_months':
      return 'Last 12 months';
    case 'rolling_6_months':
      return 'Last 6 months';
    case 'rolling_3_months':
      return 'Last 3 months';
    case 'ytd':
      return 'Year to date';
    default:
      return period.replace(/_/g, ' ');
  }
}

function mapFreelancerProfile(record) {
  const plain = record.get({ plain: true });
  const profile = plain.Profile ?? {};
  const freelancerProfile = plain.FreelancerProfile ?? {};
  const name = `${plain.firstName ?? ''} ${plain.lastName ?? ''}`.trim() || 'Freelancer';
  const title = freelancerProfile.title || profile.headline || 'Independent professional';
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

  return {
    id: plain.id,
    name,
    title,
    initials,
    avatarSeed: profile.avatarSeed || name,
    location: profile.location ?? null,
    timezone: profile.timezone ?? null,
    status: profile.availabilityStatus ?? null,
    stats: {
      trustScore: profile.trustScore == null ? null : Number(profile.trustScore),
      likes: profile.likesCount ?? 0,
      followers: profile.followersCount ?? 0,
    },
  };
}

const PERSONA_LABELS = {
  mentors: 'Mentors & advisors',
  founders: 'Founders & operators',
  investors: 'Investors & venture partners',
  talent: 'Talent partners & recruiters',
  partners: 'Agency & channel partners',
  press: 'Press & analysts',
  community: 'Community leaders',
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function toNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function toPercent(value, { max = 100, fallback = null } = {}) {
  if (value == null) {
    return fallback;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return clamp((numeric / max) * 100, 0, 100);
}

function ratingToPercent(rating) {
  if (rating == null) {
    return null;
  }
  const numeric = Number(rating);
  if (!Number.isFinite(numeric)) {
    return null;
  }
  return clamp((numeric / 5) * 100, 0, 100);
}

function computeReviewStats(reviews) {
  const now = Date.now();
  let ratingSum = 0;
  let ratingCount = 0;
  let last30Days = 0;
  let last90Days = 0;
  const personaCounts = new Map();
  const visibilityCounts = new Map();
  const historyBuckets = new Map();

  const sorted = [...reviews].sort((a, b) => {
    const dateA = new Date(a.publishedAt ?? a.capturedAt ?? a.createdAt ?? 0).getTime();
    const dateB = new Date(b.publishedAt ?? b.capturedAt ?? b.createdAt ?? 0).getTime();
    return dateB - dateA;
  });

  for (const review of sorted) {
    const rating = review.rating == null ? null : Number(review.rating);
    if (Number.isFinite(rating)) {
      ratingSum += rating;
      ratingCount += 1;
    }

    const personaKey = review.persona ?? 'community';
    personaCounts.set(personaKey, (personaCounts.get(personaKey) ?? 0) + 1);

    const visibilityKey = review.visibility ?? 'public';
    visibilityCounts.set(visibilityKey, (visibilityCounts.get(visibilityKey) ?? 0) + 1);

    const timestamp = new Date(review.publishedAt ?? review.capturedAt ?? review.createdAt ?? 0).getTime();
    if (!Number.isNaN(timestamp) && timestamp > 0) {
      const daysSince = Math.floor((now - timestamp) / (1000 * 60 * 60 * 24));
      if (daysSince <= 30) {
        last30Days += 1;
      }
      if (daysSince <= 90) {
        last90Days += 1;
      }
      const bucketDate = new Date(Date.UTC(new Date(timestamp).getUTCFullYear(), new Date(timestamp).getUTCMonth(), 1));
      const bucketKey = bucketDate.toISOString();
      const entry = historyBuckets.get(bucketKey) ?? {
        total: 0,
        count: 0,
        date: bucketDate,
      };
      if (Number.isFinite(rating)) {
        entry.total += rating;
        entry.count += 1;
      }
      historyBuckets.set(bucketKey, entry);
    }
  }

  const history = Array.from(historyBuckets.values())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map((entry) => ({
      label: entry.date.toLocaleString('en-US', { month: 'short', year: 'numeric' }),
      value: entry.count ? Number(entry.total / entry.count) : 0,
    }));

  return {
    averageRating: ratingCount ? ratingSum / ratingCount : null,
    ratingCount,
    personaCounts,
    visibilityCounts,
    last30Days,
    last90Days,
    history,
    sorted,
  };
}

function determinePrimaryPersona(personaCounts) {
  let topPersona = null;
  let topCount = 0;
  for (const [persona, count] of personaCounts.entries()) {
    if (count > topCount) {
      topPersona = persona;
      topCount = count;
    }
  }
  return topPersona;
}

function describeScoreTier(score) {
  if (score >= 90) return 'Premier credibility';
  if (score >= 80) return 'Trusted authority';
  if (score >= 70) return 'Rising signal';
  if (score >= 55) return 'Stabilising presence';
  return 'Emerging trust';
}

function computeScoreDelta(history) {
  if (!history?.length || history.length < 2) {
    return { label: '+0.0 pts vs prior period', direction: 'up', delta: 0 };
  }
  const last = history[history.length - 1]?.value ?? null;
  const previous = history[history.length - 2]?.value ?? null;
  if (last == null || previous == null) {
    return { label: '+0.0 pts vs prior period', direction: 'up', delta: 0 };
  }
  const delta = (Number(last) - Number(previous)) * 20; // ratings are 0-5, convert to 100 scale
  const formatted = `${delta >= 0 ? '+' : ''}${delta.toFixed(1)} pts vs prior period`;
  return { label: formatted, direction: delta >= 0 ? 'up' : 'down', delta };
}

function buildSegments({ metricsByType, reviewStats, summary, shareableLinks }) {
  const onTime = toNumber(metricsByType.on_time_delivery_rate?.value, 0);
  const onTimeTrend = toNumber(metricsByType.on_time_delivery_rate?.trendValue, 0);
  const csatRaw = metricsByType.average_csat?.unit === 'percentage'
    ? toPercent(metricsByType.average_csat?.value, { max: 100, fallback: 80 })
    : ratingToPercent(metricsByType.average_csat?.value);
  const csatPercent = csatRaw == null ? 80 : csatRaw;
  const deliveryScore = Math.round((clamp(onTime, 0, 100) * 0.6) + csatPercent * 0.4);
  const deliveryDelta = onTimeTrend;

  const testimonialVolume = summary?.totals?.testimonials ?? 0;
  const advocacyScore = Math.round(
    (ratingToPercent(reviewStats.averageRating) ?? 78) * 0.6 +
      clamp((testimonialVolume / 12) * 100, 0, 100) * 0.4,
  );
  const reviewDelta = computeScoreDelta(reviewStats.history).delta;

  const publishedStories = summary?.totals?.publishedStories ?? 0;
  const activeWidgets = summary?.totals?.activeWidgets ?? 0;
  const brandScore = clamp(publishedStories * 12 + activeWidgets * 15 + shareableLinks.length * 8, 0, 100);
  const recentShareables = shareableLinks.filter((link) => {
    if (!link.publishedAt) return false;
    const timestamp = new Date(link.publishedAt).getTime();
    if (Number.isNaN(timestamp)) return false;
    const diff = Date.now() - timestamp;
    return diff <= 1000 * 60 * 60 * 24 * 90;
  }).length;
  const priorShareables = shareableLinks.length - recentShareables;
  const brandDelta = priorShareables <= 0 ? recentShareables * 5 : (recentShareables - priorShareables) * 3;

  return [
    {
      label: 'Delivery excellence',
      score: deliveryScore,
      deltaLabel: `${deliveryDelta >= 0 ? '+' : ''}${(deliveryDelta ?? 0).toFixed(1)} pts`,
      deltaDirection: deliveryDelta >= 0 ? 'up' : 'down',
      description: `On-time delivery at ${onTime.toFixed(1)}% with CSAT ${(metricsByType.average_csat?.value ?? '—')}.`,
      guardrail: 'Maintain verified handoffs within 24h of milestone sign-off.',
    },
    {
      label: 'Client advocacy',
      score: advocacyScore,
      deltaLabel: `${reviewDelta >= 0 ? '+' : ''}${reviewDelta.toFixed(1)} pts`,
      deltaDirection: reviewDelta >= 0 ? 'up' : 'down',
      description: `${testimonialVolume} testimonials and ${reviewStats.ratingCount} long-form reviews reinforce executive trust.`,
      guardrail: 'Keep response SLAs under 48h to protect promoter momentum.',
    },
    {
      label: 'Brand amplification',
      score: Math.round(brandScore),
      deltaLabel: `${brandDelta >= 0 ? '+' : ''}${brandDelta.toFixed(1)} pts`,
      deltaDirection: brandDelta >= 0 ? 'up' : 'down',
      description: `${publishedStories} case studies, ${activeWidgets} active widgets, and ${shareableLinks.length} shareable assets.`,
      guardrail: 'Refresh spotlight assets quarterly to stay aligned with enterprise launches.',
    },
  ];
}

function buildBenchmarks({ metricsByType, globalMetrics, reviewStats }) {
  const benchmarks = [];
  const onTime = toNumber(metricsByType.on_time_delivery_rate?.value, null);
  if (onTime != null) {
    const global = globalMetrics.on_time_delivery_rate ?? null;
    const delta = global == null ? null : onTime - global;
    benchmarks.push({
      label: 'On-time delivery',
      value: `${onTime.toFixed(1)}%`,
      delta: delta == null ? null : `${Math.abs(delta).toFixed(1)}%`,
      deltaDirection: delta == null ? 'up' : delta >= 0 ? 'up' : 'down',
    });
  }

  if (reviewStats.averageRating != null) {
    const rating = reviewStats.averageRating;
    const globalRating = globalMetrics.review_average ?? null;
    const delta = globalRating == null ? null : (rating - globalRating).toFixed(2);
    benchmarks.push({
      label: 'Average review rating',
      value: `${rating.toFixed(2)} / 5`,
      delta: delta == null ? null : `${Math.abs(Number(delta)).toFixed(2)}`,
      deltaDirection: delta == null ? 'up' : Number(delta) >= 0 ? 'up' : 'down',
    });
  }

  const referrals = toNumber(metricsByType.referral_ready_clients?.value, null);
  if (referrals != null) {
    const globalReferrals = globalMetrics.referral_ready_clients ?? null;
    const delta = globalReferrals == null ? null : referrals - globalReferrals;
    benchmarks.push({
      label: 'Referral-ready clients',
      value: `${Math.round(referrals)}`,
      delta: delta == null ? null : `${Math.abs(Math.round(delta))}`,
      deltaDirection: delta == null ? 'up' : delta >= 0 ? 'up' : 'down',
    });
  }

  return benchmarks;
}

function buildRecommendations({ metricsByType, reviewStats, summary, personaKey }) {
  const items = [];
  const rating = reviewStats.averageRating ?? 0;
  if (rating < 4.8) {
    items.push({
      title: 'Launch advocate coaching sessions',
      impact: `Lift average rating from ${rating.toFixed(2)} to 4.9+`,
      checklist: [
        'Schedule 2x monthly client retros with success and delivery',
        'Capture verbatims to enrich future testimonial prompts',
        'Route detractor feedback to operations within 24h',
      ],
      owner: 'Client success',
      dueLabel: 'Next sprint',
    });
  }

  const testimonials = summary?.totals?.testimonials ?? 0;
  if (testimonials < 12) {
    items.push({
      title: 'Automate quarterly testimonial drives',
      impact: 'Reach 12+ live testimonials per persona',
      checklist: [
        'Trigger outreach after milestone sign-off',
        'Offer persona-specific prompts inside Review Composer',
        'Track completion in CRM with nurture follow-up',
      ],
      owner: PERSONA_LABELS[personaKey] ?? 'Marketing ops',
      dueLabel: '30 days',
    });
  }

  const activeWidgets = summary?.totals?.activeWidgets ?? 0;
  if (activeWidgets < 3) {
    items.push({
      title: 'Expand live review widgets',
      impact: 'Embed social proof across proposals and deal rooms',
      checklist: [
        'Activate widgets for proposals, pitches, and profile hero',
        'Sync embed audit with design system reviewers',
        'Instrument CTA tracking for each surface',
      ],
      owner: 'Growth marketing',
      dueLabel: 'This quarter',
    });
  }

  return items.slice(0, 3);
}

function buildMilestones(successStories, testimonials) {
  const milestoneStories = successStories
    .filter((story) => story.publishedAt)
    .slice(0, 3)
    .map((story) => ({
      id: `story-${story.id}`,
      title: story.title,
      summary: story.summary,
      date: story.publishedAt,
    }));

  const milestoneTestimonials = testimonials
    .filter((testimonial) => testimonial.capturedAt)
    .slice(0, 2)
    .map((testimonial) => ({
      id: `testimonial-${testimonial.id}`,
      title: testimonial.clientName ?? 'Client endorsement',
      summary: testimonial.comment.slice(0, 140),
      date: testimonial.capturedAt,
    }));

  return [...milestoneStories, ...milestoneTestimonials].slice(0, 4);
}

function buildAchievements(badges) {
  return badges.slice(0, 4).map((badge) => ({
    title: badge.name,
    description: badge.description ?? badge.badgeType ?? '',
    issuedAt: badge.issuedAt,
  }));
}

function buildPersonaInsight({ personaKey, personaCounts, reviewStats, metricsByType }) {
  if (!personaKey) {
    return null;
  }
  const highlights = [];
  const personaLabel = PERSONA_LABELS[personaKey] ?? personaKey;
  const personaTotal = personaCounts.get(personaKey) ?? 0;
  highlights.push(`${personaLabel} supplied ${personaTotal} endorsements this year.`);
  if (reviewStats.averageRating != null) {
    highlights.push(`Average sentiment sits at ${reviewStats.averageRating.toFixed(2)} / 5 across ${reviewStats.ratingCount} reviews.`);
  }
  if (metricsByType.referral_ready_clients?.value != null) {
    highlights.push(`Identified ${Math.round(Number(metricsByType.referral_ready_clients.value))} referral-ready advocates ready for spotlight outreach.`);
  }
  return { highlights };
}

function selectScorecardHighlight({ reviews, testimonials }) {
  const candidate = reviews.find((review) => review.highlighted) ?? reviews[0] ?? null;
  if (candidate) {
    return {
      quote: candidate.body,
      author: candidate.reviewerName ?? 'Verified client',
      role: [candidate.reviewerRole, candidate.reviewerCompany].filter(Boolean).join(' • ') || 'Client partner',
      avatar: candidate.reviewerAvatarUrl ?? null,
      date: candidate.publishedAt ?? candidate.capturedAt ?? candidate.createdAt ?? new Date().toISOString(),
    };
  }
  const testimonial = testimonials.find((item) => item.isFeatured) ?? testimonials[0] ?? null;
  if (testimonial) {
    return {
      quote: testimonial.comment,
      author: testimonial.clientName ?? 'Client partner',
      role: [testimonial.clientRole, testimonial.company].filter(Boolean).join(' • ') || 'Trusted collaborator',
      avatar: testimonial.media?.avatarUrl ?? null,
      date: testimonial.capturedAt ?? testimonial.createdAt ?? new Date().toISOString(),
    };
  }
  return null;
}

function extractTagLibrary(reviews, testimonials) {
  const tags = new Map();
  for (const review of reviews) {
    if (Array.isArray(review.tags)) {
      review.tags.forEach((tag) => {
        if (!tag) return;
        const label = typeof tag === 'string' ? tag : tag.label ?? tag.name;
        if (!label) return;
        const normalized = label.trim();
        if (!normalized) return;
        tags.set(normalized.toLowerCase(), normalized);
      });
    }
  }
  for (const testimonial of testimonials) {
    const label = testimonial.projectName ?? testimonial.company;
    if (label) {
      const normalized = label.trim();
      tags.set(normalized.toLowerCase(), normalized);
    }
  }
  return Array.from(tags.values()).slice(0, 20).map((label) => ({ id: label.toLowerCase().replace(/[^a-z0-9]+/g, '-'), label }));
}

function buildReviewComposerConfig({ freelancer, personaKey, reviewStats, metricsByType, summary, testimonials, reviews }) {
  const personaPrompts = {};
  for (const persona of FREELANCER_REVIEW_PERSONAS) {
    const label = PERSONA_LABELS[persona] ?? persona;
    const prompts = [];
    if (metricsByType.average_csat?.value != null) {
      prompts.push({
        id: `${persona}-impact`,
        title: 'Impact delivered',
        text: `Reference the measurable outcome (e.g. CSAT ${metricsByType.average_csat.value}) that this engagement unlocked.`,
      });
    }
    const testimonial = testimonials.find((item) => item.metadata?.personas?.includes?.(persona));
    if (testimonial) {
      prompts.push({
        id: `${persona}-moment`,
        title: 'Moment that mattered',
        text: `Describe the pivotal collaboration moment similar to “${testimonial.comment.slice(0, 90)}…”`,
      });
    }
    prompts.push({
      id: `${persona}-next-step`,
      title: 'Call to action',
      text: 'Suggest the next step for peers considering a partnership (e.g. book a strategy session, join a pilot).',
    });
    personaPrompts[persona] = {
      label,
      summary: `${label} have contributed ${reviewStats.personaCounts.get(persona) ?? 0} endorsements to date.`,
      prompts,
    };
  }

  const trustScoreDisplay = freelancer.stats?.trustScore == null
    ? '—'
    : Number(freelancer.stats.trustScore).toFixed(1);
  const averageRatingDisplay = reviewStats.averageRating == null
    ? '—'
    : Number(reviewStats.averageRating).toFixed(2);

  const guidelines = [
    `Cite quantifiable outcomes where possible — current trust score stands at ${trustScoreDisplay}.`,
    `Keep reviews above 80 words to preserve executive-level depth (current average rating ${averageRatingDisplay}).`,
    `Respect confidentiality: omit client-sensitive data unless approvals recorded in Gigvora.`,
  ];

  const defaultPersona = personaKey ?? FREELANCER_REVIEW_PERSONAS[0];
  const shareableCount = reviews.filter((review) => review.shareToProfile !== false).length;
  const visibilityPreference = shareableCount >= reviews.length / 2 ? 'public' : 'members';

  return {
    profile: {
      name: freelancer.name,
      headline: freelancer.title,
      avatar: freelancer.avatarUrl ?? null,
    },
    personaPrompts,
    defaultPersona,
    tagLibrary: extractTagLibrary(reviews, testimonials),
    guidelines,
    attachmentsEnabled: true,
    maxAttachmentSize: 15 * 1024 * 1024,
    characterLimit: 1200,
    defaultVisibility: visibilityPreference,
  };
}

function mapReviewToEndorsement(review) {
  const timestamp = new Date(review.publishedAt ?? review.capturedAt ?? review.createdAt ?? Date.now()).getTime();
  const daysWindow = Number.isNaN(timestamp) ? null : Math.max(0, Math.round((Date.now() - timestamp) / (1000 * 60 * 60 * 24)));
  return {
    id: String(review.id),
    endorser: {
      name: review.reviewerName ?? 'Verified client',
      avatar: review.reviewerAvatarUrl ?? null,
      role: [review.reviewerRole, review.reviewerCompany].filter(Boolean).join(' • ') || 'Client partner',
    },
    quote: review.body,
    highlights: Array.isArray(review.endorsementHighlights) ? review.endorsementHighlights : [],
    tags: Array.isArray(review.tags)
      ? review.tags.map((tag) => (typeof tag === 'string' ? tag : tag.label ?? tag.name)).filter(Boolean)
      : [],
    rating: review.rating == null ? null : Number(review.rating),
    submittedAt: review.publishedAt ?? review.capturedAt ?? review.createdAt ?? new Date().toISOString(),
    visibility: review.visibility ?? 'public',
    persona: review.persona ?? 'community',
    window: daysWindow,
    channel: review.endorsementChannel ?? review.reviewSource ?? 'direct',
    headline: review.endorsementHeadline ?? review.title,
  };
}

function buildEndorsementWallPayload({ reviews, reviewStats, summary }) {
  const endorsements = reviews.map(mapReviewToEndorsement);
  const spotlightSource = reviews.find((review) => review.highlighted) ?? reviews[0] ?? null;
  const spotlight = spotlightSource
    ? {
        title: spotlightSource.title ?? 'Flagship endorsement',
        quote: spotlightSource.body,
        endorser: {
          name: spotlightSource.reviewerName ?? 'Verified client',
          avatar: spotlightSource.reviewerAvatarUrl ?? null,
          role: [spotlightSource.reviewerRole, spotlightSource.reviewerCompany].filter(Boolean).join(' • ') || 'Client partner',
        },
        submittedAt: spotlightSource.publishedAt ?? spotlightSource.capturedAt ?? spotlightSource.createdAt ?? new Date().toISOString(),
        highlights: Array.isArray(spotlightSource.endorsementHighlights)
          ? spotlightSource.endorsementHighlights
          : [],
        verifiedBy: spotlightSource.metadata?.verifiedBy ?? 'Gigvora client success',
        metrics: [
          spotlightSource.rating != null
            ? { label: 'Rating', value: `${Number(spotlightSource.rating).toFixed(1)} / 5` }
            : null,
          spotlightSource.endorsementChannel
            ? { label: 'Channel', value: spotlightSource.endorsementChannel }
            : null,
          spotlightSource.visibility
            ? { label: 'Visibility', value: spotlightSource.visibility }
            : null,
        ].filter(Boolean),
      }
    : null;

  const priorWindow = Math.max(reviewStats.last90Days - reviewStats.last30Days, 0);
  const priorAverage = priorWindow / 2 || 0;
  const endorsementDelta = reviewStats.last30Days - priorAverage;

  const shareableAdvocates = reviews.filter((review) => review.shareToProfile !== false && review.visibility !== 'private').length;

  const stats = [
    {
      label: 'Endorsements (30d)',
      value: `${reviewStats.last30Days}`,
      delta: `${endorsementDelta >= 0 ? '+' : ''}${endorsementDelta.toFixed(1)} vs prior 60d`,
      deltaDirection: endorsementDelta >= 0 ? 'up' : 'down',
      caption: 'Volume of new testimonials captured in the last 30 days.',
    },
    {
      label: 'Avg rating',
      value: reviewStats.averageRating != null ? `${reviewStats.averageRating.toFixed(2)} / 5` : '—',
      delta: null,
      caption: 'Live average across all published reviews.',
    },
    {
      label: 'Share-ready champions',
      value: `${shareableAdvocates}`,
      delta: `${shareableAdvocates}/${summary?.totals?.testimonials ?? reviews.length}`,
      deltaDirection: 'up',
      caption: 'Advocates who opted into public sharing.',
    },
  ];

  return {
    endorsements,
    spotlight,
    stats,
  };
}

function indexByMetricType(metrics) {
  return metrics.reduce((accumulator, metric) => {
    accumulator[metric.metricType] = metric;
    return accumulator;
  }, {});
}

function deriveAutomationPlaybooks({ metricsByType, promotedBadges, widgets }) {
  const onTime = metricsByType.on_time_delivery_rate;
  const csat = metricsByType.average_csat;
  const referrals = metricsByType.referral_ready_clients;
  const activeWidgets = widgets.filter((widget) => widget.status === 'active');

  return [
    onTime
      ? `Auto-schedule testimonial requests 24h after delivery to protect a ${formatMetricValue(onTime.value, onTime.unit)} on-time streak.`
      : 'Auto-schedule testimonial requests after each milestone sign-off.',
    csat
      ? `Launch a save plan whenever CSAT dips below ${formatMetricValue(csat.value, csat.unit)}.`
      : 'Alert account leads when satisfaction surveys fall below target.',
    promotedBadges.length
      ? `Issue ${promotedBadges.length} featured badges automatically when revenue or certification milestones hit.`
      : 'Issue featured badges when freelancers complete certification or revenue targets.',
    activeWidgets.length
      ? `Embed ${activeWidgets.length} live review widgets across proposals, gig listings, and portals.`
      : 'Publish review widgets to proposals, gig listings, and profile banners.',
    referrals
      ? `Nurture ${Math.round(Number(referrals.value))} referral-ready clients with quarterly spotlights.`
      : 'Identify referral-ready clients and enrol them into nurture journeys.',
  ];
}

function deriveIntegrationTouchpoints({ successStories, widgets }) {
  const integrations = new Set([
    'Gigvora public profile',
    'Proposal PDFs & pitch decks',
    'Notion, Webflow, and CMS embeds',
    'LinkedIn, Behance, and Dribbble showcases',
    'Zapier, Make, and webhook automations',
    'CRM deal rooms (HubSpot & Salesforce)',
  ]);

  if (successStories.some((story) => story.ctaUrl)) {
    integrations.add('Email newsletters and nurture campaigns');
  }
  if (widgets.some((widget) => widget.status === 'active')) {
    integrations.add('Portfolio landing pages & microsites');
  }

  return Array.from(integrations);
}

async function fetchGlobalMetricAverages(metricTypes = []) {
  if (!metricTypes?.length) {
    return {};
  }
  const records = await ReputationMetric.findAll({
    attributes: [
      'metricType',
      [sequelize.fn('AVG', sequelize.col('value')), 'avgValue'],
    ],
    where: { metricType: { [Op.in]: metricTypes } },
    group: ['metricType'],
    raw: true,
  });
  return records.reduce((accumulator, record) => {
    accumulator[record.metricType] = Number(record.avgValue ?? 0);
    return accumulator;
  }, {});
}

async function fetchNetworkReviewAverage() {
  const record = await FreelancerReview.findOne({
    attributes: [[sequelize.fn('AVG', sequelize.col('rating')), 'avgRating']],
    where: {
      status: 'published',
      rating: { [Op.ne]: null },
    },
    raw: true,
  });
  return record?.avgRating == null ? null : Number(record.avgRating);
}

export async function getFreelancerReputationOverview({
  freelancerId,
  includeDrafts = false,
  limitTestimonials = 8,
  limitStories = 6,
} = {}) {
  const id = normalizeFreelancerId(freelancerId);

  const freelancer = await User.findByPk(id, {
    include: [
      { model: Profile },
      { model: FreelancerProfile },
    ],
  });

  if (!freelancer) {
    throw new NotFoundError('Freelancer profile not found');
  }

  const testimonialWhere = { freelancerId: id };
  if (!includeDrafts) {
    testimonialWhere.status = 'approved';
    testimonialWhere.moderationStatus = 'approved';
  } else {
    testimonialWhere.status = { [Op.ne]: 'archived' };
  }

  const successStoryWhere = { freelancerId: id };
  if (!includeDrafts) {
    successStoryWhere.status = 'published';
    successStoryWhere.moderationStatus = 'approved';
  } else {
    successStoryWhere.status = { [Op.ne]: 'archived' };
  }

  const widgetWhere = { freelancerId: id };
  if (!includeDrafts) {
    widgetWhere.status = { [Op.ne]: 'draft' };
  }

  const reviewWhere = { freelancerId: id };
  if (!includeDrafts) {
    reviewWhere.status = 'published';
    reviewWhere.visibility = { [Op.ne]: 'private' };
  }

  const benchmarkMetricTypes = ['on_time_delivery_rate', 'average_csat', 'referral_ready_clients'];

  const [
    testimonialRecords,
    successStoryRecords,
    metricRecords,
    badgeRecords,
    widgetRecords,
    reviewRecords,
    globalMetricAverages,
    networkReviewAverage,
  ] = await Promise.all([
    ReputationTestimonial.findAll({
      where: testimonialWhere,
      order: [
        ['isFeatured', 'DESC'],
        ['capturedAt', 'DESC NULLS LAST'],
        ['createdAt', 'DESC'],
      ],
      limit: limitTestimonials,
    }),
    ReputationSuccessStory.findAll({
      where: successStoryWhere,
      order: [
        ['featured', 'DESC'],
        ['publishedAt', 'DESC NULLS LAST'],
        ['createdAt', 'DESC'],
      ],
      limit: limitStories,
    }),
    ReputationMetric.findAll({
      where: { freelancerId: id },
      order: [['label', 'ASC']],
    }),
    ReputationBadge.findAll({
      where: { freelancerId: id },
      order: [
        ['isPromoted', 'DESC'],
        ['issuedAt', 'DESC NULLS LAST'],
      ],
    }),
    ReputationReviewWidget.findAll({
      where: widgetWhere,
      order: [
        ['status', 'ASC'],
        ['updatedAt', 'DESC'],
      ],
    }),
    FreelancerReview.findAll({
      where: reviewWhere,
      order: [
        ['highlighted', 'DESC'],
        ['publishedAt', 'DESC NULLS LAST'],
        ['capturedAt', 'DESC NULLS LAST'],
        ['createdAt', 'DESC'],
      ],
    }),
    fetchGlobalMetricAverages(benchmarkMetricTypes),
    fetchNetworkReviewAverage(),
  ]);

  const testimonials = testimonialRecords.map((record) => record.toPublicObject());
  const successStories = successStoryRecords.map((record) => record.toPublicObject());
  const metrics = metricRecords.map((record) => {
    const payload = record.toPublicObject();
    return {
      ...payload,
      formattedValue: formatMetricValue(payload.value, payload.unit),
      trendLabel: formatTrendLabel(payload),
      periodLabel: formatPeriodLabel(payload.period),
    };
  });
  const badges = badgeRecords.map((record) => record.toPublicObject());
  const widgets = widgetRecords.map((record) => record.toPublicObject());
  const reviews = reviewRecords.map((record) => record.toPublicObject());

  const metricsByType = indexByMetricType(metrics);
  const promotedBadges = badges.filter((badge) => badge.isPromoted);
  const activeWidgets = widgets.filter((widget) => widget.status === 'active');

  const featuredTestimonial = testimonials.find((testimonial) => testimonial.isFeatured) ?? testimonials[0] ?? null;
  const remainingTestimonials = featuredTestimonial
    ? testimonials.filter((testimonial) => testimonial.id !== featuredTestimonial.id)
    : testimonials;

  const featuredStory = successStories.find((story) => story.featured) ?? successStories[0] ?? null;
  const publishedStories = successStories.filter((story) => story.status === 'published');

  const lastVerification = metrics
    .map((metric) => (metric.verifiedAt ? new Date(metric.verifiedAt).getTime() : 0))
    .reduce((latest, current) => (current > latest ? current : latest), 0);

  const summary = {
    totals: {
      testimonials: testimonials.length,
      publishedStories: publishedStories.length,
      badges: badges.length,
      activeWidgets: activeWidgets.length,
    },
    performance: {
      onTimeDeliveryRate: metricsByType.on_time_delivery_rate?.value ?? null,
      averageCsat: metricsByType.average_csat?.value ?? null,
      referralReadyClients: metricsByType.referral_ready_clients?.value ?? null,
      caseStudiesPublished: publishedStories.length,
    },
    lastVerifiedAt: lastVerification ? new Date(lastVerification).toISOString() : null,
  };

  const automationPlaybooks = deriveAutomationPlaybooks({ metricsByType, promotedBadges, widgets });
  const integrationTouchpoints = deriveIntegrationTouchpoints({ successStories: publishedStories, widgets });

  const shareableLinks = [];
  if (featuredTestimonial?.shareUrl) {
    shareableLinks.push({
      label: 'Featured testimonial',
      url: featuredTestimonial.shareUrl,
      publishedAt: featuredTestimonial.capturedAt ?? featuredTestimonial.createdAt ?? null,
    });
  }
  for (const story of publishedStories) {
    if (story.ctaUrl) {
      shareableLinks.push({
        label: `${story.title} CTA`,
        url: story.ctaUrl,
        publishedAt: story.publishedAt ?? story.createdAt ?? null,
      });
    }
  }

  const freelancerProfile = mapFreelancerProfile(freelancer);
  const reviewStats = computeReviewStats(reviews);
  const personaKey = determinePrimaryPersona(reviewStats.personaCounts);
  const globalMetrics = {
    ...globalMetricAverages,
    review_average: networkReviewAverage ?? null,
  };

  summary.totals.publishedReviews = reviewStats.ratingCount;
  summary.performance.averageReviewRating = reviewStats.averageRating;

  const segments = buildSegments({ metricsByType, reviewStats, summary, shareableLinks });
  const benchmarks = buildBenchmarks({ metricsByType, globalMetrics, reviewStats });
  const recommendations = buildRecommendations({ metricsByType, reviewStats, summary, personaKey });
  const timelineMilestones = buildMilestones(successStories, testimonials);
  const achievements = buildAchievements(promotedBadges.length ? promotedBadges : badges);
  const personaInsight = buildPersonaInsight({
    personaKey,
    personaCounts: reviewStats.personaCounts,
    reviewStats,
    metricsByType,
  });
  const highlight = selectScorecardHighlight({ reviews, testimonials });
  const trendHistory = reviewStats.history;
  const scoreDelta = computeScoreDelta(trendHistory);

  const trustScore = freelancerProfile.stats?.trustScore == null
    ? null
    : clamp(Number(freelancerProfile.stats.trustScore), 0, 100);
  const ratingPercent = ratingToPercent(reviewStats.averageRating);
  const onTimePercent = toPercent(metricsByType.on_time_delivery_rate?.value, { max: 100, fallback: 78 });
  const csatPercent = metricsByType.average_csat?.unit === 'percentage'
    ? toPercent(metricsByType.average_csat?.value, { max: 100, fallback: 82 })
    : ratingToPercent(metricsByType.average_csat?.value);
  const referralsPercent = toPercent(metricsByType.referral_ready_clients?.value, { max: 40, fallback: 55 });
  const brandPercent = segments[2]?.score ?? 65;

  const weightedComponents = [
    { value: trustScore, weight: 0.3 },
    { value: ratingPercent, weight: 0.2 },
    { value: onTimePercent, weight: 0.15 },
    { value: csatPercent, weight: 0.15 },
    { value: referralsPercent, weight: 0.1 },
    { value: brandPercent, weight: 0.1 },
  ];

  let weightedTotal = 0;
  let weightSum = 0;
  for (const { value, weight } of weightedComponents) {
    if (value != null) {
      weightedTotal += clamp(Number(value), 0, 100) * weight;
      weightSum += weight;
    }
  }
  const overallScore = Math.round(weightSum ? weightedTotal / weightSum : 72);

  const scorecardProfile = {
    headline: freelancerProfile.title,
    summary: `Operating ${summary.totals.testimonials} testimonials, ${summary.totals.publishedStories} case studies, and ${summary.totals.badges} badges across trust surfaces.`,
  };

  const scorecard = {
    profile: scorecardProfile,
    overallScore,
    scoreLabel: describeScoreTier(overallScore),
    scoreDeltaLabel: scoreDelta.label,
    scoreDeltaDirection: scoreDelta.direction,
    milestone: featuredStory?.title ?? null,
    personaFocus: personaKey ? PERSONA_LABELS[personaKey] ?? personaKey : null,
    trend: { history: trendHistory },
    segments,
    benchmarks,
    achievements,
    recommendations,
    milestones: timelineMilestones,
    personaInsight,
    highlight,
  };

  const reviewComposer = buildReviewComposerConfig({
    freelancer: freelancerProfile,
    personaKey,
    reviewStats,
    metricsByType,
    summary,
    testimonials,
    reviews,
  });

  const endorsementWall = buildEndorsementWallPayload({ reviews, reviewStats, summary });

  return {
    freelancer: freelancerProfile,
    summary,
    metrics,
    testimonials: {
      featured: featuredTestimonial,
      recent: remainingTestimonials,
    },
    successStories: {
      featured: featuredStory,
      collection: successStories,
    },
    badges: {
      promoted: promotedBadges,
      collection: badges,
    },
    reviewWidgets: widgets,
    automationPlaybooks,
    integrationTouchpoints,
    shareableLinks,
    scorecard,
    reviewComposer,
    endorsementWall,
  };
}

export async function createTestimonial(freelancerId, payload) {
  const id = normalizeFreelancerId(freelancerId);
  await ensureFreelancerExists(id);

  const clientName = sanitizeString(payload.clientName, { allowNull: false });
  const comment = sanitizeString(payload.comment, { allowNull: false, maxLength: 10000 });

  if (!clientName) {
    throw new ValidationError('clientName is required');
  }
  if (!comment) {
    throw new ValidationError('comment is required');
  }

  const rating = payload.rating == null ? null : parseDecimal(payload.rating, { allowNull: true, min: 0, max: 5 });
  const source = sanitizeString(payload.source ?? 'portal', { allowNull: false });
  if (!REPUTATION_TESTIMONIAL_SOURCES.includes(source)) {
    throw new ValidationError(`source must be one of: ${REPUTATION_TESTIMONIAL_SOURCES.join(', ')}`);
  }

  const status = sanitizeString(payload.status ?? 'pending', { allowNull: false });
  if (!REPUTATION_TESTIMONIAL_STATUSES.includes(status)) {
    throw new ValidationError(`status must be one of: ${REPUTATION_TESTIMONIAL_STATUSES.join(', ')}`);
  }

  const clientRole = sanitizeString(payload.clientRole);
  const company = sanitizeString(payload.company);
  const projectName = sanitizeString(payload.projectName);
  const clientEmail = sanitizeEmail(payload.clientEmail);
  const sourceUrl = payload.sourceUrl ? sanitizeUrl(payload.sourceUrl) : null;
  const verification = verifyClientIdentity({ clientName, clientEmail, company, sourceUrl });
  const moderation = analyseTestimonial({ comment, metadata: { rating } });
  const moderationStatus = moderation.status ?? 'pending';
  const moderatedAt = new Date();
  const workflowStatus =
    status === 'approved' && moderationStatus !== 'approved' ? 'pending' : status;

  const record = await ReputationTestimonial.create({
    freelancerId: id,
    clientName,
    clientRole,
    company,
    clientEmail,
    projectName,
    sourceUrl,
    rating,
    comment,
    capturedAt: parseDate(payload.capturedAt),
    deliveredAt: parseDate(payload.deliveredAt),
    source,
    status: workflowStatus,
    moderationStatus,
    moderationScore: moderation.score ?? null,
    moderationSummary: moderation.summary ?? null,
    moderationLabels: moderation.labels ?? null,
    moderatedAt,
    verifiedClient: Boolean(verification.verified),
    verificationMetadata: verification.metadata ?? null,
    isFeatured: Boolean(payload.isFeatured),
    shareUrl: payload.shareUrl ? sanitizeUrl(payload.shareUrl) : null,
    media: payload.media ?? null,
    metadata: payload.metadata ?? null,
  });

  return record.toPublicObject();
}

export async function createSuccessStory(freelancerId, payload) {
  const id = normalizeFreelancerId(freelancerId);
  await ensureFreelancerExists(id);

  const title = sanitizeString(payload.title, { allowNull: false });
  const summary = sanitizeString(payload.summary, { allowNull: false, maxLength: 10000 });

  if (!title) {
    throw new ValidationError('title is required');
  }
  if (!summary) {
    throw new ValidationError('summary is required');
  }

  const status = sanitizeString(payload.status ?? 'draft', { allowNull: false });
  if (!REPUTATION_SUCCESS_STORY_STATUSES.includes(status)) {
    throw new ValidationError(`status must be one of: ${REPUTATION_SUCCESS_STORY_STATUSES.join(', ')}`);
  }

  const desiredSlug = payload.slug ? generateSlug(payload.slug) : generateSlug(title);
  const slug = await ensureUniqueSlug(ReputationSuccessStory, id, desiredSlug);

  const moderation = analyseSuccessStory({
    summary,
    content: payload.content ?? null,
    metadata: { status },
  });
  const moderationStatus = moderation.status ?? 'pending';
  const moderatedAt = new Date();
  const workflowStatus =
    status === 'published' && moderationStatus !== 'approved' ? 'in_review' : status;

  const record = await ReputationSuccessStory.create({
    freelancerId: id,
    title,
    slug,
    summary,
    content: payload.content ?? null,
    heroImageUrl: payload.heroImageUrl ? sanitizeUrl(payload.heroImageUrl) : null,
    status: workflowStatus,
    moderationStatus,
    moderationScore: moderation.score ?? null,
    moderationSummary: moderation.summary ?? null,
    moderationLabels: moderation.labels ?? null,
    moderatedAt,
    publishedAt: parseDate(payload.publishedAt, { allowNull: true }),
    featured: Boolean(payload.featured),
    impactMetrics: payload.impactMetrics ?? null,
    ctaUrl: payload.ctaUrl ? sanitizeUrl(payload.ctaUrl) : null,
    metadata: payload.metadata ?? null,
  });

  return record.toPublicObject();
}

export async function upsertMetric(freelancerId, payload) {
  const id = normalizeFreelancerId(freelancerId);
  await ensureFreelancerExists(id);

  const metricType = sanitizeString(payload.metricType, { allowNull: false, maxLength: 120 }).toLowerCase();
  const label = sanitizeString(payload.label ?? metricType, { allowNull: false });
  const value = parseDecimal(payload.value, { allowNull: false });
  const unit = sanitizeString(payload.unit ?? null, { allowNull: true, maxLength: 60 });
  const period = sanitizeString(payload.period ?? 'rolling_12_months', { allowNull: false, maxLength: 120 }).toLowerCase();
  const trendDirection = sanitizeString(payload.trendDirection ?? 'flat', {
    allowNull: false,
    maxLength: 10,
  }).toLowerCase();

  if (!REPUTATION_METRIC_TREND_DIRECTIONS.includes(trendDirection)) {
    throw new ValidationError(`trendDirection must be one of: ${REPUTATION_METRIC_TREND_DIRECTIONS.join(', ')}`);
  }

  const trendValue = payload.trendValue == null ? null : parseDecimal(payload.trendValue, { allowNull: true });
  const verifiedAt = parseDate(payload.verifiedAt, { allowNull: true });

  const [record, created] = await ReputationMetric.findOrCreate({
    where: { freelancerId: id, metricType, period },
    defaults: {
      label,
      value,
      unit,
      source: payload.source ?? null,
      trendDirection,
      trendValue,
      verifiedBy: sanitizeString(payload.verifiedBy),
      verifiedAt,
      metadata: payload.metadata ?? null,
    },
  });

  if (!created) {
    await record.update({
      label,
      value,
      unit,
      source: payload.source ?? null,
      trendDirection,
      trendValue,
      verifiedBy: sanitizeString(payload.verifiedBy),
      verifiedAt,
      metadata: payload.metadata ?? null,
    });
  }

  return record.toPublicObject();
}

export async function createBadge(freelancerId, payload) {
  const id = normalizeFreelancerId(freelancerId);
  await ensureFreelancerExists(id);

  const name = sanitizeString(payload.name, { allowNull: false });
  if (!name) {
    throw new ValidationError('name is required');
  }

  const desiredSlug = payload.slug ? generateSlug(payload.slug) : generateSlug(name);
  const slug = await ensureUniqueSlug(ReputationBadge, id, desiredSlug);

  const record = await ReputationBadge.create({
    freelancerId: id,
    name,
    slug,
    description: sanitizeString(payload.description, { maxLength: 2000 }),
    issuedBy: sanitizeString(payload.issuedBy),
    issuedAt: parseDate(payload.issuedAt),
    expiresAt: parseDate(payload.expiresAt),
    badgeType: sanitizeString(payload.badgeType),
    level: sanitizeString(payload.level, { maxLength: 60 }),
    assetUrl: payload.assetUrl ? sanitizeUrl(payload.assetUrl) : null,
    isPromoted: Boolean(payload.isPromoted),
    metadata: payload.metadata ?? null,
  });

  return record.toPublicObject();
}

export async function createReviewWidget(freelancerId, payload) {
  const id = normalizeFreelancerId(freelancerId);
  await ensureFreelancerExists(id);

  const name = sanitizeString(payload.name, { allowNull: false });
  const widgetType = sanitizeString(payload.widgetType, { allowNull: false, maxLength: 120 }).toLowerCase();
  if (!name) {
    throw new ValidationError('name is required');
  }
  if (!widgetType) {
    throw new ValidationError('widgetType is required');
  }

  const status = sanitizeString(payload.status ?? 'draft', { allowNull: false }).toLowerCase();
  if (!REPUTATION_REVIEW_WIDGET_STATUSES.includes(status)) {
    throw new ValidationError(`status must be one of: ${REPUTATION_REVIEW_WIDGET_STATUSES.join(', ')}`);
  }

  const desiredSlug = payload.slug ? generateSlug(payload.slug) : generateSlug(name);
  const slug = await ensureUniqueSlug(ReputationReviewWidget, id, desiredSlug);

  const theme = sanitizeString(payload.theme, { allowNull: true, maxLength: 120 });
  const themeTokens = sanitizeThemeTokens(payload.themeTokens);
  const lastSyncedAt = parseDate(payload.lastSyncedAt);
  const lastPublishedAtInput = parseDate(payload.lastPublishedAt);
  const lastRenderedAtInput = parseDate(payload.lastRenderedAt);
  const now = new Date();
  const computedLastPublishedAt =
    status === 'active' ? lastPublishedAtInput ?? now : lastPublishedAtInput ?? null;
  const computedLastRenderedAt = lastRenderedAtInput ?? null;

  const record = await ReputationReviewWidget.create({
    freelancerId: id,
    name,
    slug,
    widgetType,
    status,
    theme,
    themeTokens,
    embedScript: payload.embedScript ?? null,
    config: payload.config ?? null,
    impressions: payload.impressions == null ? 0 : Math.max(0, Number.parseInt(payload.impressions, 10) || 0),
    ctaClicks: payload.ctaClicks == null ? 0 : Math.max(0, Number.parseInt(payload.ctaClicks, 10) || 0),
    lastSyncedAt,
    lastPublishedAt: computedLastPublishedAt,
    lastRenderedAt: computedLastRenderedAt,
    metadata: payload.metadata ?? null,
  });

  return record.toPublicObject();
}

export async function generateReviewWidgetEmbed(freelancerId, slug, { preview = false } = {}) {
  const id = normalizeFreelancerId(freelancerId);
  const widgetSlug = sanitizeString(slug, { allowNull: false, maxLength: 255 });
  if (!widgetSlug) {
    throw new ValidationError('slug is required');
  }

  const widget = await ReputationReviewWidget.findOne({ where: { freelancerId: id, slug: widgetSlug } });
  if (!widget) {
    throw new NotFoundError('Review widget not found');
  }

  if (!preview && widget.status !== 'active') {
    throw new NotFoundError('Review widget is not published');
  }

  const freelancer = await User.findByPk(id, {
    include: [
      { model: Profile },
      { model: FreelancerProfile },
    ],
  });

  if (!freelancer) {
    throw new NotFoundError('Freelancer profile not found');
  }

  const [testimonialRecords, metricRecords] = await Promise.all([
    ReputationTestimonial.findAll({
      where: {
        freelancerId: id,
        status: 'approved',
        moderationStatus: 'approved',
      },
      order: [
        ['isFeatured', 'DESC'],
        ['capturedAt', 'DESC NULLS LAST'],
        ['createdAt', 'DESC'],
      ],
      limit: 12,
    }),
    ReputationMetric.findAll({
      where: { freelancerId: id },
      order: [
        ['trendDirection', 'DESC'],
        ['updatedAt', 'DESC'],
      ],
      limit: 8,
    }),
  ]);

  const now = new Date();
  const updates = { lastRenderedAt: now };
  if (widget.status === 'active' && !widget.lastPublishedAt) {
    updates.lastPublishedAt = now;
  }
  await widget.update(updates);

  const widgetPayload = widget.toPublicObject();
  const freelancerPayload = mapFreelancerProfile(freelancer);
  const testimonialPayload = testimonialRecords.map((record) => record.toPublicObject());
  const metricPayload = metricRecords
    .map((record) => record.toPublicObject())
    .map((metric) => ({
      label: metric.label,
      value: formatMetricValue(metric.value, metric.unit),
      trendLabel: formatTrendLabel(metric),
    }))
    .filter((metric) => metric.value != null);

  const html = renderWidgetHtml({
    freelancer: freelancerPayload,
    widget: widgetPayload,
    testimonials: testimonialPayload,
    metrics: metricPayload,
  });

  return {
    html,
    widget: widgetPayload,
    generatedAt: now,
    testimonials: testimonialPayload,
    metrics: metricPayload,
  };
}

export default {
  getFreelancerReputationOverview,
  createTestimonial,
  createSuccessStory,
  upsertMetric,
  createBadge,
  createReviewWidget,
  generateReviewWidgetEmbed,
};

