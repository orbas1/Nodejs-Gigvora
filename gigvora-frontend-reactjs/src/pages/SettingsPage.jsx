import PageHeader from '../components/PageHeader.jsx';

export default function SettingsPage() {
  return (
    <section className="relative overflow-hidden py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(191,219,254,0.35),_transparent_65%)]" aria-hidden="true" />
      <div className="absolute -right-16 bottom-8 h-64 w-64 rounded-full bg-accent/10 blur-[120px]" aria-hidden="true" />
      <div className="relative mx-auto max-w-5xl px-6">
        <PageHeader
          eyebrow="Workspace"
          title="Account settings"
          description="Manage notifications, security, and connected organisations for your Gigvora workspace."
        />
        <div className="mt-10 space-y-6 rounded-3xl border border-slate-200 bg-white/95 p-8 text-sm text-slate-700 shadow-soft">
          <p>
            Settings are being consolidated so your preferences follow you across dashboards. Update multi-factor authentication, notification delivery, and trust centre preferences here while we finalise the dedicated settings centre.
          </p>
          <ul className="grid gap-3 md:grid-cols-2">
            <li className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-sm font-semibold text-slate-800">Security</p>
              <p className="mt-1 text-xs text-slate-500">Manage passwords, passkeys, and device approvals.</p>
            </li>
            <li className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-sm font-semibold text-slate-800">Notifications</p>
              <p className="mt-1 text-xs text-slate-500">Control inbox alerts, Explorer digests, and trust events.</p>
            </li>
            <li className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-sm font-semibold text-slate-800">Workspace access</p>
              <p className="mt-1 text-xs text-slate-500">Invite colleagues, agencies, or headhunters securely.</p>
            </li>
            <li className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-sm font-semibold text-slate-800">Privacy controls</p>
              <p className="mt-1 text-xs text-slate-500">Synchronise cookie and data retention preferences.</p>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
