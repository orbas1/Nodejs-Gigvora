import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Tab } from '@headlessui/react';
import { ArrowPathIcon, KeyIcon, ShieldCheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

function buildInitialForm(user) {
  if (!user) {
    return {
      firstName: '',
      lastName: '',
      email: '',
      userType: 'user',
      jobTitle: '',
      phoneNumber: '',
      status: 'active',
      location: '',
      address: '',
    };
  }
  return {
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    email: user.email ?? '',
    userType: user.userType ?? 'user',
    jobTitle: user.jobTitle ?? '',
    phoneNumber: user.phoneNumber ?? '',
    status: user.status ?? 'active',
    location: user.location ?? '',
    address: user.address ?? '',
  };
}

function humanize(value) {
  if (!value) return '';
  return value.replace(/[_-]/g, ' ').replace(/^./, (letter) => letter.toUpperCase());
}

function formatTimestamp(value) {
  if (!value) {
    return '—';
  }
  try {
    return new Date(value).toLocaleString();
  } catch (error) {
    return value;
  }
}

const TABS = [
  { id: 'profile', label: 'Profile' },
  { id: 'access', label: 'Access' },
  { id: 'security', label: 'Security' },
  { id: 'notes', label: 'Notes' },
];

const STATUS_STYLES = {
  active: 'bg-emerald-50 text-emerald-600',
  invited: 'bg-sky-50 text-sky-600',
  suspended: 'bg-amber-50 text-amber-600',
  archived: 'bg-slate-100 text-slate-500',
};

export default function UserDetailPanel({
  user,
  metadata,
  loading,
  onUpdate,
  onUpdateSecurity,
  onUpdateStatus,
  onUpdateRoles,
  onResetPassword,
  onCreateNote,
  feedback,
  onClose,
}) {
  const [tabIndex, setTabIndex] = useState(0);
  const [form, setForm] = useState(buildInitialForm(user));
  const [securityForm, setSecurityForm] = useState({
    twoFactorEnabled: user?.twoFactorEnabled !== false,
    twoFactorMethod: user?.twoFactorMethod ?? 'email',
  });
  const [statusReason, setStatusReason] = useState('');
  const [noteDraft, setNoteDraft] = useState('');
  const [pendingRoles, setPendingRoles] = useState(() => new Set(user?.roles ?? []));
  const [passwordResult, setPasswordResult] = useState(null);

  useEffect(() => {
    setForm(buildInitialForm(user));
    setSecurityForm({
      twoFactorEnabled: user?.twoFactorEnabled !== false,
      twoFactorMethod: user?.twoFactorMethod ?? 'email',
    });
    setPendingRoles(new Set(user?.roles ?? []));
    setPasswordResult(null);
    setNoteDraft('');
    setTabIndex(0);
  }, [user?.id]);

  const roleOptions = useMemo(() => {
    if (!Array.isArray(metadata?.roles) || metadata.roles.length === 0) {
      return [];
    }
    return metadata.roles.map((role) => ({ value: role, label: humanize(role) }));
  }, [metadata?.roles]);

  const statusOptions = useMemo(() => {
    if (!Array.isArray(metadata?.statuses) || metadata.statuses.length === 0) {
      return ['invited', 'active', 'suspended', 'archived'];
    }
    return metadata.statuses;
  }, [metadata?.statuses]);

  const handleFormChange = (field) => (event) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSecurityChange = (field) => (event) => {
    const value = field === 'twoFactorEnabled' ? event.target.checked : event.target.value;
    setSecurityForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleRoleToggle = (role) => {
    setPendingRoles((prev) => {
      const next = new Set(prev);
      if (next.has(role)) {
        next.delete(role);
      } else {
        next.add(role);
      }
      return next;
    });
  };

  const handleSubmitProfile = async (event) => {
    event.preventDefault();
    await onUpdate?.(form);
  };

  const handleSubmitSecurity = async (event) => {
    event.preventDefault();
    await onUpdateSecurity?.(securityForm);
  };

  const handleSubmitStatus = async (event) => {
    event.preventDefault();
    await onUpdateStatus?.({ status: form.status, reason: statusReason });
    setStatusReason('');
  };

  const handleSubmitRoles = async (event) => {
    event.preventDefault();
    await onUpdateRoles?.(Array.from(pendingRoles));
  };

  const handleResetPassword = async () => {
    const result = await onResetPassword?.();
    if (result?.password) {
      setPasswordResult(result.password);
      setTabIndex(2);
    }
  };

  const handleCreateNote = async (event) => {
    event.preventDefault();
    if (!noteDraft.trim()) {
      return;
    }
    await onCreateNote?.({ body: noteDraft.trim(), visibility: 'internal' });
    setNoteDraft('');
  };

  if (!user) {
    return (
      <div className="flex h-full items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white/70 p-8 text-sm text-slate-500">
        Select a user to manage.
      </div>
    );
  }

  const statusTone = STATUS_STYLES[user.status?.toLowerCase?.()] ?? 'bg-slate-100 text-slate-600';

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft">
      <header className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-4">
        <div className="space-y-1">
          <div className="text-lg font-semibold text-slate-900">
            {user.firstName || user.lastName ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() : user.email}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span>{user.email}</span>
            <span className={clsx('inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold uppercase', statusTone)}>
              {humanize(user.status)}
            </span>
            <span>{humanize(user.userType)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {loading && <ArrowPathIcon className="h-5 w-5 animate-spin text-slate-400" aria-hidden="true" />}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              <XMarkIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          )}
        </div>
      </header>

      <Tab.Group selectedIndex={tabIndex} onChange={setTabIndex}>
        <Tab.List className="flex gap-2 border-b border-slate-100 px-6 py-3">
          {TABS.map((tab) => (
            <Tab key={tab.id} className="focus:outline-none">
              {({ selected }) => (
                <span
                  className={clsx(
                    'inline-flex items-center rounded-full px-4 py-2 text-sm font-medium transition',
                    selected
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'border border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900',
                  )}
                >
                  {tab.label}
                </span>
              )}
            </Tab>
          ))}
        </Tab.List>

        <Tab.Panels className="flex-1 overflow-y-auto px-6 py-6">
          <Tab.Panel>
            <form onSubmit={handleSubmitProfile} className="grid gap-4 md:grid-cols-2">
              <Field label="First name">
                <input
                  type="text"
                  value={form.firstName}
                  onChange={handleFormChange('firstName')}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                />
              </Field>
              <Field label="Last name">
                <input
                  type="text"
                  value={form.lastName}
                  onChange={handleFormChange('lastName')}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                />
              </Field>
              <Field label="Email" className="md:col-span-2">
                <input
                  type="email"
                  value={form.email}
                  onChange={handleFormChange('email')}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                />
              </Field>
              <Field label="Phone">
                <input
                  type="tel"
                  value={form.phoneNumber}
                  onChange={handleFormChange('phoneNumber')}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                />
              </Field>
              <Field label="Job title">
                <input
                  type="text"
                  value={form.jobTitle}
                  onChange={handleFormChange('jobTitle')}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                />
              </Field>
              <Field label="Type">
                <select
                  value={form.userType}
                  onChange={handleFormChange('userType')}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                >
                  {(metadata?.memberships ?? ['user', 'freelancer', 'agency', 'company', 'mentor', 'headhunter', 'admin']).map((option) => (
                    <option key={option} value={option}>
                      {humanize(option)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Location" className="md:col-span-2">
                <input
                  type="text"
                  value={form.location}
                  onChange={handleFormChange('location')}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                />
              </Field>
              <Field label="Address" className="md:col-span-2">
                <textarea
                  value={form.address}
                  onChange={handleFormChange('address')}
                  rows={2}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                />
              </Field>
              <div className="md:col-span-2 flex items-center justify-between gap-3 pt-2 text-xs text-slate-500">
                <span>
                  Created {formatTimestamp(user.createdAt)} · Updated {formatTimestamp(user.updatedAt)}
                </span>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                >
                  Save
                </button>
              </div>
              {feedback?.profile && <p className="md:col-span-2 text-sm text-emerald-600">{feedback.profile}</p>}
            </form>
          </Tab.Panel>

          <Tab.Panel>
            <div className="grid gap-6 lg:grid-cols-2">
              <form onSubmit={handleSubmitStatus} className="space-y-4">
                <Field label="Status">
                  <select
                    value={form.status}
                    onChange={handleFormChange('status')}
                    className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {humanize(status)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Reason">
                  <textarea
                    value={statusReason}
                    onChange={(event) => setStatusReason(event.target.value)}
                    rows={3}
                    className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                  />
                </Field>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                >
                  Update
                </button>
                {feedback?.status && <p className="text-sm text-emerald-600">{feedback.status}</p>}
              </form>

              {roleOptions.length > 0 && (
                <form onSubmit={handleSubmitRoles} className="space-y-4">
                  <div className="grid gap-2 md:grid-cols-2">
                    {roleOptions.map((role) => (
                      <label
                        key={role.value}
                        className={clsx(
                          'flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition',
                          pendingRoles.has(role.value)
                            ? 'border-slate-900 bg-slate-900/5 text-slate-900'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300',
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={pendingRoles.has(role.value)}
                          onChange={() => handleRoleToggle(role.value)}
                          className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                        />
                        {role.label}
                      </label>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{pendingRoles.size} selected</span>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:border-slate-300 hover:text-slate-800"
                    >
                      Save roles
                    </button>
                  </div>
                  {feedback?.roles && <p className="text-sm text-emerald-600">{feedback.roles}</p>}
                </form>
              )}
            </div>
          </Tab.Panel>

          <Tab.Panel>
            <form onSubmit={handleSubmitSecurity} className="space-y-4">
              <label className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 px-4 py-3 text-sm">
                <span className="font-medium text-slate-700">Two-factor</span>
                <input
                  type="checkbox"
                  checked={securityForm.twoFactorEnabled}
                  onChange={handleSecurityChange('twoFactorEnabled')}
                  className="h-5 w-5 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                />
              </label>
              <Field label="Method">
                <select
                  value={securityForm.twoFactorMethod}
                  onChange={handleSecurityChange('twoFactorMethod')}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                >
                  <option value="email">Email</option>
                  <option value="app">Authenticator app</option>
                  <option value="sms">SMS</option>
                </select>
              </Field>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Last login {formatTimestamp(user.lastLoginAt)}</span>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:border-slate-300 hover:text-slate-800"
                >
                  Save security
                </button>
              </div>
              {feedback?.security && <p className="text-sm text-emerald-600">{feedback.security}</p>}
            </form>
            <div className="mt-8 space-y-4 rounded-2xl border border-slate-200 px-4 py-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">Password</span>
                <button
                  type="button"
                  onClick={handleResetPassword}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                >
                  <KeyIcon className="h-4 w-4" aria-hidden="true" /> Reset
                </button>
              </div>
              {passwordResult ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  <div className="flex items-center gap-2 font-semibold">
                    <ShieldCheckIcon className="h-4 w-4" aria-hidden="true" /> Temporary password
                  </div>
                  <code className="mt-2 block rounded-xl bg-white px-3 py-2 text-sm font-mono text-slate-900">{passwordResult}</code>
                </div>
              ) : (
                <p className="text-xs text-slate-500">Generate a single-use password and revoke sessions.</p>
              )}
            </div>
          </Tab.Panel>

          <Tab.Panel>
            <div className="space-y-4">
              <form onSubmit={handleCreateNote} className="space-y-3">
                <textarea
                  value={noteDraft}
                  onChange={(event) => setNoteDraft(event.target.value)}
                  rows={4}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                  placeholder="Add a note"
                />
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Visible to admins</span>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:border-slate-300 hover:text-slate-800"
                  >
                    Save note
                  </button>
                </div>
              </form>

              {Array.isArray(user.notes) && user.notes.length > 0 ? (
                <div className="space-y-3">
                  {user.notes.map((note) => (
                    <article key={note.id} className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>
                          {note.author
                            ? `${note.author.firstName ?? ''} ${note.author.lastName ?? ''}`.trim() || note.author.email
                            : 'System'}
                        </span>
                        <span>{formatTimestamp(note.createdAt)}</span>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{note.body}</p>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">No notes yet.</p>
              )}
            </div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
}

UserDetailPanel.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    email: PropTypes.string,
    status: PropTypes.string,
    userType: PropTypes.string,
    jobTitle: PropTypes.string,
    phoneNumber: PropTypes.string,
    location: PropTypes.string,
    address: PropTypes.string,
    roles: PropTypes.arrayOf(PropTypes.string),
    notes: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        body: PropTypes.string,
        createdAt: PropTypes.string,
        author: PropTypes.shape({
          firstName: PropTypes.string,
          lastName: PropTypes.string,
          email: PropTypes.string,
        }),
      }),
    ),
    createdAt: PropTypes.string,
    updatedAt: PropTypes.string,
    lastLoginAt: PropTypes.string,
  }),
  metadata: PropTypes.shape({
    roles: PropTypes.arrayOf(PropTypes.string),
    statuses: PropTypes.arrayOf(PropTypes.string),
    memberships: PropTypes.arrayOf(PropTypes.string),
  }),
  loading: PropTypes.bool,
  onUpdate: PropTypes.func,
  onUpdateSecurity: PropTypes.func,
  onUpdateStatus: PropTypes.func,
  onUpdateRoles: PropTypes.func,
  onResetPassword: PropTypes.func,
  onCreateNote: PropTypes.func,
  feedback: PropTypes.shape({
    profile: PropTypes.string,
    security: PropTypes.string,
    status: PropTypes.string,
    roles: PropTypes.string,
  }),
  onClose: PropTypes.func,
};

UserDetailPanel.defaultProps = {
  user: null,
  metadata: null,
  loading: false,
  onUpdate: undefined,
  onUpdateSecurity: undefined,
  onUpdateStatus: undefined,
  onUpdateRoles: undefined,
  onResetPassword: undefined,
  onCreateNote: undefined,
  feedback: null,
  onClose: undefined,
};

function Field({ label, className = '', children }) {
  return (
    <label className={clsx('space-y-2 text-sm text-slate-600', className)}>
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      {children}
    </label>
  );
}

Field.propTypes = {
  label: PropTypes.string.isRequired,
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
};

Field.defaultProps = {
  className: '',
};

