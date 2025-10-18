import PropTypes from 'prop-types';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { formatAbsolute } from '../../../utils/date.js';
import { CREATION_STUDIO_STATUSES, getCreationType } from '../../../constants/creationStudio.js';

function GroupButton({ group, active, onSelect }) {
  const badge = active ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-100';
  return (
    <button
      type="button"
      onClick={() => onSelect(group)}
      className={`flex w-full items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold transition ${badge}`}
    >
      <span>{group.label}</span>
      <span className="flex items-center gap-2 text-xs font-semibold">
        {group.count ?? 0}
        <ChevronRightIcon className="h-4 w-4" aria-hidden="true" />
      </span>
    </button>
  );
}

GroupButton.propTypes = {
  group: PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    count: PropTypes.number,
  }).isRequired,
  active: PropTypes.bool,
  onSelect: PropTypes.func.isRequired,
};

GroupButton.defaultProps = {
  active: false,
};

function UpcomingList({ items }) {
  if (!Array.isArray(items) || items.length === 0) {
    return <p className="text-sm text-slate-500">No launches queued.</p>;
  }

  return (
    <ul className="space-y-3 text-sm">
      {items.slice(0, 4).map((item) => {
        const type = getCreationType(item.type);
        const status = CREATION_STUDIO_STATUSES.find((entry) => entry.id === item.status);
        return (
          <li key={item.id} className="rounded-2xl border border-indigo-100 bg-indigo-50/50 px-4 py-3">
            <p className="text-sm font-semibold text-indigo-900">{item.title}</p>
            <p className="text-xs text-indigo-600">{type?.label ?? item.type}</p>
            <p className="mt-2 text-xs text-indigo-500">{item.launchDate ? formatAbsolute(item.launchDate) : 'Pending date'}</p>
            {status ? (
              <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${status.badge}`}>
                {status.label}
              </span>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

UpcomingList.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object),
};

UpcomingList.defaultProps = {
  items: [],
};

export default function CreationStudioSidebar({ groups, activeGroupId, onSelectGroup, upcoming }) {
  return (
    <aside className="space-y-6">
      <nav className="space-y-2">
        {groups.map((group) => (
          <GroupButton
            key={group.id}
            group={group}
            active={group.id === activeGroupId}
            onSelect={onSelectGroup}
          />
        ))}
      </nav>
      <div className="rounded-3xl border border-indigo-100 bg-white/70 p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">Upcoming</p>
        <div className="mt-3 space-y-3">
          <UpcomingList items={upcoming} />
        </div>
      </div>
    </aside>
  );
}

CreationStudioSidebar.propTypes = {
  groups: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      types: PropTypes.arrayOf(PropTypes.string).isRequired,
      count: PropTypes.number,
    }),
  ).isRequired,
  activeGroupId: PropTypes.string.isRequired,
  onSelectGroup: PropTypes.func.isRequired,
  upcoming: PropTypes.arrayOf(PropTypes.object),
};

CreationStudioSidebar.defaultProps = {
  upcoming: [],
};
