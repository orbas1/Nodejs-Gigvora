import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { formatRelativeTime } from '../../utils/date.js';

const MATCH_STATUSES = [
  { value: 'suggested', label: 'Suggested' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'engaged', label: 'Engaged' },
  { value: 'dismissed', label: 'Dismissed' },
];

const INITIAL_SETTINGS_FORM = (settings) => ({
  enabled: Boolean(settings?.enabled),
  matchingWindowDays: settings?.matchingWindowDays ?? 14,
  budgetMin: settings?.budgetMin ?? '',
  budgetMax: settings?.budgetMax ?? '',
  seniority: settings?.seniority ?? '',
  targetRoles: Array.isArray(settings?.targetRoles) ? settings.targetRoles.join(', ') : '',
  focusSkills: Array.isArray(settings?.focusSkills) ? settings.focusSkills.join(', ') : '',
  geoPreferences: Array.isArray(settings?.geoPreferences) ? settings.geoPreferences.join(', ') : '',
});

const INITIAL_MATCH_FORM = {
  projectId: '',
  freelancerName: '',
  freelancerEmail: '',
  matchScore: '80',
  status: 'suggested',
  channel: '',
  notes: '',
};

function listFromString(value) {
  if (!value) return undefined;
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function AutoMatchPanel({ settings, matches, summary, projects, onUpdateSettings, onCreateMatch, onUpdateMatch, canManage }) {
  const [settingsForm, setSettingsForm] = useState(() => INITIAL_SETTINGS_FORM(settings));
  const [settingsSubmitting, setSettingsSubmitting] = useState(false);
  const [settingsFeedback, setSettingsFeedback] = useState(null);

  const [matchForm, setMatchForm] = useState(INITIAL_MATCH_FORM);
  const [matchSubmitting, setMatchSubmitting] = useState(false);
  const [matchFeedback, setMatchFeedback] = useState(null);
  const [updatingMatchId, setUpdatingMatchId] = useState(null);

  const projectOptions = useMemo(
    () =>
      projects.map((project) => ({ value: project.id, label: project.title ?? `Project ${project.id}` })),
    [projects],
  );

  const handleSettingsChange = (event) => {
    const { name, value, type, checked } = event.target;
    setSettingsForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSettingsSubmit = async (event) => {
    event.preventDefault();
    if (!onUpdateSettings) return;
    setSettingsSubmitting(true);
    setSettingsFeedback(null);
    try {
      await onUpdateSettings({
        enabled: Boolean(settingsForm.enabled),
        matchingWindowDays: Number(settingsForm.matchingWindowDays),
        budgetMin: settingsForm.budgetMin !== '' ? Number(settingsForm.budgetMin) : undefined,
        budgetMax: settingsForm.budgetMax !== '' ? Number(settingsForm.budgetMax) : undefined,
        seniority: settingsForm.seniority || undefined,
        targetRoles: listFromString(settingsForm.targetRoles),
        focusSkills: listFromString(settingsForm.focusSkills),
        geoPreferences: listFromString(settingsForm.geoPreferences),
      });
      setSettingsFeedback({ tone: 'success', message: 'Settings updated.' });
    } catch (error) {
      setSettingsFeedback({ tone: 'error', message: error?.message ?? 'Unable to update settings.' });
    } finally {
      setSettingsSubmitting(false);
    }
  };

  const handleMatchChange = (event) => {
    const { name, value } = event.target;
    setMatchForm((current) => ({ ...current, [name]: value }));
  };

  const handleMatchSubmit = async (event) => {
    event.preventDefault();
    if (!onCreateMatch) return;
    setMatchSubmitting(true);
    setMatchFeedback(null);
    try {
      await onCreateMatch({
        projectId: matchForm.projectId ? Number(matchForm.projectId) : undefined,
        freelancerName: matchForm.freelancerName,
        freelancerEmail: matchForm.freelancerEmail || undefined,
        matchScore: matchForm.matchScore ? Number(matchForm.matchScore) : undefined,
        status: matchForm.status,
        channel: matchForm.channel || undefined,
        notes: matchForm.notes || undefined,
      });
      setMatchFeedback({ tone: 'success', message: 'Candidate saved.' });
      setMatchForm(INITIAL_MATCH_FORM);
    } catch (error) {
      setMatchFeedback({ tone: 'error', message: error?.message ?? 'Unable to save match.' });
    } finally {
      setMatchSubmitting(false);
    }
  };

  const handleMatchStatusChange = async (matchId, status) => {
    if (!onUpdateMatch) return;
    setUpdatingMatchId(matchId);
    setMatchFeedback(null);
    try {
      await onUpdateMatch(matchId, { status });
      setMatchFeedback({ tone: 'success', message: 'Match updated.' });
    } catch (error) {
      setMatchFeedback({ tone: 'error', message: error?.message ?? 'Unable to update match.' });
    } finally {
      setUpdatingMatchId(null);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Match</h3>
        <div className="flex flex-wrap gap-2 text-xs text-slate-500">
          <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
            Pool {summary.total ?? matches.length}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
            Engaged {summary.engaged ?? 0}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
            Avg {summary.averageScore != null ? Number(summary.averageScore).toFixed(1) : '—'}
          </span>
        </div>
      </div>

      {settingsFeedback ? (
        <div
          className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
            settingsFeedback.tone === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          }`}
        >
          {settingsFeedback.message}
        </div>
      ) : null}
      {matchFeedback ? (
        <div
          className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
            matchFeedback.tone === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          }`}
        >
          {matchFeedback.message}
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,360px)_minmax(0,360px)_1fr]">
        <form className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4" onSubmit={handleSettingsSubmit}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">Auto-match</span>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                name="enabled"
                checked={settingsForm.enabled}
                onChange={handleSettingsChange}
                className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
                disabled={!canManage || settingsSubmitting}
              />
              Enabled
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Window (days)
            <input
              type="number"
              min="1"
              name="matchingWindowDays"
              value={settingsForm.matchingWindowDays}
              onChange={handleSettingsChange}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
              disabled={!canManage || settingsSubmitting}
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm text-slate-600">
              Budget min
              <input
                name="budgetMin"
                value={settingsForm.budgetMin}
                onChange={handleSettingsChange}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                placeholder="5000"
                disabled={!canManage || settingsSubmitting}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-slate-600">
              Budget max
              <input
                name="budgetMax"
                value={settingsForm.budgetMax}
                onChange={handleSettingsChange}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                placeholder="20000"
                disabled={!canManage || settingsSubmitting}
              />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Seniority
            <input
              name="seniority"
              value={settingsForm.seniority}
              onChange={handleSettingsChange}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
              placeholder="Mid"
              disabled={!canManage || settingsSubmitting}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Target roles
            <input
              name="targetRoles"
              value={settingsForm.targetRoles}
              onChange={handleSettingsChange}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
              placeholder="Designer, PM"
              disabled={!canManage || settingsSubmitting}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Skills
            <input
              name="focusSkills"
              value={settingsForm.focusSkills}
              onChange={handleSettingsChange}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
              placeholder="Figma, Research"
              disabled={!canManage || settingsSubmitting}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Regions
            <input
              name="geoPreferences"
              value={settingsForm.geoPreferences}
              onChange={handleSettingsChange}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
              placeholder="EU, US"
              disabled={!canManage || settingsSubmitting}
            />
          </label>
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-600"
            disabled={!canManage || settingsSubmitting}
          >
            {settingsSubmitting ? 'Saving…' : 'Save settings'}
          </button>
        </form>

        <form className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4" onSubmit={handleMatchSubmit}>
          <span className="text-sm font-semibold text-slate-700">Add match</span>
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Project
            <select
              name="projectId"
              value={matchForm.projectId}
              onChange={handleMatchChange}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
              disabled={!canManage || matchSubmitting}
            >
              <option value="">Unassigned</option>
              {projectOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Name
            <input
              name="freelancerName"
              value={matchForm.freelancerName}
              onChange={handleMatchChange}
              required
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
              placeholder="Taylor Lee"
              disabled={!canManage || matchSubmitting}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Email
            <input
              type="email"
              name="freelancerEmail"
              value={matchForm.freelancerEmail}
              onChange={handleMatchChange}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
              placeholder="taylor@example.com"
              disabled={!canManage || matchSubmitting}
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm text-slate-600">
              Score
              <input
                type="number"
                min="0"
                max="100"
                name="matchScore"
                value={matchForm.matchScore}
                onChange={handleMatchChange}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                disabled={!canManage || matchSubmitting}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-slate-600">
              Status
              <select
                name="status"
                value={matchForm.status}
                onChange={handleMatchChange}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                disabled={!canManage || matchSubmitting}
              >
                {MATCH_STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Channel
            <input
              name="channel"
              value={matchForm.channel}
              onChange={handleMatchChange}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
              placeholder="Email"
              disabled={!canManage || matchSubmitting}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Notes
            <textarea
              name="notes"
              value={matchForm.notes}
              onChange={handleMatchChange}
              className="min-h-[96px] rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
              placeholder="Why this match works"
              disabled={!canManage || matchSubmitting}
            />
          </label>
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-600"
            disabled={!canManage || matchSubmitting}
          >
            {matchSubmitting ? 'Saving…' : 'Add to pool'}
          </button>
        </form>

        <div className="space-y-4">
          {matches.length ? (
            matches.map((match) => {
              const isUpdating = updatingMatchId === match.id;
              return (
                <div key={match.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{match.freelancerName}</p>
                      <p className="text-xs text-slate-500">
                        Score {match.matchScore ?? '—'} · {match.freelancerEmail || 'No email'}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {MATCH_STATUSES.map((status) => (
                        <button
                          key={status.value}
                          type="button"
                          onClick={() => handleMatchStatusChange(match.id, status.value)}
                          className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                            match.status === status.value
                              ? 'bg-slate-900 text-white'
                              : 'border border-slate-300 text-slate-600 hover:border-slate-400 hover:text-slate-900'
                          }`}
                          disabled={!canManage || isUpdating}
                        >
                          {status.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                    <span>{match.matchedAt ? formatRelativeTime(match.matchedAt) : 'Not scheduled'}</span>
                    <span>Status {match.status?.replace(/_/g, ' ') ?? 'suggested'}</span>
                    <span>{match.channel || 'No channel'}</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center text-sm text-slate-500">
              No matches yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

AutoMatchPanel.propTypes = {
  settings: PropTypes.object,
  matches: PropTypes.array.isRequired,
  summary: PropTypes.object,
  projects: PropTypes.array.isRequired,
  onUpdateSettings: PropTypes.func,
  onCreateMatch: PropTypes.func,
  onUpdateMatch: PropTypes.func,
  canManage: PropTypes.bool,
};

AutoMatchPanel.defaultProps = {
  settings: {},
  summary: {},
  onUpdateSettings: undefined,
  onCreateMatch: undefined,
  onUpdateMatch: undefined,
  canManage: false,
};

export default AutoMatchPanel;
