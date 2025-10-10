import { Link } from 'react-router-dom';

const feedHighlights = [
  {
    author: 'Leo Freelancer',
    headline: 'Experience launchpad alumni',
    message: 'Shipped a fintech design system today. Open to cross-border collaborations.',
  },
  {
    author: 'Ava Founder',
    headline: 'Founder • Atlas Labs',
    message: 'Hiring a React Native lead for our next cohort. Flexible, remote-first.',
  },
  {
    author: 'Nova Agency',
    headline: 'Creative studio',
    message: 'Launching a data storytelling sprint. Looking for visual journalists and animators.',
  },
];

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(0,245,201,0.18),_transparent_55%)]" aria-hidden="true" />
      <div className="absolute -right-20 top-10 h-72 w-72 rounded-full bg-accent/20 blur-3xl" aria-hidden="true" />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-16 px-6 pb-24 pt-28 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl space-y-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-accent">
            Freelance marketplace + network
          </span>
          <div className="space-y-6">
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              Where top talent meets meaningful work
            </h1>
            <p className="text-lg text-white/75">
              Gigvora pairs the depth of LinkedIn relationships with Upwork speed and Indeed scale. Hire, collaborate, and grow your community in one vibrant launchpad.
            </p>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Link
              to="/register"
              className="rounded-full bg-accent px-8 py-3 text-center text-base font-semibold text-slate-950 shadow-lg shadow-accent/40 transition hover:shadow-accent/60"
            >
              Create your account
            </Link>
            <Link
              to="/experience-launchpad"
              className="rounded-full border border-white/15 px-8 py-3 text-center text-base font-semibold text-white/80 transition hover:border-accent/60 hover:text-white"
            >
              Explore the launchpad
            </Link>
          </div>
          <dl className="grid grid-cols-1 gap-6 text-sm text-white/60 sm:grid-cols-3">
            <div>
              <dt>Talent & companies</dt>
              <dd className="mt-1 text-xl font-semibold text-white">120k+</dd>
            </div>
            <div>
              <dt>Opportunities posted</dt>
              <dd className="mt-1 text-xl font-semibold text-white">18k+</dd>
            </div>
            <div>
              <dt>Avg. time to match</dt>
              <dd className="mt-1 text-xl font-semibold text-white">48 hrs</dd>
            </div>
          </dl>
        </div>
        <div className="w-full max-w-md">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent/80">Live Feed</p>
                <p className="text-sm text-white/60">Fresh from the community</p>
              </div>
              <span className="rounded-full bg-accent/20 px-3 py-1 text-xs font-semibold text-accent">Trending</span>
            </div>
            <div className="mt-6 space-y-4">
              {feedHighlights.map((post) => (
                <article key={post.author} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                  <div className="flex items-center justify-between text-xs text-white/50">
                    <span>{post.headline}</span>
                    <span>Just now</span>
                  </div>
                  <h3 className="mt-2 text-base font-semibold text-white">{post.author}</h3>
                  <p className="mt-1 text-sm text-white/70">{post.message}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
