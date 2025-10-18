import PropTypes from 'prop-types';
import { useMemo, useState } from 'react';
import {
  UserCircleIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import { HEALTH_TONES, classNames, formatCurrency } from './utils.js';

export default function ClientPanel({
  open,
  clients,
  onCreate,
  onEdit,
  onSelect,
  activeClientId,
}) {
  const [query, setQuery] = useState('');
  const filteredClients = useMemo(() => {
    if (!Array.isArray(clients)) {
      return [];
    }
    const lowered = query.trim().toLowerCase();
    if (!lowered) {
      return clients;
    }
    return clients.filter((client) => client.name?.toLowerCase().includes(lowered));
  }, [clients, query]);

  const activeClient = useMemo(
    () => filteredClients.find((client) => client.id === activeClientId) ?? filteredClients[0] ?? null,
    [filteredClients, activeClientId],
  );

  return (
    <aside
      className={classNames(
        'flex h-full flex-col gap-4 rounded-4xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200',
        open ? 'opacity-100' : 'pointer-events-none opacity-0 lg:opacity-100',
      )}
    >
      <header className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-900">Clients</h2>
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-accent hover:text-accent"
        >
          <PlusIcon className="h-4 w-4" />
          New
        </button>
      </header>
      <div className="flex items-center gap-2 rounded-3xl border border-slate-200 bg-slate-50/80 px-3 py-2">
        <MagnifyingGlassIcon className="h-4 w-4 text-slate-400" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="w-full bg-transparent text-sm text-slate-600 focus:outline-none"
          placeholder="Search"
        />
      </div>
      <div className="grid gap-3 overflow-y-auto">
        {filteredClients.map((client) => {
          const tone = HEALTH_TONES[client.healthStatus] ?? HEALTH_TONES.healthy;
          const active = activeClient?.id === client.id;
          return (
            <button
              key={client.id}
              type="button"
              onClick={() => onSelect?.(client)}
              className={classNames(
                'flex items-center justify-between gap-3 rounded-3xl border px-4 py-3 text-left text-sm transition',
                active ? 'border-accent bg-accent/10 text-accent' : 'border-slate-200 bg-slate-50 text-slate-600',
              )}
            >
              <span>{client.name}</span>
              <span className={classNames('rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase', tone)}>
                {client.healthStatus}
              </span>
            </button>
          );
        })}
      </div>

      {activeClient ? (
        <section className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
          <header className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">{activeClient.name}</h3>
              <p className="text-xs text-slate-500 capitalize">{activeClient.tier}</p>
            </div>
            <button
              type="button"
              onClick={() => onEdit?.(activeClient)}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-accent hover:text-accent"
            >
              <UserCircleIcon className="h-4 w-4" />
              Edit
            </button>
          </header>
          <dl className="space-y-2 text-xs text-slate-500">
            <div className="flex items-center gap-2 text-slate-600">
              <EnvelopeIcon className="h-4 w-4 text-slate-400" />
              <span>{activeClient.primaryContactEmail ?? 'No email'}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <PhoneIcon className="h-4 w-4 text-slate-400" />
              <span>{activeClient.primaryContactName ?? 'No contact'}</span>
            </div>
            {activeClient.websiteUrl ? (
              <div className="flex items-center gap-2 text-slate-600">
                <MapPinIcon className="h-4 w-4 text-slate-400" />
                <a
                  href={activeClient.websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate text-xs font-semibold text-accent hover:text-accentDark"
                >
                  {activeClient.websiteUrl}
                </a>
              </div>
            ) : null}
            <div className="flex items-center justify-between text-slate-600">
              <span>Annual value</span>
              <span className="font-semibold text-slate-900">
                {formatCurrency(activeClient.annualContractValue)}
              </span>
            </div>
            {activeClient.tags?.length ? (
              <div className="flex flex-wrap gap-2">
                {activeClient.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-500"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
            {activeClient.notes ? <p className="text-xs text-slate-500">{activeClient.notes}</p> : null}
          </dl>
        </section>
      ) : (
        <p className="text-xs text-slate-500">No clients yet.</p>
      )}
    </aside>
  );
}

ClientPanel.propTypes = {
  open: PropTypes.bool,
  clients: PropTypes.arrayOf(PropTypes.object),
  onCreate: PropTypes.func,
  onEdit: PropTypes.func,
  onSelect: PropTypes.func,
  activeClientId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

ClientPanel.defaultProps = {
  open: true,
  clients: [],
};
