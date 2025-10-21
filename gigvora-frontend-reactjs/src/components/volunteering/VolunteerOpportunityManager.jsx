import { useEffect, useMemo, useState } from 'react';
import useLocalCollection from '../../hooks/useLocalCollection.js';
import { classNames } from '../../utils/classNames.js';
import randomId from '../../utils/randomId.js';
import { formatRelativeTime } from '../../utils/date.js';

const APPLICATION_STATUSES = [
  { value: 'new', label: 'New' },
  { value: 'in-review', label: 'In review' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'invited', label: 'Invited to interview' },
  { value: 'placed', label: 'Placed' },
  { value: 'declined', label: 'Declined' },
];

const SEED_VOLUNTEER_OPPORTUNITIES = [
  {
    id: 'vol-civic-sprint',
    title: 'Civic Innovation Sprint Lead',
    organization: 'Open Cities Alliance',
    missionStatement:
      'Mobilise a cross-functional guild of designers and product thinkers to reimagine public high streets with climate-positive defaults.',
    description:
      'Lead a 10-week design sprint in partnership with three UK councils. You will guide research squads, facilitate co-design sessions with residents, and synthesise findings into tactical service blueprints that will be shared with civic partners across Europe.',
    location: 'London, United Kingdom',
    timezone: 'Europe/London (GMT+1)',
    isRemote: true,
    remotePolicy: 'Hybrid remote with optional in-person research immersions in London and Bristol. Travel stipends provided.',
    commitmentHours: 6,
    startDate: '2024-07-08',
    endDate: '2024-09-30',
    applicationDeadline: '2024-06-30',
    applicationUrl: 'https://forms.gle/impact-civic-sprint',
    contactEmail: 'impact@opencities.org',
    heroImageUrl:
      'https://images.unsplash.com/photo-1524230572899-a752b3835840?auto=format&fit=crop&w=1400&q=80',
    posterUrl:
      'https://images.unsplash.com/photo-1523875194681-bedd468c58bf?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=O9Uu_gY8aQg',
    focusAreas: ['Urban design', 'Civic technology', 'Climate resilience'],
    tags: ['Design sprint', 'Impact leadership', 'Community co-design'],
    perks: ['Impact credit towards Gigvora Impact Ledger', 'Travel stipend for on-site immersions', 'Curated leadership circles access'],
    gallery: [
      {
        id: 'gal-civic-1',
        url: 'https://images.unsplash.com/photo-1523875194681-bedd468c58bf?auto=format&fit=crop&w=1200&q=80',
        caption: 'Resident journey mapping workshop with Open Cities Alliance.',
      },
      {
        id: 'gal-civic-2',
        url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80',
        caption: 'Prototype testing within a converted community hall.',
      },
    ],
    applications: [
      {
        id: 'app-lena-morales',
        name: 'Lena Morales',
        email: 'lena.morales@gigvora.dev',
        phone: '+44 20 1234 9876',
        availability: 'Weekends + Wednesday evenings',
        portfolioUrl: 'https://dribbble.com/lenamorales',
        status: 'shortlisted',
        submittedAt: '2024-05-12T15:32:00Z',
        message:
          'Previously led the Barcelona civic lab redesign. Comfortable running dual-track discovery and mapping compliance implications for council stakeholders.',
      },
      {
        id: 'app-raj-singh',
        name: 'Raj Singh',
        email: 'raj.singh@gigvora.dev',
        phone: '+44 7975 555 291',
        availability: 'GMT±2 timezone friendly',
        portfolioUrl: 'https://www.behance.net/rajsingh',
        status: 'in-review',
        submittedAt: '2024-05-18T10:04:00Z',
        message: 'Product strategist with civic data background. Keen to embed AI assisted service pattern analysis.',
      },
    ],
  },
  {
    id: 'vol-rapid-response',
    title: 'Rapid Response Operations Designer',
    organization: 'Relief Routes Coalition',
    missionStatement:
      'Build a lightning fast volunteer logistics pod for extreme weather responses across Southeast Asia.',
    description:
      'We are prototyping an SMS-first coordination product so frontline responders can route food and medical supplies within minutes. Volunteers will audit the service blueprint, pair with local NGOs, and establish a governance model for data sharing.',
    location: 'Manila, Philippines',
    timezone: 'Asia/Manila (GMT+8)',
    isRemote: true,
    remotePolicy: 'Fully remote. Two optional in-region immersions covered by the coalition.',
    commitmentHours: 4,
    startDate: '2024-08-01',
    endDate: '2024-11-15',
    applicationDeadline: '2024-07-10',
    applicationUrl: 'https://reliefroutes.typeform.com/ops-designer',
    contactEmail: 'ops@reliefroutes.org',
    heroImageUrl:
      'https://images.unsplash.com/photo-1509099863731-ef4bff19e808?auto=format&fit=crop&w=1400&q=80',
    posterUrl:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://player.vimeo.com/video/76979871',
    focusAreas: ['Emergency response', 'Service design', 'Data governance'],
    tags: ['Crisis response', 'Humanitarian', 'Operational excellence'],
    perks: ['Dedicated security briefing + tooling kit', 'Pathway to Relief Routes fellowships', 'Spotlight feature on Gigvora impact feed'],
    gallery: [
      {
        id: 'gal-rapid-1',
        url: 'https://images.unsplash.com/photo-1526481280695-3c46917d3cb3?auto=format&fit=crop&w=1200&q=80',
        caption: 'Field coordination exercise with local partners in Cebu.',
      },
      {
        id: 'gal-rapid-2',
        url: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80',
        caption: 'Routing dashboard prototypes being tested with volunteers.',
      },
    ],
    applications: [
      {
        id: 'app-jo-kawasaki',
        name: 'Jo Kawasaki',
        email: 'jo.kawasaki@gigvora.dev',
        phone: '+81 90 1112 4321',
        availability: 'Weekdays after 18:00 JST',
        portfolioUrl: 'https://kawasaki.design',
        status: 'invited',
        submittedAt: '2024-05-20T09:12:00Z',
        message: 'Operations designer from Tokyo with Red Cross rapid response background.',
      },
    ],
  },
  {
    id: 'vol-stem-girls',
    title: 'STEM Futures Mentor (Girls in Tech Edition)',
    organization: 'FutureLab Foundation',
    missionStatement:
      'Coach 60 teenage girls across Lagos into robotics and AI competitions with a mix of remote and on-campus sessions.',
    description:
      'Design a 12-week mentorship arc that blends technical sprints, personal development coaching, and industry exposure. Volunteers co-create curriculum, record async video explainers, and host demo days in collaboration with local schools.',
    location: 'Lagos, Nigeria',
    timezone: 'Africa/Lagos (GMT+1)',
    isRemote: false,
    remotePolicy: 'On-campus sessions twice per month. Virtual stand-ups for mentors in other regions.',
    commitmentHours: 3,
    startDate: '2024-09-02',
    endDate: '2024-12-15',
    applicationDeadline: '2024-08-10',
    applicationUrl: 'https://futurelab.ng/apply',
    contactEmail: 'volunteers@futurelab.ng',
    heroImageUrl:
      'https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=1400&q=80',
    posterUrl:
      'https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=Z1S4O8kR-fY',
    focusAreas: ['STEM education', 'Mentorship', 'AI literacy'],
    tags: ['Youth empowerment', 'Mentoring', 'Education'],
    perks: ['Gigvora mentorship accreditation', 'Micro-grant for local experiments', 'Invite to annual FutureLab summit'],
    gallery: [
      {
        id: 'gal-stem-1',
        url: 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1200&q=80',
        caption: 'Hands-on robotics workshop from the 2023 cohort.',
      },
      {
        id: 'gal-stem-2',
        url: 'https://images.unsplash.com/photo-1529336953121-4972ae0f26f9?auto=format&fit=crop&w=1200&q=80',
        caption: 'Mentor pod in a Saturday design thinking lab.',
      },
    ],
    applications: [
      {
        id: 'app-bola-adeyemi',
        name: 'Bola Adeyemi',
        email: 'bola.adeyemi@gigvora.dev',
        phone: '+234 803 555 2211',
        availability: 'Weekends + remote syncs',
        portfolioUrl: 'https://github.com/bola-adeyemi',
        status: 'placed',
        submittedAt: '2024-04-28T11:20:00Z',
        message: 'Electrical engineer with Girls Who Code facilitation background.',
      },
      {
        id: 'app-chen-li',
        name: 'Chen Li',
        email: 'chen.li@gigvora.dev',
        phone: '+1 415 222 1144',
        availability: 'Remote GMT-7 friendly',
        portfolioUrl: 'https://linkedin.com/in/chen-li',
        status: 'new',
        submittedAt: '2024-05-21T20:40:00Z',
        message: 'Robotics engineer at Hyperloop Labs. Keen to run async build nights.',
      },
    ],
  },
];

function formatDate(value) {
  if (!value) return 'TBC';
  try {
    return new Intl.DateTimeFormat('en-GB', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
  } catch (error) {
    return value;
  }
}

function splitByComma(value) {
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function splitByLines(value) {
  return value
    .split('\n')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function buildGalleryFromText(value) {
  return splitByLines(value)
    .map((line) => {
      const [url, caption] = line.split('|').map((segment) => segment.trim());
      if (!url) {
        return null;
      }
      return {
        id: randomId('gallery'),
        url,
        caption: caption || undefined,
      };
    })
    .filter(Boolean);
}

function renderVideoEmbed(url) {
  if (!url) {
    return null;
  }
  const trimmed = url.trim();
  if (!trimmed) {
    return null;
  }
  const youTubeMatch = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([A-Za-z0-9_-]{5,})/i);
  if (youTubeMatch) {
    const videoId = youTubeMatch[1];
    const embedUrl = `https://www.youtube.com/embed/${videoId}`;
    return (
      <iframe
        title="Volunteer mission video"
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
        title="Volunteer mission video"
        src={trimmed}
        className="h-64 w-full rounded-3xl border border-slate-200"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
      />
    );
  }
  return (
    <video
      controls
      className="h-64 w-full rounded-3xl border border-slate-200 object-cover"
      src={trimmed}
      poster=""
    >
      <track kind="captions" srcLang="en" label="English captions" />
      Your browser does not support embedded videos.
    </video>
  );
}

function computeSummary(opportunities) {
  const totalMissions = opportunities.length;
  const totalApplications = opportunities.reduce(
    (accumulator, opportunity) => accumulator + (Array.isArray(opportunity.applications) ? opportunity.applications.length : 0),
    0,
  );
  const placedVolunteers = opportunities.reduce(
    (accumulator, opportunity) =>
      accumulator + (Array.isArray(opportunity.applications)
        ? opportunity.applications.filter((application) => application.status === 'placed').length
        : 0),
    0,
  );
  const remoteFriendly = opportunities.filter((opportunity) => opportunity.isRemote).length;
  return {
    totalMissions,
    totalApplications,
    placedVolunteers,
    remoteFriendly,
  };
}

function OpportunityCard({ opportunity, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(opportunity.id)}
      className={classNames(
        'flex w-full flex-col items-start rounded-3xl border p-4 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
        selected
          ? 'border-accent bg-accentSoft/70 shadow-soft'
          : 'border-slate-200 bg-white/90 hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-lg',
      )}
    >
      <div className="flex w-full items-center justify-between gap-3 text-xs text-slate-500">
        <span className="font-semibold text-slate-700">{opportunity.organization}</span>
        <span>{formatDate(opportunity.startDate)}</span>
      </div>
      <p className="mt-2 text-sm font-semibold text-slate-900">{opportunity.title}</p>
      <p className="mt-2 line-clamp-3 text-xs text-slate-500">{opportunity.missionStatement}</p>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-wide">
        <span className="rounded-full bg-slate-900 px-2.5 py-0.5 text-white">
          {opportunity.isRemote ? 'Remote friendly' : opportunity.location}
        </span>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-600">
          {(opportunity.focusAreas ?? []).slice(0, 2).join(' • ')}
        </span>
        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-emerald-700">
          {(opportunity.applications ?? []).length} applications
        </span>
      </div>
    </button>
  );
}

function OpportunityForm({ open, initialValue, onClose, onSubmit }) {
  const [form, setForm] = useState(() => ({
    title: initialValue?.title ?? '',
    organization: initialValue?.organization ?? '',
    missionStatement: initialValue?.missionStatement ?? '',
    description: initialValue?.description ?? '',
    location: initialValue?.location ?? '',
    timezone: initialValue?.timezone ?? '',
    remotePolicy: initialValue?.remotePolicy ?? '',
    isRemote: Boolean(initialValue?.isRemote ?? false),
    commitmentHours: initialValue?.commitmentHours ?? '',
    startDate: initialValue?.startDate ?? '',
    endDate: initialValue?.endDate ?? '',
    applicationDeadline: initialValue?.applicationDeadline ?? '',
    applicationUrl: initialValue?.applicationUrl ?? '',
    contactEmail: initialValue?.contactEmail ?? '',
    heroImageUrl: initialValue?.heroImageUrl ?? '',
    posterUrl: initialValue?.posterUrl ?? '',
    videoUrl: initialValue?.videoUrl ?? '',
    focusAreas: (initialValue?.focusAreas ?? []).join(', '),
    tags: (initialValue?.tags ?? []).join(', '),
    perks: (initialValue?.perks ?? []).join('\n'),
    gallery: (initialValue?.gallery ?? [])
      .map((item) => (item.caption ? `${item.url} | ${item.caption}` : item.url))
      .join('\n'),
  }));

  useEffect(() => {
    if (!open) {
      return;
    }
    setForm({
      title: initialValue?.title ?? '',
      organization: initialValue?.organization ?? '',
      missionStatement: initialValue?.missionStatement ?? '',
      description: initialValue?.description ?? '',
      location: initialValue?.location ?? '',
      timezone: initialValue?.timezone ?? '',
      remotePolicy: initialValue?.remotePolicy ?? '',
      isRemote: Boolean(initialValue?.isRemote ?? false),
      commitmentHours: initialValue?.commitmentHours ?? '',
      startDate: initialValue?.startDate ?? '',
      endDate: initialValue?.endDate ?? '',
      applicationDeadline: initialValue?.applicationDeadline ?? '',
      applicationUrl: initialValue?.applicationUrl ?? '',
      contactEmail: initialValue?.contactEmail ?? '',
      heroImageUrl: initialValue?.heroImageUrl ?? '',
      posterUrl: initialValue?.posterUrl ?? '',
      videoUrl: initialValue?.videoUrl ?? '',
      focusAreas: (initialValue?.focusAreas ?? []).join(', '),
      tags: (initialValue?.tags ?? []).join(', '),
      perks: (initialValue?.perks ?? []).join('\n'),
      gallery: (initialValue?.gallery ?? [])
        .map((item) => (item.caption ? `${item.url} | ${item.caption}` : item.url))
        .join('\n'),
    });
  }, [initialValue, open]);

  if (!open) {
    return null;
  }

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const payload = {
      title: form.title.trim(),
      organization: form.organization.trim(),
      missionStatement: form.missionStatement.trim(),
      description: form.description.trim(),
      location: form.location.trim(),
      timezone: form.timezone.trim(),
      remotePolicy: form.remotePolicy.trim(),
      isRemote: Boolean(form.isRemote),
      commitmentHours: form.commitmentHours ? Number(form.commitmentHours) : '',
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      applicationDeadline: form.applicationDeadline || undefined,
      applicationUrl: form.applicationUrl.trim() || undefined,
      contactEmail: form.contactEmail.trim() || undefined,
      heroImageUrl: form.heroImageUrl.trim() || undefined,
      posterUrl: form.posterUrl.trim() || undefined,
      videoUrl: form.videoUrl.trim() || undefined,
      focusAreas: form.focusAreas ? splitByComma(form.focusAreas) : [],
      tags: form.tags ? splitByComma(form.tags) : [],
      perks: form.perks ? splitByLines(form.perks) : [],
      gallery: form.gallery ? buildGalleryFromText(form.gallery) : [],
    };
    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-10">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <form onSubmit={handleSubmit} className="max-h-[90vh] overflow-y-auto p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">
                {initialValue ? 'Update volunteer mission' : 'Create volunteer mission'}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Craft a compelling brief with multimedia, logistics, and badges to mobilise the right talent instantly.
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
                Title
                <input
                  required
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  placeholder="Example: Civic Innovation Sprint Lead"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Organization
                <input
                  required
                  name="organization"
                  value={form.organization}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  placeholder="Open Cities Alliance"
                />
              </label>
            </div>

            <label className="block text-sm font-medium text-slate-700">
              Mission statement
              <textarea
                required
                name="missionStatement"
                value={form.missionStatement}
                onChange={handleChange}
                rows={3}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                placeholder="One paragraph that sells the impact story and volunteer outcome."
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Full description
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={5}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                placeholder="Outline responsibilities, collaborators, safeguards, and deliverables."
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                Location
                <input
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  placeholder="City, Country"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Timezone
                <input
                  name="timezone"
                  value={form.timezone}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  placeholder="Europe/London (GMT+1)"
                />
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <label className="inline-flex items-center gap-3 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  name="isRemote"
                  checked={Boolean(form.isRemote)}
                  onChange={handleChange}
                  className="h-5 w-5 rounded border-slate-300 text-accent focus:ring-accent/40"
                />
                Remote friendly mission
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Remote policy details
                <input
                  name="remotePolicy"
                  value={form.remotePolicy}
                  onChange={handleChange}
                  className="mt-2 w-full min-w-[240px] rounded-2xl border border-slate-200 px-4 py-2.5 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  placeholder="Example: 2 onsite immersions, travel covered"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="block text-sm font-medium text-slate-700">
                Weekly hours
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  name="commitmentHours"
                  value={form.commitmentHours}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  placeholder="6"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Start date
                <input
                  type="date"
                  name="startDate"
                  value={form.startDate}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                End date
                <input
                  type="date"
                  name="endDate"
                  value={form.endDate}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="block text-sm font-medium text-slate-700">
                Application deadline
                <input
                  type="date"
                  name="applicationDeadline"
                  value={form.applicationDeadline}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Application URL
                <input
                  name="applicationUrl"
                  value={form.applicationUrl}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  placeholder="https://"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Contact email
                <input
                  name="contactEmail"
                  type="email"
                  value={form.contactEmail}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  placeholder="volunteers@example.org"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                Hero image URL
                <input
                  name="heroImageUrl"
                  value={form.heroImageUrl}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  placeholder="https://images.unsplash.com/..."
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Poster image URL
                <input
                  name="posterUrl"
                  value={form.posterUrl}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  placeholder="https://"
                />
              </label>
            </div>

            <label className="block text-sm font-medium text-slate-700">
              Video URL (YouTube, Vimeo, or MP4)
              <input
                name="videoUrl"
                value={form.videoUrl}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Focus areas (comma separated)
              <input
                name="focusAreas"
                value={form.focusAreas}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                placeholder="Climate, Service design"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Tags (comma separated)
              <input
                name="tags"
                value={form.tags}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                placeholder="Mentorship, Rapid response"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Perks (each on a new line)
              <textarea
                name="perks"
                value={form.perks}
                onChange={handleChange}
                rows={3}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                placeholder="Impact credit\nTravel stipend"
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
                placeholder="https://... | Workshop session"
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
              {initialValue ? 'Update mission' : 'Create mission'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ApplicationForm({ open, opportunity, onClose, onSubmit }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    availability: '',
    portfolioUrl: '',
    message: '',
  });

  useEffect(() => {
    if (!open) {
      return;
    }
    setForm({
      name: '',
      email: '',
      phone: '',
      availability: '',
      portfolioUrl: '',
      message: '',
    });
  }, [open]);

  if (!open) {
    return null;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const payload = {
      id: randomId('application'),
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || undefined,
      availability: form.availability.trim(),
      portfolioUrl: form.portfolioUrl.trim() || undefined,
      message: form.message.trim(),
      status: 'new',
      submittedAt: new Date().toISOString(),
    };
    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-10">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <form onSubmit={handleSubmit} className="max-h-[90vh] overflow-y-auto p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Apply to {opportunity?.title}</h3>
              <p className="mt-1 text-sm text-slate-500">
                Introduce your craft, availability, and impact motivation. The mission steward receives your submission instantly.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
            >
              <span aria-hidden="true" className="text-lg">
                ×
              </span>
              <span className="sr-only">Close</span>
            </button>
          </div>

          <div className="mt-6 grid gap-5">
            <label className="block text-sm font-medium text-slate-700">
              Full name
              <input
                required
                name="name"
                value={form.name}
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
              Phone or messaging handle
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Availability
              <input
                required
                name="availability"
                value={form.availability}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                placeholder="Example: Weeknights GMT or Weekends only"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Portfolio / Linked profile (optional)
              <input
                name="portfolioUrl"
                value={form.portfolioUrl}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                placeholder="https://"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Motivation & relevant experience
              <textarea
                required
                name="message"
                value={form.message}
                onChange={handleChange}
                rows={4}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                placeholder="Share past impact projects, communities served, or key strengths."
              />
            </label>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              Your profile metadata is attached for mission stewards. Applications sync to the volunteering dashboard instantly.
            </p>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-emerald-700"
            >
              Submit application
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ApplicationsList({ applications, onUpdateStatus, onDelete }) {
  if (!applications?.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-10 text-center text-sm text-slate-500">
        Applications land here in real time once volunteers respond.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {applications.map((application) => (
        <article key={application.id} className="rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              <p className="text-sm font-semibold text-slate-900">{application.name}</p>
              <p>{application.email}</p>
            </div>
            <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
              Submitted {formatRelativeTime(application.submittedAt)}
            </span>
          </div>
          {application.availability ? (
            <p className="mt-3 text-sm text-slate-600">Availability: {application.availability}</p>
          ) : null}
          {application.message ? (
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{application.message}</p>
          ) : null}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status
                <select
                  value={application.status ?? 'new'}
                  onChange={(event) => onUpdateStatus(application.id, event.target.value)}
                  className="ml-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                >
                  {APPLICATION_STATUSES.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </label>
              {application.portfolioUrl ? (
                <a
                  href={application.portfolioUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                >
                  View portfolio
                </a>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => onDelete(application.id)}
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

export default function VolunteerOpportunityManager() {
  const {
    items: opportunities,
    createItem,
    updateItem,
    removeItem,
    resetCollection,
  } = useLocalCollection('volunteer-opportunities-v1', { seed: SEED_VOLUNTEER_OPPORTUNITIES });

  const [search, setSearch] = useState('');
  const [filterRemoteOnly, setFilterRemoteOnly] = useState(false);
  const [selectedId, setSelectedId] = useState(opportunities[0]?.id ?? null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState(null);
  const [applicationOpen, setApplicationOpen] = useState(false);

  useEffect(() => {
    if (!selectedId && opportunities.length) {
      setSelectedId(opportunities[0].id);
    }
  }, [opportunities, selectedId]);

  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((opportunity) => {
      const matchesSearch = [
        opportunity.title,
        opportunity.organization,
        opportunity.location,
        ...(opportunity.focusAreas ?? []),
      ]
        .join(' ')
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesRemote = !filterRemoteOnly || opportunity.isRemote;
      return matchesSearch && matchesRemote;
    });
  }, [filterRemoteOnly, opportunities, search]);

  useEffect(() => {
    if (!selectedId) {
      return;
    }
    const exists = opportunities.some((opportunity) => opportunity.id === selectedId);
    if (!exists) {
      setSelectedId(opportunities[0]?.id ?? null);
    }
  }, [opportunities, selectedId]);

  const selectedOpportunity = useMemo(
    () => opportunities.find((opportunity) => opportunity.id === selectedId) ?? null,
    [opportunities, selectedId],
  );

  const summary = useMemo(() => computeSummary(opportunities), [opportunities]);

  const handleCreateOpportunity = () => {
    setEditingOpportunity(null);
    setFormOpen(true);
  };

  const handleEditOpportunity = () => {
    if (!selectedOpportunity) {
      return;
    }
    setEditingOpportunity(selectedOpportunity);
    setFormOpen(true);
  };

  const handleSubmitOpportunity = (payload) => {
    if (editingOpportunity) {
      updateItem(editingOpportunity.id, (existing) => ({
        ...existing,
        ...payload,
      }));
      setSelectedId(editingOpportunity.id);
    } else {
      const created = createItem({
        ...payload,
        applications: [],
      });
      setSelectedId(created.id);
    }
    setFormOpen(false);
    setEditingOpportunity(null);
  };

  const handleDeleteOpportunity = () => {
    if (!selectedOpportunity) {
      return;
    }
    removeItem(selectedOpportunity.id);
  };

  const handleDuplicateOpportunity = () => {
    if (!selectedOpportunity) {
      return;
    }
    const duplicate = createItem({
      ...selectedOpportunity,
      id: randomId('mission'),
      title: `${selectedOpportunity.title} (copy)`,
      applications: [],
    });
    setSelectedId(duplicate.id);
  };

  const handleApplicationSubmit = (applicationPayload) => {
    if (!selectedOpportunity) {
      return;
    }
    updateItem(selectedOpportunity.id, (existing) => ({
      ...existing,
      applications: [...(existing.applications ?? []), applicationPayload],
    }));
    setApplicationOpen(false);
  };

  const handleUpdateApplicationStatus = (applicationId, status) => {
    if (!selectedOpportunity) {
      return;
    }
    updateItem(selectedOpportunity.id, (existing) => ({
      ...existing,
      applications: (existing.applications ?? []).map((application) =>
        application.id === applicationId ? { ...application, status } : application,
      ),
    }));
  };

  const handleDeleteApplication = (applicationId) => {
    if (!selectedOpportunity) {
      return;
    }
    updateItem(selectedOpportunity.id, (existing) => ({
      ...existing,
      applications: (existing.applications ?? []).filter((application) => application.id !== applicationId),
    }));
  };

  return (
    <section className="mt-16 rounded-[2.5rem] border border-slate-200 bg-gradient-to-br from-white/90 via-white to-indigo-50/60 p-8 shadow-2xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Volunteer operations cockpit</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Curate, launch, and manage impact missions</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Every mission here is fully editable, multimedia ready, and wired into the volunteer application workflow. Create new
            briefs, duplicate best-performers, and review applicants without leaving Explorer.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={resetCollection}
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
          >
            Restore sample data
          </button>
          <button
            type="button"
            onClick={handleCreateOpportunity}
            className="inline-flex items-center rounded-full bg-accent px-6 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark"
          >
            New volunteer mission
          </button>
        </div>
      </div>

      <dl className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Active missions</dt>
          <dd className="mt-3 text-3xl font-semibold text-slate-900">{summary.totalMissions}</dd>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Applications in review</dt>
          <dd className="mt-3 text-3xl font-semibold text-slate-900">{summary.totalApplications}</dd>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Volunteers placed</dt>
          <dd className="mt-3 text-3xl font-semibold text-slate-900">{summary.placedVolunteers}</dd>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Remote friendly missions</dt>
          <dd className="mt-3 text-3xl font-semibold text-slate-900">{summary.remoteFriendly}</dd>
        </div>
      </dl>

      <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1.1fr),minmax(0,1.9fr)]">
        <aside className="space-y-4 rounded-[2rem] border border-slate-200 bg-white/90 p-5 shadow-inner">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="volunteer-mission-search">
              Filter missions
            </label>
            <input
              id="volunteer-mission-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by mission, organisation, or focus"
              className="mt-2 w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <label className="inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <input
              type="checkbox"
              checked={filterRemoteOnly}
              onChange={(event) => setFilterRemoteOnly(event.target.checked)}
              className="h-5 w-5 rounded border-slate-300 text-accent focus:ring-accent/30"
            />
            Remote only missions
          </label>
          <div className="space-y-3">
            {filteredOpportunities.length ? (
              filteredOpportunities.map((opportunity) => (
                <OpportunityCard
                  key={opportunity.id}
                  opportunity={opportunity}
                  onSelect={setSelectedId}
                  selected={opportunity.id === selectedId}
                />
              ))
            ) : (
              <p className="text-sm text-slate-500">
                No missions match the current filters. Adjust keywords or toggle remote preferences.
              </p>
            )}
          </div>
        </aside>

        <div className="space-y-6">
          {selectedOpportunity ? (
            <article className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white/95 shadow-xl">
              {selectedOpportunity.heroImageUrl ? (
                <div className="relative h-64 w-full overflow-hidden">
                  <img
                    src={selectedOpportunity.heroImageUrl}
                    alt="Mission hero"
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
                  <div className="absolute bottom-5 left-5 right-5 flex flex-wrap items-end justify-between gap-3 text-white">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-200">
                        {selectedOpportunity.organization}
                      </p>
                      <h3 className="mt-1 text-2xl font-semibold">{selectedOpportunity.title}</h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide">
                      <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1">
                        {selectedOpportunity.isRemote ? 'Remote friendly' : selectedOpportunity.location}
                      </span>
                      {selectedOpportunity.applicationDeadline ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-500/80 px-3 py-1">
                          Apply by {formatDate(selectedOpportunity.applicationDeadline)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="space-y-8 p-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {selectedOpportunity.timezone ? (
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                        {selectedOpportunity.timezone}
                      </span>
                    ) : null}
                    {selectedOpportunity.commitmentHours ? (
                      <span className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-indigo-700">
                        {selectedOpportunity.commitmentHours} hrs / week
                      </span>
                    ) : null}
                    {(selectedOpportunity.focusAreas ?? []).map((area) => (
                      <span key={area} className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                        {area}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setApplicationOpen(true)}
                      className="inline-flex items-center rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-emerald-700"
                    >
                      Apply now
                    </button>
                    <button
                      type="button"
                      onClick={handleEditOpportunity}
                      className="inline-flex items-center rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                    >
                      Edit mission
                    </button>
                    <button
                      type="button"
                      onClick={handleDuplicateOpportunity}
                      className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                    >
                      Duplicate
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteOpportunity}
                      className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-100"
                    >
                      Archive
                    </button>
                  </div>
                </div>

                <section>
                  <h4 className="text-lg font-semibold text-slate-900">Mission overview</h4>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">
                    {selectedOpportunity.description || selectedOpportunity.missionStatement}
                  </p>
                  {selectedOpportunity.remotePolicy ? (
                    <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Remote policy: <span className="text-slate-600">{selectedOpportunity.remotePolicy}</span>
                    </p>
                  ) : null}
                  <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Start</dt>
                      <dd className="mt-2 text-slate-900">{formatDate(selectedOpportunity.startDate)}</dd>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">End</dt>
                      <dd className="mt-2 text-slate-900">{formatDate(selectedOpportunity.endDate)}</dd>
                    </div>
                    {selectedOpportunity.applicationUrl ? (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">External application</dt>
                        <dd className="mt-2">
                          <a
                            href={selectedOpportunity.applicationUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                          >
                            Open form ↗
                          </a>
                        </dd>
                      </div>
                    ) : null}
                    {selectedOpportunity.contactEmail ? (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Contact</dt>
                        <dd className="mt-2">
                          <a
                            href={`mailto:${selectedOpportunity.contactEmail}`}
                            className="text-accent hover:text-accentDark"
                          >
                            {selectedOpportunity.contactEmail}
                          </a>
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                </section>

                {(selectedOpportunity.perks ?? []).length ? (
                  <section>
                    <h4 className="text-lg font-semibold text-slate-900">Volunteer rewards</h4>
                    <ul className="mt-3 space-y-2 text-sm text-slate-600">
                      {selectedOpportunity.perks.map((perk) => (
                        <li key={perk} className="flex items-start gap-2">
                          <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
                          <span>{perk}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                {selectedOpportunity.videoUrl ? (
                  <section className="space-y-3">
                    <h4 className="text-lg font-semibold text-slate-900">Mission trailer</h4>
                    {renderVideoEmbed(selectedOpportunity.videoUrl)}
                  </section>
                ) : null}

                {(selectedOpportunity.gallery ?? []).length ? (
                  <section>
                    <h4 className="text-lg font-semibold text-slate-900">Gallery</h4>
                    <div className="mt-3 grid gap-4 sm:grid-cols-2">
                      {selectedOpportunity.gallery.map((item) => (
                        <figure key={item.id ?? item.url} className="overflow-hidden rounded-2xl border border-slate-200">
                          <img src={item.url} alt={item.caption || 'Volunteer mission gallery item'} className="h-40 w-full object-cover" loading="lazy" />
                          {item.caption ? (
                            <figcaption className="px-4 py-3 text-xs text-slate-600">{item.caption}</figcaption>
                          ) : null}
                        </figure>
                      ))}
                    </div>
                  </section>
                ) : null}

                <section className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h4 className="text-lg font-semibold text-slate-900">Applications</h4>
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {(selectedOpportunity.applications ?? []).length} in pipeline
                    </span>
                  </div>
                  <ApplicationsList
                    applications={selectedOpportunity.applications}
                    onUpdateStatus={handleUpdateApplicationStatus}
                    onDelete={handleDeleteApplication}
                  />
                </section>
              </div>
            </article>
          ) : (
            <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white/70 p-12 text-center text-sm text-slate-500">
              Select a mission to see its full profile, multimedia, and applicant pipeline.
            </div>
          )}
        </div>
      </div>

      <OpportunityForm
        open={formOpen}
        initialValue={editingOpportunity}
        onClose={() => {
          setFormOpen(false);
          setEditingOpportunity(null);
        }}
        onSubmit={handleSubmitOpportunity}
      />

      <ApplicationForm
        open={applicationOpen}
        opportunity={selectedOpportunity}
        onClose={() => setApplicationOpen(false)}
        onSubmit={handleApplicationSubmit}
      />
    </section>
  );
}
