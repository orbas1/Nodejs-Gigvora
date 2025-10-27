import { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowUpRightIcon,
  BoltIcon,
  BuildingOffice2Icon,
  ChartBarIcon,
  CurrencyDollarIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import analytics from '../../services/analytics.js';
import CardScaffold from '../common/CardScaffold.jsx';
import ButtonSuite from '../common/ButtonSuite.jsx';
import PersonaChip from '../ui/PersonaChip.jsx';
import InsightStatBlock from '../ui/InsightStatBlock.jsx';

const ICON_MAP = {
  SparklesIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  BoltIcon,
  GlobeAltIcon,
  BuildingOffice2Icon,
};

const DEFAULT_PILLARS = [
  {
    id: 'command-centre',
    title: 'One command centre for every mission',
    description:
      'Run launches, mentoring, and operations from a single glassmorphic HQ with telemetry every stakeholder trusts.',
    highlights: [
      'Real-time launchpad, finance, and compliance visibility for every persona',
      'Async rituals, pulse digests, and AI nudges keep crews accountable across timezones',
    ],
    metric: { label: 'Operational clarity', value: '8.6/10 team confidence score' },
    icon: SparklesIcon,
    action: { id: 'command-centre', label: 'Explore HQ playbook', href: '/platform/command-centre' },
    audiences: ['Founders', 'Operations'],
  },
  {
    id: 'compliance-trust',
    title: 'Enterprise trust without slowdowns',
    description:
      'Treasury, legal, and risk automation wire into every engagement so finance and compliance teams ship with confidence.',
    highlights: [
      'Role-aware access, SOC 2 audits, and escrow guardrails in one shared ledger',
      'Regulated payouts, renewals, and invoicing run through a verified treasury spine',
    ],
    metric: { label: 'Trust signals', value: '99.95% uptime · SOC 2 monitored' },
    icon: ShieldCheckIcon,
    action: { id: 'trust-centre', label: 'Review trust centre', href: '/trust-center' },
    audiences: ['Finance', 'Legal'],
  },
  {
    id: 'talent-network',
    title: 'Curated network activated in days',
    description:
      'Mentor guilds, specialists, and community pods assemble instantly with readiness scores and engagement insights.',
    highlights: [
      'AI matching, guild programming, and readiness scoring surface the right crew instantly',
      'Live NPS, utilisation, and sentiment analytics keep teams tuned to outcomes',
    ],
    metric: { label: 'Network activation', value: '7,800+ mentors & specialists' },
    icon: ChartBarIcon,
    action: { id: 'talent-network', label: 'Meet the network', href: '/network' },
    audiences: ['Talent leaders', 'Agencies'],
  },
];

function coerceText(value, fallback = '') {
  if (value == null) {
    return fallback;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : fallback;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return `${value}`;
  }
  return fallback;
}

function normalisePillars(pillars) {
  if (!Array.isArray(pillars)) {
    return [];
  }

  return pillars
    .map((pillar) => {
      if (!pillar) return null;
      const title = coerceText(pillar.title ?? pillar.label ?? pillar.name);
      if (!title) return null;

      const highlightSource = Array.isArray(pillar.highlights)
        ? pillar.highlights
        : pillar.highlights
        ? [pillar.highlights]
        : Array.isArray(pillar.bullets)
        ? pillar.bullets
        : [];
      const highlights = highlightSource
        .map((entry) => {
          if (!entry) return null;
          if (typeof entry === 'string') return coerceText(entry);
          if (typeof entry === 'object') {
            return coerceText(entry.text ?? entry.copy ?? entry.description ?? entry.title ?? entry.label);
          }
          return null;
        })
        .filter(Boolean);

      let metric = null;
      if (pillar.metric && typeof pillar.metric === 'object') {
        const metricLabel = coerceText(pillar.metric.label ?? pillar.metric.title ?? pillar.metric.name, 'Key metric');
        const metricValue = coerceText(pillar.metric.value ?? pillar.metric.copy ?? pillar.metric.stat ?? null, null);
        if (metricLabel || metricValue) {
          metric = { label: metricLabel || 'Key metric' };
          if (metricValue) {
            metric.value = metricValue;
          }
        }
      }

      const iconKey = coerceText(pillar.icon ?? pillar.Icon ?? pillar.iconName, null);
      const resolvedIcon =
        typeof iconKey === 'string'
          ? ICON_MAP[iconKey] ?? null
          : typeof iconKey === 'function'
          ? iconKey
          : null;

      const actionSource = pillar.action ?? pillar.cta;
      let action = null;
      if (actionSource && typeof actionSource === 'object') {
        const label = coerceText(actionSource.label ?? actionSource.title ?? actionSource.name ?? 'Explore pillar');
        if (label) {
          action = {
            id: coerceText(
              actionSource.id ?? actionSource.action ?? actionSource.href ?? actionSource.to ?? label,
              label,
            ),
            label,
            href: coerceText(actionSource.href ?? actionSource.url, null) || undefined,
            to: coerceText(actionSource.to, null) || undefined,
            onClick: typeof actionSource.onClick === 'function' ? actionSource.onClick : null,
          };
        }
      }

      const audienceSource =
        Array.isArray(pillar.audiences)
          ? pillar.audiences
          : Array.isArray(pillar.personas)
          ? pillar.personas
          : pillar.audiences || pillar.personas
          ? [pillar.audiences || pillar.personas].flat()
          : [];
      const audiences = audienceSource
        .map((audience) => coerceText(audience, null))
        .filter(Boolean);

      return {
        id: coerceText(pillar.id ?? pillar.slug ?? pillar.key, title) || title,
        title,
        description: coerceText(pillar.description ?? pillar.copy ?? pillar.summary ?? null, null) || null,
        highlights,
        metric,
        icon: resolvedIcon,
        action,
        audiences,
      };
    })
    .filter(Boolean);
}

export function ValuePillars({ pillars, loading = false, analyticsMetadata = {} }) {
  const displayPillars = useMemo(() => {
    const resolved = normalisePillars(pillars);
    if (resolved.length) {
      return resolved;
    }
    return DEFAULT_PILLARS;
  }, [pillars]);

  const handleAction = (pillar, event) => {
    if (!pillar?.action) {
      return;
    }

    analytics.track(
      analyticsMetadata.pillarEventName ?? 'marketing_value_pillar_action',
      {
        pillarId: pillar.id,
        heroId: analyticsMetadata.heroId,
        action: pillar.action.id ?? pillar.action.href ?? pillar.action.to ?? 'cta',
      },
      { source: analyticsMetadata.source ?? 'web_marketing_site' },
    );

    if (typeof pillar.action.onClick === 'function') {
      pillar.action.onClick(event ?? {});
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {displayPillars.map((pillar) => {
        const PillarIcon = pillar.icon ?? ICON_MAP.SparklesIcon ?? SparklesIcon;
        const actionLabel = pillar.action?.label ?? 'Explore pillar';
        const actionIsLink = Boolean(pillar.action?.href || pillar.action?.to);
        const actionHref = pillar.action?.href ?? pillar.action?.to ?? undefined;

        const actionButton = pillar.action ? (
          <ButtonSuite
            as={actionIsLink ? 'a' : 'button'}
            type={actionIsLink ? undefined : 'button'}
            href={actionHref}
            variant="ghost"
            size="sm"
            trailingIcon={<ArrowUpRightIcon className="h-4 w-4" aria-hidden="true" />}
            onClick={(event) => {
              if (actionIsLink && pillar.action?.onClick) {
                event.preventDefault();
              }
              handleAction(pillar, event);
            }}
          >
            {actionLabel}
          </ButtonSuite>
        ) : null;

        return (
          <CardScaffold
            key={pillar.id}
            variant="dark"
            padding="lg"
            highlight="primary"
            media={
              <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-accent/20 text-accent">
                <PillarIcon className="h-7 w-7" aria-hidden="true" />
              </div>
            }
            title={pillar.title}
            description={pillar.description}
            actions={actionButton}
            footer={
              pillar.metric ? (
                <InsightStatBlock
                  as="div"
                  tone="accent"
                  label={pillar.metric.label}
                  value={pillar.metric.value}
                  className="min-w-[11rem]"
                />
              ) : null
            }
            className="bg-slate-950/80 text-white"
          >
            {Array.isArray(pillar.audiences) && pillar.audiences.length ? (
              <div className="flex flex-wrap gap-2">
                {pillar.audiences.filter(Boolean).map((audience) => (
                  <PersonaChip
                    key={`${pillar.id}-${audience}`}
                    label={audience}
                    tone="frost"
                    size="sm"
                    indicator={false}
                    className="shadow-none"
                  />
                ))}
              </div>
            ) : null}

            <ul className="space-y-2 text-sm text-white/80">
              {(pillar.highlights?.length
                ? pillar.highlights
                : DEFAULT_PILLARS.find((item) => item.id === pillar.id)?.highlights ?? []
              ).map((highlight) => (
                <li key={highlight} className="flex items-start gap-2">
                  <span className="mt-1 inline-block h-1.5 w-1.5 flex-none rounded-full bg-accent" aria-hidden="true" />
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          </CardScaffold>
        );
      })}

      {loading
        ? Array.from({ length: Math.max(0, 3 - displayPillars.length) }).map((_, index) => (
            <CardScaffold
              key={`pillar-skeleton-${index}`}
              variant="dark"
              padding="lg"
              className="hidden animate-pulse text-white/60 lg:block"
              aria-hidden="true"
              media={<div className="h-14 w-14 rounded-3xl bg-white/10" />}
              title={<span className="block h-5 w-3/4 rounded-full bg-white/10" />}
              description={<span className="block h-4 w-full rounded-full bg-white/10" />}
              footer={<div className="h-16 w-full rounded-2xl bg-white/10" />}
            >
              <div className="space-y-3">
                <div className="h-3 w-full rounded-full bg-white/10" />
                <div className="h-3 w-5/6 rounded-full bg-white/10" />
                <div className="h-3 w-2/3 rounded-full bg-white/10" />
              </div>
            </CardScaffold>
          ))
        : null}
    </div>
  );
}

ValuePillars.propTypes = {
  pillars: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      title: PropTypes.string,
      description: PropTypes.string,
      highlights: PropTypes.arrayOf(PropTypes.string),
      metric: PropTypes.shape({
        label: PropTypes.string,
        value: PropTypes.string,
      }),
      icon: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
      action: PropTypes.shape({
        id: PropTypes.string,
        label: PropTypes.string,
        href: PropTypes.string,
        to: PropTypes.string,
        onClick: PropTypes.func,
      }),
      audiences: PropTypes.arrayOf(PropTypes.string),
    }),
  ),
  loading: PropTypes.bool,
  analyticsMetadata: PropTypes.shape({
    source: PropTypes.string,
    heroId: PropTypes.string,
    pillarEventName: PropTypes.string,
  }),
};

ValuePillars.defaultProps = {
  pillars: undefined,
  loading: false,
  analyticsMetadata: {},
};

export default ValuePillars;
