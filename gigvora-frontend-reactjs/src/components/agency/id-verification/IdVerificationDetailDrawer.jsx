import { Fragment } from 'react';
import { Dialog, Tab, Transition } from '@headlessui/react';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  XMarkIcon,
  DocumentTextIcon,
  ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/outline';
import { DEFAULT_NOTE_FORM, RISK_LABELS, STATUS_LABELS } from './constants.js';
import {
  classNames,
  formatDate,
  resolveName,
  toDateInputValue,
  toDateTimeInputValue,
} from './utils.js';

export default function IdVerificationDetailDrawer({
  open,
  onClose,
  verification,
  statusOptions,
  riskOptions,
  reviewers,
  detailForm,
  onDetailChange,
  onSubmit,
  busy,
  canManage,
  noteForm,
  onNoteChange,
  onNoteSubmit,
  noteBusy,
  onPreviewDocument,
}) {
  const reviewerDataListId = 'id-verification-reviewers';

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
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="w-full max-w-5xl overflow-hidden rounded-4xl bg-white shadow-2xl">
                <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                  <div>
                    <Dialog.Title className="text-lg font-semibold text-slate-900">
                      {verification?.fullName ?? 'Verification record'}
                    </Dialog.Title>
                    <p className="text-xs text-slate-500">
                      Member #{verification?.userId} · Profile #{verification?.profileId}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex items-center rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-accent/50 hover:text-accent"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </header>

                <Tab.Group>
                  <Tab.List className="flex gap-2 border-b border-slate-200 bg-slate-50 px-6 py-3">
                    {['Status', 'Files', 'Timeline'].map((label) => (
                      <Tab
                        key={label}
                        className={({ selected }) =>
                          classNames(
                            'rounded-full px-4 py-1 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-accent/30',
                            selected
                              ? 'bg-accent text-white shadow-soft'
                              : 'bg-white text-slate-600 hover:text-accent',
                          )
                        }
                      >
                        {label}
                      </Tab>
                    ))}
                  </Tab.List>

                  <Tab.Panels className="px-6 py-6">
                    <Tab.Panel className="space-y-6">
                      <form onSubmit={onSubmit} className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                          <SelectField
                            label="Status"
                            value={detailForm?.status ?? ''}
                            onChange={(event) => onDetailChange({ ...detailForm, status: event.target.value })}
                            options={statusOptions.map((status) => ({ value: status, label: STATUS_LABELS[status] ?? status }))}
                          />
                          <SelectField
                            label="Risk level"
                            value={detailForm?.riskLevel ?? 'low'}
                            onChange={(event) => onDetailChange({ ...detailForm, riskLevel: event.target.value })}
                            options={riskOptions.map((risk) => ({ value: risk, label: RISK_LABELS[risk] ?? risk }))}
                          />
                          <Field
                            label="Risk score"
                            type="number"
                            value={detailForm?.riskScore ?? ''}
                            onChange={(event) => onDetailChange({ ...detailForm, riskScore: event.target.value })}
                            min={0}
                            max={1000}
                          />
                          <Field
                            label="Assigned reviewer"
                            type="number"
                            list={reviewerDataListId}
                            value={detailForm?.assignedReviewerId ?? ''}
                            onChange={(event) => onDetailChange({ ...detailForm, assignedReviewerId: event.target.value })}
                          />
                          <Field
                            label="Reviewer"
                            type="number"
                            list={reviewerDataListId}
                            value={detailForm?.reviewerId ?? ''}
                            onChange={(event) => onDetailChange({ ...detailForm, reviewerId: event.target.value })}
                          />
                          <Field
                            label="Next review"
                            type="date"
                            value={toDateInputValue(detailForm?.nextReviewAt)}
                            onChange={(event) => onDetailChange({ ...detailForm, nextReviewAt: event.target.value })}
                          />
                          <Field
                            label="Reverify every (days)"
                            type="number"
                            min={1}
                            value={detailForm?.reverificationIntervalDays ?? ''}
                            onChange={(event) =>
                              onDetailChange({ ...detailForm, reverificationIntervalDays: event.target.value })
                            }
                          />
                          <Field
                            label="Reminder sent"
                            type="datetime-local"
                            value={toDateTimeInputValue(detailForm?.lastReminderSentAt)}
                            onChange={(event) => onDetailChange({ ...detailForm, lastReminderSentAt: event.target.value })}
                          />
                          <Field
                            label="Escalated at"
                            type="datetime-local"
                            value={toDateTimeInputValue(detailForm?.escalatedAt)}
                            onChange={(event) => onDetailChange({ ...detailForm, escalatedAt: event.target.value })}
                          />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <ToggleField
                            label="Manual review"
                            checked={detailForm?.requiresManualReview ?? false}
                            onChange={(event) => onDetailChange({ ...detailForm, requiresManualReview: event.target.checked })}
                          />
                          <ToggleField
                            label="Reverify"
                            checked={detailForm?.requiresReverification ?? false}
                            onChange={(event) =>
                              onDetailChange({ ...detailForm, requiresReverification: event.target.checked })
                            }
                          />
                        </div>

                        <Field
                          label="Review notes"
                          as="textarea"
                          rows={4}
                          value={detailForm?.reviewNotes ?? ''}
                          onChange={(event) => onDetailChange({ ...detailForm, reviewNotes: event.target.value })}
                        />
                        <Field
                          label="Assignment notes"
                          as="textarea"
                          rows={3}
                          value={detailForm?.assignmentNotes ?? ''}
                          onChange={(event) => onDetailChange({ ...detailForm, assignmentNotes: event.target.value })}
                        />
                        <Field
                          label="Decline reason"
                          as="textarea"
                          rows={3}
                          value={detailForm?.declinedReason ?? ''}
                          onChange={(event) => onDetailChange({ ...detailForm, declinedReason: event.target.value })}
                        />
                        <Field
                          label="Tags"
                          placeholder="high_value,priority"
                          value={detailForm?.tags ?? ''}
                          onChange={(event) => onDetailChange({ ...detailForm, tags: event.target.value })}
                        />
                        <Field
                          label="Auto reverify channel"
                          value={detailForm?.autoReverificationChannel ?? ''}
                          onChange={(event) => onDetailChange({ ...detailForm, autoReverificationChannel: event.target.value })}
                        />
                        <Field
                          label="Escalation state"
                          value={detailForm?.escalationState ?? ''}
                          onChange={(event) => onDetailChange({ ...detailForm, escalationState: event.target.value })}
                        />

                        {canManage ? (
                          <div className="flex justify-end">
                            <button
                              type="submit"
                              disabled={busy}
                              className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark disabled:opacity-60"
                            >
                              {busy ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <CheckCircleIcon className="h-5 w-5" />}
                              Save
                            </button>
                          </div>
                        ) : null}
                      </form>
                    </Tab.Panel>

                    <Tab.Panel className="space-y-4">
                      <div className="rounded-3xl border border-slate-200 bg-slate-50/60 p-4">
                        <h3 className="text-sm font-semibold text-slate-900">Identity files</h3>
                        <dl className="mt-3 space-y-3 text-sm text-slate-600">
                          <DocRow label="Document front" value={verification?.documentFrontKey} onPreview={onPreviewDocument} />
                          <DocRow label="Document back" value={verification?.documentBackKey} onPreview={onPreviewDocument} />
                          <DocRow label="Selfie" value={verification?.selfieKey} onPreview={onPreviewDocument} />
                        </dl>
                      </div>
                      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-soft">
                        <h3 className="text-sm font-semibold text-slate-900">Member</h3>
                        <dl className="mt-3 grid gap-3 text-sm text-slate-600 md:grid-cols-2">
                          <div>
                            <dt className="text-xs uppercase tracking-[0.28em] text-slate-500">ID type</dt>
                            <dd>{verification?.typeOfId ?? '—'}</dd>
                          </div>
                          <div>
                            <dt className="text-xs uppercase tracking-[0.28em] text-slate-500">Country</dt>
                            <dd>{verification?.issuingCountry ?? '—'}</dd>
                          </div>
                          <div>
                            <dt className="text-xs uppercase tracking-[0.28em] text-slate-500">Issued</dt>
                            <dd>{formatDate(verification?.issuedAt)}</dd>
                          </div>
                          <div>
                            <dt className="text-xs uppercase tracking-[0.28em] text-slate-500">Expires</dt>
                            <dd>{formatDate(verification?.expiresAt)}</dd>
                          </div>
                        </dl>
                      </div>
                    </Tab.Panel>

                    <Tab.Panel className="space-y-4">
                      <form onSubmit={onNoteSubmit} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-soft">
                        <h3 className="text-sm font-semibold text-slate-900">Add event</h3>
                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                          <SelectField
                            label="Type"
                            value={noteForm.eventType}
                            onChange={(event) => onNoteChange({ ...noteForm, eventType: event.target.value })}
                            options={eventTypes}
                          />
                          <SelectField
                            label="Risk"
                            value={noteForm.riskLevel}
                            onChange={(event) => onNoteChange({ ...noteForm, riskLevel: event.target.value })}
                            options={[{ value: '', label: 'No change' }].concat(
                              riskOptions.map((risk) => ({ value: risk, label: RISK_LABELS[risk] ?? risk })),
                            )}
                          />
                          <SelectField
                            label="Status"
                            value={noteForm.toStatus}
                            onChange={(event) => onNoteChange({ ...noteForm, toStatus: event.target.value })}
                            options={[{ value: '', label: 'No change' }].concat(
                              statusOptions.map((status) => ({ value: status, label: STATUS_LABELS[status] ?? status })),
                            )}
                          />
                          <Field
                            label="Attachments"
                            value={noteForm.attachments}
                            onChange={(event) => onNoteChange({ ...noteForm, attachments: event.target.value })}
                            placeholder="key1,key2"
                          />
                        </div>
                        <Field
                          label="Notes"
                          as="textarea"
                          rows={3}
                          value={noteForm.notes}
                          onChange={(event) => onNoteChange({ ...noteForm, notes: event.target.value })}
                        />
                        {canManage ? (
                          <div className="flex justify-end">
                            <button
                              type="submit"
                              disabled={noteBusy}
                              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent/50 hover:text-accent disabled:opacity-50"
                            >
                              {noteBusy ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <CheckCircleIcon className="h-5 w-5" />}
                              Log event
                            </button>
                          </div>
                        ) : null}
                      </form>

                      <div className="max-h-80 overflow-y-auto rounded-3xl border border-slate-200 bg-white p-4 shadow-inner">
                        <h3 className="text-sm font-semibold text-slate-900">Timeline</h3>
                        <ul className="mt-3 space-y-4 text-sm text-slate-600">
                          {(verification?.events ?? []).map((event) => (
                            <li key={event.id} className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
                              <div className="flex items-center justify-between text-xs text-slate-500">
                                <span className="font-semibold uppercase tracking-[0.2em] text-slate-500">
                                  {event.eventType.replace('_', ' ')}
                                </span>
                                <span>{formatDate(event.createdAt)}</span>
                              </div>
                              <p className="mt-1 text-sm text-slate-700">{event.notes || 'No notes provided.'}</p>
                              <div className="mt-1 text-xs text-slate-500">{event.actor ? `by ${resolveName(event.actor)}` : 'system'}</div>
                            </li>
                          ))}
                          {!verification?.events?.length ? (
                            <li className="text-xs text-slate-500">No timeline events recorded yet.</li>
                          ) : null}
                        </ul>
                      </div>
                    </Tab.Panel>
                  </Tab.Panels>
                </Tab.Group>

                <datalist id={reviewerDataListId}>
                  {reviewers.map((reviewer) => (
                    <option key={reviewer.id} value={reviewer.id}>
                      {resolveName(reviewer)}
                    </option>
                  ))}
                </datalist>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

const eventTypes = [
  { value: 'note', label: 'Analyst note' },
  { value: 'status_change', label: 'Status change' },
  { value: 'assignment', label: 'Assignment' },
  { value: 'reminder', label: 'Reminder' },
  { value: 'document', label: 'Document' },
];

function Field({ label, as = 'input', ...rest }) {
  const Component = as;
  return (
    <label className="space-y-2 text-sm text-slate-700">
      <span className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">{label}</span>
      <Component
        {...rest}
        className={classNames(
          'w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none',
          as === 'textarea' ? 'min-h-[120px]' : '',
        )}
      />
    </label>
  );
}

function ToggleField({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
      />
    </label>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="space-y-2 text-sm text-slate-700">
      <span className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">{label}</span>
      <select
        value={value}
        onChange={onChange}
        className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function DocRow({ label, value, onPreview }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
      <div className="flex items-center gap-2">
        <DocumentTextIcon className="h-5 w-5 text-slate-400" />
        <div>
          <p className="font-semibold text-slate-900">{label}</p>
          <p className="text-xs text-slate-500">{value ?? 'Not uploaded'}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onPreview(value)}
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-accent/50 hover:text-accent"
      >
        <ClipboardDocumentCheckIcon className="h-4 w-4" />
        Open
      </button>
    </div>
  );
}

IdVerificationDetailDrawer.defaultProps = {
  noteForm: DEFAULT_NOTE_FORM,
};
