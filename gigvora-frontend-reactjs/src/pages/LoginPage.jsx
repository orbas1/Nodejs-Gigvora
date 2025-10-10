import { useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactor, setTwoFactor] = useState('');
  const [step, setStep] = useState('credentials');

  const handleSubmit = (event) => {
    event.preventDefault();
    setStep('twofactor');
  };

  const handleVerify = (event) => {
    event.preventDefault();
    alert('2FA verified. Redirecting to dashboard.');
  };

  return (
    <section className="relative overflow-hidden py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,245,201,0.1),_transparent_60%)]" aria-hidden="true" />
      <div className="absolute -bottom-32 right-10 h-72 w-72 rounded-full bg-accent/10 blur-3xl" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl px-6">
        <PageHeader
          eyebrow="Sign in"
          title="Welcome back to Gigvora"
          description="Reconnect with your network, pick up where you left off on projects, and discover fresh opportunities tailored to you."
        />
        <div className="grid gap-12 lg:grid-cols-[1.1fr,0.9fr] lg:items-start">
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-accent/10">
              {step === 'credentials' ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-white">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="w-full rounded-2xl border border-white/15 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/40"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium text-white">
                      Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="w-full rounded-2xl border border-white/15 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/40"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <button type="submit" className="w-full rounded-full bg-accent px-6 py-3 text-sm font-semibold text-slate-950 shadow-md shadow-accent/30 transition hover:shadow-accent/50">
                    Request 2FA code
                  </button>
                  <p className="text-xs text-white/50">We’ll email a one-time code and support authenticator apps soon.</p>
                </form>
              ) : (
                <form onSubmit={handleVerify} className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="code" className="text-sm font-medium text-white">
                      Enter 6-digit code
                    </label>
                    <input
                      id="code"
                      value={twoFactor}
                      onChange={(event) => setTwoFactor(event.target.value)}
                      className="w-full rounded-2xl border border-white/15 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/40"
                      placeholder="123456"
                      required
                    />
                  </div>
                  <button type="submit" className="w-full rounded-full bg-accent px-6 py-3 text-sm font-semibold text-slate-950 shadow-md shadow-accent/30 transition hover:shadow-accent/50">
                    Verify &amp; sign in
                  </button>
                  <p className="text-xs text-white/50 text-center">Google Authenticator support is on the roadmap.</p>
                </form>
              )}
            </div>
          </div>
          <div className="space-y-6 rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-900 to-slate-950 p-8">
            <h2 className="text-xl font-semibold text-white">Security-first authentication</h2>
            <ul className="space-y-4 text-sm text-white/70">
              <li className="flex gap-3">
                <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
                <span>Email + password with layered device fingerprinting and anomaly detection.</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
                <span>2FA via secure email codes today, authenticator apps and passkeys next.</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
                <span>Seamless transitions between desktop and the Flutter mobile experience.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
