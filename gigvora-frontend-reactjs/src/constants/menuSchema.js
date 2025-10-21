const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const globalCrypto = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;

function toSlug(input, fallbackPrefix) {
  const text = input && typeof input.toString === 'function' ? input.toString() : '';
  const base = text.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  if (base) {
    return base;
  }
  const random = globalCrypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
  return `${fallbackPrefix}-${random}`.replace(/[^a-z0-9]+/g, '-');
}

function normaliseId(source, fallbackPrefix) {
  const base = source ?? '';
  if (typeof base === 'string' && ID_PATTERN.test(base)) {
    return base;
  }
  return toSlug(base, fallbackPrefix);
}

function normaliseHref(href, moduleName, itemId) {
  if (href == null) {
    return undefined;
  }
  if (typeof href !== 'string') {
    throw new Error(`Menu item "${itemId}" in ${moduleName} has a non-string href.`);
  }
  const trimmed = href.trim();
  if (!trimmed) {
    throw new Error(`Menu item "${itemId}" in ${moduleName} must not have an empty href.`);
  }
  if (!(trimmed.startsWith('/') || trimmed.startsWith('#') || /^https?:\/\//.test(trimmed))) {
    throw new Error(
      `Menu item "${itemId}" in ${moduleName} must use an absolute/relative path, received "${trimmed}".`,
    );
  }
  return trimmed;
}

export function deepFreeze(value, seen = new WeakSet()) {
  if (value === null || typeof value !== 'object' || seen.has(value)) {
    return value;
  }

  seen.add(value);

  const propertyNames = Reflect.ownKeys(value);
  propertyNames.forEach((name) => {
    const descriptor = Object.getOwnPropertyDescriptor(value, name);
    if (!descriptor || typeof descriptor.value === 'undefined') {
      return;
    }
    deepFreeze(descriptor.value, seen);
  });

  return Object.freeze(value);
}

export function createMenuRegistry(sections, { moduleName = 'menu', requireSectionId = true } = {}) {
  if (!Array.isArray(sections)) {
    throw new Error(`${moduleName} menu sections must be an array.`);
  }

  const seenSectionIds = new Set();
  const seenItemIds = new Set();

  const normalisedSections = sections.map((section, sectionIndex) => {
    if (!section || typeof section !== 'object') {
      throw new Error(`${moduleName} section at index ${sectionIndex} must be an object.`);
    }

    const labelSource = section.label ?? section.name;
    if (!labelSource || typeof labelSource !== 'string') {
      throw new Error(`${moduleName} section at index ${sectionIndex} is missing a label.`);
    }
    const label = labelSource.trim();
    if (!label) {
      throw new Error(`${moduleName} section at index ${sectionIndex} must have a non-empty label.`);
    }

    const sectionId = normaliseId(section.id, label || `section-${sectionIndex}`);
    if (seenSectionIds.has(sectionId)) {
      throw new Error(`${moduleName} contains duplicate section id "${sectionId}".`);
    }
    seenSectionIds.add(sectionId);

    const items = Array.isArray(section.items) ? section.items : [];
    if (!items.length) {
      throw new Error(`${moduleName} section "${sectionId}" must contain at least one item.`);
    }

    const normalisedItems = items.map((item, itemIndex) => {
      if (!item || typeof item !== 'object') {
        throw new Error(`${moduleName} item at index ${itemIndex} within section "${sectionId}" must be an object.`);
      }

      const nameSource = item.name ?? item.label;
      if (!nameSource || typeof nameSource !== 'string') {
        throw new Error(
          `${moduleName} item at index ${itemIndex} within section "${sectionId}" must define a name or label string.`,
        );
      }
      const name = nameSource.trim();
      if (!name) {
        throw new Error(
          `${moduleName} item at index ${itemIndex} within section "${sectionId}" must define a non-empty name.`,
        );
      }

      const itemId = normaliseId(item.id, `${sectionId}-${name}`);
      if (seenItemIds.has(itemId)) {
        throw new Error(`${moduleName} contains duplicate item id "${itemId}".`);
      }
      seenItemIds.add(itemId);

      const href = normaliseHref(item.href, moduleName, itemId);

      let sectionAnchor = item.sectionId;
      if (sectionAnchor == null || sectionAnchor === '') {
        if (requireSectionId) {
          sectionAnchor = normaliseId(`${sectionId}-${name}`, `${sectionId}-${itemIndex}`);
        } else {
          sectionAnchor = sectionAnchor ?? undefined;
        }
      }

      if (requireSectionId && !href && !sectionAnchor) {
        throw new Error(`${moduleName} item "${itemId}" must declare a sectionId when no href is provided.`);
      }

      const tags = item.tags
        ? Array.from(
            new Set(
              item.tags
                .filter((tag) => tag != null)
                .map((tag) => {
                  const text = tag.toString().trim();
                  if (!text) {
                    throw new Error(`Menu item "${itemId}" in ${moduleName} has an empty tag.`);
                  }
                  return text;
                }),
            ),
          )
        : undefined;

      return deepFreeze({
        ...item,
        id: itemId,
        href,
        sectionId: sectionAnchor,
        ...(tags ? { tags } : {}),
        name,
      });
    });

    return deepFreeze({
      ...section,
      id: sectionId,
      label,
      items: normalisedItems,
    });
  });

  return deepFreeze(normalisedSections);
}

export function extractMenuItemIds(registry) {
  if (!Array.isArray(registry)) {
    return [];
  }
  const ids = [];
  registry.forEach((section) => {
    section.items?.forEach((item) => {
      ids.push(item.id);
    });
  });
  return ids;
}

export default createMenuRegistry;
