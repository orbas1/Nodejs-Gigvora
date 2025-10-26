import PropTypes from 'prop-types';
import { HeartIcon as HeartIconOutline, PlayCircleIcon } from '@heroicons/react/24/outline';
import {
  HeartIcon as HeartIconSolid,
  ShieldCheckIcon,
  StarIcon,
  TrophyIcon,
} from '@heroicons/react/24/solid';
import { ClockIcon, VideoCameraIcon } from '@heroicons/react/24/outline';
import { formatRelativeTime } from '../../utils/date.js';

function classNames(...values) {
  return values.filter(Boolean).join(' ');
}

function resolveAvailabilityStatus(status) {
  switch (status) {
    case 'waitlist':
      return {
        label: 'Waitlist',
        classes: 'border-amber-300 bg-amber-50 text-amber-700',
      };
    case 'booked_out':
      return {
        label: 'Booked out',
        classes: 'border-slate-300 bg-slate-100 text-slate-600',
      };
    case 'open':
    default:
      return {
        label: 'Open slots',
        classes: 'border-emerald-300 bg-emerald-50 text-emerald-700',
      };
  }
}

function extractTestimonial(mentor) {
  if (!mentor) {
    return null;
  }
  if (mentor.testimonialHighlight) {
    return {
      quote: mentor.testimonialHighlight,
      author: mentor.testimonialHighlightAuthor ?? mentor.testimonialAuthor ?? null,
    };
  }
  if (mentor.testimonial) {
    return {
      quote: mentor.testimonial,
      author: mentor.testimonialAuthor ?? null,
    };
  }
  const testimonials = Array.isArray(mentor.testimonials) ? mentor.testimonials : [];
  if (!testimonials.length) {
    return null;
  }
  const [primary] = testimonials;
  if (!primary) {
    return null;
  }
  return {
    quote: primary.quote ?? primary.text ?? null,
    author: primary.author ?? primary.name ?? primary.attribution ?? null,
  };
}

function extractAvatarMeta(mentor) {
  const image = mentor.avatarUrl ?? mentor.profileImage ?? mentor.photoUrl ?? null;
  const name = mentor.name ?? mentor.fullName ?? '';
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  return { image, initial };
}

function buildSpecialties(mentor) {
  const expertise = Array.isArray(mentor.expertise) ? mentor.expertise : [];
  const disciplines = Array.isArray(mentor.disciplines) ? mentor.disciplines : [];
  const focusAreas = Array.isArray(mentor.focusAreas) ? mentor.focusAreas : [];
  const specialties = Array.from(
    new Set([
      mentor.primaryDiscipline,
      mentor.discipline,
      ...expertise,
      ...disciplines,
      ...focusAreas,
    ].filter(Boolean)),
  );
  return specialties.slice(0, 6);
}

function buildImpactMetrics(mentor) {
  const metrics = [];
  if (Number.isFinite(Number(mentor.menteesPromoted))) {
    metrics.push({ label: 'Mentees promoted', value: Number(mentor.menteesPromoted) });
  }
  if (Number.isFinite(Number(mentor.clientsServed))) {
    metrics.push({ label: 'Leaders coached', value: Number(mentor.clientsServed) });
  }
  if (Number.isFinite(Number(mentor.sessionsHosted))) {
    metrics.push({ label: 'Sessions hosted', value: Number(mentor.sessionsHosted) });
  }
  if (Number.isFinite(Number(mentor.nps))) {
    metrics.push({ label: 'Mentee NPS', value: `${Number(mentor.nps)}` });
  }
  if (mentor.successStories && typeof mentor.successStories === 'number') {
    metrics.push({ label: 'Case studies', value: mentor.successStories });
  }
  const badgeMetrics = Array.isArray(mentor.metrics)
    ? mentor.metrics
        .filter((metric) => metric && metric.label && metric.value)
        .map((metric) => ({ label: metric.label, value: metric.value }))
    : [];
  return [...metrics, ...badgeMetrics].slice(0, 3);
}

function buildSuccessNarratives(mentor) {
  if (Array.isArray(mentor.successStories)) {
    return mentor.successStories.map((story) => {
      if (typeof story === 'string') {
        return story;
      }
      if (story && typeof story === 'object') {
        return story.title ?? story.summary ?? story.description ?? null;
      }
      return null;
    }).filter(Boolean).slice(0, 3);
  }
  if (mentor.careerHighlights && Array.isArray(mentor.careerHighlights)) {
    return mentor.careerHighlights.slice(0, 3);
  }
  return [];
}

function buildSessionFormats(mentor) {
  const formats = Array.isArray(mentor.sessionFormats)
    ? mentor.sessionFormats
    : Array.isArray(mentor.formats)
    ? mentor.formats
    : Array.isArray(mentor.meetingFormats)
    ? mentor.meetingFormats
    : [];
  return formats.filter(Boolean).slice(0, 3);
}

export default function MentorProfileCard({
  mentor,
  onBook,
  onView,
  onToggleSaved,
  isSaved,
  availability = 'open',
}) {
  const specialties = buildSpecialties(mentor);
  const packages = Array.isArray(mentor.packages) ? mentor.packages.slice(0, 2) : [];
  const responseTimeHours = Number.isFinite(Number(mentor.responseTimeHours))
    ? Math.max(0, Number(mentor.responseTimeHours))
    : null;
  let responseTimeLabel = 'Responds within a day';
  if (responseTimeHours != null) {
    if (responseTimeHours <= 1) {
      responseTimeLabel = 'Responds within an hour';
    } else if (responseTimeHours < 24) {
      responseTimeLabel = `Responds within ${Math.round(responseTimeHours)} hours`;
    } else {
      const days = Math.ceil(responseTimeHours / 24);
      responseTimeLabel = `Responds within ${days} day${days > 1 ? 's' : ''}`;
    }
  } else if (mentor.responseTime) {
    responseTimeLabel = `Responds ${formatRelativeTime(mentor.responseTime, { numeric: 'auto' })}`;
  }
  const safeRating = Number.isFinite(mentor.rating) ? mentor.rating.toFixed(1) : '5.0';
  const reviewLabel = Number.isFinite(mentor.reviews) ? `${mentor.reviews} reviews` : 'New mentor';
  const region = mentor.region || 'Global';
  const sessionFee = Number.isFinite(mentor.sessionFee?.amount) ? mentor.sessionFee.amount : 180;
  const sessionCurrency = mentor.sessionFee?.currency ?? '£';
  const verified = Boolean(mentor.isVerified ?? mentor.verified ?? (mentor.badges || []).includes('verified'));
  const verificationLabel = mentor.verificationLabel ?? 'Verified mentor';
  const availabilityMeta = resolveAvailabilityStatus(availability);
  const testimonial = extractTestimonial(mentor);
  const avatarMeta = extractAvatarMeta(mentor);
  const successNarratives = buildSuccessNarratives(mentor);
  const sessionFormats = buildSessionFormats(mentor);
  const impactMetrics = buildImpactMetrics(mentor);
  const introVideoUrl = mentor.videoIntroUrl ?? mentor.introVideoUrl ?? mentor.previewVideoUrl ?? null;

  const handleOpenVideo = () => {
    if (!introVideoUrl) {
      return;
    }
    if (typeof window !== 'undefined' && typeof window.open === 'function') {
      window.open(introVideoUrl, '_blank', 'noopener');
    }
  };

  return (
    <article className="group relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-lg transition hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-2xl">
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-r from-slate-900/5 via-blue-500/5 to-accent/10 opacity-60 blur-3xl transition group-hover:opacity-80" aria-hidden="true" />
      <div className="relative flex flex-col gap-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 flex-1 gap-4">
            <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-blue-100 via-white to-indigo-100 text-lg font-semibold text-blue-700 shadow-inner">
              {avatarMeta.image ? (
                <img src={avatarMeta.image} alt={mentor.name || 'Mentor avatar'} className="h-full w-full object-cover" />
              ) : (
                avatarMeta.initial
              )}
              <span
                className={classNames(
                  'absolute -bottom-2 right-1 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide shadow-sm backdrop-blur',
                  availabilityMeta.classes,
                )}
              >
                {availabilityMeta.label}
              </span>
            </div>
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <span>{region}</span>
                {mentor.industry ? <span className="text-slate-400">• {mentor.industry}</span> : null}
                {sessionFormats.length ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-500">
                    <VideoCameraIcon className="h-3.5 w-3.5" aria-hidden="true" /> {sessionFormats.join(' • ')}
                  </span>
                ) : null}
              </div>
              <h3 className="text-2xl font-semibold text-slate-900">{mentor.name}</h3>
              {mentor.headline ? <p className="text-sm text-slate-600">{mentor.headline}</p> : null}
              <div className="flex flex-wrap gap-2">
                {Array.isArray(mentor.badges)
                  ? mentor.badges.slice(0, 3).map((badge) => (
                      <span key={badge} className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                        <TrophyIcon className="h-3.5 w-3.5" aria-hidden="true" /> {badge}
                      </span>
                    ))
                  : null}
                {verified ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    <ShieldCheckIcon className="h-4 w-4" aria-hidden="true" /> {verificationLabel}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-3 text-right">
            <button
              type="button"
              onClick={() => onToggleSaved?.(mentor)}
              aria-pressed={Boolean(isSaved)}
              aria-label={isSaved ? 'Remove mentor from saved list' : 'Save mentor'}
              className={classNames(
                'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition',
                isSaved
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-slate-300 text-slate-500 hover:border-accent hover:text-accent',
              )}
            >
              {isSaved ? <HeartIconSolid className="h-4 w-4" aria-hidden="true" /> : <HeartIconOutline className="h-4 w-4" aria-hidden="true" />}
              {isSaved ? 'Saved' : 'Save'}
            </button>
            <div className="text-xs text-slate-500">
              <p className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 font-semibold text-amber-600">
                <StarIcon className="h-4 w-4" aria-hidden="true" /> {safeRating}
              </p>
              <p className="mt-1">{reviewLabel}</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <ClockIcon className="h-4 w-4 text-slate-400" aria-hidden="true" />
              {responseTimeLabel}
            </div>
          </div>
        </header>

        {specialties.length ? (
          <div className="flex flex-wrap gap-2">
            {specialties.map((item) => (
              <span key={item} className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {item}
              </span>
            ))}
          </div>
        ) : null}

        {mentor.bio ? <p className="text-sm leading-relaxed text-slate-600">{mentor.bio}</p> : null}

        {impactMetrics.length ? (
          <div className="grid gap-3 sm:grid-cols-3">
            {impactMetrics.map((metric) => (
              <div key={metric.label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center">
                <p className="text-lg font-semibold text-slate-900">{metric.value}</p>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{metric.label}</p>
              </div>
            ))}
          </div>
        ) : null}

        {packages.length ? (
          <div className="grid gap-3">
            {packages.map((pack) => (
              <div
                key={pack.name ?? pack.id}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 px-4 py-3 text-xs text-slate-600"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800">{pack.name}</p>
                  {pack.description ? <p className="mt-1 text-slate-500">{pack.description}</p> : null}
                </div>
                <p className="text-sm font-semibold text-slate-900">
                  {pack.currency ?? sessionCurrency}
                  {pack.price ?? sessionFee}
                </p>
              </div>
            ))}
          </div>
        ) : null}

        {testimonial?.quote || successNarratives.length ? (
          <div className="rounded-2xl border border-accent/20 bg-accent/5 px-4 py-4 text-sm text-slate-600">
            {testimonial?.quote ? (
              <div>
                <p className="font-medium text-slate-900">“{testimonial.quote}”</p>
                {testimonial.author ? (
                  <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">— {testimonial.author}</p>
                ) : null}
              </div>
            ) : null}
            {successNarratives.length ? (
              <ul className="mt-3 space-y-2 text-xs text-slate-500">
                {successNarratives.map((story, index) => (
                  <li key={`${story}-${index}`} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
                    <span>{story}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        <footer className="flex flex-col gap-4 border-t border-slate-200 pt-4 text-xs text-slate-500 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-800">
              {sessionCurrency}
              {new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 }).format(sessionFee)}{' '}
              <span className="font-normal text-slate-500">per session</span>
            </p>
            <p>
              {mentor.sessionLengths?.length
                ? `Formats: ${mentor.sessionLengths.join(' • ')} minutes`
                : mentor.experienceLevel
                ? `Ideal for ${mentor.experienceLevel} leaders`
                : 'Tailored roadmaps for your next milestone'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {introVideoUrl ? (
              <button
                type="button"
                onClick={handleOpenVideo}
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
              >
                <PlayCircleIcon className="h-4 w-4" aria-hidden="true" /> Watch intro
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => onView?.(mentor)}
              className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
            >
              View profile
            </button>
            <button
              type="button"
              onClick={() => onBook?.(mentor)}
              className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-accentDark"
            >
              Book session
            </button>
          </div>
        </footer>
      </div>
    </article>
  );
}

MentorProfileCard.propTypes = {
  mentor: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string.isRequired,
    headline: PropTypes.string,
    bio: PropTypes.string,
    region: PropTypes.string,
    expertise: PropTypes.arrayOf(PropTypes.string),
    packages: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
        description: PropTypes.string,
        currency: PropTypes.string,
        price: PropTypes.number,
      }),
    ),
    rating: PropTypes.number,
    reviews: PropTypes.number,
    responseTime: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    sessionFee: PropTypes.shape({
      amount: PropTypes.number,
      currency: PropTypes.string,
    }),
    isVerified: PropTypes.bool,
    verified: PropTypes.bool,
    badges: PropTypes.arrayOf(PropTypes.string),
    verificationLabel: PropTypes.string,
    testimonialHighlight: PropTypes.string,
    testimonialHighlightAuthor: PropTypes.string,
    testimonial: PropTypes.string,
    testimonialAuthor: PropTypes.string,
    testimonials: PropTypes.arrayOf(
      PropTypes.shape({
        quote: PropTypes.string,
        text: PropTypes.string,
        author: PropTypes.string,
        name: PropTypes.string,
        attribution: PropTypes.string,
      }),
    ),
    focusAreas: PropTypes.arrayOf(PropTypes.string),
    disciplines: PropTypes.arrayOf(PropTypes.string),
    primaryDiscipline: PropTypes.string,
    sessionFormats: PropTypes.arrayOf(PropTypes.string),
    formats: PropTypes.arrayOf(PropTypes.string),
    meetingFormats: PropTypes.arrayOf(PropTypes.string),
    sessionLengths: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
    menteesPromoted: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    clientsServed: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    sessionsHosted: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    nps: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    metrics: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string,
        value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      }),
    ),
    successStories: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.arrayOf(
        PropTypes.oneOfType([
          PropTypes.string,
          PropTypes.shape({
            title: PropTypes.string,
            summary: PropTypes.string,
            description: PropTypes.string,
          }),
        ]),
      ),
    ]),
    careerHighlights: PropTypes.arrayOf(PropTypes.string),
    videoIntroUrl: PropTypes.string,
    introVideoUrl: PropTypes.string,
    previewVideoUrl: PropTypes.string,
    sessionLengthsLabel: PropTypes.string,
    industry: PropTypes.string,
  }).isRequired,
  onBook: PropTypes.func,
  onView: PropTypes.func,
  onToggleSaved: PropTypes.func,
  isSaved: PropTypes.bool,
  availability: PropTypes.oneOf(['open', 'waitlist', 'booked_out']),
};

MentorProfileCard.defaultProps = {
  onBook: undefined,
  onView: undefined,
  onToggleSaved: undefined,
  isSaved: false,
  availability: 'open',
};
