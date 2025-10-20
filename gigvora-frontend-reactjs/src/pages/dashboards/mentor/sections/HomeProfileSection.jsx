import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ChevronDoubleRightIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline';

const DEFAULT_FORM = {
  name: '',
  headline: '',
  email: '',
  timezone: '',
  expertise: '',
  focusAreas: '',
  availabilityNotes: '',
  sessionFee: '',
  sessionCurrency: '£',
  packagesOverview: '',
  bio: '',
  introVideoUrl: '',
  socialLinks: '',
};

const TIMEZONES = ['GMT', 'CET', 'EST', 'PST', 'AEST'];

const PROFILE_WIZARD = [
  { id: 'identity', title: 'Identity', description: 'Your name, headline, and preferred timezone.' },
  { id: 'expertise', title: 'Expertise', description: 'Surface focus areas and go-to mentorship formats.' },
  { id: 'experience', title: 'Experience layer', description: 'Bio, intro video, and social proof.' },
];

function sanitizeVideoUrl(candidate) {
  if (!candidate) {
    return '';
  }
  try {
    const url = new URL(candidate);
    if (url.hostname.includes('youtube.com') && url.searchParams.has('v')) {
      return `https://www.youtube.com/embed/${url.searchParams.get('v')}`;
    }
    return url.href;
  } catch (error) {
    return '';
  }
}

export default function HomeProfileSection({ profile, onSave, saving }) {
  const [formState, setFormState] = useState(DEFAULT_FORM);
  const [status, setStatus] = useState({ success: false, error: null });

  useEffect(() => {
    const expertise = Array.isArray(profile?.focusAreas) ? profile.focusAreas.join(', ') : profile?.focusAreas ?? '';
    const socialLinks = Array.isArray(profile?.socialLinks) ? profile.socialLinks.join('\n') : profile?.socialLinks ?? '';
    setFormState((current) => ({
      ...current,
      name: profile?.name ?? '',
      headline: profile?.headline ?? profile?.role ?? '',
      email: profile?.email ?? '',
      timezone: profile?.timezone ?? 'GMT',
      expertise,
      focusAreas: expertise,
      availabilityNotes: profile?.availabilityNotes ?? '',
      sessionFee: profile?.sessionFee?.amount ?? '',
      sessionCurrency: profile?.sessionFee?.currency ?? '£',
      packagesOverview: profile?.packagesOverview ?? '',
      bio: profile?.bio ?? '',
      introVideoUrl: profile?.introVideoUrl ?? '',
      socialLinks,
    }));
  }, [profile]);

  const completion = useMemo(() => {
    const filledFields = ['name', 'headline', 'email', 'timezone', 'expertise', 'bio']
      .map((field) => Boolean(formState[field]?.trim())).filter(Boolean).length;
    return Math.min(100, Math.round((filledFields / 6) * 100));
  }, [formState]);

  const handleChange = (field, value) => {
    setStatus({ success: false, error: null });
    setFormState((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ success: false, error: null });
    try {
      const payload = {
        name: formState.name,
        headline: formState.headline,
        email: formState.email,
        timezone: formState.timezone,
        expertise: formState.expertise.split(',').map((item) => item.trim()).filter(Boolean),
        availabilityNotes: formState.availabilityNotes,
        packages: formState.packagesOverview,
        sessionFee: {
          amount: Number.parseFloat(formState.sessionFee) || undefined,
          currency: formState.sessionCurrency || '£',
        },
        bio: formState.bio,
        introVideoUrl: formState.introVideoUrl,
        socialLinks: formState.socialLinks
          .split(/\r?\n/)
          .map((item) => item.trim())
          .filter(Boolean),
      };

      await onSave?.(payload);
      setStatus({ success: true, error: null });
    } catch (error) {
      setStatus({ success: false, error: error.message || 'Unable to update profile. Please try again.' });
    }
  };

  const videoUrl = sanitizeVideoUrl(profile?.introVideoUrl || formState.introVideoUrl);

  return (
    <section className="space-y-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <header className="flex flex-wrap items-start justify-between gap-6">
        <div className="max-w-2xl space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">Profile completeness</p>
          <h2 className="text-2xl font-semibold text-slate-900">Craft a mentorship profile that converts</h2>
          <p className="text-sm text-slate-600">
            Refresh your story, expertise, and session rituals. Explorer uses this profile to match you with mentees, calibrate
            pricing suggestions, and promote packages across the marketplace.
          </p>
          <div className="relative mt-4 h-2 w-64 overflow-hidden rounded-full bg-slate-100">
            <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-accent to-indigo-500 transition-all" style={{ width: `${completion}%` }} />
          </div>
          <p className="text-xs font-medium text-slate-500">{completion}% complete</p>
        </div>
        <div className="flex flex-col items-end gap-2 text-right">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Mentee-facing metrics</span>
          <div className="flex flex-wrap justify-end gap-3">
            {(profile?.metrics ?? []).map((metric) => (
              <div key={metric.label} className="min-w-[140px] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{metric.label}</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{metric.value}</p>
                <p className="text-xs text-emerald-600">{metric.change}</p>
              </div>
            ))}
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Full name
              <input
                type="text"
                value={formState.name}
                onChange={(event) => handleChange('name', event.target.value)}
                placeholder="Jordan Mentor"
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Headline
              <input
                type="text"
                value={formState.headline}
                onChange={(event) => handleChange('headline', event.target.value)}
                placeholder="Product strategy mentor & operator"
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Email for mentees
              <input
                type="email"
                value={formState.email}
                onChange={(event) => handleChange('email', event.target.value)}
                placeholder="mentor@gigvora.com"
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Timezone
              <select
                value={formState.timezone}
                onChange={(event) => handleChange('timezone', event.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                {TIMEZONES.map((zone) => (
                  <option key={zone} value={zone}>
                    {zone}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
            Signature focus areas
            <input
              type="text"
              value={formState.expertise}
              onChange={(event) => handleChange('expertise', event.target.value)}
              placeholder="Leadership sprints, Product strategy, Experiment design"
              className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
            <span className="text-xs font-normal text-slate-500">Separate topics with commas to show them as badges.</span>
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
            Mentorship bio
            <textarea
              rows="4"
              value={formState.bio}
              onChange={(event) => handleChange('bio', event.target.value)}
              placeholder="Share your operating experience, mentee outcomes, and approach to rituals."
              className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Session fee
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={formState.sessionCurrency}
                  onChange={(event) => handleChange('sessionCurrency', event.target.value)}
                  className="w-16 rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formState.sessionFee}
                  onChange={(event) => handleChange('sessionFee', event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </div>
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Availability ritual
              <textarea
                rows="3"
                value={formState.availabilityNotes}
                onChange={(event) => handleChange('availabilityNotes', event.target.value)}
                placeholder="Tuesday & Thursday afternoons for deep dives, Friday mornings for async reviews."
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
          </div>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
            Packages snapshot
            <textarea
              rows="3"
              value={formState.packagesOverview}
              onChange={(event) => handleChange('packagesOverview', event.target.value)}
              placeholder="Flagship leadership accelerator and product growth audit programmes available in hybrid formats."
              className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
            Intro video URL
            <div className="flex items-center gap-2">
              <VideoCameraIcon className="h-5 w-5 text-slate-400" />
              <input
                type="url"
                value={formState.introVideoUrl}
                onChange={(event) => handleChange('introVideoUrl', event.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
            Social links
            <textarea
              rows="3"
              value={formState.socialLinks}
              onChange={(event) => handleChange('socialLinks', event.target.value)}
              placeholder={`https://www.linkedin.com/in/jordan-mentor\nhttps://mentor.gigvora.com`}
              className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
            <span className="text-xs font-normal text-slate-500">One link per line. These surface on your public profile card.</span>
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentDark disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {saving ? (
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircleIcon className="h-4 w-4" />
              )}
              {saving ? 'Saving profile…' : 'Publish profile updates'}
            </button>
            {status.success ? (
              <p className="text-sm font-medium text-emerald-600">Profile updated. Explorer refresh scheduled.</p>
            ) : null}
            {status.error ? <p className="text-sm font-medium text-rose-600">{status.error}</p> : null}
          </div>
        </form>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Activation wizard</h3>
            <ol className="mt-4 space-y-3">
              {PROFILE_WIZARD.map((step, index) => {
                const isComplete = completion >= ((index + 1) / PROFILE_WIZARD.length) * 100 - 10;
                return (
                  <li key={step.id} className="flex items-start gap-3">
                    <span
                      className={`mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                        isComplete ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {isComplete ? <CheckCircleIcon className="h-4 w-4" /> : index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{step.title}</p>
                      <p className="text-xs text-slate-500">{step.description}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          {videoUrl ? (
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-black shadow-lg">
              <iframe
                title="Mentor intro video"
                src={videoUrl}
                className="aspect-video w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
              <VideoCameraIcon className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-slate-700">Add an intro video</p>
              <p className="mt-1 text-xs text-slate-500">
                Paste a Loom or YouTube link to welcome mentees and explain your format.
              </p>
            </div>
          )}

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Latest social proof</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {(Array.isArray(profile?.socialLinks) ? profile.socialLinks : [])
                .slice(0, 4)
                .map((link) => (
                  <li key={link} className="flex items-center gap-2">
                    <ChevronDoubleRightIcon className="h-3 w-3 text-accent" />
                    <a href={link} className="truncate text-accent hover:underline" target="_blank" rel="noreferrer">
                      {link}
                    </a>
                  </li>
                ))}
            </ul>
            {profile?.availabilityNotes ? (
              <p className="mt-4 text-xs text-slate-500">
                <span className="font-semibold text-slate-700">Availability:</span> {profile.availabilityNotes}
              </p>
            ) : null}
          </div>
        </aside>
      </div>
    </section>
  );
}

HomeProfileSection.propTypes = {
  profile: PropTypes.shape({
    name: PropTypes.string,
    headline: PropTypes.string,
    email: PropTypes.string,
    timezone: PropTypes.string,
    focusAreas: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.string), PropTypes.string]),
    availabilityNotes: PropTypes.string,
    sessionFee: PropTypes.shape({ amount: PropTypes.number, currency: PropTypes.string }),
    packagesOverview: PropTypes.string,
    bio: PropTypes.string,
    introVideoUrl: PropTypes.string,
    socialLinks: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.string), PropTypes.string]),
    metrics: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string,
        value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        change: PropTypes.string,
      }),
    ),
  }),
  onSave: PropTypes.func,
  saving: PropTypes.bool,
};

HomeProfileSection.defaultProps = {
  profile: {},
  onSave: undefined,
  saving: false,
};
