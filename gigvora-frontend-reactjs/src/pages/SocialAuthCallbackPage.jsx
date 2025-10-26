import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import FormStatusMessage from '../components/forms/FormStatusMessage.jsx';
import { consumeOAuthState, resolveLanding } from '../utils/authHelpers.js';
import { loginWithLinkedIn } from '../services/auth.js';
import apiClient from '../services/apiClient.js';
import { useSession } from '../context/SessionContext.jsx';

const PROVIDER_LABELS = {
  linkedin: 'LinkedIn',
};

export default function SocialAuthCallbackPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useSession();
  const [status, setStatus] = useState('initial');
  const [message, setMessage] = useState('Completing secure sign-in…');
  const [messageType, setMessageType] = useState('info');
  const [providerLabel, setProviderLabel] = useState('social network');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const error = params.get('error');
    const description = params.get('error_description');
    const state = params.get('state');
    const code = params.get('code');

    if (error) {
      setStatus('error');
      setMessageType('error');
      if (error === 'access_denied') {
        setMessage('The social sign-in request was denied. You can start again from the login page.');
      } else if (description) {
        setMessage(`Unable to complete social sign-in: ${description}.`);
      } else {
        setMessage('Unable to complete social sign-in. Start again to continue.');
      }
      return;
    }

    if (!state) {
      setStatus('error');
      setMessageType('error');
      setMessage('Missing authentication state. Start the sign-in flow again to continue.');
      return;
    }

    const record = consumeOAuthState(state);
    if (!record) {
      setStatus('error');
      setMessageType('error');
      setMessage('The authentication request expired or was already processed. Start again to continue.');
      return;
    }

    const provider = record.provider;
    const friendlyName = PROVIDER_LABELS[provider] ?? 'social network';
    setProviderLabel(friendlyName);

    if (provider !== 'linkedin') {
      setStatus('error');
      setMessageType('error');
      setMessage('Unsupported social sign-in provider. Please try again.');
      return;
    }

    if (!code) {
      setStatus('error');
      setMessageType('error');
      setMessage('LinkedIn did not return an authorization code. Start the sign-in flow again.');
      return;
    }

    setStatus('exchanging');
    setMessage(`Verifying your ${friendlyName} credentials…`);
    setMessageType('info');

    loginWithLinkedIn({ authorizationCode: code, redirectUri: record.redirectUri })
      .then((response) => {
        const sessionState = login(response.session);
        setStatus('complete');
        setMessage(`Signed in with ${friendlyName}. Redirecting you now…`);
        setTimeout(() => {
          navigate(resolveLanding(sessionState), { replace: true });
        }, 350);
      })
      .catch((errorCause) => {
        setStatus('error');
        setMessageType('error');
        if (errorCause instanceof apiClient.ApiError) {
          setMessage(errorCause.body?.message || errorCause.message || 'LinkedIn sign-in failed.');
        } else {
          setMessage(errorCause.message || 'LinkedIn sign-in failed.');
        }
      });
  }, [location.search, login, navigate]);

  const showRetry = status === 'error';

  return (
    <section className="relative overflow-hidden py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(191,219,254,0.35),_transparent_65%)]" aria-hidden="true" />
      <div className="absolute -bottom-32 right-10 h-72 w-72 rounded-full bg-accent/20 blur-3xl" aria-hidden="true" />
      <div className="relative mx-auto max-w-3xl px-6">
        <PageHeader
          eyebrow="Secure sign-in"
          title={`Completing your ${providerLabel} sign-in`}
          description="We&apos;re finalising authentication and preparing your workspace."
        />
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
          <FormStatusMessage type={messageType} message={message} />
          {status === 'exchanging' ? (
            <p className="mt-6 text-sm text-slate-600">
              This usually takes just a moment. Feel free to keep this tab open while we finish setting things up.
            </p>
          ) : null}
          {showRetry ? (
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => navigate('/login', { replace: true })}
                className="inline-flex w-full items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accentDark sm:w-auto"
              >
                Return to sign-in
              </button>
              <button
                type="button"
                onClick={() => navigate('/register', { replace: true })}
                className="inline-flex w-full items-center justify-center rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-accent hover:text-accent sm:w-auto"
              >
                Create a new account
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
