import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import usePeopleSearch from '../../hooks/usePeopleSearch.js';
import AdminGigManagementPanel from '../../components/admin/gigManagement/AdminGigManagementPanel.jsx';

function formatDisplayName(person) {
  const name = [person.firstName, person.lastName].filter(Boolean).join(' ').trim();
  return name || person.email || `Member #${person.id}`;
}

export default function AdminGigManagementPage() {
  const [query, setQuery] = useState('');
  const [manualId, setManualId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  const { results, loading, error } = usePeopleSearch(query, { minLength: 2, limit: 8 });

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

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6">
        <header className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Admin · Gigs</p>
              <h1 className="mt-3 text-3xl font-semibold text-slate-900">Gig control</h1>
            </div>
            <form className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 shadow-sm lg:flex-row lg:items-center lg:gap-4" onSubmit={handleManualSubmit}>
              <label className="flex flex-1 items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm text-slate-500 shadow-inner">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Member</span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="w-full bg-transparent text-sm text-slate-900 focus:outline-none"
                  placeholder="Search by name or email"
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
                />
              </div>
              <button
                type="submit"
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                Open
              </button>
            </form>
          </div>
          {loading ? <p className="mt-4 text-xs text-slate-500">Searching…</p> : renderResults()}
        </header>

        {selectedSummary ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
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
          </section>
        ) : (
          <section className="rounded-3xl border border-dashed border-slate-200 bg-white/70 p-8 text-center text-sm text-slate-500">
            Choose a member to manage gigs.
          </section>
        )}
      </div>
    </div>
  );
}
