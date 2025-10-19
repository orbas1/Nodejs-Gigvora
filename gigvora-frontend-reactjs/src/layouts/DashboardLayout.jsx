import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AdjustmentsHorizontalIcon,
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  ChevronDownIcon,
  ChevronRightIcon,
  Squares2X2Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import PropTypes from 'prop-types';
import { Link, useNavigate } from 'react-router-dom';
import gigvoraWordmark from '../../images/Gigvora Logo.png';
import MessagingDock from '../components/messaging/MessagingDock.jsx';
import AdPlacementRail from '../components/ads/AdPlacementRail.jsx';

function slugify(value) {
  if (!value) return '';
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function normalizeMenuSections(sections) {
  const safeSections = Array.isArray(sections) ? sections : [];
  return safeSections.map((section, sectionIndex) => {
    const sectionId = section?.id ? String(section.id) : slugify(section?.label) || `section-${sectionIndex + 1}`;
    const label = section?.label ?? `Section ${sectionIndex + 1}`;
    const items = (Array.isArray(section?.items) ? section.items : []).map((item, itemIndex) => {
      const itemId = item?.id ? String(item.id) : slugify(item?.name) || `${sectionId}-item-${itemIndex + 1}`;
      return {
        ...item,
        id: itemId,
        name: item?.name ?? `Menu item ${itemIndex + 1}`,
        description: item?.description ?? '',
        sectionId,
        parentSectionId: sectionId,
        parentSectionLabel: label,
        orderIndex: item?.orderIndex ?? itemIndex,
        sectionOrderIndex: section?.orderIndex ?? sectionIndex,
        href: typeof item?.href === 'string' ? item.href.trim() : undefined,
      };
    });

    return {
      ...section,
      id: sectionId,
      label,
      items,
      orderIndex: section?.orderIndex ?? sectionIndex,
    };
  });
}

function normalizeAvailableDashboards(availableDashboards) {
  if (!Array.isArray(availableDashboards)) return [];
  return availableDashboards
    .map((entry, index) => {
      if (!entry) return null;
      if (typeof entry === 'string') {
        const id = slugify(entry) || `dashboard-${index + 1}`;
        return { id, label: entry, href: `/dashboard/${id}` };
      }
      if (typeof entry === 'object') {
        const id = slugify(entry.id ?? entry.slug ?? entry.href) || `dashboard-${index + 1}`;
        const label = entry.label ?? entry.name ?? id;
        const href = entry.href ?? `/dashboard/${id}`;
        return { id, label, href };
      }
      return null;
    })
    .filter(Boolean);
}

const DEFAULT_AD_SURFACE_BY_DASHBOARD = {
  admin: 'admin_dashboard',
  user: 'user_dashboard',
  freelancer: 'freelancer_dashboard',
  company: 'company_dashboard',
  agency: 'agency_dashboard',
  headhunter: 'headhunter_dashboard',
};

function DashboardSwitcher({ dashboards, currentId, onNavigate }) {
  if (!dashboards.length) return null;
  return (
    <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm lg:flex">
      <Squares2X2Icon className="h-4 w-4 text-accent" />
      <span>Dashboards</span>
      <div className="flex items-center gap-1">
        {dashboards.map((dashboard) => {
          const isActive = dashboard.id === currentId;
          return (
            <button
              key={dashboard.id}
              type="button"
              className={`rounded-full px-2 py-0.5 text-xs font-semibold transition ${
                isActive ? 'bg-accent text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
              onClick={() => onNavigate?.(dashboard.href)}
            >
              {dashboard.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

DashboardSwitcher.propTypes = {
  dashboards: PropTypes.arrayOf(
    PropTypes.shape({ id: PropTypes.string.isRequired, label: PropTypes.string.isRequired, href: PropTypes.string.isRequired }),
  ),
  currentId: PropTypes.string,
  onNavigate: PropTypes.func,
};

DashboardSwitcher.defaultProps = {
  dashboards: [],
  currentId: undefined,
  onNavigate: undefined,
};

function MenuSection({ section, isOpen, onToggle, onItemClick, activeItemId }) {
  if (!section.items.length) return null;
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => onToggle(section.id)}
        className="flex w-full items-center justify-between rounded-2xl border border-transparent bg-transparent px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:text-slate-800"
      >
        <span>{section.label}</span>
        <ChevronDownIcon className={`h-4 w-4 transition ${isOpen ? 'rotate-180 text-accent' : 'text-slate-400'}`} />
      </button>
      <div className={`${isOpen ? 'max-h-[960px]' : 'max-h-0'} overflow-hidden transition-[max-height] duration-300`}>
        <nav className="space-y-1 pl-3">
          {section.items.map((item) => {
            const Icon = item.icon;
            const isActive = activeItemId && item.id === activeItemId;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onItemClick?.(item)}
                className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left text-sm transition ${
                  isActive ? 'bg-accent text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {Icon ? <Icon className="h-5 w-5 flex-shrink-0" /> : null}
                <span className="flex flex-col">
                  <span className="font-semibold leading-tight">{item.name}</span>
                  {item.description ? (
                    <span className={`text-xs ${isActive ? 'text-white/80' : 'text-slate-500'}`}>{item.description}</span>
                  ) : null}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

MenuSection.propTypes = {
  section: PropTypes.shape({ id: PropTypes.string.isRequired, label: PropTypes.string.isRequired, items: PropTypes.arrayOf(PropTypes.object).isRequired }).isRequired,
  isOpen: PropTypes.bool,
  onToggle: PropTypes.func.isRequired,
  onItemClick: PropTypes.func,
  activeItemId: PropTypes.string,
};

MenuSection.defaultProps = {
  isOpen: true,
  onItemClick: undefined,
  activeItemId: undefined,
};

export default function DashboardLayout({
  currentDashboard,
  title,
  subtitle,
  description,
  menuSections,
  sections,
  availableDashboards,
  children,
  activeMenuItem,
  onMenuItemSelect,
  adSurface,
}) {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openSectionIds, setOpenSectionIds] = useState(new Set());

  const normalizedSections = useMemo(
    () => normalizeMenuSections(menuSections?.length ? menuSections : sections || []),
    [menuSections, sections],
  );

  const allMenuItems = useMemo(() => normalizedSections.flatMap((section) => section.items), [normalizedSections]);

  useEffect(() => {
    setOpenSectionIds(new Set(normalizedSections.map((section) => section.id)));
  }, [normalizedSections]);

  const handleMenuItemClick = useCallback(
    (item) => {
      if (!item) return;
      onMenuItemSelect?.(item.id, item);
      setMobileOpen(false);

      if (!item.href) {
        const targetId = item.sectionId ?? item.targetId ?? slugify(item.name);
        if (targetId && typeof document !== 'undefined') {
          const element = document.getElementById(targetId);
          element?.scrollIntoView({ behavior: 'smooth' });
        }
        return;
      }

      const href = item.href.trim();
      if (!href) return;

      if (/^https?:\/\//i.test(href)) {
        if (typeof window !== 'undefined') {
          window.open(href, item.target ?? '_blank', 'noopener,noreferrer');
        }
        return;
      }

      if (href.startsWith('#')) {
        const targetId = href.slice(1);
        if (targetId && typeof document !== 'undefined') {
          const element = document.getElementById(targetId);
          element?.scrollIntoView({ behavior: 'smooth' });
        }
        return;
      }

      navigate(href);
    },
    [navigate, onMenuItemSelect],
  );

  const dashboards = useMemo(() => normalizeAvailableDashboards(availableDashboards), [availableDashboards]);
  const activeDashboardId = slugify(currentDashboard) || dashboards[0]?.id;
  const surface = adSurface || DEFAULT_AD_SURFACE_BY_DASHBOARD[activeDashboardId] || 'global_dashboard';

  return (
    <div className="relative flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 flex w-80 flex-col border-r border-slate-200 bg-white/95 backdrop-blur lg:relative lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 lg:flex`}
      >
        <div className="flex items-center justify-between px-5 py-4">
          <button type="button" className="flex items-center gap-3" onClick={() => navigate('/') }>
            <img src={gigvoraWordmark} alt="Gigvora" className="h-8" />
            <span className="hidden text-sm font-semibold uppercase tracking-wide text-accent lg:block">
              {title || 'Dashboard'}
            </span>
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-800 lg:hidden"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-6">
          <DashboardSwitcher dashboards={dashboards} currentId={activeDashboardId} onNavigate={navigate} />
          <div className="mt-4 space-y-6">
            {normalizedSections.map((section) => (
              <MenuSection
                key={section.id}
                section={section}
                isOpen={openSectionIds.has(section.id)}
                onToggle={(id) =>
                  setOpenSectionIds((prev) => {
                    const next = new Set(prev);
                    if (next.has(id)) next.delete(id);
                    else next.add(id);
                    return next;
                  })
                }
                onItemClick={handleMenuItemClick}
                activeItemId={activeMenuItem}
              />
            ))}
          </div>
        </div>

        <div className="border-t border-slate-200 px-5 py-4">
          <button
            type="button"
            onClick={() => setSidebarCollapsed((prev) => !prev)}
            className="flex w-full items-center justify-between rounded-2xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
          >
            <span>{sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}</span>
            <ChevronRightIcon className={`h-4 w-4 transition ${sidebarCollapsed ? '' : 'rotate-90 text-accent'}`} />
          </button>
          <a
            href="/logout"
            className="mt-3 flex items-center justify-center gap-2 rounded-2xl border border-transparent bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <ArrowLeftOnRectangleIcon className="h-5 w-5" />
            Log out
          </a>
        </div>
      </div>

      {/* Main content */}
      <div className="flex w-full flex-col lg:ml-80">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/80 px-6 py-4 backdrop-blur">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
            {subtitle ? <p className="text-sm font-medium text-accent">{subtitle}</p> : null}
            {description ? <p className="text-sm text-slate-500">{description}</p> : null}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 lg:hidden"
            >
              <Bars3Icon className="h-5 w-5" /> Menu
            </button>
            <DashboardSwitcher dashboards={dashboards} currentId={activeDashboardId} onNavigate={navigate} />
          </div>
        </header>

        <main className="flex-1 bg-slate-50/60">
          <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:px-10">
            <div className="flex-1">{children}</div>
            <aside className="hidden w-72 flex-shrink-0 lg:block">
              <AdPlacementRail surface={surface} variant="desktop" />
            </aside>
          </div>
        </main>

        <footer className="border-t border-slate-200 bg-white/80 px-6 py-4 text-xs text-slate-500">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>© {new Date().getFullYear()} Gigvora. All rights reserved.</span>
            <div className="flex flex-wrap gap-4">
              <Link to="/terms" className="transition hover:text-accent">
                Terms
              </Link>
              <Link to="/privacy" className="transition hover:text-accent">
                Privacy
              </Link>
              <Link to="/trust-center" className="transition hover:text-accent">
                Trust Center
              </Link>
            </div>
          </div>
        </footer>
      </div>

      <MessagingDock />
    </div>
  );
}

DashboardLayout.propTypes = {
  currentDashboard: PropTypes.string,
  title: PropTypes.string,
  subtitle: PropTypes.string,
  description: PropTypes.string,
  menuSections: PropTypes.arrayOf(PropTypes.object),
  sections: PropTypes.arrayOf(PropTypes.object),
  availableDashboards: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.object])),
  children: PropTypes.node,
  activeMenuItem: PropTypes.string,
  onMenuItemSelect: PropTypes.func,
  adSurface: PropTypes.string,
};

DashboardLayout.defaultProps = {
  currentDashboard: 'dashboard',
  title: 'Dashboard',
  subtitle: undefined,
  description: undefined,
  menuSections: undefined,
  sections: undefined,
  availableDashboards: [],
  children: null,
  activeMenuItem: undefined,
  onMenuItemSelect: undefined,
  adSurface: undefined,
};

export { DEFAULT_AD_SURFACE_BY_DASHBOARD };
