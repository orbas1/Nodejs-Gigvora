import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { formatRelativeTime } from '../../utils/date.js';
import classNames from '../../utils/classNames.js';
import { formatStatusLabel, resolveConnectionName, resolveSessionLabel } from './utils.js';

const FILTERS = [
  { id: 'All', predicate: () => true },
  { id: 'Follow', predicate: (connection) => connection.followStatus === 'following' },
  { id: 'Lead', predicate: (connection) => connection.followStatus === 'requested' || connection.followStatus === 'saved' },
  { id: 'Active', predicate: (connection) => connection.followStatus === 'connected' },
];

function FilterBar({ active, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {FILTERS.map((filter) => {
        const isActive = filter.id === active;
        return (
          <button
            key={filter.id}
            type="button"
            className={classNames(
              'rounded-full px-3 py-1 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2',
              isActive
                ? 'bg-slate-900 text-white shadow-sm focus:ring-slate-200'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 focus:ring-slate-300',
            )}
            onClick={() => onChange(filter.id)}
          >
            {filter.id}
          </button>
        );
      })}
    </div>
  );
}

FilterBar.propTypes = {
  active: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

export default function NetworkingPeoplePanel({
  connections,
  activeFilter,
  onChangeFilter,
  onCreate,
  onEdit,
  onOpen,
}) {
  const filterDefinition = useMemo(
    () => FILTERS.find((filter) => filter.id === activeFilter) ?? FILTERS[0],
    [activeFilter],
  );

  const filteredConnections = useMemo(
    () => connections.filter((connection) => filterDefinition.predicate(connection)),
    [connections, filterDefinition],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterBar active={filterDefinition.id} onChange={onChangeFilter} />
        <button
          type="button"
          className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800"
          onClick={onCreate}
        >
          Add
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {filteredConnections.length ? (
          filteredConnections.map((connection) => {
            const name = resolveConnectionName(connection);
            const sessionLabel = connection.sessionId ? resolveSessionLabel(connection.session, connection.sessionId) : null;
            const tags = Array.isArray(connection.tags) ? connection.tags : [];
            return (
              <div key={connection.id} className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{name}</p>
                    {connection.connectionHeadline ? (
                      <p className="text-xs text-slate-500">{connection.connectionHeadline}</p>
                    ) : null}
                    {connection.connectionCompany ? (
                      <p className="text-[11px] text-slate-400">{connection.connectionCompany}</p>
                    ) : null}
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {formatStatusLabel(connection.followStatus)}
                  </span>
                </div>

                <div className="grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                  <div>
                    <span className="block font-semibold text-slate-500">Met</span>
                    <span>{connection.connectedAt ? formatRelativeTime(connection.connectedAt) : '—'}</span>
                  </div>
                  <div>
                    <span className="block font-semibold text-slate-500">Last</span>
                    <span>{connection.lastContactedAt ? formatRelativeTime(connection.lastContactedAt) : '—'}</span>
                  </div>
                  <div>
                    <span className="block font-semibold text-slate-500">Session</span>
                    <span>{sessionLabel || '—'}</span>
                  </div>
                  <div>
                    <span className="block font-semibold text-slate-500">Email</span>
                    <span className="break-all text-slate-500">{connection.connectionEmail || '—'}</span>
                  </div>
                </div>

                {tags.length ? (
                  <div className="flex flex-wrap gap-2 text-[11px] text-slate-500">
                    {tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-slate-100 px-2 py-1 font-semibold">
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}

                <div className="flex gap-2">
                  <button
                    type="button"
                    className="flex-1 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                    onClick={() => onOpen(connection)}
                  >
                    Open
                  </button>
                  <button
                    type="button"
                    className="flex-1 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                    onClick={() => onEdit(connection)}
                  >
                    Edit
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center text-sm text-slate-500">
            No contacts saved yet. Use Add to capture people you meet.
          </div>
        )}
      </div>
    </div>
  );
}

NetworkingPeoplePanel.propTypes = {
  connections: PropTypes.arrayOf(PropTypes.object),
  activeFilter: PropTypes.string.isRequired,
  onChangeFilter: PropTypes.func.isRequired,
  onCreate: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onOpen: PropTypes.func.isRequired,
};

NetworkingPeoplePanel.defaultProps = {
  connections: [],
};
