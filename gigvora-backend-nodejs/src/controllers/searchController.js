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
import { AuthorizationError, ValidationError } from '../utils/errors.js';
import { resolveRequestPermissions, resolveRequestUserId } from '../utils/requestContext.js';

const PEOPLE_SEARCH_PERMISSIONS = new Set(['search:people', 'directory:search', 'people:search']);
const PEOPLE_SEARCH_ROLES = new Set(['admin', 'platform_admin', 'operations', 'operations_lead', 'recruiter', 'talent', 'support']);

function normalise(value) {
  if (!value) {
    return null;
  }
  return `${value}`.trim().toLowerCase();
}

function collectRoles(req) {
  const roles = new Set();
  const primary = normalise(req.user?.type ?? req.user?.role);
  if (primary) {
    roles.add(primary);
  }
  if (Array.isArray(req.user?.roles)) {
    req.user.roles.forEach((role) => {
      const normalised = normalise(role);
      if (normalised) {
        roles.add(normalised);
      }
    });
  }
  const headerRoles = req.headers?.['x-roles'];
  if (typeof headerRoles === 'string') {
    headerRoles
      .split(',')
      .map((entry) => normalise(entry))
      .filter(Boolean)
      .forEach((role) => roles.add(role));
  }
  return roles;
}

function collectPermissions(req) {
  return new Set(resolveRequestPermissions(req).map((permission) => normalise(permission)).filter(Boolean));
}

function clampNumber(value, { min, max, fallback }) {
  if (value == null || value === '') {
    return fallback;
  }
  const numeric = Number.parseInt(value, 10);
  if (!Number.isInteger(numeric)) {
    throw new ValidationError('Numeric query parameters must be integers.');
  }
  if (numeric < min) {
    return min;
  }
  if (numeric > max) {
    return max;
  }
  return numeric;
}

function parsePage(value) {
  return clampNumber(value, { min: 1, max: 9999, fallback: 1 });
}

function parsePageSize(value) {
  return clampNumber(value, { min: 1, max: 100, fallback: 25 });
}

function parseLimit(value) {
  return clampNumber(value, { min: 1, max: 50, fallback: 10 });
}

function parseBoolean(value, fallback = false) {
  if (value == null) {
    return fallback;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  const normalised = normalise(value);
  if (normalised == null) {
    return fallback;
  }
  if (['1', 'true', 'yes', 'y'].includes(normalised)) {
    return true;
  }
  if (['0', 'false', 'no', 'n'].includes(normalised)) {
    return false;
  }
  return fallback;
}

function ensurePeopleSearchAccess(req) {
  const actorId = resolveRequestUserId(req);
  if (!actorId) {
    throw new AuthorizationError('Authentication is required to search for people.');
  }

  const roles = collectRoles(req);
  const permissions = collectPermissions(req);
  const hasRole = Array.from(roles).some((role) => PEOPLE_SEARCH_ROLES.has(role));
  const hasPermission = Array.from(permissions).some((permission) => PEOPLE_SEARCH_PERMISSIONS.has(permission));

  if (!hasRole && !hasPermission) {
    throw new AuthorizationError('You do not have permission to search the people directory.');
  }

  return true;
}

export async function globalSearch(req, res) {
  const query = req.query.q?.trim() ?? '';
  const limit = parseLimit(req.query?.limit);

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

  const opportunitiesPromise = searchOpportunitiesAcrossCategories(query, { limit });

  let people = [];
  try {
    ensurePeopleSearchAccess(req);
    const peopleResults = await User.searchByTerm(query);
    people = peopleResults.map((user) => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      userType: user.userType,
    }));
  } catch (error) {
    if (!(error instanceof AuthorizationError)) {
      throw error;
    }
  }

  const opportunities = await opportunitiesPromise;

  res.json({
    ...opportunities,
    people,
  });
}

export async function searchJobs(req, res) {
  const result = await listJobs({
    query: req.query?.q,
    page: parsePage(req.query?.page),
    pageSize: parsePageSize(req.query?.pageSize),
  });
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
  const categoryKey = req.query?.category ? normalise(req.query.category) : null;
  const category = categoryMap[categoryKey] ?? 'job';
  const handler = categoryHandlers[category];

  if (!handler) {
    throw new ValidationError(`Unsupported opportunity category "${req.query.category ?? 'unknown'}".`);
  }

  const result = await handler({
    query: req.query?.q,
    page: parsePage(req.query?.page),
    pageSize: parsePageSize(req.query?.pageSize),
    filters: req.query?.filters,
    sort: req.query?.sort,
    includeFacets: parseBoolean(req.query?.includeFacets, true),
    viewport: req.query?.viewport,
  });

  res.json(result);
}

export async function searchGigs(req, res) {
  const result = await listGigs({
    query: req.query?.q,
    page: parsePage(req.query?.page),
    pageSize: parsePageSize(req.query?.pageSize),
  });
  res.json(result);
}

export async function searchProjects(req, res) {
  const result = await listProjects({
    query: req.query?.q,
    page: parsePage(req.query?.page),
    pageSize: parsePageSize(req.query?.pageSize),
  });
  res.json(result);
}

export async function searchVolunteering(req, res) {
  const result = await listVolunteering({
    query: req.query?.q,
    page: parsePage(req.query?.page),
    pageSize: parsePageSize(req.query?.pageSize),
  });
  res.json(result);
}

export async function searchLaunchpad(req, res) {
  const result = await listLaunchpads({
    query: req.query?.q,
    page: parsePage(req.query?.page),
    pageSize: parsePageSize(req.query?.pageSize),
  });
  res.json(result);
}
