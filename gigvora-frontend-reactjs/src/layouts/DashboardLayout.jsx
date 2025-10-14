import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AdjustmentsHorizontalIcon,
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronRightIcon,
  Squares2X2Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import gigvoraWordmark from '../../images/Gigvora Logo.png';
import MessagingDock from '../components/messaging/MessagingDock.jsx';
import AdPlacementRail from '../components/ads/AdPlacementRail.jsx';

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
    const rawSectionId = section.id ?? slugify(section.label ?? `section-${sectionIndex + 1}`) ?? `section-${sectionIndex + 1}`;
    const sectionId = typeof rawSectionId === 'string' ? rawSectionId : String(rawSectionId);
    const sectionLabel = section.label ?? `Section ${sectionIndex + 1}`;
    const items = (Array.isArray(section.items) ? section.items : []).map((item, itemIndex) => {
      const rawItemId =
        item.id ??
        item.key ??
        slugify(item.name ?? `item-${sectionIndex + 1}-${itemIndex + 1}`) ??
        `item-${sectionIndex + 1}-${itemIndex + 1}`;
      const itemId = typeof rawItemId === 'string' ? rawItemId : String(rawItemId);

      return {
        ...item,
        id: itemId,
        name: item.name ?? `Menu item ${itemIndex + 1}`,
        description: item.description ?? '',
        sectionId: item.sectionId ?? item.targetId ?? slugify(item.sectionId ?? item.name),
        parentSectionId: sectionId,
        parentSectionLabel: sectionLabel,
        orderIndex: itemIndex,
        sectionOrderIndex: sectionIndex,
      };
    });

    return {
      ...section,
      id: sectionId,
      label: sectionLabel,
      orderIndex: sectionIndex,
      items,
    };
  });
}

function titleCase(value) {
  if (!value) {
    return '';
  }
  return value
    .toString()
    .replace(/[-_]/g, ' ')
    .replace(/(^|\s)([a-z])/g, (match, boundary, letter) => `${boundary}${letter.toUpperCase()}`)
    .trim();
}

function normalizeAvailableDashboards(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item, index) => {
      if (!item) {
        return null;
      }

      if (typeof item === 'string') {
        const slug = slugify(item);
        return {
          id: slug || `dashboard-${index + 1}`,
          label: titleCase(item),
          href: slug ? `/dashboard/${slug}` : '/dashboard',
        };
      }

      if (typeof item === 'object') {
        const hrefSegment = typeof item.href === 'string' ? item.href.split('/').filter(Boolean).pop() : null;
        const slug = slugify(item.id ?? item.slug ?? hrefSegment ?? `dashboard-${index + 1}`);
        const label = item.label ?? titleCase(item.name ?? slug ?? `Dashboard ${index + 1}`);
        const href = item.href ?? (slug ? `/dashboard/${slug}` : '/dashboard');
        return {
          id: slug || `dashboard-${index + 1}`,
          label,
          href,
        };
      }

      return null;
    })
    .filter(Boolean);
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
    const order = Array.isArray(parsed?.order) ? parsed.order.map(String) : [];
    const hidden = Array.isArray(parsed?.hidden) ? parsed.hidden.map(String) : [];
    return { order, hidden };
  } catch (error) {
    console.warn('Failed to load dashboard customization', error);
    return { order: [], hidden: [] };
  }
}

function persistCustomization(key, { order, hidden }) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const payload = JSON.stringify({
      order: Array.isArray(order) ? order : [],
      hidden: Array.isArray(hidden) ? hidden : [],
    });
    window.localStorage.setItem(key, payload);
  } catch (error) {
    console.warn('Failed to save dashboard customization', error);
  }
}

const DEFAULT_AD_SURFACE_BY_DASHBOARD = {
  admin: 'admin_dashboard',
  user: 'user_dashboard',
  freelancer: 'freelancer_dashboard',
  company: 'company_dashboard',
  agency: 'agency_dashboard',
  headhunter: 'headhunter_dashboard',
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDrawers, setOpenDrawers] = useState(() => new Set());

  const normalizedMenuSections = useMemo(() => normalizeMenuSections(menuSections), [menuSections]);
  const allMenuItems = useMemo(() => {
    return normalizedMenuSections.flatMap((section) =>
      section.items.map((item) => ({
        id: String(item.id),
        name: item.name,
        description: item.description,
        sectionId: item.sectionId,
        parentSectionId: item.parentSectionId ?? section.id,
        parentSectionLabel: item.parentSectionLabel ?? section.label,
        orderIndex: item.orderIndex ?? 0,
        sectionOrderIndex: item.sectionOrderIndex ?? section.orderIndex ?? 0,
        href: item.href,
        icon: item.icon,
        target: item.target,
      })),
    );
  }, [normalizedMenuSections]);
  const menuItemLookup = useMemo(() => {
    const map = new Map();
    allMenuItems.forEach((item) => {
      map.set(item.id, item);
    });
    return map;
  }, [allMenuItems]);

  const normalizedDashboardId = slugify(currentDashboard) || 'dashboard';
  const customizationStorageKey = `gigvora.dashboard.${normalizedDashboardId}.nav-customization`;
  const [customOrder, setCustomOrder] = useState([]);
  const [hiddenItemIds, setHiddenItemIds] = useState(() => new Set());
  const [loadedCustomizationKey, setLoadedCustomizationKey] = useState(null);

  useEffect(() => {
    const knownIds = new Set(allMenuItems.map((item) => item.id));

    if (!knownIds.size) {
      setCustomOrder([]);
      setHiddenItemIds(new Set());
      setLoadedCustomizationKey(customizationStorageKey);
      return;
    }

    if (loadedCustomizationKey !== customizationStorageKey) {
      const stored = loadStoredCustomization(customizationStorageKey);
      const storedOrder = stored.order.filter((id) => knownIds.has(id));
      const missing = allMenuItems
        .map((item) => item.id)
        .filter((id) => !storedOrder.includes(id));
      setCustomOrder([...storedOrder, ...missing]);
      setHiddenItemIds(new Set(stored.hidden.filter((id) => knownIds.has(id))));
      setLoadedCustomizationKey(customizationStorageKey);
      return;
    }

    setCustomOrder((previous) => {
      const filtered = previous.filter((id) => knownIds.has(id));
      const missing = allMenuItems
        .map((item) => item.id)
        .filter((id) => !filtered.includes(id));
      if (!missing.length && filtered.length === previous.length) {
        return previous;
      }
      return [...filtered, ...missing];
    });
    setHiddenItemIds((previous) => {
      const filtered = [...previous].filter((id) => knownIds.has(id));
      return new Set(filtered);
    });
  }, [allMenuItems, customizationStorageKey, loadedCustomizationKey]);

  useEffect(() => {
    if (loadedCustomizationKey !== customizationStorageKey) {
      return;
    }
    persistCustomization(customizationStorageKey, {
      order: customOrder,
      hidden: Array.from(hiddenItemIds),
    });
  }, [customOrder, hiddenItemIds, customizationStorageKey, loadedCustomizationKey]);

  const customizedMenuSections = useMemo(() => {
    if (!normalizedMenuSections.length) {
      return normalizedMenuSections;
    }

    const hidden = hiddenItemIds;
    const orderMap = new Map();
    customOrder.forEach((id, index) => {
      orderMap.set(id, index);
    });

    return normalizedMenuSections
      .map((section) => {
        const nextItems = section.items
          .filter((item) => !hidden.has(item.id))
          .sort((a, b) => {
            const orderA = orderMap.has(a.id) ? orderMap.get(a.id) : Number.MAX_SAFE_INTEGER;
            const orderB = orderMap.has(b.id) ? orderMap.get(b.id) : Number.MAX_SAFE_INTEGER;
            if (orderA !== orderB) {
              return orderA - orderB;
            }
            const sectionCompare = (a.sectionOrderIndex ?? 0) - (b.sectionOrderIndex ?? 0);
            if (sectionCompare !== 0) {
              return sectionCompare;
            }
            return (a.orderIndex ?? 0) - (b.orderIndex ?? 0);
          });

        return {
          ...section,
          items: nextItems,
        };
      })
      .filter((section) => section.items.length);
  }, [customOrder, hiddenItemIds, normalizedMenuSections]);

  const hasMenuCustomization = allMenuItems.length > 0;

  const [customizerOpen, setCustomizerOpen] = useState(false);
  const [customizerDraftOrder, setCustomizerDraftOrder] = useState([]);
  const [customizerDraftHidden, setCustomizerDraftHidden] = useState(() => new Set());
  const [draggingItemId, setDraggingItemId] = useState(null);
  const effectiveDraftOrder = useMemo(() => {
    if (!customizerDraftOrder.length) {
      return allMenuItems.map((item) => item.id);
    }
    const knownIds = new Set(allMenuItems.map((item) => item.id));
    const filtered = customizerDraftOrder.filter((id) => knownIds.has(id));
    const missing = allMenuItems
      .map((item) => item.id)
      .filter((id) => !filtered.includes(id));
    return [...filtered, ...missing];
  }, [allMenuItems, customizerDraftOrder]);

  const openCustomization = () => {
    if (!hasMenuCustomization) {
      return;
    }
    setCustomizerDraftOrder(customOrder.length ? [...customOrder] : allMenuItems.map((item) => item.id));
    setCustomizerDraftHidden(new Set(hiddenItemIds));
    setDraggingItemId(null);
    setCustomizerOpen(true);
  };

  const closeCustomization = () => {
    setCustomizerOpen(false);
    setDraggingItemId(null);
  };

  const handleCustomizationSave = () => {
    setCustomOrder((previous) => {
      const draft = customizerDraftOrder.length
        ? customizerDraftOrder
        : allMenuItems.map((item) => item.id);
      if (draft.join('|') === previous.join('|')) {
        return previous;
      }
      return [...draft];
    });
    setHiddenItemIds(new Set(customizerDraftHidden));
    closeCustomization();
  };

  const handleCustomizationReset = () => {
    setCustomizerDraftOrder(allMenuItems.map((item) => item.id));
    setCustomizerDraftHidden(new Set());
  };

  const handleDragStart = (itemId) => {
    setDraggingItemId(itemId);
  };

  const handleDragEnter = (itemId) => {
    setCustomizerDraftOrder((current) => {
      if (!draggingItemId || draggingItemId === itemId) {
        return current;
      }
      const fromIndex = current.indexOf(draggingItemId);
      const toIndex = current.indexOf(itemId);
      if (fromIndex === -1 || toIndex === -1) {
        return current;
      }
      const updated = [...current];
      updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, draggingItemId);
      return updated;
    });
  };

  const handleDragEnd = () => {
    setDraggingItemId(null);
  };

  const handleMoveItem = (itemId, direction) => {
    setCustomizerDraftOrder((current) => {
      const index = current.indexOf(itemId);
      if (index === -1) {
        return current;
      }
      const targetIndex = direction === 'up' ? Math.max(0, index - 1) : Math.min(current.length - 1, index + 1);
      if (targetIndex === index) {
        return current;
      }
      const updated = [...current];
      updated.splice(index, 1);
      updated.splice(targetIndex, 0, itemId);
      return updated;
    });
  };

  const handleToggleHidden = (itemId) => {
    setCustomizerDraftHidden((current) => {
      const next = new Set(current);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  useEffect(() => {
    if (!customizerOpen) {
      return undefined;
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeCustomization();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [customizerOpen]);

  useEffect(() => {
    setOpenDrawers((previous) => {
      if (!previous.size) {
        return previous;
      }
      const validIds = new Set(customizedMenuSections.map((section) => section.id));
      const filtered = new Set([...previous].filter((id) => validIds.has(id)));
      return filtered;
    });
  }, [customizedMenuSections]);

  useEffect(() => {
    if (!openDrawers.size && customizedMenuSections.length) {
      setOpenDrawers(new Set(customizedMenuSections.map((section) => section.id)));
    }
  }, [customizedMenuSections, openDrawers.size]);

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
  const dashboards = normalizeAvailableDashboards(availableDashboards);

  const sidebarContent = (
    <div className="flex h-full flex-col gap-6 overflow-y-auto px-6 py-6">
      <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} gap-4`}>
        <Link to="/" className="inline-flex items-center">
          <img src={gigvoraWordmark} alt="Gigvora" className="h-9 w-auto" />
        </Link>
        <div className="flex items-center gap-2">
          {hasMenuCustomization ? (
            <button
              type="button"
              onClick={openCustomization}
              className={`inline-flex items-center rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-blue-200 hover:text-blue-600 ${
                sidebarCollapsed ? 'hidden lg:inline-flex' : ''
              }`}
              aria-label="Customize navigation"
            >
              <AdjustmentsHorizontalIcon className="h-5 w-5" aria-hidden="true" />
              <span className="sr-only">Customize navigation</span>
            </button>
          ) : null}
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

      {sidebarCollapsed ? (
        <nav className="space-y-5">
          {customizedMenuSections.map((section) => (
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
          {customizedMenuSections.map((section) => {
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
            {dashboards.map((dashboard) => {
              const isActive = currentDashboard && dashboard.id === slugify(currentDashboard);
              return (
              <Link
                key={dashboard.id}
                to={dashboard.href}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  isActive
                    ? 'border-blue-400 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600'
                }`}
              >
                <ArrowLeftOnRectangleIcon className="h-4 w-4" />
                {dashboard.label}
              </Link>
            );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );

  const resolvedAdSurface = adSurface ?? DEFAULT_AD_SURFACE_BY_DASHBOARD[currentDashboard] ?? 'global_dashboard';

  return (
    <div className="relative flex min-h-screen flex-col bg-slate-50 text-slate-900 lg:flex-row">
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
          <div className="flex items-center gap-3">
            {description ? (
              <p className="hidden max-w-lg text-right text-sm text-slate-500 lg:block">{description}</p>
            ) : null}
            {hasMenuCustomization ? (
              <button
                type="button"
                onClick={openCustomization}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-500 transition hover:border-blue-200 hover:text-blue-600"
              >
                <AdjustmentsHorizontalIcon className="h-5 w-5" aria-hidden="true" />
                <span className="hidden sm:inline">Customize</span>
                <span className="sm:hidden">Layout</span>
              </button>
            ) : null}
          </div>
        </header>

      <main className="flex-1 bg-slate-50/60">{children}</main>
      </div>
      {resolvedAdSurface ? <AdPlacementRail surface={resolvedAdSurface} /> : null}
      <MessagingDock />
      {customizerOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 py-8">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Customize navigation</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Drag sections to reorder your dashboard shortcuts. Hidden items stay accessible from direct links.
                </p>
              </div>
              <button
                type="button"
                onClick={closeCustomization}
                className="inline-flex rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-blue-200 hover:text-blue-600"
                aria-label="Close customization panel"
              >
                <XMarkIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-5 max-h-[50vh] overflow-y-auto pr-1">
              <ul className="space-y-3">
                {effectiveDraftOrder.map((itemId) => {
                  const item = menuItemLookup.get(itemId);
                  if (!item) {
                    return null;
                  }
                  const isHidden = customizerDraftHidden.has(itemId);
                  return (
                    <li
                      key={itemId}
                      draggable
                      onDragStart={() => handleDragStart(itemId)}
                      onDragEnter={() => handleDragEnter(itemId)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(event) => event.preventDefault()}
                      className={`group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition ${
                        isHidden ? 'opacity-60' : 'hover:border-blue-200 hover:shadow-md'
                      }`}
                    >
                      <span className="flex items-center justify-center rounded-xl bg-slate-100 p-2 text-slate-500">
                        <Bars3Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div className="flex-1 overflow-hidden text-left">
                        <p className="truncate text-sm font-semibold text-slate-900">{item.name}</p>
                        <p className="truncate text-xs text-slate-500">{item.parentSectionLabel}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col gap-1">
                          <button
                            type="button"
                            onClick={() => handleMoveItem(itemId, 'up')}
                            className="inline-flex items-center justify-center rounded-full border border-slate-200 p-1 text-slate-500 transition hover:border-blue-200 hover:text-blue-600"
                            aria-label={`Move ${item.name} up`}
                          >
                            <ChevronUpIcon className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveItem(itemId, 'down')}
                            className="inline-flex items-center justify-center rounded-full border border-slate-200 p-1 text-slate-500 transition hover:border-blue-200 hover:text-blue-600"
                            aria-label={`Move ${item.name} down`}
                          >
                            <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleHidden(itemId)}
                          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition ${
                            isHidden
                              ? 'border-slate-200 bg-slate-50 text-slate-500 hover:border-blue-200 hover:text-blue-600'
                              : 'border-blue-200 bg-blue-50 text-blue-600 hover:border-blue-300 hover:bg-blue-100'
                          }`}
                        >
                          {isHidden ? 'Show' : 'Hide'}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-slate-500">
                {customizerDraftHidden.size
                  ? `${customizerDraftHidden.size} item${customizerDraftHidden.size === 1 ? '' : 's'} hidden`
                  : 'All navigation items visible'}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={handleCustomizationReset}
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-500 transition hover:border-blue-200 hover:text-blue-600"
                >
                  Reset order
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={closeCustomization}
                    className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-500 transition hover:border-blue-200 hover:text-blue-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCustomizationSave}
                    className="inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                  >
                    Save layout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
