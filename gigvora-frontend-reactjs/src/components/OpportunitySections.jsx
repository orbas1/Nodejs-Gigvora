import { Link } from 'react-router-dom';

const sections = [
  {
    title: 'Jobs Marketplace',
    description: 'Browse curated full-time and contract roles with transparent salary bands and hiring timelines.',
    to: '/jobs',
  },
  {
    title: 'Gig Board',
    description: 'Pitch on scoped gigs and micro-projects from agencies and founders ready to launch.',
    to: '/gigs',
  },
  {
    title: 'Project Collaborations',
    description: 'Join cross-functional teams building product, design, data, and community initiatives.',
    to: '/projects',
  },
  {
    title: 'Volunteering Opportunities',
    description: 'Give back through skill-based volunteering that amplifies causes you care about.',
    to: '/volunteering',
  },
];

export default function OpportunitySections() {
  return (
    <section className="relative overflow-hidden py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(0,245,201,0.12),_transparent_60%)]" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="mb-12 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <h2 className="text-3xl font-semibold text-white sm:text-4xl">Opportunities for every journey</h2>
            <p className="text-base text-white/70">
              Search across jobs, gigs, projects, and volunteering in a unified explorer that feels as polished as the Gigvora brand.
            </p>
          </div>
          <Link
            to="/search"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2 text-sm font-semibold text-white/80 transition hover:border-accent/60 hover:text-white"
          >
            Launch the explorer
            <span aria-hidden="true">→</span>
          </Link>
        </div>
        <div className="grid gap-6 lg:grid-cols-4">
          {sections.map((section) => (
            <Link
              key={section.title}
              to={section.to}
              className="group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 transition duration-300 hover:border-accent/50 hover:bg-white/10"
            >
              <div className="absolute -bottom-12 -right-10 h-32 w-32 rounded-full bg-accent/10 blur-3xl transition duration-300 group-hover:bg-accent/30" aria-hidden="true" />
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white group-hover:text-accent">{section.title}</h3>
                <p className="text-sm text-white/70">{section.description}</p>
              </div>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-accent/90">
                Explore {section.title.split(' ')[0]}
                <span aria-hidden="true">→</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
