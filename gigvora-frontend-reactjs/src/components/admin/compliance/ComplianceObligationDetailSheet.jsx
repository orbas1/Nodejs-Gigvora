import { Fragment, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import { CalendarDaysIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { describeTimeSince } from '../../../utils/date.js';

const RISK_BADGES = {
  low: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  medium: 'bg-amber-50 text-amber-600 border-amber-200',
  high: 'bg-orange-50 text-orange-600 border-orange-200',
  critical: 'bg-red-50 text-red-600 border-red-200',
};

function resolveRiskTone(riskRating) {
  return RISK_BADGES[riskRating] || RISK_BADGES.medium;
}

export default function ComplianceObligationDetailSheet({ open, obligation, frameworks, onClose }) {
  const frameworkLookup = useMemo(() => {
    return (frameworks ?? []).reduce((acc, framework) => {
      acc[framework.id] = framework.name;
      return acc;
    }, {});
  }, [frameworks]);

  const frameworkNames = useMemo(() => {
    if (!obligation || !Array.isArray(obligation.frameworkIds)) {
      return [];
    }
    return obligation.frameworkIds
      .map((frameworkId) => frameworkLookup[frameworkId] || frameworkId)
      .filter(Boolean);
  }, [frameworkLookup, obligation]);

  const metadataEntries = useMemo(() => {
    if (!obligation?.metadata || typeof obligation.metadata !== 'object') {
      return [];
    }
    return Object.entries(obligation.metadata).map(([key, value]) => ({
      key,
      value: Array.isArray(value) ? value.join(', ') : String(value),
    }));
  }, [obligation]);

  if (!obligation) {
    return null;
  }

  const dueDate = obligation.dueDate ? new Date(obligation.dueDate) : null;
  const lastUpdated = obligation.updatedAt || obligation.createdAt;

  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/30" aria-hidden="true" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 flex max-w-full justify-end">
            <Transition.Child
              as={Fragment}
              enter="transform transition ease-out duration-200"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="transform transition ease-in duration-150"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <Dialog.Panel className="pointer-events-auto w-screen max-w-lg bg-white shadow-xl">
                <div className="flex h-full flex-col">
                  <header className="border-b border-slate-200 bg-slate-50/80 px-6 py-5">
                    <Dialog.Title className="text-lg font-semibold text-slate-900">{obligation.title}</Dialog.Title>
                    <p className="mt-2 text-sm text-slate-600">
                      Owned by {obligation.owner || 'Unassigned'} • Status {obligation.status || 'backlog'}
                    </p>
                  </header>

                  <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${resolveRiskTone(
                          obligation.riskRating,
                        )}`}
                      >
                        <ShieldCheckIcon className="h-4 w-4" aria-hidden="true" />
                        {obligation.riskRating ?? 'medium'} risk
                      </span>
                      {dueDate ? (
                        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                          <CalendarDaysIcon className="h-4 w-4" aria-hidden="true" />
                          Due {dueDate.toLocaleDateString()}
                        </span>
                      ) : null}
                      {lastUpdated ? (
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Updated {describeTimeSince(lastUpdated)}
                        </span>
                      ) : null}
                    </div>

                    <section className="space-y-2">
                      <h3 className="text-sm font-semibold text-slate-900">Summary</h3>
                      <p className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 text-sm text-slate-600">
                        {obligation.notes || 'No additional notes captured yet. Add context so auditors understand the remediation path.'}
                      </p>
                    </section>

                    <section className="space-y-2">
                      <h3 className="text-sm font-semibold text-slate-900">Framework alignment</h3>
                      <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
                        {frameworkNames.length ? (
                          frameworkNames.map((name) => <li key={name}>{name}</li>)
                        ) : (
                          <li>No frameworks linked yet.</li>
                        )}
                      </ul>
                    </section>

                    <section className="space-y-2">
                      <h3 className="text-sm font-semibold text-slate-900">Metadata</h3>
                      {metadataEntries.length ? (
                        <dl className="grid grid-cols-1 gap-3 text-xs text-slate-500 md:grid-cols-2">
                          {metadataEntries.map((entry) => (
                            <div key={entry.key} className="rounded-2xl border border-slate-100 bg-white/80 p-3">
                              <dt className="font-semibold uppercase tracking-wide text-slate-400">{entry.key}</dt>
                              <dd className="mt-1 text-slate-600">{entry.value}</dd>
                            </div>
                          ))}
                        </dl>
                      ) : (
                        <p className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-3 text-xs text-slate-400">
                          No metadata captured. Attach Jira links, control IDs, or remediation owners to enrich this obligation.
                        </p>
                      )}
                    </section>
                  </div>

                  <footer className="border-t border-slate-200 bg-slate-50/80 px-6 py-4 text-right">
                    <button
                      type="button"
                      onClick={onClose}
                      className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                    >
                      Close detail
                    </button>
                  </footer>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

ComplianceObligationDetailSheet.propTypes = {
  open: PropTypes.bool,
  obligation: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    title: PropTypes.string,
    owner: PropTypes.string,
    status: PropTypes.string,
    riskRating: PropTypes.string,
    dueDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    notes: PropTypes.string,
    metadata: PropTypes.object,
    frameworkIds: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.number, PropTypes.string])),
    updatedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    createdAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  }),
  frameworks: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      name: PropTypes.string,
    }),
  ),
  onClose: PropTypes.func,
};

ComplianceObligationDetailSheet.defaultProps = {
  open: false,
  obligation: null,
  frameworks: [],
  onClose: undefined,
};
