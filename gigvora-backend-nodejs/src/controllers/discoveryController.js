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
    } else {
      includeFacetsFlag = undefined;
    }
  }

  const { page, pageSize, q, limit, filters, sort } = req.query ?? {};
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
  const { page, pageSize, query, filters, sort, includeFacets, viewport } = parseQueryParams(req);
  const result = await listJobs({ page, pageSize, query, filters, sort, includeFacets, viewport });
  res.json(result);
}

export async function gigs(req, res) {
  const { page, pageSize, query, filters, sort, includeFacets, viewport } = parseQueryParams(req);
  const result = await listGigs({ page, pageSize, query, filters, sort, includeFacets, viewport });
  res.json(result);
}

export async function projects(req, res) {
  const { page, pageSize, query, filters, sort, includeFacets, viewport } = parseQueryParams(req);
  const result = await listProjects({ page, pageSize, query, filters, sort, includeFacets, viewport });
  res.json(result);
}

export async function launchpads(req, res) {
  const { page, pageSize, query, filters, sort, includeFacets, viewport } = parseQueryParams(req);
  const result = await listLaunchpads({ page, pageSize, query, filters, sort, includeFacets, viewport });
  res.json(result);
}

export async function volunteering(req, res) {
  const { page, pageSize, query, filters, sort, includeFacets, viewport } = parseQueryParams(req);
  const result = await listVolunteering({ page, pageSize, query, filters, sort, includeFacets, viewport });
  const { page, pageSize, query, filters, sort } = parseQueryParams(req);
  const result = await listVolunteering({ page, pageSize, query, filters, sort });
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
