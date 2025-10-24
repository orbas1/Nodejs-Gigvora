import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { ClockIcon } from '@heroicons/react/24/outline';
import useJourneyProgress from '../../hooks/useJourneyProgress.js';

function ProgressBar({ ratio }) {
  const percentage = Math.round((ratio || 0) * 100);
  return (
    <div className="relative h-3 w-full overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full bg-accent transition-all duration-500" style={{ width: `${percentage}%` }} />
    </div>
  );
}

export default function JourneyProgressSummary({ title = 'Journey progress', description, category, personas }) {
  const { definitions, checkpoints, summary } = useJourneyProgress();
  const items = Object.values(definitions)
    .filter((definition) => {
      if (category && definition.category !== category) {
        return false;
      }
      if (personas && personas.length) {
        return definition.personas?.some((persona) => personas.includes(persona));
      }
      return true;
    })
    .map((definition) => {
      const checkpoint = checkpoints[definition.id];
      const completed = Boolean(checkpoint?.completedAt);
      return {
        id: definition.id,
        title: definition.title,
        description: definition.description,
        completed,
        completedAt: checkpoint?.completedAt,
      };
    });

  if (!items.length) {
    return null;
  }

  const headingCopy = title ?? 'Journey progress';
  const supportingCopy = description ?? 'Track how core readiness checkpoints are progressing across your workspace.';

  return (
    <section
      className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm"
      aria-label={`${headingCopy} summary`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-slate-900">{headingCopy}</h3>
          <p className="text-sm text-slate-500">{supportingCopy}</p>
        </div>
        <div className="min-w-[180px]">
          <p className="text-right text-xs font-medium uppercase tracking-wide text-slate-500">Overall completion</p>
          <p className="text-right text-2xl font-semibold text-slate-900">{Math.round(summary.ratio * 100)}%</p>
        </div>
      </div>
      <div className="mt-4">
        <ProgressBar ratio={summary.ratio} />
      </div>
      <ul className="mt-6 space-y-4">
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white/80 p-4">
            <span className="mt-1 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full">
              {item.completed ? (
                <CheckCircleIcon className="h-6 w-6 text-emerald-500" aria-hidden="true" />
              ) : (
                <ClockIcon className="h-6 w-6 text-slate-400" aria-hidden="true" />
              )}
              <span className="sr-only">{item.completed ? 'Completed checkpoint' : 'Checkpoint pending'}</span>
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">{item.title}</p>
              <p className="text-xs text-slate-500">{item.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
