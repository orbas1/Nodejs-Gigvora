import { useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';

const categories = ['All', 'Jobs', 'Gigs', 'Projects', 'Experience Launchpad', 'Volunteering', 'People'];

const sampleResults = [
  { id: 1, title: 'Product Designer • Remote', category: 'Jobs', description: 'Join our venture studio to craft delightful hiring journeys.' },
  { id: 2, title: 'Webflow Specialist', category: 'Gigs', description: 'Two-week sprint to launch a microsite for a healthtech startup.' },
  { id: 3, title: 'Impact Hackathon', category: 'Projects', description: 'Collaborate with social ventures on rapid prototypes.' },
  { id: 4, title: 'Community Catalyst Fellowship', category: 'Experience Launchpad', description: '12-week mentorship experience in community building.' },
  { id: 5, title: 'Volunteer Frontend Mentor', category: 'Volunteering', description: 'Coach students on modern React and TypeScript practices.' },
];

export default function SearchPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredResults =
    selectedCategory === 'All' ? sampleResults : sampleResults.filter((result) => result.category === selectedCategory);

  return (
    <section className="relative overflow-hidden py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(0,245,201,0.1),_transparent_60%)]" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl px-6">
        <PageHeader
          eyebrow="Explorer"
          title="Search across the entire Gigvora ecosystem"
          description="Find opportunities, collaborators, and communities across jobs, gigs, projects, launchpad cohorts, volunteering, and people."
        />
        <div className="flex flex-wrap gap-3 text-xs font-semibold">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className={`rounded-full px-4 py-2 transition ${
                selectedCategory === category
                  ? 'bg-accent text-slate-950 shadow shadow-accent/40'
                  : 'border border-white/15 text-white/70 hover:border-accent/40 hover:text-white'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
        <div className="mt-10 grid gap-5">
          {filteredResults.map((result) => (
            <article key={result.id} className="rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-accent/40 hover:bg-white/10">
              <span className="text-xs font-semibold uppercase tracking-[0.35em] text-accent">{result.category}</span>
              <h2 className="mt-3 text-lg font-semibold text-white">{result.title}</h2>
              <p className="mt-2 text-sm text-white/70">{result.description}</p>
              <button className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white/80 transition hover:border-accent/50 hover:text-white">
                View details <span aria-hidden="true">→</span>
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
