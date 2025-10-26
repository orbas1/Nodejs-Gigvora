import PropTypes from 'prop-types';
import clsx from 'clsx';
import { GoogleLogin } from '@react-oauth/google';
import SocialAuthButton, { SOCIAL_PROVIDERS } from '../SocialAuthButton.jsx';

const PROVIDER_LABELS = {
  linkedin: 'LinkedIn',
};

export default function SocialAuthButtons({
  intent = 'login',
  status = 'idle',
  onProviderRedirect,
  onGoogleSuccess,
  onGoogleError,
  googleEnabled = false,
  helperText,
  secondaryText,
  className,
}) {
  const busy = status !== 'idle';

  return (
    <div className={clsx('space-y-3', className)}>
      <div className="grid gap-3">
        {SOCIAL_PROVIDERS.map((provider) => (
          <SocialAuthButton
            key={provider}
            provider={provider}
            label={`${intent === 'register' ? 'Sign up' : 'Continue'} with ${PROVIDER_LABELS[provider] ?? provider}`}
            onClick={() => {
              if (busy) {
                return;
              }
              onProviderRedirect?.(provider);
            }}
            disabled={busy}
          />
        ))}
        <div className={clsx('w-full', busy && 'pointer-events-none opacity-70')}>
          {googleEnabled ? (
            <GoogleLogin
              onSuccess={onGoogleSuccess}
              onError={onGoogleError}
              useOneTap={false}
              width="100%"
              text={intent === 'register' ? 'signup_with' : 'continue_with'}
              shape="pill"
            />
          ) : (
            <button
              type="button"
              disabled
              className="w-full rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-400"
            >
              Google {intent === 'register' ? 'sign up' : 'sign in'} unavailable
            </button>
          )}
        </div>
      </div>
      {helperText ? (
        <p className="text-center text-xs text-slate-500">{helperText}</p>
      ) : null}
      {secondaryText ? (
        <p className="text-center text-[11px] text-slate-400">{secondaryText}</p>
      ) : null}
    </div>
  );
}

SocialAuthButtons.propTypes = {
  intent: PropTypes.oneOf(['login', 'register']).isRequired,
  status: PropTypes.string,
  onProviderRedirect: PropTypes.func,
  onGoogleSuccess: PropTypes.func,
  onGoogleError: PropTypes.func,
  googleEnabled: PropTypes.bool,
  helperText: PropTypes.string,
  secondaryText: PropTypes.string,
  className: PropTypes.string,
};
