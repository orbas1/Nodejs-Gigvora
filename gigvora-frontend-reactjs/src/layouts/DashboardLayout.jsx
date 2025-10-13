import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  CheckBadgeIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  Squares2X2Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { DASHBOARD_LINKS } from '../constants/dashboardLinks.js';

function slugify(value) {
  return value
    ?.toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') ?? '';
}

export default function DashboardLayout({
  currentDashboard,
  title,
  subtitle,
  description,
  menuSections,
  sections,
  profile,
  availableDashboards,
  children,
  onMenuItemSelect,
  selectedMenuItemKey,
}) {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const navigationSections = Array.isArray(menuSections) ? menuSections : [];
  const capabilitySections = Array.isArray(sections) ? sections : [];
  const heroTitle = title ?? 'Dashboard';
  const heroSubtitle = subtitle ?? 'Workspace overview';
  const heroDescription = description ?? '';

  const activeProfile = {
    name: 'Member',
    role: 'Gigvora User',
    initials: 'GV',
    status: 'Active subscription',
    badges: [],
    metrics: [],
    ...profile,
  };

  const memberships = Array.isArray(availableDashboards) && availableDashboards.length > 0
    ? availableDashboards
    : Object.keys(DASHBOARD_LINKS);

  const switchableDashboards = memberships.filter((key) => key !== currentDashboard && DASHBOARD_LINKS[key]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
  };

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(191,219,254,0.35),_transparent_65%)]" />
      <div className="relative z-10 flex min-h-screen">
        {/* Sidebar */}
        <aside
          className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} fixed inset-y-0 left-0 z-20 w-80 shrink-0 transform border-r border-slate-200 bg-white/95 backdrop-blur transition-transform duration-300 ease-in-out lg:static`}
        >
          <div className="flex h-full flex-col gap-6 overflow-y-auto p-6">
            <div className="flex items-center justify-between">
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-medium text-slate-600 shadow-sm transition hover:border-blue-300 hover:text-blue-600"
              >
                <ArrowLeftOnRectangleIcon className="h-4 w-4" />
                Return to site
              </Link>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
                aria-label="Close menu"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-lg font-semibold text-blue-700">
                  {activeProfile.initials}
                </div>
                <div>
                  <p className="text-sm uppercase tracking-wide text-slate-500">Profile</p>
                  <p className="text-lg font-semibold text-slate-900">{activeProfile.name}</p>
                  <p className="text-sm text-slate-500">{activeProfile.role}</p>
                </div>
              </div>
              {activeProfile.status ? (
                <p className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium uppercase tracking-wide text-blue-700">
                  {activeProfile.status}
                </p>
              ) : null}
              {activeProfile.badges?.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {activeProfile.badges.map((badge) => (
                    <span
                      key={badge}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs text-slate-600"
                    >
                      <CheckBadgeIcon className="h-4 w-4 text-blue-500" />
                      {badge}
                    </span>
                  ))}
                </div>
              ) : null}
              {activeProfile.metrics?.length ? (
                <dl className="mt-6 grid grid-cols-2 gap-3">
                  {activeProfile.metrics.map(({ label, value }) => (
                    <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
                      <dd className="mt-1 text-lg font-semibold text-slate-900">{value}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </div>

            <div className="space-y-6">
              {navigationSections.map((section) => (
                <div key={section.label}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{section.label}</p>
                  <ul className="mt-3 space-y-2">
                    {section.items.map((item) => {
                      const ItemComponent = item.href ? 'a' : 'div';
                      const itemProps = item.href
                        ? { href: item.href, className: 'group flex flex-col gap-1 rounded-2xl border border-transparent bg-slate-100/70 p-3 transition hover:border-blue-300 hover:bg-blue-50' }
                        : { className: 'group flex flex-col gap-1 rounded-2xl border border-transparent bg-slate-100/70 p-3 transition hover:border-blue-300 hover:bg-blue-50' };

                      return (
                        <li key={item.name}>
                          <ItemComponent {...itemProps}>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-slate-700">{item.name}</span>
                              <ChevronRightIcon className="h-4 w-4 text-slate-400 transition group-hover:text-blue-500" />
                            </div>
                            {item.description ? <p className="text-xs text-slate-500">{item.description}</p> : null}
                    {section.items.map((item) => (
                      <li key={item.name}>
                        {item.href ? (
                          <a
                            href={item.href}
                            className="group block rounded-2xl border border-transparent bg-slate-100/70 p-3 transition hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                        {(item.href ? 'a' : 'div') === 'a' ? (
                          <a
                            href={item.href}
                            className="group flex flex-col gap-1 rounded-2xl border border-transparent bg-slate-100/70 p-3 transition hover:border-blue-300 hover:bg-blue-50"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-slate-700">{item.name}</span>
                              <ChevronRightIcon className="h-4 w-4 text-slate-400 transition group-hover:text-blue-500" />
                            </div>
                            </div>
                    {section.items.map((item) => {
                      const content = (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-700">{item.name}</span>
                            <ChevronRightIcon className="h-4 w-4 text-slate-400 transition group-hover:text-blue-500" />
                          </div>
                          {item.description ? (
                            <p className="text-xs text-slate-500">{item.description}</p>
                          ) : null}
                          {item.tags?.length ? (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {item.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-blue-600"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </>
                      );

                      return (
                        <li key={item.name}>
                          {item.href ? (
                            <a
                              href={item.href}
                              onClick={() => setSidebarOpen(false)}
                              className="group flex flex-col gap-1 rounded-2xl border border-transparent bg-slate-100/70 p-3 transition hover:border-blue-300 hover:bg-blue-50"
                            >
                              {content}
                            </a>
                          ) : (
                            <div className="group flex flex-col gap-1 rounded-2xl border border-transparent bg-slate-100/70 p-3 transition hover:border-blue-300 hover:bg-blue-50">
                              {content}
                            </div>
                          )}
                        </li>
                      );
                    })}
                      const itemKey = item.key ?? item.slug ?? slugify(item.name);
                      const isActive = selectedMenuItemKey && itemKey === selectedMenuItemKey;
                      const isInteractive = typeof onMenuItemSelect === 'function';

                      const baseClasses =
                        'group flex w-full flex-col gap-1 rounded-2xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300';
                      const palette = isActive
                        ? 'border-blue-400 bg-blue-50 shadow-sm'
                        : 'border-transparent bg-slate-100/70 hover:border-blue-300 hover:bg-blue-50';
                      const textColor = isActive ? 'text-blue-700' : 'text-slate-700';

                      const handleClick = () => {
                        if (onMenuItemSelect) {
                          onMenuItemSelect({ key: itemKey, item, section });
                        }
                        if (item.sectionId) {
                          const target = document.getElementById(item.sectionId);
                          target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      };

                      const Container = isInteractive ? 'button' : 'div';

                      return (
                        <li key={itemKey}>
                          <Container
                            type={isInteractive ? 'button' : undefined}
                            onClick={isInteractive ? handleClick : undefined}
                            className={`${baseClasses} ${palette}`}
                            aria-pressed={isInteractive ? (isActive ? 'true' : 'false') : undefined}
                          >
                            <div className={`flex items-center justify-between ${textColor}`}>
                              <span className={`text-sm font-medium ${textColor}`}>{item.name}</span>
                              <ChevronRightIcon
                                className={`h-4 w-4 transition ${
                                  isActive ? 'text-blue-500' : 'text-slate-400 group-hover:text-blue-500'
                                }`}
                              />
                            </div>
                            {item.description ? (
                              <p className={`text-xs ${isActive ? 'text-blue-600/80' : 'text-slate-500'}`}>{item.description}</p>
                    {section.items.map((item) => (
                      <li key={item.name}>
                        {item.href ? (
                          <a
                            href={item.href}
                            className="group flex flex-col gap-1 rounded-2xl border border-transparent bg-slate-100/70 p-3 transition hover:border-blue-300 hover:bg-blue-50"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-slate-700">{item.name}</span>
                              <ChevronRightIcon className="h-4 w-4 text-slate-400 transition group-hover:text-blue-500" />
                            </div>
                            {item.description ? (
                              <p className="text-xs text-slate-500">{item.description}</p>
                            ) : null}
                            {item.tags?.length ? (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {item.tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                                      isActive ? 'bg-blue-100 text-blue-700' : 'bg-blue-50 text-blue-600'
                                    }`}
                                    className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-blue-600"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            ) : null}
                          </ItemComponent>
                        </li>
                      );
                    })}
                          </Container>
                        </li>
                      );
                    })}
                          </a>
                        ) : (
                          <div className="group flex flex-col gap-1 rounded-2xl border border-transparent bg-slate-100/70 p-3 transition hover:border-blue-300 hover:bg-blue-50">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-slate-700">{item.name}</span>
                              <ChevronRightIcon className="h-4 w-4 text-slate-400 transition group-hover:text-blue-500" />
                            </div>
                            {item.description ? (
                              <p className="text-xs text-slate-500">{item.description}</p>
                            ) : null}
                            {item.tags?.length ? (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {item.tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-blue-600"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-auto rounded-3xl border border-blue-100 bg-blue-50 p-5 text-blue-700">
              <div className="flex items-center gap-3">
                <Squares2X2Icon className="h-6 w-6 text-blue-500" />
                <div>
                  <p className="text-sm font-semibold">Workspace tips</p>
                  <p className="text-xs text-blue-600/80">
                    Use the search bar to query profiles, gigs, jobs, and project records across Gigvora.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex min-h-screen flex-1 flex-col lg:ml-80">
          <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
            <div className="flex flex-wrap items-center gap-3 px-4 py-4 sm:px-8">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2 text-slate-600 transition hover:border-blue-300 hover:text-blue-600 lg:hidden"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open menu"
              >
                <Bars3Icon className="h-5 w-5" />
              </button>

              <form
                onSubmit={handleSearchSubmit}
                className="relative flex-1 min-w-[240px] rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search the Gigvora database..."
                  className="w-full rounded-2xl border-0 bg-transparent py-3 pl-12 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </form>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Switch</span>
                <div className="relative">
                  <select
                    value={currentDashboard}
                    onChange={(event) => {
                      const target = event.target.value;
                      if (target !== currentDashboard && DASHBOARD_LINKS[target]) {
                        navigate(DASHBOARD_LINKS[target].path);
                      }
                    }}
                    className="appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-8 text-sm text-slate-700 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    {memberships
                      .filter((key) => DASHBOARD_LINKS[key])
                      .map((key) => (
                        <option key={key} value={key}>
                          {DASHBOARD_LINKS[key].label}
                        </option>
                      ))}
                  </select>
                  <ChevronRightIcon className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 bg-transparent">
            <div className="mx-auto w-full max-w-6xl space-y-10 px-4 py-10 sm:px-8">
              <div className="space-y-4">
                <p className="text-sm uppercase tracking-wide text-blue-600/90">{heroSubtitle}</p>
                <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">{heroTitle}</h1>
                <p className="max-w-3xl text-base text-slate-600">{heroDescription}</p>

                {switchableDashboards.length ? (
                  <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
                    <span className="font-medium text-slate-700">Your memberships:</span>
                    <div className="flex flex-wrap gap-2">
                      {memberships.map((key) =>
                        DASHBOARD_LINKS[key] ? (
                          <span
                            key={key}
                            className={`${
                              key === currentDashboard
                                ? 'bg-blue-50 text-blue-700 border-blue-300'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            } inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wide`}
                          >
                            {DASHBOARD_LINKS[key].label}
                          </span>
                        ) : null,
                      )}
                    </div>
                  </div>
                ) : null}
              </div>

              {children
                ? children
                : capabilitySections.map((section) => (
                    <section
                      key={section.title}
                      id={section.id}
                      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_-24px_rgba(30,64,175,0.35)] sm:p-8"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">{section.title}</h2>
                          {section.description ? (
                            <p className="mt-2 max-w-3xl text-sm text-slate-600">{section.description}</p>
                          ) : null}
                        </div>
                        {section.meta ? (
                          <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-medium uppercase tracking-wide text-blue-700">
                            {section.meta}
                          </div>
                        ) : null}
                      </div>
                      {typeof section.render === 'function' ? (
                        <div className="mt-6">{section.render(section)}</div>
                      ) : (
                        <div className="mt-6 grid gap-4 sm:grid-cols-2">
                          {(section.features ?? []).map((feature) => (
                            <div
                              key={feature.name}
                              className="group flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-blue-300 hover:bg-blue-50"
                            >
                              <div>
                                <h3 className="text-lg font-semibold text-slate-900">{feature.name}</h3>
                                {feature.description ? (
                                  <p className="mt-2 text-sm text-slate-600">{feature.description}</p>
                                ) : null}
                                {feature.bulletPoints?.length ? (
                                  <ul className="mt-3 space-y-2 text-sm text-slate-600">
                                    {feature.bulletPoints.map((point) => (
                                      <li key={point} className="flex gap-2">
                                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                                        <span>{point}</span>
                                      </li>
                                    ))}
                                  </ul>
                                ) : null}
                              </div>
                              {feature.callout ? (
                                <p className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium uppercase tracking-wide text-blue-700">
                                  {feature.callout}
                                </p>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      )}
                    </section>
                  ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
