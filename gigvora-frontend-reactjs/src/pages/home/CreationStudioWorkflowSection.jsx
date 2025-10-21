import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRightIcon,
  PlayCircleIcon,
  DocumentTextIcon,
  BriefcaseIcon,
  BeakerIcon,
  HeartIcon,
  AcademicCapIcon,
  RocketLaunchIcon,
  ShieldCheckIcon,
  ArrowPathRoundedSquareIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';

const workflowSteps = [
  {
    id: 'draft',
    label: 'Draft',
    blurb: 'Kick off new opportunities with pre-built blueprints and data-backed prompts.',
    accent: 'from-sky-500/20 via-sky-500/5 to-transparent',
    panels: {
      cvs: 'Generate polished narratives and portfolio prompts in seconds.',
      gigs: 'Spin up scopes, guardrails, and deliverables with role-based presets.',
      projects: 'Frame milestones, success metrics, and resource needs automatically.',
      volunteering: 'Draft outreach, impact statements, and rota plans in one place.',
      mentorship: 'Bundle agendas, learning arcs, and nudges for every mentor pair.',
      cohorts: 'Assemble launch plans, onboarding flows, and graduation checkpoints.',
    },
  },
  {
    id: 'collaborate',
    label: 'Collaborate',
    blurb: 'Bring teammates, reviewers, and subject-matter experts into the same canvas.',
    accent: 'from-purple-500/20 via-purple-500/5 to-transparent',
    panels: {
      cvs: 'Comment inline on tone, achievements, and compliance evidence.',
      gigs: 'Assign owners to requirements and enable real-time price benchmarking.',
      projects: 'Co-edit briefs, attach research, and sync stakeholder check-ins.',
      volunteering: 'Coordinate partners, shifts, and safeguarding requirements.',
      mentorship: 'Track mentor feedback, learning goals, and conversation threads.',
      cohorts: 'Align facilitators, content drops, and community rituals.',
    },
  },
  {
    id: 'publish',
    label: 'Publish',
    blurb: 'Release ready-to-ship packs across channels with automated QA and sign-off.',
    accent: 'from-amber-500/20 via-amber-500/5 to-transparent',
    panels: {
      cvs: 'Issue shareable CV links with watermarking and expiry controls.',
      gigs: 'Publish scoped gigs with approved compliance statements.',
      projects: 'Launch projects to matching talent pools and partner dashboards.',
      volunteering: 'Broadcast drives with accessibility, safeguarding, and impact info.',
      mentorship: 'Deliver welcome packs with automated onboarding tasks.',
      cohorts: 'Announce cohorts with syllabus previews and enrollment checklists.',
    },
  },
  {
    id: 'automate',
    label: 'Automate',
    blurb: 'Keep every asset up-to-date with compliance bots, autosave, and versioning.',
    accent: 'from-emerald-500/20 via-emerald-500/5 to-transparent',
    panels: {
      cvs: 'Score compliance against frameworks and push refresh reminders.',
      gigs: 'Sync signed contracts, track changes, and auto-notify partners.',
      projects: 'Version retros, budgets, and scope updates without manual lifts.',
      volunteering: 'Automate rota adjustments and export volunteer compliance packs.',
      mentorship: 'Send nudges, log reflections, and surface at-risk pairings.',
      cohorts: 'Roll forward templates, assets, and engagement analytics.',
    },
  },
];

const categoryPanels = [
  {
    id: 'cvs',
    label: 'CVs & Cover Letters',
    icon: DocumentTextIcon,
    tone: 'from-sky-400/10 via-sky-400/5 to-transparent',
  },
  {
    id: 'gigs',
    label: 'Gigs & Contracts',
    icon: BriefcaseIcon,
    tone: 'from-fuchsia-400/10 via-fuchsia-400/5 to-transparent',
  },
  {
    id: 'projects',
    label: 'Projects & Sprints',
    icon: BeakerIcon,
    tone: 'from-amber-400/10 via-amber-400/5 to-transparent',
  },
  {
    id: 'volunteering',
    label: 'Volunteering Drives',
    icon: HeartIcon,
    tone: 'from-rose-400/10 via-rose-400/5 to-transparent',
  },
  {
    id: 'mentorship',
    label: 'Mentorship Packs',
    icon: AcademicCapIcon,
    tone: 'from-indigo-400/10 via-indigo-400/5 to-transparent',
  },
  {
    id: 'cohorts',
    label: 'Launchpad Cohorts',
    icon: RocketLaunchIcon,
    tone: 'from-emerald-400/10 via-emerald-400/5 to-transparent',
  },
];

const automationCallouts = [
  {
    id: 'compliance',
    title: 'Compliance scoring',
    description: 'Gauge policy adherence instantly and flag blockers before sign-off.',
    icon: ShieldCheckIcon,
    pingColor: 'bg-emerald-400/80',
    chipTone: 'bg-emerald-400/10 text-emerald-200',
  },
  {
    id: 'autosave',
    title: 'Continuous autosave',
    description: 'Never lose context with cross-device drafts and conflict handling.',
    icon: ArrowPathRoundedSquareIcon,
    pingColor: 'bg-sky-400/80',
    chipTone: 'bg-sky-400/10 text-sky-200',
  },
  {
    id: 'versioning',
    title: 'Asset versioning',
    description: 'Capture every iteration with rollbacks, comparisons, and notes.',
    icon: Squares2X2Icon,
    pingColor: 'bg-amber-400/80',
    chipTone: 'bg-amber-400/10 text-amber-200',
  },
];

export function CreationStudioWorkflowSection() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % workflowSteps.length);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  const activeStep = useMemo(() => workflowSteps[activeIndex], [activeIndex]);

  return (
    <section className="relative overflow-hidden bg-slate-950 py-24 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(94,234,212,0.12),_transparent_55%)]" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="flex flex-col gap-16 lg:flex-row">
          <div className="flex-1 space-y-12">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-white/70">
                Creation Studio Workflow
              </span>
              <div className="space-y-3">
                <h2 className="text-3xl font-semibold sm:text-4xl">Design, review, and launch with one orchestrated flow</h2>
                <p className="text-base text-white/70">
                  Follow the stepper to see how drafts become market-ready launches across CVs, gigs, projects, volunteering, mentorship, and launchpad cohorts.
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.45)]">
              <div className="space-y-4">
                {workflowSteps.map((step, index) => {
                  const isActive = index === activeIndex;

                  return (
                    <button
                      type="button"
                      key={step.id}
                      onMouseEnter={() => setActiveIndex(index)}
                      onFocus={() => setActiveIndex(index)}
                      className={`group flex w-full items-start gap-4 rounded-2xl border px-4 py-4 text-left transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                        isActive ? 'border-white/30 bg-gradient-to-r from-white/15 to-transparent shadow-lg' : 'border-transparent hover:border-white/10 hover:bg-white/5'
                      }`}
                    >
                      <span
                        className={`flex h-10 w-10 flex-none items-center justify-center rounded-full text-sm font-semibold transition ${
                          isActive ? 'bg-accent text-slate-900 shadow-soft' : 'bg-white/10 text-white/70'
                        }`}
                      >
                        {index + 1}
                      </span>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold tracking-wide text-white">{step.label}</p>
                        <p className="text-sm text-white/70">{step.blurb}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {categoryPanels.map((panel) => {
                  const Icon = panel.icon;
                  const description = activeStep.panels[panel.id];

                  return (
                    <div
                      key={panel.id}
                      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 transition duration-200 hover:border-white/30 hover:bg-white/10"
                    >
                      <div className={`pointer-events-none absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100 bg-gradient-to-br ${panel.tone}`} aria-hidden="true" />
                      <div className="relative flex items-start gap-4">
                        <span className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-white/10 text-white">
                          <Icon className="h-6 w-6" aria-hidden="true" />
                        </span>
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-white">{panel.label}</p>
                          <p className="text-sm text-white/70">{description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {automationCallouts.map((callout) => {
                const Icon = callout.icon;

                return (
                  <div
                    key={callout.id}
                    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 transition duration-200 hover:border-white/30 hover:bg-white/10"
                  >
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" aria-hidden="true" />
                    <div className="relative flex flex-col gap-3">
                      <div className="relative inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white">
                        <Icon className="h-6 w-6" aria-hidden="true" />
                        <span className="absolute -right-1 -top-1 flex h-3 w-3">
                          <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${callout.pingColor}`} />
                          <span className={`relative inline-flex h-3 w-3 rounded-full ${callout.pingColor}`} />
                        </span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-white">{callout.title}</p>
                        <p className="text-sm text-white/70">{callout.description}</p>
                      </div>
                      <span className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-medium uppercase tracking-[0.25em] ${callout.chipTone}`}>
                        Auto
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex-1">
            <div className="sticky top-24">
              <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-6 shadow-[0_24px_80px_rgba(15,23,42,0.45)]">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/60">See it in action</p>
                    <h3 className="text-2xl font-semibold text-white">Creation Studio orchestration loop</h3>
                    <p className="text-sm text-white/70">
                      Watch the draft-to-launch loop or explore the docs to wire it into your workflow.
                    </p>
                  </div>

                  <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/80">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(94,234,212,0.12),_transparent_55%)]" aria-hidden="true" />
                    <div className="relative flex aspect-video items-center justify-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/15 text-white shadow-lg backdrop-blur">
                        <PlayCircleIcon className="h-10 w-10" aria-hidden="true" />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Link
                      to="/creation-studio"
                      className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-slate-900 shadow-soft transition hover:-translate-y-0.5"
                    >
                      Explore studio
                      <ArrowRightIcon className="h-5 w-5" aria-hidden="true" />
                    </Link>
                    <Link
                      to="/docs/creation-studio"
                      className="inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:border-white hover:text-white"
                    >
                      Read the docs
                      <ArrowRightIcon className="h-5 w-5" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
