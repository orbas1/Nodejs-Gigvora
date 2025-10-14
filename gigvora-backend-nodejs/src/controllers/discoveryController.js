import {
  getDiscoverySnapshot,
  listJobs,
  listGigs,
  listProjects,
  listLaunchpads,
  listVolunteering,
} from '../services/discoveryService.js';

function parseQueryParams(req) {
  const { page, pageSize, q, limit, filters, sort } = req.query ?? {};
  return {
    page: page ?? undefined,
    pageSize: pageSize ?? undefined,
    query: q ?? undefined,
    limit: limit ?? undefined,
    filters: filters ?? undefined,
    sort: sort ?? undefined,
  };
}

export async function snapshot(req, res) {
  const { limit } = parseQueryParams(req);
  const result = await getDiscoverySnapshot({ limit });
  res.json(result);
}

export async function jobs(req, res) {
  const { page, pageSize, query } = parseQueryParams(req);
  const result = await listJobs({ page, pageSize, query });
  res.json(result);
}

export async function gigs(req, res) {
  const { page, pageSize, query } = parseQueryParams(req);
  const result = await listGigs({ page, pageSize, query });
  res.json(result);
}

export async function projects(req, res) {
  const { page, pageSize, query } = parseQueryParams(req);
  const result = await listProjects({ page, pageSize, query });
  res.json(result);
}

export async function launchpads(req, res) {
  const { page, pageSize, query } = parseQueryParams(req);
  const result = await listLaunchpads({ page, pageSize, query });
  res.json(result);
}

export async function volunteering(req, res) {
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
