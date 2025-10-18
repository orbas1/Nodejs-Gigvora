import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Switch } from '@headlessui/react';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

const ROLE_OPTIONS = [
  { value: 'agency', label: 'Agency team' },
  { value: 'company', label: 'Client company' },
  { value: 'freelancer', label: 'Freelancer' },
  { value: 'mentor', label: 'Mentor' },
  { value: 'user', label: 'Community member' },
  { value: 'admin', label: 'Platform admin' },
];

const FORMAT_OPTIONS = [
  { value: 'virtual', label: 'Virtual' },
  { value: 'in_person', label: 'In person' },
  { value: 'hybrid', label: 'Hybrid' },
];

const VISIBILITY_OPTIONS = [
  { value: 'private', label: 'Private' },
  { value: 'invite_only', label: 'Invite only' },
  { value: 'public', label: 'Public' },
];

function classNames(...values) {
  return values.filter(Boolean).join(' ');
}

function buildState(settings) {
  return {
    includeArchivedByDefault: Boolean(settings?.includeArchivedByDefault),
    autoArchiveAfterDays: settings?.autoArchiveAfterDays ?? 90,
    defaultFormat: settings?.defaultFormat ?? 'virtual',
    defaultVisibility: settings?.defaultVisibility ?? 'invite_only',
    defaultTimezone: settings?.defaultTimezone ?? 'UTC',
    requireCheckInNotes: Boolean(settings?.requireCheckInNotes),
    allowedRoles: Array.isArray(settings?.allowedRoles) && settings.allowedRoles.length
      ? settings.allowedRoles
      : ['agency', 'company'],
    customRole: '',
  };
}

export default function AgencyEventSettingsPanel({ initialSettings, onSave, saving = false, error = null }) {
  const [formState, setFormState] = useState(() => buildState(initialSettings));

  useEffect(() => {
    setFormState(buildState(initialSettings));
  }, [initialSettings]);

  const allowedRoleSet = useMemo(() => new Set(formState.allowedRoles.map((role) => role.toLowerCase())), [formState.allowedRoles]);

  const toggleRole = (role) => {
    setFormState((current) => {
      const next = new Set(current.allowedRoles.map((value) => value.toLowerCase()));
      if (next.has(role)) {
        next.delete(role);
      } else {
        next.add(role);
      }
      return { ...current, allowedRoles: Array.from(next) };
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const payload = {
      includeArchivedByDefault: formState.includeArchivedByDefault,
      autoArchiveAfterDays: Number(formState.autoArchiveAfterDays),
      defaultFormat: formState.defaultFormat,
      defaultVisibility: formState.defaultVisibility,
      defaultTimezone: formState.defaultTimezone,
      requireCheckInNotes: formState.requireCheckInNotes,
      allowedRoles: formState.allowedRoles,
    };
    onSave?.(payload);
  };

  const handleAddCustomRole = () => {
    if (!formState.customRole?.trim()) {
      return;
    }
    const value = formState.customRole.trim().toLowerCase();
    setFormState((current) => ({
      ...current,
      allowedRoles: Array.from(new Set([...current.allowedRoles.map((role) => role.toLowerCase()), value])),
      customRole: '',
    }));
  };

  return (
    <section className="flex flex-col gap-5 rounded-4xl border border-slate-200 bg-white/80 p-6 shadow-sm">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Workspace defaults</h2>
          <p className="text-sm text-slate-500">Control who can create events and the defaults applied to new runbooks.</p>
        </div>
        <InformationCircleIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
      </header>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
            Default format
            <select
              value={formState.defaultFormat}
              onChange={(event) => setFormState((current) => ({ ...current, defaultFormat: event.target.value }))}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-normal text-slate-900 focus:border-slate-400 focus:outline-none"
            >
              {FORMAT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
            Default visibility
            <select
              value={formState.defaultVisibility}
              onChange={(event) => setFormState((current) => ({ ...current, defaultVisibility: event.target.value }))}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-normal text-slate-900 focus:border-slate-400 focus:outline-none"
            >
              {VISIBILITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
            Default timezone
            <input
              type="text"
              value={formState.defaultTimezone}
              onChange={(event) => setFormState((current) => ({ ...current, defaultTimezone: event.target.value }))}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-normal text-slate-900 focus:border-slate-400 focus:outline-none"
              placeholder="Europe/London"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
            Auto-archive after (days)
            <input
              type="number"
              min="0"
              value={formState.autoArchiveAfterDays}
              onChange={(event) => setFormState((current) => ({ ...current, autoArchiveAfterDays: event.target.value }))}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-normal text-slate-900 focus:border-slate-400 focus:outline-none"
            />
          </label>
        </div>

        <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
          <h3 className="text-sm font-semibold text-slate-900">Who can manage events?</h3>
          <div className="flex flex-wrap gap-2">
            {ROLE_OPTIONS.map((role) => {
              const enabled = allowedRoleSet.has(role.value);
              return (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => toggleRole(role.value)}
                  className={classNames(
                    'rounded-full border px-3 py-1 text-xs font-semibold transition',
                    enabled ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                  )}
                >
                  {role.label}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={formState.customRole}
              onChange={(event) => setFormState((current) => ({ ...current, customRole: event.target.value }))}
              placeholder="Add a custom role"
              className="flex-1 rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddCustomRole}
              className="rounded-full border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-400"
            >
              Add
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
          <Switch.Group as="div" className="flex items-center justify-between">
            <div>
              <Switch.Label className="text-sm font-semibold text-slate-900">Show archived events by default</Switch.Label>
              <Switch.Description className="text-xs text-slate-500">
                Automatically include archived events when the workspace loads.
              </Switch.Description>
            </div>
            <Switch
              checked={formState.includeArchivedByDefault}
              onChange={(value) => setFormState((current) => ({ ...current, includeArchivedByDefault: value }))}
              className={classNames(
                formState.includeArchivedByDefault ? 'bg-slate-900' : 'bg-slate-200',
                'relative inline-flex h-6 w-11 items-center rounded-full transition',
              )}
            >
              <span
                className={classNames(
                  formState.includeArchivedByDefault ? 'translate-x-5' : 'translate-x-1',
                  'inline-block h-4 w-4 transform rounded-full bg-white transition',
                )}
              />
            </Switch>
          </Switch.Group>

          <Switch.Group as="div" className="flex items-center justify-between">
            <div>
              <Switch.Label className="text-sm font-semibold text-slate-900">Require check-in notes</Switch.Label>
              <Switch.Description className="text-xs text-slate-500">
                Collect a short note whenever a guest is marked as checked in.
              </Switch.Description>
            </div>
            <Switch
              checked={formState.requireCheckInNotes}
              onChange={(value) => setFormState((current) => ({ ...current, requireCheckInNotes: value }))}
              className={classNames(
                formState.requireCheckInNotes ? 'bg-slate-900' : 'bg-slate-200',
                'relative inline-flex h-6 w-11 items-center rounded-full transition',
              )}
            >
              <span
                className={classNames(
                  formState.requireCheckInNotes ? 'translate-x-5' : 'translate-x-1',
                  'inline-block h-4 w-4 transform rounded-full bg-white transition',
                )}
              />
            </Switch>
          </Switch.Group>
        </div>

        {error ? (
          <p className="rounded-3xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error.message ?? error.toString()}</p>
        ) : null}

        <div className="flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {saving ? 'Saving…' : 'Save settings'}
          </button>
        </div>
      </form>
    </section>
  );
}

AgencyEventSettingsPanel.propTypes = {
  initialSettings: PropTypes.object,
  onSave: PropTypes.func,
  saving: PropTypes.bool,
  error: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
};

AgencyEventSettingsPanel.defaultProps = {
  initialSettings: null,
  onSave: undefined,
  saving: false,
  error: null,
};
