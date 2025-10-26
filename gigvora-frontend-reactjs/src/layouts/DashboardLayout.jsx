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
import { useNavigate } from 'react-router-dom';
import gigvoraWordmark from '../../images/Gigvora Logo.png';
import MessagingDock from '../components/messaging/MessagingDock.jsx';
import AdPlacementRail from '../components/ads/AdPlacementRail.jsx';
import DashboardAccessGuard from '../components/security/DashboardAccessGuard.jsx';
import DashboardQuickNav from '../components/dashboard/shared/DashboardQuickNav.jsx';

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
    const sectionId = section.id ? String(section.id) : slugify(section.label) || `section-${sectionIndex + 1}`;
    const label = section.label ?? `Section ${sectionIndex + 1}`;
    const items = (Array.isArray(section.items) ? section.items : []).map((item, itemIndex) => {
      const itemId = item.id ? String(item.id) : slugify(item.name) || `${sectionId}-item-${itemIndex + 1}`;
      return {
        ...item,
        id: itemId,
        name: item.name ?? `Menu item ${itemIndex + 1}`,
        description: item.description ?? '',
        sectionId,
        parentSectionId: sectionId,
        parentSectionLabel: label,
        orderIndex: item.orderIndex ?? itemIndex,
        sectionOrderIndex: section.orderIndex ?? sectionIndex,
        href: typeof item.href === 'string' ? item.href.trim() : undefined,
      };
    });

    return {
      ...section,
      id: sectionId,
      label,
      items,
      orderIndex: section.orderIndex ?? sectionIndex,
    };
  });
}

function normalizeAvailableDashboards(availableDashboards) {
  if (!Array.isArray(availableDashboards)) {
    return [];
  }

  return availableDashboards
    .map((entry, index) => {
      if (!entry) {
        return null;
      }

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

function formatBadgeValue(value) {
  if (value == null) {
    return null;
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      return null;
    }
    if (value > 999) {
      return `${Math.round(value / 100) / 10}k`;
    }
  }

  const stringified = String(value).trim();
  return stringified || null;
}

function loadStoredCustomization(key) {
  if (typeof window === 'undefined') {
    return { order: [], hidden: [] };
  }

  try {
    const stored = window.localStorage.getItem(key);
    if (!stored) {
      return { order: [], hidden: [] };
    }
    const parsed = JSON.parse(stored);
    return {
      order: Array.isArray(parsed?.order) ? parsed.order.map(String) : [],
      hidden: Array.isArray(parsed?.hidden) ? parsed.hidden.map(String) : [],
    };
  } catch (error) {
    return { order: [], hidden: [] };
  }
}

function saveStoredCustomization(key, value) {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // Non-blocking persistence failure.
  }
}

function loadStoredSidebarPreferences(key) {
  if (typeof window === 'undefined') {
    return { collapsed: false };
  }

  try {
    const stored = window.localStorage.getItem(key);
    if (!stored) {
      return { collapsed: false };
    }

    const parsed = JSON.parse(stored);
    return {
      collapsed: Boolean(parsed?.collapsed),
    };
  } catch (error) {
    return { collapsed: false };
  }
}

function saveStoredSidebarPreferences(key, value) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // Persisting layout preferences is best-effort.
  }
}

function getMenuItemInitials(name) {
  if (!name) {
    return '?';
  }

  const trimmed = String(name).trim();
  if (!trimmed) {
    return '?';
  }

  const segments = trimmed.split(/\s+/).filter(Boolean);
  if (segments.length === 1) {
    return segments[0].slice(0, 2).toUpperCase();
  }

  const first = segments[0]?.[0] ?? '';
  const second = segments[1]?.[0] ?? '';
  return `${first}${second}`.toUpperCase();
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
  if (!dashboards.length) {
    return null;
  }

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
              aria-pressed={isActive}
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
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      href: PropTypes.string.isRequired,
    }),
  ),
  currentId: PropTypes.string,
  onNavigate: PropTypes.func,
};

DashboardSwitcher.defaultProps = {
  dashboards: [],
  currentId: undefined,
  onNavigate: undefined,
};

function MenuSection({ section, isOpen, onToggle, onItemClick, activeItemId, collapsed }) {
  if (!section.items.length) {
    return null;
  }

  if (collapsed) {
    return (
      <div className="space-y-2" data-section-collapsed="true">
        <nav className="flex flex-col gap-1 px-1" aria-label={section.label}>
          {section.items.map((item) => {
            const Icon = item.icon;
            const isActive = activeItemId && item.id === activeItemId;
            const badge = formatBadgeValue(item.badge);
            const label = item.name ?? 'Menu item';
            const initials = getMenuItemInitials(label);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onItemClick?.(item)}
                className={`group relative flex flex-col items-center gap-1 rounded-2xl border border-transparent px-2 py-3 text-center text-[10px] font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                  isActive
                    ? 'bg-accent text-white shadow-sm focus-visible:outline-accent'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-slate-400'
                }`}
                aria-current={isActive ? 'page' : undefined}
                aria-label={label}
                title={label}
              >
                {Icon ? (
                  <Icon
                    className={`h-6 w-6 flex-shrink-0 ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />
                ) : (
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold uppercase ${
                      isActive
                        ? 'border-white/30 bg-white/20 text-white'
                        : 'border-slate-200 bg-white text-slate-500'
                    }`}
                    aria-hidden
                  >
                    {initials}
                  </span>
                )}
                <span
                  className={`max-w-[4.5rem] break-words text-center leading-tight ${
                    isActive ? 'text-white/90' : 'text-slate-600'
                  }`}
                >
                  {label}
                </span>
                {badge ? (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>
      </div>
    );
  }

  const panelId = `${section.id}-panel`;
  const buttonId = `${section.id}-toggle`;

  return (
    <div className="space-y-2" data-section-collapsed="false">
      <button
        type="button"
        onClick={() => onToggle(section.id)}
        className="flex w-full items-center justify-between rounded-2xl border border-transparent bg-transparent px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:text-slate-800"
        aria-expanded={isOpen}
        aria-controls={panelId}
        id={buttonId}
      >
        <span>{section.label}</span>
        <ChevronDownIcon className={`h-4 w-4 transition ${isOpen ? 'rotate-180 text-accent' : 'text-slate-400'}`} />
      </button>
      <div
        className={`${isOpen ? 'max-h-[960px]' : 'max-h-0'} overflow-hidden transition-[max-height] duration-300`}
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
      >
        <nav className="space-y-1 pl-3" aria-label={section.label}>
          {section.items.map((item) => {
            const Icon = item.icon;
            const isActive = activeItemId && item.id === activeItemId;
            const badge = formatBadgeValue(item.badge);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onItemClick?.(item)}
                className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left text-sm transition ${
                  isActive
                    ? 'bg-accent text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                {Icon ? <Icon className="h-5 w-5 flex-shrink-0" /> : null}
                <div className="flex flex-1 items-center gap-3">
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="font-semibold leading-tight">{item.name}</span>
                    {item.description ? (
                      <span className={`text-xs ${isActive ? 'text-white/80' : 'text-slate-500'}`}>{item.description}</span>
                    ) : null}
                  </span>
                  {badge ? (
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {badge}
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

MenuSection.propTypes = {
  section: PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    items: PropTypes.arrayOf(PropTypes.object).isRequired,
  }).isRequired,
  isOpen: PropTypes.bool,
  onToggle: PropTypes.func.isRequired,
  onItemClick: PropTypes.func,
  activeItemId: PropTypes.string,
  collapsed: PropTypes.bool,
};

MenuSection.defaultProps = {
  isOpen: true,
  onItemClick: undefined,
  activeItemId: undefined,
  collapsed: false,
};

function CustomizationPanel({
  open,
  items,
  order,
  hidden,
  onClose,
  onReorder,
  onToggleVisibility,
}) {
  if (!open) {
    return null;
  }

  const orderedItems = order
    .map((id) => items.find((item) => item.id === id))
    .filter(Boolean);

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-end bg-slate-900/40 backdrop-blur-sm">
      <div className="h-full w-full max-w-md overflow-y-auto border-l border-slate-200 bg-white px-6 py-8 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Navigation designer</h2>
            <p className="text-sm text-slate-500">Reorder and hide modules to tailor your workspace.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-800"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 space-y-3">
          {orderedItems.map((item, index) => {
            const isHidden = hidden.has(item.id);
            return (
              <div
                key={item.id}
                className={`flex items-center justify-between rounded-2xl border px-3 py-3 text-sm ${
                  isHidden ? 'border-slate-200 bg-slate-100 text-slate-400' : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {item.parentSectionLabel}
                  </span>
                  <span className="font-semibold text-slate-800">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-full border border-slate-200 p-1 text-xs text-slate-500 transition hover:border-slate-300 hover:text-slate-800"
                    onClick={() => onReorder(item.id, index - 1)}
                    disabled={index === 0}
                  >
                    <ChevronRightIcon className="h-4 w-4 rotate-180" />
                  </button>
                  <button
                    type="button"
                    className="rounded-full border border-slate-200 p-1 text-xs text-slate-500 transition hover:border-slate-300 hover:text-slate-800"
                    onClick={() => onReorder(item.id, index + 1)}
                    disabled={index === orderedItems.length - 1}
                  >
                    <ChevronRightIcon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                      isHidden
                        ? 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                        : 'border-accent/40 bg-accent/10 text-accent hover:border-accent/60'
                    }`}
                    onClick={() => onToggleVisibility(item.id)}
                  >
                    {isHidden ? 'Show' : 'Hide'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

CustomizationPanel.propTypes = {
  open: PropTypes.bool.isRequired,
  items: PropTypes.arrayOf(PropTypes.object).isRequired,
  order: PropTypes.arrayOf(PropTypes.string).isRequired,
  hidden: PropTypes.instanceOf(Set).isRequired,
  onClose: PropTypes.func.isRequired,
  onReorder: PropTypes.func.isRequired,
  onToggleVisibility: PropTypes.func.isRequired,
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
  requiredRoles,
  requiredPermissions,
  guardFallback,
  enforceAccessControl,
}) {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const [openSectionIds, setOpenSectionIds] = useState(() => new Set());
  const [activeScrollItemId, setActiveScrollItemId] = useState(activeMenuItem ?? '');

  const normalizedSections = useMemo(
    () => normalizeMenuSections(menuSections?.length ? menuSections : sections),
    [menuSections, sections],
  );

  useEffect(() => {
    setOpenSectionIds(new Set(normalizedSections.map((section) => section.id)));
  }, [normalizedSections]);

  useEffect(() => {
    if (activeMenuItem) {
      setActiveScrollItemId(activeMenuItem);
    }
  }, [activeMenuItem]);

  const allMenuItems = useMemo(() => normalizedSections.flatMap((section) => section.items), [normalizedSections]);

  useEffect(() => {
    if (!activeMenuItem) {
      return;
    }
    const activeItem = allMenuItems.find((item) => item.id === activeMenuItem);
    if (!activeItem) {
      return;
    }
    setOpenSectionIds((previous) => {
      if (previous.has(activeItem.parentSectionId)) {
        return previous;
      }
      const next = new Set(previous);
      next.add(activeItem.parentSectionId);
      return next;
    });
  }, [activeMenuItem, allMenuItems]);

  const dashboardId = useMemo(() => slugify(currentDashboard) || 'dashboard', [currentDashboard]);
  const customizationKey = useMemo(
    () => `gigvora.dashboard.${dashboardId}.navigation`,
    [dashboardId],
  );
  const sidebarPreferencesKey = useMemo(
    () => `gigvora.dashboard.${dashboardId}.sidebar`,
    [dashboardId],
  );

  const [customOrder, setCustomOrder] = useState([]);
  const [hiddenItemIds, setHiddenItemIds] = useState(() => new Set());

  useEffect(() => {
    const { order, hidden } = loadStoredCustomization(customizationKey);
    setCustomOrder(order);
    setHiddenItemIds(new Set(hidden));
  }, [customizationKey]);

  useEffect(() => {
    const orderIds = customOrder.length ? customOrder : allMenuItems.map((item) => item.id);
    saveStoredCustomization(customizationKey, { order: orderIds, hidden: [...hiddenItemIds] });
  }, [customOrder, hiddenItemIds, customizationKey, allMenuItems]);

  useEffect(() => {
    const { collapsed } = loadStoredSidebarPreferences(sidebarPreferencesKey);
    setSidebarCollapsed(Boolean(collapsed));
  }, [sidebarPreferencesKey]);

  useEffect(() => {
    saveStoredSidebarPreferences(sidebarPreferencesKey, { collapsed: sidebarCollapsed });
  }, [sidebarPreferencesKey, sidebarCollapsed]);

  const orderedMenuItems = useMemo(() => {
    const knownIds = new Set(allMenuItems.map((item) => item.id));
    const primaryOrder = customOrder.filter((id) => knownIds.has(id));
    const missing = allMenuItems
      .map((item) => item.id)
      .filter((id) => !primaryOrder.includes(id));
    return [...primaryOrder, ...missing];
  }, [allMenuItems, customOrder]);

  const menuItemLookup = useMemo(() => {
    const map = new Map();
    allMenuItems.forEach((item) => map.set(item.id, item));
    return map;
  }, [allMenuItems]);

  const customizedSections = useMemo(() => {
    const visibleItemIds = orderedMenuItems.filter((id) => !hiddenItemIds.has(id));
    const sectionItems = new Map();

    visibleItemIds.forEach((itemId) => {
      const item = menuItemLookup.get(itemId);
      if (!item) return;
      if (!sectionItems.has(item.parentSectionId)) {
        sectionItems.set(item.parentSectionId, []);
      }
      sectionItems.get(item.parentSectionId).push(item);
    });

    return normalizedSections.map((section) => ({
      ...section,
      items: sectionItems.get(section.id) ?? [],
    }));
  }, [hiddenItemIds, menuItemLookup, normalizedSections, orderedMenuItems]);

  const quickNavSections = useMemo(
    () => customizedSections.filter((section) => section.items.length > 0),
    [customizedSections],
  );

  const sectionItemMap = useMemo(() => {
    const map = new Map();
    quickNavSections.forEach((section) => {
      section.items.forEach((item) => {
        if (item.sectionId) {
          map.set(item.sectionId, item);
        }
      });
    });
    return map;
  }, [quickNavSections]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return undefined;
    }

    if (!sectionItemMap.size) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible.length > 0) {
          const item = sectionItemMap.get(visible[0].target.id);
          if (item) {
            setActiveScrollItemId((previous) => (previous === item.id ? previous : item.id));
          }
          return;
        }

        const nearest = entries
          .map((entry) => ({ id: entry.target.id, distance: Math.abs(entry.boundingClientRect.top) }))
          .sort((a, b) => a.distance - b.distance)[0];

        if (nearest) {
          const item = sectionItemMap.get(nearest.id);
          if (item) {
            setActiveScrollItemId((previous) => (previous === item.id ? previous : item.id));
          }
        }
      },
      { rootMargin: '-35% 0px -50% 0px', threshold: [0.1, 0.25, 0.5] },
    );

    sectionItemMap.forEach((_, sectionId) => {
      const element = document.getElementById(sectionId);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [sectionItemMap]);

  const dashboards = useMemo(
    () => normalizeAvailableDashboards(availableDashboards),
    [availableDashboards],
  );

  const hasMenuCustomization = allMenuItems.length > 0;

  const highlightedMenuItemId = activeMenuItem ?? activeScrollItemId;

  const handleMenuItemClick = useCallback(
    (item) => {
      if (!item) return;
      onMenuItemSelect?.(item.id, item);
      setMobileOpen(false);
      if (item.id) {
        setActiveScrollItemId(item.id);
      }

      if (!item.href) {
        return;
      }

      const href = item.href.trim();
      if (!href) {
        return;
      }

      if (/^https?:\/\//i.test(href)) {
        window.open(href, item.target ?? '_blank', 'noreferrer');
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

  const handleToggleSection = useCallback((sectionId) => {
    setOpenSectionIds((previous) => {
      const next = new Set(previous);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }, []);

  const handleReorder = useCallback(
    (itemId, targetIndex) => {
      setCustomOrder((previous) => {
        const ids = previous.length ? [...previous] : allMenuItems.map((item) => item.id);
        const currentIndex = ids.indexOf(itemId);
        if (currentIndex === -1) {
          return ids;
        }
        const boundedIndex = Math.max(0, Math.min(ids.length - 1, targetIndex));
        if (currentIndex === boundedIndex) {
          return ids;
        }
        ids.splice(currentIndex, 1);
        ids.splice(boundedIndex, 0, itemId);
        return ids;
      });
    },
    [allMenuItems],
  );

  const handleToggleHidden = useCallback((itemId) => {
    setHiddenItemIds((previous) => {
      const next = new Set(previous);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }, []);

  const normalizedDashboardKey =
    typeof currentDashboard === 'string' ? currentDashboard.trim().toLowerCase() : '';
  const sluggedDashboardId = slugify(currentDashboard);
  const activeDashboardId = sluggedDashboardId || dashboards[0]?.id;
  const surface = adSurface || DEFAULT_AD_SURFACE_BY_DASHBOARD[activeDashboardId] || 'global_dashboard';

  const guardEnabled = enforceAccessControl !== false;

  const effectiveRequiredRoles = useMemo(() => {
    if (!guardEnabled) {
      return [];
    }
    if (Array.isArray(requiredRoles) && requiredRoles.length) {
      return requiredRoles;
    }
    if (normalizedDashboardKey.startsWith('admin')) {
      return ['admin'];
    }
    return [];
  }, [guardEnabled, normalizedDashboardKey, requiredRoles]);

  const effectiveRequiredPermissions = useMemo(() => {
    if (!guardEnabled) {
      return [];
    }
    if (Array.isArray(requiredPermissions) && requiredPermissions.length) {
      return requiredPermissions;
    }
    return [];
  }, [guardEnabled, requiredPermissions]);

  const layoutMarkup = (
    <div className="relative flex min-h-screen bg-slate-50">
      <div
        data-testid="dashboard-sidebar"
        data-collapsed={sidebarCollapsed ? 'true' : 'false'}
        className={`fixed inset-y-0 left-0 z-30 flex w-80 flex-col border-r border-slate-200 bg-white/95 backdrop-blur transition-transform duration-300 lg:relative lg:flex lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } ${sidebarCollapsed ? 'lg:w-28' : 'lg:w-80'}`}
      >
        <div className={`flex items-center justify-between ${sidebarCollapsed ? 'px-3 py-3' : 'px-5 py-4'}`}>
          <button
            type="button"
            className="flex items-center gap-3"
            onClick={() => navigate('/')}
          >
            <img src={gigvoraWordmark} alt="Gigvora" className="h-8" />
            <span
              className={`block text-sm font-semibold uppercase tracking-wide text-accent ${
                sidebarCollapsed ? 'lg:hidden' : 'lg:block'
              }`}
            >
              {title || 'Dashboard'}
            </span>
          </button>
          <div className="flex items-center gap-2">
            {hasMenuCustomization ? (
              <button
                type="button"
                onClick={() => setCustomizerOpen(true)}
                className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-800"
                aria-label="Customize navigation"
              >
                <AdjustmentsHorizontalIcon className="h-5 w-5" />
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-800 lg:hidden"
              aria-label="Close navigation"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className={`flex-1 overflow-y-auto pb-6 ${sidebarCollapsed ? 'px-2' : 'px-4'}`}>
          {!sidebarCollapsed ? (
            <DashboardSwitcher dashboards={dashboards} currentId={activeDashboardId} onNavigate={navigate} />
          ) : null}
          <div className={`${sidebarCollapsed ? 'mt-2 space-y-4' : 'mt-4 space-y-6'}`}>
            {customizedSections.map((section) => (
              <MenuSection
                key={section.id}
                section={section}
                isOpen={openSectionIds.has(section.id)}
                onToggle={handleToggleSection}
                onItemClick={handleMenuItemClick}
                activeItemId={highlightedMenuItemId}
                collapsed={sidebarCollapsed}
              />
            ))}
          </div>
        </div>

        <div className={`border-t border-slate-200 ${sidebarCollapsed ? 'px-3 py-3' : 'px-5 py-4'}`}>
          <button
            type="button"
            onClick={() => setSidebarCollapsed((previous) => !previous)}
            className={`flex w-full items-center rounded-2xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 ${
              sidebarCollapsed ? 'justify-center' : 'justify-between'
            }`}
          >
            <span className={sidebarCollapsed ? 'sr-only' : ''}>
              {sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            </span>
            <ChevronRightIcon
              className={`h-4 w-4 transition ${sidebarCollapsed ? 'text-accent' : 'rotate-90 text-accent'}`}
              aria-hidden
            />
          </button>
          <a
            href="/logout"
            className="mt-3 flex items-center justify-center gap-2 rounded-2xl border border-transparent bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <ArrowLeftOnRectangleIcon className="h-5 w-5" />
            <span className={sidebarCollapsed ? 'sr-only' : ''}>Log out</span>
          </a>
        </div>
      </div>

      <div
        className={`flex w-full flex-col ${sidebarCollapsed ? 'lg:ml-28' : 'lg:ml-80'}`}
        data-testid="dashboard-main"
        data-sidebar-collapsed={sidebarCollapsed ? 'true' : 'false'}
      >
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
              <div className="sticky top-24 space-y-6">
                <DashboardQuickNav
                  sections={quickNavSections}
                  activeItemId={highlightedMenuItemId}
                  onSelect={handleMenuItemClick}
                />
                <AdPlacementRail surface={surface} variant="desktop" />
              </div>
            </aside>
          </div>
        </main>

        <footer className="border-t border-slate-200 bg-white/80 px-6 py-4 text-xs text-slate-500">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>© {new Date().getFullYear()} Gigvora. All rights reserved.</span>
            <div className="flex flex-wrap gap-4">
              <a href="/terms" className="transition hover:text-accent">
                Terms
              </a>
              <a href="/privacy" className="transition hover:text-accent">
                Privacy
              </a>
              <a href="/trust-center" className="transition hover:text-accent">
                Trust Center
              </a>
            </div>
          </div>
        </footer>
      </div>

      <CustomizationPanel
        open={customizerOpen}
        items={allMenuItems}
        order={orderedMenuItems}
        hidden={hiddenItemIds}
        onClose={() => setCustomizerOpen(false)}
        onReorder={handleReorder}
        onToggleVisibility={handleToggleHidden}
      />

      <MessagingDock />
    </div>
  );

  if (effectiveRequiredRoles.length || effectiveRequiredPermissions.length) {
    return (
      <DashboardAccessGuard
        requiredRoles={effectiveRequiredRoles}
        requiredPermissions={effectiveRequiredPermissions}
        fallback={guardFallback}
      >
        {layoutMarkup}
      </DashboardAccessGuard>
    );
  }

  return layoutMarkup;
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
  requiredRoles: PropTypes.arrayOf(PropTypes.string),
  requiredPermissions: PropTypes.arrayOf(PropTypes.string),
  guardFallback: PropTypes.node,
  enforceAccessControl: PropTypes.bool,
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
  requiredRoles: undefined,
  requiredPermissions: undefined,
  guardFallback: undefined,
  enforceAccessControl: true,
};

export { DEFAULT_AD_SURFACE_BY_DASHBOARD };
