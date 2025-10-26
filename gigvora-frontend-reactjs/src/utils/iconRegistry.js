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

const ICON_REGISTRY = new Map(
  [
    ['banknotesicon', BanknotesIcon],
    ['bellicon', BellIcon],
    ['briefcaseicon', BriefcaseIcon],
    ['buildingoffice2icon', BuildingOffice2Icon],
    ['chartbaricon', ChartBarIcon],
    ['chatbubbleleftrighticon', ChatBubbleLeftRightIcon],
    ['foldericon', FolderIcon],
    ['globealticon', GlobeAltIcon],
    ['homeicon', HomeIcon],
    ['lightbulbicon', LightBulbIcon],
    ['megaphoneicon', MegaphoneIcon],
    ['presentationchartbaricon', PresentationChartBarIcon],
    ['rocketlaunchicon', RocketLaunchIcon],
    ['shieldcheckicon', ShieldCheckIcon],
    ['sparklesicon', SparklesIcon],
    ['squares2x2icon', Squares2X2Icon],
    ['usersicon', UsersIcon],
    ['rssicon', RssIcon],
  ].map(([key, component]) => [key, component]),
);

function normaliseName(name) {
  if (!name) {
    return '';
  }
  if (typeof name === 'string') {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '');
  }
  return '';
}

export function resolveIconComponent(name, fallback = SparklesIcon) {
  if (typeof name === 'function') {
    return name;
  }
  const key = normaliseName(name);
  if (key && ICON_REGISTRY.has(key)) {
    return ICON_REGISTRY.get(key);
  }
  return fallback;
}

export default ICON_REGISTRY;
