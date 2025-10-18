import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import DataStatus from '../../DataStatus.jsx';

function normalizeMembersCount(group) {
  if (group.metrics?.totalMembers != null) {
    return {
      total: group.metrics.totalMembers,
      active: group.metrics.activeMembers ?? group.metrics.totalMembers,
      pending: group.metrics.pendingMembers ?? 0,
    };
  }

  const members = Array.isArray(group.members)
    ? group.members
    : Array.isArray(group.memberships)
    ? group.memberships
    : [];
  const active = members.filter((member) => (member.status ?? 'pending') === 'active').length;
  const pending = members.length - active;
  return { total: members.length, active, pending };
}

export default function GroupGrid({ groups, loading, error, onReload, onOpen }) {
  const [query, setQuery] = useState('');
  const [visibility, setVisibility] = useState('all');

  const filtered = useMemo(() => {
    return groups
      .filter((group) => {
        if (!query.trim()) {
          return true;
        }
        const haystack = `${group.name ?? ''} ${group.slug ?? ''}`.toLowerCase();
        return haystack.includes(query.trim().toLowerCase());
      })
      .filter((group) => {
        if (visibility === 'all') {
          return true;
        }
        return (group.visibility ?? 'private') === visibility;
      });
  }, [groups, query, visibility]);

  if (loading) {
    return <DataStatus state="loading" title="Loading groups" />;
  }

  if (error) {
    return (
      <DataStatus
        state="error"
        title="Could not load groups"
        description={error?.message ?? 'Please try again.'}
        onRetry={onReload}
      />
    );
  }

  return (
    <div className="flex h-full flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <label className="relative flex-1 min-w-[220px]">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search groups"
            className="w-full rounded-full border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm text-slate-700 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </label>
        <select
          value={visibility}
          onChange={(event) => setVisibility(event.target.value)}
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <option value="all">All visibility</option>
          <option value="public">Public</option>
          <option value="private">Private</option>
          <option value="secret">Secret</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/60 p-10 text-sm text-slate-500">
          No groups match the current filters.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((group) => {
            const counts = normalizeMembersCount(group);
            return (
              <button
                key={group.id}
                type="button"
                onClick={() => onOpen(group.id)}
                className="flex flex-col rounded-3xl border border-slate-200 bg-white/90 p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-base font-semibold text-slate-900">{group.name}</p>
                    <p className="text-xs uppercase tracking-wide text-slate-400">{group.visibility ?? 'private'}</p>
                  </div>
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-600">
                    {counts.active} active
                  </span>
                </div>
                {group.description ? (
                  <p className="mt-3 line-clamp-3 text-sm text-slate-500">{group.description}</p>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold text-slate-500">
                  <span className="rounded-full bg-slate-100 px-3 py-1">Policy: {group.memberPolicy ?? 'request'}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1">Total: {counts.total}</span>
                  {counts.pending ? (
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">Pending: {counts.pending}</span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

GroupGrid.propTypes = {
  groups: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string,
      slug: PropTypes.string,
      description: PropTypes.string,
      visibility: PropTypes.string,
      memberPolicy: PropTypes.string,
      metrics: PropTypes.object,
      members: PropTypes.array,
      memberships: PropTypes.array,
    }),
  ),
  loading: PropTypes.bool,
  error: PropTypes.instanceOf(Error),
  onReload: PropTypes.func,
  onOpen: PropTypes.func.isRequired,
};

GroupGrid.defaultProps = {
  groups: [],
  loading: false,
  error: null,
  onReload: undefined,
};
