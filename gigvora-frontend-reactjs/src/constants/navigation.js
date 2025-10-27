import {
  BanknotesIcon,
  BellIcon,
  BriefcaseIcon,
  BuildingOffice2Icon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  FolderIcon,
  GlobeAltIcon,
  HomeIcon,
  LightBulbIcon,
  MegaphoneIcon,
  PresentationChartBarIcon,
  RocketLaunchIcon,
  ShieldCheckIcon,
  SparklesIcon,
  Squares2X2Icon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { RssIcon } from '@heroicons/react/24/outline';

import { deepFreeze } from './menuSchema.js';
import {
  MARKETING_NAVIGATION as SHARED_MARKETING_NAVIGATION,
  MARKETING_SEARCH as SHARED_MARKETING_SEARCH,
  ROLE_DASHBOARD_MAPPING,
  TIMELINE_ACCESS_ROLES,
  resolvePrimaryNavigation as resolvePrimaryNavigationDefinition,
  resolvePrimaryRoleKey as resolvePrimaryRoleKeyDefinition,
  buildRoleOptions as buildRoleOptionsDefinition,
  createNavigationGovernanceMatrix as createNavigationGovernanceMatrixDefinition,
  NAVIGATION_GOVERNANCE_BLUEPRINT as SHARED_NAVIGATION_GOVERNANCE_BLUEPRINT,
} from '@shared-contracts/domain/platform/navigation-governance.js';

const ICON_COMPONENTS = {
  home: HomeIcon,
  rss: RssIcon,
  'squares-2x2': Squares2X2Icon,
  sparkles: SparklesIcon,
  'chat-bubble': ChatBubbleLeftRightIcon,
  bell: BellIcon,
  'shield-check': ShieldCheckIcon,
  briefcase: BriefcaseIcon,
  'chart-bar': ChartBarIcon,
  folder: FolderIcon,
  'presentation-chart': PresentationChartBarIcon,
  banknotes: BanknotesIcon,
  users: UsersIcon,
  'light-bulb': LightBulbIcon,
  building: BuildingOffice2Icon,
  megaphone: MegaphoneIcon,
  rocket: RocketLaunchIcon,
  globe: GlobeAltIcon,
};

function resolveIconComponent(iconKey) {
  return ICON_COMPONENTS[iconKey] ?? SparklesIcon;
}

function decorateMarketingMenu(menu) {
  return {
    ...menu,
    sections: menu.sections.map((section) => ({
      ...section,
      items: section.items.map((item) => ({
        ...item,
        icon: resolveIconComponent(item.icon),
      })),
    })),
  };
}

const marketingNavigationData = deepFreeze(SHARED_MARKETING_NAVIGATION.map(decorateMarketingMenu));
const marketingSearchConfig = deepFreeze({ ...SHARED_MARKETING_SEARCH });

export const marketingNavigation = marketingNavigationData;
export const MARKETING_SEARCH = marketingSearchConfig;
export const PRIMARY_NAVIGATION = deepFreeze({
  search: marketingSearchConfig,
  menus: marketingNavigationData,
});

export const roleDashboardMapping = ROLE_DASHBOARD_MAPPING;
export const timelineAccessRoles = TIMELINE_ACCESS_ROLES;
export const navigationGovernanceMatrix = SHARED_NAVIGATION_GOVERNANCE_BLUEPRINT;

export function resolvePrimaryRoleKey(session) {
  return resolvePrimaryRoleKeyDefinition(session);
}

export function resolvePrimaryNavigation(session) {
  return resolvePrimaryNavigationDefinition(session).map((entry) => ({
    ...entry,
    icon: resolveIconComponent(entry.icon),
  }));
}

export function buildRoleOptions(session) {
  return buildRoleOptionsDefinition(session);
}

export function createNavigationGovernanceMatrix() {
  return createNavigationGovernanceMatrixDefinition();
}
