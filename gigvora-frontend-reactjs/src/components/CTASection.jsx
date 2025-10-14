import { Link } from 'react-router-dom';

export default function CTASection() {
  return (
    <section className="relative overflow-hidden py-24">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(37,99,235,0.15),_transparent_70%)]" aria-hidden="true" />
      <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[48px] border border-accent/20 bg-gradient-to-r from-accent to-accentDark px-8 py-16 text-center text-white shadow-soft">
        <h2 className="text-3xl font-semibold sm:text-4xl">Ready to make every touchpoint feel premium?</h2>
        <p className="mt-4 text-base text-white/80">
          Create your profile, invite your team, and deliver experiences your customers will rave about.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            to="/register"
            className="rounded-full bg-white px-8 py-3 text-base font-semibold text-accent shadow-lg shadow-black/10 transition hover:-translate-y-0.5"
          >
            Launch your account
          </Link>
          <Link
            to="/support"
            className="rounded-full border border-white/60 px-8 py-3 text-base font-semibold text-white/90 transition hover:border-white hover:text-white"
          >
            Talk with support
          </Link>
        </div>
      </div>
    </section>
  );
}
