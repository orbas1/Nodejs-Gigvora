import { Fragment, useEffect, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ArrowPathIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';

function normalizeOptions(values = [], { labelTransform } = {}) {
  const transform = typeof labelTransform === 'function' ? labelTransform : (value) => value;
  return values.map((value) => ({
    value,
    label: transform(value),
  }));
}

const DEFAULT_STATUS_OPTIONS = ['invited', 'active', 'suspended', 'archived'];
const DEFAULT_MEMBERSHIP_OPTIONS = ['user', 'freelancer', 'agency', 'company', 'headhunter', 'mentor', 'admin'];

export default function DirectoryFilters({
  open,
  onClose,
  filters,
  metadata,
  onChange,
  onRefresh,
  loading,
}) {
  const [draft, setDraft] = useState(() => buildDraft(filters));

  useEffect(() => {
    if (open) {
      setDraft(buildDraft(filters));
    }
  }, [filters, open]);

  const statusOptions = useMemo(() => {
    const values = Array.isArray(metadata?.statuses) && metadata.statuses.length
      ? metadata.statuses
      : DEFAULT_STATUS_OPTIONS;
    return normalizeOptions(values, {
      labelTransform: (value) => value.replace(/[_-]/g, ' ').replace(/^./, (letter) => letter.toUpperCase()),
    });
  }, [metadata?.statuses]);

  const roleOptions = useMemo(() => {
    if (!Array.isArray(metadata?.roles) || metadata.roles.length === 0) {
      return [];
    }
    return normalizeOptions(metadata.roles, {
      labelTransform: (value) => value.replace(/[_-]/g, ' ').replace(/^./, (letter) => letter.toUpperCase()),
    });
  }, [metadata?.roles]);

  const membershipOptions = useMemo(() => {
    const values = Array.isArray(metadata?.memberships) && metadata.memberships.length
      ? metadata.memberships
      : DEFAULT_MEMBERSHIP_OPTIONS;
    return normalizeOptions(values, {
      labelTransform: (value) => value.replace(/[_-]/g, ' ').replace(/^./, (letter) => letter.toUpperCase()),
    });
  }, [metadata?.memberships]);

  const handleApply = (event) => {
    event?.preventDefault();
    onChange?.({
      limit: filters.limit,
      offset: 0,
      status: draft.status || undefined,
      role: draft.role || undefined,
      membership: draft.membership || undefined,
    });
    onClose?.();
  };

  const handleReset = () => {
    setDraft({ status: '', role: '', membership: '' });
    onChange?.({ limit: filters.limit, offset: 0 });
    onClose?.();
  };

  const handleRefresh = () => {
    onRefresh?.();
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-30" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40" />
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
              <Dialog.Panel className="w-screen max-w-md">
                <form onSubmit={handleApply} className="flex h-full flex-col bg-white shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                    <div className="flex items-center gap-3 text-sm font-semibold text-slate-900">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white">
                        <FunnelIcon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      Filters
                    </div>
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                    >
                      <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>

                  <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
                    <fieldset className="space-y-3">
                      <legend className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</legend>
                      <select
                        value={draft.status}
                        onChange={(event) => setDraft((prev) => ({ ...prev, status: event.target.value }))}
                        className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                      >
                        <option value="">Any</option>
                        {statusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </fieldset>

                    <fieldset className="space-y-3">
                      <legend className="text-xs font-semibold uppercase tracking-wide text-slate-500">Account</legend>
                      <select
                        value={draft.membership}
                        onChange={(event) => setDraft((prev) => ({ ...prev, membership: event.target.value }))}
                        className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                      >
                        <option value="">Any</option>
                        {membershipOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </fieldset>

                    {roleOptions.length > 0 && (
                      <fieldset className="space-y-3">
                        <legend className="text-xs font-semibold uppercase tracking-wide text-slate-500">Role</legend>
                        <select
                          value={draft.role}
                          onChange={(event) => setDraft((prev) => ({ ...prev, role: event.target.value }))}
                          className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                        >
                          <option value="">Any</option>
                          {roleOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </fieldset>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-6 py-4">
                    <button
                      type="button"
                      onClick={handleReset}
                      className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:border-slate-300 hover:text-slate-800"
                    >
                      Clear
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleRefresh}
                        disabled={loading}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:border-slate-300 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
                        Refresh
                      </button>
                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

function buildDraft(filters) {
  return {
    status: filters.status ?? '',
    role: filters.role ?? '',
    membership: filters.membership ?? '',
  };
}

