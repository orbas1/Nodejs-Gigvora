import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import UserAvatar from '../components/UserAvatar.jsx';
import projectsService from '../services/projects.js';

const DEFAULT_WEIGHTS = {
  recency: 0.25,
  rating: 0.2,
  completionQuality: 0.2,
  earningsBalance: 0.15,
  inclusion: 0.2,
};

function formatPercent(value) {
  return `${Math.round(Number(value || 0) * 100)}%`;
}

export default function ProjectCreatePage() {
  const navigate = useNavigate();
  const [formState, setFormState] = useState({
    title: '',
    description: '',
    status: 'planning',
    location: '',
    budgetAmount: '',
    budgetCurrency: 'USD',
    autoAssignEnabled: true,
    limit: 6,
    expiresInMinutes: 240,
    fairnessMaxAssignments: 1,
    weights: { ...DEFAULT_WEIGHTS },
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const weightsTotal = useMemo(() => {
    return Object.values(formState.weights).reduce((sum, value) => sum + Number(value || 0), 0);
  }, [formState.weights]);

  const normalizedWeights = useMemo(() => {
    if (!weightsTotal) {
      return DEFAULT_WEIGHTS;
    }
    return Object.fromEntries(
      Object.entries(formState.weights).map(([key, value]) => [key, Number(value || 0) / weightsTotal]),
    );
  }, [formState.weights, weightsTotal]);

  const handleChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleWeightChange = (field) => (event) => {
    const value = Number(event.target.value);
    setFormState((prev) => ({
      ...prev,
      weights: {
        ...prev.weights,
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        title: formState.title,
        description: formState.description,
        status: formState.status,
        location: formState.location,
        budgetAmount: formState.budgetAmount ? Number(formState.budgetAmount) : undefined,
        budgetCurrency: formState.budgetCurrency,
        autoAssign: formState.autoAssignEnabled
          ? {
              enabled: true,
              limit: Number(formState.limit) || undefined,
              expiresInMinutes: Number(formState.expiresInMinutes) || undefined,
              fairness: {
                ensureNewcomer: true,
                maxAssignments: Number(formState.fairnessMaxAssignments) || 0,
              },
              weights: normalizedWeights,
            }
          : { enabled: false },
        actorId: 1,
      };
      const response = await projectsService.createProject(payload);
      setResult(response);
      setTimeout(() => {
        navigate('/projects');
      }, 1200);
    } catch (err) {
      setError(err.message || 'Unable to create project.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="relative overflow-hidden py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(191,219,254,0.3),_transparent_65%)]" aria-hidden="true" />
      <div className="relative mx-auto max-w-4xl space-y-10 px-6">
        <PageHeader
          eyebrow="Projects"
          title="Launch a collaborative project"
          description="Define your scope, capture investment signals, and activate auto-assign so emerging freelancers rotate through premium briefs."
        />
        <form
          onSubmit={handleSubmit}
          className="rounded-4xl border border-slate-200 bg-white/95 p-8 shadow-lg backdrop-blur"
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <label className="space-y-2 text-sm text-slate-600">
              <span className="font-semibold text-slate-900">Project title</span>
              <input
                type="text"
                required
                value={formState.title}
                onChange={handleChange('title')}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                placeholder="Gigvora Analytics Accelerator"
              />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span className="font-semibold text-slate-900">Status</span>
              <select
                value={formState.status}
                onChange={handleChange('status')}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              >
                <option value="planning">Planning</option>
                <option value="open">Open</option>
                <option value="in_progress">In progress</option>
                <option value="completed">Completed</option>
              </select>
            </label>
            <label className="space-y-2 text-sm text-slate-600 lg:col-span-2">
              <span className="font-semibold text-slate-900">Description</span>
              <textarea
                required
                rows={4}
                value={formState.description}
                onChange={handleChange('description')}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                placeholder="Outline objectives, deliverables, rituals, and tooling."
              />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span className="font-semibold text-slate-900">Location / timezone</span>
              <input
                type="text"
                value={formState.location}
                onChange={handleChange('location')}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                placeholder="Remote • GMT+1"
              />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="space-y-2 text-sm text-slate-600">
                <span className="font-semibold text-slate-900">Budget amount</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formState.budgetAmount}
                  onChange={handleChange('budgetAmount')}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                  placeholder="2500"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-600">
                <span className="font-semibold text-slate-900">Currency</span>
                <input
                  type="text"
                  value={formState.budgetCurrency}
                  onChange={handleChange('budgetCurrency')}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2 uppercase focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                  placeholder="USD"
                />
              </label>
            </div>
          </div>

          <fieldset className="mt-10 space-y-4 rounded-3xl border border-slate-200 bg-surfaceMuted/60 p-6">
            <legend className="px-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              Auto-assign matching
            </legend>
            <label className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">Enable weighted auto-assign</p>
                <p className="text-xs text-slate-500">
                  Fairness-first scoring rotates new freelancers while accounting for recency, rating, and completion quality.
                </p>
              </div>
              <input
                type="checkbox"
                checked={formState.autoAssignEnabled}
                onChange={handleChange('autoAssignEnabled')}
                className="h-6 w-12 rounded-full border border-slate-300 bg-white text-accent focus:ring-accent"
              />
            </label>
            {formState.autoAssignEnabled ? (
              <div className="grid gap-6 lg:grid-cols-[1.2fr,1fr]">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <label className="space-y-1 text-xs text-slate-500">
                      <span className="font-semibold text-slate-900">Queue size</span>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={formState.limit}
                        onChange={handleChange('limit')}
                        className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                      />
                    </label>
                    <label className="space-y-1 text-xs text-slate-500">
                      <span className="font-semibold text-slate-900">Response window (minutes)</span>
                      <input
                        type="number"
                        min="30"
                        max="1440"
                        value={formState.expiresInMinutes}
                        onChange={handleChange('expiresInMinutes')}
                        className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                      />
                    </label>
                  </div>
                  <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-inner">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                      <span>Weighting</span>
                      <span>Total {formatPercent(weightsTotal || 0)}</span>
                    </div>
                    {(
                      [
                        ['recency', 'Last assignment recency'],
                        ['rating', 'Quality rating'],
                        ['completionQuality', 'Completion rate'],
                        ['earningsBalance', 'Earnings balance'],
                        ['inclusion', 'New freelancer boost'],
                      ]
                    ).map(([key, label]) => (
                      <label key={key} className="space-y-1 text-xs text-slate-500">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-900">{label}</span>
                          <span className="text-slate-400">{formatPercent(normalizedWeights[key])}</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={formState.weights[key]}
                          onChange={handleWeightChange(key)}
                          className="w-full accent-accent"
                        />
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex h-full flex-col justify-between rounded-3xl border border-accent/20 bg-gradient-to-br from-accent/10 via-white to-emerald-50 p-5 shadow-soft">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Fairness preview</p>
                    <p className="mt-2 text-sm text-slate-600">
                      First slot reserves space for freelancers with ≤{formState.fairnessMaxAssignments} active assignments.
                    </p>
                    <div className="mt-4 flex items-center gap-3 text-sm text-slate-600">
                      <UserAvatar name="Nova" seed="nova" size="sm" />
                      <div>
                        <p className="font-semibold text-slate-900">Nova Strategist</p>
                        <p className="text-xs text-slate-500">Fairness boosted &bull; 96% completion</p>
                      </div>
                    </div>
                  </div>
                  <label className="mt-6 space-y-1 text-xs text-slate-500">
                    <span className="font-semibold text-slate-900">Max assignments for priority slot</span>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={formState.fairnessMaxAssignments}
                      onChange={handleChange('fairnessMaxAssignments')}
                      className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                    />
                  </label>
                </div>
              </div>
            ) : null}
          </fieldset>

          {error ? (
            <div className="mt-6 rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</div>
          ) : null}
          {result ? (
            <div className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              Project created successfully. Redirecting you back to the programmes view…
            </div>
          ) : null}

          <div className="mt-8 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/projects')}
              className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Creating…' : 'Create project'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
