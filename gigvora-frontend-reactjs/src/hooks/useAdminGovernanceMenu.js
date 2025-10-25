import { useMemo } from 'react';
import { deriveAdminAccess } from '../utils/adminAccess.js';

function normaliseMenuConfig(menuConfig) {
  return (Array.isArray(menuConfig) ? menuConfig : []).map((section) => ({
    ...section,
    items: Array.isArray(section?.items) ? section.items : [],
  }));
}

function hasPermission(required, granted) {
  if (!Array.isArray(required) || !required.length) {
    return true;
  }

  if (!Array.isArray(granted) || !granted.length) {
    return false;
  }

  return required.some((value) => granted.includes(value));
}

function filterMenuItems(items, access) {
  const {
    hasAdminAccess,
    hasAdminSeat,
    normalizedPermissions,
    normalizedRoles,
  } = access;

  return items
    .filter((item) => {
      if (!item) {
        return false;
      }
      if (item.hidden) {
        return false;
      }
      if (item.requireAdminAccess !== false && !hasAdminAccess) {
        return false;
      }
      if (item.requiresAdminSeat && !hasAdminSeat) {
        return false;
      }
      if (!hasPermission(item.requiredPermissions, normalizedPermissions)) {
        return false;
      }
      if (!hasPermission(item.requiredRoles, normalizedRoles)) {
        return false;
      }
      return true;
    })
    .map((item) => ({ ...item }));
}

function filterMenuSections(menuConfig, access) {
  return normaliseMenuConfig(menuConfig)
    .map((section) => {
      const items = filterMenuItems(section.items, access);
      if (!items.length && section?.hideWhenEmpty) {
        return null;
      }
      return {
        ...section,
        items,
      };
    })
    .filter(Boolean);
}

function deriveSectionAnchors(explicitSections, menuSections) {
  if (Array.isArray(explicitSections) && explicitSections.length) {
    return explicitSections;
  }

  const anchors = [];
  const seen = new Set();

  menuSections.forEach((section) => {
    section.items.forEach((item) => {
      const id = item.sectionId || item.id;
      if (!id || seen.has(id)) {
        return;
      }
      seen.add(id);
      anchors.push({ id, title: item.name || id });
    });
  });

  return anchors;
}

export default function useAdminGovernanceMenu({ session, menuConfig, sections }) {
  return useMemo(() => {
    const access = deriveAdminAccess(session);
    const filteredSections = filterMenuSections(menuConfig, access);
    const derivedSections = deriveSectionAnchors(sections, filteredSections);

    return {
      access,
      menuSections: filteredSections,
      sections: derivedSections,
    };
  }, [menuConfig, sections, session]);
}
