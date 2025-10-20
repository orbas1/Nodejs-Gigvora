import { Fragment, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  GlobeAltIcon,
  ShareIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'invited', label: 'Invited' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'archived', label: 'Archived' },
];

const STEPS = [
  { key: 'owner', title: 'Owner account', description: 'Primary admin and billing contact.', icon: UserIcon },
  { key: 'profile', title: 'Company profile', description: 'Brand, website, and messaging.', icon: GlobeAltIcon },
  { key: 'social', title: 'Contacts & socials', description: 'Point of contact and reachability.', icon: ShareIcon },
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
  company: {
    name: '',
    website: '',
    location: '',
    tagline: '',
    description: '',
    logoUrl: '',
    bannerUrl: '',
    timezone: '',
    profileHeadline: '',
    profileMission: '',
  },
  contact: {
    email: '',
    phone: '',
  },
  socials: [
    { label: 'Website', url: '' },
    { label: 'LinkedIn', url: '' },
  ],
};

function ensureSocialRows(rows = []) {
  const sanitized = Array.isArray(rows) ? rows.filter((row) => row && typeof row === 'object') : [];
  if (sanitized.length === 0) {
    return JSON.parse(JSON.stringify(DEFAULT_FORM.socials));
  }
  return sanitized.slice(0, 6).map((row) => ({
    label: row.label ?? '',
    url: row.url ?? '',
  }));
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

  merged.company = {
    name: initialValues.companyName ?? '',
    website: initialValues.website ?? '',
    location: initialValues.location ?? '',
    tagline: initialValues.tagline ?? '',
    description: initialValues.description ?? '',
    logoUrl: initialValues.logoUrl ?? '',
    bannerUrl: initialValues.bannerUrl ?? '',
    timezone: initialValues.profile?.timezone ?? '',
    profileHeadline: initialValues.profile?.headline ?? '',
    profileMission: initialValues.profile?.missionStatement ?? '',
  };

  merged.contact = {
    email: initialValues.contactEmail ?? owner.email ?? '',
    phone: initialValues.contactPhone ?? owner.phoneNumber ?? '',
  };

  merged.socials = ensureSocialRows(initialValues.socialLinks);

  if (mode === 'create') {
    merged.owner.password = '';
  }

  return merged;
}

function buildPayload(form, mode) {
  const payload = {
    ownerFirstName: form.owner.firstName.trim(),
    ownerLastName: form.owner.lastName.trim(),
    ownerEmail: form.owner.email.trim(),
    ownerPhone: form.owner.phone.trim() || undefined,
    status: form.owner.status,
    companyName: form.company.name.trim(),
    website: form.company.website.trim() || undefined,
    location: form.company.location.trim() || undefined,
    tagline: form.company.tagline.trim() || undefined,
    description: form.company.description.trim() || undefined,
    logoUrl: form.company.logoUrl.trim() || undefined,
    bannerUrl: form.company.bannerUrl.trim() || undefined,
    profileHeadline: form.company.profileHeadline.trim() || undefined,
    profileMission: form.company.profileMission.trim() || undefined,
    timezone: form.company.timezone.trim() || undefined,
    contactEmail: form.contact.email.trim() || undefined,
    contactPhone: form.contact.phone.trim() || undefined,
    socialLinks: form.socials
      .map((link) => ({ label: link.label.trim(), url: link.url.trim() }))
      .filter((link) => link.label || link.url),
  };

  if (mode === 'create') {
    payload.password = form.owner.password;
  } else if (form.owner.password) {
    payload.password = form.owner.password;
  }

  return payload;
}

export default function CompanyEditorModal({ open, mode, initialValues, saving, onClose, onSubmit }) {
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
      return form.company.name.trim().length > 0;
    }
    return true;
  }, [form, isCreateMode, stepIndex]);

  const handleOwnerChange = (field) => (event) => {
    setForm((previous) => ({
      ...previous,
      owner: { ...previous.owner, [field]: event.target.value },
    }));
  };

  const handleCompanyChange = (field) => (event) => {
    setForm((previous) => ({
      ...previous,
      company: { ...previous.company, [field]: event.target.value },
    }));
  };

  const handleContactChange = (field) => (event) => {
    setForm((previous) => ({
      ...previous,
      contact: { ...previous.contact, [field]: event.target.value },
    }));
  };

  const handleSocialChange = (index, field) => (event) => {
    setForm((previous) => {
      const next = previous.socials.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, [field]: event.target.value } : entry,
      );
      return { ...previous, socials: next };
    });
  };

  const addSocialRow = () => {
    setForm((previous) => {
      if (previous.socials.length >= 6) {
        return previous;
      }
      return {
        ...previous,
        socials: [...previous.socials, { label: '', url: '' }],
      };
    });
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
      setError(submitError instanceof Error ? submitError.message : 'Unable to save company.');
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
                    {mode === 'create' ? 'Create company workspace' : 'Update company workspace'}
                  </Dialog.Title>
                  <p className="mt-2 text-sm text-slate-500">
                    Align enterprise stakeholders with a production-ready workspace—complete with brand presence, contact guardrails,
                    and owner-level access.
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
                          placeholder="Carter"
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
                          placeholder="owner@company.com"
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
                          placeholder="+1 555 000 1111"
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
                            Owners receive a password reset prompt on first sign-in.
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
                        Company name
                        <input
                          type="text"
                          required
                          value={form.company.name}
                          onChange={handleCompanyChange('name')}
                          className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          placeholder="Gigvora Talent Partners"
                          disabled={saving}
                        />
                      </label>
                      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                        Website
                        <input
                          type="url"
                          value={form.company.website}
                          onChange={handleCompanyChange('website')}
                          className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          placeholder="https://"
                          disabled={saving}
                        />
                      </label>
                      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                        Location
                        <input
                          type="text"
                          value={form.company.location}
                          onChange={handleCompanyChange('location')}
                          className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          placeholder="Paris, France"
                          disabled={saving}
                        />
                      </label>
                      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                        Timezone
                        <input
                          type="text"
                          value={form.company.timezone}
                          onChange={handleCompanyChange('timezone')}
                          className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          placeholder="Europe/Paris"
                          disabled={saving}
                        />
                      </label>
                      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                        Tagline
                        <input
                          type="text"
                          value={form.company.tagline}
                          onChange={handleCompanyChange('tagline')}
                          className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          placeholder="Global hiring, uncompromised quality"
                          disabled={saving}
                        />
                      </label>
                      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                        Profile headline
                        <input
                          type="text"
                          value={form.company.profileHeadline}
                          onChange={handleCompanyChange('profileHeadline')}
                          className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          placeholder="Enterprise talent marketplace"
                          disabled={saving}
                        />
                      </label>
                      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700 md:col-span-2">
                        Mission statement
                        <textarea
                          rows={4}
                          value={form.company.profileMission}
                          onChange={handleCompanyChange('profileMission')}
                          className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          placeholder="Summarise the company’s purpose and commitments."
                          disabled={saving}
                        />
                      </label>
                      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700 md:col-span-2">
                        Company overview
                        <textarea
                          rows={4}
                          value={form.company.description}
                          onChange={handleCompanyChange('description')}
                          className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          placeholder="Describe offerings, regions served, and differentiators."
                          disabled={saving}
                        />
                      </label>
                      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                        Logo URL
                        <input
                          type="url"
                          value={form.company.logoUrl}
                          onChange={handleCompanyChange('logoUrl')}
                          className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          placeholder="https://cdn.example.com/logo.png"
                          disabled={saving}
                        />
                      </label>
                      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                        Banner URL
                        <input
                          type="url"
                          value={form.company.bannerUrl}
                          onChange={handleCompanyChange('bannerUrl')}
                          className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          placeholder="https://cdn.example.com/banner.jpg"
                          disabled={saving}
                        />
                      </label>
                    </div>
                  ) : null}

                  {stepIndex === 2 ? (
                    <div className="space-y-6">
                      <div className="grid gap-6 md:grid-cols-2">
                        <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                          Primary contact email
                          <input
                            type="email"
                            value={form.contact.email}
                            onChange={handleContactChange('email')}
                            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            placeholder="hello@company.com"
                            disabled={saving}
                          />
                        </label>
                        <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                          Primary contact phone
                          <input
                            type="tel"
                            value={form.contact.phone}
                            onChange={handleContactChange('phone')}
                            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            placeholder="+1 555 321 8765"
                            disabled={saving}
                          />
                        </label>
                      </div>

                      <div className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-5">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-semibold text-slate-800">Social & discovery links</h3>
                            <p className="text-xs text-slate-500">
                              Surface go-to-market touchpoints. Leave blank to omit.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={addSocialRow}
                            className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-600"
                            disabled={saving || form.socials.length >= 6}
                          >
                            + Add link
                          </button>
                        </div>
                        <div className="mt-4 space-y-3">
                          {form.socials.map((link, index) => (
                            <div key={`social-${index}`} className="grid gap-3 md:grid-cols-[160px,1fr]">
                              <input
                                type="text"
                                value={link.label}
                                onChange={handleSocialChange(index, 'label')}
                                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                placeholder="Channel"
                                disabled={saving}
                              />
                              <input
                                type="url"
                                value={link.url}
                                onChange={handleSocialChange(index, 'url')}
                                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                placeholder="https://"
                                disabled={saving}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
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
                        {saving ? 'Saving…' : mode === 'create' ? 'Launch company workspace' : 'Save changes'}
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

CompanyEditorModal.propTypes = {
  open: PropTypes.bool.isRequired,
  mode: PropTypes.oneOf(['create', 'edit']).isRequired,
  initialValues: PropTypes.object,
  saving: PropTypes.bool,
  onClose: PropTypes.func,
  onSubmit: PropTypes.func,
};

CompanyEditorModal.defaultProps = {
  initialValues: {},
  saving: false,
  onClose: undefined,
  onSubmit: undefined,
};

