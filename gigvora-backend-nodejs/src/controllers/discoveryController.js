import {
  getDiscoverySnapshot,
  listJobs,
  listGigs,
  listProjects,
  listLaunchpads,
  listVolunteering,
} from '../services/discoveryService.js';

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

function parseQueryParams(req) {
  const { page, pageSize, q, query, limit, filters, sort, includeFacets, viewport } = req.query ?? {};
  return {
    page: page ?? query ?? undefined,
    pageSize: pageSize ?? undefined,
    query: q ?? query ?? undefined,
    limit: limit ?? undefined,
    filters: filters ?? undefined,
    sort: sort ?? undefined,
    includeFacets: normaliseBoolean(includeFacets),
    viewport: viewport ?? undefined,
  };
}

export async function snapshot(req, res) {
  const { limit } = parseQueryParams(req);
  const result = await getDiscoverySnapshot({ limit });
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

export default {
  snapshot,
  jobs,
  gigs,
  projects,
  launchpads,
  volunteering,
};
