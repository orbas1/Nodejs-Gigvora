import {
  getDiscoverySnapshot,
  listJobs,
  listGigs,
  listProjects,
  listLaunchpads,
  listVolunteering,
  listMentors,
  getDiscoveryExperience,
  toggleSuggestionFollow,
  saveDiscoverySuggestion,
  dismissDiscoverySuggestion,
  trackDiscoverySuggestionView,
  trackDiscoverySuggestionShare,
} from '../services/discoveryService.js';
import { ValidationError } from '../utils/errors.js';

const MAX_PAGE_SIZE = 50;
const MAX_SNAPSHOT_LIMIT = 50;
const SORT_OPTIONS = new Set([
  'default',
  'newest',
  'alphabetical',
  'budget',
  'status',
  'price_asc',
  'price_desc',
]);

function normaliseBoolean(value) {
  if (value == null) {
    return undefined;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  const normalised = String(value).trim().toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(normalised)) {
    return true;
  }
  if (['false', '0', 'no', 'off'].includes(normalised)) {
    return false;
  }
  return undefined;
}

function parsePositiveInteger(value, { min = 1, max } = {}) {
  if (value == null || value === '') {
    return undefined;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < min) {
    return undefined;
  }
  if (max != null && parsed > max) {
    return max;
  }
  return parsed;
}

function parseFilters(value) {
  if (!value) {
    return undefined;
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return typeof parsed === 'object' && parsed ? parsed : undefined;
    } catch (error) {
      throw new ValidationError('filters must be valid JSON.');
    }
  }
  if (typeof value === 'object') {
    return value;
  }
  return undefined;
}

function parseSort(value) {
  if (value == null || value === '') {
    return undefined;
  }
  const normalised = String(value).trim().toLowerCase();
  if (!SORT_OPTIONS.has(normalised)) {
    throw new ValidationError('Unsupported sort option provided.');
  }
  return normalised;
}

function parseViewport(value) {
  if (!value) {
    return undefined;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
  }
  return undefined;
}

function parseQueryParams(req) {
  const { page, pageSize, q, query, limit, filters, sort, includeFacets, viewport } = req.query ?? {};
  const searchQuery = typeof q === 'string' ? q : typeof query === 'string' ? query : undefined;
  const parsed = {
    page: parsePositiveInteger(page, { min: 1 }) ?? 1,
    pageSize: parsePositiveInteger(pageSize, { min: 1, max: MAX_PAGE_SIZE }) ?? 20,
    query: searchQuery?.trim()?.slice(0, 255),
    filters: parseFilters(filters),
    sort: parseSort(sort),
    includeFacets: normaliseBoolean(includeFacets),
    viewport: parseViewport(viewport),
  };

  const resolvedLimit = parsePositiveInteger(limit, { min: 1, max: MAX_SNAPSHOT_LIMIT });
  if (resolvedLimit != null) {
    parsed.limit = resolvedLimit;
  }

  return parsed;
}

function parseExperienceParams(query = {}) {
  const suggestionLimit =
    parsePositiveInteger(query.suggestionLimit, { min: 1, max: 24 }) ??
    parsePositiveInteger(query.suggestionsLimit, { min: 1, max: 24 });
  const trendingLimit = parsePositiveInteger(query.trendingLimit, { min: 1, max: 12 });
  const connectionLimit = parsePositiveInteger(query.connectionLimit, { min: 1, max: 12 });
  const persona = typeof query.persona === 'string' ? query.persona.trim() : undefined;
  const timeframeCandidate = query.trendingTimeframe ?? query.timeframe;
  const trendingTimeframe = typeof timeframeCandidate === 'string' ? timeframeCandidate.trim().toLowerCase() : undefined;

  return {
    persona: persona && persona.length ? persona : undefined,
    suggestionLimit,
    trendingLimit,
    connectionLimit,
    trendingTimeframe,
  };
}

export async function snapshot(req, res) {
  const { limit = 12 } = parseQueryParams(req);
  const result = await getDiscoverySnapshot({ limit });
  res.json(result);
}

export async function experience(req, res) {
  const params = parseExperienceParams(req.query);
  const result = await getDiscoveryExperience(req.user ?? null, params);
  res.json(result);
}

function buildSearchOptions(req) {
  const { page, pageSize, query, filters, sort, includeFacets, viewport } = parseQueryParams(req);
  return { page, pageSize, query, filters, sort, includeFacets, viewport };
}

export async function jobs(req, res) {
  const result = await listJobs(buildSearchOptions(req));
  res.json(result);
}

export async function gigs(req, res) {
  const result = await listGigs(buildSearchOptions(req));
  res.json(result);
}

export async function projects(req, res) {
  const result = await listProjects(buildSearchOptions(req));
  res.json(result);
}

export async function launchpads(req, res) {
  const result = await listLaunchpads(buildSearchOptions(req));
  res.json(result);
}

export async function volunteering(req, res) {
  const result = await listVolunteering(buildSearchOptions(req));
  res.json(result);
}

export async function mentors(req, res) {
  const result = await listMentors(buildSearchOptions(req));
  res.json(result);
}

function ensureSuggestionId(param) {
  const suggestionId = parsePositiveInteger(param, { min: 1 });
  if (!suggestionId) {
    throw new ValidationError('suggestionId must be a positive integer.');
  }
  return suggestionId;
}

function extractMetadata(body) {
  if (!body || typeof body !== 'object') {
    return null;
  }
  const metadata = body.metadata;
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return null;
  }
  return metadata;
}

export async function followSuggestion(req, res) {
  const suggestionId = ensureSuggestionId(req.params?.suggestionId);
  const result = await toggleSuggestionFollow({
    suggestionId,
    userId: parsePositiveInteger(req.user?.id, { min: 1 }),
  });
  res.json(result);
}

export async function saveSuggestion(req, res) {
  const suggestionId = ensureSuggestionId(req.params?.suggestionId);
  const suggestion = await saveDiscoverySuggestion({
    suggestionId,
    userId: parsePositiveInteger(req.user?.id, { min: 1 }),
  });
  res.json({ suggestion });
}

export async function dismissSuggestion(req, res) {
  const suggestionId = ensureSuggestionId(req.params?.suggestionId);
  const suggestion = await dismissDiscoverySuggestion({
    suggestionId,
    userId: parsePositiveInteger(req.user?.id, { min: 1 }),
  });
  res.json({ suggestion });
}

export async function trackSuggestionView(req, res) {
  const suggestionId = ensureSuggestionId(req.params?.suggestionId);
  const suggestion = await trackDiscoverySuggestionView({
    suggestionId,
    userId: parsePositiveInteger(req.user?.id, { min: 1 }),
    metadata: extractMetadata(req.body) ?? undefined,
  });
  res.json({ suggestion });
}

export async function trackSuggestionShare(req, res) {
  const suggestionId = ensureSuggestionId(req.params?.suggestionId);
  const suggestion = await trackDiscoverySuggestionShare({
    suggestionId,
    userId: parsePositiveInteger(req.user?.id, { min: 1 }),
    metadata: extractMetadata(req.body) ?? undefined,
  });
  res.json({ suggestion });
}

export default {
  snapshot,
  experience,
  jobs,
  gigs,
  projects,
  launchpads,
  volunteering,
  mentors,
  followSuggestion,
  saveSuggestion,
  dismissSuggestion,
  trackSuggestionView,
  trackSuggestionShare,
};
