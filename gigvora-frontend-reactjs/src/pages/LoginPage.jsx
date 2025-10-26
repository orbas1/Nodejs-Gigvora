import PageHeader from '../components/PageHeader.jsx';
import SignInForm from '../components/access/SignInForm.jsx';

export default function LoginPage() {
  return (
    <section className="relative overflow-hidden py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(191,219,254,0.35),_transparent_65%)]" aria-hidden="true" />
      <div className="absolute -bottom-32 right-10 h-72 w-72 rounded-full bg-accent/20 blur-3xl" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl px-6">
        <PageHeader
          eyebrow="Sign in"
          title="Welcome back to Gigvora"
          description="Reconnect with your network, pick up where you left off on projects, and discover fresh opportunities tailored to you."
        />
        <div className="grid gap-12 lg:grid-cols-[1.1fr,0.9fr] lg:items-start">
          <div className="space-y-6">
            <SignInForm />
          </div>
          <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Pick up right where you left off</h2>
            <ul className="space-y-4 text-sm text-slate-600">
              <li className="flex gap-3">
                <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
                <span>Stay connected across gigs, jobs, and projects with a single secure account.</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
                <span>Switch between freelancer, agency, and company dashboards after you add each role.</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
                <span>Use your favourite social network to get started in seconds, then tailor your profile.</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
                <span>Need a hand? Our support team is on standby for onboarding and account help.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
