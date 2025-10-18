import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

function normalizeSettings(settings) {
  if (!settings) {
    return {
      baseUrl: 'https://api.openai.com/v1',
      apiKey: '',
      workspaceId: null,
    };
  }
  return {
    baseUrl: settings.connection?.baseUrl || 'https://api.openai.com/v1',
    apiKey: '',
    workspaceId: settings.workspaceId ?? null,
  };
}

export default function ByokCredentialCard({
  settings,
  onSubmit,
  onTest,
  saving = false,
  testing = false,
  className = '',
}) {
  const [formState, setFormState] = useState(() => normalizeSettings(settings));
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const fingerprint = settings?.apiKey?.fingerprint;
  const lastUpdated = settings?.apiKey?.updatedAt ? new Date(settings.apiKey.updatedAt) : null;
  const lastTested = settings?.connection?.lastTestedAt ? new Date(settings.connection.lastTestedAt) : null;

  const statusBadge = useMemo(() => {
    if (fingerprint) {
      return { label: 'Connected', tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
    return { label: 'Missing', tone: 'bg-rose-50 text-rose-700 border-rose-200' };
  }, [fingerprint]);

  useEffect(() => {
    setFormState(normalizeSettings(settings));
  }, [settings]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage(null);
    setError(null);
    try {
      if (typeof onSubmit === 'function') {
        await onSubmit({
          connection: { baseUrl: formState.baseUrl, workspaceId: formState.workspaceId },
          apiKey: formState.apiKey || undefined,
          workspaceId: formState.workspaceId,
        });
        setMessage('Credentials updated successfully.');
        setFormState((prev) => ({ ...prev, apiKey: '' }));
      }
    } catch (submitError) {
      setError(submitError?.message || 'Unable to update credentials.');
    }
  };

  const handleTest = async () => {
    setMessage(null);
    setError(null);
    try {
      if (typeof onTest === 'function') {
        const result = await onTest({
          message: 'Confirming Gigvora auto reply connection.',
          workspaceId: formState.workspaceId,
        });
        if (result?.reply) {
          setMessage('Connection successful. Preview reply generated.');
        } else {
          setMessage('Connection verified.');
        }
      }
    } catch (testError) {
      setError(testError?.message || 'Connection test failed.');
    }
  };

  return (
    <div className={`rounded-3xl border border-slate-200 bg-white p-6 shadow-sm ${className}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-slate-900">OpenAI key</h3>
          <div className="flex flex-wrap gap-2 text-xs text-slate-500">
            <span className={`inline-flex items-center rounded-full border px-3 py-1 font-semibold uppercase tracking-wide ${statusBadge.tone}`}>
              {statusBadge.label}
            </span>
            {fingerprint ? <span>Fingerprint {fingerprint}</span> : <span>Provide a key to enable replies</span>}
          </div>
        </div>
        <div className="flex flex-col items-start gap-1 text-xs text-slate-500">
          <span>Last update {lastUpdated ? lastUpdated.toLocaleString() : '—'}</span>
          <span>Last test {lastTested ? lastTested.toLocaleString() : '—'}</span>
        </div>
      </div>

      <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            API base URL
            <input
              type="url"
              name="baseUrl"
              required
              value={formState.baseUrl}
              onChange={handleChange}
              placeholder="https://api.openai.com/v1"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Workspace (optional)
            <input
              type="number"
              name="workspaceId"
              min="1"
              value={formState.workspaceId ?? ''}
              onChange={handleChange}
              placeholder="Workspace ID"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
        </div>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          API key
          <input
            type="password"
            name="apiKey"
            value={formState.apiKey}
            onChange={handleChange}
            placeholder={fingerprint ? '•••••••• (leave blank to keep current key)' : 'sk-...'}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
          <span className="text-xs font-medium text-slate-500">Leave blank to keep the current key.</span>
        </label>

        {error ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p> : null}
        {message ? <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-600">{message}</p> : null}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            onClick={handleTest}
            className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-70"
            disabled={testing}
          >
            {testing ? 'Testing…' : 'Test'}
          </button>
        </div>
      </form>
    </div>
  );
}

ByokCredentialCard.propTypes = {
  settings: PropTypes.shape({
    apiKey: PropTypes.shape({
      fingerprint: PropTypes.string,
      updatedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    }),
    connection: PropTypes.shape({
      baseUrl: PropTypes.string,
      lastTestedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    }),
    workspaceId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  }),
  onSubmit: PropTypes.func,
  onTest: PropTypes.func,
  saving: PropTypes.bool,
  testing: PropTypes.bool,
  className: PropTypes.string,
};

ByokCredentialCard.defaultProps = {
  settings: null,
  onSubmit: null,
  onTest: null,
  saving: false,
  testing: false,
  className: '',
};
