import PropTypes from 'prop-types';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

export function ClosingConversionSection({
  onJoinAsTalentClick,
  onHireCrewClick,
  onExploreMentorshipClick,
  onGuidelinesClick,
}) {
  const ctas = [
    {
      title: 'Join as talent',
      description: 'Showcase your expertise, collaborate on flagship builds, and unlock premium project opportunities.',
      onClick: onJoinAsTalentClick,
    },
    {
      title: 'Hire a crew',
      description: 'Assemble a flexible strike team of builders, strategists, and mentors tailored to your product goals.',
      onClick: onHireCrewClick,
    },
    {
      title: 'Explore mentorship',
      description: 'Partner with experienced operators who can help accelerate your launch strategy and delivery rhythm.',
      onClick: onExploreMentorshipClick,
    },
  ];

  return (
    <section className="relative isolate overflow-hidden py-24">
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-br from-slate-950 via-indigo-700 to-purple-500"
        aria-hidden="true"
      />
      <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-12 px-6 text-white sm:px-10 lg:px-12">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/70">The Gigvora promise</p>
          <h2 className="mt-4 text-4xl font-bold leading-tight sm:text-5xl">Build your Gigvora crew</h2>
          <p className="mt-4 text-lg text-white/80">
            Whether you are a solo visionary, a scaling startup, or a community of builders, we make it easier to gather the right
            people, resources, and guidance to ship boldly.
          </p>
        </div>

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
          {ctas.map(({ title, description, onClick }) => (
            <button
              key={title}
              type="button"
              onClick={onClick}
              className="group flex flex-col gap-4 rounded-3xl border border-white/20 bg-white/10 p-6 text-left transition hover:border-white/40 hover:bg-white/15 hover:shadow-[0_18px_50px_rgba(15,23,42,0.35)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              <span className="text-xl font-semibold">{title}</span>
              <span className="text-sm leading-relaxed text-white/80">{description}</span>
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-white">
                Get started
                <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </span>
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 text-sm text-white/80 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-2xl">
            Need to align with our code of practice first? Review the shared expectations that keep the Gigvora network inclusive and
            mission-driven.
          </p>
          <a
            href="/docs/community-guidelines"
            onClick={onGuidelinesClick}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border border-white/40 px-5 py-2 font-semibold text-white transition hover:border-white hover:bg-white/10"
          >
            Community guidelines
            <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}

ClosingConversionSection.propTypes = {
  onJoinAsTalentClick: PropTypes.func,
  onHireCrewClick: PropTypes.func,
  onExploreMentorshipClick: PropTypes.func,
  onGuidelinesClick: PropTypes.func,
};

ClosingConversionSection.defaultProps = {
  onJoinAsTalentClick: undefined,
  onHireCrewClick: undefined,
  onExploreMentorshipClick: undefined,
  onGuidelinesClick: undefined,
};
