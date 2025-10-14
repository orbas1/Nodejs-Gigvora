const testimonials = [
  {
    quote: 'Clients feel the polish the second they log in. It is the first marketplace that feels like a premium SaaS product.',
    author: 'Maya Chen',
    role: 'COO, Orbit Systems',
  },
  {
    quote: 'The mobile app mirrors our desktop workflow perfectly. We close approvals while commuting.',
    author: 'Issa Grant',
    role: 'Freelance Brand Strategist',
  },
  {
    quote: 'We invite partners into Gigvora because it keeps every collaboration clear, fast, and friendly.',
    author: 'Santiago Rivera',
    role: 'Managing Director, Nova Collective',
  },
];

export default function TestimonialsSection() {
  return (
    <section className="relative overflow-hidden py-24">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(219,234,254,0.45),_transparent_70%)]" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.35em] text-accentDark">Loved worldwide</span>
          <h2 className="mt-4 text-3xl font-semibold text-slate-900 sm:text-4xl">Stories from teams who ship with joy</h2>
          <p className="mt-4 text-base text-slate-600">Real feedback from customers who value clarity and connection.</p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {testimonials.map((item) => (
            <figure
              key={item.author}
              className="flex h-full flex-col justify-between rounded-[32px] border border-slate-200 bg-white/95 p-8 text-left shadow-soft transition hover:-translate-y-1 hover:border-accent/40"
            >
              <blockquote className="text-base font-medium leading-relaxed text-slate-700">“{item.quote}”</blockquote>
              <figcaption className="mt-6 space-y-1">
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
