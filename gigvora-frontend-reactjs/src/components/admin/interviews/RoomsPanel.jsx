import { Fragment, useEffect, useMemo, useState } from 'react';
import { Dialog, Switch, Transition } from '@headlessui/react';
import {
  CalendarDaysIcon,
  ClockIcon,
  PlusIcon,
  TrashIcon,
  UsersIcon,
  VideoCameraIcon,
  ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/outline';

function classNames(...values) {
  return values.filter(Boolean).join(' ');
}

function formatDate(value) {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function toDateInput(value) {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const tzOffset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - tzOffset * 60000);
  return localDate.toISOString().slice(0, 16);
}

const STATUS_OPTIONS = ['scheduled', 'needs_scheduling', 'awaiting_feedback', 'offer_sent', 'completed'];
const PARTICIPANT_TYPES = [
  { value: 'candidate', label: 'Candidate' },
  { value: 'company_member', label: 'Team' },
  { value: 'external', label: 'Guest' },
];
const PARTICIPANT_STATUS = ['invited', 'accepted', 'confirmed', 'declined'];
const CHECKLIST_STATUS = ['pending', 'in_progress', 'completed'];

function RoomCard({ room, onOpen, onDelete, busy }) {
  return (
    <div className="flex flex-col justify-between rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/70 transition hover:shadow-lg">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Stage</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{room.stage}</p>
            <p className="text-sm text-slate-500">{room.status.replace(/_/g, ' ')}</p>
          </div>
          <button
            type="button"
            onClick={() => onOpen(room)}
            className="inline-flex items-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            Manage
          </button>
        </div>
        <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <CalendarDaysIcon className="h-5 w-5 text-blue-500" />
          <span>{formatDate(room.scheduledAt)}</span>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <UsersIcon className="h-4 w-4 text-blue-500" />
            <span>{room.participants?.length ?? 0} people</span>
          </div>
          <div className="flex items-center gap-2">
            <ClipboardDocumentCheckIcon className="h-4 w-4 text-blue-500" />
            <span>{room.checklist?.filter((item) => item.status === 'completed').length ?? 0} done</span>
          </div>
          <div className="flex items-center gap-2">
            <VideoCameraIcon className="h-4 w-4 text-blue-500" />
            <span>{room.hdEnabled ? 'HD on' : 'HD off'}</span>
          </div>
          <div className="flex items-center gap-2">
            <ClockIcon className="h-4 w-4 text-blue-500" />
            <span>{room.recordingEnabled ? 'Recording on' : 'Recording off'}</span>
          </div>
        </div>
      </div>
      <div className="mt-6 flex justify-between">
        <button
          type="button"
          onClick={() => onOpen(room)}
          className="text-sm font-semibold text-blue-600 transition hover:text-blue-700"
        >
          Open
        </button>
        <button
          type="button"
          onClick={() => onDelete(room)}
          disabled={busy}
          className={classNames(
            'inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold transition',
            busy ? 'cursor-not-allowed text-rose-300' : 'text-rose-500 hover:text-rose-600',
          )}
        >
          <TrashIcon className="h-4 w-4" />
          Remove
        </button>
      </div>
    </div>
  );
}

function ParticipantEditor({ participant, onChange, onSave, onRemove, saving }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Name</span>
          <input
            type="text"
            value={participant.name ?? ''}
            onChange={(event) => onChange({ ...participant, name: event.target.value })}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Role</span>
          <input
            type="text"
            value={participant.role ?? ''}
            onChange={(event) => onChange({ ...participant, role: event.target.value })}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</span>
          <input
            type="email"
            value={participant.email ?? ''}
            onChange={(event) => onChange({ ...participant, email: event.target.value })}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Type</span>
          <select
            value={participant.participantType ?? 'company_member'}
            onChange={(event) => onChange({ ...participant, participantType: event.target.value })}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            {PARTICIPANT_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</span>
          <select
            value={participant.status ?? 'invited'}
            onChange={(event) => onChange({ ...participant, status: event.target.value })}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            {PARTICIPANT_STATUS.map((option) => (
              <option key={option} value={option}>
                {option.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Moderator</span>
          <Switch
            checked={Boolean(participant.isModerator)}
            onChange={(value) => onChange({ ...participant, isModerator: value })}
            className={classNames(
              participant.isModerator ? 'bg-blue-500' : 'bg-slate-200',
              'relative inline-flex h-6 w-11 items-center rounded-full transition',
            )}
          >
            <span
              className={classNames(
                participant.isModerator ? 'translate-x-6' : 'translate-x-1',
                'inline-block h-4 w-4 transform rounded-full bg-white transition',
              )}
            />
          </Switch>
        </label>
      </div>
      <div className="mt-4 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => onRemove(participant)}
          className="text-sm font-semibold text-rose-500 transition hover:text-rose-600"
          disabled={saving}
        >
          Remove
        </button>
        <button
          type="button"
          onClick={() => onSave(participant)}
          disabled={saving}
          className={classNames(
            'inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition',
            saving ? 'cursor-not-allowed bg-slate-200 text-slate-400' : 'bg-blue-600 text-white hover:bg-blue-700',
          )}
        >
          Save
        </button>
      </div>
    </div>
  );
}

function ChecklistEditor({ item, onChange, onSave, onRemove, saving }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Label</span>
          <input
            type="text"
            value={item.label ?? ''}
            onChange={(event) => onChange({ ...item, label: event.target.value })}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Owner</span>
          <input
            type="text"
            value={item.ownerName ?? ''}
            onChange={(event) => onChange({ ...item, ownerName: event.target.value })}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>
        <label className="flex flex-col gap-1 md:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</span>
          <textarea
            value={item.description ?? ''}
            onChange={(event) => onChange({ ...item, description: event.target.value })}
            rows={2}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</span>
          <select
            value={item.status ?? 'pending'}
            onChange={(event) => onChange({ ...item, status: event.target.value })}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            {CHECKLIST_STATUS.map((option) => (
              <option key={option} value={option}>
                {option.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="mt-4 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => onRemove(item)}
          className="text-sm font-semibold text-rose-500 transition hover:text-rose-600"
          disabled={saving}
        >
          Remove
        </button>
        <button
          type="button"
          onClick={() => onSave(item)}
          disabled={saving}
          className={classNames(
            'inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition',
            saving ? 'cursor-not-allowed bg-slate-200 text-slate-400' : 'bg-blue-600 text-white hover:bg-blue-700',
          )}
        >
          Save
        </button>
      </div>
    </div>
  );
}

function RoomEditorModal({
  open,
  room,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
  onAddParticipant,
  onUpdateParticipant,
  onRemoveParticipant,
  onAddChecklistItem,
  onUpdateChecklistItem,
  onRemoveChecklistItem,
  busy,
}) {
  const isNew = !room?.id;
  const [activeTab, setActiveTab] = useState('details');
  const [details, setDetails] = useState({
    stage: '',
    status: 'scheduled',
    scheduledAt: '',
    videoBridgeUrl: '',
    agenda: '',
    hdEnabled: true,
    recordingEnabled: true,
  });
  const [participants, setParticipants] = useState([]);
  const [checklist, setChecklist] = useState([]);
  const [newParticipant, setNewParticipant] = useState({
    name: '',
    participantType: 'company_member',
    status: 'invited',
    role: '',
    email: '',
    isModerator: false,
  });
  const [newChecklist, setNewChecklist] = useState({
    label: '',
    description: '',
    ownerName: '',
    status: 'pending',
  });

  useEffect(() => {
    if (open) {
      setActiveTab('details');
    }
  }, [open]);

  useEffect(() => {
    if (!room) {
      setDetails({
        stage: '',
        status: 'scheduled',
        scheduledAt: '',
        videoBridgeUrl: '',
        agenda: '',
        hdEnabled: true,
        recordingEnabled: true,
      });
      setParticipants([]);
      setChecklist([]);
      return;
    }
    setDetails({
      stage: room.stage ?? '',
      status: room.status ?? 'scheduled',
      scheduledAt: toDateInput(room.scheduledAt),
      videoBridgeUrl: room.videoBridgeUrl ?? '',
      agenda: room.agenda ?? '',
      hdEnabled: Boolean(room.hdEnabled),
      recordingEnabled: Boolean(room.recordingEnabled),
    });
    setParticipants(room.participants ? room.participants.map((participant) => ({ ...participant })) : []);
    setChecklist(room.checklist ? room.checklist.map((item) => ({ ...item })) : []);
  }, [room]);

  const handleSaveDetails = async () => {
    const payload = {
      stage: details.stage || 'Interview',
      status: details.status,
      scheduledAt: details.scheduledAt ? new Date(details.scheduledAt).toISOString() : null,
      videoBridgeUrl: details.videoBridgeUrl || undefined,
      agenda: details.agenda || undefined,
      hdEnabled: details.hdEnabled,
      recordingEnabled: details.recordingEnabled,
    };
    if (isNew) {
      await onCreate(payload);
    } else {
      await onUpdate(room.id, payload);
    }
  };

  const handleCreateParticipant = async () => {
    if (!newParticipant.name) {
      return;
    }
    await onAddParticipant(room.id, newParticipant);
    setNewParticipant({
      name: '',
      participantType: 'company_member',
      status: 'invited',
      role: '',
      email: '',
      isModerator: false,
    });
  };

  const handleCreateChecklist = async () => {
    if (!newChecklist.label) {
      return;
    }
    await onAddChecklistItem(room.id, newChecklist);
    setNewChecklist({
      label: '',
      description: '',
      ownerName: '',
      status: 'pending',
    });
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-40" onClose={busy ? () => {} : onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4"
              enterTo="opacity-100 translate-y-0"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-4"
            >
              <Dialog.Panel className="w-full max-w-4xl rounded-4xl bg-white p-6 shadow-2xl">
                <div className="flex items-start justify-between gap-4">
                  <Dialog.Title className="text-lg font-semibold text-slate-900">
                    {isNew ? 'New room' : room.stage}
                  </Dialog.Title>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full border border-slate-200 px-3 py-1 text-sm font-semibold text-slate-500 transition hover:border-blue-200 hover:text-blue-600"
                  >
                    Close
                  </button>
                </div>

                {!isNew ? (
                  <div className="mt-6 flex gap-3">
                    {['details', 'participants', 'checklist'].map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveTab(tab)}
                        className={classNames(
                          'rounded-full px-4 py-2 text-sm font-semibold transition',
                          activeTab === tab
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                        )}
                      >
                        {tab === 'details' ? 'Details' : tab === 'participants' ? 'People' : 'Checklist'}
                      </button>
                    ))}
                  </div>
                ) : null}

                <div className="mt-6 space-y-6">
                  {(isNew || activeTab === 'details') && (
                    <div className="rounded-3xl border border-slate-200 p-5">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <label className="flex flex-col gap-1">
                          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Stage</span>
                          <input
                            type="text"
                            value={details.stage}
                            onChange={(event) => setDetails((prev) => ({ ...prev, stage: event.target.value }))}
                            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                          />
                        </label>
                        <label className="flex flex-col gap-1">
                          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</span>
                          <select
                            value={details.status}
                            onChange={(event) => setDetails((prev) => ({ ...prev, status: event.target.value }))}
                            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                          >
                            {STATUS_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {option.replace(/_/g, ' ')}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="flex flex-col gap-1">
                          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Scheduled</span>
                          <input
                            type="datetime-local"
                            value={details.scheduledAt}
                            onChange={(event) => setDetails((prev) => ({ ...prev, scheduledAt: event.target.value }))}
                            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                          />
                        </label>
                        <label className="flex flex-col gap-1">
                          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Video link</span>
                          <input
                            type="text"
                            value={details.videoBridgeUrl}
                            onChange={(event) => setDetails((prev) => ({ ...prev, videoBridgeUrl: event.target.value }))}
                            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                          />
                        </label>
                        <label className="flex flex-col gap-1 md:col-span-2">
                          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Agenda</span>
                          <textarea
                            value={details.agenda}
                            onChange={(event) => setDetails((prev) => ({ ...prev, agenda: event.target.value }))}
                            rows={3}
                            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                          />
                        </label>
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={details.hdEnabled}
                            onChange={(value) => setDetails((prev) => ({ ...prev, hdEnabled: value }))}
                            className={classNames(
                              details.hdEnabled ? 'bg-blue-500' : 'bg-slate-200',
                              'relative inline-flex h-6 w-11 items-center rounded-full transition',
                            )}
                          >
                            <span
                              className={classNames(
                                details.hdEnabled ? 'translate-x-6' : 'translate-x-1',
                                'inline-block h-4 w-4 transform rounded-full bg-white transition',
                              )}
                            />
                          </Switch>
                          <span className="text-sm font-semibold text-slate-600">HD video</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={details.recordingEnabled}
                            onChange={(value) => setDetails((prev) => ({ ...prev, recordingEnabled: value }))}
                            className={classNames(
                              details.recordingEnabled ? 'bg-blue-500' : 'bg-slate-200',
                              'relative inline-flex h-6 w-11 items-center rounded-full transition',
                            )}
                          >
                            <span
                              className={classNames(
                                details.recordingEnabled ? 'translate-x-6' : 'translate-x-1',
                                'inline-block h-4 w-4 transform rounded-full bg-white transition',
                              )}
                            />
                          </Switch>
                          <span className="text-sm font-semibold text-slate-600">Auto recording</span>
                        </div>
                      </div>
                      <div className="mt-5 flex items-center justify-between">
                        {!isNew ? (
                          <button
                            type="button"
                            onClick={() => onDelete(room)}
                            disabled={busy}
                            className="text-sm font-semibold text-rose-500 transition hover:text-rose-600"
                          >
                            Delete room
                          </button>
                        ) : (
                          <span />
                        )}
                        <button
                          type="button"
                          onClick={handleSaveDetails}
                          disabled={busy}
                          className={classNames(
                            'inline-flex items-center rounded-full px-5 py-2 text-sm font-semibold shadow-sm transition',
                            busy ? 'cursor-not-allowed bg-slate-200 text-slate-400' : 'bg-blue-600 text-white hover:bg-blue-700',
                          )}
                        >
                          Save details
                        </button>
                      </div>
                    </div>
                  )}

                  {!isNew && activeTab === 'participants' && (
                    <div className="space-y-5">
                      {participants.map((participant) => (
                        <ParticipantEditor
                          key={participant.id}
                          participant={participant}
                          onChange={(draft) =>
                            setParticipants((prev) => prev.map((item) => (item.id === draft.id ? draft : item)))
                          }
                          onSave={async (draft) => {
                            await onUpdateParticipant(room.id, draft.id, draft);
                          }}
                          onRemove={async (draft) => {
                            await onRemoveParticipant(room.id, draft.id);
                          }}
                          saving={busy}
                        />
                      ))}
                      <div className="rounded-3xl border border-dashed border-slate-300 p-5">
                        <p className="text-sm font-semibold text-slate-600">Add person</p>
                        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                          <label className="flex flex-col gap-1">
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Name</span>
                            <input
                              type="text"
                              value={newParticipant.name}
                              onChange={(event) =>
                                setNewParticipant((prev) => ({ ...prev, name: event.target.value }))
                              }
                              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                            />
                          </label>
                          <label className="flex flex-col gap-1">
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Role</span>
                            <input
                              type="text"
                              value={newParticipant.role}
                              onChange={(event) =>
                                setNewParticipant((prev) => ({ ...prev, role: event.target.value }))
                              }
                              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                            />
                          </label>
                          <label className="flex flex-col gap-1">
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</span>
                            <input
                              type="email"
                              value={newParticipant.email}
                              onChange={(event) =>
                                setNewParticipant((prev) => ({ ...prev, email: event.target.value }))
                              }
                              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                            />
                          </label>
                          <label className="flex flex-col gap-1">
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Type</span>
                            <select
                              value={newParticipant.participantType}
                              onChange={(event) =>
                                setNewParticipant((prev) => ({ ...prev, participantType: event.target.value }))
                              }
                              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                            >
                              {PARTICIPANT_TYPES.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                          <select
                            value={newParticipant.status}
                            onChange={(event) =>
                              setNewParticipant((prev) => ({ ...prev, status: event.target.value }))
                            }
                            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                          >
                            {PARTICIPANT_STATUS.map((option) => (
                              <option key={option} value={option}>
                                {option.replace(/_/g, ' ')}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={handleCreateParticipant}
                            disabled={busy || !newParticipant.name}
                            className={classNames(
                              'inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition',
                              busy || !newParticipant.name
                                ? 'cursor-not-allowed bg-slate-200 text-slate-400'
                                : 'bg-blue-600 text-white hover:bg-blue-700',
                            )}
                          >
                            <PlusIcon className="mr-2 h-4 w-4" /> Add
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {!isNew && activeTab === 'checklist' && (
                    <div className="space-y-5">
                      {checklist.map((item) => (
                        <ChecklistEditor
                          key={item.id}
                          item={item}
                          onChange={(draft) =>
                            setChecklist((prev) => prev.map((entry) => (entry.id === draft.id ? draft : entry)))
                          }
                          onSave={async (draft) => {
                            await onUpdateChecklistItem(room.id, draft.id, draft);
                          }}
                          onRemove={async (draft) => {
                            await onRemoveChecklistItem(room.id, draft.id);
                          }}
                          saving={busy}
                        />
                      ))}
                      <div className="rounded-3xl border border-dashed border-slate-300 p-5">
                        <p className="text-sm font-semibold text-slate-600">Add checklist item</p>
                        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                          <label className="flex flex-col gap-1">
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Label</span>
                            <input
                              type="text"
                              value={newChecklist.label}
                              onChange={(event) =>
                                setNewChecklist((prev) => ({ ...prev, label: event.target.value }))
                              }
                              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                            />
                          </label>
                          <label className="flex flex-col gap-1">
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Owner</span>
                            <input
                              type="text"
                              value={newChecklist.ownerName}
                              onChange={(event) =>
                                setNewChecklist((prev) => ({ ...prev, ownerName: event.target.value }))
                              }
                              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                            />
                          </label>
                          <label className="flex flex-col gap-1 md:col-span-2">
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</span>
                            <textarea
                              value={newChecklist.description}
                              onChange={(event) =>
                                setNewChecklist((prev) => ({ ...prev, description: event.target.value }))
                              }
                              rows={2}
                              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                            />
                          </label>
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                          <select
                            value={newChecklist.status}
                            onChange={(event) =>
                              setNewChecklist((prev) => ({ ...prev, status: event.target.value }))
                            }
                            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                          >
                            {CHECKLIST_STATUS.map((option) => (
                              <option key={option} value={option}>
                                {option.replace(/_/g, ' ')}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={handleCreateChecklist}
                            disabled={busy || !newChecklist.label}
                            className={classNames(
                              'inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition',
                              busy || !newChecklist.label
                                ? 'cursor-not-allowed bg-slate-200 text-slate-400'
                                : 'bg-blue-600 text-white hover:bg-blue-700',
                            )}
                          >
                            <PlusIcon className="mr-2 h-4 w-4" /> Add
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

export default function RoomsPanel({
  rooms = [],
  onCreateRoom,
  onUpdateRoom,
  onDeleteRoom,
  onAddParticipant,
  onUpdateParticipant,
  onRemoveParticipant,
  onAddChecklistItem,
  onUpdateChecklistItem,
  onRemoveChecklistItem,
  busy = false,
  showHeader = true,
  className = '',
}) {
  const [editorState, setEditorState] = useState({ open: false, room: null });

  const sortedRooms = useMemo(() => {
    return [...rooms].sort((a, b) => {
      const aTime = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0;
      const bTime = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0;
      return aTime - bTime;
    });
  }, [rooms]);

  return (
    <div className={classNames('space-y-6', className)}>
      {showHeader ? (
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Rooms</h2>
          <button
            type="button"
            onClick={() => setEditorState({ open: true, room: null })}
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4" /> New
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={() => setEditorState({ open: true, room: null })}
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4" /> New
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {sortedRooms.map((room) => (
          <RoomCard
            key={room.id}
            room={room}
            onOpen={(candidate) => setEditorState({ open: true, room: candidate })}
            onDelete={(candidate) => onDeleteRoom(candidate.id)}
            busy={busy}
          />
        ))}
      </div>

      <RoomEditorModal
        open={editorState.open}
        room={editorState.room}
        onClose={() => setEditorState({ open: false, room: null })}
        onCreate={async (payload) => {
          await onCreateRoom(payload);
          setEditorState({ open: false, room: null });
        }}
        onUpdate={onUpdateRoom}
        onDelete={async (room) => {
          await onDeleteRoom(room.id);
          setEditorState({ open: false, room: null });
        }}
        onAddParticipant={onAddParticipant}
        onUpdateParticipant={onUpdateParticipant}
        onRemoveParticipant={onRemoveParticipant}
        onAddChecklistItem={onAddChecklistItem}
        onUpdateChecklistItem={onUpdateChecklistItem}
        onRemoveChecklistItem={onRemoveChecklistItem}
        busy={busy}
      />
    </div>
  );
}
