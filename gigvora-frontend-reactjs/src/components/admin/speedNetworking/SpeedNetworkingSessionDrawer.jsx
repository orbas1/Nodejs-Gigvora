import { Fragment, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';

function toTags(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return `${value}`
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

const DEFAULT_ROOM = {
  name: '',
  topic: '',
  capacity: '',
  facilitatorId: '',
  meetingUrl: '',
  rotationIntervalSeconds: '',
  instructions: '',
};

const DEFAULT_SESSION = {
  title: '',
  description: '',
  status: 'draft',
  accessLevel: 'invite_only',
  visibility: 'internal',
  hostId: '',
  adminOwnerId: '',
  workspaceId: '',
  capacity: '',
  roundDurationSeconds: 300,
  totalRounds: 4,
  bufferSeconds: 60,
  scheduledStart: '',
  scheduledEnd: '',
  timezone: '',
  registrationCloseAt: '',
  meetingProvider: '',
  meetingUrl: '',
  lobbyUrl: '',
  instructions: '',
  matchingStrategy: 'round_robin',
  tags: '',
};

export default function SpeedNetworkingSessionDrawer({
  open,
  mode,
  onClose,
  onSubmit,
  busy,
  initialValues,
  catalog,
}) {
  const [formState, setFormState] = useState(() => ({ ...DEFAULT_SESSION }));
  const [rooms, setRooms] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setFormState({
        title: initialValues?.title ?? '',
        description: initialValues?.description ?? '',
        status: initialValues?.status ?? 'draft',
        accessLevel: initialValues?.accessLevel ?? 'invite_only',
        visibility: initialValues?.visibility ?? 'internal',
        hostId: initialValues?.host?.id ?? initialValues?.hostId ?? '',
        adminOwnerId: initialValues?.adminOwner?.id ?? initialValues?.adminOwnerId ?? '',
        workspaceId: initialValues?.workspace?.id ?? initialValues?.workspaceId ?? '',
        capacity: initialValues?.capacity ?? '',
        roundDurationSeconds: initialValues?.roundDurationSeconds ?? 300,
        totalRounds: initialValues?.totalRounds ?? 4,
        bufferSeconds: initialValues?.bufferSeconds ?? 60,
        scheduledStart: initialValues?.scheduledStart ? initialValues.scheduledStart.substring(0, 16) : '',
        scheduledEnd: initialValues?.scheduledEnd ? initialValues.scheduledEnd.substring(0, 16) : '',
        timezone: initialValues?.timezone ?? '',
        registrationCloseAt: initialValues?.registrationCloseAt ? initialValues.registrationCloseAt.substring(0, 16) : '',
        meetingProvider: initialValues?.meetingProvider ?? '',
        meetingUrl: initialValues?.meetingUrl ?? '',
        lobbyUrl: initialValues?.lobbyUrl ?? '',
        instructions: initialValues?.instructions ?? '',
        matchingStrategy: initialValues?.matchingStrategy ?? 'round_robin',
        tags: toTags(initialValues?.tags).join(', '),
      });
      setRooms(() => (Array.isArray(initialValues?.rooms) ? initialValues.rooms.map((room) => ({
            id: room.id,
            name: room.name ?? '',
            topic: room.topic ?? '',
            capacity: room.capacity ?? '',
            facilitatorId: room.facilitator?.id ?? '',
            meetingUrl: room.meetingUrl ?? '',
            rotationIntervalSeconds: room.rotationIntervalSeconds ?? '',
            instructions: room.instructions ?? '',
          })) : []));
      setErrors({});
    } else {
      setRooms([]);
    }
  }, [open, initialValues]);

  const hostOptions = useMemo(() => catalog?.hosts ?? [], [catalog?.hosts]);
  const statusOptions = useMemo(() => catalog?.statuses ?? [], [catalog?.statuses]);
  const accessOptions = useMemo(() => catalog?.accessLevels ?? [], [catalog?.accessLevels]);
  const visibilityOptions = useMemo(() => catalog?.visibilities ?? [], [catalog?.visibilities]);
  const matchingOptions = useMemo(() => catalog?.matchingStrategies ?? [], [catalog?.matchingStrategies]);
  const workspaceOptions = useMemo(() => catalog?.workspaces ?? [], [catalog?.workspaces]);

  const updateField = (field, value) => {
    setFormState((current) => ({ ...current, [field]: value }));
  };

  const updateRoom = (index, patch) => {
    setRooms((current) => {
      const next = [...current];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  };

  const addRoom = () => {
    setRooms((current) => [...current, { ...DEFAULT_ROOM }]);
  };

  const removeRoom = (index) => {
    setRooms((current) => current.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!formState.title?.trim()) {
      setErrors({ title: 'Title is required.' });
      return;
    }
    setErrors({});
    const normalizeText = (value) => {
      if (value == null) {
        return '';
      }
      return `${value}`.trim();
    };
    const optionalText = (value) => {
      const trimmed = normalizeText(value);
      return trimmed.length ? trimmed : undefined;
    };
    const payload = {
      ...formState,
      title: normalizeText(formState.title),
      description: optionalText(formState.description),
      instructions: optionalText(formState.instructions),
      meetingProvider: optionalText(formState.meetingProvider),
      lobbyUrl: optionalText(formState.lobbyUrl),
      meetingUrl: optionalText(formState.meetingUrl),
      capacity: formState.capacity ? Number(formState.capacity) : undefined,
      roundDurationSeconds: formState.roundDurationSeconds ? Number(formState.roundDurationSeconds) : undefined,
      totalRounds: formState.totalRounds ? Number(formState.totalRounds) : undefined,
      bufferSeconds: formState.bufferSeconds ? Number(formState.bufferSeconds) : undefined,
      hostId: formState.hostId ? Number(formState.hostId) : undefined,
      adminOwnerId: formState.adminOwnerId ? Number(formState.adminOwnerId) : undefined,
      workspaceId: formState.workspaceId ? Number(formState.workspaceId) : undefined,
      tags: toTags(formState.tags),
      rooms: rooms.map((room) => ({
        id: room.id,
        name: normalizeText(room.name),
        topic: optionalText(room.topic) ?? null,
        capacity: room.capacity ? Number(room.capacity) : null,
        facilitatorId: room.facilitatorId ? Number(room.facilitatorId) : null,
        meetingUrl: optionalText(room.meetingUrl) ?? null,
        rotationIntervalSeconds: room.rotationIntervalSeconds ? Number(room.rotationIntervalSeconds) : null,
        instructions: optionalText(room.instructions) ?? null,
      })),
    };
    onSubmit(payload);
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={busy ? () => {} : onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-3xl">
                  <form onSubmit={handleSubmit} className="flex h-full flex-col overflow-y-auto bg-white shadow-xl">
                    <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                      <div>
                        <Dialog.Title className="text-lg font-semibold text-slate-900">
                          {mode === 'create' ? 'Create speed networking session' : 'Update session'}
                        </Dialog.Title>
                        <p className="text-sm text-slate-500">Configure lobby rules, rotation cadence, and facilitation roles.</p>
                      </div>
                      <button
                        type="button"
                        onClick={onClose}
                        disabled={busy}
                        className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Close
                      </button>
                    </div>

                    <div className="flex-1 space-y-8 px-6 py-6">
                      <div className="grid gap-6 md:grid-cols-2">
                        <label className="flex flex-col gap-2 md:col-span-2">
                          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Title</span>
                          <input
                            type="text"
                            value={formState.title}
                            onChange={(event) => updateField('title', event.target.value)}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                          />
                          {errors.title ? <span className="text-xs text-rose-600">{errors.title}</span> : null}
                        </label>
                        <label className="flex flex-col gap-2 md:col-span-2">
                          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Description</span>
                          <textarea
                            rows={3}
                            value={formState.description}
                            onChange={(event) => updateField('description', event.target.value)}
                            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                          />
                        </label>
                        <label className="flex flex-col gap-2">
                          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Status</span>
                          <select
                            value={formState.status}
                            onChange={(event) => updateField('status', event.target.value)}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                          >
                            {statusOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="flex flex-col gap-2">
                          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Access level</span>
                          <select
                            value={formState.accessLevel}
                            onChange={(event) => updateField('accessLevel', event.target.value)}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                          >
                            {accessOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="flex flex-col gap-2">
                          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Visibility</span>
                          <select
                            value={formState.visibility}
                            onChange={(event) => updateField('visibility', event.target.value)}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                          >
                            {visibilityOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="flex flex-col gap-2">
                          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Host</span>
                          <select
                            value={formState.hostId}
                            onChange={(event) => updateField('hostId', event.target.value)}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                          >
                            <option value="">Unassigned</option>
                            {hostOptions.map((host) => (
                              <option key={host.id} value={host.id}>
                                {host.name}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="flex flex-col gap-2">
                          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Owner</span>
                          <input
                            type="number"
                            value={formState.adminOwnerId}
                            onChange={(event) => updateField('adminOwnerId', event.target.value)}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                            placeholder="Admin user ID"
                          />
                        </label>
                        <label className="flex flex-col gap-2">
                          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Workspace</span>
                          <select
                            value={formState.workspaceId}
                            onChange={(event) => updateField('workspaceId', event.target.value)}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                          >
                            <option value="">Unassigned</option>
                            {workspaceOptions.map((workspace) => (
                              <option key={workspace.id} value={workspace.id}>
                                {workspace.name}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="flex flex-col gap-2">
                          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Capacity</span>
                          <input
                            type="number"
                            min="1"
                            value={formState.capacity}
                            onChange={(event) => updateField('capacity', event.target.value)}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                            placeholder="Attendee limit"
                          />
                        </label>
                        <label className="flex flex-col gap-2">
                          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Round duration (seconds)</span>
                          <input
                            type="number"
                            min="60"
                            value={formState.roundDurationSeconds}
                            onChange={(event) => updateField('roundDurationSeconds', event.target.value)}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                          />
                        </label>
                        <label className="flex flex-col gap-2">
                          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Rounds</span>
                          <input
                            type="number"
                            min="1"
                            value={formState.totalRounds}
                            onChange={(event) => updateField('totalRounds', event.target.value)}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                          />
                        </label>
                        <label className="flex flex-col gap-2">
                          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Buffer (seconds)</span>
                          <input
                            type="number"
                            min="0"
                            value={formState.bufferSeconds}
                            onChange={(event) => updateField('bufferSeconds', event.target.value)}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                          />
                        </label>
                        <label className="flex flex-col gap-2">
                          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Starts</span>
                          <input
                            type="datetime-local"
                            value={formState.scheduledStart}
                            onChange={(event) => updateField('scheduledStart', event.target.value)}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                          />
                        </label>
                        <label className="flex flex-col gap-2">
                          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Ends</span>
                          <input
                            type="datetime-local"
                            value={formState.scheduledEnd}
                            onChange={(event) => updateField('scheduledEnd', event.target.value)}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                          />
                        </label>
                        <label className="flex flex-col gap-2">
                          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Timezone</span>
                          <input
                            type="text"
                            value={formState.timezone}
                            onChange={(event) => updateField('timezone', event.target.value)}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                            placeholder="e.g. America/Los_Angeles"
                          />
                        </label>
                        <label className="flex flex-col gap-2">
                          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Registration closes</span>
                          <input
                            type="datetime-local"
                            value={formState.registrationCloseAt}
                            onChange={(event) => updateField('registrationCloseAt', event.target.value)}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                          />
                        </label>
                        <label className="flex flex-col gap-2">
                          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Meeting provider</span>
                          <input
                            type="text"
                            value={formState.meetingProvider}
                            onChange={(event) => updateField('meetingProvider', event.target.value)}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                            placeholder="Zoom, Teams, Meet"
                          />
                        </label>
                        <label className="flex flex-col gap-2">
                          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Lobby URL</span>
                          <input
                            type="url"
                            value={formState.lobbyUrl}
                            onChange={(event) => updateField('lobbyUrl', event.target.value)}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                            placeholder="https://"
                          />
                        </label>
                        <label className="flex flex-col gap-2">
                          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Primary meeting URL</span>
                          <input
                            type="url"
                            value={formState.meetingUrl}
                            onChange={(event) => updateField('meetingUrl', event.target.value)}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                            placeholder="https://"
                          />
                        </label>
                        <label className="flex flex-col gap-2 md:col-span-2">
                          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Participant instructions</span>
                          <textarea
                            rows={3}
                            value={formState.instructions}
                            onChange={(event) => updateField('instructions', event.target.value)}
                            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                            placeholder="Share onboarding or etiquette notes."
                          />
                        </label>
                        <label className="flex flex-col gap-2">
                          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Matching strategy</span>
                          <select
                            value={formState.matchingStrategy}
                            onChange={(event) => updateField('matchingStrategy', event.target.value)}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                          >
                            {matchingOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="flex flex-col gap-2 md:col-span-2">
                          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Tags</span>
                          <input
                            type="text"
                            value={formState.tags}
                            onChange={(event) => updateField('tags', event.target.value)}
                            placeholder="Comma separated e.g. founders,marketing"
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                          />
                        </label>
                      </div>

                      <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-slate-900">Rooms & facilitators</h3>
                            <p className="text-sm text-slate-500">Define themed rooms and rotation cadence overrides.</p>
                          </div>
                          <button
                            type="button"
                            onClick={addRoom}
                            className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                          >
                            Add room
                          </button>
                        </div>
                        {!rooms.length ? (
                          <p className="text-sm text-slate-500">No rooms configured yet. Attendees will remain in the lobby.</p>
                        ) : (
                          <div className="space-y-4">
                            {rooms.map((room, index) => (
                              <div key={index} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-sm font-semibold text-slate-900">Room {index + 1}</h4>
                                  <button
                                    type="button"
                                    onClick={() => removeRoom(index)}
                                    className="text-xs font-semibold uppercase tracking-wide text-rose-600 transition hover:text-rose-700"
                                  >
                                    Remove
                                  </button>
                                </div>
                                <div className="mt-3 grid gap-4 md:grid-cols-2">
                                  <label className="flex flex-col gap-2">
                                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Name</span>
                                    <input
                                      type="text"
                                      value={room.name}
                                      onChange={(event) => updateRoom(index, { name: event.target.value })}
                                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                                    />
                                  </label>
                                  <label className="flex flex-col gap-2">
                                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Topic</span>
                                    <input
                                      type="text"
                                      value={room.topic}
                                      onChange={(event) => updateRoom(index, { topic: event.target.value })}
                                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                                    />
                                  </label>
                                  <label className="flex flex-col gap-2">
                                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Capacity</span>
                                    <input
                                      type="number"
                                      min="1"
                                      value={room.capacity}
                                      onChange={(event) => updateRoom(index, { capacity: event.target.value })}
                                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                                    />
                                  </label>
                                  <label className="flex flex-col gap-2">
                                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Facilitator ID</span>
                                    <input
                                      type="number"
                                      value={room.facilitatorId}
                                      onChange={(event) => updateRoom(index, { facilitatorId: event.target.value })}
                                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                                      placeholder="Member ID"
                                    />
                                  </label>
                                  <label className="flex flex-col gap-2">
                                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Meeting URL</span>
                                    <input
                                      type="url"
                                      value={room.meetingUrl}
                                      onChange={(event) => updateRoom(index, { meetingUrl: event.target.value })}
                                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                                      placeholder="https://"
                                    />
                                  </label>
                                  <label className="flex flex-col gap-2">
                                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Rotation interval (seconds)</span>
                                    <input
                                      type="number"
                                      min="60"
                                      value={room.rotationIntervalSeconds}
                                      onChange={(event) => updateRoom(index, { rotationIntervalSeconds: event.target.value })}
                                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                                      placeholder="Overrides session default"
                                    />
                                  </label>
                                  <label className="flex flex-col gap-2 md:col-span-2">
                                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Room instructions</span>
                                    <textarea
                                      rows={2}
                                      value={room.instructions}
                                      onChange={(event) => updateRoom(index, { instructions: event.target.value })}
                                      className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                                    />
                                  </label>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
                      <button
                        type="submit"
                        disabled={busy}
                        className="rounded-full bg-slate-900 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {busy ? 'Saving…' : mode === 'create' ? 'Create session' : 'Save changes'}
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

SpeedNetworkingSessionDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  mode: PropTypes.oneOf(['create', 'edit']).isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  busy: PropTypes.bool,
  initialValues: PropTypes.object,
  catalog: PropTypes.shape({
    hosts: PropTypes.array,
    statuses: PropTypes.array,
    accessLevels: PropTypes.array,
    visibilities: PropTypes.array,
    matchingStrategies: PropTypes.array,
    workspaces: PropTypes.array,
  }),
};

SpeedNetworkingSessionDrawer.defaultProps = {
  busy: false,
  initialValues: null,
  catalog: null,
};
