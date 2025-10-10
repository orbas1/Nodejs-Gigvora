const testimonials = [
  {
    quote:
      'Gigvora helped us assemble a distributed product pod in record time. The shared workspace keeps context flowing effortlessly.',
    author: 'Maya Chen',
    role: 'Head of Product, Orbit Systems',
  },
  {
    quote:
      'As a freelancer, the launchpad sprints showcase my capabilities and connect me with founders who value craft and collaboration.',
    author: 'Issa Grant',
    role: 'Brand Strategist & Experience Launchpad mentor',
  },
  {
    quote:
      'Our agency relies on Gigvora groups to nurture community. The live feed is where new partnerships spark daily.',
    author: 'Santiago Rivera',
    role: 'Managing Director, Nova Creative',
  },
];

export default function TestimonialsSection() {
  return (
    <section className="relative overflow-hidden py-24">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(219,234,254,0.35),_transparent_70%)]" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.35em] text-accentDark">Community voices</span>
          <h2 className="mt-4 text-3xl font-semibold text-slate-900 sm:text-4xl">Stories from teams and independent builders</h2>
          <p className="mt-4 text-base text-slate-600">
            From launchpad alumni to global agencies, Gigvora fuels high-trust collaboration.
          </p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {testimonials.map((item) => (
            <figure
              key={item.author}
              className="group relative flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-soft transition duration-300 hover:-translate-y-1 hover:border-accent/50"
            >
              <blockquote className="text-sm leading-relaxed text-slate-600">“{item.quote}”</blockquote>
              <figcaption className="mt-6">
                <p className="font-semibold text-slate-900">{item.author}</p>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{item.role}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
