import PropTypes from 'prop-types';

export const navigationLinkShape = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  label: PropTypes.string,
  url: PropTypes.string,
  openInNewTab: PropTypes.bool,
});

export const serviceItemShape = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  name: PropTypes.string,
  startingPrice: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  tagline: PropTypes.string,
  buttonLabel: PropTypes.string,
  buttonLink: PropTypes.string,
  timeline: PropTypes.string,
});

export const testimonialItemShape = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  name: PropTypes.string,
  role: PropTypes.string,
  company: PropTypes.string,
  quote: PropTypes.string,
  headshotUrl: PropTypes.string,
});

export const galleryItemShape = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  title: PropTypes.string,
  caption: PropTypes.string,
  imageUrl: PropTypes.string,
});

export const socialLinkShape = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  platform: PropTypes.string,
  handle: PropTypes.string,
  url: PropTypes.string,
});

export const websitePreferencesShape = PropTypes.shape({
  settings: PropTypes.shape({
    siteTitle: PropTypes.string,
    tagline: PropTypes.string,
    siteSlug: PropTypes.string,
    published: PropTypes.bool,
    language: PropTypes.string,
    customDomain: PropTypes.string,
  }),
  theme: PropTypes.shape({
    primaryColor: PropTypes.string,
    accentColor: PropTypes.string,
    backgroundStyle: PropTypes.string,
    fontFamily: PropTypes.string,
    buttonShape: PropTypes.string,
    logoUrl: PropTypes.string,
    faviconUrl: PropTypes.string,
  }),
  hero: PropTypes.shape({
    kicker: PropTypes.string,
    headline: PropTypes.string,
    subheadline: PropTypes.string,
    primaryCtaLabel: PropTypes.string,
    primaryCtaLink: PropTypes.string,
    secondaryCtaLabel: PropTypes.string,
    secondaryCtaLink: PropTypes.string,
    backgroundImageUrl: PropTypes.string,
    media: PropTypes.shape({
      type: PropTypes.string,
      url: PropTypes.string,
      alt: PropTypes.string,
    }),
  }),
  about: PropTypes.shape({
    title: PropTypes.string,
    body: PropTypes.string,
    highlights: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        text: PropTypes.string,
      }),
    ),
  }),
  navigation: PropTypes.shape({
    links: PropTypes.arrayOf(navigationLinkShape),
  }),
  services: PropTypes.shape({
    items: PropTypes.arrayOf(serviceItemShape),
  }),
  testimonials: PropTypes.shape({
    items: PropTypes.arrayOf(testimonialItemShape),
  }),
  gallery: PropTypes.shape({
    items: PropTypes.arrayOf(galleryItemShape),
  }),
  contact: PropTypes.shape({
    email: PropTypes.string,
    phone: PropTypes.string,
    location: PropTypes.string,
    formRecipient: PropTypes.string,
    showForm: PropTypes.bool,
    availabilityNote: PropTypes.string,
    bookingLink: PropTypes.string,
  }),
  seo: PropTypes.shape({
    metaTitle: PropTypes.string,
    metaDescription: PropTypes.string,
    keywordsInput: PropTypes.string,
    ogImageUrl: PropTypes.string,
    twitterHandle: PropTypes.string,
  }),
  social: PropTypes.shape({
    links: PropTypes.arrayOf(socialLinkShape),
  }),
  updatedAt: PropTypes.string,
});

export const WEBSITE_SECTION_IDS = [
  'basics',
  'brand',
  'hero',
  'offers',
  'proof',
  'contact',
  'seo',
  'social',
];

export default websitePreferencesShape;
