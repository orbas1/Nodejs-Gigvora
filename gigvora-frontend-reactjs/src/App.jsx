import { Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/routing/ProtectedRoute.jsx';
import RoleProtectedRoute from './components/auth/RoleProtectedRoute.jsx';
import MembershipGate from './components/auth/MembershipGate.jsx';
import RequireRole from './components/routing/RequireRole.jsx';
import RouteAnalyticsListener from './routes/RouteAnalyticsListener.jsx';
import AdminRoutes from './routes/AdminRoutes.jsx';
import LoadableRoute from './routes/LoadableRoute.jsx';
import {
  AGENCY_ROUTES,
  ADMIN_ROUTES,
  COMMUNITY_ACCESS_MEMBERSHIPS,
  COMMUNITY_ROUTES,
  COMPANY_ROUTES,
  FREELANCER_ROUTES,
  HEADHUNTER_ROUTES,
  LAUNCHPAD_ROUTES,
  LAUNCHPAD_ROUTES_PROTECTED,
  MainLayout,
  MENTOR_ROUTES,
  PUBLIC_ROUTES,
  ROUTE_COLLECTIONS,
  SECURITY_ROUTES,
  USER_DASHBOARD_ROUTES,
  USER_ROLES,
  VOLUNTEER_ACCESS_MEMBERSHIPS,
  VOLUNTEER_ROUTES,
} from './routes/routeConfig.jsx';
import { LAUNCHPAD_ALLOWED_MEMBERSHIPS, SECURITY_ALLOWED_MEMBERSHIPS } from './constants/access.js';

export {
  ROUTE_COLLECTIONS,
  COMMUNITY_ACCESS_MEMBERSHIPS,
  VOLUNTEER_ACCESS_MEMBERSHIPS,
  LAUNCHPAD_ROUTES,
  SECURITY_ROUTES,
};

function renderRoutes(routes) {
  return routes.map((route) => (
    <Route key={route.path} path={route.path} element={<LoadableRoute modulePath={route.module} />} />
  ));
}

function renderRequireRoleRoutes(routes) {
  return routes.map((route) => (
    <Route
      key={route.path}
      path={route.path}
      element={
        <RequireRole allowedRoles={route.roles}>
          <LoadableRoute modulePath={route.module} />
        </RequireRole>
      }
    />
  ));
}

export default function App() {
  return (
    <>
      <RouteAnalyticsListener />
      <Routes>
        <Route
          element={
            <Suspense fallback={<LoadableRoute.Fallback />}>
              <MainLayout />
            </Suspense>
          }
        >
          <Route index element={<LoadableRoute modulePath="pages/HomePage.jsx" />} />
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
        </Route>

        {USER_DASHBOARD_ROUTES.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={
              <RoleProtectedRoute allowedRoles={USER_ROLES}>
                <MembershipGate allowedMemberships={USER_ROLES}>
                  <LoadableRoute modulePath={route.module} />
                </MembershipGate>
              </RoleProtectedRoute>
            }
          />
        ))}

        {FREELANCER_ROUTES.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={
              <RequireRole allowedRoles={['freelancer']}>
                <LoadableRoute modulePath={route.module} />
              </RequireRole>
            }
          />
        ))}

        {COMPANY_ROUTES.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={
              <RequireRole allowedRoles={['company']}>
                <LoadableRoute modulePath={route.module} />
              </RequireRole>
            }
          />
        ))}

        {renderRequireRoleRoutes(AGENCY_ROUTES)}
        {renderRequireRoleRoutes(HEADHUNTER_ROUTES)}
        {renderRequireRoleRoutes(MENTOR_ROUTES)}
        {renderRequireRoleRoutes(LAUNCHPAD_ROUTES_PROTECTED)}

        <Route
          path="dashboard/admin/*"
          element={
            <RequireRole allowedRoles={['admin']}>
              <Suspense fallback={<LoadableRoute.Fallback />}>
                <AdminRoutes routes={ADMIN_ROUTES} />
              </Suspense>
            </RequireRole>
          }
        />

        <Route path="admin" element={<LoadableRoute modulePath="pages/AdminLoginPage.jsx" />} />
        <Route path="*" element={<LoadableRoute modulePath="pages/NotFoundPage.jsx" />} />
      </Routes>
    </>
  );
}
