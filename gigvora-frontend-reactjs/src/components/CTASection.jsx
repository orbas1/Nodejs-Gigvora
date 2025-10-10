import { Link } from 'react-router-dom';

export default function CTASection() {
  return (
    <section className="relative overflow-hidden py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,245,201,0.12),_transparent_65%)]" aria-hidden="true" />
      <div className="absolute -left-20 top-1/2 h-56 w-56 -translate-y-1/2 rounded-full bg-accent/10 blur-3xl" aria-hidden="true" />
      <div className="relative mx-auto max-w-4xl rounded-3xl border border-white/10 bg-slate-950/85 p-12 text-center shadow-2xl shadow-accent/10">
        <h2 className="text-3xl font-semibold text-white sm:text-4xl">Ready to launch your Gigvora presence?</h2>
        <p className="mt-4 text-base text-white/70">
          Join the marketplace, craft your profile, and tap into live opportunities from companies, agencies, and community projects.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            to="/register"
            className="rounded-full bg-accent px-8 py-3 text-base font-semibold text-slate-950 shadow-lg shadow-accent/40 transition hover:shadow-accent/60"
          >
            Create account
          </Link>
          <Link
            to="/feed"
            className="rounded-full border border-white/15 px-8 py-3 text-base font-semibold text-white/80 transition hover:border-accent/60 hover:text-white"
          >
            Peek the live feed
          </Link>
        </div>
      </div>
    </section>
  );
}
