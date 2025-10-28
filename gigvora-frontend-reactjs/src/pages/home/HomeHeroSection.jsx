import { useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import analytics from '../../services/analytics.js';
import PublicHero from '../../components/marketing/PublicHero.jsx';

const FALLBACK_HEADLINE = 'A fresh place to grow your work.';
const FALLBACK_SUBHEADING =
  'GigVora keeps your projects, collaborators, and opportunities together so you can focus on the next win.';
const FALLBACK_MEDIA = {
  imageUrl: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=820&q=80',
  alt: 'A bright desk with laptops and notebooks ready for collaboration.',
};

function buildAction(action, fallbackLabel) {
  if (!action || typeof action !== 'object') {
    return { label: fallbackLabel };
  }

  return {
    label: action.label ?? fallbackLabel,
    href: action.href ?? null,
    to: action.to ?? null,
    onClick: action.onClick ?? null,
  };
}

export function HomeHeroSection({
  headline,
  subheading,
  media,
  loading = false,
  error = null,
  onPrimaryAction,
  onSecondaryAction,
  primaryAction,
  secondaryAction,
}) {
  useEffect(() => {
    analytics.track(
      'web_home_hero_viewed',
      { heroId: 'home-hero', loading, errored: Boolean(error) },
      { source: 'web_marketing_site' },
    );
  }, [error, loading]);

  const heroHeadline = headline?.trim() || FALLBACK_HEADLINE;
  const heroSubheading = error
    ? 'We are refreshing the latest programmes right now.'
    : subheading?.trim() || FALLBACK_SUBHEADING;

  const heroMedia = useMemo(() => {
    if (media && typeof media === 'object' && media.imageUrl) {
      return { imageUrl: media.imageUrl, alt: media.alt ?? media.caption ?? FALLBACK_MEDIA.alt };
    }
    return FALLBACK_MEDIA;
  }, [media]);

  const resolvedPrimaryAction = useMemo(() => {
    const action = buildAction(primaryAction, 'Join GigVora');
    if (!action.onClick && typeof onPrimaryAction === 'function') {
      action.onClick = () => onPrimaryAction();
    }
    return action;
  }, [onPrimaryAction, primaryAction]);

  const resolvedSecondaryAction = useMemo(() => {
    const action = buildAction(secondaryAction, 'Browse opportunities');
    if (!action.onClick && typeof onSecondaryAction === 'function') {
      action.onClick = () => onSecondaryAction();
    }
    return action;
  }, [onSecondaryAction, secondaryAction]);

  return (
    <PublicHero
      id="home-hero"
      eyebrow={loading ? 'Loading' : 'Welcome to GigVora'}
      headline={heroHeadline}
      subheading={heroSubheading}
      media={heroMedia}
      primaryAction={resolvedPrimaryAction}
      secondaryAction={resolvedSecondaryAction}
    />
  );
}

HomeHeroSection.propTypes = {
  headline: PropTypes.string,
  subheading: PropTypes.string,
  media: PropTypes.shape({
    imageUrl: PropTypes.string,
    alt: PropTypes.string,
  }),
  loading: PropTypes.bool,
  error: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
  onPrimaryAction: PropTypes.func,
  onSecondaryAction: PropTypes.func,
  primaryAction: PropTypes.shape({
    label: PropTypes.string,
    href: PropTypes.string,
    to: PropTypes.string,
    onClick: PropTypes.func,
  }),
  secondaryAction: PropTypes.shape({
    label: PropTypes.string,
    href: PropTypes.string,
    to: PropTypes.string,
    onClick: PropTypes.func,
  }),
};

HomeHeroSection.defaultProps = {
  headline: null,
  subheading: null,
  media: null,
  loading: false,
  error: null,
  onPrimaryAction: null,
  onSecondaryAction: null,
  primaryAction: null,
  secondaryAction: null,
};

export default HomeHeroSection;
