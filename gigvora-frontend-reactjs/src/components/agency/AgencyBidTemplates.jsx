import { Fragment, useEffect, useMemo, useState } from 'react';
import { Dialog, Transition, Switch } from '@headlessui/react';
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowTopRightOnSquareIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

function normaliseList(value) {
  if (Array.isArray(value)) {
    return value;
  }
  if (!value) return [];
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

const STATUS_OPTIONS = [
  { id: 'active', label: 'Active' },
  { id: 'paused', label: 'Paused' },
  { id: 'archived', label: 'Archived' },
];

function TemplateEditorDialog({ open, onClose, onSubmit, template, busy }) {
  const buildState = (source) => ({
    name: source?.name ?? '',
    description: source?.description ?? '',
    status: source?.status ?? 'active',
    markupPercent: source?.markupPercent ?? 20,
    bidCeiling: source?.bidCeiling ?? '',
    responseSlaHours: source?.responseSlaHours ?? 12,
    deliveryWindowDays: source?.deliveryWindowDays ?? 14,
    targetRoles: normaliseList(source?.targetRoles ?? []),
    scopeKeywords: normaliseList(source?.scopeKeywords ?? []),
    requireHumanReview: source?.guardrails?.requireHumanReview ?? false,
    notifyOwner: source?.guardrails?.notifyOwner ?? true,
    attachments: normaliseList(source?.attachments ?? []),
  });

  const [formState, setFormState] = useState(() => buildState(template));

  useEffect(() => {
    setFormState(buildState(template));
  }, [template]);

  const resetState = () => {
    setFormState(buildState(template));
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      name: formState.name.trim(),
      description: formState.description.trim() || null,
      status: formState.status,
      markupPercent: Number(formState.markupPercent),
      bidCeiling: formState.bidCeiling === '' ? null : Number(formState.bidCeiling),
      responseSlaHours: Number(formState.responseSlaHours),
      deliveryWindowDays: Number(formState.deliveryWindowDays),
      targetRoles: formState.targetRoles,
      scopeKeywords: formState.scopeKeywords,
      guardrails: {
        requireHumanReview: formState.requireHumanReview,
        notifyOwner: formState.notifyOwner,
      },
      attachments: formState.attachments,
    };
    await onSubmit(payload);
    resetState();
  };

  const handleCommaSeparatedChange = (key, value) => {
    setFormState((previous) => ({ ...previous, [key]: value.split(',').map((item) => item.trim()).filter(Boolean) }));
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={busy ? () => {} : handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center px-4 py-8 sm:items-center sm:p-6">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-4xl bg-white p-6 shadow-2xl transition-all">
                <Dialog.Title className="text-lg font-semibold text-slate-900">
                  {template ? 'Edit template' : 'New template'}
                </Dialog.Title>
                <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label htmlFor="template-name" className="text-sm font-medium text-slate-700">
                        Name
                      </label>
                      <input
                        id="template-name"
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-inner focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        value={formState.name}
                        onChange={(event) => setFormState((previous) => ({ ...previous, name: event.target.value }))}
                        required
                        disabled={busy}
                      />
                    </div>
                    <div>
                      <label htmlFor="template-status" className="text-sm font-medium text-slate-700">
                        Status
                      </label>
                      <select
                        id="template-status"
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-inner focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        value={formState.status}
                        onChange={(event) => setFormState((previous) => ({ ...previous, status: event.target.value }))}
                        disabled={busy}
                      >
                        {STATUS_OPTIONS.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="template-description" className="text-sm font-medium text-slate-700">
                      Summary
                    </label>
                    <textarea
                      id="template-description"
                      rows={3}
                      className="mt-2 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-inner focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      value={formState.description}
                      onChange={(event) => setFormState((previous) => ({ ...previous, description: event.target.value }))}
                      disabled={busy}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <label htmlFor="template-markup" className="text-sm font-medium text-slate-700">
                        Markup (%)
                      </label>
                      <input
                        id="template-markup"
                        type="number"
                        min="0"
                        step="0.5"
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-inner focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        value={formState.markupPercent}
                        onChange={(event) => setFormState((previous) => ({ ...previous, markupPercent: event.target.value }))}
                        disabled={busy}
                      />
                    </div>
                    <div>
                      <label htmlFor="template-response-sla" className="text-sm font-medium text-slate-700">
                        Response SLA (hours)
                      </label>
                      <input
                        id="template-response-sla"
                        type="number"
                        min="1"
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-inner focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        value={formState.responseSlaHours}
                        onChange={(event) => setFormState((previous) => ({ ...previous, responseSlaHours: event.target.value }))}
                        disabled={busy}
                      />
                    </div>
                    <div>
                      <label htmlFor="template-delivery-window" className="text-sm font-medium text-slate-700">
                        Delivery window (days)
                      </label>
                      <input
                        id="template-delivery-window"
                        type="number"
                        min="1"
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-inner focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        value={formState.deliveryWindowDays}
                        onChange={(event) => setFormState((previous) => ({ ...previous, deliveryWindowDays: event.target.value }))}
                        disabled={busy}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label htmlFor="template-bid-ceiling" className="text-sm font-medium text-slate-700">
                        Bid ceiling ($)
                      </label>
                      <input
                        id="template-bid-ceiling"
                        type="number"
                        min="0"
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-inner focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        value={formState.bidCeiling}
                        onChange={(event) => setFormState((previous) => ({ ...previous, bidCeiling: event.target.value }))}
                        disabled={busy}
                      />
                    </div>
                    <div>
                      <label htmlFor="template-attachments" className="text-sm font-medium text-slate-700">
                        Attachments (comma separated)
                      </label>
                      <input
                        id="template-attachments"
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-inner focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        value={formState.attachments.join(', ')}
                        onChange={(event) => handleCommaSeparatedChange('attachments', event.target.value)}
                        disabled={busy}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label htmlFor="template-target-roles" className="text-sm font-medium text-slate-700">
                        Target roles (comma separated)
                      </label>
                      <input
                        id="template-target-roles"
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-inner focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        value={formState.targetRoles.join(', ')}
                        onChange={(event) => handleCommaSeparatedChange('targetRoles', event.target.value)}
                        disabled={busy}
                      />
                    </div>
                    <div>
                      <label htmlFor="template-scope-keywords" className="text-sm font-medium text-slate-700">
                        Scope keywords (comma separated)
                      </label>
                      <input
                        id="template-scope-keywords"
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-inner focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        value={formState.scopeKeywords.join(', ')}
                        onChange={(event) => handleCommaSeparatedChange('scopeKeywords', event.target.value)}
                        disabled={busy}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
                      <span>Require human review before sending</span>
                      <Switch
                        checked={formState.requireHumanReview}
                        onChange={(value) => setFormState((previous) => ({ ...previous, requireHumanReview: value }))}
                        className={classNames(
                          formState.requireHumanReview ? 'bg-blue-600' : 'bg-slate-200',
                          'relative inline-flex h-5 w-10 items-center rounded-full transition',
                          busy ? 'opacity-60' : 'cursor-pointer',
                        )}
                        disabled={busy}
                      >
                        <span
                          className={classNames(
                            formState.requireHumanReview ? 'translate-x-5' : 'translate-x-1',
                            'inline-block h-4 w-4 transform rounded-full bg-white transition',
                          )}
                        />
                      </Switch>
                    </label>
                    <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
                      <span>Notify owner when submitted</span>
                      <Switch
                        checked={formState.notifyOwner}
                        onChange={(value) => setFormState((previous) => ({ ...previous, notifyOwner: value }))}
                        className={classNames(
                          formState.notifyOwner ? 'bg-blue-600' : 'bg-slate-200',
                          'relative inline-flex h-5 w-10 items-center rounded-full transition',
                          busy ? 'opacity-60' : 'cursor-pointer',
                        )}
                        disabled={busy}
                      >
                        <span
                          className={classNames(
                            formState.notifyOwner ? 'translate-x-5' : 'translate-x-1',
                            'inline-block h-4 w-4 transform rounded-full bg-white transition',
                          )}
                        />
                      </Switch>
                    </label>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
                      disabled={busy}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={busy}
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
    </Transition.Root>
  );
}

export default function AgencyBidTemplates({ templates = [], disabled, busy, onCreate, onUpdate, onDelete }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);

  const sortedTemplates = useMemo(
    () =>
      [...templates].sort((a, b) => {
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
      }),
    [templates],
  );

  const handleCreate = () => {
    setEditingTemplate(null);
    setDialogOpen(true);
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setDialogOpen(true);
  };

  const handleDelete = (template) => {
    if (!onDelete) return;
    const confirmed = window.confirm(`Remove template “${template.name}”? This cannot be undone.`);
    if (!confirmed) return;
    onDelete(template.id);
  };

  const handleSubmit = async (payload) => {
    if (editingTemplate) {
      await onUpdate?.(editingTemplate.id, payload);
    } else {
      await onCreate?.(payload);
    }
    setDialogOpen(false);
    setEditingTemplate(null);
  };

  const handleOpenBoard = (template) => {
    window.open(`/dashboard/agency?aiTemplate=${template.id}`, '_blank', 'noopener');
  };

  return (
    <section id="ai-templates" className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
          <ClipboardDocumentListIcon className="h-6 w-6" aria-hidden="true" />
        </span>
        <h3 className="text-lg font-semibold text-slate-900">Bid templates</h3>
      </div>
        <button
          type="button"
          onClick={handleCreate}
          className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={disabled || busy}
        >
          <PlusIcon className="h-4 w-4" aria-hidden="true" />
          New template
        </button>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Template
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Markup
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                SLA
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {sortedTemplates.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-500">No templates yet.</td>
              </tr>
            ) : (
              sortedTemplates.map((template) => (
                <tr key={template.id} className="transition hover:bg-slate-50">
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-900">{template.name}</p>
                      <p className="text-xs text-slate-500">{template.description || '—'}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">{template.markupPercent ?? '—'}%</td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    {template.responseSlaHours ?? '—'}h · {template.deliveryWindowDays ?? '—'}d
                  </td>
                  <td className="px-4 py-4 text-sm">
                    <span
                      className={classNames(
                        'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold',
                        template.status === 'active'
                          ? 'bg-emerald-100 text-emerald-700'
                          : template.status === 'paused'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-600',
                      )}
                    >
                      {template.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenBoard(template)}
                        className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-700"
                      >
                        <ArrowTopRightOnSquareIcon className="h-4 w-4" aria-hidden="true" />
                        Board
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEdit(template)}
                        className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={disabled || busy}
                      >
                        <PencilSquareIcon className="h-4 w-4" aria-hidden="true" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(template)}
                        className="inline-flex items-center gap-1 rounded-full border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={disabled || busy}
                      >
                        <TrashIcon className="h-4 w-4" aria-hidden="true" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <TemplateEditorDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingTemplate(null);
        }}
        onSubmit={handleSubmit}
        template={editingTemplate}
        busy={busy}
      />
    </section>
  );
}
