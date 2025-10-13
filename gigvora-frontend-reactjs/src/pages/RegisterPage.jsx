import { useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import { registerUser } from '../services/auth.js';
import apiClient from '../services/apiClient.js';

const initialState = {
  firstName: '',
  lastName: '',
  email: '',
  address: '',
  age: '',
  password: '',
  confirmPassword: '',
  userType: 'user',
  twoFactorEnabled: true,
};

const onboardingHighlights = [
  'Showcase your craft with a multimedia profile and featured wins.',
  'Unlock tailored feeds across jobs, gigs, projects, and volunteering.',
  'Build trusted connections with agencies, companies, and fellow talent.',
];

export default function RegisterPage() {
  const [form, setForm] = useState(initialState);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

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
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        address: form.address,
        age: form.age ? Number(form.age) : undefined,
        password: form.password,
        userType: form.userType,
        twoFactorEnabled: form.twoFactorEnabled,
      };
      await registerUser(payload);
      setSuccess('Registration complete. Check your inbox for your verification code and sign in to continue.');
      setForm(initialState);
    } catch (submissionError) {
      if (submissionError instanceof apiClient.ApiError) {
        setError(submissionError.body?.message || submissionError.message);
      } else {
        setError(submissionError.message || 'We could not create your account. Please try again.');
      }
    } finally {
      setStatus('idle');
    }
  };

  return (
    <section className="relative overflow-hidden py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(219,234,254,0.55),_transparent_65%)]" aria-hidden="true" />
      <div className="absolute -right-24 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-accent/20 blur-3xl" aria-hidden="true" />
      <div className="relative mx-auto max-w-5xl px-6">
        <PageHeader
          eyebrow="Join the community"
          title="Create your Gigvora profile"
          description="Share a few details so we can tailor the experience to your goals across freelancing, career growth, and collaboration."
        />
        <div className="grid gap-10 lg:grid-cols-[1.25fr,0.75fr] lg:items-start">
          <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-slate-200 bg-white p-10 shadow-soft">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="firstName" className="text-sm font-medium text-slate-700">
                  First name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="lastName" className="text-sm font-medium text-slate-700">
                  Last name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  required
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-slate-700">
                  Email address
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
                <label htmlFor="address" className="text-sm font-medium text-slate-700">
                  City &amp; country
                </label>
                <input
                  id="address"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="userType" className="text-sm font-medium text-slate-700">
                  Account focus
                </label>
                <select
                  id="userType"
                  name="userType"
                  value={form.userType}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                >
                  <option value="user">Career explorer</option>
                  <option value="freelancer">Freelancer</option>
                  <option value="agency">Agency</option>
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="age" className="text-sm font-medium text-slate-700">
                  Age
                </label>
                <input
                  id="age"
                  name="age"
                  type="number"
                  value={form.age}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  min="16"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-slate-700">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  required
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
                  required
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-800">Protect my account with 2FA</p>
                <p className="text-xs text-slate-500">We’ll email a code during sign-in. Authenticator apps arrive soon.</p>
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
              {status === 'submitting' ? 'Creating your profile…' : 'Create profile'}
            </button>
          </form>
          <aside className="space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">What you unlock</h2>
            <ul className="space-y-4 text-sm text-slate-600">
              {onboardingHighlights.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-accent" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="rounded-2xl border border-slate-200 bg-surfaceMuted p-5 text-sm text-slate-600">
              <p className="font-semibold text-slate-900">Create once, shine everywhere.</p>
              <p className="mt-2">
                Your Gigvora identity syncs with the mobile app and agency/company hubs so you can pitch, hire, and collaborate seamlessly.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
