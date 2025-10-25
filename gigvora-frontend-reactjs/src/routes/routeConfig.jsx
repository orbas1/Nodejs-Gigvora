import { lazy, Suspense } from 'react';
import RouteLoading from '../components/routing/RouteLoading.jsx';
import ROUTE_COLLECTION_DEFINITIONS, {
  COMMUNITY_ACCESS_MEMBERSHIPS,
  VOLUNTEER_ACCESS_MEMBERSHIPS,
  USER_DASHBOARD_ROLES,
  LAUNCHPAD_ACCESS_MEMBERSHIPS,
  SECURITY_ACCESS_MEMBERSHIPS,
  flattenRouteRegistry,
  toAbsolutePath,
} from '@shared-contracts/domain/platform/route-registry.js';

const pageModules = import.meta.glob('../pages/**/*.jsx');
const layoutModules = import.meta.glob('../layouts/**/*.jsx');

const lazyComponentCache = new Map();

function normaliseLocation(pathname = '/') {
  if (!pathname || pathname === '/') {
    return '/';
  }
  return pathname.replace(/\/+$/, '') || '/';
}

function createRoutePattern(absolutePath) {
  if (absolutePath === '/') {
    return /^\/$/;
  }
  const escaped = absolutePath
    .replace(/\/+$/, '')
    .replace(/([.+?^=!:${}()|\[\]\\])/g, '\\$1')
    .replace(/\*/g, '.*')
    .replace(/:[^/]+/g, '[^/]+');
  return new RegExp(`^${escaped}\/?$`);
}

function resolveModule(loader) {
  if (!loader) {
    throw new Error('Attempted to resolve an unknown module in route configuration.');
  }
  return loader;
}

export function resolveLazyComponent(modulePath) {
  const loader = pageModules[`../${modulePath}`];
  if (!loader) {
    throw new Error(`Unknown page module: ${modulePath}`);
  }

  if (!lazyComponentCache.has(modulePath)) {
    lazyComponentCache.set(modulePath, lazy(loader));
  }

  return lazyComponentCache.get(modulePath);
}

export function createLoadableElement(modulePath) {
  const Component = resolveLazyComponent(modulePath);

  return (
    <Suspense fallback={<RouteLoading />}>
      <Component />
    </Suspense>
  );
}

const mainLayoutLoader = resolveModule(layoutModules['../layouts/MainLayout.jsx']);
export const MainLayout = lazy(mainLayoutLoader);

const ROUTE_REGISTRY_ENTRIES = flattenRouteRegistry(ROUTE_COLLECTION_DEFINITIONS);

export { COMMUNITY_ACCESS_MEMBERSHIPS, VOLUNTEER_ACCESS_MEMBERSHIPS };

export const USER_ROLES = USER_DASHBOARD_ROLES;

export const LAUNCHPAD_ALLOWED_MEMBERSHIPS = LAUNCHPAD_ACCESS_MEMBERSHIPS;
export const SECURITY_ALLOWED_MEMBERSHIPS = SECURITY_ACCESS_MEMBERSHIPS;

export const STANDALONE_ROUTES = ROUTE_COLLECTION_DEFINITIONS.standalone.routes;
export const PUBLIC_ROUTES = ROUTE_COLLECTION_DEFINITIONS.public.routes;
export const COMMUNITY_ROUTES = ROUTE_COLLECTION_DEFINITIONS.community.routes;
export const VOLUNTEER_ROUTES = ROUTE_COLLECTION_DEFINITIONS.volunteer.routes;
export const LAUNCHPAD_ROUTES = ROUTE_COLLECTION_DEFINITIONS.launchpad.routes;
export const SECURITY_ROUTES = ROUTE_COLLECTION_DEFINITIONS.security.routes;
export const USER_DASHBOARD_ROUTES = ROUTE_COLLECTION_DEFINITIONS.userDashboards.routes;
export const FREELANCER_ROUTES = ROUTE_COLLECTION_DEFINITIONS.freelancer.routes;
export const COMPANY_ROUTES = ROUTE_COLLECTION_DEFINITIONS.company.routes;
export const AGENCY_ROUTES = ROUTE_COLLECTION_DEFINITIONS.agency.routes;
export const HEADHUNTER_ROUTES = ROUTE_COLLECTION_DEFINITIONS.headhunter.routes;
export const MENTOR_ROUTES = ROUTE_COLLECTION_DEFINITIONS.mentor.routes;
export const LAUNCHPAD_ROUTES_PROTECTED = ROUTE_COLLECTION_DEFINITIONS.launchpadOps.routes;
export const ADMIN_ROUTES = ROUTE_COLLECTION_DEFINITIONS.admin.routes;

export const HOME_ROUTE =
  STANDALONE_ROUTES.find((route) => route.index || route.path === '/' || route.key === 'home') ?? STANDALONE_ROUTES[0];

export const ADMIN_LOGIN_ROUTE =
  STANDALONE_ROUTES.find((route) => toAbsolutePath(route.path) === '/admin' || route.key === 'adminLogin') ??
  STANDALONE_ROUTES[1];

export const ADMIN_ROOT_ROUTE =
  ADMIN_ROUTES.find((route) => route.index || route.relativePath === '' || route.relativePath == null) ?? ADMIN_ROUTES[0];

export const ROUTE_COLLECTIONS = Object.freeze(
  Object.fromEntries(
    Object.entries(ROUTE_COLLECTION_DEFINITIONS)
      .filter(([key]) => key !== 'standalone')
      .map(([key, definition]) => [key, definition.routes]),
  ),
);

const ROUTE_ENTRIES = ROUTE_REGISTRY_ENTRIES.map((entry) => ({
  path: entry.path,
  module: entry.module,
  absolutePath: entry.absolutePath,
  collection: entry.collection,
  index: entry.index,
  relativePath: entry.relativePath,
  meta: Object.freeze({
    id: entry.routeId,
    persona: entry.persona,
    title: entry.title,
    icon: entry.icon,
    featureFlag: entry.featureFlag,
    shellTheme: entry.shellTheme,
  }),
}));

const ROUTE_LOOKUP = new Map(ROUTE_ENTRIES.map((entry) => [entry.absolutePath, entry]));

const ROUTE_MATCHERS = ROUTE_ENTRIES.map((entry) => ({
  entry,
  pattern: createRoutePattern(entry.absolutePath),
}));

export const ROUTE_METADATA = Object.freeze(
  ROUTE_ENTRIES.map(({ absolutePath, collection, meta, path }) => ({
    path: absolutePath,
    sourcePath: path,
    collection,
    meta,
  })),
);

export function matchRouteByPath(pathname) {
  const normalised = normaliseLocation(pathname);
  const direct = ROUTE_LOOKUP.get(normalised);
  if (direct) {
    return direct;
  }

  for (const { entry, pattern } of ROUTE_MATCHERS) {
    if (pattern.test(normalised)) {
      return entry;
    }
  }

  return null;
}

