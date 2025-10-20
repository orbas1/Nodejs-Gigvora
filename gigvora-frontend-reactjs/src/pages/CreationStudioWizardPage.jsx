import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowTopRightOnSquareIcon,
  BookmarkSquareIcon,
  BriefcaseIcon,
  DocumentArrowUpIcon,
  HandRaisedIcon,
  RocketLaunchIcon,
  SparklesIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import PageHeader from '../components/PageHeader.jsx';
import CreationStudioManager from '../components/creationStudio/CreationStudioManager.jsx';
import useSession from '../hooks/useSession.js';
import DataStatus from '../components/DataStatus.jsx';

const creationTracks = [
  {
    id: 'cv',
    title: 'CV generator',
    description:
      'Craft tailored resumes with persona-aware story blocks, approvals, and reusable templates.',
    icon: DocumentArrowUpIcon,
    to: '/dashboard/freelancer/documents',
  },
  {
    id: 'cover-letter',
    title: 'Cover letter composer',
    description:
      'Combine dynamic prompts with saved successes to generate targeted cover letters on demand.',
    icon: BookmarkSquareIcon,
    to: '/dashboard/freelancer/documents',
  },
  {
    id: 'gig',
    title: 'Gig launchpad',
    description:
      'Publish outcome-oriented gig briefs with compliance scoring and instant sharing controls.',
    icon: BriefcaseIcon,
    to: '/gigs',
  },
  {
    id: 'project',
    title: 'Project workspace',
    description:
      'Spin up delivery workspaces with milestone templates, contributor onboarding, and reporting.',
    icon: RocketLaunchIcon,
    to: '/projects/new',
  },
  {
    id: 'volunteering',
    title: 'Volunteering missions',
    description:
      'Coordinate purpose-led initiatives with guardrails for safeguarding, access, and impact metrics.',
    icon: HandRaisedIcon,
    to: '/volunteering',
  },
  {
    id: 'experience-launchpad',
    title: 'Experience Launchpad',
    description:
      'Design cohort programmes with readiness scores, mentor pairing, and automated check-ins.',
    icon: SparklesIcon,
    to: '/experience-launchpad',
  },
  {
    id: 'mentorship',
    title: 'Mentorship offering',
    description:
      'Package mentoring tracks with availability slots, curriculum assets, and billing preferences.',
    icon: UserGroupIcon,
    to: '/dashboard/mentor',
  },
];

const stats = [
  {
    label: 'Templates ready to deploy',
    value: '120+',
    tone: 'border-emerald-200 bg-emerald-50',
  },
  {
    label: 'Automation coverage',
    value: '92%',
    tone: 'border-indigo-200 bg-indigo-50',
  },
  {
    label: 'Average publish time',
    value: '3m 14s',
    tone: 'border-sky-200 bg-sky-50',
  },
];

function StatCard({ label, value, tone }) {
  return (
    <div className={`rounded-3xl border p-6 shadow-soft transition hover:-translate-y-0.5 ${tone}`}>
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function TrackCard({ title, description, icon: Icon, to }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-soft transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <p className="mt-2 text-sm text-slate-600">{description}</p>
        </div>
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </span>
      </div>
      <Link
        to={to}
        className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-accent transition hover:text-accentDark"
      >
        Open workspace
        <ArrowTopRightOnSquareIcon className="h-4 w-4" aria-hidden="true" />
      </Link>
    </article>
  );
}

export default function CreationStudioWizardPage() {
  const { isAuthenticated } = useSession();

  const authenticatedCopy = useMemo(
    () =>
      isAuthenticated
        ? 'Manage drafts, publish opportunities, and collaborate with teammates in one orchestrated studio.'
        : 'Sign in to orchestrate gigs, projects, and documents from one collaborative studio.',
    [isAuthenticated],
  );

  return (
    <div className="bg-gradient-to-b from-white via-white to-slate-50 pb-24">
      <div className="mx-auto max-w-7xl px-6 pt-16">
        <PageHeader
          eyebrow="Creation Studio"
          title="Launch every opportunity with confidence"
          description={authenticatedCopy}
          actions={
            <Link
              to="/projects/new"
              className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-accentDark"
            >
              Create new project
              <RocketLaunchIcon className="h-5 w-5" aria-hidden="true" />
            </Link>
          }
          meta="Autosave • Compliance scoring • Collaboration rooms"
        />

        <div className="grid gap-6 md:grid-cols-3">
          {stats.map((item) => (
            <StatCard key={item.label} {...item} />
          ))}
        </div>

        <section className="mt-16">
          <div className="grid gap-6 lg:grid-cols-2">
            {creationTracks.map((track) => (
              <TrackCard key={track.id} {...track} />
            ))}
          </div>
        </section>

        <section className="mt-16 rounded-[2.5rem] border border-slate-200 bg-white/90 p-8 shadow-xl" id="studio">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Creation studio workspace</h2>
              <p className="mt-2 text-sm text-slate-600">
                Draft, collaborate, and publish across CVs, cover letters, gigs, projects, volunteering drives, and mentorship tracks.
              </p>
            </div>
            <Link
              to="/feed"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
            >
              View live feed
              <ArrowTopRightOnSquareIcon className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-10 rounded-3xl border border-slate-200/70 bg-slate-50/40 p-6">
            <CreationStudioManager />
          </div>
        </section>

        <section className="mt-16">
          <div className="rounded-[2.5rem] border border-dashed border-slate-300 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 text-white shadow-xl">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold">Need a hand finishing your brief?</h2>
                <p className="text-sm text-slate-200">
                  Our community concierge team reviews drafts, ensures compliance, and co-authors announcements before you publish.
                </p>
              </div>
              <Link
                to="/inbox"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-soft transition hover:-translate-y-0.5"
              >
                Chat with concierge
                <ArrowTopRightOnSquareIcon className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-16 bg-white py-16">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-2xl font-semibold text-slate-900">Workflow assurance</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Every action performed in the studio is audited, reversible, and synced with real-time notifications. Administrators can trace edits,
            approvals, and publish events down to the individual field change.
          </p>
          <div className="mt-10 rounded-3xl border border-slate-200 bg-slate-50/60 p-6">
            <DataStatus
              status="success"
              title="All systems operational"
              description="Creation API • Compliance scoring • Publishing pipeline"
              lastUpdated={new Date().toISOString()}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
