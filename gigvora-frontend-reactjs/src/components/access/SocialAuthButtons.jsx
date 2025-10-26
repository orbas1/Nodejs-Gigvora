import PropTypes from 'prop-types';
import { GoogleLogin } from '@react-oauth/google';
import SocialAuthButton, { SOCIAL_PROVIDERS } from '../SocialAuthButton.jsx';

const PROVIDER_BADGES = {
  linkedin: {
    badge: 'Recommended',
    description: 'Import your professional identity, badges, and connections in seconds.',
  },
};

const INSIGHTS = [
  {
    id: 'secure-handoff',
    title: 'Secure hand-off',
    description: 'Encrypted redirects, state tokens, and device reputation protect every social sign-in.',
  },
  {
    id: 'continuity',
    title: 'Workspace continuity',
    description: 'We hydrate dashboards, saved jobs, and mentor queues the moment the callback resolves.',
  },
  {
    id: 'governance',
    title: 'Governed access',
    description: 'Analytics log the identity provider, device, and consent so compliance stays audit-ready.',
  },
];

export default function SocialAuthButtons({
  className,
  status = 'idle',
  onProviderSelect,
  onGoogleSuccess,
  onGoogleError,
  googleEnabled = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID),
  heading = 'Continue with your network',
  subheading = 'Choose a connected profile to keep your momentum.',
  layout = 'stack',
  showDivider = true,
  disabled = false,
  showInsights = true,
  showSso = Boolean(import.meta.env.VITE_ENTERPRISE_SSO_URL),
  onSso,
  ssoLabel,
  ssoDescription,
}) {
  const busy = status && status !== 'idle';
  const combinedDisabled = disabled || busy;
  const googleUnavailableLabel = busy ? 'Complete your current action first' : 'Google sign in unavailable';
  const enterpriseSsoUrl = import.meta.env.VITE_ENTERPRISE_SSO_URL;
  const resolvedSsoLabel = ssoLabel || 'Use enterprise SSO';
  const resolvedSsoDescription =
    ssoDescription || 'Sign in with your company identity provider (SAML & OpenID Connect supported).';

  const handleProviderClick = (provider) => {
    if (combinedDisabled) {
      return;
    }
    onProviderSelect?.(provider);
  };

  const handleSsoClick = () => {
    if (!showSso || combinedDisabled) {
      return;
    }
    if (typeof onSso === 'function') {
      onSso();
      return;
    }
    if (enterpriseSsoUrl) {
      window.location.href = enterpriseSsoUrl;
    }
  };

  return (
    <div
      className={`space-y-4 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-soft backdrop-blur ${className ?? ''}`}
    >
      <div className="space-y-2 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">{heading}</p>
        <h3 className="text-lg font-semibold text-slate-900">Link your trusted identity</h3>
        <p className="text-sm text-slate-500">{subheading}</p>
      </div>
      {showDivider ? (
        <div className="relative py-2 text-center text-[10px] uppercase tracking-[0.4em] text-slate-300">
          <span className="relative z-10 bg-white px-3">or</span>
          <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-slate-200" aria-hidden="true" />
        </div>
      ) : null}
      <div className={layout === 'grid' ? 'grid gap-3 sm:grid-cols-2' : 'space-y-3'}>
        {SOCIAL_PROVIDERS.map((provider) => (
          <SocialAuthButton
            key={provider}
            provider={provider}
            onClick={() => handleProviderClick(provider)}
            disabled={combinedDisabled}
            badge={PROVIDER_BADGES[provider]?.badge}
            description={PROVIDER_BADGES[provider]?.description}
          />
        ))}
        <div className="w-full">
          {googleEnabled ? (
            <GoogleLogin
              onSuccess={onGoogleSuccess}
              onError={onGoogleError}
              useOneTap={false}
              width="100%"
              text="continue_with"
              shape="pill"
            />
          ) : (
            <button
              type="button"
              disabled
              className="w-full rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-400"
            >
              {googleUnavailableLabel}
            </button>
          )}
        </div>
        {showSso ? (
          <button
            type="button"
            onClick={handleSsoClick}
            disabled={combinedDisabled}
            className="flex w-full flex-col items-start gap-1 rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50 px-5 py-4 text-left text-sm font-semibold text-slate-800 transition hover:border-accent/40 hover:text-accent disabled:cursor-not-allowed disabled:opacity-70"
          >
            <span className="inline-flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-accent/15 text-xs font-semibold text-accent">
                SSO
              </span>
              {resolvedSsoLabel}
            </span>
            <span className="text-[11px] font-medium text-slate-500">{resolvedSsoDescription}</span>
          </button>
        ) : null}
      </div>
      {showInsights ? (
        <dl className="grid gap-3 rounded-2xl border border-slate-200 bg-surfaceMuted/60 p-4 text-left sm:grid-cols-3">
          {INSIGHTS.map((insight) => (
            <div key={insight.id} className="space-y-1">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{insight.title}</dt>
              <dd className="text-[11px] text-slate-500">{insight.description}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {busy ? (
        <p className="text-center text-[11px] font-semibold text-slate-400" role="status" aria-live="polite">
          Completing your previous request…
        </p>
      ) : null}
    </div>
  );
}

SocialAuthButtons.propTypes = {
  className: PropTypes.string,
  status: PropTypes.string,
  onProviderSelect: PropTypes.func,
  onGoogleSuccess: PropTypes.func,
  onGoogleError: PropTypes.func,
  googleEnabled: PropTypes.bool,
  heading: PropTypes.string,
  subheading: PropTypes.string,
  layout: PropTypes.oneOf(['stack', 'grid']),
  showDivider: PropTypes.bool,
  disabled: PropTypes.bool,
  showInsights: PropTypes.bool,
  showSso: PropTypes.bool,
  onSso: PropTypes.func,
  ssoLabel: PropTypes.string,
  ssoDescription: PropTypes.string,
};
