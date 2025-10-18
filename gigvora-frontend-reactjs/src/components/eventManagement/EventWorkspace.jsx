import { Dialog, Transition } from '@headlessui/react';
import {
  ArrowDownTrayIcon,
  CalendarDaysIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
  UsersIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { Fragment, useEffect, useMemo, useState } from 'react';
import {
  buildAgendaPayload,
  buildAssetPayload,
  buildBudgetPayload,
  buildChecklistPayload,
  buildGuestPayload,
  buildTaskPayload,
} from './eventPayloads.js';

const tabs = ['Plan', 'Guests', 'Tasks', 'Budget', 'Files', 'Checklist'];
const taskStatuses = ['todo', 'in_progress', 'blocked', 'done'];
const taskPriorities = ['low', 'medium', 'high', 'critical'];
const guestStatuses = ['invited', 'confirmed', 'waitlisted', 'declined', 'checked_in'];
const budgetStatuses = ['planned', 'committed', 'invoiced', 'paid', 'cancelled'];
const assetTypes = ['image', 'document', 'presentation', 'video', 'link'];
const assetVisibilities = ['internal', 'shared', 'public'];

const statusTones = {
  draft: 'bg-slate-100 text-slate-600',
  planned: 'bg-blue-50 text-blue-700',
  registration_open: 'bg-emerald-50 text-emerald-700',
  in_progress: 'bg-indigo-50 text-indigo-700',
  completed: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-rose-50 text-rose-700',
  todo: 'bg-slate-100 text-slate-700',
  in_progress_task: 'bg-blue-50 text-blue-700',
  blocked: 'bg-amber-50 text-amber-700',
  done: 'bg-emerald-50 text-emerald-700',
  invited: 'bg-slate-100 text-slate-700',
  confirmed: 'bg-emerald-50 text-emerald-700',
  waitlisted: 'bg-amber-50 text-amber-700',
  declined: 'bg-rose-50 text-rose-700',
  checked_in: 'bg-indigo-50 text-indigo-700',
};

function formatDateTime(value) {
  if (!value) return 'Not set';
  try {
    return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
  } catch (error) {
    return value;
  }
}

function formatDate(value) {
  if (!value) return '';
  try {
    return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' }).format(new Date(value));
  } catch (error) {
    return value;
  }
}

function formatLabel(value) {
  if (!value) return '';
  return value
    .toString()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function Badge({ value }) {
  if (!value) return null;
  const tone = statusTones[value] ?? statusTones[`${value}_task`] ?? 'bg-slate-100 text-slate-700';
  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ${tone}`}>{formatLabel(value)}</span>;
}

function SectionHeader({ title, action, secondaryAction }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <div className="flex items-center gap-2">
        {secondaryAction}
        {action}
      </div>
    </div>
  );
}

function EmptyState({ label, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 py-12">
      <p className="text-base font-semibold text-slate-900">{label}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

function PrimaryButton({ children, ...props }) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
      {...props}
    >
      {children}
    </button>
  );
}

function SecondaryButton({ children, ...props }) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 disabled:cursor-not-allowed"
      {...props}
    >
      {children}
    </button>
  );
}

function MutedButton({ children, ...props }) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold text-slate-500 hover:text-slate-700"
      {...props}
    >
      {children}
    </button>
  );
}

function TaskColumn({ label, tasks, onEdit, onDelete, canManage }) {
  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">{label}</h4>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500">{tasks.length}</span>
      </div>
      <div className="flex flex-col gap-3">
        {tasks.map((task) => (
          <div key={task.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{task.title}</p>
                <p className="text-xs text-slate-500">Due {formatDate(task.dueAt)}</p>
              </div>
              <Badge value={task.priority} />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
              <span>{task.ownerName ?? 'Unassigned'}</span>
              {canManage ? (
                <div className="flex items-center gap-2">
                  <MutedButton onClick={() => onEdit(task)}>Edit</MutedButton>
                  <MutedButton onClick={() => onDelete(task)}>Remove</MutedButton>
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
      {label}
      {children}
    </label>
  );
}

function FormContainer({ onSubmit, title, children, submitLabel, onCancel, busy }) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      {children}
      <div className="mt-4 flex items-center gap-3">
        <PrimaryButton type="submit" disabled={busy}>
          {busy ? 'Saving…' : submitLabel}
        </PrimaryButton>
        <SecondaryButton type="button" onClick={onCancel} disabled={busy}>
          Cancel
        </SecondaryButton>
      </div>
    </form>
  );
}

export default function EventWorkspace({
  open,
  event,
  onClose,
  onEdit,
  onDelete,
  mutateEvent,
  taskApi,
  guestApi,
  budgetApi,
  agendaApi,
  assetApi,
  checklistApi,
  canManage,
  workspaceSettings = null,
}) {
  const [activeTab, setActiveTab] = useState('Plan');
  const [formState, setFormState] = useState({ open: false, entity: null, mode: 'create', initialValues: {} });
  const [confirmState, setConfirmState] = useState({ open: false, title: '', description: '', actionLabel: 'Remove', onConfirm: null });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setActiveTab('Plan');
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      setFormState({ open: false, entity: null, mode: 'create', initialValues: {} });
      setConfirmState({ open: false, title: '', description: '', actionLabel: 'Remove', onConfirm: null });
    }
  }, [open]);

  const eventId = event?.id;
  const tasks = useMemo(() => event?.tasks ?? [], [event]);
  const guests = useMemo(() => event?.guests ?? [], [event]);
  const agenda = useMemo(() => event?.agenda ?? [], [event]);
  const budget = useMemo(() => event?.budget ?? [], [event]);
  const assets = useMemo(() => event?.assets ?? [], [event]);
  const checklist = useMemo(() => event?.checklist ?? [], [event]);

  const groupedTasks = useMemo(() => {
    const groups = new Map();
    taskStatuses.forEach((status) => groups.set(status, []));
    tasks.forEach((task) => {
      const list = groups.get(task.status) ?? groups.get('todo');
      list.push(task);
    });
    return groups;
  }, [tasks]);

  const openForm = (entity, mode, initialValues = {}) => {
    if (!canManage) return;
    setFormState({ open: true, entity, mode, initialValues });
  };

  const closeForm = () => setFormState({ open: false, entity: null, mode: 'create', initialValues: {} });

  const closeConfirm = () => setConfirmState({ open: false, title: '', description: '', actionLabel: 'Remove', onConfirm: null });

  const handleFormSubmit = async (formEvent) => {
    formEvent.preventDefault();
    if (!eventId) return;
    const form = new FormData(formEvent.target);
    const values = Object.fromEntries(form.entries());
    Object.keys(values).forEach((key) => {
      if (values[key] === '') {
        values[key] = '';
      }
    });

    const mode = formState.mode;
    const entity = formState.entity;
    const initial = formState.initialValues;

    const run = async (operation, successMessage) => {
      setBusy(true);
      const result = await mutateEvent(operation, { successMessage });
      setBusy(false);
      if (result !== false) {
        closeForm();
      }
    };

    if (entity === 'task') {
      const payload = buildTaskPayload({ ...initial, ...values });
      if (mode === 'edit') {
        await run(() => taskApi.update(eventId, initial.id, payload), 'Task updated');
      } else {
        await run(() => taskApi.create(eventId, payload), 'Task added');
      }
    }
    if (entity === 'guest') {
      const payload = buildGuestPayload({ ...initial, ...values });
      if (mode === 'edit') {
        await run(() => guestApi.update(eventId, initial.id, payload), 'Guest updated');
      } else {
        await run(() => guestApi.create(eventId, payload), 'Guest added');
      }
    }
    if (entity === 'budget') {
      const payload = buildBudgetPayload({ ...initial, ...values });
      if (mode === 'edit') {
        await run(() => budgetApi.update(eventId, initial.id, payload), 'Budget line updated');
      } else {
        await run(() => budgetApi.create(eventId, payload), 'Budget line added');
      }
    }
    if (entity === 'agenda') {
      const payload = buildAgendaPayload({ ...initial, ...values });
      if (mode === 'edit') {
        await run(() => agendaApi.update(eventId, initial.id, payload), 'Session updated');
      } else {
        await run(() => agendaApi.create(eventId, payload), 'Session added');
      }
    }
    if (entity === 'asset') {
      const payload = buildAssetPayload({ ...initial, ...values });
      if (mode === 'edit') {
        await run(() => assetApi.update(eventId, initial.id, payload), 'File updated');
      } else {
        await run(() => assetApi.create(eventId, payload), 'File added');
      }
    }
    if (entity === 'checklist') {
      const payload = buildChecklistPayload({ ...initial, ...values, isComplete: values.isComplete === 'on' || values.isComplete === true });
      if (mode === 'edit') {
        await run(() => checklistApi.update(eventId, initial.id, payload), 'Item updated');
      } else {
        await run(() => checklistApi.create(eventId, payload), 'Item added');
      }
    }
  };

  const handleCheckInGuest = (guest) => {
    if (!eventId) return;
    let metadata = guest.metadata ?? {};
    if (workspaceSettings?.requireCheckInNotes) {
      const note = window.prompt('Add a quick note for this guest check-in:', '');
      if (note === null) {
        return;
      }
      const trimmed = note.trim();
      if (trimmed) {
        metadata = { ...metadata, checkInNote: trimmed };
      }
    }
    mutateEvent(
      () =>
        guestApi.update(eventId, guest.id, {
          status: 'checked_in',
          checkedInAt: new Date().toISOString(),
          metadata,
        }),
      { successMessage: 'Guest checked in' },
    );
  };

  const openDeleteConfirm = (title, description, handler, actionLabel = 'Remove') => {
    if (!canManage) return;
    setConfirmState({ open: true, title, description, actionLabel, onConfirm: handler });
  };

  const runDelete = async () => {
    if (!confirmState.onConfirm) {
      closeConfirm();
      return;
    }
    setBusy(true);
    const result = await confirmState.onConfirm();
    setBusy(false);
    if (result !== false) {
      closeConfirm();
    }
  };

  const renderPlan = () => (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Overview"
        action={
          canManage ? (
            <PrimaryButton onClick={onEdit}>
              <PencilSquareIcon className="h-4 w-4" /> Edit
            </PrimaryButton>
          ) : null
        }
        secondaryAction={
          canManage ? (
            <SecondaryButton onClick={onDelete}>
              <TrashIcon className="h-4 w-4" /> Delete
            </SecondaryButton>
          ) : null
        }
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Status</p>
          <div className="mt-3 flex items-center gap-3">
            <Badge value={event?.status} />
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{formatLabel(event?.format)}</span>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Schedule</p>
          <p className="mt-3 text-sm text-slate-700">{formatDateTime(event?.startAt)}</p>
          <p className="text-sm text-slate-500">to {formatDateTime(event?.endAt)}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Location</p>
          <p className="mt-3 text-sm text-slate-700">{event?.location ?? 'Not set'}</p>
        </div>
      </div>
      <SectionHeader
        title="Agenda"
        action={
          canManage ? (
            <PrimaryButton onClick={() => openForm('agenda', 'create', { startAt: event?.startAt?.slice?.(0, 16) ?? '', endAt: event?.endAt?.slice?.(0, 16) ?? '' })}>
              <PlusIcon className="h-4 w-4" /> Add session
            </PrimaryButton>
          ) : null
        }
      />
      {agenda.length ? (
        <div className="space-y-3">
          {agenda.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <div className="flex items-center gap-4">
                <CalendarDaysIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="text-xs text-slate-500">
                    {formatDateTime(item.startAt)} · {item.ownerName ?? 'Unassigned'}
                  </p>
                </div>
              </div>
              {canManage ? (
                <div className="flex items-center gap-2">
                  <MutedButton onClick={() => openForm('agenda', 'edit', { ...item, startAt: item.startAt?.slice?.(0, 16) ?? '', endAt: item.endAt?.slice?.(0, 16) ?? '' })}>Edit</MutedButton>
                  <MutedButton
                    onClick={() =>
                      openDeleteConfirm(
                        'Remove session',
                        'This session will disappear from the public agenda.',
                        () => mutateEvent(() => agendaApi.remove(eventId, item.id), { successMessage: 'Session removed' }),
                      )
                    }
                  >
                    Remove
                  </MutedButton>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          label="No sessions yet"
          action={
            canManage ? (
              <PrimaryButton onClick={() => openForm('agenda', 'create', { startAt: event?.startAt?.slice?.(0, 16) ?? '', endAt: event?.endAt?.slice?.(0, 16) ?? '' })}>
                <PlusIcon className="h-4 w-4" /> Add session
              </PrimaryButton>
            ) : null
          }
        />
      )}
    </div>
  );

  const renderGuests = () => (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Guests"
        action={
          canManage ? (
            <PrimaryButton onClick={() => openForm('guest', 'create', { status: 'invited', seatsReserved: 1 })}>
              <PlusIcon className="h-4 w-4" /> Add guest
            </PrimaryButton>
          ) : null
        }
      />
      {workspaceSettings?.requireCheckInNotes ? (
        <p className="rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">
          Check-in notes are required. Capture on-site context whenever someone arrives.
        </p>
      ) : null}
      {guests.length ? (
        <div className="overflow-hidden rounded-3xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Seats</th>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {guests.map((guest) => (
                <tr key={guest.id} className="text-sm text-slate-700">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <UsersIcon className="h-4 w-4 text-slate-400" aria-hidden="true" />
                      <span>{guest.fullName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge value={guest.status} />
                  </td>
                  <td className="px-4 py-3">{guest.seatsReserved ?? 1}</td>
                  <td className="px-4 py-3">{guest.company ?? '—'}</td>
                  <td className="px-4 py-3 text-right">
                    {canManage ? (
                      <div className="flex items-center justify-end gap-2">
                        {guest.status !== 'checked_in' ? (
                          <SecondaryButton onClick={() => handleCheckInGuest(guest)}>
                            Check in
                          </SecondaryButton>
                        ) : null}
                        <MutedButton onClick={() => openForm('guest', 'edit', { ...guest })}>Edit</MutedButton>
                        <MutedButton
                          onClick={() =>
                            openDeleteConfirm(
                              'Remove guest',
                              'Guest will no longer receive updates.',
                              () => mutateEvent(() => guestApi.remove(eventId, guest.id), { successMessage: 'Guest removed' }),
                            )
                          }
                        >
                          Remove
                        </MutedButton>
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          label="No guests yet"
          action={
            canManage ? (
              <PrimaryButton onClick={() => openForm('guest', 'create', { status: 'invited', seatsReserved: 1 })}>
                <PlusIcon className="h-4 w-4" /> Add guest
              </PrimaryButton>
            ) : null
          }
        />
      )}
    </div>
  );

  const renderTasks = () => (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Tasks"
        action={
          canManage ? (
            <PrimaryButton onClick={() => openForm('task', 'create', { status: 'todo', priority: 'medium' })}>
              <PlusIcon className="h-4 w-4" /> Add task
            </PrimaryButton>
          ) : null
        }
      />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        {taskStatuses.map((status) => (
          <TaskColumn
            key={status}
            label={formatLabel(status)}
            tasks={groupedTasks.get(status) ?? []}
            onEdit={(task) => openForm('task', 'edit', { ...task, dueAt: task.dueAt?.slice?.(0, 16) ?? '' })}
            onDelete={(task) =>
              openDeleteConfirm(
                'Remove task',
                'Task will be deleted from this board.',
                () => mutateEvent(() => taskApi.remove(eventId, task.id), { successMessage: 'Task removed' }),
              )
            }
            canManage={canManage}
          />
        ))}
      </div>
    </div>
  );

  const renderBudget = () => (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Budget"
        action={
          canManage ? (
            <PrimaryButton onClick={() => openForm('budget', 'create', { status: 'planned', currency: 'USD' })}>
              <PlusIcon className="h-4 w-4" /> Add line
            </PrimaryButton>
          ) : null
        }
      />
      {budget.length ? (
        <div className="overflow-hidden rounded-3xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Vendor</th>
                <th className="px-4 py-3">Planned</th>
                <th className="px-4 py-3">Actual</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {budget.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 text-sm text-slate-700">{item.category}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{item.vendorName ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{item.amountPlanned ?? 0}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{item.amountActual ?? 0}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    <Badge value={item.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    {canManage ? (
                      <div className="flex items-center justify-end gap-2">
                        <MutedButton onClick={() => openForm('budget', 'edit', { ...item })}>Edit</MutedButton>
                        <MutedButton
                          onClick={() =>
                            openDeleteConfirm(
                              'Remove budget line',
                              'This spend item will be removed from reports.',
                              () => mutateEvent(() => budgetApi.remove(eventId, item.id), { successMessage: 'Budget line removed' }),
                            )
                          }
                        >
                          Remove
                        </MutedButton>
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          label="No budget lines yet"
          action={
            canManage ? (
              <PrimaryButton onClick={() => openForm('budget', 'create', { status: 'planned', currency: 'USD' })}>
                <PlusIcon className="h-4 w-4" /> Add line
              </PrimaryButton>
            ) : null
          }
        />
      )}
    </div>
  );

  const renderAssets = () => (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Files"
        action={
          canManage ? (
            <PrimaryButton onClick={() => openForm('asset', 'create', { assetType: 'image', visibility: 'internal' })}>
              <PlusIcon className="h-4 w-4" /> Add file
            </PrimaryButton>
          ) : null
        }
      />
      {assets.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {assets.map((asset) => (
            <div key={asset.id} className="flex items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <div>
                <p className="text-sm font-semibold text-slate-900">{asset.name}</p>
                <p className="text-xs text-slate-500">{formatLabel(asset.assetType)} · {formatLabel(asset.visibility)}</p>
              </div>
              <div className="flex items-center gap-2">
                <MutedButton
                  onClick={() => {
                    if (typeof window !== 'undefined' && asset.url) {
                      const handle = window.open(asset.url, '_blank', 'noopener');
                      handle?.focus?.();
                    }
                  }}
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                </MutedButton>
                {canManage ? (
                  <>
                    <MutedButton onClick={() => openForm('asset', 'edit', { ...asset })}>Edit</MutedButton>
                    <MutedButton
                      onClick={() =>
                        openDeleteConfirm(
                          'Remove file',
                          'Asset will no longer be available to collaborators.',
                          () => mutateEvent(() => assetApi.remove(eventId, asset.id), { successMessage: 'File removed' }),
                        )
                      }
                    >
                      Remove
                    </MutedButton>
                  </>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          label="No files yet"
          action={
            canManage ? (
              <PrimaryButton onClick={() => openForm('asset', 'create', { assetType: 'image', visibility: 'internal' })}>
                <PlusIcon className="h-4 w-4" /> Add file
              </PrimaryButton>
            ) : null
          }
        />
      )}
    </div>
  );

  const renderChecklist = () => (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Checklist"
        action={
          canManage ? (
            <PrimaryButton onClick={() => openForm('checklist', 'create', { isComplete: false })}>
              <PlusIcon className="h-4 w-4" /> Add item
            </PrimaryButton>
          ) : null
        }
      />
      {checklist.length ? (
        <div className="flex flex-col gap-3">
          {checklist.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <div>
                <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                <p className="text-xs text-slate-500">{item.ownerName ?? 'Unassigned'} · {formatDate(item.dueAt)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge value={item.isComplete ? 'done' : 'todo'} />
                {canManage ? (
                  <>
                    <MutedButton
                      onClick={() =>
                        mutateEvent(
                          () =>
                            checklistApi.update(eventId, item.id, {
                              ...buildChecklistPayload(item),
                              isComplete: !item.isComplete,
                            }),
                          { successMessage: 'Checklist updated' },
                        )
                      }
                    >
                      {item.isComplete ? 'Undo' : 'Complete'}
                    </MutedButton>
                    <MutedButton onClick={() => openForm('checklist', 'edit', { ...item, dueAt: item.dueAt?.slice?.(0, 16) ?? '' })}>Edit</MutedButton>
                    <MutedButton
                      onClick={() =>
                        openDeleteConfirm(
                          'Remove item',
                          'This task will be removed from readiness.',
                          () => mutateEvent(() => checklistApi.remove(eventId, item.id), { successMessage: 'Item removed' }),
                        )
                      }
                    >
                      Remove
                    </MutedButton>
                  </>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          label="No checklist items"
          action={
            canManage ? (
              <PrimaryButton onClick={() => openForm('checklist', 'create', { isComplete: false })}>
                <PlusIcon className="h-4 w-4" /> Add item
              </PrimaryButton>
            ) : null
          }
        />
      )}
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'Guests':
        return renderGuests();
      case 'Tasks':
        return renderTasks();
      case 'Budget':
        return renderBudget();
      case 'Files':
        return renderAssets();
      case 'Checklist':
        return renderChecklist();
      default:
        return renderPlan();
    }
  };

  const getFormTitle = () => {
    if (!formState.entity) return '';
    const entityLabel = formatLabel(formState.entity);
    return formState.mode === 'edit' ? `Edit ${entityLabel}` : `Add ${entityLabel}`;
  };

  const renderFormFields = () => {
    const values = formState.initialValues ?? {};
    const mode = formState.mode;
    switch (formState.entity) {
      case 'task':
        return (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Title">
              <input
                name="title"
                defaultValue={values.title ?? ''}
                required
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
              />
            </FormField>
            <FormField label="Owner">
              <input
                name="ownerName"
                defaultValue={values.ownerName ?? ''}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
              />
            </FormField>
            <FormField label="Status">
              <select
                name="status"
                defaultValue={values.status ?? 'todo'}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
              >
                {taskStatuses.map((status) => (
                  <option key={status} value={status}>
                    {formatLabel(status)}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Priority">
              <select
                name="priority"
                defaultValue={values.priority ?? 'medium'}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
              >
                {taskPriorities.map((priority) => (
                  <option key={priority} value={priority}>
                    {formatLabel(priority)}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Due">
              <input
                type="datetime-local"
                name="dueAt"
                defaultValue={values.dueAt ?? ''}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
              />
            </FormField>
            <FormField label="Notes">
              <textarea
                name="notes"
                defaultValue={values.notes ?? ''}
                rows={3}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
              />
            </FormField>
          </div>
        );
      case 'guest':
        return (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Name">
              <input
                name="fullName"
                defaultValue={values.fullName ?? ''}
                required
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
              />
            </FormField>
            <FormField label="Email">
              <input
                type="email"
                name="email"
                defaultValue={values.email ?? ''}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
              />
            </FormField>
            <FormField label="Company">
              <input
                name="company"
                defaultValue={values.company ?? ''}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
              />
            </FormField>
            <FormField label="Role">
              <input
                name="role"
                defaultValue={values.role ?? ''}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
              />
            </FormField>
            <FormField label="Status">
              <select
                name="status"
                defaultValue={values.status ?? 'invited'}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
              >
                {guestStatuses.map((status) => (
                  <option key={status} value={status}>
                    {formatLabel(status)}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Ticket">
              <input
                name="ticketType"
                defaultValue={values.ticketType ?? ''}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
              />
            </FormField>
            <FormField label="Seats">
              <input
                type="number"
                min="1"
                name="seatsReserved"
                defaultValue={values.seatsReserved ?? 1}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
              />
            </FormField>
          </div>
        );
      case 'budget':
        return (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Category">
              <input
                name="category"
                defaultValue={values.category ?? ''}
                required
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
              />
            </FormField>
            <FormField label="Vendor">
              <input
                name="vendorName"
                defaultValue={values.vendorName ?? ''}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
              />
            </FormField>
            <FormField label="Planned">
              <input
                type="number"
                name="amountPlanned"
                defaultValue={values.amountPlanned ?? ''}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
              />
            </FormField>
            <FormField label="Actual">
              <input
                type="number"
                name="amountActual"
                defaultValue={values.amountActual ?? ''}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
              />
            </FormField>
            <FormField label="Currency">
              <input
                name="currency"
                defaultValue={values.currency ?? 'USD'}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
              />
            </FormField>
            <FormField label="Status">
              <select
                name="status"
                defaultValue={values.status ?? 'planned'}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
              >
                {budgetStatuses.map((status) => (
                  <option key={status} value={status}>
                    {formatLabel(status)}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Description">
              <textarea
                name="description"
                defaultValue={values.description ?? ''}
                rows={3}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
              />
            </FormField>
            <FormField label="Notes">
              <textarea
                name="notes"
                defaultValue={values.notes ?? ''}
                rows={3}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
              />
            </FormField>
          </div>
        );
      case 'agenda':
        return (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Title">
              <input
                name="title"
                defaultValue={values.title ?? ''}
                required
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
              />
            </FormField>
            <FormField label="Owner">
              <input
                name="ownerName"
                defaultValue={values.ownerName ?? ''}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
              />
            </FormField>
            <FormField label="Starts">
              <input
                type="datetime-local"
                name="startAt"
                defaultValue={values.startAt ?? ''}
                required
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
              />
            </FormField>
            <FormField label="Ends">
              <input
                type="datetime-local"
                name="endAt"
                defaultValue={values.endAt ?? ''}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
              />
            </FormField>
            <FormField label="Description">
              <textarea
                name="description"
                defaultValue={values.description ?? ''}
                rows={3}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
              />
            </FormField>
          </div>
        );
      case 'asset':
        return (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Name">
              <input
                name="name"
                defaultValue={values.name ?? ''}
                required
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
              />
            </FormField>
            <FormField label="Link">
              <input
                type="url"
                name="url"
                defaultValue={values.url ?? ''}
                required
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
              />
            </FormField>
            <FormField label="Type">
              <select
                name="assetType"
                defaultValue={values.assetType ?? 'image'}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
              >
                {assetTypes.map((type) => (
                  <option key={type} value={type}>
                    {formatLabel(type)}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Visibility">
              <select
                name="visibility"
                defaultValue={values.visibility ?? 'internal'}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
              >
                {assetVisibilities.map((visibility) => (
                  <option key={visibility} value={visibility}>
                    {formatLabel(visibility)}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Thumbnail">
              <input
                type="url"
                name="thumbnailUrl"
                defaultValue={values.thumbnailUrl ?? ''}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
              />
            </FormField>
          </div>
        );
      case 'checklist':
        return (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Title">
              <input
                name="label"
                defaultValue={values.label ?? ''}
                required
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
              />
            </FormField>
            <FormField label="Owner">
              <input
                name="ownerName"
                defaultValue={values.ownerName ?? ''}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
              />
            </FormField>
            <FormField label="Due">
              <input
                type="datetime-local"
                name="dueAt"
                defaultValue={values.dueAt ?? ''}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
              />
            </FormField>
            <FormField label="Completed">
              <input
                type="checkbox"
                name="isComplete"
                defaultChecked={Boolean(values.isComplete)}
                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
              />
            </FormField>
          </div>
        );
      default:
        return null;
    }
  };

  const formTitle = getFormTitle();
  const formSubmitLabel = formState.mode === 'edit' ? 'Save' : 'Create';

  return (
    <>
      <Transition show={open} as={Fragment}>
        <Dialog as="div" className="relative z-40" onClose={onClose}>
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
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-stretch justify-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="mx-auto flex h-screen w-full max-w-6xl transform flex-col overflow-hidden bg-slate-50 shadow-2xl transition-all">
                  <header className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-6">
                    <div>
                      <Dialog.Title className="text-2xl font-semibold text-slate-900">{event?.title ?? 'Event'}</Dialog.Title>
                      <p className="mt-1 text-sm text-slate-500">{formatDateTime(event?.startAt)} · {event?.location ?? 'No location'}</p>
                    </div>
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-full border border-slate-200 p-2 text-slate-500 hover:text-slate-900"
                    >
                      <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </header>
                  <div className="flex flex-1 flex-col overflow-hidden">
                    <nav className="flex shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-6 py-3">
                      {tabs.map((tab) => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setActiveTab(tab)}
                          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                            activeTab === tab ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </nav>
                    <div className="flex-1 overflow-y-auto px-8 py-6">
                      {renderContent()}
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
      <Transition show={formState.open} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={busy ? () => {} : closeForm}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-900/30" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-4xl bg-white p-8 shadow-xl transition-all">
                  {formState.entity ? (
                    <FormContainer
                      key={`${formState.entity}-${formState.initialValues?.id ?? 'new'}`}
                      onSubmit={handleFormSubmit}
                      title={formTitle}
                      submitLabel={formSubmitLabel}
                      onCancel={closeForm}
                      busy={busy}
                    >
                      {renderFormFields()}
                    </FormContainer>
                  ) : null}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
      <Transition show={confirmState.open} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={busy ? () => {} : closeConfirm}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-900/30" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-3xl bg-white p-6 shadow-xl transition-all">
                  <Dialog.Title className="text-lg font-semibold text-slate-900">{confirmState.title}</Dialog.Title>
                  <p className="mt-2 text-sm text-slate-600">{confirmState.description}</p>
                  <div className="mt-6 flex items-center gap-3">
                    <PrimaryButton onClick={runDelete} disabled={busy}>
                      {busy ? 'Processing…' : confirmState.actionLabel ?? 'Remove'}
                    </PrimaryButton>
                    <SecondaryButton onClick={closeConfirm} disabled={busy}>
                      Cancel
                    </SecondaryButton>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}

