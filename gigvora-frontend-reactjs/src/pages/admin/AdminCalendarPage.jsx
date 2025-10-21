import AdminCalendarConsole from '../../components/admin/AdminCalendarConsole.jsx';
import AccessRestricted from '../../components/AccessRestricted.jsx';
import useSession from '../../hooks/useSession.js';

export default function AdminCalendarPage() {
  const { session, isAuthenticated } = useSession();
  const isAdmin = isAuthenticated
    && ((Array.isArray(session?.roles) && session.roles.some((role) => `${role}`.toLowerCase() === 'admin'))
      || (Array.isArray(session?.memberships)
        && session.memberships.some((membership) => `${membership}`.toLowerCase() === 'admin')));

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20">
        <AccessRestricted
          tone="amber"
          badge="Admin"
          title="Admin permissions required"
          description="Only administrator workspaces can configure organisation-wide calendars and program schedules."
          actionLabel="Return to dashboards"
          actionHref="/dashboard/user"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-8">
      <AdminCalendarConsole variant="standalone" />
    </div>
  );
}
