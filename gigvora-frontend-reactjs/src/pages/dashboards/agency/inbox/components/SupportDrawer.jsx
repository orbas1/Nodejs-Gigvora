import { Fragment, useEffect, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  ArrowPathIcon,
  BellSlashIcon,
  BoltIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  UserCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const SUPPORT_PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const SUPPORT_STATUSES = [
  { value: 'triage', label: 'Triage' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'waiting_on_customer', label: 'Waiting' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

const THREAD_STATES = [
  { value: 'active', label: 'Active' },
  { value: 'archived', label: 'Archived' },
  { value: 'locked', label: 'Locked' },
];

const MUTE_OPTIONS = [
  { value: '3600000', label: '1h' },
  { value: '14400000', label: '4h' },
  { value: '86400000', label: '1d' },
  { value: '604800000', label: '7d' },
];

export default function SupportDrawer({
  open,
  onClose,
  supportCase,
  thread,
  onEscalate,
  escalating,
  onAssign,
  assigning,
  onUpdateStatus,
  updatingStatus,
  onChangeState,
  stateUpdating,
  onMute,
  muting,
  onAutomationChange,
  automationSettings = {},
  onSaveAutomations,
  savingAutomations,
  workspaceMembers = [],
  error,
}) {
  const [reason, setReason] = useState('');
  const [priority, setPriority] = useState('high');
  const [assignee, setAssignee] = useState('');
  const [status, setStatus] = useState(supportCase?.status ?? 'in_progress');
  const [resolution, setResolution] = useState('');
  const [muteDuration, setMuteDuration] = useState('');

  useEffect(() => {
    setStatus(supportCase?.status ?? 'in_progress');
    setResolution(supportCase?.resolutionSummary ?? '');
  }, [supportCase?.status, supportCase?.resolutionSummary]);

  useEffect(() => {
    setPriority(supportCase?.priority ?? 'high');
  }, [supportCase?.priority]);

  useEffect(() => {
    if (supportCase?.assignedAgent?.id) {
      setAssignee(String(supportCase.assignedAgent.id));
    } else {
      setAssignee('');
    }
  }, [supportCase?.assignedAgent?.id]);

  useEffect(() => {
    if (!open) {
      setReason('');
      setPriority('high');
      setMuteDuration('');
    }
  }, [open]);

  const assignableAgents = useMemo(() => {
    return workspaceMembers.filter((member) => {
      const id = member.userId ?? member.user?.id;
      return id && member.status !== 'invited';
    });
  }, [workspaceMembers]);

  const handleAutomationToggle = (key) => {
    const next = { ...automationSettings, [key]: !automationSettings[key] };
    onAutomationChange?.(next);
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

        <div className="fixed inset-0 flex items-end justify-end">
          <Transition.Child
            as={Fragment}
            enter="transform transition ease-out duration-300"
            enterFrom="translate-x-full"
            enterTo="translate-x-0"
            leave="transform transition ease-in duration-200"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-full"
          >
            <Dialog.Panel className="h-full w-full max-w-lg overflow-hidden bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <Dialog.Title className="text-sm font-semibold text-slate-900">Support</Dialog.Title>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                  aria-label="Close"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
              <div className="flex h-full flex-col">
                <div className="flex-1 overflow-y-auto px-6 py-4">
                  <div className="grid gap-4">
                    <section className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <header className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                        <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" /> Escalate
                      </header>
                      <textarea
                        rows={3}
                        value={reason}
                        onChange={(event) => setReason(event.target.value)}
                        className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                        placeholder="Reason"
                      />
                      <select
                        value={priority}
                        onChange={(event) => setPriority(event.target.value)}
                        className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      >
                        {SUPPORT_PRIORITIES.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => onEscalate?.({ reason: reason.trim(), priority })}
                        disabled={!reason.trim() || escalating}
                        className="mt-3 inline-flex items-center gap-2 rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <BoltIcon className="h-4 w-4" /> Send
                      </button>
                    </section>

                    <section className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <header className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                        <UserCircleIcon className="h-5 w-5 text-accent" /> Assign
                      </header>
                      <select
                        value={assignee}
                        onChange={(event) => setAssignee(event.target.value)}
                        className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      >
                        <option value="">Pick agent</option>
                        {assignableAgents.map((member) => {
                          const id = member.userId ?? member.user?.id;
                          const name = member.user?.firstName || member.user?.lastName
                            ? `${member.user?.firstName ?? ''} ${member.user?.lastName ?? ''}`.trim()
                            : member.user?.email ?? 'Member';
                          return (
                            <option key={id} value={id}>
                              {name}
                            </option>
                          );
                        })}
                      </select>
                      <button
                        type="button"
                        onClick={() => assignee && onAssign?.({ agentId: Number(assignee) })}
                        disabled={!assignee || assigning}
                        className="mt-3 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <UserCircleIcon className="h-4 w-4" /> Set owner
                      </button>
                    </section>

                    <section className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <header className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                        <ShieldCheckIcon className="h-5 w-5 text-emerald-500" /> Status
                      </header>
                      <select
                        value={status}
                        onChange={(event) => setStatus(event.target.value)}
                        className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      >
                        {SUPPORT_STATUSES.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <textarea
                        rows={3}
                        value={resolution}
                        onChange={(event) => setResolution(event.target.value)}
                        className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                        placeholder="Resolution"
                      />
                      <button
                        type="button"
                        onClick={() => onUpdateStatus?.({ status, resolutionSummary: resolution })}
                        disabled={updatingStatus}
                        className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <ShieldCheckIcon className="h-4 w-4" /> Save
                      </button>
                    </section>

                    <section className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <header className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                        <ArrowPathIcon className="h-5 w-5 text-slate-500" /> Conversation
                      </header>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {THREAD_STATES.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => onChangeState?.(option.value)}
                            disabled={stateUpdating}
                            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent/40 hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <select
                          value={muteDuration}
                          onChange={(event) => setMuteDuration(event.target.value)}
                          className="flex-1 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                        >
                          <option value="">Mute</option>
                          {MUTE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => muteDuration && onMute?.(muteDuration)}
                          disabled={!muteDuration || muting}
                          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <BellSlashIcon className="h-4 w-4" /> Set
                        </button>
                      </div>
                    </section>

                    <section className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <header className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                        <BoltIcon className="h-5 w-5 text-accent" /> Automations
                      </header>
                      <div className="mt-3 space-y-3">
                        {[
                          { key: 'autoRoute', label: 'Auto route' },
                          { key: 'shareTranscript', label: 'Share transcript' },
                          { key: 'pinUrgent', label: 'Pin urgent' },
                          { key: 'enableAiDrafts', label: 'AI drafts' },
                        ].map((item) => (
                          <label key={item.key} className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm text-slate-600">
                            <span>{item.label}</span>
                            <input
                              type="checkbox"
                              checked={Boolean(automationSettings[item.key])}
                              onChange={() => handleAutomationToggle(item.key)}
                              className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
                            />
                          </label>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => onSaveAutomations?.(automationSettings)}
                        disabled={savingAutomations}
                        className="mt-3 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Save automations
                      </button>
                    </section>
                  </div>
                </div>
                {error ? (
                  <div className="border-t border-rose-200 bg-rose-50 px-6 py-3 text-center text-xs font-medium text-rose-600">{error}</div>
                ) : null}
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

