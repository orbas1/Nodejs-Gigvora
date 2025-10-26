import PropTypes from 'prop-types';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { CallToActionBand } from '../../components/marketing/CallToActionBand.jsx';
import { joinCommunityCta as defaultJoinCommunityCta } from '../../content/home/testimonials.js';

function normalizeStats(stats, fallback) {
  const source = Array.isArray(stats) ? stats : [];
  const base = Array.isArray(fallback) ? fallback : [];
  const cleaned = source
    .map((stat, index) => {
      const baseStat = base[index] ?? base[0] ?? {};
      const value = typeof stat?.value === 'string' || typeof stat?.value === 'number' ? stat.value : baseStat.value;
      const label = typeof stat?.label === 'string' ? stat.label : baseStat.label;
      if (!value || !label) {
        return null;
      }
      const helper = typeof stat?.helper === 'string' ? stat.helper : baseStat.helper;
      return {
        value: String(value).trim(),
        label: label.trim(),
        ...(helper ? { helper: helper.trim() } : {}),
      };
    })
    .filter(Boolean);
  return cleaned.length ? cleaned : base.map((stat) => ({ ...stat }));
}

function normalizeStringList(list, fallback) {
  const source = Array.isArray(list) ? list : [];
  const base = Array.isArray(fallback) ? fallback : [];
  const cleaned = source
    .map((entry) => {
      if (typeof entry === 'string') {
        const trimmed = entry.trim();
        return trimmed ? trimmed : null;
      }
      return null;
    })
    .filter(Boolean);
  return cleaned.length ? cleaned : base.map((item) => (typeof item === 'string' ? item : String(item)));
}

function normalizeGuarantees(list, fallback) {
  const source = Array.isArray(list) ? list : [];
  const base = Array.isArray(fallback) ? fallback : [];
  const cleaned = source
    .map((entry, index) => {
      if (typeof entry === 'string') {
        const trimmed = entry.trim();
        return trimmed ? trimmed : null;
      }
      if (entry && typeof entry === 'object') {
        const label = typeof entry.label === 'string' ? entry.label.trim() : entry.title?.trim();
        if (!label) {
          return null;
        }
        return { label };
      }
      const baseEntry = base[index];
      if (baseEntry) {
        return typeof baseEntry === 'string' ? baseEntry : { ...baseEntry };
      }
      return null;
    })
    .filter(Boolean);
  return cleaned.length ? cleaned : base.map((entry) => (typeof entry === 'string' ? entry : { ...entry }));
}

function normalizeTestimonialSpotlight(testimonial, fallback) {
  const base = fallback && typeof fallback === 'object' ? fallback : {};
  const source = testimonial && typeof testimonial === 'object' ? testimonial : {};
  const quote = typeof source.quote === 'string' ? source.quote.trim() : base.quote;
  const name = typeof source.name === 'string' ? source.name.trim() : base.name;
  if (!quote || !name) {
    return base;
  }
  const role = typeof source.role === 'string' ? source.role.trim() : base.role;
  const company = typeof source.company === 'string' ? source.company.trim() : base.company;
  const avatarSource = source.avatar && typeof source.avatar === 'object' ? source.avatar : null;
  const avatar = avatarSource?.src
    ? {
        src: avatarSource.src,
        alt: avatarSource.alt ?? avatarSource.altText ?? base.avatar?.alt,
      }
    : base.avatar;
  return {
    quote,
    name,
    ...(role ? { role } : {}),
    ...(company ? { company } : {}),
    ...(avatar?.src ? { avatar } : {}),
  };
}

function normalizeAction(action, fallback) {
  const base = fallback && typeof fallback === 'object' ? fallback : null;
  const source = action && typeof action === 'object' ? action : null;
  const label = source?.label ?? source?.title ?? base?.label;
  if (!label) {
    return base ? { ...base } : null;
  }

  const href = source?.href ?? source?.url ?? base?.href ?? base?.url ?? null;
  const route = source?.to ?? source?.route ?? source?.path ?? base?.to ?? base?.route ?? base?.path ?? null;
  const target = source?.target ?? base?.target ?? null;
  const rel = source?.rel ?? base?.rel ?? null;
  const iconSource = source?.icon ?? base?.icon ?? ((href || route) ? ArrowRightIcon : null);

  const payload = { label };
  if (href) {
    payload.href = href;
  } else if (route) {
    payload.to = route;
  }
  if (target) {
    payload.target = target;
  }
  if (rel) {
    payload.rel = rel;
  }
  if (typeof source?.onClick === 'function') {
    payload.onClick = source.onClick;
  }
  if (iconSource) {
    payload.icon = iconSource;
  }

  return payload;
}

function normalizeCta(cta) {
  const base = defaultJoinCommunityCta;
  if (!cta || typeof cta !== 'object') {
    return { ...base };
  }

  const primaryAction = normalizeAction(cta.primaryAction ?? cta.primary, base.primaryAction);
  const secondaryAction = normalizeAction(cta.secondaryAction ?? cta.secondary, base.secondaryAction);

  return {
    eyebrow: typeof cta.eyebrow === 'string' ? cta.eyebrow : base.eyebrow,
    title: typeof cta.title === 'string' ? cta.title : base.title,
    description: typeof cta.description === 'string' ? cta.description : base.description,
    primaryAction,
    secondaryAction,
    supportingPoints: normalizeStringList(cta.supportingPoints, base.supportingPoints),
    stats: normalizeStats(cta.stats, base.stats),
    logos: normalizeStringList(cta.logos, base.logos),
    guarantees: normalizeGuarantees(cta.guarantees, base.guarantees),
    testimonial: normalizeTestimonialSpotlight(cta.testimonial, base.testimonial),
    footnote: typeof cta.footnote === 'string' ? cta.footnote : base.footnote,
  };
}

export function JoinCommunitySection({ cta }) {
  const normalizedCta = normalizeCta(cta);

  return (
    <div className="py-24">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <CallToActionBand {...normalizedCta} />
      </div>
    </div>
  );
}

JoinCommunitySection.propTypes = {
  cta: PropTypes.shape({
    eyebrow: PropTypes.string,
    title: PropTypes.string,
    description: PropTypes.string,
    primaryAction: PropTypes.shape({
      label: PropTypes.string,
      href: PropTypes.string,
      to: PropTypes.string,
      icon: PropTypes.elementType,
    }),
    secondaryAction: PropTypes.shape({
      label: PropTypes.string,
      href: PropTypes.string,
      to: PropTypes.string,
      icon: PropTypes.elementType,
    }),
    supportingPoints: PropTypes.array,
    stats: PropTypes.array,
    logos: PropTypes.array,
    guarantees: PropTypes.array,
    testimonial: PropTypes.object,
    footnote: PropTypes.string,
  }),
};

JoinCommunitySection.defaultProps = {
  cta: undefined,
};
