import { Link } from 'react-router-dom';

const sections = [
  {
    title: 'Hire talent',
    copy: 'Post a role and meet curated matches within hours.',
    to: '/jobs',
    tone: 'bg-emerald-100 text-emerald-700',
  },
  {
    title: 'Book a squad',
    copy: 'Need a team? Build pods with agencies you can trust.',
    to: '/projects',
    tone: 'bg-violet-100 text-violet-700',
  },
  {
    title: 'Offer your craft',
    copy: 'Showcase services and activate your network in minutes.',
    to: '/gigs',
    tone: 'bg-amber-100 text-amber-700',
  },
  {
    title: 'Give back',
    copy: 'Join volunteer missions that match your mission.',
    to: '/volunteering',
    tone: 'bg-sky-100 text-sky-700',
  },
];

export default function OpportunitySections() {
  return (
    <section className="relative overflow-hidden py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(37,99,235,0.12),_transparent_65%)]" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="mb-12 flex flex-col gap-4 text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.35em] text-accentDark">Choose your path</span>
          <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">Start the way that feels right</h2>
          <p className="text-base text-slate-600">
            Whether you&apos;re hiring or ready to collaborate, Gigvora gives you a front door built for speed.
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-4">
          {sections.map((section) => (
            <Link
              key={section.title}
              to={section.to}
              className="group flex h-full flex-col gap-4 rounded-[32px] border border-slate-200 bg-white p-6 text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:border-accent/50 hover:shadow-soft"
            >
              <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] ${section.tone}`}>
                {section.title}
              </span>
              <p className="text-sm text-slate-600">{section.copy}</p>
              <div className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-accent">
                Step inside
                <span aria-hidden="true">→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
