import PropTypes from 'prop-types';
import { SparklesIcon, ClockIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

function formatDuration(minutes) {
  if (!Number.isFinite(Number(minutes))) {
    return 'Flexible';
  }
  const totalMinutes = Math.max(0, Math.round(Number(minutes)));
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (!hours) {
    return `${mins} min`;
  }
  if (!mins) {
    return `${hours} hr${hours > 1 ? 's' : ''}`;
  }
  return `${hours} hr${hours > 1 ? 's' : ''} ${mins} min`;
}

function TemplateCard({ template, onUse, canManage }) {
  return (
    <article className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm transition hover:border-slate-300">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{template.name}</h3>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{template.format?.replace('_', ' ') ?? 'Format'}</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
          <ClockIcon className="h-4 w-4" aria-hidden="true" />
          {formatDuration(template.durationHours)}
        </span>
      </div>
      {template.highlights?.length ? (
        <ul className="space-y-1 text-sm text-slate-600">
          {template.highlights.map((highlight) => (
            <li key={highlight} className="flex items-start gap-2">
              <SparklesIcon className="mt-0.5 h-4 w-4 text-slate-400" aria-hidden="true" />
              <span>{highlight}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {template.techStack?.length ? (
        <div className="flex flex-wrap gap-2">
          {template.techStack.map((tool) => (
            <span key={tool} className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {tool}
            </span>
          ))}
        </div>
      ) : null}
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={() => onUse?.(template)}
          disabled={!canManage}
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          Use template
          <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}

TemplateCard.propTypes = {
  template: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    format: PropTypes.string,
    durationHours: PropTypes.number,
    highlights: PropTypes.arrayOf(PropTypes.string),
    techStack: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  onUse: PropTypes.func,
  canManage: PropTypes.bool,
};

export default function EventTemplateGallery({ templates, onUseTemplate, canManage }) {
  if (!templates?.length) {
    return null;
  }

  return (
    <section className="flex flex-col gap-4 rounded-4xl border border-slate-200 bg-white/60 p-6 shadow-sm">
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold text-slate-900">Blueprint library</h3>
        <p className="text-sm text-slate-500">Jump-start a new event with pre-filled agendas, tooling, and run-of-show suggestions.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {templates.map((template) => (
          <TemplateCard key={template.id ?? template.name} template={template} onUse={onUseTemplate} canManage={canManage} />
        ))}
      </div>
    </section>
  );
}

EventTemplateGallery.propTypes = {
  templates: PropTypes.arrayOf(PropTypes.object),
  onUseTemplate: PropTypes.func,
  canManage: PropTypes.bool,
};

EventTemplateGallery.defaultProps = {
  templates: [],
  onUseTemplate: undefined,
  canManage: true,
};
