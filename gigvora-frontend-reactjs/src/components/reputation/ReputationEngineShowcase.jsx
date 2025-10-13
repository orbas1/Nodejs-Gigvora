import {
  ArrowTrendingUpIcon,
  ChatBubbleLeftRightIcon,
  CheckBadgeIcon,
  GlobeAltIcon,
  MegaphoneIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import DataStatus from '../DataStatus.jsx';
import UserAvatar from '../UserAvatar.jsx';
import { formatRelativeTime, formatAbsolute } from '../../utils/date.js';

function formatBadgeDate(value) {
  if (!value) return null;
  try {
    return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' }).format(new Date(value));
  } catch (error) {
    return value;
  }
}

function formatMetricDescription(metric) {
  if (!metric?.periodLabel && !metric?.source) {
    return null;
  }
  const parts = [];
  if (metric.periodLabel) {
    parts.push(metric.periodLabel);
  }
  if (metric.source) {
    parts.push(`Source: ${metric.source}`);
  }
  return parts.join(' • ');
}

function classNames(...values) {
  return values.filter(Boolean).join(' ');
}

function TrendPill({ trendDirection, trendLabel }) {
  if (!trendLabel) {
    return null;
  }
  const palette = trendDirection === 'down' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600';
  return (
    <span className={classNames('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold', palette)}>
      <ArrowTrendingUpIcon
        className={classNames('mr-1 h-3.5 w-3.5', trendDirection === 'down' ? 'rotate-180 text-rose-500' : 'text-emerald-500')}
      />
      {trendLabel}
    </span>
  );
}

function TestimonialCard({ testimonial, featured = false }) {
  if (!testimonial) {
    return null;
  }
  return (
    <article
      className={classNames(
        'flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm',
        featured ? 'ring-2 ring-blue-200' : '',
      )}
    >
      <div>
        <p className="text-sm text-slate-600">{testimonial.comment}</p>
      </div>
      <footer className="mt-6 flex flex-col gap-1 text-sm text-slate-700">
        <div className="font-semibold text-slate-900">{testimonial.clientName}</div>
        <div className="text-xs uppercase tracking-wide text-slate-400">
          {[testimonial.clientRole, testimonial.company].filter(Boolean).join(' • ')}
        </div>
        {testimonial.rating ? (
          <div className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-amber-600">
            <SparklesIcon className="h-4 w-4" /> {testimonial.rating.toFixed(1)} / 5
          </div>
        ) : null}
      </footer>
    </article>
  );
}

function SuccessStoryCard({ story }) {
  if (!story) return null;
  return (
    <article className="flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-slate-50 p-6">
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-slate-900">{story.title}</h3>
        <p className="text-sm text-slate-600">{story.summary}</p>
        {story.impactMetrics ? (
          <dl className="grid gap-2 text-sm text-slate-600">
            {Object.entries(story.impactMetrics).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between rounded-2xl bg-white/80 px-3 py-2">
                <dt className="text-xs uppercase tracking-wide text-slate-400">{key.replace(/_/g, ' ')}</dt>
                <dd className="font-semibold text-slate-800">{value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
      {story.ctaUrl ? (
        <a
          href={story.ctaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center justify-center rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100"
        >
          View case study
        </a>
      ) : null}
    </article>
  );
}

function BadgeCard({ badge }) {
  return (
    <article className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <CheckBadgeIcon className="h-6 w-6 text-blue-500" />
        <div>
          <h4 className="text-sm font-semibold text-slate-900">{badge.name}</h4>
          <p className="text-xs uppercase tracking-wide text-slate-400">{badge.badgeType}</p>
        </div>
      </div>
      {badge.description ? <p className="text-sm text-slate-600">{badge.description}</p> : null}
      <dl className="mt-auto space-y-1 text-xs text-slate-500">
        {badge.issuedBy ? (
          <div>
            <dt className="inline text-slate-400">Issued by:</dt>{' '}
            <dd className="inline text-slate-500">{badge.issuedBy}</dd>
          </div>
        ) : null}
        {badge.issuedAt ? (
          <div>
            <dt className="inline text-slate-400">Issued:</dt>{' '}
            <dd className="inline text-slate-500">{formatBadgeDate(badge.issuedAt)}</dd>
          </div>
        ) : null}
      </dl>
    </article>
  );
}

function WidgetCard({ widget }) {
  const placement = widget.metadata?.placement ?? widget.config?.placement ?? 'active surfaces';
  return (
    <article className="flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm">
      <div>
        <h4 className="text-sm font-semibold text-slate-900">{widget.name}</h4>
        <p className="text-xs uppercase tracking-wide text-slate-400">{widget.widgetType}</p>
        <p className="mt-3 text-sm text-slate-600">Optimised for {placement} placements.</p>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-500">
        <div className="rounded-2xl bg-slate-100 px-3 py-2">
          <dt>Impressions</dt>
          <dd className="text-sm font-semibold text-slate-800">{widget.impressions?.toLocaleString?.() ?? widget.impressions}</dd>
        </div>
        <div className="rounded-2xl bg-slate-100 px-3 py-2">
          <dt>CTA clicks</dt>
          <dd className="text-sm font-semibold text-slate-800">{widget.ctaClicks?.toLocaleString?.() ?? widget.ctaClicks}</dd>
        </div>
      </dl>
    </article>
  );
}

export default function ReputationEngineShowcase({
  data,
  loading,
  error,
  onRefresh,
  fromCache,
  lastUpdated,
}) {
  const freelancer = data?.freelancer;
  const metrics = data?.metrics ?? [];
  const summary = data?.summary ?? {};
  const featuredTestimonial = data?.testimonials?.featured ?? null;
  const additionalTestimonials = data?.testimonials?.recent ?? [];
  const successStories = data?.successStories?.collection ?? [];
  const featuredStory = data?.successStories?.featured ?? null;
  const badges = data?.badges?.collection ?? [];
  const promotedBadges = data?.badges?.promoted ?? [];
  const reviewWidgets = data?.reviewWidgets ?? [];
  const automationPlaybooks = data?.automationPlaybooks ?? [];
  const integrationTouchpoints = data?.integrationTouchpoints ?? [];
  const shareableLinks = data?.shareableLinks ?? [];

  const metricsToRender = metrics.slice(0, 4);
  const secondaryMetrics = metrics.slice(4, 8);
  const verifiedRelative = summary?.lastVerifiedAt ? formatRelativeTime(summary.lastVerifiedAt) : null;
  const verifiedAbsolute = summary?.lastVerifiedAt ? formatAbsolute(summary.lastVerifiedAt) : null;

  return (
    <div className="space-y-12">
      <section id="reputation-engine" className="rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_24px_50px_-30px_rgba(30,64,175,0.35)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600/80">Reputation engine</p>
            <h2 className="text-3xl font-semibold text-slate-900">Social proof operations</h2>
            <p className="max-w-2xl text-sm text-slate-600">
              Monitor testimonials, success stories, verified metrics, and shareable badges from one command center. Every insight
              links back to Gigvora delivery data so clients can trust what they see.
            </p>
            {freelancer ? (
              <div className="flex items-center gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <UserAvatar name={freelancer.name} seed={freelancer.avatarSeed} size="md" />
                <div>
                  <p className="text-sm uppercase tracking-wide text-slate-400">Featured freelancer</p>
                  <p className="text-lg font-semibold text-slate-900">{freelancer.name}</p>
                  <p className="text-sm text-slate-500">{freelancer.title}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                    {freelancer.location ? <span>{freelancer.location}</span> : null}
                    {freelancer.timezone ? <span>• {freelancer.timezone}</span> : null}
                    {verifiedRelative ? (
                      <span title={verifiedAbsolute ?? undefined}>• Metrics verified {verifiedRelative}</span>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
          <DataStatus
            loading={loading}
            fromCache={fromCache}
            lastUpdated={lastUpdated}
            onRefresh={onRefresh}
          />
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metricsToRender.map((metric) => (
            <div key={metric.metricType} className="flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-wide text-slate-400">{metric.label}</p>
                <p className="text-2xl font-semibold text-slate-900">{metric.formattedValue ?? metric.value}</p>
                {metric.trendLabel ? <TrendPill trendDirection={metric.trendDirection} trendLabel={metric.trendLabel} /> : null}
                {formatMetricDescription(metric) ? (
                  <p className="text-xs text-slate-500">{formatMetricDescription(metric)}</p>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        {secondaryMetrics.length ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {secondaryMetrics.map((metric) => (
              <div key={metric.metricType} className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 p-5">
                <p className="text-xs uppercase tracking-wide text-slate-400">{metric.label}</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{metric.formattedValue ?? metric.value}</p>
                {formatMetricDescription(metric) ? (
                  <p className="mt-2 text-xs text-slate-500">{formatMetricDescription(metric)}</p>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}

        <div className="mt-10 grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Featured testimonial</h3>
            <TestimonialCard testimonial={featuredTestimonial} featured />
          </div>
          <div className="lg:col-span-3 space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Recent testimonials</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {additionalTestimonials.slice(0, 4).map((testimonial) => (
                <TestimonialCard key={testimonial.id} testimonial={testimonial} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="reputation-success-stories" className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600/80">Success stories</p>
          <h2 className="text-2xl font-semibold text-slate-900">Evidence-rich case studies</h2>
          <p className="text-sm text-slate-600">
            Publish data-backed narratives that blend milestone charts, CSAT trends, and ROI snapshots. Stories sync across your
            public profile, proposals, and external channels automatically.
          </p>
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {featuredStory ? <SuccessStoryCard story={featuredStory} /> : null}
          {successStories
            .filter((story) => !featuredStory || story.id !== featuredStory.id)
            .slice(0, 2)
            .map((story) => (
              <SuccessStoryCard key={story.id} story={story} />
            ))}
        </div>
      </section>

      <section id="reputation-badges" className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600/80">Badges & credentials</p>
          <h2 className="text-2xl font-semibold text-slate-900">Signal credibility instantly</h2>
          <p className="text-sm text-slate-600">
            Earned badges sync to gig listings, proposals, and shareable widgets. Use them to highlight verified CSAT, reliability
            streaks, or community leadership.
          </p>
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {promotedBadges.concat(badges.filter((badge) => !promotedBadges.some((promoted) => promoted.id === badge.id))).map(
            (badge) => (
              <BadgeCard key={badge.id} badge={badge} />
            ),
          )}
        </div>
      </section>

      <section id="reputation-widgets" className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600/80">Shareable widgets</p>
          <h2 className="text-2xl font-semibold text-slate-900">Embed proof everywhere</h2>
          <p className="text-sm text-slate-600">
            Widgets stay in sync with Gigvora data. Drop them into pitch decks, CRM deal rooms, or marketing sites without
            touching code.
          </p>
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {reviewWidgets.slice(0, 4).map((widget) => (
            <WidgetCard key={widget.id} widget={widget} />
          ))}
        </div>
        {shareableLinks.length ? (
          <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-slate-900">Shareable links</h3>
            <ul className="mt-3 space-y-2 text-sm text-blue-600">
              {shareableLinks.map((link) => (
                <li key={link.url}>
                  <a href={link.url} target="_blank" rel="noopener noreferrer" className="underline decoration-dotted">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section id="reputation-automation" className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <MegaphoneIcon className="h-6 w-6 text-blue-500" />
              <h2 className="text-xl font-semibold text-slate-900">Automation playbooks</h2>
            </div>
            <p className="text-sm text-slate-600">
              Keep social proof fresh without manual effort. These automations trigger from Gigvora delivery data and CRM signals.
            </p>
            <ul className="space-y-3">
              {automationPlaybooks.map((item) => (
                <li key={item} className="flex gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  <SparklesIcon className="mt-1 h-4 w-4 text-blue-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <GlobeAltIcon className="h-6 w-6 text-blue-500" />
              <h2 className="text-xl font-semibold text-slate-900">Integration touchpoints</h2>
            </div>
            <p className="text-sm text-slate-600">
              Publish proof across every client journey touchpoint. Embeds and APIs keep everything synced from proposals to live
              deal rooms.
            </p>
            <ul className="space-y-2 text-sm text-slate-600">
              {integrationTouchpoints.map((item) => (
                <li key={item} className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2">
                  <ChatBubbleLeftRightIcon className="h-4 w-4 text-blue-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

