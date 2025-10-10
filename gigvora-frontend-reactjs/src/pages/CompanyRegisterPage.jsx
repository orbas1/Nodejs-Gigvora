import { useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';

const initialState = {
  companyName: '',
  website: '',
  focusArea: '',
  contactName: '',
  email: '',
  teamSize: '',
  location: '',
};

const partnershipPillars = [
  'Publish roles, gigs, and launchpad challenges with beautiful employer branding.',
  'Manage inbound talent pipelines with collaborative scoring and tags.',
  'Co-create private groups and showcase company culture to the Gigvora community.',
];

export default function CompanyRegisterPage() {
  const [form, setForm] = useState(initialState);
  const [type, setType] = useState('company');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    alert(`${type} registration submitted.`);
    setForm(initialState);
  };

  return (
    <section className="relative overflow-hidden py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(0,245,201,0.12),_transparent_60%)]" aria-hidden="true" />
      <div className="absolute left-12 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-accent/10 blur-3xl" aria-hidden="true" />
      <div className="relative mx-auto max-w-5xl px-6">
        <PageHeader
          eyebrow="Partner with Gigvora"
          title={`Build your ${type === 'company' ? 'company' : 'agency'} hub`}
          description="Set up a branded home to recruit talent, post gigs, and collaborate with the Gigvora network."
          actions={(
            <div className="flex rounded-full border border-white/15 bg-slate-950/70 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setType('company')}
                className={`flex-1 rounded-full px-4 py-2 transition ${type === 'company' ? 'bg-accent text-slate-950' : 'text-white/70'}`}
              >
                Company
              </button>
              <button
                type="button"
                onClick={() => setType('agency')}
                className={`flex-1 rounded-full px-4 py-2 transition ${type === 'agency' ? 'bg-accent text-slate-950' : 'text-white/70'}`}
              >
                Agency
              </button>
            </div>
          )}
        />
        <div className="grid gap-10 lg:grid-cols-[1.2fr,0.8fr] lg:items-start">
          <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-10 shadow-2xl shadow-accent/10">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="companyName" className="text-sm font-medium text-white">
                  {type === 'company' ? 'Company' : 'Agency'} name
                </label>
                <input
                  id="companyName"
                  name="companyName"
                  value={form.companyName}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-white/15 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/40"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="website" className="text-sm font-medium text-white">
                  Website
                </label>
                <input
                  id="website"
                  name="website"
                  value={form.website}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-white/15 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/40"
                  placeholder="https://"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label htmlFor="focusArea" className="text-sm font-medium text-white">
                  Focus area / mission
                </label>
                <textarea
                  id="focusArea"
                  name="focusArea"
                  value={form.focusArea}
                  onChange={handleChange}
                  rows={3}
                  className="w-full rounded-2xl border border-white/15 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/40"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="contactName" className="text-sm font-medium text-white">
                  Primary contact
                </label>
                <input
                  id="contactName"
                  name="contactName"
                  value={form.contactName}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-white/15 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/40"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-white">
                  Contact email
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
                <label htmlFor="teamSize" className="text-sm font-medium text-white">
                  Team size
                </label>
                <input
                  id="teamSize"
                  name="teamSize"
                  value={form.teamSize}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-white/15 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/40"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="location" className="text-sm font-medium text-white">
                  HQ location
                </label>
                <input
                  id="location"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-white/15 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/40"
                />
              </div>
            </div>
            <button type="submit" className="w-full rounded-full bg-accent px-8 py-3 text-base font-semibold text-slate-950 shadow-lg shadow-accent/30 transition hover:shadow-accent/50">
              Launch {type === 'company' ? 'company' : 'agency'} hub
            </button>
          </form>
          <aside className="space-y-6 rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-900 to-slate-950 p-8">
            <h2 className="text-xl font-semibold text-white">Why partners love Gigvora</h2>
            <ul className="space-y-4 text-sm text-white/70">
              {partnershipPillars.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-accent" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-5 text-sm text-white/70">
              <p className="font-semibold text-white">Dedicated success team</p>
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
