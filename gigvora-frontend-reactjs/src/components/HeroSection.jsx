import { Link } from 'react-router-dom';
import { LOGO_URL } from '../constants/branding.js';

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
      <div className="absolute inset-x-0 top-0 h-full bg-[radial-gradient(circle_at_top_left,_rgba(219,234,254,0.8),_transparent_60%)]" aria-hidden="true" />
      <div className="absolute -right-12 top-16 h-64 w-64 rounded-full bg-accent/20 blur-3xl" aria-hidden="true" />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-16 px-6 pb-24 pt-24 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl space-y-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-accentSoft bg-accentSoft px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-accentDark">
            Freelance marketplace + network
          </span>
          <div className="space-y-6">
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Where top talent meets meaningful work
            </h1>
            <p className="text-lg text-slate-600">
              Gigvora pairs the depth of LinkedIn relationships with Upwork speed and Indeed scale. Hire, collaborate, and grow your community in one vibrant launchpad.
            </p>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Link
              to="/register"
              className="rounded-full bg-accent px-8 py-3 text-center text-base font-semibold text-white shadow-soft transition hover:bg-accentDark"
            >
              Create your account
            </Link>
            <Link
              to="/experience-launchpad"
              className="rounded-full border border-slate-200 px-8 py-3 text-center text-base font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
            >
              Explore the launchpad
            </Link>
          </div>
          <dl className="grid grid-cols-1 gap-6 text-sm text-slate-500 sm:grid-cols-3">
            <div>
              <dt>Talent & companies</dt>
              <dd className="mt-1 text-xl font-semibold text-slate-900">120k+</dd>
            </div>
            <div>
              <dt>Opportunities posted</dt>
              <dd className="mt-1 text-xl font-semibold text-slate-900">18k+</dd>
            </div>
            <div>
              <dt>Avg. time to match</dt>
              <dd className="mt-1 text-xl font-semibold text-slate-900">48 hrs</dd>
            </div>
          </dl>
        </div>
        <div className="w-full max-w-md">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-accent/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accentDark">Live Feed</p>
                <p className="text-sm text-slate-500">Fresh from the community</p>
              </div>
              <span className="rounded-full bg-accentSoft px-3 py-1 text-xs font-semibold text-accentDark">Trending</span>
            </div>
            <div className="mt-6 space-y-4">
              {feedHighlights.map((post) => (
                <article key={post.author} className="rounded-2xl border border-slate-200 bg-surface p-4 shadow-sm">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{post.headline}</span>
                    <span>Just now</span>
                  </div>
                  <h3 className="mt-2 text-base font-semibold text-slate-900">{post.author}</h3>
                  <p className="mt-1 text-sm text-slate-600">{post.message}</p>
                </article>
              ))}
            </div>
            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-slate-100 bg-surfaceMuted/80 px-4 py-3">
              <img src={LOGO_URL} alt="Gigvora" className="h-8 w-auto" />
              <p className="text-xs text-slate-500">Your brand presence syncs seamlessly across web and mobile.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
