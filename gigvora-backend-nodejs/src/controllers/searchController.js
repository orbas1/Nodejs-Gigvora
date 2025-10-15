import { User } from '../models/index.js';
import {
  listJobs,
  listGigs,
  listProjects,
  listVolunteering,
  listLaunchpads,
  getDiscoverySnapshot,
  searchOpportunitiesAcrossCategories,
} from '../services/discoveryService.js';
import { ValidationError } from '../utils/errors.js';

export async function globalSearch(req, res) {
  const query = req.query.q?.trim() ?? '';
  const { limit } = req.query ?? {};

  if (!query) {
    const snapshot = await getDiscoverySnapshot({ limit });
    res.json({
      jobs: snapshot.jobs.items,
      gigs: snapshot.gigs.items,
      projects: snapshot.projects.items,
      volunteering: snapshot.volunteering.items,
      launchpads: snapshot.launchpads.items,
      people: [],
    });
    return;
  }

  const [opportunities, people] = await Promise.all([
    searchOpportunitiesAcrossCategories(query, { limit }),
    User.searchByTerm(query),
  ]);

  res.json({
    ...opportunities,
    people: people.map((user) => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      userType: user.userType,
    })),
  });
}

export async function searchJobs(req, res) {
  const { q, page, pageSize } = req.query ?? {};
  const result = await listJobs({ query: q, page, pageSize });
  res.json(result);
}

const categoryMap = {
  job: 'job',
  jobs: 'job',
  gig: 'gig',
  gigs: 'gig',
  project: 'project',
  projects: 'project',
  launchpad: 'launchpad',
  launchpads: 'launchpad',
  volunteering: 'volunteering',
  volunteer: 'volunteering',
};

const categoryHandlers = {
  job: listJobs,
  gig: listGigs,
  project: listProjects,
  launchpad: listLaunchpads,
  volunteering: listVolunteering,
};

export async function searchOpportunities(req, res) {
  const category = categoryMap[req.query.category] ?? 'job';
  const handler = categoryHandlers[category];

  if (!handler) {
    throw new ValidationError(`Unsupported opportunity category "${req.query.category ?? 'unknown'}".`);
  }

  const includeFacets = req.query.includeFacets ?? true;
  const result = await handler({
    query: req.query.q,
    page: req.query.page,
    pageSize: req.query.pageSize,
    filters: req.query.filters,
    sort: req.query.sort,
    includeFacets,
    viewport: req.query.viewport,
  });

  res.json(result);
}

export async function searchGigs(req, res) {
  const { q, page, pageSize } = req.query ?? {};
  const result = await listGigs({ query: q, page, pageSize });
  res.json(result);
}

export async function searchProjects(req, res) {
  const { q, page, pageSize } = req.query ?? {};
  const result = await listProjects({ query: q, page, pageSize });
  res.json(result);
}

export async function searchVolunteering(req, res) {
  const { q, page, pageSize } = req.query ?? {};
  const result = await listVolunteering({ query: q, page, pageSize });
  res.json(result);
}

export async function searchLaunchpad(req, res) {
  const { q, page, pageSize } = req.query ?? {};
  const result = await listLaunchpads({ query: q, page, pageSize });
  res.json(result);
}
