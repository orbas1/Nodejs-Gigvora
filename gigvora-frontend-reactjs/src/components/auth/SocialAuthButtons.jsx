import PropTypes from 'prop-types';
import { GoogleLogin } from '@react-oauth/google';
import SocialAuthButton, { SOCIAL_PROVIDERS } from '../SocialAuthButton.jsx';

const DEFAULT_TITLE = 'Use a trusted network';
const DEFAULT_DESCRIPTION =
  'Gigvora partners with enterprise identity providers so you can sign in without sharing your password. Choose a network below to continue securely.';
const DEFAULT_FOOTNOTE =
  'OAuth hand-offs complete in a separate, encrypted window. We never post to your account or see your social credentials.';

export default function SocialAuthButtons({
  providers = SOCIAL_PROVIDERS,
  onProviderSelect = () => {},
  busy = false,
  googleLogin,
  className = '',
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  footnote = DEFAULT_FOOTNOTE,
  analyticsId,
}) {
  const containerClass =
    'space-y-6 rounded-3xl border border-slate-200/80 bg-white/80 p-8 shadow-soft backdrop-blur-sm transition-colors';
  const gridProviders = Array.isArray(providers) ? providers.filter(Boolean) : SOCIAL_PROVIDERS;
  const showGoogle = Boolean(googleLogin);

  const googleUnavailableLabel = googleLogin?.unavailableLabel ?? 'Google sign-in unavailable';
  const googleButtonShape = googleLogin?.shape ?? 'pill';
  const googleButtonText = googleLogin?.text ?? 'continue_with';

  return (
    <section
      className={`${containerClass}${className ? ` ${className}` : ''}`}
      aria-labelledby={analyticsId ? `${analyticsId}-title` : undefined}
      data-analytics-id={analyticsId}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Social sign-in</p>
          <h2 id={analyticsId ? `${analyticsId}-title` : undefined} className="text-lg font-semibold text-slate-900">
            {title}
          </h2>
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        </div>
        <div className="flex items-center gap-2 self-start rounded-full border border-emerald-200 bg-emerald-50/70 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-emerald-600 shadow-sm">
          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" aria-hidden="true" />
          Verified OAuth
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {gridProviders.map((provider) => (
          <SocialAuthButton
            key={provider}
            provider={provider}
            onClick={() => onProviderSelect(provider)}
            disabled={busy}
          />
        ))}
        {showGoogle ? (
          <div className="sm:col-span-2">
            {googleLogin.enabled ? (
              <GoogleLogin
                onSuccess={googleLogin.onSuccess}
                onError={googleLogin.onError}
                useOneTap={googleLogin.useOneTap ?? false}
                width={googleLogin.width ?? '100%'}
                text={googleButtonText}
                shape={googleButtonShape}
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
        ) : null}
      </div>
      {footnote ? <p className="text-center text-xs text-slate-500">{footnote}</p> : null}
    </section>
  );
}

SocialAuthButtons.propTypes = {
  providers: PropTypes.arrayOf(PropTypes.oneOf(SOCIAL_PROVIDERS)),
  onProviderSelect: PropTypes.func,
  busy: PropTypes.bool,
  googleLogin: PropTypes.shape({
    enabled: PropTypes.bool,
    onSuccess: PropTypes.func,
    onError: PropTypes.func,
    useOneTap: PropTypes.bool,
    width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    text: PropTypes.oneOf(['signin_with', 'signup_with', 'continue_with']),
    shape: PropTypes.oneOf(['rectangular', 'pill', 'circle', 'square']),
    unavailableLabel: PropTypes.string,
  }),
  className: PropTypes.string,
  title: PropTypes.string,
  description: PropTypes.string,
  footnote: PropTypes.string,
  analyticsId: PropTypes.string,
};
