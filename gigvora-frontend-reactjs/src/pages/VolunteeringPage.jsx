import PageHeader from '../components/PageHeader.jsx';

const roles = [
  {
    id: 1,
    title: 'Open Source Mentor',
    organization: 'Gigvora Foundation',
    commitment: '4 hrs/week',
    description: 'Support early-career developers contributing to Gigvora community tools.',
  },
  {
    id: 2,
    title: 'Career Navigator',
    organization: 'Launchpad Collective',
    commitment: '2 hrs/week',
    description: 'Coach fellows on storytelling, interview prep, and opportunity mapping.',
  },
];

export default function VolunteeringPage() {
  return (
    <section className="relative overflow-hidden py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(0,245,201,0.12),_transparent_60%)]" aria-hidden="true" />
      <div className="relative mx-auto max-w-5xl px-6">
        <PageHeader
          eyebrow="Volunteering"
          title="Give back to the Gigvora ecosystem"
          description="Share your expertise through mentorship, open source contributions, and pro bono support for mission-driven teams."
        />
        <div className="space-y-6">
          {roles.map((role) => (
            <article key={role.id} className="rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-accent/40 hover:bg-white/10">
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-white/50">
                <span>{role.organization}</span>
                <span>{role.commitment}</span>
              </div>
              <h2 className="mt-3 text-xl font-semibold text-white">{role.title}</h2>
              <p className="mt-2 text-sm text-white/70">{role.description}</p>
              <button className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2 text-xs font-semibold text-white/80 transition hover:border-accent/50 hover:text-white">
                Volunteer now <span aria-hidden="true">→</span>
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
