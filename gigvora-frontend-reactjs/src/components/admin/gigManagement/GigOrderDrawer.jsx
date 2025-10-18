import { Fragment, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

const STATUS_OPTIONS = [
  { value: 'requirements', label: 'Requirements' },
  { value: 'in_delivery', label: 'In delivery' },
  { value: 'in_revision', label: 'In revision' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const REQUIREMENT_STATUS = [
  { value: 'pending', label: 'Pending' },
  { value: 'received', label: 'Received' },
  { value: 'approved', label: 'Approved' },
];

const REVISION_STATUS = [
  { value: 'requested', label: 'Requested' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'approved', label: 'Approved' },
];

function generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 10);
}

function toDateInput(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toISOString().split('T')[0];
}

export default function GigOrderDrawer({ open, order, canManage, onClose, onSubmit }) {
  const [status, setStatus] = useState('requirements');
  const [progressPercent, setProgressPercent] = useState('0');
  const [dueAt, setDueAt] = useState('');
  const [metadataNotes, setMetadataNotes] = useState('');
  const [requirements, setRequirements] = useState([]);
  const [scorecard, setScorecard] = useState({
    overallScore: '',
    qualityScore: '',
    communicationScore: '',
    reliabilityScore: '',
    notes: '',
  });
  const [revisionSummary, setRevisionSummary] = useState('');
  const [revisionDueAt, setRevisionDueAt] = useState('');
  const [revisionStatus, setRevisionStatus] = useState('requested');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!order) return;
    setStatus(order.status ?? 'requirements');
    setProgressPercent(order.progressPercent != null ? String(order.progressPercent) : '0');
    setDueAt(toDateInput(order.dueAt));
    const metaNotes = order.metadata?.notes ?? order.metadataNotes ?? '';
    setMetadataNotes(metaNotes ?? '');
    setRequirements(
      (order.requirements ?? []).map((requirement) => ({
        id: requirement.id,
        title: requirement.title ?? '',
        status: requirement.status ?? 'pending',
        dueAt: toDateInput(requirement.dueAt),
        notes: requirement.notes ?? '',
        _remove: false,
        _key: `existing-${requirement.id}`,
      })),
    );
    setScorecard({
      overallScore: order.scorecard?.overallScore != null ? String(order.scorecard.overallScore) : '',
      qualityScore: order.scorecard?.qualityScore != null ? String(order.scorecard.qualityScore) : '',
      communicationScore:
        order.scorecard?.communicationScore != null ? String(order.scorecard.communicationScore) : '',
      reliabilityScore: order.scorecard?.reliabilityScore != null ? String(order.scorecard.reliabilityScore) : '',
      notes: order.scorecard?.notes ?? '',
    });
    setRevisionSummary('');
    setRevisionDueAt('');
    setRevisionStatus('requested');
  }, [order]);

  const handleRequirementChange = (key, field, value) => {
    setRequirements((previous) =>
      previous.map((requirement) => (requirement._key === key ? { ...requirement, [field]: value } : requirement)),
    );
  };

  const addRequirement = () => {
    const id = generateId();
    setRequirements((previous) => [
      ...previous,
      { id: null, title: '', status: 'pending', dueAt: '', notes: '', _remove: false, _key: id },
    ]);
  };

  const toggleRequirementRemoval = (key) => {
    setRequirements((previous) =>
      previous.map((requirement) =>
        requirement._key === key ? { ...requirement, _remove: !requirement._remove } : requirement,
      ),
    );
  };

  const removeUnsavedRequirement = (key) => {
    setRequirements((previous) => previous.filter((requirement) => requirement._key !== key));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!order) return;

    const requirementsPayload = requirements
      .filter((requirement) => !requirement._remove)
      .map((requirement) => ({
        id: requirement.id ?? undefined,
        title: requirement.title.trim(),
        status: requirement.status,
        dueAt: requirement.dueAt || null,
        notes: requirement.notes ? requirement.notes.trim() : null,
      }));

    const removeRequirementIds = requirements
      .filter((requirement) => requirement._remove && requirement.id)
      .map((requirement) => requirement.id);

    const scorePayload = {
      overallScore: scorecard.overallScore ? Number(scorecard.overallScore) : null,
      qualityScore: scorecard.qualityScore ? Number(scorecard.qualityScore) : null,
      communicationScore: scorecard.communicationScore ? Number(scorecard.communicationScore) : null,
      reliabilityScore: scorecard.reliabilityScore ? Number(scorecard.reliabilityScore) : null,
      notes: scorecard.notes || null,
    };

    const newRevisions = revisionSummary
      ? [
          {
            summary: revisionSummary,
            dueAt: revisionDueAt || null,
            status: revisionStatus,
          },
        ]
      : [];

    try {
      setSaving(true);
      await onSubmit(order.id, {
        status,
        progressPercent: progressPercent ? Number(progressPercent) : undefined,
        dueAt: dueAt || null,
        metadata: metadataNotes ? { notes: metadataNotes } : undefined,
        requirements: requirementsPayload,
        removeRequirementIds,
        scorecard: scorePayload,
        newRevisions,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Transition.Root show={open} as={Fragment}>
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
          <div className="fixed inset-0 bg-slate-900/40" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full justify-end">
            <Transition.Child
              as={Fragment}
              enter="transform transition ease-out duration-200"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="transform transition ease-in duration-150"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <Dialog.Panel className="h-full w-full max-w-3xl overflow-y-auto bg-white shadow-xl">
                <form onSubmit={handleSubmit} className="flex h-full flex-col">
                  <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                    <div>
                      <Dialog.Title className="text-lg font-semibold text-slate-900">{order?.orderNumber}</Dialog.Title>
                      <p className="text-xs uppercase tracking-wide text-slate-500">Vendor {order?.vendorName}</p>
                    </div>
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="flex-1 space-y-6 px-6 py-6">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Status
                        <select
                          value={status}
                          onChange={(event) => setStatus(event.target.value)}
                          disabled={!canManage || saving}
                          className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                        >
                          {STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Progress %
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={progressPercent}
                          onChange={(event) => setProgressPercent(event.target.value)}
                          disabled={!canManage || saving}
                          className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                        />
                      </label>
                      <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Due
                        <input
                          type="date"
                          value={dueAt}
                          onChange={(event) => setDueAt(event.target.value)}
                          disabled={!canManage || saving}
                          className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                        />
                      </label>
                    </div>

                    <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Notes
                      <textarea
                        value={metadataNotes}
                        onChange={(event) => setMetadataNotes(event.target.value)}
                        disabled={!canManage || saving}
                        rows={3}
                        className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                      />
                    </label>

                    <div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Requirements</p>
                        {canManage ? (
                          <button
                            type="button"
                            onClick={addRequirement}
                            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm"
                          >
                            <PlusIcon className="h-4 w-4" />
                            Add
                          </button>
                        ) : null}
                      </div>
                      <div className="mt-3 space-y-3">
                        {requirements.map((requirement) => (
                          <div key={requirement._key} className={`rounded-2xl border px-4 py-4 text-sm shadow-sm ${requirement._remove ? 'border-rose-300 bg-rose-50/70' : 'border-slate-200 bg-white/80'}`}>
                            <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr_auto]">
                              <input
                                value={requirement.title}
                                onChange={(event) => handleRequirementChange(requirement._key, 'title', event.target.value)}
                                disabled={!canManage || saving || requirement._remove}
                                placeholder="Requirement"
                                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                              />
                              <select
                                value={requirement.status}
                                onChange={(event) => handleRequirementChange(requirement._key, 'status', event.target.value)}
                                disabled={!canManage || saving || requirement._remove}
                                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                              >
                                {REQUIREMENT_STATUS.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                              <input
                                type="date"
                                value={requirement.dueAt}
                                onChange={(event) => handleRequirementChange(requirement._key, 'dueAt', event.target.value)}
                                disabled={!canManage || saving || requirement._remove}
                                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                              />
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    requirement.id
                                      ? toggleRequirementRemoval(requirement._key)
                                      : removeUnsavedRequirement(requirement._key)
                                  }
                                  disabled={!canManage || saving}
                                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide transition ${
                                    requirement._remove
                                      ? 'bg-emerald-100 text-emerald-600'
                                      : 'bg-rose-100 text-rose-600'
                                  }`}
                                >
                                  {requirement._remove ? 'Keep' : 'Remove'}
                                </button>
                              </div>
                            </div>
                            <textarea
                              value={requirement.notes}
                              onChange={(event) => handleRequirementChange(requirement._key, 'notes', event.target.value)}
                              disabled={!canManage || saving || requirement._remove}
                              rows={2}
                              placeholder="Notes"
                              className="mt-3 w-full rounded-2xl border border-slate-200 px-3 py-2 text-xs text-slate-600 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Overall
                        <input
                          type="number"
                          step="0.1"
                          value={scorecard.overallScore}
                          onChange={(event) => setScorecard((prev) => ({ ...prev, overallScore: event.target.value }))}
                          disabled={!canManage || saving}
                          className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                        />
                      </label>
                      <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Quality
                        <input
                          type="number"
                          step="0.1"
                          value={scorecard.qualityScore}
                          onChange={(event) => setScorecard((prev) => ({ ...prev, qualityScore: event.target.value }))}
                          disabled={!canManage || saving}
                          className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                        />
                      </label>
                      <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Communication
                        <input
                          type="number"
                          step="0.1"
                          value={scorecard.communicationScore}
                          onChange={(event) => setScorecard((prev) => ({ ...prev, communicationScore: event.target.value }))}
                          disabled={!canManage || saving}
                          className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                        />
                      </label>
                      <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Reliability
                        <input
                          type="number"
                          step="0.1"
                          value={scorecard.reliabilityScore}
                          onChange={(event) => setScorecard((prev) => ({ ...prev, reliabilityScore: event.target.value }))}
                          disabled={!canManage || saving}
                          className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                        />
                      </label>
                    </div>

                    <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Score notes
                      <textarea
                        value={scorecard.notes}
                        onChange={(event) => setScorecard((prev) => ({ ...prev, notes: event.target.value }))}
                        disabled={!canManage || saving}
                        rows={3}
                        className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                      />
                    </label>

                    <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">New revision</p>
                      <div className="mt-3 grid gap-3 sm:grid-cols-[2fr_1fr_1fr]">
                        <input
                          value={revisionSummary}
                          onChange={(event) => setRevisionSummary(event.target.value)}
                          disabled={!canManage || saving}
                          placeholder="Summary"
                          className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                        />
                        <input
                          type="date"
                          value={revisionDueAt}
                          onChange={(event) => setRevisionDueAt(event.target.value)}
                          disabled={!canManage || saving}
                          className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                        />
                        <select
                          value={revisionStatus}
                          onChange={(event) => setRevisionStatus(event.target.value)}
                          disabled={!canManage || saving}
                          className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                        >
                          {REVISION_STATUS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <p className="mt-2 text-[11px] uppercase tracking-wide text-slate-400">
                        Leave blank to skip creating a revision entry.
                      </p>
                    </div>

                    {order?.revisions?.length ? (
                      <div className="rounded-3xl border border-slate-200 bg-white/80 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Timeline</p>
                        <div className="mt-3 space-y-3">
                          {order.revisions.map((revision) => (
                            <div key={revision.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600">
                              <p className="font-semibold text-slate-900">Round {revision.roundNumber}</p>
                              <p className="mt-1">{revision.summary}</p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {revision.status ? (
                                  <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold uppercase tracking-wide text-[10px] text-slate-500">
                                    {revision.status.replace(/_/g, ' ')}
                                  </span>
                                ) : null}
                                {revision.dueAt ? (
                                  <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold uppercase tracking-wide text-[10px] text-slate-500">
                                    Due {new Date(revision.dueAt).toLocaleDateString()}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex justify-between border-t border-slate-200 px-6 py-5">
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-2xl px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700"
                    >
                      Close
                    </button>
                    {canManage ? (
                      <button
                        type="submit"
                        disabled={saving}
                        className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Save
                      </button>
                    ) : null}
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

GigOrderDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  order: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    orderNumber: PropTypes.string,
    vendorName: PropTypes.string,
    status: PropTypes.string,
    progressPercent: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    dueAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
    requirements: PropTypes.array,
    revisions: PropTypes.array,
    scorecard: PropTypes.object,
    metadata: PropTypes.object,
  }),
  canManage: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

GigOrderDrawer.defaultProps = {
  order: null,
  canManage: true,
};
