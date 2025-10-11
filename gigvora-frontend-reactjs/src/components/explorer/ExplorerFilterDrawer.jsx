import { Fragment, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const DEFAULT_FILTERS = {
  employmentTypes: [],
  employmentCategories: [],
  durationCategories: [],
  budgetCurrencies: [],
  locations: [],
  countries: [],
  tracks: [],
  organizations: [],
  statuses: [],
  isRemote: null,
  updatedWithin: '30d',
};

const FRESHNESS_OPTIONS = [
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'any', label: 'Any time' },
];

function toArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return [value];
}

function normaliseFilters(filters) {
  return { ...DEFAULT_FILTERS, ...filters };
}

function buildFacetOptions(facets, key, fallback = []) {
  const facet = facets?.[key];
  if (!facet) {
    return fallback;
  }
  return Object.entries(facet)
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);
}

function FilterPill({ active, label, count, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
        active ? 'border-accent bg-accent/10 text-accent' : 'border-slate-200 bg-white text-slate-600 hover:border-accent hover:text-accent'
      }`}
    >
      {label}
      {count ? <span className="font-normal text-slate-400"> ({count})</span> : null}
    </button>
  );
}

FilterPill.propTypes = {
  active: PropTypes.bool,
  label: PropTypes.string.isRequired,
  count: PropTypes.number,
  onClick: PropTypes.func.isRequired,
};

FilterPill.defaultProps = {
  active: false,
  count: 0,
};

export default function ExplorerFilterDrawer({ category, isOpen, onClose, filters, facets, onApply, onReset }) {
  const [draft, setDraft] = useState(() => normaliseFilters(filters));

  useEffect(() => {
    if (isOpen) {
      setDraft(normaliseFilters(filters));
    }
  }, [filters, isOpen]);

  const employmentTypeOptions = useMemo(
    () => buildFacetOptions(facets, 'employmentType', [
      { value: 'Full-time', count: 0 },
      { value: 'Part-time', count: 0 },
      { value: 'Contract', count: 0 },
    ]),
    [facets],
  );

  const durationOptions = useMemo(
    () => buildFacetOptions(facets, 'durationCategory', [
      { value: 'short_term', count: 0 },
      { value: 'medium_term', count: 0 },
      { value: 'long_term', count: 0 },
    ]),
    [facets],
  );

  const locationOptions = useMemo(() => buildFacetOptions(facets, 'geoCity', []), [facets]);
  const trackOptions = useMemo(() => buildFacetOptions(facets, 'track', []), [facets]);
  const organizationOptions = useMemo(() => buildFacetOptions(facets, 'organization', []), [facets]);
  const statusOptions = useMemo(() => buildFacetOptions(facets, 'status', []), [facets]);
  const handleMultiToggle = (key, value) => {
    setDraft((prev) => {
      const values = new Set(toArray(prev[key]));
      if (values.has(value)) {
        values.delete(value);
      } else {
        values.add(value);
      }
      return { ...prev, [key]: Array.from(values) };
    });
  };

  const handleRemoteToggle = (value) => {
    setDraft((prev) => ({ ...prev, isRemote: value }));
  };

  const handleFreshnessChange = (value) => {
    setDraft((prev) => ({ ...prev, updatedWithin: value === 'any' ? null : value }));
  };

  const handleApply = () => {
    onApply(draft);
    onClose();
  };

  const handleReset = () => {
    setDraft(normaliseFilters(DEFAULT_FILTERS));
    onReset();
    onClose();
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-lg bg-white">
                  <div className="flex h-full flex-col overflow-y-auto bg-white shadow-xl">
                    <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
                      <div>
                        <Dialog.Title className="text-lg font-semibold text-slate-900">Refine results</Dialog.Title>
                        <p className="mt-1 text-sm text-slate-500">
                          Tailor the explorer to the roles, cohorts, and volunteers you care about.
                        </p>
                      </div>
                      <button
                        type="button"
                        className="rounded-full border border-transparent bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
                        onClick={onClose}
                      >
                        <span className="sr-only">Close panel</span>
                        <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </div>

                    <div className="flex-1 space-y-8 overflow-y-auto px-6 py-6">
                      {category === 'jobs' ? (
                        <section>
                          <h3 className="text-sm font-semibold text-slate-900">Employment type</h3>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {employmentTypeOptions.map((option) => (
                              <FilterPill
                                key={option.value}
                                active={draft.employmentTypes.includes(option.value)}
                                label={option.value}
                                count={option.count}
                                onClick={() => handleMultiToggle('employmentTypes', option.value)}
                              />
                            ))}
                          </div>
                        </section>
                      ) : null}

                      {category === 'gigs' ? (
                        <section>
                          <h3 className="text-sm font-semibold text-slate-900">Duration</h3>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {durationOptions.map((option) => (
                              <FilterPill
                                key={option.value}
                                active={draft.durationCategories.includes(option.value)}
                                label={option.value.replace('_', ' ')}
                                count={option.count}
                                onClick={() => handleMultiToggle('durationCategories', option.value)}
                              />
                            ))}
                          </div>
                        </section>
                      ) : null}

                      {locationOptions.length ? (
                        <section>
                          <h3 className="text-sm font-semibold text-slate-900">Cities</h3>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {locationOptions.map((option) => (
                              <FilterPill
                                key={option.value}
                                active={draft.locations.includes(option.value)}
                                label={option.value}
                                count={option.count}
                                onClick={() => handleMultiToggle('locations', option.value)}
                              />
                            ))}
                          </div>
                        </section>
                      ) : null}

                      {category === 'launchpad' && trackOptions.length ? (
                        <section>
                          <h3 className="text-sm font-semibold text-slate-900">Tracks</h3>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {trackOptions.map((option) => (
                              <FilterPill
                                key={option.value}
                                active={draft.tracks.includes(option.value)}
                                label={option.value}
                                count={option.count}
                                onClick={() => handleMultiToggle('tracks', option.value)}
                              />
                            ))}
                          </div>
                        </section>
                      ) : null}

                      {category === 'volunteering' && organizationOptions.length ? (
                        <section>
                          <h3 className="text-sm font-semibold text-slate-900">Organisations</h3>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {organizationOptions.map((option) => (
                              <FilterPill
                                key={option.value}
                                active={draft.organizations.includes(option.value)}
                                label={option.value}
                                count={option.count}
                                onClick={() => handleMultiToggle('organizations', option.value)}
                              />
                            ))}
                          </div>
                        </section>
                      ) : null}

                      {category === 'projects' && statusOptions.length ? (
                        <section>
                          <h3 className="text-sm font-semibold text-slate-900">Project status</h3>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {statusOptions.map((option) => (
                              <FilterPill
                                key={option.value}
                                active={draft.statuses.includes(option.value)}
                                label={option.value}
                                count={option.count}
                                onClick={() => handleMultiToggle('statuses', option.value)}
                              />
                            ))}
                          </div>
                        </section>
                      ) : null}

                      <section>
                        <h3 className="text-sm font-semibold text-slate-900">Remote availability</h3>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <FilterPill
                            active={draft.isRemote === true}
                            label="Remote"
                            onClick={() => handleRemoteToggle(draft.isRemote === true ? null : true)}
                          />
                          <FilterPill
                            active={draft.isRemote === false}
                            label="On-site"
                            onClick={() => handleRemoteToggle(draft.isRemote === false ? null : false)}
                          />
                          <FilterPill
                            active={draft.isRemote === null}
                            label="Any"
                            onClick={() => handleRemoteToggle(null)}
                          />
                        </div>
                      </section>
                      <section>
                        <h3 className="text-sm font-semibold text-slate-900">Freshness</h3>
                        <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-slate-600">
                          {FRESHNESS_OPTIONS.map((option) => (
                            <label
                              key={option.value}
                              className={`flex cursor-pointer items-center justify-between rounded-2xl border px-3 py-2 transition ${
                                draft.updatedWithin === (option.value === 'any' ? null : option.value)
                                  ? 'border-accent bg-accent/10 text-accent'
                                  : 'border-slate-200 hover:border-accent hover:text-accent'
                              }`}
                            >
                              <span>{option.label}</span>
                              <input
                                type="radio"
                                name="freshness"
                                className="sr-only"
                                checked={draft.updatedWithin === (option.value === 'any' ? null : option.value)}
                                onChange={() => handleFreshnessChange(option.value)}
                              />
                            </label>
                          ))}
                        </div>
                      </section>
                    </div>

                    <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={handleReset}
                          className="text-sm font-semibold text-slate-500 transition hover:text-slate-700"
                        >
                          Reset
                        </button>
                        <button
                          type="button"
                          onClick={handleApply}
                          className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark"
                        >
                          Apply filters
                        </button>
                      </div>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

ExplorerFilterDrawer.propTypes = {
  category: PropTypes.string.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  filters: PropTypes.object,
  facets: PropTypes.object,
  onApply: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
};

ExplorerFilterDrawer.defaultProps = {
  filters: DEFAULT_FILTERS,
  facets: null,
};
