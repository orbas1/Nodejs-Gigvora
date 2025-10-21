import { Link } from 'react-router-dom';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

export function JoinCommunitySection() {
  return (
    <section className="relative overflow-hidden py-24">
      <div className="absolute inset-0 bg-gradient-to-r from-accent to-accentDark" aria-hidden="true" />
      <div className="relative mx-auto max-w-5xl rounded-[2.5rem] bg-white/10 px-8 py-16 text-center text-white shadow-[0_20px_60px_rgba(15,23,42,0.25)] backdrop-blur">
        <h2 className="text-3xl font-semibold sm:text-4xl">Ready to join the professional community?</h2>
        <p className="mt-4 text-base text-white/85">
          Start in minutes. Bring your team, invite trusted partners, and discover specialists ready to work alongside you.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            to="/register"
            className="inline-flex items-center justify-center rounded-full bg-white px-8 py-3 text-base font-semibold text-accent transition hover:-translate-y-0.5 hover:bg-white/90"
          >
            Claim your seat
          </Link>
          <Link
            to="/blog"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/60 px-8 py-3 text-base font-semibold text-white/90 transition hover:border-white hover:text-white"
          >
            Explore insights
            <ArrowRightIcon className="h-5 w-5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
