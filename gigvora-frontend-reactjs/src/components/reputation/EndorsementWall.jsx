import { useMemo, useState } from 'react';
import {
  ArrowPathRoundedSquareIcon,
  MegaphoneIcon,
  ShareIcon,
  SparklesIcon,
  StarIcon,
  PlayCircleIcon,
} from '@heroicons/react/24/outline';
import PropTypes from 'prop-types';
import classNames from '../../utils/classNames.js';
import UserAvatar from '../UserAvatar.jsx';
import DataStatus from '../DataStatus.jsx';

function FilterPill({ filter, active, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(filter)}
      className={classNames(
        'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition',
        active
          ? 'border-blue-300 bg-blue-50/70 text-blue-700 shadow-sm'
          : 'border-slate-200 bg-white/80 text-slate-500 hover:border-blue-200 hover:text-blue-600',
      )}
    >
      <SparklesIcon className="h-4 w-4" aria-hidden="true" />
      {filter.label}
    </button>
  );
}

FilterPill.propTypes = {
  filter: PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    tag: PropTypes.string,
  }).isRequired,
  active: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
};

FilterPill.defaultProps = {
  active: false,
};

function EndorsementCard({ endorsement, layout }) {
  return (
    <article
      className={classNames(
        'relative flex h-full flex-col justify-between overflow-hidden rounded-[28px] border border-slate-100 bg-white/90 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl',
        endorsement.featured ? 'ring-2 ring-blue-200' : 'ring-1 ring-slate-100',
        layout === 'wide' ? 'lg:col-span-2' : '',
      )}
    >
      <header className="flex items-center gap-4">
        <UserAvatar name={endorsement.author.name} imageUrl={endorsement.author.avatarUrl} size="md" />
        <div>
          <p className="text-sm font-semibold text-slate-900">{endorsement.author.name}</p>
          <p className="text-xs uppercase tracking-wide text-slate-400">
            {[endorsement.author.role, endorsement.author.company].filter(Boolean).join(' • ')}
          </p>
        </div>
        {endorsement.rating ? (
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-600">
            <StarIcon className="h-4 w-4" /> {endorsement.rating.toFixed(1)}
          </span>
        ) : null}
      </header>
      <p className="mt-4 text-base leading-relaxed text-slate-600">{endorsement.quote}</p>
      <footer className="mt-6 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <ArrowPathRoundedSquareIcon className="h-4 w-4" aria-hidden="true" />
          {endorsement.publishedAt}
        </div>
        <div className="flex items-center gap-2 text-slate-500">
          {(endorsement.tags ?? []).map((tag) => (
            <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">
              {tag}
            </span>
          ))}
        </div>
      </footer>
      {endorsement.mediaUrl ? (
        <a
          href={endorsement.mediaUrl}
          className="absolute inset-x-6 top-6 flex items-center gap-2 rounded-[22px] bg-slate-900/80 px-3 py-2 text-xs font-semibold text-white shadow-lg transition hover:bg-slate-900"
        >
          <PlayCircleIcon className="h-4 w-4" /> Watch the story
        </a>
      ) : null}
    </article>
  );
}

EndorsementCard.propTypes = {
  endorsement: PropTypes.shape({
    id: PropTypes.string.isRequired,
    quote: PropTypes.string.isRequired,
    rating: PropTypes.number,
    tags: PropTypes.arrayOf(PropTypes.string),
    publishedAt: PropTypes.string,
    mediaUrl: PropTypes.string,
    featured: PropTypes.bool,
    author: PropTypes.shape({
      name: PropTypes.string.isRequired,
      role: PropTypes.string,
      company: PropTypes.string,
      avatarUrl: PropTypes.string,
    }).isRequired,
  }).isRequired,
  layout: PropTypes.oneOf(['standard', 'wide']),
};

EndorsementCard.defaultProps = {
  layout: 'standard',
};

export default function EndorsementWall({
  endorsements,
  filters,
  status,
  onFilterChange,
  onShare,
}) {
  const [activeFilter, setActiveFilter] = useState(filters[0]?.id ?? 'all');

  const filteredEndorsements = useMemo(() => {
    if (activeFilter === 'all') return endorsements;
    const tag = filters.find((filter) => filter.id === activeFilter)?.tag;
    if (!tag) return endorsements;
    return endorsements.filter((endorsement) => endorsement.tags?.includes(tag));
  }, [activeFilter, endorsements, filters]);

  const handleFilterClick = (filter) => {
    setActiveFilter(filter.id);
    onFilterChange?.(filter);
  };

  if (status?.state && status.state !== 'ready') {
    return <DataStatus status={status.state} title={status.title} description={status.description} />;
  }

  return (
    <section className="space-y-6 rounded-[40px] border border-slate-100 bg-gradient-to-br from-white via-slate-50 to-white p-8 shadow-xl">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.35em] text-blue-400">Social proof hub</p>
          <h2 className="text-3xl font-semibold text-slate-900">Voices from the people who trust you most</h2>
          <p className="max-w-2xl text-sm text-slate-500">
            Showcase the endorsements that shape perception. Filter by outcomes, spotlight new praise, and amplify stories that
            convert.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onShare}
            className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-5 py-2 text-sm font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100"
          >
            <ShareIcon className="h-4 w-4" /> Share wall
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
          >
            <MegaphoneIcon className="h-4 w-4" /> Invite new endorsement
          </button>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <FilterPill key={filter.id} filter={filter} active={filter.id === activeFilter} onClick={handleFilterClick} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {filteredEndorsements.map((endorsement, index) => (
          <EndorsementCard
            key={endorsement.id}
            endorsement={endorsement}
            layout={index % 5 === 0 ? 'wide' : 'standard'}
          />
        ))}
      </div>

      <footer className="flex flex-col gap-4 rounded-[32px] border border-blue-100 bg-blue-50/70 p-6 text-sm text-blue-800">
        <div className="flex flex-wrap items-center gap-3">
          <SparklesIcon className="h-5 w-5" aria-hidden="true" />
          <p className="font-semibold">Tip: Rotate a new featured endorsement every week to keep momentum strong.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-blue-700">
          <MegaphoneIcon className="h-4 w-4" aria-hidden="true" />
          Celebrate fresh praise with a shout-out campaign. Clip highlights into reels and resurface success stories in the
          newsletter.
        </div>
      </footer>
    </section>
  );
}

EndorsementWall.propTypes = {
  endorsements: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    quote: PropTypes.string.isRequired,
    rating: PropTypes.number,
    tags: PropTypes.arrayOf(PropTypes.string),
    publishedAt: PropTypes.string,
    mediaUrl: PropTypes.string,
    featured: PropTypes.bool,
    author: PropTypes.shape({
      name: PropTypes.string.isRequired,
      role: PropTypes.string,
      company: PropTypes.string,
      avatarUrl: PropTypes.string,
    }).isRequired,
  })),
  filters: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      tag: PropTypes.string,
    }),
  ),
  status: PropTypes.shape({
    state: PropTypes.string,
    title: PropTypes.string,
    description: PropTypes.string,
  }),
  onFilterChange: PropTypes.func,
  onShare: PropTypes.func,
};

EndorsementWall.defaultProps = {
  endorsements: [
    {
      id: 'endorsement-01',
      quote:
        'They orchestrated a cross-continent launch in 18 days. We hit 230% of sign-up targets and our NPS soared from 21 to 63.',
      rating: 4.9,
      tags: ['Launch velocity', 'Product strategy'],
      publishedAt: 'Published May 14, 2024',
      featured: true,
      author: {
        name: 'Maya Prieto',
        role: 'VP Product',
        company: 'Lumen Labs',
      },
      mediaUrl: '#case-study-video',
    },
    {
      id: 'endorsement-02',
      quote: 'Mentorship with them unlocked our creative confidence. Their playbooks are now core to our onboarding.',
      rating: 4.8,
      tags: ['Mentorship', 'Culture'],
      publishedAt: 'Published Apr 29, 2024',
      author: {
        name: 'Andre Hall',
        role: 'Design Director',
        company: 'Northstar Co-op',
      },
    },
    {
      id: 'endorsement-03',
      quote: 'Community buzz doubled after they introduced the story-driven content pillars. Engagement has stayed above 38% for weeks.',
      rating: 4.7,
      tags: ['Community', 'Engagement'],
      publishedAt: 'Published Apr 02, 2024',
      author: {
        name: 'Naledi Jacobs',
        role: 'Head of Community',
        company: 'TribeFlow',
      },
    },
    {
      id: 'endorsement-04',
      quote: 'Their governance rituals and transparency transformed our partner trust scores within a quarter.',
      rating: 5,
      tags: ['Governance', 'Trust'],
      publishedAt: 'Published Mar 18, 2024',
      author: {
        name: 'Kenji Ito',
        role: 'COO',
        company: 'Aurora Ventures',
      },
    },
    {
      id: 'endorsement-05',
      quote: 'We used their frameworks to win an eight-figure enterprise proposal. The endorsement wall continues to convert prospects.',
      rating: 4.95,
      tags: ['Revenue impact', 'Playbooks'],
      publishedAt: 'Published Feb 28, 2024',
      author: {
        name: 'Haley Brooks',
        role: 'Founder',
        company: 'Greyline Studio',
      },
    },
  ],
  filters: [
    { id: 'all', label: 'All endorsements' },
    { id: 'momentum', label: 'Launch velocity', tag: 'Launch velocity' },
    { id: 'culture', label: 'Team culture', tag: 'Culture' },
    { id: 'mentorship', label: 'Mentorship', tag: 'Mentorship' },
    { id: 'revenue', label: 'Revenue impact', tag: 'Revenue impact' },
  ],
  status: null,
  onFilterChange: undefined,
  onShare: () => {},
};
