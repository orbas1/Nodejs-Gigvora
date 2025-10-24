import PropTypes from 'prop-types';
import { HeartIcon as HeartIconOutline } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid, ShieldCheckIcon, StarIcon } from '@heroicons/react/24/solid';
import { formatRelativeTime } from '../../utils/date.js';

function classNames(...values) {
  return values.filter(Boolean).join(' ');
}

function resolveAvailabilityStatus(status) {
  switch (status) {
    case 'waitlist':
      return {
        label: 'Waitlist',
        classes: 'border-amber-200 bg-amber-50 text-amber-700',
      };
    case 'booked_out':
      return {
        label: 'Booked out',
        classes: 'border-slate-200 bg-slate-100 text-slate-600',
      };
    case 'open':
    default:
      return {
        label: 'Open slots',
        classes: 'border-emerald-200 bg-emerald-50 text-emerald-700',
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

export default function MentorProfileCard({
  mentor,
  onBook,
  onView,
  onToggleSaved,
  isSaved,
  availability = 'open',
}) {
  const expertise = Array.isArray(mentor.expertise) ? mentor.expertise.slice(0, 4) : [];
  const packages = Array.isArray(mentor.packages) ? mentor.packages.slice(0, 2) : [];
  const responseTime = mentor.responseTime
    ? formatRelativeTime(mentor.responseTime)
    : 'Responds within a day';
  const safeRating = Number.isFinite(mentor.rating) ? mentor.rating.toFixed(1) : '5.0';
  const reviewLabel = Number.isFinite(mentor.reviews) ? `${mentor.reviews} reviews` : 'New mentor';
  const region = mentor.region || 'Global';
  const sessionFee = Number.isFinite(mentor.sessionFee?.amount) ? mentor.sessionFee.amount : 180;
  const sessionCurrency = mentor.sessionFee?.currency ?? '£';
  const verified = Boolean(mentor.isVerified ?? mentor.verified ?? (mentor.badges || []).includes('verified'));
  const verificationLabel = mentor.verificationLabel ?? 'Verified mentor';
  const availabilityMeta = resolveAvailabilityStatus(availability);
  const testimonial = extractTestimonial(mentor);

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{region}</p>
            <span
              className={classNames(
                'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
                availabilityMeta.classes,
              )}
            >
              {availabilityMeta.label}
            </span>
          </div>
          <h3 className="mt-2 text-lg font-semibold text-slate-900">{mentor.name}</h3>
          {mentor.headline ? <p className="mt-1 text-sm text-slate-500">{mentor.headline}</p> : null}
        </div>
        <div className="flex flex-col items-end gap-2 text-right">
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
          {verified ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              <ShieldCheckIcon className="h-4 w-4" aria-hidden="true" /> {verificationLabel}
            </span>
          ) : null}
          <p className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-600">
            <StarIcon className="h-4 w-4" aria-hidden="true" /> {safeRating}
          </p>
          <p className="text-xs text-slate-400">{reviewLabel}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {expertise.map((item) => (
          <span key={item} className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {item}
          </span>
        ))}
      </div>
      {mentor.bio ? <p className="mt-4 text-sm text-slate-600">{mentor.bio}</p> : null}
      <div className="mt-5 grid gap-3">
        {packages.map((pack) => (
          <div
            key={pack.name}
            className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600"
          >
            <div className="min-w-0">
              <p className="font-semibold text-slate-800">{pack.name}</p>
              {pack.description ? <p className="mt-1 text-slate-500">{pack.description}</p> : null}
            </div>
            <p className="text-sm font-semibold text-slate-900">
              {pack.currency}
              {pack.price}
            </p>
          </div>
        ))}
      </div>
      {testimonial?.quote ? (
        <div className="mt-5 rounded-2xl border border-accent/20 bg-accent/5 px-4 py-3 text-sm text-slate-600">
          <p className="font-medium text-slate-900">“{testimonial.quote}”</p>
          {testimonial.author ? (
            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">— {testimonial.author}</p>
          ) : null}
        </div>
      ) : null}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <p>
          {sessionCurrency}
          {new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 }).format(sessionFee)} per session • {responseTime}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onView?.(mentor)}
            className="rounded-full border border-slate-300 px-4 py-2 font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
          >
            View profile
          </button>
          <button
            type="button"
            onClick={() => onBook?.(mentor)}
            className="rounded-full bg-accent px-4 py-2 font-semibold text-white transition hover:bg-accentDark"
          >
            Book session
          </button>
        </div>
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
