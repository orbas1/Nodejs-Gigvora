import DashboardAccessDenied from './DashboardAccessDenied.jsx';
import ProtectedRoute from '../routing/ProtectedRoute.jsx';

export default function ProtectedDashboardRoute({ role, children }) {
  const normalizedRole = role ? role.toLowerCase() : null;
  const allowed = normalizedRole ? [normalizedRole] : [];

  return (
    <ProtectedRoute
      allowedMemberships={allowed}
      allowedRoles={allowed}
      preferDashboardRedirect={false}
      fallback={({ access }) => (
        <DashboardAccessDenied requiredRole={normalizedRole} memberships={access.memberships} />
      )}
    >
      {children}
    </ProtectedRoute>
  );
}
