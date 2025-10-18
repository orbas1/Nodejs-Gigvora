import { Switch } from '@headlessui/react';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function HomepageAnnouncementForm({ value, onChange, disabled }) {
  const announcement = value ?? {};

  const handleInput = (field) => (event) => {
    if (typeof onChange !== 'function') return;
    onChange({
      ...announcement,
      [field]: event.target.value,
    });
  };

  const handleToggle = (enabled) => {
    if (typeof onChange !== 'function') return;
    onChange({
      ...announcement,
      enabled,
    });
  };

  return (
    <section id="admin-homepage-announcement" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Announcement bar</h2>
          <p className="mt-1 text-sm text-slate-600">
            Configure the slim banner that surfaces launch updates and critical notices on the public homepage.
          </p>
        </div>
        <Switch
          checked={Boolean(announcement.enabled)}
          onChange={handleToggle}
          disabled={disabled}
          className={classNames(
            Boolean(announcement.enabled) ? 'bg-accent' : 'bg-slate-200',
            'relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border border-transparent transition focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          )}
        >
          <span className="sr-only">Toggle announcement bar</span>
          <span
            aria-hidden="true"
            className={classNames(
              Boolean(announcement.enabled) ? 'translate-x-7' : 'translate-x-1',
              'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition',
            )}
          />
        </Switch>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="announcement-message" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Message
          </label>
          <input
            id="announcement-message"
            type="text"
            value={announcement.message ?? ''}
            onChange={handleInput('message')}
            disabled={disabled}
            placeholder="Launchpad now supports milestone escrows"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-50"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="announcement-cta-label" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            CTA label
          </label>
          <input
            id="announcement-cta-label"
            type="text"
            value={announcement.ctaLabel ?? ''}
            onChange={handleInput('ctaLabel')}
            disabled={disabled}
            placeholder="View release notes"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-50"
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label htmlFor="announcement-cta-href" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            CTA link
          </label>
          <input
            id="announcement-cta-href"
            type="text"
            value={announcement.ctaHref ?? ''}
            onChange={handleInput('ctaHref')}
            disabled={disabled}
            placeholder="/blog/platform-updates"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-50"
          />
        </div>
      </div>
    </section>
  );
}
