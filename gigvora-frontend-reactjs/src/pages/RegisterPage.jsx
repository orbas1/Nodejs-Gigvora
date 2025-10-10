import { useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';

const initialState = {
  firstName: '',
  lastName: '',
  email: '',
  address: '',
  age: '',
  password: '',
  confirmPassword: '',
};

const onboardingHighlights = [
  'Showcase your craft with a multimedia profile and featured wins.',
  'Unlock tailored feeds across jobs, gigs, projects, and volunteering.',
  'Build trusted connections with agencies, companies, and fellow talent.',
];

export default function RegisterPage() {
  const [form, setForm] = useState(initialState);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    alert('Registration submitted.');
    setForm(initialState);
  };

  return (
    <section className="relative overflow-hidden py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(0,245,201,0.12),_transparent_60%)]" aria-hidden="true" />
      <div className="absolute -right-24 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-accent/10 blur-3xl" aria-hidden="true" />
      <div className="relative mx-auto max-w-5xl px-6">
        <PageHeader
          eyebrow="Join the community"
          title="Create your Gigvora profile"
          description="Share a few details so we can tailor the experience to your goals across freelancing, career growth, and collaboration."
        />
        <div className="grid gap-10 lg:grid-cols-[1.25fr,0.75fr] lg:items-start">
          <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-10 shadow-2xl shadow-accent/10">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="firstName" className="text-sm font-medium text-white">
                  First name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-white/15 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/40"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="lastName" className="text-sm font-medium text-white">
                  Last name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-white/15 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/40"
                  required
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-white">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-white/15 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/40"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="address" className="text-sm font-medium text-white">
                  City &amp; country
                </label>
                <input
                  id="address"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-white/15 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/40"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="age" className="text-sm font-medium text-white">
                  Age
                </label>
                <input
                  id="age"
                  name="age"
                  type="number"
                  value={form.age}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-white/15 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/40"
                  min="16"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-white">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-white/15 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/40"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-white">
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-white/15 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/40"
                  required
                />
              </div>
            </div>
            <button type="submit" className="w-full rounded-full bg-accent px-8 py-3 text-base font-semibold text-slate-950 shadow-lg shadow-accent/30 transition hover:shadow-accent/50">
              Create profile
            </button>
          </form>
          <aside className="space-y-6 rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-900 to-slate-950 p-8">
            <h2 className="text-xl font-semibold text-white">What you unlock</h2>
            <ul className="space-y-4 text-sm text-white/70">
              {onboardingHighlights.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-accent" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-5 text-sm text-white/70">
              <p className="font-semibold text-white">Create once, shine everywhere.</p>
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
