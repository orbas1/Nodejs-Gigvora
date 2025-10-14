const stats = [
  { value: '98%', label: 'customer joy score' },
  { value: '4.8/5', label: 'average partner rating' },
  { value: '35%', label: 'faster project kickoff' },
];

const journey = [
  {
    step: '01',
    title: 'Share your vision',
    copy: 'Upload a quick brief or voice note—we translate it into a launch plan instantly.',
  },
  {
    step: '02',
    title: 'Match with the right crew',
    copy: 'Preview curated specialists with availability that mirrors your timeline.',
  },
  {
    step: '03',
    title: 'Go live together',
    copy: 'Approve milestones, celebrate wins, and keep every touchpoint secure.',
  },
];

const journeyImage =
  'https://images.unsplash.com/photo-1525182008055-f88b95ff7980?auto=format&fit=crop&w=1200&q=80';

export default function MomentumSection() {
  return (
    <section className="relative overflow-hidden bg-surfaceMuted py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(37,99,235,0.08),_transparent_65%)]" aria-hidden="true" />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-16 px-6 lg:flex-row lg:items-center lg:gap-20">
        <div className="relative w-full overflow-hidden rounded-[44px] border border-slate-200 bg-white shadow-soft">
          <img
            src={journeyImage}
            alt="Team celebrating a project launch with confetti"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-x-6 bottom-6 flex flex-wrap gap-4 rounded-3xl bg-white/90 p-4 backdrop-blur">
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col">
                <span className="text-lg font-semibold text-slate-900">{stat.value}</span>
                <span className="text-xs uppercase tracking-[0.3em] text-slate-400">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="w-full max-w-xl space-y-10">
          <div className="space-y-4">
            <span className="text-xs font-semibold uppercase tracking-[0.35em] text-accentDark">Customer journey</span>
            <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">Momentum without the noise</h2>
            <p className="text-base text-slate-600">
              Every step inside Gigvora is designed so customers and creators feel confident. No jargon, no mystery—just clarity on what happens next.
            </p>
          </div>
          <div className="space-y-6">
            {journey.map((item) => (
              <div
                key={item.step}
                className="flex flex-col gap-2 rounded-3xl border border-slate-200 bg-white/90 px-6 py-5 shadow-sm backdrop-blur transition hover:border-accent/40"
              >
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">{item.step}</span>
                <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                <p className="text-sm text-slate-600">{item.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
