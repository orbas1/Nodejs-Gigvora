import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useEffect, useState } from 'react';

const INITIAL_STATE = Object.freeze({
  name: '',
  tier: 'growth',
  status: 'active',
  healthStatus: 'healthy',
  industry: '',
  websiteUrl: '',
  primaryContactName: '',
  primaryContactEmail: '',
  accountManagerName: '',
  accountManagerEmail: '',
  annualContractValue: '',
  tags: '',
  notes: '',
});

export default function ClientEditorDrawer({ open, mode, initialClient, onSubmit, onClose }) {
  const [form, setForm] = useState(INITIAL_STATE);

  useEffect(() => {
    if (open) {
      setForm({
        name: initialClient?.name ?? '',
        tier: initialClient?.tier ?? 'growth',
        status: initialClient?.status ?? 'active',
        healthStatus: initialClient?.healthStatus ?? 'healthy',
        industry: initialClient?.industry ?? '',
        websiteUrl: initialClient?.websiteUrl ?? '',
        primaryContactName: initialClient?.primaryContactName ?? '',
        primaryContactEmail: initialClient?.primaryContactEmail ?? '',
        accountManagerName: initialClient?.accountManagerName ?? '',
        accountManagerEmail: initialClient?.accountManagerEmail ?? '',
        annualContractValue: initialClient?.annualContractValue ?? '',
        tags: Array.isArray(initialClient?.tags) ? initialClient.tags.join(', ') : '',
        notes: initialClient?.notes ?? '',
      });
    }
  }, [open, initialClient]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      name: form.name,
      tier: form.tier,
      status: form.status,
      healthStatus: form.healthStatus,
      industry: form.industry || null,
      websiteUrl: form.websiteUrl || null,
      primaryContactName: form.primaryContactName || null,
      primaryContactEmail: form.primaryContactEmail || null,
      accountManagerName: form.accountManagerName || null,
      accountManagerEmail: form.accountManagerEmail || null,
      annualContractValue: form.annualContractValue === '' ? null : Number(form.annualContractValue),
      tags: form.tags
        ? form.tags
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean)
        : null,
      notes: form.notes || null,
    };
    await onSubmit?.(payload);
  };

  return (
    <Transition show={open} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
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
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-6">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="translate-y-4 opacity-0"
              enterTo="translate-y-0 opacity-100"
              leave="ease-in duration-150"
              leaveFrom="translate-y-0 opacity-100"
              leaveTo="translate-y-4 opacity-0"
            >
              <Dialog.Panel className="w-full max-w-2xl space-y-6 rounded-3xl bg-white p-8 shadow-2xl">
                <div className="space-y-1">
                  <Dialog.Title className="text-xl font-semibold text-slate-900">
                    {mode === 'edit' ? 'Edit client' : 'New client'}
                  </Dialog.Title>
                  <p className="text-sm text-slate-500">Keep account details tidy for the team.</p>
                </div>
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-semibold text-slate-700" htmlFor="client-name">
                        Name
                      </label>
                      <input
                        id="client-name"
                        name="name"
                        required
                        value={form.name}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700" htmlFor="client-tier">
                        Tier
                      </label>
                      <select
                        id="client-tier"
                        name="tier"
                        value={form.tier}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      >
                        <option value="strategic">Strategic</option>
                        <option value="growth">Growth</option>
                        <option value="core">Core</option>
                        <option value="incubating">Incubating</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700" htmlFor="client-status">
                        Status
                      </label>
                      <select
                        id="client-status"
                        name="status"
                        value={form.status}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      >
                        <option value="active">Active</option>
                        <option value="onboarding">Onboarding</option>
                        <option value="paused">Paused</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700" htmlFor="client-health">
                        Health
                      </label>
                      <select
                        id="client-health"
                        name="healthStatus"
                        value={form.healthStatus}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      >
                        <option value="healthy">Healthy</option>
                        <option value="monitor">Monitor</option>
                        <option value="at_risk">At risk</option>
                      </select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-semibold text-slate-700" htmlFor="client-industry">
                        Industry
                      </label>
                      <input
                        id="client-industry"
                        name="industry"
                        value={form.industry}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-semibold text-slate-700" htmlFor="client-website">
                        Website
                      </label>
                      <input
                        id="client-website"
                        name="websiteUrl"
                        value={form.websiteUrl}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700" htmlFor="client-primary-name">
                        Primary contact
                      </label>
                      <input
                        id="client-primary-name"
                        name="primaryContactName"
                        value={form.primaryContactName}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700" htmlFor="client-primary-email">
                        Primary email
                      </label>
                      <input
                        id="client-primary-email"
                        name="primaryContactEmail"
                        value={form.primaryContactEmail}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700" htmlFor="client-manager-name">
                        Account manager
                      </label>
                      <input
                        id="client-manager-name"
                        name="accountManagerName"
                        value={form.accountManagerName}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700" htmlFor="client-manager-email">
                        Manager email
                      </label>
                      <input
                        id="client-manager-email"
                        name="accountManagerEmail"
                        value={form.accountManagerEmail}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700" htmlFor="client-acv">
                        Annual value
                      </label>
                      <input
                        id="client-acv"
                        name="annualContractValue"
                        type="number"
                        min="0"
                        value={form.annualContractValue}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-semibold text-slate-700" htmlFor="client-tags">
                        Tags
                      </label>
                      <input
                        id="client-tags"
                        name="tags"
                        value={form.tags}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-semibold text-slate-700" htmlFor="client-notes">
                        Notes
                      </label>
                      <textarea
                        id="client-notes"
                        name="notes"
                        value={form.notes}
                        onChange={handleChange}
                        rows={4}
                        className="w-full rounded-3xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      />
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accentDark"
                    >
                      Save
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

ClientEditorDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  mode: PropTypes.oneOf(['create', 'edit']).isRequired,
  initialClient: PropTypes.object,
  onSubmit: PropTypes.func,
  onClose: PropTypes.func,
};

ClientEditorDrawer.defaultProps = {
  initialClient: null,
};
