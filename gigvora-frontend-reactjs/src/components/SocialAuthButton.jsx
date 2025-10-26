import PropTypes from 'prop-types';

const INTENT_LABELS = {
  login: 'Continue with',
  register: 'Join with',
  connect: 'Connect with',
};

const PROVIDER_STYLES = {
  linkedin: {
    name: 'LinkedIn',
    tagline: {
      login: 'Instantly sync your professional identity and get back to your projects.',
      register: 'Bring your network, experience, and endorsements with a single click.',
    },
    classes:
      'bg-[#0A66C2] text-white hover:bg-[#0a61b6] focus-visible:outline-[#0A66C2]/80 focus-visible:ring-[#0A66C2]/40',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
        <path d="M4.98 3.5a2.48 2.48 0 1 1 0 4.96 2.48 2.48 0 0 1 0-4.96zM3 9.25h3.95V21H3zM9.5 9.25H13v1.6h.05c.49-.93 1.69-1.9 3.48-1.9 3.72 0 4.4 2.45 4.4 5.64V21H17V15c0-1.43-.03-3.27-1.99-3.27-1.99 0-2.3 1.56-2.3 3.16V21H9.5z" />
      </svg>
    ),
  },
};

const SPINNER_ICON = (
  <svg viewBox="0 0 24 24" className="h-4 w-4 animate-spin" aria-hidden="true">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" className="opacity-20" fill="none" />
    <path
      d="M22 12a10 10 0 0 1-10 10"
      stroke="currentColor"
      strokeWidth="2"
      className="origin-center opacity-80"
      fill="none"
    />
  </svg>
);

export default function SocialAuthButton({
  provider,
  label,
  intent = 'login',
  tagline,
  onClick = () => {},
  disabled = false,
  loading = false,
  className = '',
  showTagline = true,
}) {
  const style = PROVIDER_STYLES[provider];

  if (!style) {
    return null;
  }

  const computedLabel = label || `${INTENT_LABELS[intent] ?? INTENT_LABELS.login} ${style.name}`;
  const resolvedTagline = tagline || style.tagline?.[intent] || style.tagline?.login || null;
  const isBusy = disabled || loading;

  return (
    <div className={`group space-y-2 ${className}`}>
      <button
        type="button"
        onClick={isBusy ? undefined : onClick}
        disabled={isBusy}
        data-provider={provider}
        className={`flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold shadow-soft transition focus-visible:outline focus-visible:outline-2 focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 ${style.classes}`}
        aria-label={computedLabel}
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15">
          {loading ? SPINNER_ICON : style.icon}
        </span>
        <span>{computedLabel}</span>
      </button>
      {showTagline && resolvedTagline ? (
        <p className="text-center text-xs text-slate-500 transition group-hover:text-slate-600">
          {resolvedTagline}
        </p>
      ) : null}
    </div>
  );
}

export const SOCIAL_PROVIDERS = Object.keys(PROVIDER_STYLES);

SocialAuthButton.propTypes = {
  provider: PropTypes.oneOf(SOCIAL_PROVIDERS).isRequired,
  label: PropTypes.string,
  intent: PropTypes.oneOf(Object.keys(INTENT_LABELS)),
  tagline: PropTypes.string,
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  className: PropTypes.string,
  showTagline: PropTypes.bool,
};

SocialAuthButton.defaultProps = {
  label: undefined,
  intent: 'login',
  tagline: undefined,
  onClick: undefined,
  disabled: false,
  loading: false,
  className: '',
  showTagline: true,
};
