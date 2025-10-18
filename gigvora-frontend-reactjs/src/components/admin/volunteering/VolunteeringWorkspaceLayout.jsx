import PropTypes from 'prop-types';
import {
  Squares2X2Icon,
  RectangleStackIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';

const NAV_ITEMS = [
  { key: 'overview', label: 'Home', icon: Squares2X2Icon },
  { key: 'programs', label: 'Programs', icon: RectangleStackIcon },
  { key: 'roles', label: 'Roles', icon: UserGroupIcon },
  { key: 'shifts', label: 'Shifts', icon: CalendarDaysIcon },
  { key: 'people', label: 'People', icon: UsersIcon },
];

export default function VolunteeringWorkspaceLayout({ active, onSelect, toolbar, children }) {
  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <aside className="w-full shrink-0 rounded-3xl bg-slate-900/95 text-white lg:w-56">
        <div className="flex items-center justify-between px-5 pb-2 pt-5">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-300">Workspace</p>
        </div>
        <nav className="flex flex-row gap-2 overflow-x-auto px-3 pb-4 lg:flex-col lg:px-4">
          {NAV_ITEMS.map((item) => {
            const isActive = active === item.key;
            const Icon = item.icon;
            return (
              <button
                type="button"
                key={item.key}
                onClick={() => onSelect(item.key)}
                className={`flex h-12 min-w-[96px] items-center justify-center gap-2 rounded-2xl px-3 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/60 lg:justify-start lg:px-4 ${
                  isActive ? 'bg-white text-slate-900 shadow-lg' : 'bg-white/10 text-slate-200 hover:bg-white/20'
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>
      <section className="flex-1">
        <div className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-100">
          {toolbar ? <div className="flex flex-wrap items-center justify-between gap-3">{toolbar}</div> : null}
          <div>{children}</div>
        </div>
      </section>
    </div>
  );
}

VolunteeringWorkspaceLayout.propTypes = {
  active: PropTypes.oneOf(NAV_ITEMS.map((item) => item.key)).isRequired,
  onSelect: PropTypes.func.isRequired,
  toolbar: PropTypes.node,
  children: PropTypes.node.isRequired,
};
