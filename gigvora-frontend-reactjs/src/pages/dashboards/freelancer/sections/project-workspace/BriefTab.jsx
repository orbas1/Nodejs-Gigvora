import { useState } from 'react';
import PropTypes from 'prop-types';
import { listToMultiline, parseList } from './helpers.js';

export default function BriefTab({ brief, onSave, disabled = false }) {
  const [draft, setDraft] = useState(() => ({
    title: brief?.title ?? '',
    summary: brief?.summary ?? '',
    objectives: listToMultiline(brief?.objectives ?? []),
    deliverables: listToMultiline(brief?.deliverables ?? []),
    successMetrics: listToMultiline(brief?.successMetrics ?? []),
    clientStakeholders: listToMultiline(brief?.clientStakeholders ?? []),
  }));
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleChange = (key, value) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (disabled) {
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      await onSave?.({
        title: draft.title,
        summary: draft.summary,
        objectives: parseList(draft.objectives),
        deliverables: parseList(draft.deliverables),
        successMetrics: parseList(draft.successMetrics),
        clientStakeholders: parseList(draft.clientStakeholders),
      });
      setFeedback({ type: 'success', message: 'Workspace brief updated.' });
    } catch (error) {
      setFeedback({ type: 'error', message: error?.message ?? 'Unable to update brief.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Project brief</h3>
      <form onSubmit={handleSubmit} className="mt-4 grid gap-4">
        <div className="space-y-1">
          <label htmlFor="briefTitle" className="text-sm font-medium text-slate-700">
            Engagement title
          </label>
          <input
            id="briefTitle"
            value={draft.title}
            onChange={(event) => handleChange('title', event.target.value)}
            required
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="briefSummary" className="text-sm font-medium text-slate-700">
            Summary
          </label>
          <textarea
            id="briefSummary"
            value={draft.summary}
            onChange={(event) => handleChange('summary', event.target.value)}
            rows={4}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="briefObjectives" className="text-sm font-medium text-slate-700">
              Objectives (one per line)
            </label>
            <textarea
              id="briefObjectives"
              value={draft.objectives}
              onChange={(event) => handleChange('objectives', event.target.value)}
              rows={4}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="briefDeliverables" className="text-sm font-medium text-slate-700">
              Deliverables (one per line)
            </label>
            <textarea
              id="briefDeliverables"
              value={draft.deliverables}
              onChange={(event) => handleChange('deliverables', event.target.value)}
              rows={4}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="briefMetrics" className="text-sm font-medium text-slate-700">
              Success metrics (one per line)
            </label>
            <textarea
              id="briefMetrics"
              value={draft.successMetrics}
              onChange={(event) => handleChange('successMetrics', event.target.value)}
              rows={4}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="briefStakeholders" className="text-sm font-medium text-slate-700">
              Stakeholders (one per line)
            </label>
            <textarea
              id="briefStakeholders"
              value={draft.clientStakeholders}
              onChange={(event) => handleChange('clientStakeholders', event.target.value)}
              rows={4}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {feedback ? (
          <p className={`text-sm ${feedback.type === 'error' ? 'text-rose-600' : 'text-emerald-600'}`}>{feedback.message}</p>
        ) : null}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? 'Saving…' : 'Save brief'}
          </button>
        </div>
      </form>
    </div>
  );
}

BriefTab.propTypes = {
  brief: PropTypes.object,
  onSave: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};
