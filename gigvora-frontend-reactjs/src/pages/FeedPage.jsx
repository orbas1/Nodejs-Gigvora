import PageHeader from '../components/PageHeader.jsx';

const samplePosts = [
  {
    id: 1,
    author: 'Maya Product',
    role: 'Product Strategist • Experience Launchpad',
    content: 'Just opened applications for a zero-to-one discovery sprint. Looking for UX researchers and data storytellers.',
    time: '2m ago',
  },
  {
    id: 2,
    author: 'Atlas Agency',
    role: 'Creative Agency',
    content: 'Hiring freelance motion designers for a 6-week fintech campaign. DM portfolios! #gigs #remote',
    time: '12m ago',
  },
  {
    id: 3,
    author: 'Layla Dev',
    role: 'Full Stack Engineer',
    content: 'Wrapped up an AI-assisted recruiting tool with a Gigvora company partner. Sharing a case study soon!',
    time: '45m ago',
  },
];

export default function FeedPage() {
  return (
    <section className="relative overflow-hidden py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,245,201,0.08),_transparent_65%)]" aria-hidden="true" />
      <div className="relative mx-auto max-w-5xl px-6">
        <PageHeader
          eyebrow="Live feed"
          title="Real-time stories, launches, and wins"
          description="See what freelancers, agencies, companies, and communities are building across the Gigvora network."
          actions={(
            <button className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-accent/30 transition hover:shadow-accent/50">
              Share an update
            </button>
          )}
        />
        <div className="space-y-6">
          {samplePosts.map((post) => (
            <article key={post.id} className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/10 transition hover:border-accent/40 hover:bg-white/10">
              <div className="flex items-center justify-between text-xs text-white/50">
                <span>{post.role}</span>
                <span>{post.time}</span>
              </div>
              <h2 className="mt-3 text-lg font-semibold text-white">{post.author}</h2>
              <p className="mt-2 text-sm text-white/70">{post.content}</p>
              <div className="mt-4 flex flex-wrap gap-3 text-xs text-white/60">
                <button className="rounded-full border border-white/15 px-4 py-2 transition hover:border-accent/40 hover:text-white">
                  React
                </button>
                <button className="rounded-full border border-white/15 px-4 py-2 transition hover:border-accent/40 hover:text-white">
                  Comment
                </button>
                <button className="rounded-full border border-white/15 px-4 py-2 transition hover:border-accent/40 hover:text-white">
                  Share
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
