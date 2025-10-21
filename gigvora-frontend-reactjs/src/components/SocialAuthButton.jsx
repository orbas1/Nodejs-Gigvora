import PropTypes from 'prop-types';

const PROVIDER_STYLES = {
  x: {
    label: 'Continue with X',
    baseClass:
      'bg-black text-white hover:bg-black/90 focus-visible:outline-black/70 focus-visible:ring-black/40',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
        <path d="M3.3 2h5.1l4 5.7L15.7 2H21l-6.7 9.1L21 22h-5.1l-4.2-6-4.2 6H2l6.7-9.2z" />
      </svg>
    ),
  },
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
  facebook: {
    label: 'Continue with Facebook',
    baseClass:
      'bg-[#1877F2] text-white hover:bg-[#166ee6] focus-visible:outline-[#1877F2]/80 focus-visible:ring-[#1877F2]/40',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
        <path d="M13 22v-8h2.6l.4-3h-3V8.5c0-.9.3-1.5 1.5-1.5H16V4.2c-.3 0-1.2-.1-2.3-.1-2.3 0-3.7 1.4-3.7 3.9V11H7v3h3v8z" />
      </svg>
    ),
  },
};

export default function SocialAuthButton({ provider, label, onClick, disabled = false }) {
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
    >
      {style.icon}
      <span>{label || style.label}</span>
    </button>
  );
}

export const SOCIAL_PROVIDERS = Object.keys(PROVIDER_STYLES);

SocialAuthButton.propTypes = {
  provider: PropTypes.oneOf(SOCIAL_PROVIDERS).isRequired,
  label: PropTypes.string,
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
};
