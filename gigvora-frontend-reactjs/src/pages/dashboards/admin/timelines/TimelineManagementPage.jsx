import { useMemo } from 'react';
import useSession from '../../../../hooks/useSession.js';
import TimelineWorkspace from './TimelineWorkspace.jsx';

function AccessDenied() {
  return (
    <div className="flex h-full min-h-[60vh] items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white">
      <div className="max-w-md text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">Restricted</p>
        <h1 className="mt-4 text-2xl font-semibold text-slate-900">Admin access required</h1>
        <p className="mt-3 text-sm text-slate-600">
          You need an administrator role to manage rollout timelines. Please contact a workspace owner if you
          believe this is an error.
        </p>
      </div>
    </div>
  );
}

export default function TimelineManagementPage() {
  const { session } = useSession();

  const hasAccess = useMemo(() => {
    if (!session) {
      return false;
    }
    const roles = Array.isArray(session.roles) ? session.roles : [];
    const memberships = Array.isArray(session.memberships) ? session.memberships : [];
    const roleSet = new Set([...roles.map((role) => role?.toLowerCase?.() ?? role), ...memberships.map((role) => role?.toLowerCase?.() ?? role)]);
    return roleSet.has('admin') || roleSet.has('administrator') || roleSet.has('super-admin') || roleSet.has('superadmin');
  }, [session]);

  if (!hasAccess) {
    return <AccessDenied />;
  }

  return <TimelineWorkspace />;
}
