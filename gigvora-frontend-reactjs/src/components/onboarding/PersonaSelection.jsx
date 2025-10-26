import { useMemo } from 'react';
import PropTypes from 'prop-types';

function InsightList({ insights }) {
  if (!insights?.length) {
    return null;
  }

  return (
    <ul className="mt-3 space-y-1.5 text-xs text-slate-500">
      {insights.map((insight) => (
        <li key={insight} className="flex items-start gap-2">
          <span className="mt-1 inline-flex h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
          <span>{insight}</span>
        </li>
      ))}
    </ul>
  );
}

InsightList.propTypes = {
  insights: PropTypes.arrayOf(PropTypes.string),
};

export default function PersonaSelection({
  options,
  selectedValues,
  onToggle,
  title,
  subtitle,
  helperText,
  selectionLabel,
}) {
  const selectedSet = useMemo(() => {
    if (!selectedValues) {
      return new Set();
    }
    if (selectedValues instanceof Set) {
      return selectedValues;
    }
    return new Set(Array.isArray(selectedValues) ? selectedValues : []);
  }, [selectedValues]);

  const selectedCount = selectedSet.size;
  const selectionStatus = selectionLabel ?? (selectedCount ? `${selectedCount} selected` : 'Optional');

  return (
    <section className="space-y-5 rounded-3xl border border-slate-200 bg-surfaceMuted/60 p-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          {subtitle ? <p className="mt-1 text-xs text-slate-500">{subtitle}</p> : null}
        </div>
        <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500">
          {selectionStatus}
        </span>
      </header>
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => {
          const selected = selectedSet.has(option.value);
          const accentClass = selected ? option.selectedAccentClass : option.accentClass;
          const badgeClass = selected ? option.selectedBadgeClass : option.badgeClass;

          return (
            <button
              type="button"
              key={option.value}
              onClick={() => onToggle?.(option.value)}
              className={`group flex h-full flex-col justify-between rounded-2xl border p-5 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                selected
                  ? 'border-accent bg-white shadow-soft'
                  : 'border-slate-200 bg-white/80 hover:border-accent/40 hover:shadow-sm'
              }`}
              aria-pressed={selected}
            >
              <div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {option.icon ? (
                      <span
                        className={`inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-r ${accentClass} text-sm font-semibold text-white shadow-soft`}
                        aria-hidden="true"
                      >
                        {option.icon}
                      </span>
                    ) : null}
                    <span className="text-sm font-semibold text-slate-900">{option.title}</span>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${badgeClass}`}>
                    {option.badge}
                  </span>
                </div>
                <p className="mt-3 text-xs text-slate-600">{option.description}</p>
                <InsightList insights={option.insights} />
              </div>
              <div className="mt-5 flex items-center justify-between text-xs font-semibold">
                <span className={selected ? 'text-accent' : 'text-slate-400'}>
                  {selected ? option.selectedLabel ?? 'Included at launch' : option.ctaLabel ?? 'Tap to include'}
                </span>
                <span className="text-slate-400">{option.runtimeEstimate}</span>
              </div>
            </button>
          );
        })}
      </div>
      {helperText ? <p className="text-xs text-slate-500">{helperText}</p> : null}
    </section>
  );
}

PersonaSelection.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      badge: PropTypes.string.isRequired,
      icon: PropTypes.node,
      insights: PropTypes.arrayOf(PropTypes.string),
      accentClass: PropTypes.string,
      selectedAccentClass: PropTypes.string,
      badgeClass: PropTypes.string,
      selectedBadgeClass: PropTypes.string,
      ctaLabel: PropTypes.string,
      selectedLabel: PropTypes.string,
      runtimeEstimate: PropTypes.string,
    }),
  ).isRequired,
  selectedValues: PropTypes.oneOfType([
    PropTypes.instanceOf(Set),
    PropTypes.arrayOf(PropTypes.string),
  ]),
  onToggle: PropTypes.func,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  helperText: PropTypes.string,
  selectionLabel: PropTypes.string,
};
