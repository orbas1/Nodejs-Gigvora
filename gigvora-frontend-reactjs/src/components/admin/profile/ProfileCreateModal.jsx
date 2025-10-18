import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

const DEFAULT_FORM = Object.freeze({
  user: {
    firstName: '',
    lastName: '',
    email: '',
    userType: 'user',
    memberships: '',
    primaryDashboard: 'user',
    twoFactorEnabled: true,
    twoFactorMethod: 'email',
    location: '',
  },
  profile: {
    headline: '',
    bio: '',
    missionStatement: '',
    availabilityStatus: 'limited',
    profileVisibility: 'members',
    networkVisibility: 'connections',
    followersVisibility: 'connections',
    openToRemote: true,
    avatarUrl: '',
  },
  notes: {
    body: '',
    visibility: 'internal',
    pinned: false,
  },
});

export default function ProfileCreateModal({ open, onClose, onCreate, loading, error }) {
  const [form, setForm] = useState(DEFAULT_FORM);

  useEffect(() => {
    if (open) {
      setForm(DEFAULT_FORM);
    }
  }, [open]);

  const handleUserChange = (key, value) => {
    setForm((previous) => ({ ...previous, user: { ...previous.user, [key]: value } }));
  };

  const handleProfileChange = (key, value) => {
    setForm((previous) => ({ ...previous, profile: { ...previous.profile, [key]: value } }));
  };

  const handleNoteChange = (key, value) => {
    setForm((previous) => ({ ...previous, notes: { ...previous.notes, [key]: value } }));
  };

  const membershipsArray = form.user.memberships
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!form.user.firstName || !form.user.lastName || !form.user.email) {
      return;
    }
    const payload = {
      user: {
        ...form.user,
        memberships: membershipsArray,
      },
      profile: {
        ...form.profile,
      },
    };
    if (form.notes.body.trim()) {
      payload.notes = { ...form.notes };
    }
    onCreate?.(payload);
  };

  return (
    <Transition show={open} as={Fragment}>
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
          <div className="flex min-h-full items-center justify-center px-4 py-8">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-6"
              enterTo="opacity-100 translate-y-0"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-6"
            >
              <Dialog.Panel className="w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
                <form onSubmit={handleSubmit} className="space-y-6 p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <Dialog.Title className="text-xl font-semibold text-slate-900">
                        Create new profile
                      </Dialog.Title>
                      <p className="mt-1 text-sm text-slate-600">
                        Provision an account, assign memberships, and seed the public profile in one step.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-blue-200 hover:text-blue-600"
                    >
                      <XMarkIcon className="h-6 w-6" />
                      <span className="sr-only">Close</span>
                    </button>
                  </div>

                  <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                      Account owner
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        First name
                        <input
                          type="text"
                          required
                          value={form.user.firstName}
                          onChange={(event) => handleUserChange('firstName', event.target.value)}
                          className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Last name
                        <input
                          type="text"
                          required
                          value={form.user.lastName}
                          onChange={(event) => handleUserChange('lastName', event.target.value)}
                          className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Email
                        <input
                          type="email"
                          required
                          value={form.user.email}
                          onChange={(event) => handleUserChange('email', event.target.value)}
                          className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Primary role
                        <select
                          value={form.user.userType}
                          onChange={(event) => handleUserChange('userType', event.target.value)}
                          className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        >
                          <option value="user">Member</option>
                          <option value="freelancer">Freelancer</option>
                          <option value="agency">Agency</option>
                          <option value="company">Company</option>
                          <option value="admin">Admin</option>
                        </select>
                      </label>
                    </div>
                    <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Membership tags
                      <input
                        type="text"
                        value={form.user.memberships}
                        placeholder="Comma-separated tags"
                        onChange={(event) => handleUserChange('memberships', event.target.value)}
                        className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Location
                      <input
                        type="text"
                        value={form.user.location}
                        onChange={(event) => handleUserChange('location', event.target.value)}
                        className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    </label>
                  </section>

                  <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                      Profile details
                    </h2>
                    <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Headline
                      <input
                        type="text"
                        value={form.profile.headline}
                        onChange={(event) => handleProfileChange('headline', event.target.value)}
                        className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Bio
                      <textarea
                        value={form.profile.bio}
                        onChange={(event) => handleProfileChange('bio', event.target.value)}
                        rows={3}
                        className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    </label>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Availability status
                        <select
                          value={form.profile.availabilityStatus}
                          onChange={(event) => handleProfileChange('availabilityStatus', event.target.value)}
                          className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        >
                          <option value="open">Open</option>
                          <option value="limited">Limited</option>
                          <option value="unavailable">Unavailable</option>
                        </select>
                      </label>
                      <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Avatar URL
                        <input
                          type="text"
                          value={form.profile.avatarUrl}
                          onChange={(event) => handleProfileChange('avatarUrl', event.target.value)}
                          placeholder="https://"
                          className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        />
                      </label>
                    </div>
                  </section>

                  <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Initial note</h2>
                    <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Internal note
                      <textarea
                        value={form.notes.body}
                        onChange={(event) => handleNoteChange('body', event.target.value)}
                        rows={3}
                        placeholder="Optional context for compliance or trust operations."
                        className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    </label>
                    <label className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <input
                        type="checkbox"
                        checked={form.notes.pinned}
                        onChange={(event) => handleNoteChange('pinned', event.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      Pin note to timeline
                    </label>
                  </section>

                  {error ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {error.message ?? 'We could not create the profile.'}
                    </div>
                  ) : null}

                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-blue-200 hover:text-blue-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
                    >
                      <CheckCircleIcon className="mr-2 h-5 w-5" /> Create profile
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
