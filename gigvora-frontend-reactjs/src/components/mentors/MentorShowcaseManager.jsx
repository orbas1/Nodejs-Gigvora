import { useEffect, useMemo, useState } from 'react';
import useLocalCollection from '../../hooks/useLocalCollection.js';
import { classNames } from '../../utils/classNames.js';
import randomId from '../../utils/randomId.js';
import { formatRelativeTime } from '../../utils/date.js';

const BOOKING_STATUSES = [
  { value: 'pending', label: 'Pending confirmation' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'rescheduled', label: 'Rescheduled' },
  { value: 'cancelled', label: 'Cancelled' },
];

const SEED_MENTORS = [
  {
    id: 'mentor-linh-tran',
    name: 'Linh Tran',
    headline: 'Marketplace growth partner',
    category: 'Growth & Product',
    title: 'Former VP Growth at Glossier • Angel investor',
    price: 240,
    currency: 'GBP',
    sessionDuration: 60,
    location: 'London, UK (Hybrid)',
    remote: true,
    description:
      'Helps venture-backed founders operationalise product-led growth, retention rituals, and marketplace liquidity strategies. 70+ founders supported across marketplaces, fintech, and creator platforms.',
    bio:
      'Linh ran EMEA growth at Glossier before scaling a global experimentation team at a Series C fintech. She blends storytelling, analytics, and operations to help founders design repeatable revenue engines.',
    heroImageUrl: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1400&q=80',
    posterUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=5qap5aO4i9A',
    skills: ['Marketplace strategy', 'Experimentation design', 'Team rituals'],
    tags: ['Growth mentor', 'Marketplace', 'Operator'],
    rating: 4.9,
    reviewCount: 68,
    testimonials: [
      {
        id: 'testimonial-a',
        author: 'Evelyn Park • Founder @ Kinetic',
        rating: 5,
        comment: 'Linh rebuilt our retention loops and launched the mentor-led activation playbook that doubled weekly revenue.',
        createdAt: '2024-04-11T12:00:00Z',
      },
      {
        id: 'testimonial-b',
        author: 'Marcus Rivera • CEO @ SupplyLoop',
        rating: 5,
        comment: 'She understands the politics behind growth orgs and helps leadership align around measurable outcomes.',
        createdAt: '2024-02-03T09:00:00Z',
      },
    ],
    offerings: [
      {
        id: 'offering-growth-sprint',
        name: '6-week growth sprint',
        price: '£2,800',
        description: 'Weekly strategy sessions + async reviews to ship growth experiments with accountability.',
      },
      {
        id: 'offering-story-lab',
        name: 'Story-driven deck review',
        price: '£520',
        description: 'Deep review of investor or partner decks with async Loom feedback + live rehearsal.',
      },
    ],
    gallery: [
      {
        id: 'mentor-linh-gallery-1',
        url: 'https://images.unsplash.com/photo-1529158062015-cad636e69505?auto=format&fit=crop&w=1200&q=80',
        caption: 'Live growth clinic during Gigvora Impact Week.',
      },
      {
        id: 'mentor-linh-gallery-2',
        url: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80',
        caption: 'Marketplace strategy lab with founders.',
      },
    ],
    showcase: [
      'Scaled Glossier’s Europe business from 0 to £35M ARR in 18 months.',
      'Coached 12 founders to YC/Sequoia fundraising with storytelling frameworks.',
      'Designed and shipped the Gigvora retention flywheel blueprint.',
    ],
    bookings: [
      {
        id: 'booking-kinetic',
        menteeName: 'Evelyn Park',
        email: 'evelyn@gigvora.dev',
        focus: 'Marketplace retention audit',
        scheduledAt: '2024-06-02T14:00:00Z',
        status: 'confirmed',
        notes: 'Needs follow-up deck for board sync.',
      },
    ],
  },
  {
    id: 'mentor-adan-cortez',
    name: 'Adan Cortez',
    headline: 'AI systems + ops mentor',
    category: 'Operations & Automation',
    title: 'CTO in residence @ Gigvora • ex-Slack automation lead',
    price: 180,
    currency: 'USD',
    sessionDuration: 45,
    location: 'Mexico City, MX (Remote)',
    remote: true,
    description:
      'Pairs startups and agencies with pragmatic AI automations. Specialises in workflow design, byok guardrails, and human-in-the-loop operations.',
    bio:
      'Adan led Slack’s automation platform, built the Launchpad operations OS, and now advises agencies on AI-enabled service delivery.',
    heroImageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1400&q=80',
    posterUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://player.vimeo.com/video/327515493',
    skills: ['Automation', 'Data ops', 'Workflow design'],
    tags: ['AI mentor', 'Systems design', 'Remote'],
    rating: 4.8,
    reviewCount: 54,
    testimonials: [
      {
        id: 'testimonial-c',
        author: 'Priya Desai • COO @ Aurora Labs',
        rating: 5,
        comment: 'Adan helped us replace manual onboarding with AI agents, saving 40+ hours per week.',
        createdAt: '2024-05-07T10:00:00Z',
      },
    ],
    offerings: [
      {
        id: 'offering-automation-roadmap',
        name: 'Automation roadmap intensive',
        price: '$1,950',
        description: 'Design an AI automation roadmap with stack recommendations and guardrails.',
      },
    ],
    gallery: [
      {
        id: 'mentor-adan-gallery-1',
        url: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1200&q=80',
        caption: 'Automation workshop for Launchpad operators.',
      },
    ],
    showcase: [
      'Led Slack automation platform used by 100k+ teams.',
      'Built Gigvora Launchpad operations OS for 400+ startups.',
      'Designed safeguarding controls for AI agents at enterprise scale.',
    ],
    bookings: [
      {
        id: 'booking-aurora',
        menteeName: 'Priya Desai',
        email: 'priya@gigvora.dev',
        focus: 'Automation audit follow-up',
        scheduledAt: '2024-06-05T17:30:00Z',
        status: 'pending',
        notes: 'Share blueprint before call.',
      },
      {
        id: 'booking-ops-lab',
        menteeName: 'Ops Lab Team',
        email: 'ops.lab@gigvora.dev',
        focus: 'AI guardrails workshop',
        scheduledAt: '2024-06-09T15:00:00Z',
        status: 'confirmed',
        notes: 'Need recording + templates after call.',
      },
    ],
  },
  {
    id: 'mentor-aliya-rahman',
    name: 'Aliya Rahman',
    headline: 'Storytelling & leadership mentor',
    category: 'Leadership & Storytelling',
    title: 'Chief Storyteller @ Narrative Atlas • ex-IDEO',
    price: 320,
    currency: 'USD',
    sessionDuration: 90,
    location: 'New York, USA (Hybrid)',
    remote: false,
    description:
      'Coaches founders and executives on narrative design, investor storytelling, and team communication. Known for immersive workshops that turn complex stories into movements.',
    bio:
      'Aliya ran storytelling at IDEO, launched Narrative Atlas, and mentors venture-backed founders in climate, fintech, and community tech.',
    heroImageUrl: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=1400&q=80',
    posterUrl: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=JZloSRBq9Jk',
    skills: ['Storytelling', 'Leadership coaching', 'Communication'],
    tags: ['Executive mentor', 'Storytelling', 'In-person'],
    rating: 5,
    reviewCount: 41,
    testimonials: [
      {
        id: 'testimonial-d',
        author: 'Hannah Cooper • CEO @ TerraFlow',
        rating: 5,
        comment: 'Aliya transformed our fundraising story. Investors quoted her frameworks in every follow-up.',
        createdAt: '2024-03-22T18:00:00Z',
      },
    ],
    offerings: [
      {
        id: 'offering-intensive',
        name: 'Executive storytelling intensive',
        price: '$4,500',
        description: 'Two-day immersive narrative lab with live filming, async feedback, and comms plan.',
      },
      {
        id: 'offering-hourly',
        name: 'Leadership tune-up session',
        price: '$420',
        description: '90-minute session focused on comms challenges, board updates, or team rituals.',
      },
    ],
    gallery: [
      {
        id: 'mentor-aliya-gallery-1',
        url: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=1200&q=80',
        caption: 'Narrative workshop in a Gigvora studio.',
      },
      {
        id: 'mentor-aliya-gallery-2',
        url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
        caption: 'Executive storytelling rehearsal.',
      },
    ],
    showcase: [
      'Led 200+ founders through communication bootcamps.',
      'Speechwriter to Fortune 100 executives and public sector leaders.',
      'Co-created the Gigvora story OS used by accelerator cohorts.',
    ],
    bookings: [
      {
        id: 'booking-terraflow',
        menteeName: 'Hannah Cooper',
        email: 'hannah@gigvora.dev',
        focus: 'Fundraising narrative rehearsal',
        scheduledAt: '2024-06-07T18:00:00Z',
        status: 'confirmed',
        notes: 'In-person session at Narrative Atlas studio.',
      },
    ],
  },
];

function formatPrice(price, currency) {
  if (!price) return 'Custom pricing';
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 0,
    }).format(price);
  } catch (error) {
    return `${currency ?? 'USD'} ${price}`;
  }
}

function computeSummary(mentors) {
  const total = mentors.length;
  const remote = mentors.filter((mentor) => mentor.remote).length;
  const averageRating = mentors.length
    ? (mentors.reduce((acc, mentor) => acc + (mentor.rating ?? 0), 0) / mentors.length).toFixed(1)
    : '0.0';
  const upcomingBookings = mentors.reduce(
    (acc, mentor) =>
      acc + (Array.isArray(mentor.bookings) ? mentor.bookings.filter((booking) => booking.status !== 'completed').length : 0),
    0,
  );
  return { total, remote, averageRating, upcomingBookings };
}

function MentorCard({ mentor, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(mentor.id)}
      className={classNames(
        'flex w-full flex-col items-start rounded-3xl border p-4 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
        selected
          ? 'border-accent bg-accentSoft/70 shadow-soft'
          : 'border-slate-200 bg-white/90 hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-lg',
      )}
    >
      <div className="flex w-full items-center justify-between gap-3 text-xs text-slate-500">
        <span className="font-semibold text-slate-700">{mentor.headline}</span>
        <span>{mentor.location}</span>
      </div>
      <p className="mt-2 text-sm font-semibold text-slate-900">{mentor.name}</p>
      <p className="mt-2 line-clamp-3 text-xs text-slate-500">{mentor.title}</p>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-wide">
        <span className="rounded-full bg-slate-900 px-2.5 py-0.5 text-white">
          {formatPrice(mentor.price, mentor.currency)} / {mentor.sessionDuration}m
        </span>
        <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-indigo-700">{mentor.rating}★</span>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-600">
          {(mentor.skills ?? []).slice(0, 2).join(' • ')}
        </span>
      </div>
    </button>
  );
}

function MentorForm({ open, initialValue, onSubmit, onClose }) {
  const [form, setForm] = useState(() => ({
    name: initialValue?.name ?? '',
    headline: initialValue?.headline ?? '',
    category: initialValue?.category ?? '',
    title: initialValue?.title ?? '',
    price: initialValue?.price ?? '',
    currency: initialValue?.currency ?? 'USD',
    sessionDuration: initialValue?.sessionDuration ?? 60,
    location: initialValue?.location ?? '',
    remote: Boolean(initialValue?.remote ?? true),
    description: initialValue?.description ?? '',
    bio: initialValue?.bio ?? '',
    skills: (initialValue?.skills ?? []).join(', '),
    tags: (initialValue?.tags ?? []).join(', '),
    heroImageUrl: initialValue?.heroImageUrl ?? '',
    posterUrl: initialValue?.posterUrl ?? '',
    videoUrl: initialValue?.videoUrl ?? '',
    gallery: (initialValue?.gallery ?? [])
      .map((item) => (item.caption ? `${item.url} | ${item.caption}` : item.url))
      .join('\n'),
    showcase: (initialValue?.showcase ?? []).join('\n'),
  }));

  useEffect(() => {
    if (!open) return;
    setForm({
      name: initialValue?.name ?? '',
      headline: initialValue?.headline ?? '',
      category: initialValue?.category ?? '',
      title: initialValue?.title ?? '',
      price: initialValue?.price ?? '',
      currency: initialValue?.currency ?? 'USD',
      sessionDuration: initialValue?.sessionDuration ?? 60,
      location: initialValue?.location ?? '',
      remote: Boolean(initialValue?.remote ?? true),
      description: initialValue?.description ?? '',
      bio: initialValue?.bio ?? '',
      skills: (initialValue?.skills ?? []).join(', '),
      tags: (initialValue?.tags ?? []).join(', '),
      heroImageUrl: initialValue?.heroImageUrl ?? '',
      posterUrl: initialValue?.posterUrl ?? '',
      videoUrl: initialValue?.videoUrl ?? '',
      gallery: (initialValue?.gallery ?? [])
        .map((item) => (item.caption ? `${item.url} | ${item.caption}` : item.url))
        .join('\n'),
      showcase: (initialValue?.showcase ?? []).join('\n'),
    });
  }, [initialValue, open]);

  if (!open) return null;

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((previous) => ({ ...previous, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      name: form.name.trim(),
      headline: form.headline.trim(),
      category: form.category.trim(),
      title: form.title.trim(),
      price: form.price ? Number(form.price) : null,
      currency: form.currency.trim() || 'USD',
      sessionDuration: form.sessionDuration ? Number(form.sessionDuration) : 60,
      location: form.location.trim(),
      remote: Boolean(form.remote),
      description: form.description.trim(),
      bio: form.bio.trim(),
      skills: form.skills
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean),
      tags: form.tags
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean),
      heroImageUrl: form.heroImageUrl.trim() || undefined,
      posterUrl: form.posterUrl.trim() || undefined,
      videoUrl: form.videoUrl.trim() || undefined,
      gallery: form.gallery
        ? form.gallery
            .split('\n')
            .map((line) => {
              const [url, caption] = line.split('|').map((segment) => segment.trim());
              if (!url) return null;
              return { id: randomId('mentor-gallery'), url, caption: caption || undefined };
            })
            .filter(Boolean)
        : [],
      showcase: form.showcase
        ? form.showcase
            .split('\n')
            .map((entry) => entry.trim())
            .filter(Boolean)
        : [],
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-10">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <form onSubmit={handleSubmit} className="max-h-[90vh] overflow-y-auto p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">
                {initialValue ? 'Update mentor profile' : 'Add mentor to marketplace'}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Include price, craft focus, multimedia, and location so mentees can evaluate sessions instantly.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
            >
              <span className="text-lg" aria-hidden="true">
                ×
              </span>
              <span className="sr-only">Close</span>
            </button>
          </div>

          <div className="mt-6 grid gap-6">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                Name
                <input
                  required
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Headline
                <input
                  name="headline"
                  value={form.headline}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  placeholder="Marketplace growth partner"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                Category
                <input
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  placeholder="Growth & Product"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Title / credentials
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  placeholder="Former VP Growth at..."
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="block text-sm font-medium text-slate-700">
                Price per session
                <input
                  name="price"
                  type="number"
                  min="0"
                  step="1"
                  value={form.price}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Currency
                <input
                  name="currency"
                  value={form.currency}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  placeholder="USD"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Session duration (minutes)
                <input
                  name="sessionDuration"
                  type="number"
                  min="15"
                  value={form.sessionDuration}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr),auto]">
              <label className="block text-sm font-medium text-slate-700">
                Location
                <input
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  placeholder="Remote, London, NYC studio"
                />
              </label>
              <label className="inline-flex items-center gap-3 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  name="remote"
                  checked={Boolean(form.remote)}
                  onChange={handleChange}
                  className="h-5 w-5 rounded border-slate-300 text-accent focus:ring-accent/40"
                />
                Remote friendly
              </label>
            </div>

            <label className="block text-sm font-medium text-slate-700">
              Mentor description
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Bio
              <textarea
                name="bio"
                value={form.bio}
                onChange={handleChange}
                rows={4}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Core skills (comma separated)
              <input
                name="skills"
                value={form.skills}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Tags (comma separated)
              <input
                name="tags"
                value={form.tags}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                Hero image URL
                <input
                  name="heroImageUrl"
                  value={form.heroImageUrl}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Poster image URL
                <input
                  name="posterUrl"
                  value={form.posterUrl}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </label>
            </div>

            <label className="block text-sm font-medium text-slate-700">
              Video URL (YouTube, Vimeo, MP4)
              <input
                name="videoUrl"
                value={form.videoUrl}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Gallery (one per line: URL | Caption)
              <textarea
                name="gallery"
                value={form.gallery}
                onChange={handleChange}
                rows={4}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Showcase highlights (one per line)
              <textarea
                name="showcase"
                value={form.showcase}
                onChange={handleChange}
                rows={3}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark"
            >
              {initialValue ? 'Update mentor' : 'Add mentor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BookingForm({ open, onSubmit, onClose }) {
  const [form, setForm] = useState({ menteeName: '', email: '', focus: '', scheduledAt: '', notes: '' });

  useEffect(() => {
    if (!open) return;
    setForm({ menteeName: '', email: '', focus: '', scheduledAt: '', notes: '' });
  }, [open]);

  if (!open) return null;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      id: randomId('mentor-booking'),
      menteeName: form.menteeName.trim(),
      email: form.email.trim(),
      focus: form.focus.trim(),
      scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : new Date().toISOString(),
      status: 'pending',
      notes: form.notes.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-10">
      <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <form onSubmit={handleSubmit} className="max-h-[90vh] overflow-y-auto p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Schedule mentorship</h3>
              <p className="mt-1 text-sm text-slate-500">Capture mentee requests, session goals, and session logistics.</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
            >
              <span className="text-lg" aria-hidden="true">
                ×
              </span>
              <span className="sr-only">Close</span>
            </button>
          </div>

          <div className="mt-6 grid gap-4">
            <label className="block text-sm font-medium text-slate-700">
              Mentee name
              <input
                required
                name="menteeName"
                value={form.menteeName}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Email
              <input
                required
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Focus area
              <input
                name="focus"
                value={form.focus}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                placeholder="Example: Fundraising deck review"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Schedule
              <input
                type="datetime-local"
                name="scheduledAt"
                value={form.scheduledAt}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Notes
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={3}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-500">Bookings feed dashboards and automated reminders.</p>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-emerald-700"
            >
              Add booking
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BookingList({ bookings, onStatusChange, onRemove }) {
  if (!bookings?.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-10 text-center text-sm text-slate-500">
        New mentorship bookings will appear here once mentees submit requests.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {bookings.map((booking) => (
        <article key={booking.id} className="rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              <p className="text-sm font-semibold text-slate-900">{booking.menteeName}</p>
              <p>{booking.email}</p>
            </div>
            <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
              {booking.scheduledAt ? formatRelativeTime(booking.scheduledAt) : 'Scheduling'}
            </span>
          </div>
          {booking.focus ? <p className="mt-3 text-sm text-slate-600">Focus: {booking.focus}</p> : null}
          {booking.notes ? <p className="mt-2 text-sm leading-relaxed text-slate-600">{booking.notes}</p> : null}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Status
              <select
                value={booking.status ?? 'pending'}
                onChange={(event) => onStatusChange(booking.id, event.target.value)}
                className="ml-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
              >
                {BOOKING_STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => onRemove(booking.id)}
              className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-100"
            >
              Remove
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

function renderVideoEmbed(url) {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  const youTubeMatch = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([A-Za-z0-9_-]{5,})/i);
  if (youTubeMatch) {
    const embedUrl = `https://www.youtube.com/embed/${youTubeMatch[1]}`;
    return (
      <iframe
        title="Mentor showcase video"
        src={`${embedUrl}?rel=0`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="h-64 w-full rounded-3xl border border-slate-200"
      />
    );
  }
  if (trimmed.includes('player.vimeo.com')) {
    return (
      <iframe
        title="Mentor showcase video"
        src={trimmed}
        className="h-64 w-full rounded-3xl border border-slate-200"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
      />
    );
  }
  return (
    <video controls className="h-64 w-full rounded-3xl border border-slate-200 object-cover" src={trimmed}>
      <track kind="captions" srcLang="en" label="English captions" />
      Your browser does not support embedded videos.
    </video>
  );
}

export default function MentorShowcaseManager() {
  const {
    items: mentors,
    createItem,
    updateItem,
    removeItem,
    resetCollection,
  } = useLocalCollection('mentors-showcase-v1', { seed: SEED_MENTORS });

  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(mentors[0]?.id ?? null);
  const [showForm, setShowForm] = useState(false);
  const [editingMentor, setEditingMentor] = useState(null);
  const [showBookingForm, setShowBookingForm] = useState(false);

  useEffect(() => {
    if (!selectedId && mentors.length) {
      setSelectedId(mentors[0].id);
    }
  }, [mentors, selectedId]);

  const filteredMentors = useMemo(() => {
    return mentors.filter((mentor) => {
      const haystack = [mentor.name, mentor.headline, mentor.category, mentor.title, ...(mentor.tags ?? [])]
        .join(' ')
        .toLowerCase();
      return haystack.includes(search.toLowerCase());
    });
  }, [mentors, search]);

  const selectedMentor = useMemo(() => mentors.find((mentor) => mentor.id === selectedId) ?? null, [mentors, selectedId]);
  const summary = useMemo(() => computeSummary(mentors), [mentors]);

  const handleCreate = () => {
    setEditingMentor(null);
    setShowForm(true);
  };

  const handleEdit = () => {
    if (!selectedMentor) return;
    setEditingMentor(selectedMentor);
    setShowForm(true);
  };

  const handleSubmitMentor = (payload) => {
    if (editingMentor) {
      updateItem(editingMentor.id, (existing) => ({ ...existing, ...payload }));
      setSelectedId(editingMentor.id);
    } else {
      const created = createItem({ ...payload, rating: 5, reviewCount: 0, testimonials: [], bookings: [] });
      setSelectedId(created.id);
    }
    setShowForm(false);
    setEditingMentor(null);
  };

  const handleDelete = () => {
    if (!selectedMentor) return;
    removeItem(selectedMentor.id);
  };

  const handleDuplicate = () => {
    if (!selectedMentor) return;
    const copy = createItem({
      ...selectedMentor,
      id: randomId('mentor'),
      name: `${selectedMentor.name} (copy)`,
      bookings: [],
    });
    setSelectedId(copy.id);
  };

  const handleBookingSubmit = (booking) => {
    if (!selectedMentor) return;
    updateItem(selectedMentor.id, (existing) => ({
      ...existing,
      bookings: [...(existing.bookings ?? []), booking],
    }));
    setShowBookingForm(false);
  };

  const handleBookingStatus = (bookingId, status) => {
    if (!selectedMentor) return;
    updateItem(selectedMentor.id, (existing) => ({
      ...existing,
      bookings: (existing.bookings ?? []).map((booking) =>
        booking.id === bookingId ? { ...booking, status } : booking,
      ),
    }));
  };

  const handleBookingRemove = (bookingId) => {
    if (!selectedMentor) return;
    updateItem(selectedMentor.id, (existing) => ({
      ...existing,
      bookings: (existing.bookings ?? []).filter((booking) => booking.id !== bookingId),
    }));
  };

  return (
    <section className="mt-12 rounded-[2.5rem] border border-slate-200 bg-gradient-to-br from-white via-white to-rose-50 p-8 shadow-2xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mentor marketplace studio</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Curate mentors, showcase their craft, and manage bookings</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Maintain production-ready mentor profiles with pricing, multimedia, and live booking pipelines. Perfect for demoing the
            mentor experience or running invite-only guilds before syncing with the production API.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={resetCollection}
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
          >
            Restore sample mentors
          </button>
          <button
            type="button"
            onClick={handleCreate}
            className="inline-flex items-center rounded-full bg-accent px-6 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark"
          >
            New mentor
          </button>
        </div>
      </div>

      <dl className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mentors live</dt>
          <dd className="mt-3 text-3xl font-semibold text-slate-900">{summary.total}</dd>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Remote friendly</dt>
          <dd className="mt-3 text-3xl font-semibold text-slate-900">{summary.remote}</dd>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Average rating</dt>
          <dd className="mt-3 text-3xl font-semibold text-slate-900">{summary.averageRating}</dd>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Upcoming sessions</dt>
          <dd className="mt-3 text-3xl font-semibold text-slate-900">{summary.upcomingBookings}</dd>
        </div>
      </dl>

      <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr),minmax(0,2fr)]">
        <aside className="space-y-4 rounded-[2rem] border border-slate-200 bg-white/90 p-5 shadow-inner">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="mentor-search-input">
              Search mentors
            </label>
            <input
              id="mentor-search-input"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by mentor, craft, or tag"
              className="mt-2 w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div className="space-y-3">
            {filteredMentors.length ? (
              filteredMentors.map((mentor) => (
                <MentorCard key={mentor.id} mentor={mentor} selected={mentor.id === selectedId} onSelect={setSelectedId} />
              ))
            ) : (
              <p className="text-sm text-slate-500">No mentors match those filters. Try broadening your search.</p>
            )}
          </div>
        </aside>

        <div className="space-y-6">
          {selectedMentor ? (
            <article className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white/95 shadow-xl">
              {selectedMentor.heroImageUrl ? (
                <div className="relative h-60 w-full overflow-hidden">
                  <img src={selectedMentor.heroImageUrl} alt="Mentor showcase" className="h-full w-full object-cover" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
                  <div className="absolute bottom-5 left-5 right-5 flex flex-wrap items-end justify-between gap-3 text-white">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-200">{selectedMentor.headline}</p>
                      <h3 className="mt-1 text-2xl font-semibold">{selectedMentor.name}</h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide">
                      <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1">
                        {formatPrice(selectedMentor.price, selectedMentor.currency)} / {selectedMentor.sessionDuration}m
                      </span>
                      <span className="inline-flex items-center rounded-full bg-amber-500/80 px-3 py-1">
                        {selectedMentor.rating}★ ({selectedMentor.reviewCount} reviews)
                      </span>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="space-y-8 p-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                      {selectedMentor.category}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                      {selectedMentor.location}
                    </span>
                    {(selectedMentor.skills ?? []).map((skill) => (
                      <span key={skill} className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-indigo-700">
                        {skill}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowBookingForm(true)}
                      className="inline-flex items-center rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-emerald-700"
                    >
                      Book session
                    </button>
                    <button
                      type="button"
                      onClick={handleEdit}
                      className="inline-flex items-center rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                    >
                      Edit profile
                    </button>
                    <button
                      type="button"
                      onClick={handleDuplicate}
                      className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                    >
                      Duplicate
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-100"
                    >
                      Archive
                    </button>
                  </div>
                </div>

                <section className="space-y-4">
                  <h4 className="text-lg font-semibold text-slate-900">About</h4>
                  <p className="text-sm leading-relaxed text-slate-600">{selectedMentor.description}</p>
                  <p className="text-sm leading-relaxed text-slate-600">{selectedMentor.bio}</p>
                </section>

                {(selectedMentor.showcase ?? []).length ? (
                  <section>
                    <h4 className="text-lg font-semibold text-slate-900">Showcase highlights</h4>
                    <ul className="mt-3 space-y-2 text-sm text-slate-600">
                      {selectedMentor.showcase.map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-rose-500" aria-hidden="true" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                {(selectedMentor.offerings ?? []).length ? (
                  <section>
                    <h4 className="text-lg font-semibold text-slate-900">Offerings</h4>
                    <div className="mt-3 grid gap-3 lg:grid-cols-2">
                      {selectedMentor.offerings.map((offering) => (
                        <div key={offering.id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                          <p className="text-sm font-semibold text-slate-900">{offering.name}</p>
                          <p className="mt-1 text-xs text-slate-500">{offering.price}</p>
                          <p className="mt-2 text-sm text-slate-600">{offering.description}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                ) : null}

                {selectedMentor.videoUrl ? (
                  <section className="space-y-3">
                    <h4 className="text-lg font-semibold text-slate-900">Showreel</h4>
                    {renderVideoEmbed(selectedMentor.videoUrl)}
                  </section>
                ) : null}

                {(selectedMentor.gallery ?? []).length ? (
                  <section>
                    <h4 className="text-lg font-semibold text-slate-900">Gallery</h4>
                    <div className="mt-3 grid gap-4 sm:grid-cols-2">
                      {selectedMentor.gallery.map((item) => (
                        <figure key={item.id ?? item.url} className="overflow-hidden rounded-2xl border border-slate-200">
                          <img src={item.url} alt={item.caption || 'Mentor gallery'} className="h-40 w-full object-cover" loading="lazy" />
                          {item.caption ? (
                            <figcaption className="px-4 py-3 text-xs text-slate-600">{item.caption}</figcaption>
                          ) : null}
                        </figure>
                      ))}
                    </div>
                  </section>
                ) : null}

                {(selectedMentor.testimonials ?? []).length ? (
                  <section>
                    <h4 className="text-lg font-semibold text-slate-900">Testimonials</h4>
                    <div className="mt-3 grid gap-3 lg:grid-cols-2">
                      {selectedMentor.testimonials.map((testimonial) => (
                        <blockquote key={testimonial.id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                          <p className="text-sm text-slate-600">“{testimonial.comment}”</p>
                          <footer className="mt-3 flex items-center justify-between text-xs text-slate-500">
                            <span>{testimonial.author}</span>
                            <span>{testimonial.rating}★</span>
                          </footer>
                        </blockquote>
                      ))}
                    </div>
                  </section>
                ) : null}

                <section className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h4 className="text-lg font-semibold text-slate-900">Bookings</h4>
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {(selectedMentor.bookings ?? []).length} active
                    </span>
                  </div>
                  <BookingList
                    bookings={selectedMentor.bookings}
                    onStatusChange={handleBookingStatus}
                    onRemove={handleBookingRemove}
                  />
                </section>
              </div>
            </article>
          ) : (
            <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white/70 p-12 text-center text-sm text-slate-500">
              Select a mentor to view their showcase, pricing, and active mentorship bookings.
            </div>
          )}
        </div>
      </div>

      <MentorForm
        open={showForm}
        initialValue={editingMentor}
        onClose={() => {
          setShowForm(false);
          setEditingMentor(null);
        }}
        onSubmit={handleSubmitMentor}
      />

      <BookingForm
        open={showBookingForm}
        onClose={() => setShowBookingForm(false)}
        onSubmit={handleBookingSubmit}
      />
    </section>
  );
}
