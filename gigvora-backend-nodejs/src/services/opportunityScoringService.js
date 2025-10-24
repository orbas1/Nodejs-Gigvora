const HOURS_PER_DAY = 24;
const MAX_RECENCY_DAYS = 90;

function normalise(value) {
  if (!value) {
    return '';
  }
  return `${value}`.toLowerCase();
}

function tokenize(text) {
  return normalise(text)
    .split(/[^a-z0-9]+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

function unique(array) {
  return Array.from(new Set(array));
}

function calculateFreshnessScore(updatedAt) {
  if (!updatedAt) {
    return 0.5;
  }
  const updated = new Date(updatedAt);
  const now = new Date();
  const ageInHours = Math.max(0, (now.getTime() - updated.getTime()) / (1000 * 60 * 60));
  const ageInDays = ageInHours / HOURS_PER_DAY;
  if (Number.isNaN(ageInDays)) {
    return 0.5;
  }
  const clamped = Math.min(MAX_RECENCY_DAYS, Math.max(0, ageInDays));
  const score = 1 - clamped / MAX_RECENCY_DAYS;
  return Number(score.toFixed(4));
}

function calculateQueryAffinity(query, opportunity) {
  if (!query) {
    return 0.25;
  }
  const terms = unique(tokenize(query));
  if (!terms.length) {
    return 0.25;
  }

  const haystack = tokenize(`${opportunity.title ?? ''} ${opportunity.description ?? ''}`);
  if (!haystack.length) {
    return 0;
  }

  const matches = terms.filter((term) => haystack.includes(term));
  return Number((matches.length / terms.length).toFixed(4));
}

function calculateTaxonomyAlignment(filters, opportunity) {
  const filterSlugs = unique([...(filters?.taxonomySlugs ?? [])].map(normalise).filter(Boolean));
  const filterTypes = unique([...(filters?.taxonomyTypes ?? [])].map(normalise).filter(Boolean));

  if (!filterSlugs.length && !filterTypes.length) {
    return 0.5;
  }

  const opportunitySlugs = unique([...(opportunity.taxonomySlugs ?? [])].map(normalise));
  const opportunityTypes = unique([...(opportunity.taxonomyTypes ?? [])].map(normalise));

  const slugMatchCount = filterSlugs.filter((slug) => opportunitySlugs.includes(slug)).length;
  const typeMatchCount = filterTypes.filter((type) => opportunityTypes.includes(type)).length;

  const slugScore = filterSlugs.length ? slugMatchCount / filterSlugs.length : 0;
  const typeScore = filterTypes.length ? typeMatchCount / filterTypes.length : 0;

  const combined = filterSlugs.length && filterTypes.length ? (slugScore + typeScore) / 2 : slugScore || typeScore;
  return Number(Math.min(1, combined).toFixed(4));
}

function calculateRemoteFit(filters, opportunity, viewport) {
  const wantsRemote = Boolean(filters?.isRemote);
  const hasViewport = Boolean(viewport?.boundingBox);

  if (!wantsRemote && !hasViewport) {
    return 0.5;
  }

  if (wantsRemote && opportunity.isRemote) {
    return 1;
  }

  if (hasViewport && opportunity.geo?.lat != null && opportunity.geo?.lng != null) {
    const { north, south, east, west } = viewport.boundingBox;
    const { lat, lng } = opportunity.geo;
    const inside = lat <= north && lat >= south && lng <= east && lng >= west;
    return inside ? 1 : 0;
  }

  return 0.1;
}

function calculateReputationBoost(opportunity, { reputationSignals }) {
  if (!reputationSignals || typeof reputationSignals !== 'object') {
    return 0.1;
  }
  const trustScore = Number(reputationSignals.trustScore ?? opportunity.aiSignals?.trustScore ?? 0);
  if (!Number.isFinite(trustScore)) {
    return 0.1;
  }
  const normalised = Math.max(0, Math.min(100, trustScore)) / 100;
  return Number((0.2 + normalised * 0.6).toFixed(4));
}

function buildScoreComponents(opportunity, context) {
  const freshness = calculateFreshnessScore(opportunity.updatedAt ?? opportunity.createdAt);
  const queryAffinity = calculateQueryAffinity(context.query, opportunity);
  const taxonomy = calculateTaxonomyAlignment(context.filters, opportunity);
  const remoteFit = calculateRemoteFit(context.filters, opportunity, context.viewport);
  const reputation = calculateReputationBoost(opportunity, context);

  const weights = {
    freshness: 0.3,
    queryAffinity: 0.3,
    taxonomy: 0.2,
    remoteFit: 0.1,
    reputation: 0.1,
  };

  const score =
    freshness * weights.freshness +
    queryAffinity * weights.queryAffinity +
    taxonomy * weights.taxonomy +
    remoteFit * weights.remoteFit +
    reputation * weights.reputation;

  return {
    freshness,
    queryAffinity,
    taxonomy,
    remoteFit,
    reputation,
    total: Number(score.toFixed(4)),
  };
}

export function annotateWithScores(opportunities, context = {}) {
  if (!Array.isArray(opportunities) || !opportunities.length) {
    return [];
  }

  return opportunities.map((opportunity) => {
    const components = buildScoreComponents(opportunity, context);
    return {
      ...opportunity,
      aiSignals: {
        ...(opportunity.aiSignals ?? {}),
        ...components,
      },
    };
  });
}

export default { annotateWithScores };
