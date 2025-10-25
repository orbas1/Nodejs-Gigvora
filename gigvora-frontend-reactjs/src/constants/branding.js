import edulureLogo from '../assets/branding/edulure-logo.svg';
import edulureLogo2x from '../assets/branding/edulure-logo@2x.svg';
import { deepFreeze } from './menuSchema.js';

export const BRAND_ASSETS = deepFreeze({
  logo: {
    src: edulureLogo,
    srcSet: `${edulureLogo} 1x, ${edulureLogo2x} 2x`,
    alt: 'Gigvora logo',
    type: 'image/svg+xml',
    width: 180,
    height: 48,
  },
  favicon: {
    src: 'https://i.ibb.co/DHNkxF5D/3.png',
    type: 'image/png',
    sizes: '64x64',
  },
});

export const LOGO_URL = BRAND_ASSETS.logo.src;
export const LOGO_SRCSET = BRAND_ASSETS.logo.srcSet;
export const FAVICON_URL = BRAND_ASSETS.favicon.src;

export default BRAND_ASSETS;
