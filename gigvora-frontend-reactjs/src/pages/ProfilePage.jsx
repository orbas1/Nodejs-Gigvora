import { useParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';

const profile = {
  name: 'Leo Freelancer',
  headline: 'Full Stack Developer • Experience Launchpad Alum',
  location: 'Remote • Berlin, Germany',
  bio: 'Building future-of-work platforms and communities. Previously launched three SaaS products and mentored 40+ builders.',
  skills: ['Node.js', 'React', 'TypeScript', 'Tailwind CSS', 'MySQL', 'Product Strategy'],
  experience: [
    {
      company: 'Nova Agency',
      role: 'Lead Engineer (Contract)',
      dates: '2023 - Present',
      description: 'Scaling multi-tenant gig marketplace infrastructure and analytics.',
    },
    {
      company: 'Atlas Labs',
      role: 'Senior Full Stack Developer',
      dates: '2020 - 2023',
      description: 'Built collaboration tools for global teams and launched community programs.',
    },
  ],
  followers: 1280,
  connections: 560,
  groups: ['Future of Work Collective', 'Gigvora Launchpad Cohort 01', 'Design Systems Guild'],
};

export default function ProfilePage() {
  const { id } = useParams();

  return (
    <section className="relative overflow-hidden py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,245,201,0.08),_transparent_65%)]" aria-hidden="true" />
      <div className="absolute -left-24 top-40 h-80 w-80 rounded-full bg-accent/10 blur-3xl" aria-hidden="true" />
      <div className="relative mx-auto max-w-5xl space-y-12 px-6">
        <PageHeader
          eyebrow={`Profile #${id}`}
          title={profile.name}
          description={profile.headline}
          actions={(
            <div className="flex flex-wrap gap-3 text-xs text-white/70">
              <span className="rounded-full border border-white/15 px-3 py-1">Followers {profile.followers}</span>
              <span className="rounded-full border border-white/15 px-3 py-1">Connections {profile.connections}</span>
              <span className="rounded-full border border-white/15 px-3 py-1">Groups {profile.groups.length}</span>
            </div>
          )}
        />
        <p className="text-sm text-white/60">{profile.location}</p>
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            <section className="rounded-3xl border border-white/10 bg-white/5 p-8">
              <h2 className="text-lg font-semibold text-white">About</h2>
              <p className="mt-4 text-sm text-white/70">{profile.bio}</p>
            </section>
            <section className="rounded-3xl border border-white/10 bg-white/5 p-8">
              <h2 className="text-lg font-semibold text-white">Experience</h2>
              <div className="mt-6 space-y-5">
                {profile.experience.map((item) => (
                  <article key={item.company} className="rounded-2xl border border-white/10 bg-slate-950/70 p-5">
                    <div className="flex items-center justify-between text-xs text-white/50">
                      <span>{item.company}</span>
                      <span>{item.dates}</span>
                    </div>
                    <h3 className="mt-2 text-base font-semibold text-white">{item.role}</h3>
                    <p className="mt-2 text-sm text-white/70">{item.description}</p>
                  </article>
                ))}
              </div>
            </section>
          </div>
          <aside className="space-y-8">
            <section className="rounded-3xl border border-white/10 bg-white/5 p-8">
              <h2 className="text-lg font-semibold text-white">Skills</h2>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/70">
                {profile.skills.map((skill) => (
                  <span key={skill} className="rounded-full border border-white/15 px-3 py-1">
                    {skill}
                  </span>
                ))}
              </div>
            </section>
            <section className="rounded-3xl border border-white/10 bg-white/5 p-8">
              <h2 className="text-lg font-semibold text-white">Groups</h2>
              <ul className="mt-4 space-y-3 text-sm text-white/70">
                {profile.groups.map((group) => (
                  <li key={group} className="rounded-2xl border border-white/10 px-3 py-2">
                    {group}
                  </li>
                ))}
              </ul>
            </section>
          </aside>
        </div>
      </div>
    </section>
  );
}
