import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import useSession from '../hooks/useSession.js';
import { registerCompany, registerAgency } from '../services/auth.js';
import apiClient from '../services/apiClient.js';

const initialState = {
  companyName: '',
  website: '',
  focusArea: '',
  contactName: '',
  email: '',
  teamSize: '',
  location: '',
  password: '',
  confirmPassword: '',
  twoFactorEnabled: true,
};

const partnershipPillars = [
  'Publish roles, gigs, and launchpad challenges with beautiful employer branding.',
  'Manage inbound talent pipelines with collaborative scoring and tags.',
  'Co-create private groups and showcase company culture to the Gigvora community.',
];

export default function CompanyRegisterPage() {
  const [form, setForm] = useState(initialState);
  const [type, setType] = useState('company');
  const [confirmation, setConfirmation] = useState(null);
  const { isAuthenticated, session, login, updateSession } = useSession();
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const membershipLabel = useMemo(() => (type === 'company' ? 'Company' : 'Agency'), [type]);

  const handleSubmit = (event) => {
    event.preventDefault();

    const trimmedName = form.companyName.trim();
    const trimmedContact = form.contactName.trim();
    const resolvedName = trimmedName || `${membershipLabel} workspace`;
    const resolvedContact = trimmedContact || 'Gigvora partner lead';
    const registrationPayload = {
      type,
      companyName: resolvedName,
      website: form.website.trim() || null,
      focusArea: form.focusArea.trim() || null,
      contactName: resolvedContact,
      email: form.email.trim() || null,
      teamSize: form.teamSize.trim() || null,
      location: form.location.trim() || null,
      submittedAt: new Date().toISOString(),
    };

    const normalizedMemberships = new Set([type === 'company' ? 'company' : 'agency']);

    if (isAuthenticated && session) {
      (session.memberships ?? []).forEach((membership) => normalizedMemberships.add(membership));

      const nextPayload = {
        memberships: Array.from(normalizedMemberships),
        primaryDashboard: type === 'company' ? 'company' : session.primaryDashboard ?? 'user',
        companies:
          type === 'company'
            ? Array.from(new Set([resolvedName, ...(session.companies ?? [])]))
            : session.companies ?? [],
        agencies:
          type === 'agency'
            ? Array.from(new Set([resolvedName, ...(session.agencies ?? [])]))
            : session.agencies ?? [],
        accountTypes: Array.from(new Set([...(session.accountTypes ?? []), membershipLabel])),
        latestCompanyRegistration: registrationPayload,
      };

      updateSession(nextPayload);
    } else {
      const baseAccountTypes = type === 'company' ? ['Company'] : ['Agency'];
      login({
        name: resolvedContact,
        title: 'Talent Acquisition Lead',
        avatarSeed: resolvedContact,
        memberships: Array.from(normalizedMemberships),
        primaryDashboard: type === 'company' ? 'company' : 'agency',
        companies: type === 'company' ? [resolvedName] : [],
        agencies: type === 'agency' ? [resolvedName] : [],
        accountTypes: baseAccountTypes,
        registrationContext: registrationPayload,
        isAuthenticated: true,
      });
    }

    setConfirmation({ name: resolvedName, type });
    setForm(initialState);
  const handleToggleTwoFactor = () => {
    setForm((prev) => ({ ...prev, twoFactorEnabled: !prev.twoFactorEnabled }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setStatus('submitting');
    setError(null);
    setSuccess(null);
    try {
      const [firstName = '', ...restName] = form.contactName.split(' ');
      const lastName = restName.join(' ');
      const payload = {
        email: form.email,
        password: form.password,
        firstName: firstName || form.contactName,
        lastName: lastName || 'Operations',
        address: form.location,
        location: form.location,
        twoFactorEnabled: form.twoFactorEnabled,
        userType: type,
        website: form.website,
        focusArea: form.focusArea,
      };
      if (type === 'company') {
        await registerCompany({
          ...payload,
          companyName: form.companyName,
        });
      } else {
        await registerAgency({
          ...payload,
          agencyName: form.companyName,
        });
      }
      setSuccess('Thanks! Your workspace is provisioned. Check your inbox for the first sign-in link and 2FA code.');
      setForm(initialState);
    } catch (submissionError) {
      if (submissionError instanceof apiClient.ApiError) {
        setError(submissionError.body?.message || submissionError.message);
      } else {
        setError(submissionError.message || 'Unable to create your workspace.');
      }
    } finally {
      setStatus('idle');
    }
  };

  return (
    <section className="relative overflow-hidden py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(191,219,254,0.4),_transparent_65%)]" aria-hidden="true" />
      <div className="absolute left-12 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-accent/20 blur-3xl" aria-hidden="true" />
      <div className="relative mx-auto max-w-5xl px-6">
        <PageHeader
          eyebrow="Partner with Gigvora"
          title={`Build your ${type === 'company' ? 'company' : 'agency'} hub`}
          description="Set up a branded home to recruit talent, post gigs, and collaborate with the Gigvora network."
          actions={(
            <div className="flex rounded-full border border-slate-200 bg-surfaceMuted p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setType('company');
                  setConfirmation(null);
                }}
                className={`flex-1 rounded-full px-4 py-2 transition ${type === 'company' ? 'bg-accent text-white' : 'text-slate-600 hover:text-accent'}`}
              >
                Company
              </button>
              <button
                type="button"
                onClick={() => {
                  setType('agency');
                  setConfirmation(null);
                }}
                className={`flex-1 rounded-full px-4 py-2 transition ${type === 'agency' ? 'bg-accent text-white' : 'text-slate-600 hover:text-accent'}`}
              >
                Agency
              </button>
            </div>
          )}
        />
        {confirmation ? (
          <div className="mt-10 overflow-hidden rounded-3xl border border-emerald-200 bg-emerald-50/70 p-6 shadow-soft backdrop-blur">
            <div className="flex flex-col gap-4 text-sm text-emerald-900 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-base font-semibold">Workspace request received</p>
                <p className="mt-1 text-sm text-emerald-800">
                  Our partnerships team will review {confirmation.name} and reach out within one business day with onboarding
                  credentials and security provisioning.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  to={confirmation.type === 'company' ? '/dashboard/company' : '/dashboard/agency'}
                  className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-emerald-700"
                >
                  {confirmation.type === 'company' ? 'Preview company hub' : 'Open agency hub'}
                </Link>
                <a
                  href="mailto:partnerships@gigvora.com"
                  className="inline-flex items-center justify-center rounded-full border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:border-emerald-300 hover:text-emerald-900"
                >
                  Contact partnerships
                </a>
              </div>
            </div>
          </div>
        ) : null}
        <div className="grid gap-10 lg:grid-cols-[1.2fr,0.8fr] lg:items-start">
          <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-slate-200 bg-white p-10 shadow-soft">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="companyName" className="text-sm font-medium text-slate-700">
                  {type === 'company' ? 'Company' : 'Agency'} name
                </label>
                <input
                  id="companyName"
                  name="companyName"
                  value={form.companyName}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="website" className="text-sm font-medium text-slate-700">
                  Website
                </label>
                <input
                  id="website"
                  name="website"
                  value={form.website}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  placeholder="https://"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label htmlFor="focusArea" className="text-sm font-medium text-slate-700">
                  Focus area / mission
                </label>
                <textarea
                  id="focusArea"
                  name="focusArea"
                  value={form.focusArea}
                  onChange={handleChange}
                  rows={3}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="contactName" className="text-sm font-medium text-slate-700">
                  Primary contact
                </label>
                <input
                  id="contactName"
                  name="contactName"
                  value={form.contactName}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-slate-700">
                  Contact email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="teamSize" className="text-sm font-medium text-slate-700">
                  Team size
                </label>
                <input
                  id="teamSize"
                  name="teamSize"
                  value={form.teamSize}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="location" className="text-sm font-medium text-slate-700">
                  HQ location
                </label>
                <input
                  id="location"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-slate-700">
                  Admin password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  placeholder="Create a strong password"
                  required
                  minLength={12}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  placeholder="Repeat password"
                  required
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-800">Enforce 2FA for administrators</p>
                <p className="text-xs text-slate-500">Security policies mirror the web and mobile dashboards.</p>
              </div>
              <button
                type="button"
                onClick={handleToggleTwoFactor}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                  form.twoFactorEnabled ? 'bg-accent' : 'bg-slate-300'
                }`}
                aria-pressed={form.twoFactorEnabled}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                    form.twoFactorEnabled ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p> : null}
            {success ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-600">{success}</p> : null}
            <button
              type="submit"
              className="w-full rounded-full bg-accent px-8 py-3 text-base font-semibold text-white shadow-soft transition hover:bg-accentDark disabled:cursor-not-allowed disabled:bg-accent/60"
              disabled={status !== 'idle'}
            >
              {status === 'submitting'
                ? 'Provisioning secure workspace…'
                : `Launch ${type === 'company' ? 'company' : 'agency'} hub`}
            </button>
          </form>
          <aside className="space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Why partners love Gigvora</h2>
            <ul className="space-y-4 text-sm text-slate-600">
              {partnershipPillars.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-accent" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="rounded-2xl border border-slate-200 bg-surfaceMuted p-5 text-sm text-slate-600">
              <p className="font-semibold text-slate-900">Dedicated success team</p>
              <p className="mt-2">
                Our concierge crew helps craft your first listings, migrate applicants, and launch branded campaigns that mirror the Gigvora aesthetic.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
