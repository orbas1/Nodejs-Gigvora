import { Link } from 'react-router-dom';

export default function CTASection() {
  return (
    <section className="relative overflow-hidden py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(191,219,254,0.4),_transparent_65%)]" aria-hidden="true" />
      <div className="absolute -left-20 top-1/2 h-56 w-56 -translate-y-1/2 rounded-full bg-accent/20 blur-3xl" aria-hidden="true" />
      <div className="relative mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-soft">
        <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">Ready to launch your Gigvora presence?</h2>
        <p className="mt-4 text-base text-slate-600">
          Join the marketplace, craft your profile, and tap into live opportunities from companies, agencies, and community projects.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            to="/register"
            className="rounded-full bg-accent px-8 py-3 text-base font-semibold text-white shadow-soft transition hover:bg-accentDark"
          >
            Create account
          </Link>
          <Link
            to="/feed"
            className="rounded-full border border-slate-200 px-8 py-3 text-base font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
          >
            Peek the live feed
          </Link>
        </div>
      </div>
    </section>
  );
}
