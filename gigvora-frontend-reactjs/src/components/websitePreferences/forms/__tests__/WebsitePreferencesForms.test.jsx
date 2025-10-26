import { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BasicsForm from '../BasicsForm.jsx';
import BrandForm from '../BrandForm.jsx';
import ContactForm from '../ContactForm.jsx';
import HeroForm from '../HeroForm.jsx';
import OffersForm from '../OffersForm.jsx';
import ProofForm from '../ProofForm.jsx';
import SeoForm from '../SeoForm.jsx';
import SocialForm from '../SocialForm.jsx';
import ContentSubscriptions from '../../personalization/ContentSubscriptions.jsx';
import { DEFAULT_SUBSCRIPTION_MODULES } from '../../defaults.js';

const baseSettings = {
  siteTitle: 'Launch Studio',
  tagline: 'Helping teams ship',
  siteSlug: 'launch-studio',
  published: false,
  language: 'en',
  customDomain: '',
};

const baseNavigation = {
  links: [
    { id: 'nav-1', label: 'Home', url: '/', openInNewTab: false },
  ],
};

const baseTheme = {
  primaryColor: '#000000',
  accentColor: '#ffffff',
  backgroundStyle: 'light',
  fontFamily: 'Inter',
  buttonShape: 'rounded',
  logoUrl: '',
  faviconUrl: '',
};

const baseSubscriptions = {
  digestTime: 'monday-08:00',
  autoPersonalize: true,
  modules: DEFAULT_SUBSCRIPTION_MODULES.map((module) => ({
    ...module,
    sampleContent: module.sampleContent?.map((item) => ({ ...item })) ?? [],
  })),
};

const baseHero = {
  kicker: 'New',
  headline: 'Build momentum',
  subheadline: 'We help ambitious teams launch.',
  primaryCtaLabel: 'Book intro',
  primaryCtaLink: '#contact',
  secondaryCtaLabel: 'View work',
  secondaryCtaLink: '#portfolio',
  backgroundImageUrl: '',
  media: { type: 'image', url: 'https://cdn.example.com/hero.jpg', alt: 'Team collaborating' },
};

const baseAbout = {
  title: 'About',
  body: 'We partner with founders to launch products.',
  highlights: [{ id: 'highlight-1', text: '50+ launches' }],
};

const baseServices = {
  items: [
    {
      id: 'service-1',
      name: 'Product sprint',
      summary: 'Launch in 6 weeks',
      startingPrice: '$15,000',
      deliveryTimeframe: '6 weeks',
      ctaLabel: 'Book',
      ctaLink: '#contact',
      featured: true,
    },
  ],
};

const baseTestimonials = {
  items: [
    {
      id: 'testimonial-1',
      name: 'Ava Chen',
      title: 'CEO',
      company: 'Launchly',
      quote: 'They shipped our product in record time.',
      avatarUrl: 'https://cdn.example.com/ava.jpg',
    },
  ],
};

const baseGallery = {
  items: [
    {
      id: 'gallery-1',
      title: 'Dashboard redesign',
      caption: 'Modern analytics suite',
      imageUrl: 'https://cdn.example.com/dashboard.png',
    },
  ],
};

const baseContact = {
  email: 'hello@gigvora.com',
  phone: '+1 555 0100',
  location: 'Remote',
  formRecipient: 'forms@gigvora.com',
  showForm: true,
  availabilityNote: 'Reply within 1 business day',
  bookingLink: 'https://cal.com/gigvora',
};

const baseSeo = {
  metaTitle: 'Gigvora — Launch Studio',
  metaDescription: 'Product launch partners for modern teams.',
  keywordsInput: 'product launch, design partner',
  ogImageUrl: 'https://cdn.example.com/og.png',
  twitterHandle: '@gigvora',
};

const baseSocial = {
  links: [
    {
      id: 'social-1',
      platform: 'LinkedIn',
      handle: '@gigvora',
      url: 'https://linkedin.com/company/gigvora',
    },
  ],
};

function BasicsHarness({ initialSettings = baseSettings, initialNavigation = baseNavigation, canEdit = true }) {
  const [settings, setSettings] = useState(initialSettings);
  const [navigation, setNavigation] = useState(initialNavigation);
  return (
    <BasicsForm
      settings={settings}
      navigation={navigation}
      onSettingsChange={setSettings}
      onNavigationChange={(next) => setNavigation((prev) => ({ ...prev, ...next }))}
      canEdit={canEdit}
    />
  );
}

function BrandHarness({ initialTheme = baseTheme, canEdit = true }) {
  const [theme, setTheme] = useState(initialTheme);
  return <BrandForm theme={theme} onChange={setTheme} canEdit={canEdit} />;
}

function HeroHarness({ initialHero = baseHero, initialAbout = baseAbout, canEdit = true }) {
  const [heroState, setHeroState] = useState(initialHero);
  const [aboutState, setAboutState] = useState(initialAbout);
  return (
    <HeroForm
      hero={heroState}
      about={aboutState}
      onHeroChange={setHeroState}
      onAboutChange={setAboutState}
      canEdit={canEdit}
    />
  );
}

function OffersHarness({ initialServices = baseServices, canEdit = true }) {
  const [services, setServices] = useState(initialServices);
  return <OffersForm services={services} onChange={setServices} canEdit={canEdit} />;
}

function ProofHarness({ initialTestimonials = baseTestimonials, initialGallery = baseGallery, canEdit = true }) {
  const [testimonials, setTestimonials] = useState(initialTestimonials);
  const [gallery, setGallery] = useState(initialGallery);
  return (
    <ProofForm
      testimonials={testimonials}
      gallery={gallery}
      onTestimonialsChange={setTestimonials}
      onGalleryChange={setGallery}
      canEdit={canEdit}
    />
  );
}

function ContactHarness({ initialContact = baseContact, canEdit = true }) {
  const [contact, setContact] = useState(initialContact);
  return <ContactForm contact={contact} onChange={setContact} canEdit={canEdit} />;
}

function SeoHarness({ initialSeo = baseSeo, canEdit = true }) {
  const [seo, setSeo] = useState(initialSeo);
  return <SeoForm seo={seo} onChange={setSeo} canEdit={canEdit} />;
}

function SocialHarness({ initialSocial = baseSocial, canEdit = true }) {
  const [social, setSocial] = useState(initialSocial);
  return (
    <SocialForm
      social={social}
      onChange={(next) => setSocial((prev) => ({ ...prev, ...next }))}
      canEdit={canEdit}
    />
  );
}

function ContentSubscriptionsHarness({ initialSubscriptions = baseSubscriptions, canEdit = true }) {
  const [subscriptions, setSubscriptions] = useState(initialSubscriptions);
  return (
    <ContentSubscriptions
      subscriptions={subscriptions}
      onChange={setSubscriptions}
      canEdit={canEdit}
    />
  );
}

describe('BasicsForm', () => {
  it('updates settings fields and toggles publish status with live state', async () => {
    const user = userEvent.setup();

    render(<BasicsHarness />);

    const nameInput = screen.getByDisplayValue('Launch Studio');
    await user.clear(nameInput);
    await user.type(nameInput, 'Nova Studio');

    await waitFor(() => {
      expect(screen.getByDisplayValue('Nova Studio')).toBeInTheDocument();
    });

    const statusToggle = screen.getByRole('button', { name: /draft/i });
    await user.click(statusToggle);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /published/i })).toBeEnabled();
    });
  });

  it('adds and edits navigation links', async () => {
    const user = userEvent.setup();

    render(<BasicsHarness initialNavigation={{ links: [] }} />);

    await user.click(screen.getByRole('button', { name: /add link/i }));

    await waitFor(() => {
      expect(screen.getAllByDisplayValue('Page')).toHaveLength(1);
    });

    const labelInput = screen.getByDisplayValue('Page');
    await user.clear(labelInput);
    await user.type(labelInput, 'Overview');

    await waitFor(() => {
      expect(screen.getByDisplayValue('Overview')).toBeInTheDocument();
    });
  });

  it('disables actions when editing is locked', () => {
    const onSettingsChange = vi.fn();
    const onNavigationChange = vi.fn();

    render(
      <BasicsForm
        settings={baseSettings}
        navigation={baseNavigation}
        onSettingsChange={onSettingsChange}
        onNavigationChange={onNavigationChange}
        canEdit={false}
      />,
    );

    expect(screen.getByRole('button', { name: /add link/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /toggle/i })).toBeDisabled();
  });
});

describe('BrandForm', () => {
  it('updates theme selections', async () => {
    const user = userEvent.setup();

    render(<BrandHarness />);

    const darkButton = screen.getByRole('button', { name: 'Dark' });
    await user.click(darkButton);

    await waitFor(() => {
      expect(darkButton.className).toContain('bg-slate-900');
    });

    const fontSelect = screen.getByDisplayValue('Inter');
    await user.selectOptions(fontSelect, 'Manrope');

    await waitFor(() => {
      expect(screen.getByDisplayValue('Manrope')).toBeInTheDocument();
    });
  });

  it('prevents updates when canEdit is false', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<BrandForm theme={baseTheme} onChange={onChange} canEdit={false} />);

    const backgroundButtons = screen.getAllByRole('button');
    await user.click(backgroundButtons[0]);

    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('ContentSubscriptions', () => {
  it('enables paused modules and updates cadence controls', async () => {
    const user = userEvent.setup();

    render(<ContentSubscriptionsHarness />);

    await user.click(screen.getByRole('button', { name: 'Learning paths' }));

    const pausedToggle = screen.getByRole('button', { name: /Paused/i });
    await user.click(pausedToggle);

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /Paused/i })).toBeNull();
    });

    const weeklyButton = screen.getByRole('button', { name: 'Weekly digest' });
    await user.click(weeklyButton);

    await waitFor(() => {
      expect(weeklyButton.className).toContain('bg-slate-900');
    });
  });

  it('adds custom feeds to the module list', async () => {
    const user = userEvent.setup();

    render(<ContentSubscriptionsHarness />);

    await user.type(screen.getByPlaceholderText('Series name (e.g. Studio radio)'), 'Studio radio');
    await user.type(
      screen.getByPlaceholderText('Describe what subscribers receive'),
      'Behind-the-scenes audio drops',
    );

    const addButton = screen.getByRole('button', { name: /Add feed/i });
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Studio radio' })).toBeInTheDocument();
    });
  });
});

describe('HeroForm', () => {
  it('allows highlight editing and media selection', async () => {
    const user = userEvent.setup();

    render(<HeroHarness />);

    await user.click(screen.getByRole('button', { name: /add highlight/i }));

    await waitFor(() => {
      const highlightInputs = screen.getAllByRole('textbox', { name: '' });
      expect(highlightInputs.some((input) => input.value === 'Add highlight')).toBe(true);
    });

    const highlightInput = screen.getByDisplayValue('50+ launches');
    await user.clear(highlightInput);
    await user.type(highlightInput, 'Global rollouts');

    await waitFor(() => {
      expect(screen.getByDisplayValue('Global rollouts')).toBeInTheDocument();
    });

    const videoButton = screen.getByRole('button', { name: 'Video' });
    await user.click(videoButton);

    await waitFor(() => {
      expect(videoButton.className).toContain('text-accent');
    });
  });
});

describe('OffersForm', () => {
  it('creates new offers with sensible defaults', async () => {
    const user = userEvent.setup();

    render(<OffersHarness initialServices={{ items: [] }} />);

    await user.click(screen.getByRole('button', { name: /add service/i }));

    await waitFor(() => {
      expect(screen.getByDisplayValue('New service')).toBeInTheDocument();
    });
  });

  it('updates existing offer fields', async () => {
    const user = userEvent.setup();

    render(<OffersHarness />);

    const checkbox = screen.getByRole('checkbox', { name: /featured/i });
    expect(checkbox).toBeChecked();
    await user.click(checkbox);

    await waitFor(() => {
      expect(checkbox).not.toBeChecked();
    });
  });
});

describe('ProofForm', () => {
  it('manages testimonial and gallery entries', async () => {
    const user = userEvent.setup();

    render(<ProofHarness />);

    await user.click(screen.getByRole('button', { name: /add quote/i }));

    await waitFor(() => {
      expect(screen.getByDisplayValue('Client')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /add visual/i }));

    await waitFor(() => {
      expect(screen.getByDisplayValue('New visual')).toBeInTheDocument();
    });
  });
});

describe('ContactForm', () => {
  it('updates contact details and toggles the form visibility', async () => {
    const user = userEvent.setup();

    render(<ContactHarness />);

    const phoneInput = screen.getByDisplayValue('+1 555 0100');
    await user.clear(phoneInput);
    await user.type(phoneInput, '+1 555 0110');

    await waitFor(() => {
      expect(screen.getByDisplayValue('+1 555 0110')).toBeInTheDocument();
    });

    const toggleButton = screen.getByRole('button', { name: /enabled/i });
    await user.click(toggleButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /disabled/i })).toBeEnabled();
    });
  });
});

describe('SeoForm', () => {
  it('captures metadata updates', async () => {
    const user = userEvent.setup();

    render(<SeoHarness />);

    const titleInput = screen.getByDisplayValue('Gigvora — Launch Studio');
    await user.clear(titleInput);
    await user.type(titleInput, 'Nova Launch Studio');

    await waitFor(() => {
      expect(screen.getByDisplayValue('Nova Launch Studio')).toBeInTheDocument();
    });

    const twitterInput = screen.getByPlaceholderText('@handle');
    await user.clear(twitterInput);
    await user.type(twitterInput, '@nova');

    await waitFor(() => {
      expect(screen.getByDisplayValue('@nova')).toBeInTheDocument();
    });
  });
});

describe('SocialForm', () => {
  it('adds and edits social profiles', async () => {
    const user = userEvent.setup();

    render(<SocialHarness initialSocial={{ links: [] }} />);

    await user.click(screen.getByRole('button', { name: /add profile/i }));

    await waitFor(() => {
      expect(screen.getAllByPlaceholderText('@username')).toHaveLength(1);
    });

    const handleInput = screen.getByPlaceholderText('@username');
    await user.type(handleInput, '@gigvoraHQ');

    await waitFor(() => {
      expect(screen.getByDisplayValue('@gigvoraHQ')).toBeInTheDocument();
    });
  });
});
