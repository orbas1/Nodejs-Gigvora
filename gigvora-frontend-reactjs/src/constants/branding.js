import { deepFreeze } from './menuSchema.js';

export const BRAND_ASSETS = deepFreeze({
  logo: {
    src: 'https://i.ibb.co/cnGdLYb/Gigvora-Logo.png',
    alt: 'Gigvora logo',
    type: 'image/png',
    width: 512,
    height: 164,
  },
  favicon: {
    src: 'https://i.ibb.co/XrLy0pyZ/3.png',
    type: 'image/png',
    sizes: '64x64',
  },
});

export const LOGO_URL = BRAND_ASSETS.logo.src;
export const FAVICON_URL = BRAND_ASSETS.favicon.src;

export default BRAND_ASSETS;
