import PropTypes from 'prop-types';
import { FunnelIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const VIEW_OPTIONS = [
  { id: 'open', label: 'Open' },
  { id: 'closed', label: 'Closed' },
];

export default function ProjectToolbar({
  searchTerm,
  onSearchTermChange,
  activeView,
  onViewChange,
  statusFilter,
  onStatusFilterChange,
  riskFilter,
  onRiskFilterChange,
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
        <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" />
        <input
          type="search"
          value={searchTerm}
          onChange={(event) => onSearchTermChange(event.target.value)}
          placeholder="Search"
          className="w-full border-none bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-full bg-slate-100 p-1">
          {VIEW_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onViewChange(option.id)}
              className={`rounded-full px-4 py-1 text-sm font-medium transition ${
                option.id === activeView
                  ? 'bg-slate-900 text-white shadow'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-600">
          <FunnelIcon className="h-4 w-4" />
          <select
            value={statusFilter}
            onChange={(event) => onStatusFilterChange(event.target.value)}
            className="border-none bg-transparent text-sm focus:outline-none"
          >
            <option value="all">Status</option>
            <option value="planning">Planning</option>
            <option value="in_progress">Active</option>
            <option value="at_risk">At risk</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-600">
          <FunnelIcon className="h-4 w-4" />
          <select
            value={riskFilter}
            onChange={(event) => onRiskFilterChange(event.target.value)}
            className="border-none bg-transparent text-sm focus:outline-none"
          >
            <option value="all">Risk</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>
    </div>
  );
}

ProjectToolbar.propTypes = {
  searchTerm: PropTypes.string.isRequired,
  onSearchTermChange: PropTypes.func.isRequired,
  activeView: PropTypes.oneOf(['open', 'closed']).isRequired,
  onViewChange: PropTypes.func.isRequired,
  statusFilter: PropTypes.string.isRequired,
  onStatusFilterChange: PropTypes.func.isRequired,
  riskFilter: PropTypes.string.isRequired,
  onRiskFilterChange: PropTypes.func.isRequired,
};
