import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import WorkspacePrimerCarousel from './WorkspacePrimerCarousel.jsx';

const REQUIRED_FIELDS = ['companyName', 'role', 'timezone'];

function getTrimmed(value = '') {
  return typeof value === 'string' ? value.trim() : '';
}

export default function ProfileBasicsForm({
  value,
  onChange,
  persona,
  personaInsights,
  workspacePrimerSlides,
  analytics,
  shouldShowErrors,
  onValidityChange,
}) {
  const [touched, setTouched] = useState({});

  const trimmedFields = useMemo(
    () => ({
      companyName: getTrimmed(value?.companyName),
      role: getTrimmed(value?.role),
      timezone: getTrimmed(value?.timezone),
      headline: getTrimmed(value?.headline),
      northStar: getTrimmed(value?.northStar),
    }),
    [value],
  );

  const isValid = REQUIRED_FIELDS.every((field) => trimmedFields[field]);

  useEffect(() => {
    onValidityChange?.(isValid);
  }, [isValid, onValidityChange]);

  useEffect(() => {
    setTouched({});
  }, [persona?.id]);

  const markTouched = (field) => {
    setTouched((current) => ({ ...current, [field]: true }));
  };

  const hasError = (field) => {
    if (!REQUIRED_FIELDS.includes(field)) {
      return false;
    }
    if (!trimmedFields[field]) {
      return Boolean(shouldShowErrors || touched[field]);
    }
    return false;
  };

  const helperForField = (field) => {
    if (!hasError(field)) {
      return null;
    }
    switch (field) {
      case 'companyName':
        return 'Add your company or brand name so we can personalise copy and analytics.';
      case 'role':
        return 'Share your role so the workspace can tailor guidance and responsibilities.';
      case 'timezone':
        return 'Set your preferred timezone for scheduling, digests, and reminders.';
      default:
        return 'This field is required.';
    }
  };

  const handleChange = (field) => (event) => {
    onChange?.(field, event?.target?.value ?? '');
  };

  const formHeaderCopy = persona
    ? `We tailor automations and sample copy to the ${persona.title.toLowerCase()} journey.`
    : 'Tell us about your brand so we can tailor onboarding automations.';

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2.25fr)_minmax(0,1fr)]">
      <div className="space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Tell us about your brand</h3>
              <p className="mt-2 text-sm text-slate-500">{formHeaderCopy}</p>
            </div>
            {persona ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-1 text-xs font-semibold text-slate-600">
                <span className="inline-flex h-2 w-2 rounded-full bg-accent" />
                {persona.title}
              </div>
            ) : null}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Company or brand name
              <input
                type="text"
                value={value.companyName}
                onChange={handleChange('companyName')}
                onBlur={() => markTouched('companyName')}
                placeholder="Gigvora Labs"
                aria-invalid={hasError('companyName')}
                className={`w-full rounded-2xl border px-4 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-accent/20 ${
                  hasError('companyName')
                    ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-200'
                    : 'border-slate-200 focus:border-accent'
                }`}
              />
              {helperForField('companyName') ? (
                <p className="text-xs text-rose-600">{helperForField('companyName')}</p>
              ) : (
                <p className="text-xs text-slate-400">Appears on your workspace hero and executive summaries.</p>
              )}
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Your role
              <input
                type="text"
                value={value.role}
                onChange={handleChange('role')}
                onBlur={() => markTouched('role')}
                placeholder="Head of Talent"
                aria-invalid={hasError('role')}
                className={`w-full rounded-2xl border px-4 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-accent/20 ${
                  hasError('role')
                    ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-200'
                    : 'border-slate-200 focus:border-accent'
                }`}
              />
              {helperForField('role') ? (
                <p className="text-xs text-rose-600">{helperForField('role')}</p>
              ) : (
                <p className="text-xs text-slate-400">Helps us tune collaborator guidance and success metrics.</p>
              )}
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Preferred timezone
              <input
                type="text"
                value={value.timezone}
                onChange={handleChange('timezone')}
                onBlur={() => markTouched('timezone')}
                placeholder="GMT / London"
                aria-invalid={hasError('timezone')}
                className={`w-full rounded-2xl border px-4 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-accent/20 ${
                  hasError('timezone')
                    ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-200'
                    : 'border-slate-200 focus:border-accent'
                }`}
              />
              {helperForField('timezone') ? (
                <p className="text-xs text-rose-600">{helperForField('timezone')}</p>
              ) : (
                <p className="text-xs text-slate-400">Controls scheduling defaults and analytics reporting windows.</p>
              )}
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Signature headline
              <input
                type="text"
                value={value.headline}
                onChange={handleChange('headline')}
                onBlur={() => markTouched('headline')}
                placeholder="Where hiring brand, community, and revenue meet"
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
              <p className="text-xs text-slate-400">Appears in social share cards, hero modules, and digests.</p>
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600 md:col-span-2">
              North-star outcome for the next quarter
              <textarea
                rows={3}
                value={value.northStar}
                onChange={handleChange('northStar')}
                onBlur={() => markTouched('northStar')}
                placeholder="Scale warm talent pipeline to 150 qualified leads and launch onboarding experience."
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
              <p className="text-xs text-slate-400">We use this to align success metrics and story prompts.</p>
            </label>
          </div>
        </section>

        <WorkspacePrimerCarousel
          slides={workspacePrimerSlides}
          analytics={analytics}
        />
      </div>

      <aside className="rounded-3xl border border-slate-200 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-lg">
        <h4 className="text-lg font-semibold">What this unlocks</h4>
        <p className="mt-2 text-sm text-white/70">
          {persona
            ? `Your answers personalise automation, sample copy, and analytics to the ${persona.title.toLowerCase()} playbook.`
            : 'Completing these basics lets us tailor automations, analytics, and storytelling to your brand.'}
        </p>
        {Array.isArray(personaInsights) && personaInsights.length ? (
          <dl className="mt-5 space-y-4 text-sm text-white/80">
            {personaInsights.map((insight) => (
              <div key={insight.label}>
                <dt className="text-xs font-semibold uppercase tracking-wide text-white/50">{insight.label}</dt>
                <dd className="mt-1 space-y-1">
                  {Array.isArray(insight.value)
                    ? insight.value.map((line) => (
                        <p key={line}>{line}</p>
                      ))
                    : insight.value}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
            Pick a persona to preview signature wins, recommended modules, and north-star metrics.
          </div>
        )}
      </aside>
    </div>
  );
}

ProfileBasicsForm.propTypes = {
  value: PropTypes.shape({
    companyName: PropTypes.string,
    role: PropTypes.string,
    timezone: PropTypes.string,
    headline: PropTypes.string,
    northStar: PropTypes.string,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  persona: PropTypes.shape({
    id: PropTypes.string,
    title: PropTypes.string,
  }),
  personaInsights: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.string),
        PropTypes.string,
      ]).isRequired,
    }),
  ),
  workspacePrimerSlides: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
    }),
  ),
  analytics: PropTypes.shape({
    track: PropTypes.func,
  }),
  shouldShowErrors: PropTypes.bool,
  onValidityChange: PropTypes.func,
};

ProfileBasicsForm.defaultProps = {
  persona: undefined,
  personaInsights: [],
  workspacePrimerSlides: [],
  analytics: undefined,
  shouldShowErrors: false,
  onValidityChange: undefined,
};
