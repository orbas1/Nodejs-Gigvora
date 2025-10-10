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
