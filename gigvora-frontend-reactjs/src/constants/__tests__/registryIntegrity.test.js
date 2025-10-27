import { describe, expect, it } from 'vitest';

import { ADMIN_BLOG_MENU_SECTIONS } from '../adminBlogMenu.js';
import { ADMIN_DASHBOARD_MENU_SECTIONS as ADMIN_MENU_SHORTCUTS, ADMIN_MENU_SECTIONS as ADMIN_COMMAND_MENU } from '../adminMenu.js';
import { ADMIN_MENU_SECTIONS as ADMIN_MENU_LIBRARY } from '../adminMenuSections.js';
import {
  AGENCY_CRM_MENU_SECTIONS,
  AGENCY_DASHBOARD_MENU,
  AGENCY_DASHBOARD_MENU_SECTIONS,
  AGENCY_ESCROW_MENU,
} from '../agencyDashboardMenu.js';
import { COMPANY_DASHBOARD_MENU_SECTIONS } from '../companyDashboardMenu.js';
import { BRAND_ASSETS, FAVICON_URL, LOGO_URL } from '../branding.js';
import {
  EMPLOYMENT_TYPES,
  MEMBER_STATUSES,
  PAY_FREQUENCIES,
  PAY_STATUSES,
  ASSIGNMENT_TYPES,
  ASSIGNMENT_STATUSES,
  GIG_STATUSES,
  AVAILABILITY_STATUSES,
  resolveOptionLabel,
} from '../agencyWorkforce.js';
import {
  CREATION_STUDIO_GROUPS,
  CREATION_STUDIO_STATUSES,
  CREATION_STUDIO_TYPES,
  getCreationStatus,
  getCreationType,
} from '../creationStudio.js';
import {
  DISPUTE_STAGE_OPTIONS,
  DISPUTE_STATUS_OPTIONS,
  DISPUTE_PRIORITY_OPTIONS,
  DISPUTE_ACTION_OPTIONS,
  DISPUTE_REASON_CODES,
  DISPUTE_TRANSACTION_RESOLUTIONS,
  DISPUTE_SORT_FIELDS,
  DISPUTE_SORT_DIRECTIONS,
  findDisputeOption,
} from '../disputes.js';
import {
  COMPOSER_OPTIONS,
  QUICK_EMOJIS,
  GIF_LIBRARY,
  ALLOWED_FEED_MEMBERSHIPS,
} from '../feedMeta.js';
import {
  PRIMARY_NAVIGATION,
  marketingNavigation,
  roleDashboardMapping,
  timelineAccessRoles,
  resolvePrimaryNavigation,
  resolvePrimaryRoleKey,
  buildRoleOptions,
  navigationGovernanceMatrix,
  createNavigationGovernanceMatrix,
} from '../navigation.js';
import { DASHBOARD_LINKS } from '../dashboardLinks.js';
import { DATABASE_STATUS_STYLES } from '../databaseStatusStyles.js';
import {
  GIGVORA_PROFILE_BANNER,
  GIGVORA_PROFILE_ADS,
  GIGVORA_PAGES_BANNER,
  GIGVORA_PAGES_ADS,
  GIGVORA_GROUPS_BANNER,
  GIGVORA_GROUPS_ADS,
} from '../marketing.js';
import { GIG_ORDER_STATUSES, GIG_ACTIVITY_TYPES, GIG_ESCROW_STATUSES } from '../gigOrders.js';
import { communitySpotlights } from '../../content/home/communitySpotlights.js';
import { createMenuRegistry } from '../menuSchema.js';

function expectFrozen(value) {
  expect(Object.isFrozen(value)).toBe(true);
}

describe('menu registries', () => {
  const registries = [
    ['Admin blog', ADMIN_BLOG_MENU_SECTIONS],
    ['Admin shortcuts', ADMIN_MENU_SHORTCUTS],
    ['Admin command modules', ADMIN_COMMAND_MENU],
    ['Admin menu library', ADMIN_MENU_LIBRARY],
    ['Agency dashboard sections', AGENCY_DASHBOARD_MENU_SECTIONS],
    ['Agency dashboard menu', AGENCY_DASHBOARD_MENU],
    ['Agency escrow menu', AGENCY_ESCROW_MENU],
    ['Agency CRM menu', AGENCY_CRM_MENU_SECTIONS],
    ['Company dashboard', COMPANY_DASHBOARD_MENU_SECTIONS],
  ];

  it.each(registries)('%s is immutable and well formed', (_, registry) => {
    expect(Array.isArray(registry)).toBe(true);
    expectFrozen(registry);

    const sectionIds = new Set();
    const itemIds = new Set();

    registry.forEach((section) => {
      expectFrozen(section);
      expect(typeof section.label).toBe('string');
      expect(section.label).not.toHaveLength(0);
      expect(Array.isArray(section.items)).toBe(true);
      expect(section.items.length).toBeGreaterThan(0);

      if (section.id) {
        expect(sectionIds.has(section.id)).toBe(false);
        sectionIds.add(section.id);
      }

      section.items.forEach((item) => {
        expectFrozen(item);
        expect(typeof item.id).toBe('string');
        expect(item.id).not.toHaveLength(0);
        expect(itemIds.has(item.id)).toBe(false);
        itemIds.add(item.id);
        expect(typeof item.name).toBe('string');
        expect(item.name).not.toHaveLength(0);

        if (item.href) {
          expect(item.href).toBe(item.href.trim());
          expect(['/', '#', 'h'].some((prefix) => item.href.startsWith(prefix))).toBe(true);
        } else {
          expect(typeof item.sectionId).toBe('string');
          expect(item.sectionId).not.toHaveLength(0);
        }

        if (item.tags) {
          expect(Array.isArray(item.tags)).toBe(true);
          const uniqueTags = new Set(item.tags);
          expect(uniqueTags.size).toBe(item.tags.length);
          item.tags.forEach((tag) => {
            expect(typeof tag).toBe('string');
            expect(tag).toBe(tag.trim());
          });
        }
      });
    });
  });

  it('rejects invalid menu definitions at build time', () => {
    expect(() =>
      createMenuRegistry(
        [
          {
            label: '',
            items: [{ name: 'Broken' }],
          },
        ],
        { moduleName: 'test-registry' },
      ),
    ).toThrowError();
  });
});

describe('navigation', () => {
  it('locks marketing navigation', () => {
    expect(Array.isArray(marketingNavigation)).toBe(true);
    expectFrozen(marketingNavigation);
    marketingNavigation.forEach((section) => {
      expectFrozen(section);
      section.sections.forEach((subsection) => {
        expect(Array.isArray(subsection.items)).toBe(true);
        expect(subsection.items.length).toBeGreaterThan(0);
        subsection.items.forEach((item) => {
          expectFrozen(item);
          expect(item.to.startsWith('/')).toBe(true);
        });
      });
    });
  });

  it('provides a frozen primary navigation object with search metadata', () => {
    expect(Object.isFrozen(PRIMARY_NAVIGATION)).toBe(true);
    expect(PRIMARY_NAVIGATION.search.placeholder).toMatch(/projects/i);
    expect(Array.isArray(PRIMARY_NAVIGATION.menus)).toBe(true);
    expect(PRIMARY_NAVIGATION.menus.length).toBeGreaterThanOrEqual(1);
  });

  it('provides frozen role mappings', () => {
    expectFrozen(roleDashboardMapping);
    expect(roleDashboardMapping.admin).toBe('/dashboard/admin');
    expect(Array.isArray(timelineAccessRoles)).toBe(true);
    expect(Object.isFrozen(timelineAccessRoles)).toBe(true);
  });

  it('locks navigation governance metadata', () => {
    expect(Object.isFrozen(navigationGovernanceMatrix)).toBe(true);
    expect(Array.isArray(navigationGovernanceMatrix.marketing)).toBe(true);
    const auditEntry = navigationGovernanceMatrix.marketing.find((item) => item.itemId === 'discover-connections');
    expect(auditEntry.analyticsId).toBe('discover.connections');
    expect(auditEntry.personas).toContain('mentor');
    expect(Array.isArray(navigationGovernanceMatrix.personaDashboards)).toBe(true);
  });

  it('resolves primary roles consistently', () => {
    expect(resolvePrimaryRoleKey({ primaryDashboard: 'Agency' })).toBe('agency');
    expect(resolvePrimaryRoleKey({ memberships: ['Freelancer', 'Agency'] })).toBe('freelancer');
    expect(resolvePrimaryRoleKey({})).toBe('user');
  });

  it('produces fresh governance matrices for runtime analytics', () => {
    const dynamicMatrix = createNavigationGovernanceMatrix();
    expect(Array.isArray(dynamicMatrix.marketing)).toBe(true);
    expect(dynamicMatrix).not.toBe(navigationGovernanceMatrix);
  });

  it('builds specialised navigation by role', () => {
    const adminNav = resolvePrimaryNavigation({ primaryDashboard: 'Admin' });
    expect(adminNav[0].id).toBe('dashboard');
    expect(adminNav.some((item) => item.id === 'policies')).toBe(true);

    const freelancerNav = resolvePrimaryNavigation({ primaryDashboard: 'freelancer' });
    expect(freelancerNav.some((item) => item.id === 'pipeline')).toBe(true);
    expect(freelancerNav.some((item) => item.id === 'portfolio')).toBe(true);

    const defaultNav = resolvePrimaryNavigation({ memberships: [] });
    expect(defaultNav[0].id).toBe('dashboard');
  });

  it('builds deduplicated role options with timeline flags', () => {
    const options = buildRoleOptions({ memberships: ['Agency', 'agency', 'User', 'Unknown'] });
    const keys = options.map((option) => option.key);
    expect(keys).toEqual(['agency', 'user']);
    const agencyOption = options.find((option) => option.key === 'agency');
    expect(agencyOption.timelineEnabled).toBe(true);
  });
});

describe('branding', () => {
  it('exposes immutable brand assets', () => {
    expectFrozen(BRAND_ASSETS);
    expect(BRAND_ASSETS.logo.src).toBe(LOGO_URL);
    expect(BRAND_ASSETS.favicon.src).toBe(FAVICON_URL);
    expect(BRAND_ASSETS.logo.alt).toMatch(/Gigvora/);
  });
});

describe('agency workforce constants', () => {
  const datasets = [
    EMPLOYMENT_TYPES,
    MEMBER_STATUSES,
    PAY_FREQUENCIES,
    PAY_STATUSES,
    ASSIGNMENT_TYPES,
    ASSIGNMENT_STATUSES,
    GIG_STATUSES,
    AVAILABILITY_STATUSES,
  ];

  it('keeps datasets frozen', () => {
    datasets.forEach((dataset) => {
      expect(Array.isArray(dataset)).toBe(true);
      expectFrozen(dataset);
      dataset.forEach((option) => {
        expectFrozen(option);
        expect(typeof option.value).toBe('string');
        expect(option.value).not.toHaveLength(0);
      });
    });
  });

  it('resolves option labels with sensible fallbacks', () => {
    expect(resolveOptionLabel(EMPLOYMENT_TYPES, 'contract')).toBe('Contract');
    expect(resolveOptionLabel(EMPLOYMENT_TYPES, 'missing', 'Unknown')).toBe('Unknown');
  });
});

describe('creation studio registry', () => {
  it('exposes immutable creation studio metadata', () => {
    [CREATION_STUDIO_TYPES, CREATION_STUDIO_STATUSES, CREATION_STUDIO_GROUPS].forEach((collection) => {
      expect(Array.isArray(collection)).toBe(true);
      expectFrozen(collection);
    });
  });

  it('resolves creation type and status helpers', () => {
    expect(getCreationType('gig')?.shortLabel).toBe('Gig');
    expect(getCreationStatus('published')?.badge).toContain('emerald');
    expect(getCreationType('missing')).toBeNull();
  });
});

describe('dispute constants', () => {
  const collections = [
    DISPUTE_STAGE_OPTIONS,
    DISPUTE_STATUS_OPTIONS,
    DISPUTE_PRIORITY_OPTIONS,
    DISPUTE_ACTION_OPTIONS,
    DISPUTE_REASON_CODES,
    DISPUTE_TRANSACTION_RESOLUTIONS,
    DISPUTE_SORT_FIELDS,
    DISPUTE_SORT_DIRECTIONS,
  ];

  it('keeps dispute collections immutable', () => {
    collections.forEach((collection) => {
      expect(Array.isArray(collection)).toBe(true);
      expectFrozen(collection);
    });
  });

  it('finds dispute options safely', () => {
    expect(findDisputeOption(DISPUTE_STATUS_OPTIONS, 'open')?.label).toContain('Open');
    expect(findDisputeOption(null, 'open')).toBeNull();
  });
});

describe('feed meta', () => {
  it('defines composer options and GIF library', () => {
    expectFrozen(COMPOSER_OPTIONS);
    expect(COMPOSER_OPTIONS.length).toBeGreaterThan(0);
    expect(Array.isArray(QUICK_EMOJIS)).toBe(true);
    expect(Object.isFrozen(QUICK_EMOJIS)).toBe(true);
    expectFrozen(GIF_LIBRARY);
    GIF_LIBRARY.forEach((gif) => {
      expect(gif.url.startsWith('https://')).toBe(true);
    });
  });

  it('exposes a static set of allowed memberships', () => {
    expect(ALLOWED_FEED_MEMBERSHIPS.has('user')).toBe(true);
    expect(ALLOWED_FEED_MEMBERSHIPS.has('Agency')).toBe(true);
    expect(Array.from(ALLOWED_FEED_MEMBERSHIPS)).toContain('mentor');
  });
});

describe('gig orders', () => {
  it('locks status datasets', () => {
    [GIG_ORDER_STATUSES, GIG_ACTIVITY_TYPES, GIG_ESCROW_STATUSES].forEach((collection) => {
      expect(Array.isArray(collection)).toBe(true);
      expectFrozen(collection);
      const values = new Set(collection.map((entry) => entry.value));
      expect(values.size).toBe(collection.length);
    });
  });
});

describe('marketing datasets', () => {
  const banners = [GIGVORA_PROFILE_BANNER, GIGVORA_PAGES_BANNER, GIGVORA_GROUPS_BANNER];
  const adCollections = [GIGVORA_PROFILE_ADS, GIGVORA_PAGES_ADS, GIGVORA_GROUPS_ADS];

  it('ensures banners are frozen and have CTAs', () => {
    banners.forEach((banner) => {
      expectFrozen(banner);
      expect(typeof banner.cta?.href).toBe('string');
      expect(banner.cta.href.startsWith('/')).toBe(true);
      expect(Array.isArray(banner.stats)).toBe(true);
    });
  });

  it('ensures ad collections carry metrics', () => {
    adCollections.forEach((ads) => {
      expectFrozen(ads);
      ads.forEach((ad) => {
        expect(Array.isArray(ad.metrics)).toBe(true);
        expect(ad.metrics.length).toBeGreaterThan(0);
      });
    });
  });
});

describe('dashboard helpers', () => {
  it('keeps database status styles and dashboard links frozen', () => {
    expectFrozen(DATABASE_STATUS_STYLES);
    expectFrozen(DASHBOARD_LINKS);
  });
});

describe('community spotlights', () => {
  it('keeps spotlight entries immutable and https sourced', () => {
    expectFrozen(communitySpotlights);
    communitySpotlights.forEach((spotlight) => {
      expectFrozen(spotlight);
      expect(spotlight.image.startsWith('https://')).toBe(true);
    });
  });
});
