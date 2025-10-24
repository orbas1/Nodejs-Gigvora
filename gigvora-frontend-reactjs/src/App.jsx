import { lazy, Suspense } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import ProtectedRoute from './components/routing/ProtectedRoute.jsx';
import RoleProtectedRoute from './components/auth/RoleProtectedRoute.jsx';
import MembershipGate from './components/auth/MembershipGate.jsx';
import RequireRole from './components/routing/RequireRole.jsx';
import RouteLoading from './components/routing/RouteLoading.jsx';
import RouteErrorBoundary from './components/routing/RouteErrorBoundary.jsx';
import {
  COMMUNITY_ACCESS_MEMBERSHIPS,
  LAUNCHPAD_ALLOWED_MEMBERSHIPS,
  SECURITY_ALLOWED_MEMBERSHIPS,
  VOLUNTEER_ACCESS_MEMBERSHIPS,
  getRouteGroup,
} from './constants/routeRegistry.js';

const pageModules = import.meta.glob(['./pages/**/*.jsx', '!./pages/**/__tests__/**']);
const layoutModules = import.meta.glob('./layouts/**/*.jsx');

const mainLayoutLoader = layoutModules['./layouts/MainLayout.jsx'];
if (!mainLayoutLoader) {
  throw new Error('MainLayout layout module is missing.');
}

const MainLayout = lazy(mainLayoutLoader);

const lazyComponentCache = new Map();

function resolveComponent(modulePath) {
  const loader = pageModules[modulePath];
  if (!loader) {
    throw new Error(`Unknown page module: ${modulePath}`);
  }
  if (!lazyComponentCache.has(modulePath)) {
    lazyComponentCache.set(modulePath, lazy(loader));
  }
  return lazyComponentCache.get(modulePath);
}

function LoadableRoute({ modulePath }) {
  const Component = resolveComponent(modulePath);
  return (
    <Suspense fallback={<RouteLoading />}>
      <Component />
    </Suspense>
  );
}

const userRoles = Object.freeze(['user', 'freelancer', 'agency', 'company', 'headhunter']);

const PUBLIC_ROUTES = getRouteGroup('public');
const COMMUNITY_ROUTES = getRouteGroup('community');
const VOLUNTEER_ROUTES = getRouteGroup('volunteer');
const LAUNCHPAD_ROUTES = getRouteGroup('launchpad');
const SECURITY_ROUTES = getRouteGroup('security');
const userDashboardRoutes = getRouteGroup('userDashboard');
const freelancerRoutes = getRouteGroup('freelancer');
const companyRoutes = getRouteGroup('company');
const agencyRoutes = getRouteGroup('agency');
const headhunterRoutes = getRouteGroup('headhunter');
const mentorRoutes = getRouteGroup('mentor');
const launchpadRoutes = getRouteGroup('launchpadOps');
const adminRoutes = getRouteGroup('admin');

function RouteElement({ modulePath }) {
  const location = useLocation();
  return (
    <RouteErrorBoundary resetKey={`${location.key}:${modulePath}`}>
      <LoadableRoute modulePath={modulePath} />
    </RouteErrorBoundary>
  );
}

function renderRoutes(routes) {
  return routes.map((route) => (
    <Route key={route.path} path={route.path} element={<RouteElement modulePath={route.module} />} />
  ));
}

function renderRequireRoleRoutes(routes) {
  return routes.map((route) => (
    <Route
      key={route.path}
      path={route.path}
      element={
        <RequireRole allowedRoles={route.roles}>
          <RouteElement modulePath={route.module} />
        </RequireRole>
      }
    />
  ));
}

function renderAdminRoutes(routes) {
  return routes.map((route) => (
    <Route
      key={route.path}
      path={route.path}
      element={
        <RequireRole allowedRoles={['admin']}>
          <RouteElement modulePath={route.module} />
        </RequireRole>
      }
    />
  ));
}

export const ROUTE_COLLECTIONS = Object.freeze({
  public: PUBLIC_ROUTES,
  community: COMMUNITY_ROUTES,
  volunteer: VOLUNTEER_ROUTES,
  launchpad: LAUNCHPAD_ROUTES,
  security: SECURITY_ROUTES,
  userDashboards: userDashboardRoutes,
  freelancer: freelancerRoutes,
  company: companyRoutes,
  agency: agencyRoutes,
  headhunter: headhunterRoutes,
  mentor: mentorRoutes,
  launchpadOps: launchpadRoutes,
  admin: adminRoutes,
});

export default function App() {
  return (
    <Routes>
      <Route
        element={
          <Suspense fallback={<RouteLoading />}>
            <MainLayout />
          </Suspense>
        }
      >
        <Route index element={<RouteElement modulePath="./pages/HomePage.jsx" />} />
        {renderRoutes(PUBLIC_ROUTES)}
        <Route element={<ProtectedRoute requiredMemberships={COMMUNITY_ACCESS_MEMBERSHIPS} />}>
          {renderRoutes(COMMUNITY_ROUTES)}
        </Route>
        <Route element={<ProtectedRoute requiredMemberships={VOLUNTEER_ACCESS_MEMBERSHIPS} />}>
          {renderRoutes(VOLUNTEER_ROUTES)}
        </Route>
        <Route element={<ProtectedRoute requiredMemberships={LAUNCHPAD_ALLOWED_MEMBERSHIPS} />}>
          {renderRoutes(LAUNCHPAD_ROUTES)}
        </Route>
        <Route element={<ProtectedRoute requiredMemberships={SECURITY_ALLOWED_MEMBERSHIPS} />}>
          {renderRoutes(SECURITY_ROUTES)}
        </Route>
        <Route path="*" element={<RouteElement modulePath="./pages/NotFoundPage.jsx" />} />
      </Route>

      {userDashboardRoutes.map((route) => (
        <Route
          key={route.path}
          path={route.path}
          element={
            <RoleProtectedRoute allowedRoles={userRoles}>
              <MembershipGate allowedMemberships={userRoles}>
                <RouteElement modulePath={route.module} />
              </MembershipGate>
            </RoleProtectedRoute>
          }
        />
      ))}

      {freelancerRoutes.map((route) => (
        <Route
          key={route.path}
          path={route.path}
          element={
            <RequireRole allowedRoles={['freelancer']}>
              <RouteElement modulePath={route.module} />
            </RequireRole>
          }
        />
      ))}

      {companyRoutes.map((route) => (
        <Route
          key={route.path}
          path={route.path}
          element={
            <RequireRole allowedRoles={['company']}>
              <RouteElement modulePath={route.module} />
            </RequireRole>
          }
        />
      ))}

      {renderRequireRoleRoutes(agencyRoutes)}
      {renderRequireRoleRoutes(headhunterRoutes)}
      {renderRequireRoleRoutes(mentorRoutes)}
      {renderRequireRoleRoutes(launchpadRoutes)}
      {renderAdminRoutes(adminRoutes)}

      <Route path="admin" element={<RouteElement modulePath="./pages/AdminLoginPage.jsx" />} />
      <Route path="*" element={<RouteElement modulePath="./pages/NotFoundPage.jsx" />} />
    </Routes>
  );
}
