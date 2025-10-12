import { useParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import UserAvatar from '../components/UserAvatar.jsx';

const profile = {
  name: 'Leo Freelancer',
  headline: 'Full Stack Developer • Experience Launchpad Alum',
  avatarSeed: 'Leo Freelancer',
  location: 'Remote • Berlin, Germany',
  bio: 'Building future-of-work platforms and communities. Previously launched three SaaS products and mentored 40+ builders.',
  mission: 'Pairing high-trust product engineering with inclusive hiring programmes so every cohort ships with confidence.',
  skills: ['Node.js', 'React', 'TypeScript', 'Tailwind CSS', 'MySQL', 'Product Strategy'],
  experience: [
    {
      company: 'Nova Agency',
      role: 'Lead Engineer (Contract)',
      dates: '2023 - Present',
      description: 'Scaling multi-tenant gig marketplace infrastructure, observability, and escrow integrations for venture clients.',
    },
    {
      company: 'Atlas Labs',
      role: 'Senior Full Stack Developer',
      dates: '2020 - 2023',
      description: 'Led growth experiments, refactored the React design system, and bootstrapped the remote mentorship guild.',
    },
  ],
  followers: 1280,
  connections: 560,
  groups: [
    'Future of Work Collective',
    'Gigvora Launchpad Cohort 01',
    'Design Systems Guild',
  ],
  liveMoments: [
    {
      title: 'Auto-assign streak',
      value: '5 wins',
      description: 'Accepted five priority matches in a row with 96% satisfaction scores.',
    },
    {
      title: 'NPS from founders',
      value: '9.4',
      description: 'Average review from marketplace founders over the last 90 days.',
    },
    {
      title: 'Availability',
      value: '28 hrs/wk',
      description: 'Optimised for multi-pod engagements across EU and Americas time zones.',
    },
  ],
  collaborators: [
    { name: 'Noor Designer', role: 'Product Design', seed: 'Noor Designer' },
    { name: 'Atlas Agency', role: 'Brand Strategy', seed: 'Atlas Agency' },
    { name: 'Mia Ops', role: 'Ops Partner', seed: 'Mia Ops' },
  ],
  autoAssignInsights: [
    {
      project: 'Marketplace instrumentation',
      payout: '$1,500',
      countdown: '02:45:00',
      status: 'Awaiting confirmation',
      seed: 'Marketplace instrumentation',
    },
    {
      project: 'Compliance dashboard refactor',
      payout: '$3,200',
      countdown: '14:10:00',
      status: 'Queued - next up',
      seed: 'Compliance dashboard',
    },
  ],
};

export default function ProfilePage() {
  const { id } = useParams();

  return (
    <section className="relative overflow-hidden py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(191,219,254,0.35),_transparent_70%)]" aria-hidden="true" />
      <div className="absolute -left-16 top-32 h-80 w-80 rounded-full bg-accent/15 blur-3xl" aria-hidden="true" />
      <div className="absolute -right-24 bottom-32 h-72 w-72 rounded-full bg-emerald-200/40 blur-[120px]" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl space-y-12 px-6">
        <div className="grid items-start gap-10 rounded-4xl border border-slate-200/70 bg-white/80 p-10 shadow-xl backdrop-blur lg:grid-cols-[auto,1fr]">
          <div className="space-y-4 text-center lg:text-left">
            <UserAvatar name={profile.name} seed={profile.avatarSeed} size="lg" className="mx-auto lg:mx-0" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent/80">Profile #{id}</p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900">{profile.name}</h1>
              <p className="mt-2 text-base text-slate-600">{profile.headline}</p>
              <p className="mt-2 text-sm text-slate-500">{profile.location}</p>
            </div>
            <div className="flex flex-wrap justify-center gap-3 text-xs text-slate-500 lg:justify-start">
              <span className="rounded-full border border-slate-200 px-3 py-1">Followers {profile.followers}</span>
              <span className="rounded-full border border-slate-200 px-3 py-1">Connections {profile.connections}</span>
              <span className="rounded-full border border-slate-200 px-3 py-1">Groups {profile.groups.length}</span>
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <article className="rounded-3xl border border-slate-200/80 bg-surfaceMuted/70 p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Mission</h2>
              <p className="mt-3 text-sm text-slate-700">{profile.mission}</p>
            </article>
            <div className="grid gap-4">
              {profile.liveMoments.map((moment) => (
                <article key={moment.title} className="rounded-3xl border border-slate-200/70 bg-white/90 p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-accent/60">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{moment.title}</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{moment.value}</p>
                  <p className="mt-1 text-sm text-slate-600">{moment.description}</p>
                </article>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            <section className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm">
              <PageHeader
                eyebrow="About"
                title="Trusted marketplace operator"
                description={profile.bio}
              />
              <p className="mt-4 text-sm text-slate-600">
                Leo helps venture teams launch reliable product squads, pairs engineering instrumentation with measurable
                learning loops, and coaches new freelancers inside the Launchpad programme.
              </p>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Recent experience</h2>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  {profile.collaborators.map((collaborator) => (
                    <div key={collaborator.name} className="-ml-2 first:ml-0">
                      <UserAvatar name={collaborator.name} seed={collaborator.seed} size="xs" showGlow={false} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-6 space-y-5">
                {profile.experience.map((item) => (
                  <article key={item.company} className="rounded-2xl border border-slate-200 bg-surfaceMuted/70 p-5">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{item.company}</span>
                      <span>{item.dates}</span>
                    </div>
                    <h3 className="mt-2 text-base font-semibold text-slate-900">{item.role}</h3>
                    <p className="mt-2 text-sm text-slate-600">{item.description}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-accent/10 via-white to-emerald-50 p-8 shadow-soft">
              <h2 className="text-lg font-semibold text-slate-900">Auto-assign activity</h2>
              <p className="mt-2 text-sm text-slate-600">
                Leo opts into fair-matching so emerging freelancers rotate through premium projects. Queue analytics show the
                countdown for the next two matches.
              </p>
              <div className="mt-6 space-y-4">
                {profile.autoAssignInsights.map((insight) => (
                  <article key={insight.project} className="flex items-center justify-between rounded-2xl border border-accent/30 bg-white/90 p-4">
                    <div className="flex items-center gap-4">
                      <UserAvatar name={insight.project} seed={insight.seed} size="sm" showGlow={false} />
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">{insight.project}</h3>
                        <p className="text-xs text-slate-500">{insight.status}</p>
                      </div>
                    </div>
                    <div className="text-right text-xs text-slate-500">
                      <p className="font-semibold text-slate-900">{insight.payout}</p>
                      <p>ETA {insight.countdown}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-8">
            <section className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Skills</h2>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-600">
                {profile.skills.map((skill) => (
                  <span key={skill} className="rounded-full border border-slate-200 bg-surfaceMuted/70 px-3 py-1">
                    {skill}
                  </span>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Groups</h2>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                {profile.groups.map((group) => (
                  <li key={group} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-surfaceMuted/60 px-3 py-2">
                    <span>{group}</span>
                    <span className="text-xs text-slate-400">Active</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-3xl border border-emerald-200 bg-emerald-50/80 p-8 shadow-inner">
              <h2 className="text-lg font-semibold text-emerald-900">Collaboration roster</h2>
              <p className="mt-2 text-xs text-emerald-700">
                Current pods draw talent from Gigvora agencies, independent strategists, and Launchpad alumni.
              </p>
              <div className="mt-4 space-y-3">
                {profile.collaborators.map((collaborator) => (
                  <div key={collaborator.name} className="flex items-center gap-3 rounded-2xl border border-emerald-200/60 bg-white/90 px-3 py-2">
                    <UserAvatar name={collaborator.name} seed={collaborator.seed} size="xs" showGlow={false} />
                    <div>
                      <p className="text-sm font-semibold text-emerald-900">{collaborator.name}</p>
                      <p className="text-xs text-emerald-600">{collaborator.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </section>
  );
}
