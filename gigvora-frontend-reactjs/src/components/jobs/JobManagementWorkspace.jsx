import { useEffect, useMemo, useState } from 'react';
import useLocalCollection from '../../hooks/useLocalCollection.js';
import { classNames } from '../../utils/classNames.js';
import randomId from '../../utils/randomId.js';
import { formatRelativeTime } from '../../utils/date.js';

const APPLICATION_STATUSES = [
  { value: 'new', label: 'New' },
  { value: 'screening', label: 'Screening' },
  { value: 'interviewing', label: 'Interviewing' },
  { value: 'offer', label: 'Offer extended' },
  { value: 'hired', label: 'Hired' },
  { value: 'rejected', label: 'Rejected' },
];

const SEED_JOB_POSTINGS = [
  {
    id: 'job-senior-product-lead',
    title: 'Senior Product Lead – Marketplace Activation',
    company: 'Gigvora Labs',
    location: 'Remote (EU timezones)',
    employmentType: 'Full-time',
    salaryRange: '£110,000 – £130,000 + equity',
    remotePolicy: 'Remote-first across GMT±2 with quarterly in-person product summits.',
    description:
      'Steward the evolution of Gigvora Explorer across marketplace, mentorship, and volunteering verticals. You will pair with design, revenue, and ops leaders to launch velocity-focused roadmaps, accelerate impact pods, and orchestrate product analytics that span web + mobile.',
    responsibilities: [
      'Own marketplace activation metrics and lead the growth pod to unlock 30% more successful matches.',
      'Partner with research ops to scale the signal engine that powers gig, job, and volunteer recommendations.',
      'Create story-driven release wikis that connect squads, executive stakeholders, and community guardians.',
    ],
    requirements: [
      '7+ years leading B2B2C product teams with marketplace or talent tech experience.',
      'Fluent in experimentation systems, impact analytics, and go-to-market alignment.',
      'Comfortable facilitating multi-timezone rituals and running async product reviews.',
    ],
    benefits: [
      'Equity participation and community profit-sharing.',
      'Wellbeing budget, leadership coaching, and Impact Fridays.',
      'Annual maker retreat with strategic partners.',
    ],
    heroImageUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80',
    posterUrl: 'https://images.unsplash.com/photo-1523475472560-d2df97ec485c?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=qB4Zki3t74Y',
    tags: ['Product leadership', 'Marketplace', 'Remote-first'],
    gallery: [
      {
        id: 'job-gal-product-1',
        url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
        caption: 'Explorer leadership sync reviewing activation metrics.',
      },
      {
        id: 'job-gal-product-2',
        url: 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1200&q=80',
        caption: 'Impact lab sprints with mentors and product guilds.',
      },
    ],
    applicationUrl: 'https://jobs.gigvora.com/product-lead',
    contactEmail: 'talent@gigvora.com',
    hiringManager: 'Aria Bennett',
    applications: [
      {
        id: 'candidate-ava-wilson',
        name: 'Ava Wilson',
        email: 'ava.wilson@gigvora.dev',
        portfolioUrl: 'https://www.notion.so/avawilson/product-lead',
        resumeUrl: 'https://files.gigvora.com/cv/ava-wilson.pdf',
        status: 'interviewing',
        submittedAt: '2024-05-19T11:20:00Z',
        summary: 'Ex-Stripe marketplace lead. Shipped two go-to-market flywheels with 20% conversion lift.',
      },
      {
        id: 'candidate-tim-nguyen',
        name: 'Tim Nguyen',
        email: 'tim.nguyen@gigvora.dev',
        portfolioUrl: 'https://timnguyen.product',
        resumeUrl: 'https://files.gigvora.com/cv/tim-nguyen.pdf',
        status: 'screening',
        submittedAt: '2024-05-22T08:05:00Z',
        summary: 'Marketplace PM at Deliveroo. Drove discovery automation and mentor routing.',
      },
    ],
  },
  {
    id: 'job-senior-mentor-success',
    title: 'Mentor Success Architect',
    company: 'Gigvora Mentor Guild',
    location: 'Hybrid – London & Remote',
    employmentType: 'Full-time',
    salaryRange: '£75,000 – £90,000 + bonus',
    remotePolicy: 'Hybrid role with 3 days remote and 2 days at the London impact studio.',
    description:
      'Launch, nurture, and expand the mentor guild powering Gigvora’s coaching marketplace. You will orchestrate onboarding, design curriculum frameworks, and partner with analytics to measure mentor impact across journeys.',
    responsibilities: [
      'Design a world-class onboarding journey with multimedia training, compliance workflows, and credentialing.',
      'Create mentor playbooks across craft verticals and run live clinics with our impact councils.',
      'Build feedback loops with mentees, measuring NPS, retention, and revenue expansion.',
    ],
    requirements: [
      '5+ years in mentorship operations, coaching program design, or community management.',
      'Comfortable building curriculum and video resources with content partners.',
      'Data fluency to monitor funnels and report insights to leadership.',
    ],
    benefits: [
      'Mentor credit allowance to work with world-class coaches.',
      'Wellness stipend and global co-working pass.',
      'Launch bonuses for new program cohorts.',
    ],
    heroImageUrl: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1400&q=80',
    posterUrl: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=dHClFhy7Imk',
    tags: ['Mentorship', 'Community operations', 'Hybrid'],
    gallery: [
      {
        id: 'job-gal-mentor-1',
        url: 'https://images.unsplash.com/photo-1515165562835-c4c2b1f5a3ee?auto=format&fit=crop&w=1200&q=80',
        caption: 'Mentor lab running a storytelling workshop.',
      },
      {
        id: 'job-gal-mentor-2',
        url: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80',
        caption: 'Hybrid onboarding studio with live broadcast.',
      },
    ],
    applicationUrl: 'https://jobs.gigvora.com/mentor-success',
    contactEmail: 'mentor-hiring@gigvora.com',
    hiringManager: 'Jordan Mensah',
    applications: [
      {
        id: 'candidate-samira-ali',
        name: 'Samira Ali',
        email: 'samira.ali@gigvora.dev',
        portfolioUrl: 'https://portfolio.samiraali.com',
        resumeUrl: 'https://files.gigvora.com/cv/samira-ali.pdf',
        status: 'offer',
        submittedAt: '2024-05-05T16:45:00Z',
        summary: 'Headed mentor success at a YC edtech startup. Specialist in curriculum pods.',
      },
    ],
  },
  {
    id: 'job-volunteer-ops-lead',
    title: 'Volunteer Operations Lead – Impact Missions',
    company: 'Gigvora Impact Studio',
    location: 'Remote (Global)',
    employmentType: 'Contract (12 months)',
    salaryRange: '$95,000 – $110,000 USD',
    remotePolicy: 'Remote with optional travel to partner immersions (travel fully covered).',
    description:
      'Operate the pipeline connecting Gigvora volunteers to civic, climate, and education missions. This role blends service design, partner enablement, and data operations.',
    responsibilities: [
      'Create playbooks for partner onboarding, safeguarding, and reporting.',
      'Launch mission briefing kits with multimedia storytelling and compliance tooling.',
      'Analyse mission fill rates and produce weekly executive dashboards.',
    ],
    requirements: [
      '5+ years in operations, program management, or volunteer coordination.',
      'Experience with global stakeholder management and safeguarding frameworks.',
      'Ability to spin up tooling in Airtable/Notion/Zapier and partner data suites.',
    ],
    benefits: [
      'Remote office setup allowance and annual learning budget.',
      'Access to Gigvora mentor guild and talent network.',
      'Impact bonus tied to mission success metrics.',
    ],
    heroImageUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1400&q=80',
    posterUrl: 'https://images.unsplash.com/photo-1484981184820-2e84ea0af025?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://player.vimeo.com/video/137857207',
    tags: ['Operations', 'Impact', 'Remote'],
    gallery: [
      {
        id: 'job-gal-volunteer-1',
        url: 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&w=1200&q=80',
        caption: 'Mission coordination hub with field partners.',
      },
      {
        id: 'job-gal-volunteer-2',
        url: 'https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?auto=format&fit=crop&w=1200&q=80',
        caption: 'Volunteers prototyping relief logistics flows.',
      },
    ],
    applicationUrl: 'https://jobs.gigvora.com/volunteer-ops-lead',
    contactEmail: 'impact-hiring@gigvora.com',
    hiringManager: 'Mae Chen',
    applications: [
      {
        id: 'candidate-jules-patel',
        name: 'Jules Patel',
        email: 'jules.patel@gigvora.dev',
        portfolioUrl: 'https://notion.so/julespatel',
        resumeUrl: 'https://files.gigvora.com/cv/jules-patel.pdf',
        status: 'hired',
        submittedAt: '2024-04-18T09:10:00Z',
        summary: 'Ex-UNICEF emergency operations lead. Built volunteer guardrails at scale.',
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

function parseList(value) {
  return value
    .split('\n')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parseTags(value) {
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parseGallery(value) {
  return value
    .split('\n')
    .map((line) => {
      const [url, caption] = line.split('|').map((segment) => segment.trim());
      if (!url) return null;
      return { id: randomId('job-gallery'), url, caption: caption || undefined };
    })
    .filter(Boolean);
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
        title="Job spotlight video"
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
        title="Job spotlight video"
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

function computeSummary(jobs) {
  const total = jobs.length;
  const remoteFriendly = jobs.filter((job) => job.location?.toLowerCase().includes('remote')).length;
  const totalApplicants = jobs.reduce(
    (acc, job) => acc + (Array.isArray(job.applications) ? job.applications.length : 0),
    0,
  );
  const offers = jobs.reduce(
    (acc, job) =>
      acc + (Array.isArray(job.applications)
        ? job.applications.filter((application) => ['offer', 'hired'].includes(application.status)).length
        : 0),
    0,
  );
  return { total, remoteFriendly, totalApplicants, offers };
}

function JobCard({ job, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(job.id)}
      className={classNames(
        'flex w-full flex-col items-start rounded-3xl border p-4 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
        selected
          ? 'border-accent bg-accentSoft/70 shadow-soft'
          : 'border-slate-200 bg-white/90 hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-lg',
      )}
    >
      <div className="flex w-full items-center justify-between gap-3 text-xs text-slate-500">
        <span className="font-semibold text-slate-700">{job.company}</span>
        <span>{job.employmentType}</span>
      </div>
      <p className="mt-2 text-sm font-semibold text-slate-900">{job.title}</p>
      <p className="mt-2 line-clamp-3 text-xs text-slate-500">{job.location}</p>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-wide">
        {job.salaryRange ? (
          <span className="rounded-full bg-slate-900 px-2.5 py-0.5 text-white">{job.salaryRange}</span>
        ) : null}
        <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-indigo-700">
          {(job.applications ?? []).length} applicants
        </span>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-600">{job.tags?.slice(0, 2).join(' • ')}</span>
      </div>
    </button>
  );
}

function JobForm({ open, initialValue, onSubmit, onClose }) {
  const [form, setForm] = useState(() => ({
    title: initialValue?.title ?? '',
    company: initialValue?.company ?? '',
    location: initialValue?.location ?? '',
    employmentType: initialValue?.employmentType ?? 'Full-time',
    salaryRange: initialValue?.salaryRange ?? '',
    remotePolicy: initialValue?.remotePolicy ?? '',
    description: initialValue?.description ?? '',
    responsibilities: (initialValue?.responsibilities ?? []).join('\n'),
    requirements: (initialValue?.requirements ?? []).join('\n'),
    benefits: (initialValue?.benefits ?? []).join('\n'),
    tags: (initialValue?.tags ?? []).join(', '),
    heroImageUrl: initialValue?.heroImageUrl ?? '',
    posterUrl: initialValue?.posterUrl ?? '',
    videoUrl: initialValue?.videoUrl ?? '',
    gallery: (initialValue?.gallery ?? [])
      .map((item) => (item.caption ? `${item.url} | ${item.caption}` : item.url))
      .join('\n'),
    applicationUrl: initialValue?.applicationUrl ?? '',
    contactEmail: initialValue?.contactEmail ?? '',
    hiringManager: initialValue?.hiringManager ?? '',
  }));

  useEffect(() => {
    if (!open) return;
    setForm({
      title: initialValue?.title ?? '',
      company: initialValue?.company ?? '',
      location: initialValue?.location ?? '',
      employmentType: initialValue?.employmentType ?? 'Full-time',
      salaryRange: initialValue?.salaryRange ?? '',
      remotePolicy: initialValue?.remotePolicy ?? '',
      description: initialValue?.description ?? '',
      responsibilities: (initialValue?.responsibilities ?? []).join('\n'),
      requirements: (initialValue?.requirements ?? []).join('\n'),
      benefits: (initialValue?.benefits ?? []).join('\n'),
      tags: (initialValue?.tags ?? []).join(', '),
      heroImageUrl: initialValue?.heroImageUrl ?? '',
      posterUrl: initialValue?.posterUrl ?? '',
      videoUrl: initialValue?.videoUrl ?? '',
      gallery: (initialValue?.gallery ?? [])
        .map((item) => (item.caption ? `${item.url} | ${item.caption}` : item.url))
        .join('\n'),
      applicationUrl: initialValue?.applicationUrl ?? '',
      contactEmail: initialValue?.contactEmail ?? '',
      hiringManager: initialValue?.hiringManager ?? '',
    });
  }, [initialValue, open]);

  if (!open) return null;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      title: form.title.trim(),
      company: form.company.trim(),
      location: form.location.trim(),
      employmentType: form.employmentType.trim(),
      salaryRange: form.salaryRange.trim(),
      remotePolicy: form.remotePolicy.trim(),
      description: form.description.trim(),
      responsibilities: parseList(form.responsibilities),
      requirements: parseList(form.requirements),
      benefits: parseList(form.benefits),
      tags: parseTags(form.tags),
      heroImageUrl: form.heroImageUrl.trim() || undefined,
      posterUrl: form.posterUrl.trim() || undefined,
      videoUrl: form.videoUrl.trim() || undefined,
      gallery: form.gallery ? parseGallery(form.gallery) : [],
      applicationUrl: form.applicationUrl.trim() || undefined,
      contactEmail: form.contactEmail.trim() || undefined,
      hiringManager: form.hiringManager.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-10">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <form onSubmit={handleSubmit} className="max-h-[90vh] overflow-y-auto p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">
                {initialValue ? 'Update role' : 'Create new role'}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Publish detailed job briefs with multimedia, salary transparency, and hiring workflows.
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
                Job title
                <input
                  required
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Company / team
                <input
                  required
                  name="company"
                  value={form.company}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="block text-sm font-medium text-slate-700">
                Location
                <input
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  placeholder="Remote, London, Hybrid"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Employment type
                <input
                  name="employmentType"
                  value={form.employmentType}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Salary range / rate
                <input
                  name="salaryRange"
                  value={form.salaryRange}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </label>
            </div>

            <label className="block text-sm font-medium text-slate-700">
              Remote policy / logistics
              <input
                name="remotePolicy"
                value={form.remotePolicy}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                placeholder="Remote-first, hybrid cadence, travel notes"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Mission-driven description
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Responsibilities (one per line)
              <textarea
                name="responsibilities"
                value={form.responsibilities}
                onChange={handleChange}
                rows={4}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Requirements (one per line)
              <textarea
                name="requirements"
                value={form.requirements}
                onChange={handleChange}
                rows={4}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Benefits (one per line)
              <textarea
                name="benefits"
                value={form.benefits}
                onChange={handleChange}
                rows={3}
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
              Video URL (YouTube, Vimeo, or MP4)
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
                rows={3}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-3">
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
                  type="email"
                  name="contactEmail"
                  value={form.contactEmail}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Hiring manager
                <input
                  name="hiringManager"
                  value={form.hiringManager}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </label>
            </div>
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
              {initialValue ? 'Update role' : 'Publish role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CandidateForm({ open, onSubmit, onClose }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    portfolioUrl: '',
    resumeUrl: '',
    summary: '',
  });

  useEffect(() => {
    if (!open) return;
    setForm({ name: '', email: '', portfolioUrl: '', resumeUrl: '', summary: '' });
  }, [open]);

  if (!open) return null;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      id: randomId('candidate'),
      name: form.name.trim(),
      email: form.email.trim(),
      portfolioUrl: form.portfolioUrl.trim() || undefined,
      resumeUrl: form.resumeUrl.trim() || undefined,
      summary: form.summary.trim(),
      status: 'new',
      submittedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-10">
      <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <form onSubmit={handleSubmit} className="max-h-[90vh] overflow-y-auto p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Log a candidate</h3>
              <p className="mt-1 text-sm text-slate-500">
                Capture referrals, outreach, or inbound talent and pipe them into the job workflow instantly.
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

          <div className="mt-6 grid gap-5">
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
              Portfolio or LinkedIn (optional)
              <input
                name="portfolioUrl"
                value={form.portfolioUrl}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              CV / Case study link
              <input
                name="resumeUrl"
                value={form.resumeUrl}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Notes for the hiring squad
              <textarea
                name="summary"
                value={form.summary}
                onChange={handleChange}
                rows={4}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-500">Candidates sync into ATS exports and analytics instantly.</p>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-emerald-700"
            >
              Add candidate
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CandidateList({ applications, onStatusChange, onRemove }) {
  if (!applications?.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-10 text-center text-sm text-slate-500">
        Track outreach or inbound candidates here. Status changes sync to dashboards instantly.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {applications.map((candidate) => (
        <article key={candidate.id} className="rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              <p className="text-sm font-semibold text-slate-900">{candidate.name}</p>
              <p>{candidate.email}</p>
            </div>
            <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
              Added {formatRelativeTime(candidate.submittedAt)}
            </span>
          </div>
          {candidate.summary ? <p className="mt-3 text-sm text-slate-600">{candidate.summary}</p> : null}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Stage
                <select
                  value={candidate.status ?? 'new'}
                  onChange={(event) => onStatusChange(candidate.id, event.target.value)}
                  className="ml-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                >
                  {APPLICATION_STATUSES.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </label>
              {candidate.portfolioUrl ? (
                <a
                  href={candidate.portfolioUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                >
                  Portfolio
                </a>
              ) : null}
              {candidate.resumeUrl ? (
                <a
                  href={candidate.resumeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                >
                  CV / Case
                </a>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => onRemove(candidate.id)}
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

export default function JobManagementWorkspace() {
  const {
    items: jobs,
    createItem,
    updateItem,
    removeItem,
    resetCollection,
  } = useLocalCollection('job-postings-v1', { seed: SEED_JOB_POSTINGS });

  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(jobs[0]?.id ?? null);
  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [showCandidateForm, setShowCandidateForm] = useState(false);

  useEffect(() => {
    if (!selectedId && jobs.length) {
      setSelectedId(jobs[0].id);
    }
  }, [jobs, selectedId]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const haystack = [job.title, job.company, job.location, ...(job.tags ?? [])].join(' ').toLowerCase();
      return haystack.includes(search.toLowerCase());
    });
  }, [jobs, search]);

  const selectedJob = useMemo(() => jobs.find((job) => job.id === selectedId) ?? null, [jobs, selectedId]);
  const summary = useMemo(() => computeSummary(jobs), [jobs]);

  const handleCreate = () => {
    setEditingJob(null);
    setShowForm(true);
  };

  const handleEdit = () => {
    if (!selectedJob) return;
    setEditingJob(selectedJob);
    setShowForm(true);
  };

  const handleSubmitJob = (payload) => {
    if (editingJob) {
      updateItem(editingJob.id, (existing) => ({ ...existing, ...payload }));
      setSelectedId(editingJob.id);
    } else {
      const created = createItem({ ...payload, applications: [] });
      setSelectedId(created.id);
    }
    setShowForm(false);
    setEditingJob(null);
  };

  const handleDelete = () => {
    if (!selectedJob) return;
    removeItem(selectedJob.id);
  };

  const handleDuplicate = () => {
    if (!selectedJob) return;
    const copy = createItem({
      ...selectedJob,
      id: randomId('job'),
      title: `${selectedJob.title} (copy)`,
      applications: [],
    });
    setSelectedId(copy.id);
  };

  const handleCandidateSubmit = (candidate) => {
    if (!selectedJob) return;
    updateItem(selectedJob.id, (existing) => ({
      ...existing,
      applications: [...(existing.applications ?? []), candidate],
    }));
    setShowCandidateForm(false);
  };

  const handleCandidateStatus = (candidateId, status) => {
    if (!selectedJob) return;
    updateItem(selectedJob.id, (existing) => ({
      ...existing,
      applications: (existing.applications ?? []).map((candidate) =>
        candidate.id === candidateId ? { ...candidate, status } : candidate,
      ),
    }));
  };

  const handleCandidateRemove = (candidateId) => {
    if (!selectedJob) return;
    updateItem(selectedJob.id, (existing) => ({
      ...existing,
      applications: (existing.applications ?? []).filter((candidate) => candidate.id !== candidateId),
    }));
  };

  return (
    <section className="mt-12 rounded-[2.5rem] border border-slate-200 bg-gradient-to-br from-white via-white to-sky-50 p-8 shadow-2xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Hiring mission control</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Orchestrate high-signal roles and talent pipelines</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Manage job briefs, multimedia storytelling, compensation transparency, and candidate flows in one live cockpit. All
            changes are stored locally so you can prototype workflows before wiring to the production ATS.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={resetCollection}
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
          >
            Restore sample roles
          </button>
          <button
            type="button"
            onClick={handleCreate}
            className="inline-flex items-center rounded-full bg-accent px-6 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark"
          >
            New role
          </button>
        </div>
      </div>

      <dl className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Live roles</dt>
          <dd className="mt-3 text-3xl font-semibold text-slate-900">{summary.total}</dd>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Remote friendly</dt>
          <dd className="mt-3 text-3xl font-semibold text-slate-900">{summary.remoteFriendly}</dd>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Active applicants</dt>
          <dd className="mt-3 text-3xl font-semibold text-slate-900">{summary.totalApplicants}</dd>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Offers / hires</dt>
          <dd className="mt-3 text-3xl font-semibold text-slate-900">{summary.offers}</dd>
        </div>
      </dl>

      <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr),minmax(0,2fr)]">
        <aside className="space-y-4 rounded-[2rem] border border-slate-200 bg-white/90 p-5 shadow-inner">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="job-search-input">
              Search roles
            </label>
            <input
              id="job-search-input"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by role, company, or tag"
              className="mt-2 w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div className="space-y-3">
            {filteredJobs.length ? (
              filteredJobs.map((job) => (
                <JobCard key={job.id} job={job} selected={job.id === selectedId} onSelect={setSelectedId} />
              ))
            ) : (
              <p className="text-sm text-slate-500">No roles match the filters. Adjust the search terms.</p>
            )}
          </div>
        </aside>

        <div className="space-y-6">
          {selectedJob ? (
            <article className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white/95 shadow-xl">
              {selectedJob.heroImageUrl ? (
                <div className="relative h-60 w-full overflow-hidden">
                  <img src={selectedJob.heroImageUrl} alt="Role spotlight" className="h-full w-full object-cover" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
                  <div className="absolute bottom-5 left-5 right-5 flex flex-wrap items-end justify-between gap-3 text-white">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-200">{selectedJob.company}</p>
                      <h3 className="mt-1 text-2xl font-semibold">{selectedJob.title}</h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide">
                      {selectedJob.employmentType ? (
                        <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1">
                          {selectedJob.employmentType}
                        </span>
                      ) : null}
                      {selectedJob.salaryRange ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-500/90 px-3 py-1">
                          {selectedJob.salaryRange}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="space-y-8 p-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                      {selectedJob.location || 'Location flexible'}
                    </span>
                    {selectedJob.remotePolicy ? (
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                        {selectedJob.remotePolicy}
                      </span>
                    ) : null}
                    {(selectedJob.tags ?? []).map((tag) => (
                      <span key={tag} className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-indigo-700">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCandidateForm(true)}
                      className="inline-flex items-center rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-emerald-700"
                    >
                      Log candidate
                    </button>
                    <button
                      type="button"
                      onClick={handleEdit}
                      className="inline-flex items-center rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                    >
                      Edit role
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
                  <h4 className="text-lg font-semibold text-slate-900">Role narrative</h4>
                  <p className="text-sm leading-relaxed text-slate-600">{selectedJob.description}</p>
                  {selectedJob.hiringManager ? (
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Hiring manager: <span className="text-slate-600">{selectedJob.hiringManager}</span>
                    </p>
                  ) : null}
                  <dl className="grid gap-4 sm:grid-cols-2">
                    {selectedJob.applicationUrl ? (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Application link</dt>
                        <dd className="mt-2">
                          <a
                            href={selectedJob.applicationUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                          >
                            Apply now ↗
                          </a>
                        </dd>
                      </div>
                    ) : null}
                    {selectedJob.contactEmail ? (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Contact</dt>
                        <dd className="mt-2">
                          <a href={`mailto:${selectedJob.contactEmail}`} className="text-accent hover:text-accentDark">
                            {selectedJob.contactEmail}
                          </a>
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                </section>

                {(selectedJob.responsibilities ?? []).length ? (
                  <section>
                    <h4 className="text-lg font-semibold text-slate-900">Responsibilities</h4>
                    <ul className="mt-3 space-y-2 text-sm text-slate-600">
                      {selectedJob.responsibilities.map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-indigo-500" aria-hidden="true" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                {(selectedJob.requirements ?? []).length ? (
                  <section>
                    <h4 className="text-lg font-semibold text-slate-900">Requirements</h4>
                    <ul className="mt-3 space-y-2 text-sm text-slate-600">
                      {selectedJob.requirements.map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-slate-400" aria-hidden="true" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                {(selectedJob.benefits ?? []).length ? (
                  <section>
                    <h4 className="text-lg font-semibold text-slate-900">Benefits & perks</h4>
                    <ul className="mt-3 space-y-2 text-sm text-slate-600">
                      {selectedJob.benefits.map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                {selectedJob.videoUrl ? (
                  <section className="space-y-3">
                    <h4 className="text-lg font-semibold text-slate-900">Role video</h4>
                    {renderVideoEmbed(selectedJob.videoUrl)}
                  </section>
                ) : null}

                {(selectedJob.gallery ?? []).length ? (
                  <section>
                    <h4 className="text-lg font-semibold text-slate-900">Life at the team</h4>
                    <div className="mt-3 grid gap-4 sm:grid-cols-2">
                      {selectedJob.gallery.map((item) => (
                        <figure key={item.id ?? item.url} className="overflow-hidden rounded-2xl border border-slate-200">
                          <img src={item.url} alt={item.caption || 'Job gallery'} className="h-40 w-full object-cover" loading="lazy" />
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
                    <h4 className="text-lg font-semibold text-slate-900">Candidate pipeline</h4>
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {(selectedJob.applications ?? []).length} candidates
                    </span>
                  </div>
                  <CandidateList
                    applications={selectedJob.applications}
                    onStatusChange={handleCandidateStatus}
                    onRemove={handleCandidateRemove}
                  />
                </section>
              </div>
            </article>
          ) : (
            <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white/70 p-12 text-center text-sm text-slate-500">
              Select a job to view its multimedia brief and candidate pipeline.
            </div>
          )}
        </div>
      </div>

      <JobForm
        open={showForm}
        initialValue={editingJob}
        onClose={() => {
          setShowForm(false);
          setEditingJob(null);
        }}
        onSubmit={handleSubmitJob}
      />

      <CandidateForm
        open={showCandidateForm}
        onClose={() => setShowCandidateForm(false)}
        onSubmit={handleCandidateSubmit}
      />
    </section>
  );
}
