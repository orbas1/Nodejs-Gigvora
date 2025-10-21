import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import usePeopleSearch from '../../hooks/usePeopleSearch.js';
import AdminGigManagementPanel from '../../components/admin/gigManagement/AdminGigManagementPanel.jsx';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import AccessDeniedPanel from '../../components/dashboard/AccessDeniedPanel.jsx';
import useSession from '../../hooks/useSession.js';
import { ADMIN_DASHBOARD_MENU_SECTIONS } from '../../constants/adminDashboardMenu.js';
import { deriveAdminAccess } from '../../utils/adminAccess.js';

function formatDisplayName(person) {
  const name = [person.firstName, person.lastName].filter(Boolean).join(' ').trim();
  return name || person.email || `Member #${person.id}`;
}

const AVAILABLE_DASHBOARDS = ['admin', 'user', 'freelancer', 'company', 'agency', 'headhunter'];

const MENU_SECTIONS = ADMIN_DASHBOARD_MENU_SECTIONS.map((section) => ({
  ...section,
  items: Array.isArray(section.items) ? section.items.map((item) => ({ ...item })) : [],
})).concat([
  {
    label: 'Gig operations',
    items: [
      { id: 'admin-gig-member-lookup', name: 'Member lookup', sectionId: 'admin-gig-member-lookup' },
      { id: 'admin-gig-controls', name: 'Gig controls', sectionId: 'admin-gig-controls' },
    ],
  },
]);

const SECTIONS = [
  { id: 'admin-gig-member-lookup', title: 'Member lookup' },
  { id: 'admin-gig-controls', title: 'Gig controls' },
];

export default function AdminGigManagementPage() {
  const { session, isAuthenticated } = useSession();
  const { hasAdminAccess } = useMemo(() => deriveAdminAccess(session), [session]);
  const userScopes = useMemo(() => {
    const permissions = Array.isArray(session?.permissions) ? session.permissions : [];
    const capabilities = Array.isArray(session?.capabilities) ? session.capabilities : [];
    return [...permissions, ...capabilities];
  }, [session]);

  const [query, setQuery] = useState('');
  const [manualId, setManualId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  const searchEnabled = isAuthenticated && hasAdminAccess;

  const { results, loading, error } = usePeopleSearch(searchEnabled ? query : '', { minLength: 2, limit: 8 });

  useEffect(() => {
    if (!searchEnabled) {
      setSelectedUserId(null);
      setSelectedUser(null);
    }
  }, [searchEnabled]);

  const handleSelect = (person) => {
    setSelectedUserId(person.id);
    setSelectedUser(person);
  };

  const handleManualSubmit = (event) => {
    event.preventDefault();
    const parsed = Number(manualId);
    if (Number.isInteger(parsed) && parsed > 0) {
      setSelectedUserId(parsed);
      setSelectedUser((current) => (current?.id === parsed ? current : { id: parsed }));
    }
  };

  const renderResults = () => {
    if (!query.trim()) {
      return null;
    }
    if (error) {
      return <p className="mt-2 text-sm text-rose-600">Unable to search members right now.</p>;
    }
    if (!results.length) {
      return <p className="mt-2 text-sm text-slate-500">No members match that search yet.</p>;
    }
    return (
      <ul className="mt-3 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white shadow-sm">
        {results.map((person) => (
          <li key={person.id}>
            <button
              type="button"
              onClick={() => handleSelect(person)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50"
            >
              <span>
                <span className="block font-semibold text-slate-900">{formatDisplayName(person)}</span>
                <span className="block text-xs text-slate-500">{person.email || 'Email unavailable'}</span>
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {person.userType || 'member'}
              </span>
            </button>
          </li>
        ))}
      </ul>
    );
  };

  const selectedSummary = useMemo(() => {
    if (!selectedUserId) {
      return null;
    }
    const base = selectedUser || results.find((person) => person.id === selectedUserId) || null;
    if (!base) {
      return { id: selectedUserId, name: `Member #${selectedUserId}` };
    }
    return {
      id: base.id,
      name: formatDisplayName(base),
      email: base.email,
      userType: base.userType,
    };
  }, [results, selectedUser, selectedUserId]);

  const handleMenuItemSelect = useCallback((itemId, item) => {
    if (item?.href) {
      return;
    }
    const targetId = item?.sectionId ?? itemId;
    if (!targetId || typeof document === 'undefined') {
      return;
    }
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  if (!isAuthenticated || !hasAdminAccess) {
    return (
      <DashboardLayout
        currentDashboard="admin"
        title="Gig operations"
        subtitle="Access governance"
        description="Search, audit, and act on member gig assignments across Gigvora."
        menuSections={MENU_SECTIONS}
        sections={[]}
        availableDashboards={AVAILABLE_DASHBOARDS}
        onMenuItemSelect={handleMenuItemSelect}
      >
        <AccessDeniedPanel
          role="admin"
          availableDashboards={AVAILABLE_DASHBOARDS}
          userScopes={userScopes}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      currentDashboard="admin"
      title="Gig operations"
      subtitle="Member assignments"
      description="Search members, review active gig placements, and manage engagement controls from one workspace."
      menuSections={MENU_SECTIONS}
      sections={SECTIONS}
      availableDashboards={AVAILABLE_DASHBOARDS}
      onMenuItemSelect={handleMenuItemSelect}
    >
      <div className="space-y-10">
        <section id="admin-gig-member-lookup" className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Admin · Gigs</p>
              <h1 className="mt-3 text-3xl font-semibold text-slate-900">Gig control</h1>
            </div>
            <form
              className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 shadow-sm lg:flex-row lg:items-center lg:gap-4"
              onSubmit={handleManualSubmit}
            >
              <label className="flex flex-1 items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm text-slate-500 shadow-inner">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Member</span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="w-full bg-transparent text-sm text-slate-900 focus:outline-none"
                  placeholder="Search by name or email"
                  disabled={!searchEnabled}
                />
              </label>
              <div className="flex flex-1 items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm text-slate-500 shadow-inner">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">ID</span>
                <input
                  value={manualId}
                  onChange={(event) => setManualId(event.target.value)}
                  className="w-full bg-transparent text-sm text-slate-900 focus:outline-none"
                  placeholder="Member ID"
                  inputMode="numeric"
                  disabled={!searchEnabled}
                />
              </div>
              <button
                type="submit"
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                disabled={!searchEnabled}
              >
                Open
              </button>
            </form>
          </div>
          {loading ? <p className="mt-4 text-xs text-slate-500">Searching…</p> : renderResults()}
        </section>

        <section id="admin-gig-controls">
          {selectedSummary ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Workspace</p>
                  <h2 className="text-xl font-semibold text-slate-900">{selectedSummary.name}</h2>
                  <p className="text-sm text-slate-500">ID {selectedSummary.id}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {selectedSummary.email ? (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                      {selectedSummary.email}
                    </span>
                  ) : null}
                  <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {selectedSummary.userType || 'member'}
                  </span>
                  <Link
                    to={`/profile/${selectedSummary.id}`}
                    className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                  >
                    Profile
                  </Link>
                </div>
              </div>
              <div className="mt-6">
                <AdminGigManagementPanel userId={Number(selectedSummary.id)} />
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white/70 p-8 text-center text-sm text-slate-500">
              Choose a member to manage gigs.
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
