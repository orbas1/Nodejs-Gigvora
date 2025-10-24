import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import useSession from '../hooks/useSession.js';
import { registerAgency, registerCompany } from '../services/auth.js';
import { normaliseEmail } from '../utils/authHelpers.js';
import { passwordsMatch } from '../utils/passwordUtils.js';
import analytics from '../services/analytics.js';

export const INITIAL_FORM = {
  companyName: '',
  contactName: '',
  email: '',
  website: '',
  focusArea: '',
  teamSize: '',
  location: '',
  password: '',
  confirmPassword: '',
  twoFactorEnabled: true,
};

export const PARTNERSHIP_PILLARS = [
  'Publish roles, gigs, and launchpad challenges with polished branding.',
  'Collaborate on inbound talent pipelines with shared scoring and notes.',
  'Co-create private groups and showcase culture to the Gigvora community.',
];

export default function CompanyRegisterPage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [workspaceType, setWorkspaceType] = useState('company');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmation, setConfirmation] = useState(null);
  const { isAuthenticated, session, login, updateSession } = useSession();

  const membershipLabel = useMemo(() => (workspaceType === 'company' ? 'Company' : 'Agency'), [workspaceType]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const toggleTwoFactor = () => {
    setForm((previous) => ({ ...previous, twoFactorEnabled: !previous.twoFactorEnabled }));
  };

  const hydrateSession = (workspaceName) => {
    const membership = workspaceType === 'company' ? 'company' : 'agency';
    const nextMemberships = new Set([membership]);
    if (session?.memberships) {
      session.memberships.forEach((value) => nextMemberships.add(value));
    }

    if (isAuthenticated && session) {
      updateSession({
        memberships: Array.from(nextMemberships),
        primaryDashboard: membership,
        companies:
          workspaceType === 'company'
            ? Array.from(new Set([workspaceName, ...(session.companies ?? [])]))
            : session.companies ?? [],
        agencies:
          workspaceType === 'agency'
            ? Array.from(new Set([workspaceName, ...(session.agencies ?? [])]))
            : session.agencies ?? [],
      });
    } else {
      login({
        name: form.contactName || 'Partner lead',
        title: 'Talent Acquisition Lead',
        memberships: Array.from(nextMemberships),
        primaryDashboard: membership,
        companies: workspaceType === 'company' ? [workspaceName] : [],
        agencies: workspaceType === 'agency' ? [workspaceName] : [],
        isAuthenticated: true,
      });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (status === 'submitting') {
      return;
    }
    if (!form.companyName.trim()) {
      setError('Add the workspace or company name so we can set things up.');
      return;
    }
    if (!passwordsMatch(form.password, form.confirmPassword)) {
      setError('Passwords do not match.');
      return;
    }

    setStatus('submitting');
    setError('');
    setSuccess('');

    const payload = {
      companyName: form.companyName.trim(),
      contactName: form.contactName.trim() || 'Gigvora partner lead',
      email: normaliseEmail(form.email),
      password: form.password,
      website: form.website.trim() || undefined,
      focusArea: form.focusArea.trim() || undefined,
      location: form.location.trim() || undefined,
      teamSize: form.teamSize.trim() || undefined,
      twoFactorEnabled: form.twoFactorEnabled,
    };

    try {
      if (workspaceType === 'company') {
        await registerCompany(payload);
      } else {
        await registerAgency({ ...payload, agencyName: payload.companyName });
      }
      hydrateSession(payload.companyName);
      setConfirmation({ name: payload.companyName, type: workspaceType });
      setSuccess('Workspace requested successfully. Check your inbox for the welcome email and 2FA setup link.');
      setForm(INITIAL_FORM);
      analytics.track('partner_lead_submitted', {
        workspaceType,
        hasWebsite: Boolean(payload.website),
        teamSize: payload.teamSize || null,
      });
    } catch (submissionError) {
      setError(submissionError?.message || 'We could not create the workspace right now.');
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
          title={`Build your ${workspaceType === 'company' ? 'company' : 'agency'} hub`}
          description="Set up a branded space to recruit talent, post gigs, and collaborate with the Gigvora network."
          actions={(
            <div className="flex rounded-full border border-slate-200 bg-surfaceMuted p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setWorkspaceType('company');
                  setConfirmation(null);
                  setSuccess('');
                  setError('');
                }}
                className={`flex-1 rounded-full px-4 py-2 transition ${
                  workspaceType === 'company' ? 'bg-accent text-white' : 'text-slate-600 hover:text-accent'
                }`}
              >
                Company
              </button>
              <button
                type="button"
                onClick={() => {
                  setWorkspaceType('agency');
                  setConfirmation(null);
                  setSuccess('');
                  setError('');
                }}
                className={`flex-1 rounded-full px-4 py-2 transition ${
                  workspaceType === 'agency' ? 'bg-accent text-white' : 'text-slate-600 hover:text-accent'
                }`}
              >
                Agency
              </button>
            </div>
          )}
        />

        {confirmation ? (
          <div className="mt-10 overflow-hidden rounded-3xl border border-emerald-200 bg-emerald-50/80 p-6 shadow-soft backdrop-blur">
            <div className="grid gap-4 md:grid-cols-[1.35fr,0.65fr] md:items-center">
              <div className="space-y-3 text-sm text-emerald-900">
                <p className="text-base font-semibold">Workspace request received</p>
                <p className="text-sm text-emerald-800">
                  Our partnerships team will review {confirmation.name} and reach out within one business day with onboarding
                  credentials, security provisioning, and success planning resources tailored to your goals.
                </p>
                <ol className="space-y-2 rounded-2xl border border-emerald-200 bg-white/70 p-4 text-xs text-emerald-700">
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
                    <span>Invite core collaborators so they can complete security training before launch.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
                    <span>Prepare brand assets (logo, colour palette) for your hiring microsite and gig templates.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
                    <span>Share billing preferences so we can configure escrow, invoices, and compliance guardrails.</span>
                  </li>
                </ol>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-3">
                <Link
                  to={confirmation.type === 'company' ? '/dashboard/company' : '/dashboard/agency'}
                  className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-emerald-700"
                >
                  View dashboard
                </Link>
                <button
                  type="button"
                  onClick={() => setConfirmation(null)}
                  className="inline-flex items-center justify-center rounded-full border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:border-emerald-300 hover:text-emerald-900"
                >
                  Submit another
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_0.9fr]">
          <form className="space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-soft" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm">
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Workspace name</span>
                <input
                  name="companyName"
                  value={form.companyName}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  placeholder="Acme Labs"
                  required
                />
              </label>
              <label className="space-y-2 text-sm">
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Primary contact</span>
                <input
                  name="contactName"
                  value={form.contactName}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  placeholder="Taylor Morgan"
                />
              </label>
              <label className="space-y-2 text-sm">
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Work email</span>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  placeholder="talent@gigvora.com"
                  required
                />
              </label>
              <label className="space-y-2 text-sm">
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Website</span>
                <input
                  name="website"
                  value={form.website}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  placeholder="https://example.com"
                />
              </label>
              <label className="space-y-2 text-sm">
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Focus area</span>
                <input
                  name="focusArea"
                  value={form.focusArea}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  placeholder="Product design, growth marketing"
                />
              </label>
              <label className="space-y-2 text-sm">
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Team size</span>
                <input
                  name="teamSize"
                  value={form.teamSize}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  placeholder="25"
                />
              </label>
              <label className="space-y-2 text-sm">
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Location</span>
                <input
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  placeholder="Remote first"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm">
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Create password</span>
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  placeholder="••••••••"
                  required
                />
              </label>
              <label className="space-y-2 text-sm">
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Confirm password</span>
                <input
                  name="confirmPassword"
                  type="password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  placeholder="••••••••"
                  required
                />
              </label>
            </div>

            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <input type="checkbox" checked={form.twoFactorEnabled} onChange={toggleTwoFactor} className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent" />
              Require secure two-factor authentication for workspace admins
            </label>

            {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p> : null}
            {success ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-600">{success}</p> : null}

            <button
              type="submit"
              className="w-full rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark disabled:cursor-not-allowed disabled:bg-accent/60"
              disabled={status === 'submitting'}
            >
              {status === 'submitting' ? 'Submitting…' : `Create ${membershipLabel.toLowerCase()} workspace`}
            </button>
          </form>

          <aside className="space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
            <h2 className="text-lg font-semibold text-slate-900">What partners unlock</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              {PARTNERSHIP_PILLARS.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-xs text-slate-500">
              Already a partner? <Link to="/login" className="font-semibold text-accent hover:text-accentDark">Log in</Link> to manage your workspace.
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}
