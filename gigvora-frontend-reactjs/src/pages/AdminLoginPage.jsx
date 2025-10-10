import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LOGO_URL } from '../constants/branding.js';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    alert('Admin login submitted. 2FA flow continues.');
  };

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-white via-surfaceMuted to-blue-50 px-6 py-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(191,219,254,0.45),_transparent_65%)]" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-20 right-10 h-72 w-72 rounded-full bg-accent/25 blur-3xl" aria-hidden="true" />
      <div className="relative z-10 flex w-full max-w-4xl flex-col gap-12 lg:flex-row lg:items-start">
        <div className="flex-1 space-y-6">
          <Link to="/" className="inline-flex items-center gap-3 text-sm text-slate-500 transition hover:text-accent">
            <span aria-hidden="true">←</span> Back to Gigvora
          </Link>
          <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-soft">
            <div className="mb-8 flex flex-col items-center gap-3 text-center">
              <img src={LOGO_URL} alt="Gigvora" className="h-12" />
              <h1 className="text-3xl font-semibold text-slate-900">Admin Console</h1>
              <p className="text-sm text-slate-600">Secure access for Gigvora operations and trust &amp; safety teams.</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5 text-left">
              <div className="space-y-2">
                <label htmlFor="adminEmail" className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">
                  Admin email
                </label>
                <input
                  id="adminEmail"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  placeholder="ops@gigvora.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="adminPassword" className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">
                  Password
                </label>
                <input
                  id="adminPassword"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  placeholder="••••••••"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark"
              >
                Continue to 2FA
              </button>
            </form>
            <p className="mt-8 text-center text-xs text-slate-500">
              Having trouble? Ping the platform team at <span className="text-slate-700">ops@gigvora.com</span>.
            </p>
          </div>
        </div>
        <aside className="flex-1 space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Operational controls</h2>
          <ul className="space-y-4 text-sm text-slate-600">
            <li className="flex gap-3">
              <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-accent" aria-hidden="true" />
              <span>Monitor live feed health, moderation queues, and trust &amp; safety flags.</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-accent" aria-hidden="true" />
              <span>Approve launchpad cohorts, spotlight gigs, and manage global announcements.</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-accent" aria-hidden="true" />
              <span>Review analytics dashboards tailored for leadership visibility.</span>
            </li>
          </ul>
        </aside>
      </div>
    </section>
  );
}
