import { useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import { requestPasswordReset } from '../services/auth.js';
import apiClient from '../services/apiClient.js';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (status !== 'idle') {
      return;
    }

    setStatus('submitting');
    setError(null);
    setSuccess(null);
    try {
      await requestPasswordReset(email.trim());
      setSuccess('Check your inbox for the reset link. It may take a couple of minutes to arrive.');
      setEmail('');
    } catch (submissionError) {
      if (submissionError instanceof apiClient.ApiError) {
        setError(submissionError.body?.message || submissionError.message);
      } else {
        setError(submissionError.message || 'We were unable to send a reset email. Please try again.');
      }
    } finally {
      setStatus('idle');
    }
  };

  return (
    <section className="relative overflow-hidden py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(226,232,240,0.6),_transparent_70%)]" aria-hidden="true" />
      <div className="absolute -left-20 top-1/3 h-64 w-64 rounded-full bg-accent/10 blur-3xl" aria-hidden="true" />
      <div className="relative mx-auto max-w-4xl px-6">
        <PageHeader
          eyebrow="Reset password"
          title="We&apos;ll help you get back into Gigvora"
          description="Enter the email associated with your account and we&apos;ll send a secure link to create a new password."
        />
        <div className="mt-10 grid gap-10 lg:grid-cols-[1.15fr,0.85fr] lg:items-start">
          <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-slate-200 bg-white p-10 shadow-soft" noValidate>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-slate-700">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                placeholder="you@example.com"
                required
              />
              <p className="text-xs text-slate-500">
                We&apos;ll send a secure link that stays active for 30 minutes. If you don&apos;t see it, check your spam folder or contact support.
              </p>
            </div>
            {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p> : null}
            {success ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-600">{success}</p> : null}
            <button
              type="submit"
              className="w-full rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark disabled:cursor-not-allowed disabled:bg-accent/60"
              disabled={status !== 'idle'}
            >
              {status === 'submitting' ? 'Sending reset link…' : 'Send reset link'}
            </button>
          </form>
          <aside className="space-y-5 rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
            <h2 className="text-lg font-semibold text-slate-900">Protect your account</h2>
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="flex gap-3">
                <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
                <span>Once you reset your password, consider enabling two-factor authentication from Settings &gt; Security.</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
                <span>Use a unique password with at least 12 characters to guard your hiring and payments data.</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
                <span>If you can&apos;t access your email, reach out to <a href="mailto:support@gigvora.com" className="font-semibold text-accent hover:text-accentDark">support@gigvora.com</a>.</span>
              </li>
            </ul>
          </aside>
        </div>
      </div>
    </section>
  );
}
