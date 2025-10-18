import {
  ArrowPathIcon,
  ChartBarIcon,
  QueueListIcon,
  Squares2X2Icon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

const VIEWS = [
  { id: 'plan', label: 'Plan', icon: QueueListIcon },
  { id: 'posts', label: 'Posts', icon: Squares2X2Icon },
  { id: 'metrics', label: 'Metrics', icon: ChartBarIcon },
];

export default function TimelineToolbar({ activeView, onChange, onOpenSettings, onRefresh, refreshing }) {
  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-soft lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap gap-2">
        {VIEWS.map((view) => {
          const Icon = view.icon;
          const active = activeView === view.id;
          return (
            <button
              key={view.id}
              type="button"
              onClick={() => onChange(view.id)}
              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                active
                  ? 'border-blue-500 bg-blue-500 text-white shadow-sm'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-600'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{view.label}</span>
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
        >
          <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
        <button
          type="button"
          onClick={onOpenSettings}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
        >
          <Cog6ToothIcon className="h-4 w-4" />
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
}
