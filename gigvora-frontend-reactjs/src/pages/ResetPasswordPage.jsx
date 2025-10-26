import { useSearchParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import PasswordReset from '../components/access/PasswordReset.jsx';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  return (
    <section className="relative overflow-hidden py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(191,219,254,0.35),_transparent_65%)]" aria-hidden="true" />
      <div className="absolute -bottom-28 left-12 h-72 w-72 rounded-full bg-accent/20 blur-3xl" aria-hidden="true" />
      <div className="relative mx-auto max-w-5xl px-6">
        <PageHeader
          eyebrow="Secure your account"
          title="Set a fresh password"
          description="We\'ll walk you through creating a new password, closing out active sessions, and getting you back to work without missing a beat."
        />
        <div className="mt-10 grid gap-10 lg:grid-cols-[1.1fr,0.9fr] lg:items-start">
          <PasswordReset token={token} />
          <aside className="space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Best practices while you reset</h2>
            <ul className="space-y-4 text-sm text-slate-600">
              <li className="flex gap-3">
                <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
                <span>Finish the reset on a trusted device and browser, then sign back in using the new password.</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
                <span>Update your password manager so future sign-ins stay seamless across desktop and mobile.</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
                <span>Enable two-factor authentication from your security settings once you\'re back inside Gigvora.</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
                <span>If this wasn\'t you, contact security@gigvora.com so we can audit activity and protect your workspace.</span>
              </li>
            </ul>
          </aside>
        </div>
      </div>
    </section>
  );
}
