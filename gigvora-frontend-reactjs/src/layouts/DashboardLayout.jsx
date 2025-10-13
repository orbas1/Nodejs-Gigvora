import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  ChevronDownIcon,
  ChevronRightIcon,
  Squares2X2Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import gigvoraWordmark from '../../images/Gigvora Logo.png';

function slugify(value) {
  if (!value) {
    return '';
  }
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function normalizeMenuSections(sections) {
  return (Array.isArray(sections) ? sections : []).map((section, sectionIndex) => {
    const sectionId = section.id ?? slugify(section.label ?? `section-${sectionIndex + 1}`) ?? `section-${sectionIndex + 1}`;
    const items = (Array.isArray(section.items) ? section.items : []).map((item, itemIndex) => {
      const itemId =
        item.id ??
        item.key ??
        slugify(item.name ?? `item-${sectionIndex + 1}-${itemIndex + 1}`) ??
        `item-${sectionIndex + 1}-${itemIndex + 1}`;

      return {
        ...item,
        id: itemId,
        name: item.name ?? `Menu item ${itemIndex + 1}`,
        description: item.description ?? '',
        sectionId: item.sectionId ?? item.targetId ?? slugify(item.sectionId ?? item.name),
      };
    });

    return {
      ...section,
      id: sectionId,
      label: section.label ?? `Section ${sectionIndex + 1}`,
      items,
    };
  });
}

function DefaultAvatar({ initials }) {
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-base font-semibold text-blue-700">
      {initials ?? 'GV'}
    </div>
  );
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
  activeMenuItem,
  onMenuItemSelect,
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDrawers, setOpenDrawers] = useState(() => new Set());

  const normalizedMenuSections = useMemo(() => normalizeMenuSections(menuSections), [menuSections]);

  useEffect(() => {
    if (!openDrawers.size && normalizedMenuSections.length) {
      setOpenDrawers(new Set(normalizedMenuSections.map((section) => section.id)));
    }
  }, [normalizedMenuSections, openDrawers]);

  const resolvedProfile = {
    name: profile?.name ?? 'Member',
    role: profile?.role ?? 'Gigvora workspace',
    initials: profile?.initials ?? 'GV',
    avatarUrl: profile?.avatarUrl ?? null,
    status: profile?.status,
    badges: profile?.badges ?? [],
    metrics: profile?.metrics ?? [],
  };

  const handleDrawerToggle = (sectionId) => {
    setOpenDrawers((previous) => {
      const next = new Set(previous);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const handleMenuClick = (item) => {
    if (!item) return;
    if (typeof onMenuItemSelect === 'function') {
      onMenuItemSelect(item.id, item);
      setMobileOpen(false);
      return;
    }

    if (item.href) {
      if (item.href.startsWith('http')) {
        window.open(item.href, item.target ?? '_blank', 'noreferrer');
      }
      return;
    }

    const targetId = item.sectionId ?? item.targetId ?? slugify(item.name);
    if (targetId && typeof document !== 'undefined') {
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
    setMobileOpen(false);
  };

  const activeItemId = activeMenuItem ?? null;
  const dashboards = Array.isArray(availableDashboards) && availableDashboards.length > 0 ? availableDashboards : [];

  const sidebarContent = (
    <div className="flex h-full flex-col gap-6 overflow-y-auto px-6 py-6">
      <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} gap-4`}>
        <Link to="/" className="inline-flex items-center">
          <img src={gigvoraWordmark} alt="Gigvora" className="h-9 w-auto" />
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSidebarCollapsed((previous) => !previous)}
            className="hidden rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-blue-200 hover:text-blue-600 lg:inline-flex"
            aria-label={sidebarCollapsed ? 'Expand menu' : 'Collapse menu'}
          >
            <Squares2X2Icon className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-blue-200 hover:text-blue-600 lg:hidden"
            aria-label="Close menu"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className={`rounded-3xl border border-slate-200 bg-white p-5 shadow-sm ${sidebarCollapsed ? 'text-center' : ''}`}>
        <div className={`${sidebarCollapsed ? 'justify-center' : ''} flex items-center gap-3`}>
          {resolvedProfile.avatarUrl ? (
            <img
              src={resolvedProfile.avatarUrl}
              alt={resolvedProfile.name}
              className="h-12 w-12 rounded-2xl object-cover"
            />
          ) : (
            <DefaultAvatar initials={resolvedProfile.initials} />
          )}
          {!sidebarCollapsed ? (
            <div>
              <p className="text-sm font-semibold text-slate-900">{resolvedProfile.name}</p>
              <p className="text-xs text-slate-500">{resolvedProfile.role}</p>
              {resolvedProfile.status ? (
                <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-blue-600">
                  {resolvedProfile.status}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
        {!sidebarCollapsed && resolvedProfile.badges.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {resolvedProfile.badges.map((badge) => (
              <span
                key={badge}
                className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-blue-600"
              >
                {badge}
              </span>
            ))}
          </div>
        ) : null}
        {!sidebarCollapsed && resolvedProfile.metrics.length ? (
          <dl className="mt-4 grid grid-cols-2 gap-3">
            {resolvedProfile.metrics.map((metric) => (
              <div key={metric.label} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
                <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{metric.label}</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-900">{metric.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>

      {sidebarCollapsed ? (
        <nav className="space-y-5">
          {normalizedMenuSections.map((section) => (
            <div key={section.id}>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{section.label}</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {section.items.map((item) => {
                  const isActive = activeItemId === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      title={item.name}
                      onClick={() => handleMenuClick(item)}
                      className={`flex aspect-square items-center justify-center rounded-2xl border text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                        isActive
                          ? 'border-blue-500 bg-blue-600 text-white shadow-lg'
                          : 'border-slate-200 bg-white/90 text-slate-500 hover:border-blue-300 hover:text-blue-600'
                      }`}
                    >
                      {Icon ? <Icon className="h-5 w-5" /> : item.name.charAt(0)}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      ) : (
        <nav className="space-y-4">
          {normalizedMenuSections.map((section) => {
            const isOpen = openDrawers.has(section.id);
            return (
              <div key={section.id} className="rounded-3xl border border-slate-200 bg-white/80">
                <button
                  type="button"
                  onClick={() => handleDrawerToggle(section.id)}
                  className="flex w-full items-center justify-between gap-3 rounded-3xl px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:text-blue-600"
                >
                  <span>{section.label}</span>
                  <ChevronDownIcon
                    className={`h-5 w-5 transition ${isOpen ? 'rotate-180 text-blue-500' : 'text-slate-400'}`}
                  />
                </button>
                {isOpen ? (
                  <ul className="space-y-2 border-t border-slate-100 px-4 py-3">
                    {section.items.map((item) => {
                      const isActive = activeItemId === item.id;
                      const Icon = item.icon;
                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            onClick={() => handleMenuClick(item)}
                            className={`group flex w-full items-start gap-3 rounded-2xl border px-3 py-3 text-left transition focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                              isActive
                                ? 'border-blue-400 bg-blue-50 text-blue-700 shadow-sm'
                                : 'border-transparent bg-slate-100/60 text-slate-700 hover:border-blue-300 hover:bg-blue-50'
                            }`}
                          >
                            <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white/80 text-blue-500">
                              {Icon ? <Icon className="h-5 w-5" /> : <ChevronRightIcon className="h-4 w-4" />}
                            </span>
                            <span className="flex-1">
                              <span className="text-sm font-medium">{item.name}</span>
                              {item.description ? (
                                <p className="mt-1 text-xs text-slate-500">{item.description}</p>
                              ) : null}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </div>
            );
          })}
        </nav>
      )}

      {dashboards.length ? (
        <div className="mt-auto space-y-3 rounded-3xl border border-slate-200 bg-white/80 p-4 text-sm text-slate-600">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Switch dashboard</p>
          <div className="flex flex-wrap gap-2">
            {dashboards.map((dashboard) => (
              <Link
                key={dashboard}
                to={`/dashboards/${dashboard}`}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  dashboard === currentDashboard
                    ? 'border-blue-400 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600'
                }`}
              >
                <ArrowLeftOnRectangleIcon className="h-4 w-4" />
                {dashboard.charAt(0).toUpperCase() + dashboard.slice(1)}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );

  return (
    <div className="relative flex min-h-screen bg-slate-50 text-slate-900">
      <aside
        className={`fixed inset-y-0 left-0 z-30 transform border-r border-slate-200 bg-white/95 shadow-lg transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } ${sidebarCollapsed ? 'w-24 lg:w-28' : 'w-72 lg:w-80'}`}
      >
        {sidebarContent}
      </aside>

      <div className="flex min-h-screen flex-1 flex-col lg:pl-0">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/90 px-6 py-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="inline-flex rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-blue-200 hover:text-blue-600 lg:hidden"
              aria-label="Open menu"
            >
              <Bars3Icon className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">{title ?? 'Dashboard'}</h1>
              {subtitle ? <p className="text-sm text-slate-500">{subtitle}</p> : null}
            </div>
          </div>
          {description ? <p className="hidden max-w-lg text-right text-sm text-slate-500 lg:block">{description}</p> : null}
        </header>

        <main className="flex-1 bg-slate-50/60">{children}</main>
      </div>
    </div>
  );
}
