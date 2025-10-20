import { Fragment, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'invited', label: 'Invited' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'archived', label: 'Archived' },
];

const FOLLOWER_POLICY_OPTIONS = [
  { value: 'open', label: 'Open enrollment' },
  { value: 'approval_required', label: 'Approval required' },
  { value: 'closed', label: 'Closed' },
];

const CONNECTION_POLICY_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'invite_only', label: 'Invite only' },
  { value: 'manual_review', label: 'Manual review' },
];

const STEPS = [
  {
    key: 'owner',
    title: 'Owner account',
    description: 'Foundational access for the agency lead.',
    icon: UserIcon,
  },
  {
    key: 'profile',
    title: 'Agency profile',
    description: 'Brand, services, and location.',
    icon: SparklesIcon,
  },
  {
    key: 'operations',
    title: 'Operations',
    description: 'Policies, contacts, and messaging.',
    icon: ShieldCheckIcon,
  },
];

function StepIndicator({ currentStep }) {
  return (
    <ol className="flex items-center justify-center gap-4">
      {STEPS.map((step, index) => {
        const isActive = index === currentStep;
        const isComplete = index < currentStep;
        const Icon = step.icon;
        return (
          <li key={step.key} className="flex flex-col items-center text-xs font-semibold text-slate-500">
            <span
              className={`mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full border-2 transition ${
                isActive
                  ? 'border-blue-500 bg-blue-50 text-blue-600 shadow'
                  : isComplete
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-600'
                  : 'border-slate-200 bg-white text-slate-400'
              }`}
            >
              {isComplete ? <CheckIcon className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
            </span>
            <span className={isActive ? 'text-blue-600' : ''}>{step.title}</span>
            <span className="mt-1 text-[11px] font-normal text-slate-400">{step.description}</span>
          </li>
        );
      })}
    </ol>
  );
}

StepIndicator.propTypes = {
  currentStep: PropTypes.number.isRequired,
};

const DEFAULT_FORM = {
  owner: {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    status: 'active',
  },
  profile: {
    name: '',
    focusArea: '',
    website: '',
    location: '',
    tagline: '',
    summary: '',
    timezone: '',
    teamSize: '',
    foundedYear: '',
    introVideoUrl: '',
    bannerUrl: '',
    avatarUrl: '',
  },
  operations: {
    services: '',
    industries: '',
    clients: '',
    primaryContactName: '',
    primaryContactEmail: '',
    primaryContactPhone: '',
    followerPolicy: 'open',
    connectionPolicy: 'open',
    autoAcceptFollowers: true,
    defaultConnectionMessage: '',
  },
};

function normaliseListInput(value) {
  if (!value) {
    return undefined;
  }
  const items = value
    .split(/\n|,/)
    .map((entry) => entry.trim())
    .filter(Boolean);
  return items.length ? items : [];
}

function buildPayload(form, mode) {
  const payload = {
    ownerFirstName: form.owner.firstName.trim(),
    ownerLastName: form.owner.lastName.trim(),
    ownerEmail: form.owner.email.trim(),
    ownerPhone: form.owner.phone.trim() || undefined,
    status: form.owner.status,
    agencyName: form.profile.name.trim(),
    focusArea: form.profile.focusArea.trim() || undefined,
    website: form.profile.website.trim() || undefined,
    location: form.profile.location.trim() || undefined,
    tagline: form.profile.tagline.trim() || undefined,
    summary: form.profile.summary.trim() || undefined,
    timezone: form.profile.timezone.trim() || undefined,
    teamSize: form.profile.teamSize.trim() ? Number(form.profile.teamSize.trim()) : undefined,
    foundedYear: form.profile.foundedYear.trim() ? Number(form.profile.foundedYear.trim()) : undefined,
    introVideoUrl: form.profile.introVideoUrl.trim() || undefined,
    bannerUrl: form.profile.bannerUrl.trim() || undefined,
    avatarUrl: form.profile.avatarUrl.trim() || undefined,
    services: normaliseListInput(form.operations.services),
    industries: normaliseListInput(form.operations.industries),
    clients: normaliseListInput(form.operations.clients),
    primaryContactName: form.operations.primaryContactName.trim() || undefined,
    primaryContactEmail: form.operations.primaryContactEmail.trim() || undefined,
    primaryContactPhone: form.operations.primaryContactPhone.trim() || undefined,
    followerPolicy: form.operations.followerPolicy,
    connectionPolicy: form.operations.connectionPolicy,
    autoAcceptFollowers: Boolean(form.operations.autoAcceptFollowers),
    defaultConnectionMessage: form.operations.defaultConnectionMessage.trim() || undefined,
  };

  if (mode === 'create') {
    payload.password = form.owner.password;
  } else if (form.owner.password) {
    payload.password = form.owner.password;
  }

  return payload;
}

function deriveInitialForm(initialValues = {}, mode = 'create') {
  const merged = JSON.parse(JSON.stringify(DEFAULT_FORM));
  const owner = initialValues.owner ?? {};
  merged.owner = {
    firstName: owner.firstName ?? '',
    lastName: owner.lastName ?? '',
    email: owner.email ?? '',
    phone: owner.phoneNumber ?? '',
    password: '',
    status: owner.status ?? 'active',
  };

  merged.profile = {
    name: initialValues.agencyName ?? '',
    focusArea: initialValues.focusArea ?? '',
    website: initialValues.website ?? '',
    location: initialValues.location ?? '',
    tagline: initialValues.tagline ?? '',
    summary: initialValues.summary ?? '',
    timezone: initialValues.profile?.timezone ?? '',
    teamSize:
      initialValues.teamSize != null && Number.isFinite(Number(initialValues.teamSize))
        ? `${initialValues.teamSize}`
        : '',
    foundedYear:
      initialValues.foundedYear != null && Number.isFinite(Number(initialValues.foundedYear))
        ? `${initialValues.foundedYear}`
        : '',
    introVideoUrl: initialValues.introVideoUrl ?? '',
    bannerUrl: initialValues.bannerUrl ?? '',
    avatarUrl: initialValues.avatarUrl ?? initialValues.profile?.avatarUrl ?? '',
  };

  merged.operations = {
    services: Array.isArray(initialValues.services) ? initialValues.services.join('\n') : '',
    industries: Array.isArray(initialValues.industries) ? initialValues.industries.join('\n') : '',
    clients: Array.isArray(initialValues.clients) ? initialValues.clients.join('\n') : '',
    primaryContactName: initialValues.primaryContact?.name ?? '',
    primaryContactEmail: initialValues.primaryContact?.email ?? '',
    primaryContactPhone: initialValues.primaryContact?.phone ?? '',
    followerPolicy: initialValues.followerPolicy ?? 'open',
    connectionPolicy: initialValues.connectionPolicy ?? 'open',
    autoAcceptFollowers: initialValues.autoAcceptFollowers !== false,
    defaultConnectionMessage: initialValues.defaultConnectionMessage ?? '',
  };

  if (mode === 'create') {
    merged.owner.password = '';
  }

  return merged;
}

export default function AgencyEditorModal({ open, mode, initialValues, saving, onClose, onSubmit }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState(() => deriveInitialForm(initialValues, mode));
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setForm(deriveInitialForm(initialValues, mode));
      setStepIndex(0);
      setError('');
    }
  }, [initialValues, mode, open]);

  const isCreateMode = mode === 'create';

  const canContinue = useMemo(() => {
    if (stepIndex === 0) {
      return (
        form.owner.firstName.trim().length > 0 &&
        form.owner.lastName.trim().length > 0 &&
        form.owner.email.trim().length > 0 &&
        (isCreateMode ? form.owner.password.trim().length >= 12 : true)
      );
    }
    if (stepIndex === 1) {
      return form.profile.name.trim().length > 0;
    }
    return true;
  }, [form, isCreateMode, stepIndex]);

  const handleOwnerChange = (field) => (event) => {
    const value = field === 'autoAcceptFollowers' ? event.target.checked : event.target.value;
    setForm((previous) => ({
      ...previous,
      owner: { ...previous.owner, [field]: value },
    }));
  };

  const handleProfileChange = (field) => (event) => {
    const value = event.target.value;
    setForm((previous) => ({
      ...previous,
      profile: { ...previous.profile, [field]: value },
    }));
  };

  const handleOperationsChange = (field) => (event) => {
    const value = field === 'autoAcceptFollowers' ? event.target.checked : event.target.value;
    setForm((previous) => ({
      ...previous,
      operations: { ...previous.operations, [field]: value },
    }));
  };

  const goNext = () => {
    if (!canContinue || saving) {
      return;
    }
    setStepIndex((index) => Math.min(index + 1, STEPS.length - 1));
  };

  const goBack = () => {
    if (saving) {
      return;
    }
    setStepIndex((index) => Math.max(index - 1, 0));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving) {
      return;
    }
    try {
      const payload = buildPayload(form, mode);
      await onSubmit?.(payload);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to save agency.');
    }
  };

  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => (saving ? null : onClose?.())}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-150"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center px-4 py-10">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-[32px] bg-white shadow-xl">
                <div className="border-b border-slate-200 px-8 py-6">
                  <Dialog.Title className="text-2xl font-semibold text-slate-900">
                    {mode === 'create' ? 'Create agency workspace' : 'Update agency workspace'}
                  </Dialog.Title>
                  <p className="mt-2 text-sm text-slate-500">
                    Provision a high-trust agency profile with full operational context—owner credentials, services, and safety
                    policies.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8 px-8 py-8">
                  <StepIndicator currentStep={stepIndex} />

                  {error ? (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
                      {error}
                    </div>
                  ) : null}

                  {stepIndex === 0 ? (
                    <div className="grid gap-6 md:grid-cols-2">
                      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                        Owner first name
                        <input
                          type="text"
                          required
                          value={form.owner.firstName}
                          onChange={handleOwnerChange('firstName')}
                          className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          placeholder="Jordan"
                          disabled={saving}
                        />
                      </label>
                      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                        Owner last name
                        <input
                          type="text"
                          required
                          value={form.owner.lastName}
                          onChange={handleOwnerChange('lastName')}
                          className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          placeholder="Rivera"
                          disabled={saving}
                        />
                      </label>
                      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                        Owner email
                        <input
                          type="email"
                          required
                          value={form.owner.email}
                          onChange={handleOwnerChange('email')}
                          className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          placeholder="owner@gigvora.agency"
                          disabled={saving}
                        />
                      </label>
                      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                        Owner phone
                        <input
                          type="tel"
                          value={form.owner.phone}
                          onChange={handleOwnerChange('phone')}
                          className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          placeholder="+1 555 000 0000"
                          disabled={saving}
                        />
                      </label>
                      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                        Account status
                        <select
                          value={form.owner.status}
                          onChange={handleOwnerChange('status')}
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          disabled={saving}
                        >
                          {STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      {isCreateMode ? (
                        <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                          Temporary password
                          <input
                            type="password"
                            required
                            minLength={12}
                            value={form.owner.password}
                            onChange={handleOwnerChange('password')}
                            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            placeholder="Minimum 12 characters"
                            disabled={saving}
                          />
                          <span className="text-xs font-medium text-slate-400">
                            A reset invitation will be issued via email after creation.
                          </span>
                        </label>
                      ) : (
                        <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                          Reset password (optional)
                          <input
                            type="password"
                            minLength={12}
                            value={form.owner.password}
                            onChange={handleOwnerChange('password')}
                            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            placeholder="Leave blank to keep existing"
                            disabled={saving}
                          />
                        </label>
                      )}
                    </div>
                  ) : null}

                  {stepIndex === 1 ? (
                    <div className="grid gap-6 md:grid-cols-2">
                      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700 md:col-span-2">
                        Agency name
                        <input
                          type="text"
                          required
                          value={form.profile.name}
                          onChange={handleProfileChange('name')}
                          className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          placeholder="Gigvora Creative Partners"
                          disabled={saving}
                        />
                      </label>
                      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                        Focus area
                        <input
                          type="text"
                          value={form.profile.focusArea}
                          onChange={handleProfileChange('focusArea')}
                          className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          placeholder="Product marketing"
                          disabled={saving}
                        />
                      </label>
                      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                        Website
                        <input
                          type="url"
                          value={form.profile.website}
                          onChange={handleProfileChange('website')}
                          className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          placeholder="https://"
                          disabled={saving}
                        />
                      </label>
                      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                        Location
                        <input
                          type="text"
                          value={form.profile.location}
                          onChange={handleProfileChange('location')}
                          className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          placeholder="Berlin, Germany"
                          disabled={saving}
                        />
                      </label>
                      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                        Timezone
                        <input
                          type="text"
                          value={form.profile.timezone}
                          onChange={handleProfileChange('timezone')}
                          className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          placeholder="Europe/Berlin"
                          disabled={saving}
                        />
                      </label>
                      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                        Tagline
                        <input
                          type="text"
                          value={form.profile.tagline}
                          onChange={handleProfileChange('tagline')}
                          className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          placeholder="Operational excellence for scaling teams"
                          disabled={saving}
                        />
                      </label>
                      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700 md:col-span-2">
                        Mission & overview
                        <textarea
                          rows={4}
                          value={form.profile.summary}
                          onChange={handleProfileChange('summary')}
                          className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          placeholder="Share your mission and differentiators."
                          disabled={saving}
                        />
                      </label>
                      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                        Team size
                        <input
                          type="number"
                          min={0}
                          value={form.profile.teamSize}
                          onChange={handleProfileChange('teamSize')}
                          className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          placeholder="24"
                          disabled={saving}
                        />
                      </label>
                      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                        Founded year
                        <input
                          type="number"
                          min={1900}
                          max={2100}
                          value={form.profile.foundedYear}
                          onChange={handleProfileChange('foundedYear')}
                          className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          placeholder="2018"
                          disabled={saving}
                        />
                      </label>
                      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                        Intro video URL
                        <input
                          type="url"
                          value={form.profile.introVideoUrl}
                          onChange={handleProfileChange('introVideoUrl')}
                          className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          placeholder="https://video.example.com/launch"
                          disabled={saving}
                        />
                      </label>
                      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                        Banner image URL
                        <input
                          type="url"
                          value={form.profile.bannerUrl}
                          onChange={handleProfileChange('bannerUrl')}
                          className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          placeholder="https://cdn.example.com/banner.jpg"
                          disabled={saving}
                        />
                      </label>
                      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                        Avatar image URL
                        <input
                          type="url"
                          value={form.profile.avatarUrl}
                          onChange={handleProfileChange('avatarUrl')}
                          className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          placeholder="https://cdn.example.com/avatar.png"
                          disabled={saving}
                        />
                      </label>
                    </div>
                  ) : null}

                  {stepIndex === 2 ? (
                    <div className="grid gap-6 md:grid-cols-2">
                      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                        Core services (one per line)
                        <textarea
                          rows={3}
                          value={form.operations.services}
                          onChange={handleOperationsChange('services')}
                          className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          placeholder={'Brand strategy\nPerformance marketing'}
                          disabled={saving}
                        />
                      </label>
                      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                        Industries served
                        <textarea
                          rows={3}
                          value={form.operations.industries}
                          onChange={handleOperationsChange('industries')}
                          className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          placeholder={'Healthcare\nFintech'}
                          disabled={saving}
                        />
                      </label>
                      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                        Signature clients
                        <textarea
                          rows={3}
                          value={form.operations.clients}
                          onChange={handleOperationsChange('clients')}
                          className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          placeholder={'Acme Inc\nNebula Labs'}
                          disabled={saving}
                        />
                      </label>
                      <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50/60 p-4">
                        <label className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-700">
                          <span>Auto accept followers</span>
                          <input
                            type="checkbox"
                            checked={form.operations.autoAcceptFollowers}
                            onChange={handleOperationsChange('autoAcceptFollowers')}
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            disabled={saving}
                          />
                        </label>
                        <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                          Follower policy
                          <select
                            value={form.operations.followerPolicy}
                            onChange={handleOperationsChange('followerPolicy')}
                            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            disabled={saving}
                          >
                            {FOLLOWER_POLICY_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                          Connection policy
                          <select
                            value={form.operations.connectionPolicy}
                            onChange={handleOperationsChange('connectionPolicy')}
                            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            disabled={saving}
                          >
                            {CONNECTION_POLICY_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                        Primary contact name
                        <input
                          type="text"
                          value={form.operations.primaryContactName}
                          onChange={handleOperationsChange('primaryContactName')}
                          className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          placeholder="Operations lead"
                          disabled={saving}
                        />
                      </label>
                      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                        Primary contact email
                        <input
                          type="email"
                          value={form.operations.primaryContactEmail}
                          onChange={handleOperationsChange('primaryContactEmail')}
                          className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          placeholder="ops@gigvora.agency"
                          disabled={saving}
                        />
                      </label>
                      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                        Primary contact phone
                        <input
                          type="tel"
                          value={form.operations.primaryContactPhone}
                          onChange={handleOperationsChange('primaryContactPhone')}
                          className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          placeholder="+1 555 123 4567"
                          disabled={saving}
                        />
                      </label>
                      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700 md:col-span-2">
                        Default connection message
                        <textarea
                          rows={3}
                          value={form.operations.defaultConnectionMessage}
                          onChange={handleOperationsChange('defaultConnectionMessage')}
                          className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          placeholder="Share how new connections should collaborate."
                          disabled={saving}
                        />
                      </label>
                    </div>
                  ) : null}

                  <div className="flex items-center justify-between border-t border-slate-200 pt-6">
                    <button
                      type="button"
                      onClick={goBack}
                      disabled={saving || stepIndex === 0}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <ArrowLeftIcon className="h-4 w-4" /> Back
                    </button>
                    {stepIndex < STEPS.length - 1 ? (
                      <button
                        type="button"
                        onClick={goNext}
                        disabled={!canContinue || saving}
                        className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                      >
                        Next <ArrowRightIcon className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={saving || !canContinue}
                        className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-2 text-sm font-semibold text-white shadow transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                      >
                        {saving ? 'Saving…' : mode === 'create' ? 'Launch agency workspace' : 'Save changes'}
                      </button>
                    )}
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

AgencyEditorModal.propTypes = {
  open: PropTypes.bool.isRequired,
  mode: PropTypes.oneOf(['create', 'edit']).isRequired,
  initialValues: PropTypes.object,
  saving: PropTypes.bool,
  onClose: PropTypes.func,
  onSubmit: PropTypes.func,
};

AgencyEditorModal.defaultProps = {
  initialValues: {},
  saving: false,
  onClose: undefined,
  onSubmit: undefined,
};

