import PropTypes from 'prop-types';
import { SparklesIcon } from '@heroicons/react/24/outline';

function RecommendationActions({ actions, onAction }) {
  if (!actions?.length) {
    return null;
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {actions.map((action) => (
        <button
          key={action.label}
          type="button"
          onClick={() => onAction?.(action)}
          className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-white px-3 py-1.5 text-xs font-semibold text-accent shadow-sm transition hover:border-accent hover:bg-accent hover:text-white"
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}

RecommendationActions.propTypes = {
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      type: PropTypes.oneOf(['section', 'link']).isRequired,
      label: PropTypes.string.isRequired,
      value: PropTypes.string,
      href: PropTypes.string,
    }),
  ),
  onAction: PropTypes.func,
};

RecommendationActions.defaultProps = {
  actions: [],
  onAction: undefined,
};

function RecommendationCard({ recommendation, onAction }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/10 text-accent">
          <SparklesIcon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">AI coach insight</p>
          <h3 className="mt-1 text-base font-semibold text-slate-900">{recommendation.title}</h3>
          <p className="mt-2 text-sm text-slate-600">{recommendation.body}</p>
          {recommendation.metrics?.length ? (
            <dl className="mt-3 grid gap-3 sm:grid-cols-3">
              {recommendation.metrics.map((metric) => (
                <div key={metric.label} className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{metric.label}</dt>
                  <dd className="text-sm font-semibold text-slate-900">{metric.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          <RecommendationActions actions={recommendation.actions} onAction={onAction} />
        </div>
      </div>
    </article>
  );
}

RecommendationCard.propTypes = {
  recommendation: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    body: PropTypes.string.isRequired,
    metrics: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string.isRequired,
        value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      }),
    ),
    actions: RecommendationActions.propTypes.actions,
  }).isRequired,
  onAction: PropTypes.func,
};

RecommendationCard.defaultProps = {
  onAction: undefined,
};

export default function AiCoachPanel({ recommendations, onAction }) {
  if (!recommendations?.length) {
    return null;
  }

  return (
    <section className="space-y-4 rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-sm">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">Mentor AI coach</p>
        <h2 className="text-xl font-semibold">Personalised guidance to keep momentum.</h2>
        <p className="text-sm text-slate-200">
          These recommendations blend Explorer analytics with mentoring outcomes to surface the next best actions.
        </p>
      </header>
      <div className="space-y-4">
        {recommendations.map((recommendation) => (
          <RecommendationCard key={recommendation.id} recommendation={recommendation} onAction={onAction} />
        ))}
      </div>
    </section>
  );
}

AiCoachPanel.propTypes = {
  recommendations: PropTypes.arrayOf(RecommendationCard.propTypes.recommendation).isRequired,
  onAction: PropTypes.func,
};

AiCoachPanel.defaultProps = {
  onAction: undefined,
};
