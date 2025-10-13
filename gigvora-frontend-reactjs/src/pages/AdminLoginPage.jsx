import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LOGO_URL } from '../constants/branding.js';
import useSession from '../hooks/useSession.js';
import { adminLogin, verifyTwoFactor } from '../services/auth.js';
import { apiClient } from '../services/apiClient.js';

const STEP = {
  credentials: 'credentials',
  verification: 'verification',
  success: 'success',
};

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState(STEP.credentials);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const navigate = useNavigate();
  const { login, session } = useSession();

  useEffect(() => {
    if (session?.memberships?.includes('admin')) {
      navigate('/dashboard/admin');
    }
  }, [session?.memberships, navigate]);

  const handleCredentialsSubmit = async (event) => {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    setStatusMessage('');
    try {
      await adminLogin({ email: email.trim(), password });
      setStep(STEP.verification);
      setStatusMessage('A one-time security code has been dispatched to your verified channel.');
    } catch (err) {
      if (err?.status === 403) {
        setError('This account is not authorised for admin access. Contact the platform team.');
      } else if (err?.status === 401) {
        setError('Invalid credentials. Double-check your email and password.');
      } else {
        setError(err?.message || 'Unable to initiate secure login right now.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationSubmit = async (event) => {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    setStatusMessage('');
    try {
      const response = await verifyTwoFactor({ email: email.trim(), code: code.trim() });
      const accessToken = response?.accessToken;
      const refreshToken = response?.refreshToken;
      const user = response?.user ?? {};
      if (accessToken) {
        apiClient.setAuthToken(accessToken);
      }
      login({
        name: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || 'Admin',
        title: 'Platform Administrator',
        avatarSeed: user.firstName || user.email || 'Admin',
        email: user.email,
        userId: user.id,
        memberships: ['admin'],
        roles: ['admin'],
        primaryDashboard: 'admin',
        organisations: user.organisations ?? [],
        followers: 0,
        connections: 0,
        agencies: [],
        companies: [],
        lastAuthenticatedAt: new Date().toISOString(),
        accessToken,
        refreshToken,
        isAuthenticated: true,
      });
      setStatusMessage('Authentication complete. Redirecting to the admin control tower…');
      setStep(STEP.success);
      setTimeout(() => navigate('/dashboard/admin'), 600);
    } catch (err) {
      if (err?.status === 401) {
        setError('Invalid or expired verification code. Request a new one if needed.');
      } else {
        setError(err?.message || 'Unable to verify the security code. Try again shortly.');
      }
    } finally {
      setLoading(false);
    }
  };

  const isVerificationStep = step === STEP.verification || step === STEP.success;

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-white via-surfaceMuted to-blue-50 px-6 py-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(191,219,254,0.45),_transparent_65%)]" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-20 right-10 h-72 w-72 rounded-full bg-accent/25 blur-3xl" aria-hidden="true" />
      <div className="relative z-10 flex w-full max-w-4xl flex-col gap-12 lg:flex-row lg:items-start">
        <div className="flex-1 space-y-6">
          <Link to="/" className="inline-flex items-center gap-3 text-sm text-slate-500 transition hover:text-accent">
            <span aria-hidden="true">←</span> Back to Gigvora
          </Link>
          <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-soft">
            <div className="mb-8 flex flex-col items-center gap-3 text-center">
              <img src={LOGO_URL} alt="Gigvora" className="h-12" />
              <h1 className="text-3xl font-semibold text-slate-900">Admin Console</h1>
              <p className="text-sm text-slate-600">
                Secure multi-factor access for Gigvora operations, compliance, and trust &amp; safety teams.
              </p>
            </div>
            <div className="space-y-5 text-left">
              {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
              ) : null}
              {statusMessage ? (
                <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">{statusMessage}</div>
              ) : null}
              {step === STEP.credentials ? (
                <form onSubmit={handleCredentialsSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <label htmlFor="adminEmail" className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">
                      Admin email
                    </label>
                    <input
                      id="adminEmail"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                      placeholder="ops@gigvora.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="adminPassword" className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">
                      Password
                    </label>
                    <input
                      id="adminPassword"
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark disabled:cursor-not-allowed disabled:bg-accent/60"
                    disabled={loading}
                  >
                    {loading ? 'Securing…' : 'Continue to 2FA'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerificationSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <label htmlFor="verificationCode" className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">
                      Enter security code
                    </label>
                    <input
                      id="verificationCode"
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      value={code}
                      onChange={(event) => setCode(event.target.value.replace(/[^0-9]/g, ''))}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                      placeholder="123456"
                      maxLength={6}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark disabled:cursor-not-allowed disabled:bg-accent/60"
                    disabled={loading || code.length !== 6}
                  >
                    {loading ? 'Verifying…' : 'Verify & access admin panel'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (loading) return;
                      setStep(STEP.credentials);
                      setCode('');
                      setStatusMessage('Re-enter your credentials to request a fresh code.');
                    }}
                    className="w-full rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
                  >
                    Start over
                  </button>
                </form>
              )}
            </div>
            <p className="mt-8 text-center text-xs text-slate-500">
              Having trouble? Ping the platform team at <span className="text-slate-700">ops@gigvora.com</span>.
            </p>
          </div>
        </div>
        <aside className="flex-1 space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Operational controls</h2>
          <ul className="space-y-4 text-sm text-slate-600">
            <li className="flex gap-3">
              <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-accent" aria-hidden="true" />
              <span>Monitor live feed health, moderation queues, and trust &amp; safety flags.</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-accent" aria-hidden="true" />
              <span>Approve launchpad cohorts, spotlight gigs, and manage global announcements.</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-accent" aria-hidden="true" />
              <span>Review analytics dashboards tailored for leadership visibility.</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-accent" aria-hidden="true" />
              <span>Zero-trust enforced: hardware fingerprinting and anomaly detection guard every session.</span>
            </li>
          </ul>
          {isVerificationStep ? (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
              Stay on this trusted device while completing verification. For emergency break-glass access, escalate via
              security@Gigvora.
            </div>
          ) : null}
        </aside>
      </div>
    </section>
  );
}
