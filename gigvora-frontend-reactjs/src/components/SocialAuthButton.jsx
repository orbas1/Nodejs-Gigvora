import PropTypes from 'prop-types';

const PROVIDER_STYLES = {
  linkedin: {
    label: 'Continue with LinkedIn',
    baseClass:
      'bg-[#0A66C2] text-white hover:bg-[#0a61b6] focus-visible:outline-[#0A66C2]/80 focus-visible:ring-[#0A66C2]/40',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
        <path d="M4.98 3.5a2.48 2.48 0 1 1 0 4.96 2.48 2.48 0 0 1 0-4.96zM3 9.25h3.95V21H3zM9.5 9.25H13v1.6h.05c.49-.93 1.69-1.9 3.48-1.9 3.72 0 4.4 2.45 4.4 5.64V21H17V15c0-1.43-.03-3.27-1.99-3.27-1.99 0-2.3 1.56-2.3 3.16V21H9.5z" />
      </svg>
    ),
  },
};

export default function SocialAuthButton({ provider, label, onClick = () => {}, disabled = false }) {
  const style = PROVIDER_STYLES[provider];

  if (!style) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold shadow-soft transition focus-visible:outline focus-visible:outline-2 focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 ${style.baseClass}`}
      aria-label={label || style.label}
    >
      {style.icon}
      <span>{label || style.label}</span>
    </button>
  );
}

export const SOCIAL_PROVIDERS = Object.keys(PROVIDER_STYLES);

export const SOCIAL_PROVIDER_LABELS = Object.freeze(
  SOCIAL_PROVIDERS.reduce((acc, key) => {
    acc[key] = PROVIDER_STYLES[key]?.label ?? key;
    return acc;
  }, {}),
);

SocialAuthButton.propTypes = {
  provider: PropTypes.oneOf(SOCIAL_PROVIDERS).isRequired,
  label: PropTypes.string,
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
};
