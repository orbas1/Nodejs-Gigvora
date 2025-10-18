
import { useEffect, useState } from 'react';
import { TagIcon } from '@heroicons/react/24/outline';

function toKeywordString(keywords) {
  if (!Array.isArray(keywords) || !keywords.length) {
    return '';
  }
  return keywords
    .map((entry) => (typeof entry === 'string' ? entry : entry?.keyword))
    .filter(Boolean)
    .join(', ');
}

export default function KeywordMatcher({ keywords, matches, onUpdate, loading = false }) {
  const [value, setValue] = useState(toKeywordString(keywords));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValue(toKeywordString(keywords));
  }, [keywords]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      const list = value
        .split(',')
        .map((keyword) => keyword.trim())
        .filter(Boolean)
        .map((keyword) => ({ keyword, weight: 1 }));
      await onUpdate?.(list);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <form className="rounded-3xl border border-slate-200 bg-white/70 p-4 shadow-sm" onSubmit={handleSubmit}>
        <h4 className="text-sm font-semibold text-slate-900">Keywords</h4>
        <textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          rows={4}
          className="mt-3 rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          placeholder="Add keywords"
        />
        <div className="mt-4 flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={saving || loading}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {saving ? 'Updating…' : 'Update'}
          </button>
        </div>
      </form>
      <div className="rounded-3xl border border-slate-200 bg-white/70 p-4 shadow-sm">
        <h4 className="text-sm font-semibold text-slate-900">Matches</h4>
        <ul className="mt-3 space-y-3">
          {(matches ?? []).length ? (
            matches.map((match) => (
              <li key={match.applicationId ?? match.candidateId} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="mt-1 rounded-full bg-emerald-50 p-2 text-emerald-600">
                    <TagIcon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{match.candidateName ?? 'Candidate'}</p>
                    <p className="text-xs text-slate-500">Score {(match.score * 100).toFixed(0)}%</p>
                    {Array.isArray(match.matchedKeywords) && match.matchedKeywords.length ? (
                      <p className="mt-1 text-xs text-slate-500">{match.matchedKeywords.join(', ')}</p>
                    ) : null}
                  </div>
                </div>
              </li>
            ))
          ) : (
            <li className="rounded-2xl border border-dashed border-slate-200 bg-white/60 px-3 py-6 text-sm text-slate-500">No matches.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
