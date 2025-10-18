import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useEffect, useMemo, useState } from 'react';
import { parseTags, toDateInputValue } from './utils.js';

const STEPS = [
  { id: 'basics', label: 'Basics' },
  { id: 'timing', label: 'Timing' },
  { id: 'ownership', label: 'Ownership' },
];

const INITIAL_STATE = Object.freeze({
  columnId: '',
  title: '',
  clientId: '',
  clientMode: 'existing',
  clientName: '',
  clientTier: 'growth',
  clientStatus: 'active',
  clientHealth: 'healthy',
  projectName: '',
  summary: '',
  priority: 'medium',
  riskLevel: 'low',
  valueAmount: '',
  valueCurrency: 'USD',
  ownerName: '',
  ownerEmail: '',
  contactName: '',
  contactEmail: '',
  healthStatus: 'healthy',
  startDate: '',
  dueDate: '',
  lastInteractionAt: '',
  nextInteractionAt: '',
  tags: '',
  notes: '',
});

function Stepper({ currentStep }) {
  return (
    <ol className="flex items-center gap-3">
      {STEPS.map((step, index) => {
        const active = index === currentStep;
        const complete = index < currentStep;
        return (
          <li
            key={step.id}
            className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
              active
                ? 'bg-accent text-white'
                : complete
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            <span>{index + 1}</span>
            <span>{step.label}</span>
          </li>
        );
      })}
    </ol>
  );
}

Stepper.propTypes = {
  currentStep: PropTypes.number.isRequired,
};

export default function CardWizard({
  open,
  mode,
  initialCard,
  columns,
  clients,
  onSubmit,
  onClose,
}) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(INITIAL_STATE);

  useEffect(() => {
    if (open) {
      setStep(0);
      setForm({
        columnId: initialCard?.columnId ?? columns?.[0]?.id ?? '',
        title: initialCard?.title ?? '',
        clientId: initialCard?.clientId ?? '',
        clientMode: initialCard?.clientId ? 'existing' : 'new',
        clientName: initialCard?.client?.name ?? '',
        clientTier: initialCard?.client?.tier ?? 'growth',
        clientStatus: initialCard?.client?.status ?? 'active',
        clientHealth: initialCard?.client?.healthStatus ?? 'healthy',
        projectName: initialCard?.projectName ?? '',
        summary: initialCard?.summary ?? '',
        priority: initialCard?.priority ?? 'medium',
        riskLevel: initialCard?.riskLevel ?? 'low',
        valueAmount: initialCard?.valueAmount ?? '',
        valueCurrency: initialCard?.valueCurrency ?? 'USD',
        ownerName: initialCard?.ownerName ?? '',
        ownerEmail: initialCard?.ownerEmail ?? '',
        contactName: initialCard?.contactName ?? '',
        contactEmail: initialCard?.contactEmail ?? '',
        healthStatus: initialCard?.healthStatus ?? 'healthy',
        startDate: toDateInputValue(initialCard?.startDate),
        dueDate: toDateInputValue(initialCard?.dueDate),
        lastInteractionAt: toDateInputValue(initialCard?.lastInteractionAt),
        nextInteractionAt: toDateInputValue(initialCard?.nextInteractionAt),
        tags: initialCard?.tags?.join(', ') ?? '',
        notes: initialCard?.notes ?? '',
      });
    }
  }, [open, initialCard, columns]);

  const columnOptions = useMemo(() => columns ?? [], [columns]);
  const clientOptions = useMemo(() => clients ?? [], [clients]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const goNext = () => setStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  const goBack = () => setStep((prev) => Math.max(prev - 1, 0));

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      columnId: Number(form.columnId),
      title: form.title,
      clientId: form.clientMode === 'existing' ? Number(form.clientId) || null : null,
      projectName: form.projectName || null,
      summary: form.summary || null,
      priority: form.priority,
      riskLevel: form.riskLevel,
      valueAmount: form.valueAmount === '' ? null : Number(form.valueAmount),
      valueCurrency: form.valueCurrency,
      ownerName: form.ownerName || null,
      ownerEmail: form.ownerEmail || null,
      contactName: form.contactName || null,
      contactEmail: form.contactEmail || null,
      healthStatus: form.healthStatus,
      startDate: form.startDate || null,
      dueDate: form.dueDate || null,
      lastInteractionAt: form.lastInteractionAt || null,
      nextInteractionAt: form.nextInteractionAt || null,
      tags: parseTags(form.tags),
      notes: form.notes || null,
    };
    if (form.clientMode === 'new' && form.clientName) {
      payload.client = {
        name: form.clientName,
        tier: form.clientTier,
        status: form.clientStatus,
        healthStatus: form.clientHealth,
      };
    }
    await onSubmit?.(payload);
  };

  const isLastStep = step === STEPS.length - 1;

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
              <Dialog.Panel className="w-full max-w-3xl space-y-6 rounded-3xl bg-white p-8 shadow-2xl">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Dialog.Title className="text-xl font-semibold text-slate-900">
                      {mode === 'edit' ? 'Edit engagement' : 'New engagement'}
                    </Dialog.Title>
                    <p className="text-sm text-slate-500">Capture the essentials and assign the owner.</p>
                  </div>
                  <Stepper currentStep={step} />
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                  {step === 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700" htmlFor="card-column">
                          Column
                        </label>
                        <select
                          id="card-column"
                          name="columnId"
                          value={form.columnId}
                          onChange={handleChange}
                          className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                        >
                          {columnOptions.map((column) => (
                            <option key={column.id} value={column.id}>
                              {column.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700" htmlFor="card-title">
                          Title
                        </label>
                        <input
                          id="card-title"
                          name="title"
                          required
                          value={form.title}
                          onChange={handleChange}
                          className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700" htmlFor="card-client-mode">
                          Client type
                        </label>
                        <select
                          id="card-client-mode"
                          name="clientMode"
                          value={form.clientMode}
                          onChange={handleChange}
                          className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                        >
                          <option value="existing">Existing</option>
                          <option value="new">New</option>
                        </select>
                      </div>
                      {form.clientMode === 'existing' ? (
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-slate-700" htmlFor="card-client">
                            Client
                          </label>
                          <select
                            id="card-client"
                            name="clientId"
                            value={form.clientId}
                            onChange={handleChange}
                            className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                          >
                            <option value="">Select client</option>
                            {clientOptions.map((client) => (
                              <option key={client.id} value={client.id}>
                                {client.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-sm font-semibold text-slate-700" htmlFor="card-client-name">
                            Client name
                          </label>
                          <input
                            id="card-client-name"
                            name="clientName"
                            value={form.clientName}
                            onChange={handleChange}
                            className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                            placeholder="Acme Co"
                          />
                          <div className="grid gap-3 sm:grid-cols-3">
                            <div className="space-y-2">
                              <label className="text-xs font-semibold uppercase tracking-widest text-slate-500" htmlFor="card-client-tier">
                                Tier
                              </label>
                              <select
                                id="card-client-tier"
                                name="clientTier"
                                value={form.clientTier}
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
                              <label className="text-xs font-semibold uppercase tracking-widest text-slate-500" htmlFor="card-client-status">
                                Status
                              </label>
                              <select
                                id="card-client-status"
                                name="clientStatus"
                                value={form.clientStatus}
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
                              <label className="text-xs font-semibold uppercase tracking-widest text-slate-500" htmlFor="card-client-health">
                                Health
                              </label>
                              <select
                                id="card-client-health"
                                name="clientHealth"
                                value={form.clientHealth}
                                onChange={handleChange}
                                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                              >
                                <option value="healthy">Healthy</option>
                                <option value="monitor">Monitor</option>
                                <option value="at_risk">At risk</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-semibold text-slate-700" htmlFor="card-project">
                          Project
                        </label>
                        <input
                          id="card-project"
                          name="projectName"
                          value={form.projectName}
                          onChange={handleChange}
                          className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-semibold text-slate-700" htmlFor="card-summary">
                          Summary
                        </label>
                        <textarea
                          id="card-summary"
                          name="summary"
                          value={form.summary}
                          onChange={handleChange}
                          rows={3}
                          className="w-full rounded-3xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                        />
                      </div>
                    </div>
                  ) : null}

                  {step === 1 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700" htmlFor="card-value">
                          Value
                        </label>
                        <input
                          id="card-value"
                          name="valueAmount"
                          type="number"
                          min="0"
                          value={form.valueAmount}
                          onChange={handleChange}
                          className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700" htmlFor="card-currency">
                          Currency
                        </label>
                        <input
                          id="card-currency"
                          name="valueCurrency"
                          value={form.valueCurrency}
                          onChange={handleChange}
                          className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700" htmlFor="card-start">
                          Start
                        </label>
                        <input
                          id="card-start"
                          name="startDate"
                          type="date"
                          value={form.startDate}
                          onChange={handleChange}
                          className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700" htmlFor="card-due">
                          Due
                        </label>
                        <input
                          id="card-due"
                          name="dueDate"
                          type="date"
                          value={form.dueDate}
                          onChange={handleChange}
                          className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700" htmlFor="card-last">
                          Last touch
                        </label>
                        <input
                          id="card-last"
                          name="lastInteractionAt"
                          type="date"
                          value={form.lastInteractionAt}
                          onChange={handleChange}
                          className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700" htmlFor="card-next">
                          Next touch
                        </label>
                        <input
                          id="card-next"
                          name="nextInteractionAt"
                          type="date"
                          value={form.nextInteractionAt}
                          onChange={handleChange}
                          className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700" htmlFor="card-tags">
                          Tags
                        </label>
                        <input
                          id="card-tags"
                          name="tags"
                          value={form.tags}
                          onChange={handleChange}
                          className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                          placeholder="retainer, design"
                        />
                      </div>
                    </div>
                  ) : null}

                  {step === 2 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700" htmlFor="card-owner-name">
                          Owner name
                        </label>
                        <input
                          id="card-owner-name"
                          name="ownerName"
                          value={form.ownerName}
                          onChange={handleChange}
                          className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700" htmlFor="card-owner-email">
                          Owner email
                        </label>
                        <input
                          id="card-owner-email"
                          name="ownerEmail"
                          value={form.ownerEmail}
                          onChange={handleChange}
                          className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700" htmlFor="card-contact-name">
                          Client contact
                        </label>
                        <input
                          id="card-contact-name"
                          name="contactName"
                          value={form.contactName}
                          onChange={handleChange}
                          className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700" htmlFor="card-contact-email">
                          Contact email
                        </label>
                        <input
                          id="card-contact-email"
                          name="contactEmail"
                          value={form.contactEmail}
                          onChange={handleChange}
                          className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700" htmlFor="card-priority">
                          Priority
                        </label>
                        <select
                          id="card-priority"
                          name="priority"
                          value={form.priority}
                          onChange={handleChange}
                          className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="critical">Critical</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700" htmlFor="card-risk">
                          Risk
                        </label>
                        <select
                          id="card-risk"
                          name="riskLevel"
                          value={form.riskLevel}
                          onChange={handleChange}
                          className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700" htmlFor="card-health">
                          Health
                        </label>
                        <select
                          id="card-health"
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
                        <label className="text-sm font-semibold text-slate-700" htmlFor="card-notes">
                          Notes
                        </label>
                        <textarea
                          id="card-notes"
                          name="notes"
                          value={form.notes}
                          onChange={handleChange}
                          rows={4}
                          className="w-full rounded-3xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                        />
                      </div>
                    </div>
                  ) : null}

                  <div className="flex justify-between">
                    <button
                      type="button"
                      onClick={step === 0 ? onClose : goBack}
                      className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                    >
                      {step === 0 ? 'Cancel' : 'Back'}
                    </button>
                    <button
                      type={isLastStep ? 'submit' : 'button'}
                      onClick={isLastStep ? undefined : goNext}
                      className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accentDark"
                    >
                      {isLastStep ? 'Save' : 'Next'}
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

CardWizard.propTypes = {
  open: PropTypes.bool.isRequired,
  mode: PropTypes.oneOf(['create', 'edit']).isRequired,
  initialCard: PropTypes.object,
  columns: PropTypes.arrayOf(PropTypes.object),
  clients: PropTypes.arrayOf(PropTypes.object),
  onSubmit: PropTypes.func,
  onClose: PropTypes.func,
};

CardWizard.defaultProps = {
  initialCard: null,
  columns: [],
  clients: [],
};
