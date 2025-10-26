import { resolveIconComponent } from './iconRegistry.js';

function normaliseId(label, identifier) {
  if (identifier && typeof identifier === 'string') {
    return identifier.trim();
  }
  if (!label) {
    return '';
  }
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function transformLink(node) {
  if (!node || node.displayType !== 'link' || !node.url) {
    return null;
  }
  return {
    name: node.label,
    description: node.description,
    to: node.url,
    icon: resolveIconComponent(node.icon ?? node.metadata?.icon),
  };
}

function transformSection(node) {
  if (!node || node.displayType !== 'section') {
    return null;
  }
  const items = Array.isArray(node.children) ? node.children.map(transformLink).filter(Boolean) : [];
  if (!items.length) {
    return null;
  }
  return {
    title: node.label,
    items,
  };
}

function transformMenu(node) {
  if (!node || node.displayType !== 'menu') {
    return null;
  }
  const sections = Array.isArray(node.children) ? node.children.map(transformSection).filter(Boolean) : [];
  if (!sections.length) {
    return null;
  }
  return {
    id: normaliseId(node.label, node.metadata?.identifier),
    label: node.label,
    description: node.description,
    theme: node.metadata?.theme ?? {},
    sections,
  };
}

function transformSearch(node) {
  if (!node || node.displayType !== 'search') {
    return null;
  }
  const metadata = node.metadata ?? {};
  return {
    id: normaliseId(node.label, metadata.id ?? metadata.identifier ?? node.id),
    label: node.label ?? 'Search',
    placeholder: metadata.placeholder ?? 'Search Gigvora',
    ariaLabel: metadata.ariaLabel ?? node.label ?? 'Search Gigvora',
    to: node.url ?? metadata.to ?? '/search',
  };
}

export function transformMarketingNavigation(navigation, { fallbackMenus = [], fallbackSearch = null } = {}) {
  if (!navigation || navigation.format !== 'tree' || !Array.isArray(navigation.tree)) {
    return {
      menus: fallbackMenus,
      search: fallbackSearch,
    };
  }

  const menus = [];
  let search = null;

  navigation.tree
    .slice()
    .sort((a, b) => {
      const orderDelta = (a?.orderIndex ?? 0) - (b?.orderIndex ?? 0);
      if (orderDelta !== 0) {
        return orderDelta;
      }
      const aId = Number.isFinite(Number(a?.id)) ? Number(a.id) : 0;
      const bId = Number.isFinite(Number(b?.id)) ? Number(b.id) : 0;
      return aId - bId;
    })
    .forEach((node) => {
      if (node.displayType === 'search' && !search) {
        search = transformSearch(node) ?? search;
        return;
      }
      const menu = transformMenu(node);
      if (menu) {
        menus.push(menu);
      }
    });

  return {
    menus: menus.length ? menus : fallbackMenus,
    search: search ?? fallbackSearch,
  };
}

export default transformMarketingNavigation;
