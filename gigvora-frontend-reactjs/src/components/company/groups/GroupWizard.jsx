import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

const ROLE_OPTIONS = [
  { value: 'owner', label: 'Owner' },
  { value: 'manager', label: 'Manager' },
  { value: 'moderator', label: 'Moderator' },
  { value: 'member', label: 'Member' },
  { value: 'guest', label: 'Guest' },
];

const DEFAULT_DETAILS = {
  name: '',
  description: '',
  visibility: 'private',
  memberPolicy: 'request',
  avatarColor: '#2563eb',
};

const DEFAULT_INVITES = [{ userId: '', role: 'member' }];

export default function GroupWizard({ onCreate, onInvite, onComplete }) {
  const [step, setStep] = useState(0);
  const [details, setDetails] = useState(DEFAULT_DETAILS);
  const [invites, setInvites] = useState(DEFAULT_INVITES);
  const [status, setStatus] = useState({ state: 'idle', message: null });
  const [createdGroup, setCreatedGroup] = useState(null);

  const canContinue = useMemo(() => {
    if (step === 0) {
      return Boolean(details.name.trim());
    }
    return true;
  }, [step, details]);

  const handleDetailsChange = (event) => {
    const { name, value } = event.target;
    setDetails((previous) => ({ ...previous, [name]: value }));
  };

  const handleInviteChange = (index, field, value) => {
    setInvites((previous) => {
      const copy = [...previous];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const addInviteRow = () => {
    setInvites((previous) => [...previous, { userId: '', role: 'member' }]);
  };

  const resetWizard = () => {
    setStep(0);
    setDetails(DEFAULT_DETAILS);
    setInvites(DEFAULT_INVITES);
    setStatus({ state: 'idle', message: null });
    setCreatedGroup(null);
  };

  const handleSubmit = async () => {
    if (!details.name.trim()) {
      setStatus({ state: 'error', message: 'Name required' });
      return;
    }
    setStatus({ state: 'loading', message: null });
    try {
      const group = await onCreate(details);
      if (group?.id) {
        const invitePayloads = invites
          .filter((invite) => invite.userId?.toString().trim())
          .map((invite) => ({
            userId: Number.parseInt(invite.userId, 10),
            role: invite.role,
            status: 'invited',
          }));
        const results = await Promise.allSettled(
          invitePayloads.map((payload) => onInvite(group.id, payload)),
        );
        const failures = results.filter((result) => result.status === 'rejected');
        const message = failures.length
          ? `Group ready. ${failures.length} invite(s) need attention.`
          : 'Group ready to use';
        setStatus({ state: failures.length ? 'error' : 'success', message });
        setCreatedGroup(group);
        setStep(2);
        onComplete?.(group);
      } else {
        setStatus({ state: 'error', message: 'Group created but missing details.' });
      }
    } catch (error) {
      setStatus({ state: 'error', message: error?.message ?? 'Unable to create group' });
    }
  };

  const renderStatus = () => {
    if (status.state === 'idle') {
      return null;
    }
    if (status.state === 'loading') {
      return <span className="text-sm font-semibold text-slate-400">Working…</span>;
    }
    if (status.state === 'success') {
      return (
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600">
          <CheckCircleIcon className="h-4 w-4" /> {status.message}
        </span>
      );
    }
    if (status.state === 'error') {
      return (
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-red-600">
          <ExclamationCircleIcon className="h-4 w-4" /> {status.message}
        </span>
      );
    }
    return null;
  };

  return (
    <div className="flex h-full flex-col gap-6 rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
        <span className={`rounded-full px-3 py-1 ${step === 0 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
          1
        </span>
        Details
        <ArrowRightIcon className="h-4 w-4 text-slate-300" />
        <span className={`rounded-full px-3 py-1 ${step === 1 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
          2
        </span>
        Invites
        <ArrowRightIcon className="h-4 w-4 text-slate-300" />
        <span className={`rounded-full px-3 py-1 ${step === 2 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
          3
        </span>
        Done
      </div>

      {step === 0 ? (
        <div className="grid flex-1 gap-4 lg:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Name</span>
            <input
              name="name"
              value={details.name}
              onChange={handleDetailsChange}
              required
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Visibility</span>
            <select
              name="visibility"
              value={details.visibility}
              onChange={handleDetailsChange}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
              <option value="secret">Secret</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Policy</span>
            <select
              name="memberPolicy"
              value={details.memberPolicy}
              onChange={handleDetailsChange}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="open">Open</option>
              <option value="request">Request</option>
              <option value="invite">Invite</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Colour</span>
            <div className="flex items-center gap-3">
              <input
                type="color"
                name="avatarColor"
                value={details.avatarColor}
                onChange={handleDetailsChange}
                className="h-10 w-16 cursor-pointer rounded-2xl border border-slate-200"
              />
              <input
                name="avatarColor"
                value={details.avatarColor}
                onChange={handleDetailsChange}
                className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </label>
          <label className="lg:col-span-2 space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Description</span>
            <textarea
              name="description"
              value={details.description}
              onChange={handleDetailsChange}
              rows={3}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="flex-1 space-y-4">
          {invites.map((invite, index) => (
            <div key={index} className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:grid-cols-5">
              <label className="sm:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">User ID</span>
                <input
                  value={invite.userId}
                  onChange={(event) => handleInviteChange(index, 'userId', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <label>
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Role</span>
                <select
                  value={invite.role}
                  onChange={(event) => handleInviteChange(index, 'role', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  {ROLE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ))}
          <button
            type="button"
            onClick={addInviteRow}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-700"
          >
            <PlusIcon className="h-4 w-4" /> Add another
          </button>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircleIcon className="h-10 w-10" />
          </span>
          <div>
            <h3 className="text-xl font-semibold text-slate-900">{createdGroup?.name ?? 'Group ready'}</h3>
            <p className="mt-1 text-sm text-slate-500">You can open the group panel to manage people and settings.</p>
          </div>
          <button
            type="button"
            onClick={resetWizard}
            className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-700"
          >
            Create another group
          </button>
        </div>
      ) : null}

      <div className="flex items-center justify-between pt-4">
        <div>{renderStatus()}</div>
        <div className="flex items-center gap-2">
          {step > 0 && step < 2 ? (
            <button
              type="button"
              onClick={() => setStep((previous) => Math.max(0, previous - 1))}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-700"
            >
              <ArrowLeftIcon className="h-4 w-4" /> Back
            </button>
          ) : null}
          {step < 1 ? (
            <button
              type="button"
              disabled={!canContinue}
              onClick={() => setStep((previous) => previous + 1)}
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Next <ArrowRightIcon className="h-4 w-4" />
            </button>
          ) : null}
          {step === 1 ? (
            <button
              type="button"
              onClick={handleSubmit}
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              Launch
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

GroupWizard.propTypes = {
  onCreate: PropTypes.func.isRequired,
  onInvite: PropTypes.func.isRequired,
  onComplete: PropTypes.func,
};

GroupWizard.defaultProps = {
  onComplete: undefined,
};
