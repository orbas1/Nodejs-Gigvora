import { useMemo } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';

function buildSourceBreakdown(highlights) {
  if (!Array.isArray(highlights) || highlights.length === 0) {
    return [];
  }

  const counts = new Map();
  highlights.forEach((highlight) => {
    const sourceKey = highlight?.source ?? 'unspecified';
    counts.set(sourceKey, (counts.get(sourceKey) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([source, total]) => ({ source, total }))
    .sort((a, b) => b.total - a.total);
}

function collectMatchedSkills(highlights) {
  const skillSet = new Set();
  highlights?.forEach((highlight) => {
    const skills = highlight?.bestCandidate?.matchedSkills;
    if (Array.isArray(skills)) {
      skills.forEach((skill) => {
        if (skill) {
          skillSet.add(skill);
        }
      });
    }
  });
  return Array.from(skillSet).slice(0, 8);
}

export default function AutomationTelemetry({ automation }) {
  const totalMatches = automation?.totalMatches ?? 0;
  const autoAssignable = automation?.autoAssignable ?? 0;

  const autoAssignableCoverage = totalMatches > 0 ? Math.round((autoAssignable / totalMatches) * 100) : 0;

  const sourceBreakdown = useMemo(() => buildSourceBreakdown(automation?.highlights), [automation?.highlights]);
  const matchedSkills = useMemo(() => collectMatchedSkills(automation?.highlights), [automation?.highlights]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-semibold text-slate-900">Automation coverage</h4>
          <p className="mt-1 text-xs text-slate-500">
            {totalMatches > 0
              ? `${autoAssignable} auto-assign ready of ${totalMatches} matches analysed`
              : 'No machine recommendations in the selected window.'}
          </p>
        </div>
        <div className="text-right text-3xl font-semibold text-slate-900">
          {totalMatches > 0 ? `${autoAssignableCoverage}%` : '—'}
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Auto-assignment rate</div>
        </div>
      </div>
      <div className="mt-4 h-2 w-full rounded-full bg-slate-100">
        <div
          className={clsx('h-2 rounded-full transition-all', autoAssignableCoverage > 0 ? 'bg-emerald-500' : 'bg-slate-300')}
          style={{ width: `${Math.min(autoAssignableCoverage, 100)}%` }}
        />
      </div>
      {sourceBreakdown.length ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Top sources</div>
            <ul className="mt-2 space-y-2 text-sm text-slate-600">
              {sourceBreakdown.map((entry) => (
                <li key={entry.source} className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2">
                  <span className="font-medium capitalize text-slate-700">{entry.source.replace(/_/g, ' ')}</span>
                  <span className="text-xs font-semibold text-slate-500">{entry.total}</span>
                </li>
              ))}
            </ul>
          </div>
          {matchedSkills.length ? (
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Highlighted skills</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {matchedSkills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

AutomationTelemetry.propTypes = {
  automation: PropTypes.shape({
    totalMatches: PropTypes.number,
    autoAssignable: PropTypes.number,
    highlights: PropTypes.arrayOf(
      PropTypes.shape({
        source: PropTypes.string,
        bestCandidate: PropTypes.shape({
          matchedSkills: PropTypes.arrayOf(PropTypes.string),
        }),
      }),
    ),
  }),
};

AutomationTelemetry.defaultProps = {
  automation: undefined,
};
