import { useMemo } from 'react';
import { DocumentTextIcon, LockClosedIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

const CATEGORY_LABELS = {
  crm: 'CRM',
  communication: 'Communication',
  productivity: 'Work management',
  automation: 'Automation',
  other: 'Other',
};

export default function IntegrationProviderCatalog({ providers }) {
  const providerList = useMemo(() => providers ?? [], [providers]);

  if (!providerList.length) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {providerList.map((provider) => (
        <article key={provider.key} className="space-y-4 rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-soft">
          <header className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{provider.name}</h3>
              <p className="text-xs uppercase tracking-wide text-slate-400">{CATEGORY_LABELS[provider.category] ?? provider.category}</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              <LockClosedIcon className="h-4 w-4" aria-hidden="true" />
              {provider.authType === 'oauth' ? 'OAuth' : provider.authType === 'webhook' ? 'Webhook' : 'Key'}
            </span>
          </header>
          <dl className="space-y-2 text-sm text-slate-600">
            <div className="flex items-center justify-between">
              <dt>Cadence</dt>
              <dd className="font-semibold capitalize">{provider.defaultSyncFrequency ?? 'daily'}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt>Secrets</dt>
              <dd className="font-semibold">{provider.requiresSecrets ? 'Yes' : 'No'}</dd>
            </div>
          </dl>
          <div className="flex flex-wrap gap-2">
            {Array.isArray(provider.requiredScopes) && provider.requiredScopes.length ? (
              provider.requiredScopes.map((scope) => (
                <span key={scope} className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {scope}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-500">No scopes</span>
            )}
          </div>
          {provider.docsUrl ? (
            <a
              href={provider.docsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:text-accentDark"
            >
              <DocumentTextIcon className="h-4 w-4" aria-hidden="true" />
              Docs
              <ArrowTopRightOnSquareIcon className="h-4 w-4" aria-hidden="true" />
            </a>
          ) : null}
        </article>
      ))}
    </div>
  );
}
