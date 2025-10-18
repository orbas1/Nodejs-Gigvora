import { ArrowPathIcon, PlusIcon } from '@heroicons/react/24/outline';
import { VIEW_OPTIONS } from './constants.js';

export default function ReviewToolbar({ activeView, onViewChange, onCreate, onRefresh, refreshing }) {
  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-soft lg:flex-row lg:items-center lg:justify-between">
      <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 p-1">
        {VIEW_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onViewChange(option.id)}
            className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition ${
              option.id === activeView ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600 disabled:cursor-wait disabled:opacity-70"
        >
          <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex items-center gap-2 rounded-full border border-blue-500 bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600"
        >
          <PlusIcon className="h-4 w-4" />
          New
        </button>
      </div>
    </div>
  );
}
