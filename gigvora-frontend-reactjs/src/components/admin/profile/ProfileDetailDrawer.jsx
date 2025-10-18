import { Fragment, useEffect, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ArrowPathIcon, CheckCircleIcon, PencilSquareIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

function parseJsonInput(value) {
  if (!value) {
    return undefined;
  }
  try {
    return JSON.parse(value);
  } catch (error) {
    throw new Error('Invalid JSON provided.');
  }
}

function formatJson(value) {
  if (value == null) {
    return '';
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch (error) {
    return '';
  }
}

function ReferenceItem({ reference, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(reference);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setForm(reference);
  }, [reference]);

  const handleChange = (key, value) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await onUpdate?.(form);
      setEditing(false);
    } catch (updateError) {
      setError(updateError);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 text-sm text-slate-700">
          <div>
            <p className="font-semibold text-slate-900">{reference.referenceName}</p>
            <p className="text-xs text-slate-500">{reference.relationship || 'Relationship not set'}</p>
          </div>
          {editing ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Company
                <input
                  type="text"
                  value={form.company ?? ''}
                  onChange={(event) => handleChange('company', event.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Email
                <input
                  type="email"
                  value={form.email ?? ''}
                  onChange={(event) => handleChange('email', event.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Phone
                <input
                  type="text"
                  value={form.phone ?? ''}
                  onChange={(event) => handleChange('phone', event.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Weight
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={form.weight ?? ''}
                  onChange={(event) => handleChange('weight', event.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </label>
            </div>
          ) : null}
          <p className="text-sm text-slate-600">{reference.endorsement || 'No endorsement recorded yet.'}</p>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                reference.isVerified
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {reference.isVerified ? 'Verified' : 'Pending verification'}
            </span>
            {reference.lastInteractedAt ? (
              <span className="text-xs text-slate-500">
                Last interaction {new Date(reference.lastInteractedAt).toLocaleDateString()}
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {editing ? (
            <>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center justify-center rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
              >
                <CheckCircleIcon className="mr-1 h-4 w-4" /> Save
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-700"
              >
                <PencilSquareIcon className="mr-1 h-4 w-4" /> Edit
              </button>
              <button
                type="button"
                onClick={() => onDelete?.(reference)}
                className="text-xs font-semibold uppercase tracking-wide text-red-600 hover:text-red-700"
              >
                Remove
              </button>
            </>
          )}
        </div>
      </div>
      {error ? <p className="mt-3 text-xs text-red-600">{error.message ?? 'Could not update reference.'}</p> : null}
    </div>
  );
}

function NoteItem({ note, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ body: note.body, visibility: note.visibility, pinned: note.pinned });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setForm({ body: note.body, visibility: note.visibility, pinned: note.pinned });
  }, [note]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await onUpdate?.({ ...note, ...form });
      setEditing(false);
    } catch (updateError) {
      setError(updateError);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">
            {note.author?.firstName || note.author?.email ? (
              <span className="font-medium text-slate-700">
                {[note.author?.firstName, note.author?.lastName].filter(Boolean).join(' ') || note.author?.email}
              </span>
            ) : (
              'System'
            )}
            {note.createdAt ? ` · ${new Date(note.createdAt).toLocaleString()}` : null}
          </p>
          {editing ? (
            <textarea
              value={form.body ?? ''}
              onChange={(event) => setForm((previous) => ({ ...previous, body: event.target.value }))}
              rows={4}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          ) : (
            <p className="mt-2 text-sm text-slate-700">{note.body}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 font-semibold capitalize text-slate-600">
              {note.visibility}
            </span>
            {note.pinned ? (
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 font-semibold text-amber-700">
                Pinned
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {editing ? (
            <>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center justify-center rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
              >
                <CheckCircleIcon className="mr-1 h-4 w-4" /> Save
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-700"
              >
                <PencilSquareIcon className="mr-1 h-4 w-4" /> Edit
              </button>
              <button
                type="button"
                onClick={() => onDelete?.(note)}
                className="text-xs font-semibold uppercase tracking-wide text-red-600 hover:text-red-700"
              >
                Remove
              </button>
            </>
          )}
        </div>
      </div>
      {editing ? (
        <div className="mt-3 flex items-center gap-3 text-xs text-slate-600">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.pinned ?? false}
              onChange={(event) => setForm((previous) => ({ ...previous, pinned: event.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            Pin note
          </label>
          <select
            value={form.visibility ?? 'internal'}
            onChange={(event) => setForm((previous) => ({ ...previous, visibility: event.target.value }))}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="internal">Internal</option>
            <option value="shared">Shared</option>
          </select>
        </div>
      ) : null}
      {error ? <p className="mt-3 text-xs text-red-600">{error.message ?? 'Could not update note.'}</p> : null}
    </div>
  );
}

export default function ProfileDetailDrawer({
  open,
  profile,
  loading,
  error,
  onClose,
  onRefresh,
  onSaveProfile,
  onCreateReference,
  onUpdateReference,
  onDeleteReference,
  onCreateNote,
  onUpdateNote,
  onDeleteNote,
}) {
  const [formUser, setFormUser] = useState(null);
  const [formProfile, setFormProfile] = useState(null);
  const [membershipsInput, setMembershipsInput] = useState('');
  const [areasOfFocusText, setAreasOfFocusText] = useState('');
  const [socialLinksText, setSocialLinksText] = useState('');
  const [portfolioLinksText, setPortfolioLinksText] = useState('');
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [noteForm, setNoteForm] = useState({ body: '', visibility: 'internal', pinned: false });
  const [referenceForm, setReferenceForm] = useState({
    referenceName: '',
    relationship: '',
    company: '',
    email: '',
    phone: '',
    endorsement: '',
  });
  const [referenceError, setReferenceError] = useState(null);
  const [noteError, setNoteError] = useState(null);

  useEffect(() => {
    if (profile) {
      setFormUser({
        firstName: profile.user?.firstName ?? '',
        lastName: profile.user?.lastName ?? '',
        email: profile.user?.email ?? '',
        userType: profile.user?.userType ?? 'user',
        primaryDashboard: profile.user?.primaryDashboard ?? '',
        twoFactorEnabled: profile.user?.twoFactorEnabled ?? true,
        twoFactorMethod: profile.user?.twoFactorMethod ?? 'email',
        location: profile.user?.location ?? '',
      });
      setMembershipsInput(Array.isArray(profile.user?.memberships) ? profile.user.memberships.join(', ') : '');
      setFormProfile({
        headline: profile.profile?.headline ?? '',
        bio: profile.profile?.bio ?? '',
        missionStatement: profile.profile?.missionStatement ?? '',
        location: profile.profile?.location ?? '',
        timezone: profile.profile?.timezone ?? '',
        availabilityStatus: profile.profile?.availabilityStatus ?? 'limited',
        availableHoursPerWeek: profile.profile?.availableHoursPerWeek ?? '',
        openToRemote: profile.profile?.openToRemote ?? true,
        availabilityNotes: profile.profile?.availabilityNotes ?? '',
        profileVisibility: profile.profile?.profileVisibility ?? 'members',
        networkVisibility: profile.profile?.networkVisibility ?? 'connections',
        followersVisibility: profile.profile?.followersVisibility ?? 'connections',
        trustScore: profile.profile?.trustScore ?? '',
        profileCompletion: profile.profile?.profileCompletion ?? '',
        likesCount: profile.profile?.likesCount ?? '',
        followersCount: profile.profile?.followersCount ?? '',
        avatarUrl: profile.profile?.avatarUrl ?? '',
        avatarSeed: profile.profile?.avatarSeed ?? '',
      });
      setAreasOfFocusText(formatJson(profile.profile?.areasOfFocus));
      setSocialLinksText(formatJson(profile.profile?.socialLinks));
      setPortfolioLinksText(formatJson(profile.profile?.portfolioLinks));
      setFormError(null);
      setReferenceError(null);
      setNoteError(null);
      setNoteForm({ body: '', visibility: 'internal', pinned: false });
      setReferenceForm({
        referenceName: '',
        relationship: '',
        company: '',
        email: '',
        phone: '',
        endorsement: '',
      });
    }
  }, [profile]);

  const handleUserChange = (key, value) => {
    setFormUser((previous) => ({ ...previous, [key]: value }));
  };

  const handleProfileChange = (key, value) => {
    setFormProfile((previous) => ({ ...previous, [key]: value }));
  };

  const membershipsArray = useMemo(() => {
    return membershipsInput
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }, [membershipsInput]);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    setFormError(null);
    try {
      const payload = { user: { ...formUser, memberships: membershipsArray } };
      const profilePayload = { ...formProfile };
      const numericFields = ['trustScore', 'profileCompletion', 'likesCount', 'followersCount', 'availableHoursPerWeek'];
      numericFields.forEach((field) => {
        if (profilePayload[field] === '' || profilePayload[field] === null || profilePayload[field] === undefined) {
          delete profilePayload[field];
        } else {
          const numeric = Number(profilePayload[field]);
          if (Number.isFinite(numeric)) {
            profilePayload[field] = numeric;
          } else {
            delete profilePayload[field];
          }
        }
      });
      if (areasOfFocusText) {
        profilePayload.areasOfFocus = parseJsonInput(areasOfFocusText);
      }
      if (socialLinksText) {
        profilePayload.socialLinks = parseJsonInput(socialLinksText);
      }
      if (portfolioLinksText) {
        profilePayload.portfolioLinks = parseJsonInput(portfolioLinksText);
      }
      payload.profile = profilePayload;
      await onSaveProfile?.(payload);
    } catch (error) {
      setFormError(error);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateReference = async () => {
    if (!profile) return;
    if (!referenceForm.referenceName.trim()) {
      setReferenceError(new Error('Reference name is required.'));
      return;
    }
    setReferenceError(null);
    try {
      await onCreateReference?.(referenceForm);
      setReferenceForm({ referenceName: '', relationship: '', company: '', email: '', phone: '', endorsement: '' });
    } catch (error) {
      setReferenceError(error);
    }
  };

  const handleCreateNote = async () => {
    if (!profile) return;
    if (!noteForm.body.trim()) {
      setNoteError(new Error('Note body is required.'));
      return;
    }
    setNoteError(null);
    try {
      await onCreateNote?.(noteForm);
      setNoteForm({ body: '', visibility: 'internal', pinned: false });
    } catch (error) {
      setNoteError(error);
    }
  };

  return (
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

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in duration-200"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-4xl">
                  <div className="flex h-full flex-col overflow-y-auto bg-slate-50 shadow-xl">
                    <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
                      <div>
                        <Dialog.Title className="text-lg font-semibold text-slate-900">
                          {profile?.user?.name || 'Profile details'}
                        </Dialog.Title>
                        <p className="text-sm text-slate-600">
                          Manage account access, profile content, references, and governance notes.
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {onRefresh ? (
                          <button
                            type="button"
                            onClick={onRefresh}
                            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-blue-200 hover:text-blue-600"
                          >
                            <ArrowPathIcon className="h-5 w-5" />
                            <span className="sr-only">Refresh profile</span>
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={onClose}
                          className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-blue-200 hover:text-blue-600"
                        >
                          <XMarkIcon className="h-6 w-6" />
                          <span className="sr-only">Close</span>
                        </button>
                      </div>
                    </div>

                    {loading ? (
                      <div className="flex flex-1 items-center justify-center">
                        <div className="rounded-3xl border border-blue-200 bg-blue-50 px-6 py-4 text-sm text-blue-700">
                          Loading profile information…
                        </div>
                      </div>
                    ) : error ? (
                      <div className="flex flex-1 items-center justify-center">
                        <div className="rounded-3xl border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-700">
                          {error.message ?? 'Unable to load profile details.'}
                        </div>
                      </div>
                    ) : profile ? (
                      <div className="space-y-6 px-6 py-6">
                        <section id="profile-overview" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <h2 className="text-lg font-semibold text-slate-900">Account overview</h2>
                              <p className="text-sm text-slate-600">
                                Update contact details, dashboard defaults, and access configuration.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleSave()}
                              disabled={saving}
                              className="inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
                            >
                              <CheckCircleIcon className="mr-2 h-5 w-5" /> Save changes
                            </button>
                          </div>
                          {formError ? (
                            <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                              {formError.message ?? 'We could not save the profile. Please review your inputs.'}
                            </div>
                          ) : null}
                          <div className="mt-6 grid gap-4 md:grid-cols-2">
                            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                              First name
                              <input
                                type="text"
                                value={formUser?.firstName ?? ''}
                                onChange={(event) => handleUserChange('firstName', event.target.value)}
                                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                              />
                            </label>
                            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Last name
                              <input
                                type="text"
                                value={formUser?.lastName ?? ''}
                                onChange={(event) => handleUserChange('lastName', event.target.value)}
                                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                              />
                            </label>
                            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Email
                              <input
                                type="email"
                                value={formUser?.email ?? ''}
                                onChange={(event) => handleUserChange('email', event.target.value)}
                                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                              />
                            </label>
                            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Membership tags
                              <input
                                type="text"
                                value={membershipsInput}
                                onChange={(event) => setMembershipsInput(event.target.value)}
                                placeholder="Comma-separated tags"
                                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                              />
                            </label>
                            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Primary dashboard
                              <input
                                type="text"
                                value={formUser?.primaryDashboard ?? ''}
                                onChange={(event) => handleUserChange('primaryDashboard', event.target.value)}
                                placeholder="e.g. admin"
                                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                              />
                            </label>
                            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                              User type
                              <select
                                value={formUser?.userType ?? 'user'}
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
                            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Location
                              <input
                                type="text"
                                value={formUser?.location ?? ''}
                                onChange={(event) => handleUserChange('location', event.target.value)}
                                placeholder="City, Country"
                                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                              />
                            </label>
                            <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Two-factor authentication
                              <div className="flex items-center gap-3">
                                <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-600">
                                  <input
                                    type="checkbox"
                                    checked={formUser?.twoFactorEnabled ?? true}
                                    onChange={(event) => handleUserChange('twoFactorEnabled', event.target.checked)}
                                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  Required
                                </label>
                                <select
                                  value={formUser?.twoFactorMethod ?? 'email'}
                                  onChange={(event) => handleUserChange('twoFactorMethod', event.target.value)}
                                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                >
                                  <option value="email">Email</option>
                                  <option value="app">Authenticator app</option>
                                  <option value="sms">SMS</option>
                                </select>
                              </div>
                            </label>
                          </div>
                        </section>

                        <section id="profile-content" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                          <h2 className="text-lg font-semibold text-slate-900">Profile content</h2>
                          <p className="text-sm text-slate-600">
                            Keep the public profile accurate and welcoming. All fields update instantly across the platform.
                          </p>
                          <div className="mt-6 grid gap-4 md:grid-cols-2">
                            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Headline
                              <input
                                type="text"
                                value={formProfile?.headline ?? ''}
                                onChange={(event) => handleProfileChange('headline', event.target.value)}
                                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                              />
                            </label>
                            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Mission statement
                              <input
                                type="text"
                                value={formProfile?.missionStatement ?? ''}
                                onChange={(event) => handleProfileChange('missionStatement', event.target.value)}
                                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                              />
                            </label>
                          </div>
                          <label className="mt-4 flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Bio
                            <textarea
                              value={formProfile?.bio ?? ''}
                              onChange={(event) => handleProfileChange('bio', event.target.value)}
                              rows={4}
                              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                            />
                          </label>
                          <div className="mt-6 grid gap-4 md:grid-cols-2">
                            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Trust score
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={formProfile?.trustScore ?? ''}
                                onChange={(event) => handleProfileChange('trustScore', event.target.value)}
                                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                              />
                            </label>
                            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Profile completion
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={formProfile?.profileCompletion ?? ''}
                                onChange={(event) => handleProfileChange('profileCompletion', event.target.value)}
                                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                              />
                            </label>
                            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Likes
                              <input
                                type="number"
                                min="0"
                                value={formProfile?.likesCount ?? ''}
                                onChange={(event) => handleProfileChange('likesCount', event.target.value)}
                                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                              />
                            </label>
                            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Followers
                              <input
                                type="number"
                                min="0"
                                value={formProfile?.followersCount ?? ''}
                                onChange={(event) => handleProfileChange('followersCount', event.target.value)}
                                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                              />
                            </label>
                          </div>
                          <div className="mt-6 grid gap-4 md:grid-cols-2">
                            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Profile location
                              <input
                                type="text"
                                value={formProfile?.location ?? ''}
                                onChange={(event) => handleProfileChange('location', event.target.value)}
                                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                              />
                            </label>
                            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Timezone
                              <input
                                type="text"
                                value={formProfile?.timezone ?? ''}
                                onChange={(event) => handleProfileChange('timezone', event.target.value)}
                                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                              />
                            </label>
                          </div>
                          <div className="mt-6 grid gap-4 md:grid-cols-2">
                            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Availability status
                              <select
                                value={formProfile?.availabilityStatus ?? 'limited'}
                                onChange={(event) => handleProfileChange('availabilityStatus', event.target.value)}
                                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                              >
                                <option value="open">Open</option>
                                <option value="limited">Limited</option>
                                <option value="unavailable">Unavailable</option>
                              </select>
                            </label>
                            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Hours per week
                              <input
                                type="number"
                                min="0"
                                max="168"
                                value={formProfile?.availableHoursPerWeek ?? ''}
                                onChange={(event) => handleProfileChange('availableHoursPerWeek', event.target.value)}
                                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                              />
                            </label>
                          </div>
                          <div className="mt-4 flex items-center gap-3">
                            <label className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                              <input
                                type="checkbox"
                                checked={formProfile?.openToRemote ?? true}
                                onChange={(event) => handleProfileChange('openToRemote', event.target.checked)}
                                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                              />
                              Open to remote work
                            </label>
                            <label className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Profile visibility
                              <select
                                value={formProfile?.profileVisibility ?? 'members'}
                                onChange={(event) => handleProfileChange('profileVisibility', event.target.value)}
                                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                              >
                                <option value="public">Public</option>
                                <option value="members">Members</option>
                                <option value="connections">Connections</option>
                              </select>
                            </label>
                          </div>
                          <label className="mt-4 flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Availability notes
                            <textarea
                              value={formProfile?.availabilityNotes ?? ''}
                              onChange={(event) => handleProfileChange('availabilityNotes', event.target.value)}
                              rows={3}
                              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                            />
                          </label>
                          <div className="mt-6 grid gap-4 md:grid-cols-2">
                            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Avatar URL
                              <input
                                type="text"
                                value={formProfile?.avatarUrl ?? ''}
                                onChange={(event) => handleProfileChange('avatarUrl', event.target.value)}
                                placeholder="https://"
                                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                              />
                            </label>
                            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Avatar seed
                              <input
                                type="text"
                                value={formProfile?.avatarSeed ?? ''}
                                onChange={(event) => handleProfileChange('avatarSeed', event.target.value)}
                                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                              />
                            </label>
                          </div>
                          <div className="mt-6 grid gap-4 md:grid-cols-2">
                            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Areas of focus (JSON)
                              <textarea
                                value={areasOfFocusText}
                                onChange={(event) => setAreasOfFocusText(event.target.value)}
                                rows={4}
                                placeholder='["Product strategy", "Design"]'
                                className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                              />
                            </label>
                            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Social links (JSON)
                              <textarea
                                value={socialLinksText}
                                onChange={(event) => setSocialLinksText(event.target.value)}
                                rows={4}
                                placeholder='{"linkedin":"https://..."}'
                                className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                              />
                            </label>
                            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Portfolio links (JSON)
                              <textarea
                                value={portfolioLinksText}
                                onChange={(event) => setPortfolioLinksText(event.target.value)}
                                rows={4}
                                placeholder='[{"label":"Case study","url":"https://"}]'
                                className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                              />
                            </label>
                          </div>
                        </section>

                        <section id="profile-references" className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <h2 className="text-lg font-semibold text-slate-900">References</h2>
                              <p className="text-sm text-slate-600">Capture endorsements and trust signals from collaborators.</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <input
                                type="text"
                                placeholder="Reference name"
                                value={referenceForm.referenceName}
                                onChange={(event) => setReferenceForm((previous) => ({ ...previous, referenceName: event.target.value }))}
                                className="w-48 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                              />
                              <input
                                type="text"
                                placeholder="Relationship"
                                value={referenceForm.relationship}
                                onChange={(event) => setReferenceForm((previous) => ({ ...previous, relationship: event.target.value }))}
                                className="w-40 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                              />
                              <button
                                type="button"
                                onClick={handleCreateReference}
                                className="inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                              >
                                <PlusIcon className="mr-2 h-5 w-5" /> Add
                              </button>
                            </div>
                          </div>
                          {referenceError ? (
                            <p className="text-sm text-red-600">{referenceError.message ?? 'Unable to add reference.'}</p>
                          ) : null}
                          <div className="space-y-3">
                            {profile.references?.length ? (
                              profile.references.map((reference) => (
                                <ReferenceItem
                                  key={reference.id}
                                  reference={reference}
                                  onUpdate={(updated) => onUpdateReference?.(reference, updated)}
                                  onDelete={() => onDeleteReference?.(reference)}
                                />
                              ))
                            ) : (
                              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                                No references yet.
                              </div>
                            )}
                          </div>
                        </section>

                        <section id="profile-notes" className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                          <h2 className="text-lg font-semibold text-slate-900">Admin notes</h2>
                          <p className="text-sm text-slate-600">
                            Keep internal audit history, compliance actions, and trust reminders in one place.
                          </p>
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                              New note
                              <textarea
                                value={noteForm.body}
                                onChange={(event) => setNoteForm((previous) => ({ ...previous, body: event.target.value }))}
                                rows={3}
                                placeholder="Document approvals, escalations, or follow-ups."
                                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                              />
                            </label>
                            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                              <label className="inline-flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={noteForm.pinned ?? false}
                                  onChange={(event) => setNoteForm((previous) => ({ ...previous, pinned: event.target.checked }))}
                                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                Pin note
                              </label>
                              <select
                                value={noteForm.visibility}
                                onChange={(event) => setNoteForm((previous) => ({ ...previous, visibility: event.target.value }))}
                                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                              >
                                <option value="internal">Internal</option>
                                <option value="shared">Shared</option>
                              </select>
                              <button
                                type="button"
                                onClick={handleCreateNote}
                                className="inline-flex items-center justify-center rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
                              >
                                <PlusIcon className="mr-2 h-4 w-4" /> Log note
                              </button>
                            </div>
                            {noteError ? (
                              <p className="mt-2 text-sm text-red-600">{noteError.message ?? 'Unable to add note.'}</p>
                            ) : null}
                          </div>
                          <div className="space-y-3">
                            {profile.notes?.length ? (
                              profile.notes.map((note) => (
                                <NoteItem
                                  key={note.id}
                                  note={note}
                                  onUpdate={(updated) => onUpdateNote?.(note, updated)}
                                  onDelete={() => onDeleteNote?.(note)}
                                />
                              ))
                            ) : (
                              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                                No internal notes logged yet.
                              </div>
                            )}
                          </div>
                        </section>
                      </div>
                    ) : null}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
