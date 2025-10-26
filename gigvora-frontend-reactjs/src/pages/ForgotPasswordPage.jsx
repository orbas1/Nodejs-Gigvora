import PageHeader from '../components/PageHeader.jsx';
import PasswordReset from '../components/authentication/PasswordReset.jsx';

export default function ForgotPasswordPage() {
  return (
    <section className="relative overflow-hidden py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(191,219,254,0.35),_transparent_65%)]" aria-hidden="true" />
      <div className="absolute -bottom-24 left-12 h-72 w-72 rounded-full bg-accent/20 blur-3xl" aria-hidden="true" />
      <div className="relative mx-auto max-w-4xl px-6">
        <PageHeader
          eyebrow="Reset your password"
          title="We'll help you get back in"
          description="Enter the email linked to your Gigvora account and we'll send instructions to create a new password."
        />
        <div className="mt-10 grid gap-10 lg:grid-cols-[1.1fr,0.9fr] lg:items-start">
          <PasswordReset />
          <aside className="space-y-5 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">What happens next?</h2>
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="flex gap-3">
                <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
                <span>Look for a message from security@gigvora.com with a secure one-time link.</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
                <span>Follow the instructions within 30 minutes to set a new password and re-enable two-factor authentication.</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
                <span>Can’t find the email? Check your spam folder or contact support for direct assistance.</span>
              </li>
            </ul>
            <div className="rounded-2xl border border-slate-200 bg-surfaceMuted p-5 text-sm text-slate-600">
              <p className="font-semibold text-slate-900">Stay protected</p>
              <p className="text-xs text-slate-500">
                Reset links are valid for a short time to keep your account safe. Request a fresh link anytime the countdown completes.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
