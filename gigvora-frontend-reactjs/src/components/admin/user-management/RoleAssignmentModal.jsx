import { Fragment, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import { CheckCircleIcon, InformationCircleIcon, ShieldCheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

const ROLE_PRESETS = {
  'super-admin': {
    title: 'Super admin',
    description: 'Full platform control across governance, content, finance, and security.',
    capabilities: ['Manage roles', 'Publish policies', 'Override incidents'],
  },
  'platform-admin': {
    title: 'Platform admin',
    description: 'Operational oversight for product, growth, and moderation tooling.',
    capabilities: ['Configure dashboards', 'Manage content surfaces', 'Review escalations'],
  },
  'operations-admin': {
    title: 'Operations admin',
    description: 'Trust, finance, and support workflows.',
    capabilities: ['Resolve disputes', 'Access escrow controls', 'Assign support ownership'],
  },
  'user-admin': {
    title: 'User admin',
    description: 'User management, access, and invitations.',
    capabilities: ['Invite users', 'Reset MFA', 'Suspend accounts'],
  },
};

function normaliseRoles(metadata) {
  if (!metadata) {
    return [];
  }
  if (Array.isArray(metadata.roles)) {
    return metadata.roles.map((role) => {
      const preset = ROLE_PRESETS[role] ?? {};
      return {
        id: role,
        title: preset.title ?? role.replace(/[_-]/g, ' ').replace(/^./, (letter) => letter.toUpperCase()),
        description: preset.description ?? 'Custom administrative scope.',
        capabilities: preset.capabilities ?? ['Custom permission set'],
      };
    });
  }
  if (Array.isArray(metadata.roleCatalog)) {
    return metadata.roleCatalog.map((entry) => ({
      id: entry.id ?? entry.key,
      title: entry.title ?? entry.name ?? entry.id,
      description: entry.description ?? 'Custom administrative scope.',
      capabilities: entry.capabilities ?? [],
    }));
  }
  return [];
}

export default function RoleAssignmentModal({ open, onClose, user, metadata, onSave, saving }) {
  const [selected, setSelected] = useState(() => new Set(user?.roles ?? []));
  const [note, setNote] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    setSelected(new Set(user?.roles ?? []));
    setStatusMessage('');
    setNote('');
  }, [user?.id, open]);

  useEffect(() => {
    if (!statusMessage) return undefined;
    const timeout = setTimeout(() => setStatusMessage(''), 4000);
    return () => clearTimeout(timeout);
  }, [statusMessage]);

  const roles = useMemo(() => normaliseRoles(metadata), [metadata]);

  const handleToggle = (roleId) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(roleId)) {
        next.delete(roleId);
      } else {
        next.add(roleId);
      }
      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = Array.from(selected);
    await onSave?.(payload, { note: note.trim() || undefined });
    setStatusMessage('Roles updated successfully.');
  };

  const permissionPreview = useMemo(() => {
    const selectedRoles = Array.from(selected);
    const capabilitySet = new Set();
    selectedRoles.forEach((roleId) => {
      const found = roles.find((entry) => entry.id === roleId);
      (found?.capabilities ?? []).forEach((capability) => capabilitySet.add(capability));
    });
    return Array.from(capabilitySet);
  }, [roles, selected]);

  if (!open) {
    return null;
  }

  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={saving ? () => {} : onClose}>
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
          <div className="flex min-h-full items-center justify-center px-4 py-8">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-[32px] bg-white shadow-2xl">
                <form onSubmit={handleSubmit} className="flex flex-col gap-6 p-8">
                  <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <Dialog.Title className="text-2xl font-semibold text-slate-900">Manage administrator roles</Dialog.Title>
                      <p className="mt-1 text-sm text-slate-500">
                        Configure premium governance access for {user?.firstName ?? user?.email}. Every change is logged for audit
                        readiness.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                    >
                      <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </header>

                  <section className="grid gap-4 rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Available roles</p>
                    <div className="grid gap-3 lg:grid-cols-2">
                      {roles.length === 0 ? (
                        <p className="text-sm text-slate-500">No role catalog available. Contact platform administration.</p>
                      ) : (
                        roles.map((role) => {
                          const checked = selected.has(role.id);
                          return (
                            <label
                              key={role.id}
                              className={clsx(
                                'group flex cursor-pointer flex-col gap-3 rounded-3xl border px-4 py-4 shadow-sm transition',
                                checked
                                  ? 'border-blue-300 bg-white/95 shadow-blue-100/60'
                                  : 'border-slate-200 bg-white/80 hover:border-blue-200 hover:shadow-sm',
                              )}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <span className="text-sm font-semibold text-slate-900">{role.title}</span>
                                  <p className="text-xs text-slate-500">{role.description}</p>
                                </div>
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                  checked={checked}
                                  onChange={() => handleToggle(role.id)}
                                />
                              </div>
                              <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wide text-slate-400">
                                {(role.capabilities ?? []).slice(0, 4).map((capability) => (
                                  <span key={capability} className="rounded-full bg-slate-100 px-2 py-1 font-semibold">
                                    {capability}
                                  </span>
                                ))}
                              </div>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </section>

                  <section className="rounded-3xl border border-slate-200 bg-white/95 p-5">
                    <div className="flex flex-wrap items-center gap-3">
                      <ShieldCheckIcon className="h-5 w-5 text-blue-500" aria-hidden="true" />
                      <p className="text-sm font-semibold text-slate-800">Permission preview</p>
                    </div>
                    {permissionPreview.length === 0 ? (
                      <p className="mt-3 text-sm text-slate-500">Select at least one role to view combined capabilities.</p>
                    ) : (
                      <ul className="mt-3 grid gap-2 md:grid-cols-2">
                        {permissionPreview.map((capability) => (
                          <li
                            key={capability}
                            className="flex items-start gap-2 rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-600"
                          >
                            <CheckCircleIcon className="mt-0.5 h-4 w-4 text-emerald-500" aria-hidden="true" />
                            <span>{capability}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>

                  <section className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
                    <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                      Governance note
                      <textarea
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        rows={3}
                        placeholder="Add context for the audit trail (optional)"
                        className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    </label>
                    <p className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                      <InformationCircleIcon className="h-4 w-4" aria-hidden="true" />
                      Notes are appended to the centralized governance log for transparency.
                    </p>
                  </section>

                  {statusMessage ? (
                    <div className="rounded-3xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-700">
                      {statusMessage}
                    </div>
                  ) : null}

                  <footer className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs text-slate-400">
                      {user?.email}
                      {user?.lastLoginAt ? ` • Last active ${new Date(user.lastLoginAt).toLocaleDateString()}` : ''}
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {saving ? 'Saving…' : 'Save changes'}
                      </button>
                    </div>
                  </footer>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

RoleAssignmentModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  user: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    firstName: PropTypes.string,
    email: PropTypes.string,
    roles: PropTypes.arrayOf(PropTypes.string),
    lastLoginAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
  }),
  metadata: PropTypes.shape({
    roles: PropTypes.arrayOf(PropTypes.string),
    roleCatalog: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        key: PropTypes.string,
        title: PropTypes.string,
        description: PropTypes.string,
        capabilities: PropTypes.arrayOf(PropTypes.string),
      }),
    ),
  }),
  onSave: PropTypes.func,
  saving: PropTypes.bool,
};

RoleAssignmentModal.defaultProps = {
  user: null,
  metadata: null,
  onSave: undefined,
  saving: false,
};
