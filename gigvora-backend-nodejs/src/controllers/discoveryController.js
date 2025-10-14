import {
  getDiscoverySnapshot,
  listJobs,
  listGigs,
  listProjects,
  listLaunchpads,
  listVolunteering,
} from '../services/discoveryService.js';

function parseQueryParams(req) {
  const { page, pageSize, q, limit, filters, sort, includeFacets, viewport } = req.query ?? {};
  let includeFacetsFlag;
  if (includeFacets != null) {
    const normalised = String(includeFacets).toLowerCase();
    if (['true', '1', 'yes'].includes(normalised)) {
      includeFacetsFlag = true;
    } else if (['false', '0', 'no'].includes(normalised)) {
      includeFacetsFlag = false;
    }
  }

  return {
    page: page ?? undefined,
    pageSize: pageSize ?? undefined,
    query: q ?? undefined,
    limit: limit ?? undefined,
    filters: filters ?? undefined,
    sort: sort ?? undefined,
    includeFacets: includeFacetsFlag,
    viewport: viewport ?? undefined,
  };
}

export async function snapshot(req, res) {
  const { limit } = parseQueryParams(req);
  const result = await getDiscoverySnapshot({ limit });
  res.json(result);
}

export async function jobs(req, res) {
  const params = parseQueryParams(req);
  const result = await listJobs(params);
  res.json(result);
}

export async function gigs(req, res) {
  const params = parseQueryParams(req);
  const result = await listGigs(params);
  res.json(result);
}

export async function projects(req, res) {
  const params = parseQueryParams(req);
  const result = await listProjects(params);
  res.json(result);
}

export async function launchpads(req, res) {
  const params = parseQueryParams(req);
  const result = await listLaunchpads(params);
  res.json(result);
}

export async function volunteering(req, res) {
  const params = parseQueryParams(req);
  const result = await listVolunteering(params);
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
