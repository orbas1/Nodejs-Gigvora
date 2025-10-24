import { ValidationError } from './errors.js';
import { sanitiseNotificationsConfig } from '../validation/platformSettingsSchema.js';

function buildIssue(path, message, code = 'invalid_input') {
  return { path, message, code };
}

function throwValidation(path, message, code) {
  throw new ValidationError('Request validation failed.', { issues: [buildIssue(path, message, code)] });
}

const TRUE_VALUES = new Set(['true', '1', 'yes', 'y', 'on']);
const FALSE_VALUES = new Set(['false', '0', 'no', 'n', 'off']);

function ensureOptionalBoolean(value, { label }) {
  if (value == null || value === '') {
    return undefined;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    if (value === 1) return true;
    if (value === 0) return false;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (TRUE_VALUES.has(normalized)) {
      return true;
    }
    if (FALSE_VALUES.has(normalized)) {
      return false;
    }
  }
  throwValidation(label, 'must be a boolean.', 'invalid_boolean');
}

function ensureOptionalNumber(value, { label, min, max, precision, integer = false }) {
  if (value == null || value === '') {
    return undefined;
  }
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) {
    throwValidation(label, 'must be a valid number.', 'invalid_number');
  }
  let sanitized = numeric;
  if (typeof precision === 'number') {
    const multiplier = 10 ** precision;
    sanitized = Math.round(sanitized * multiplier) / multiplier;
  }
  if (integer && !Number.isInteger(sanitized)) {
    throwValidation(label, 'must be an integer.', 'invalid_integer');
  }
  if (typeof min === 'number' && sanitized < min) {
    throwValidation(label, `must be greater than or equal to ${min}.`, 'too_small');
  }
  if (typeof max === 'number' && sanitized > max) {
    throwValidation(label, `must be less than or equal to ${max}.`, 'too_big');
  }
  return sanitized;
}

function ensureOptionalString(value, {
  label,
  maxLength,
  toUpperCase = false,
  toLowerCase = false,
  allowEmpty = false,
  required = false,
} = {}) {
  if (value == null) {
    if (required) {
      throwValidation(label, 'is required.', 'invalid_type');
    }
    return undefined;
  }
  let text = `${value}`.trim();
  if (!allowEmpty && text.length === 0) {
    if (required) {
      throwValidation(label, 'is required.', 'invalid_type');
    }
    return undefined;
  }
  if (allowEmpty && text.length === 0) {
    return '';
  }
  if (typeof maxLength === 'number' && text.length > maxLength) {
    throwValidation(label, `must be at most ${maxLength} characters long.`, 'too_big');
  }
  if (toUpperCase) {
    text = text.toUpperCase();
  } else if (toLowerCase) {
    text = text.toLowerCase();
  }
  return text;
}

function ensureOptionalStringArray(values, { label, maxItemLength = 255, unique = true } = {}) {
  if (values == null) {
    return undefined;
  }
  const list = Array.isArray(values) ? values : [values];
  const sanitized = list
    .map((item, index) =>
      ensureOptionalString(item, {
        label: `${label}[${index}]`,
        maxLength: maxItemLength,
        required: true,
      }),
    )
    .filter(Boolean);
  if (unique) {
    const seen = new Set();
    return sanitized.filter((item) => {
      if (seen.has(item)) {
        return false;
      }
      seen.add(item);
      return true;
    });
  }
  return sanitized;
}

export function sanitizeAdminDashboardFilters(query = {}) {
  const sanitized = {};
  const lookback = ensureOptionalNumber(query.lookbackDays, {
    label: 'lookbackDays',
    min: 1,
    max: 365,
    integer: true,
  });
  if (lookback !== undefined) {
    sanitized.lookbackDays = lookback;
  }
  const eventWindow = ensureOptionalNumber(query.eventWindowDays, {
    label: 'eventWindowDays',
    min: 1,
    max: 365,
    integer: true,
  });
  if (eventWindow !== undefined) {
    sanitized.eventWindowDays = eventWindow;
  }
  return sanitized;
}

function sanitizeCommissionsSettings(input = {}) {
  const result = {};
  const enabled = ensureOptionalBoolean(input.enabled, { label: 'commissions.enabled' });
  if (enabled !== undefined) result.enabled = enabled;
  const rate = ensureOptionalNumber(input.rate, {
    label: 'commissions.rate',
    min: 0,
    max: 100,
    precision: 2,
  });
  if (rate !== undefined) result.rate = rate;
  const currency = ensureOptionalString(input.currency, {
    label: 'commissions.currency',
    maxLength: 3,
    toUpperCase: true,
  });
  if (currency !== undefined) result.currency = currency;
  const minimumFee = ensureOptionalNumber(input.minimumFee, {
    label: 'commissions.minimumFee',
    min: 0,
    precision: 2,
  });
  if (minimumFee !== undefined) result.minimumFee = minimumFee;
  const providerControls = ensureOptionalBoolean(input.providerControlsServicemanPay, {
    label: 'commissions.providerControlsServicemanPay',
  });
  if (providerControls !== undefined) result.providerControlsServicemanPay = providerControls;
  const minimumRate = ensureOptionalNumber(input.servicemanMinimumRate, {
    label: 'commissions.servicemanMinimumRate',
    min: 0,
    max: 100,
    precision: 2,
  });
  if (minimumRate !== undefined) result.servicemanMinimumRate = minimumRate;
  const notes = ensureOptionalString(input.servicemanPayoutNotes, {
    label: 'commissions.servicemanPayoutNotes',
    maxLength: 1000,
  });
  if (notes !== undefined) result.servicemanPayoutNotes = notes;
  return result;
}

function sanitizeStripeSettings(input = {}) {
  const stripe = {};
  const publishableKey = ensureOptionalString(input.publishableKey, {
    label: 'payments.stripe.publishableKey',
    maxLength: 255,
  });
  if (publishableKey !== undefined) stripe.publishableKey = publishableKey;
  const secretKey = ensureOptionalString(input.secretKey, {
    label: 'payments.stripe.secretKey',
    maxLength: 255,
  });
  if (secretKey !== undefined) stripe.secretKey = secretKey;
  const webhookSecret = ensureOptionalString(input.webhookSecret, {
    label: 'payments.stripe.webhookSecret',
    maxLength: 255,
  });
  if (webhookSecret !== undefined) stripe.webhookSecret = webhookSecret;
  const accountId = ensureOptionalString(input.accountId, {
    label: 'payments.stripe.accountId',
    maxLength: 255,
  });
  if (accountId !== undefined) stripe.accountId = accountId;
  return stripe;
}

function sanitizeEscrowSettings(input = {}) {
  const escrow = {};
  const apiKey = ensureOptionalString(input.apiKey, {
    label: 'payments.escrow_com.apiKey',
    maxLength: 255,
  });
  if (apiKey !== undefined) escrow.apiKey = apiKey;
  const apiSecret = ensureOptionalString(input.apiSecret, {
    label: 'payments.escrow_com.apiSecret',
    maxLength: 255,
  });
  if (apiSecret !== undefined) escrow.apiSecret = apiSecret;
  const sandbox = ensureOptionalBoolean(input.sandbox, {
    label: 'payments.escrow_com.sandbox',
  });
  if (sandbox !== undefined) escrow.sandbox = sandbox;
  return escrow;
}

function sanitizePaymentSettings(input = {}) {
  const payments = {};
  const provider = ensureOptionalString(input.provider, {
    label: 'payments.provider',
    maxLength: 50,
  });
  if (provider !== undefined) payments.provider = provider;
  if (input.stripe != null) {
    const stripe = sanitizeStripeSettings(input.stripe);
    if (Object.keys(stripe).length > 0) {
      payments.stripe = stripe;
    }
  }
  if (input.escrow_com != null) {
    const escrow = sanitizeEscrowSettings(input.escrow_com);
    if (Object.keys(escrow).length > 0) {
      payments.escrow_com = escrow;
    }
  }
  return payments;
}

function sanitizeSmtpSettings(input = {}) {
  const smtp = {};
  const host = ensureOptionalString(input.host, {
    label: 'smtp.host',
    maxLength: 255,
  });
  if (host !== undefined) smtp.host = host;
  const port = ensureOptionalNumber(input.port, {
    label: 'smtp.port',
    min: 1,
    max: 65535,
    integer: true,
  });
  if (port !== undefined) smtp.port = port;
  const secure = ensureOptionalBoolean(input.secure, { label: 'smtp.secure' });
  if (secure !== undefined) smtp.secure = secure;
  const username = ensureOptionalString(input.username, {
    label: 'smtp.username',
    maxLength: 255,
  });
  if (username !== undefined) smtp.username = username;
  const password = ensureOptionalString(input.password, {
    label: 'smtp.password',
    maxLength: 255,
  });
  if (password !== undefined) smtp.password = password;
  const fromAddress = ensureOptionalString(input.fromAddress, {
    label: 'smtp.fromAddress',
    maxLength: 255,
  });
  if (fromAddress !== undefined) smtp.fromAddress = fromAddress;
  const fromName = ensureOptionalString(input.fromName, {
    label: 'smtp.fromName',
    maxLength: 255,
  });
  if (fromName !== undefined) smtp.fromName = fromName;
  return smtp;
}

export function sanitizePlatformSettingsInput(body = {}) {
  const sanitized = {};
  if (body.commissions != null) {
    const commissions = sanitizeCommissionsSettings(body.commissions);
    if (Object.keys(commissions).length > 0) {
      sanitized.commissions = commissions;
    }
  }
  if (body.payments != null) {
    const payments = sanitizePaymentSettings(body.payments);
    if (Object.keys(payments).length > 0) {
      sanitized.payments = payments;
    }
  }
  if (body.smtp != null) {
    const smtp = sanitizeSmtpSettings(body.smtp);
    if (Object.keys(smtp).length > 0) {
      sanitized.smtp = smtp;
    }
  }
  if (body.homepage != null) {
    const homepage = sanitizeHomepageSettingsInput(body.homepage);
    if (Object.keys(homepage).length > 0) {
      sanitized.homepage = homepage;
    }
  }
  if (body.subscriptions != null) sanitized.subscriptions = body.subscriptions;
  if (body.storage != null) sanitized.storage = body.storage;
  if (body.app != null) sanitized.app = body.app;
  if (body.database != null) sanitized.database = body.database;
  if (body.featureToggles != null) sanitized.featureToggles = body.featureToggles;
  if (body.maintenance != null) sanitized.maintenance = body.maintenance;
  if (body.notifications != null) {
    sanitized.notifications = sanitiseNotificationsConfig(body.notifications);
  }
  return sanitized;
}

function sanitizeHomepageStats(stats) {
  if (stats == null) return undefined;
  const list = Array.isArray(stats) ? stats : [stats];
  return list.map((stat, index) => {
    const label = ensureOptionalString(stat?.label, {
      label: `hero.stats[${index}].label`,
      maxLength: 120,
      required: true,
    });
    const value = ensureOptionalNumber(stat?.value, {
      label: `hero.stats[${index}].value`,
      min: 0,
      max: 1_000_000_000,
      precision: 2,
    });
    if (value === undefined) {
      throwValidation(`hero.stats[${index}].value`, 'must be provided.', 'invalid_number');
    }
    const suffix = ensureOptionalString(stat?.suffix, {
      label: `hero.stats[${index}].suffix`,
      maxLength: 16,
    });
    const id = ensureOptionalString(stat?.id, {
      label: `hero.stats[${index}].id`,
      maxLength: 120,
    });
    return {
      ...(id !== undefined ? { id } : {}),
      label,
      value,
      ...(suffix !== undefined ? { suffix } : {}),
    };
  });
}

function sanitizeHomepageValueProps(items) {
  if (items == null) return undefined;
  const list = Array.isArray(items) ? items : [items];
  const sanitized = list
    .map((item, index) => {
      const title = ensureOptionalString(item?.title, {
        label: `valueProps[${index}].title`,
        maxLength: 160,
      });
      const description = ensureOptionalString(item?.description, {
        label: `valueProps[${index}].description`,
        maxLength: 320,
      });
      if (!title && !description) {
        return null;
      }
      const id = ensureOptionalString(item?.id, {
        label: `valueProps[${index}].id`,
        maxLength: 120,
      });
      const icon = ensureOptionalString(item?.icon, {
        label: `valueProps[${index}].icon`,
        maxLength: 120,
      });
      const ctaLabel = ensureOptionalString(item?.ctaLabel, {
        label: `valueProps[${index}].ctaLabel`,
        maxLength: 120,
      });
      const ctaHref = ensureOptionalString(item?.ctaHref, {
        label: `valueProps[${index}].ctaHref`,
        maxLength: 2048,
      });
      const mediaUrl = ensureOptionalString(item?.mediaUrl, {
        label: `valueProps[${index}].mediaUrl`,
        maxLength: 2048,
      });
      const mediaAlt = ensureOptionalString(item?.mediaAlt, {
        label: `valueProps[${index}].mediaAlt`,
        maxLength: 255,
      });
      return {
        ...(id !== undefined ? { id } : {}),
        ...(title ? { title } : {}),
        ...(description ? { description } : {}),
        ...(icon !== undefined ? { icon } : {}),
        ...(ctaLabel !== undefined ? { ctaLabel } : {}),
        ...(ctaHref !== undefined ? { ctaHref } : {}),
        ...(mediaUrl !== undefined ? { mediaUrl } : {}),
        ...(mediaAlt !== undefined ? { mediaAlt } : {}),
      };
    })
    .filter(Boolean);
  return sanitized.length > 0 ? sanitized : undefined;
}

function sanitizeHomepageQuickLinks(items) {
  if (items == null) return undefined;
  const list = Array.isArray(items) ? items : [items];
  const sanitized = list
    .map((item, index) => {
      const label = ensureOptionalString(item?.label, {
        label: `quickLinks[${index}].label`,
        maxLength: 120,
      });
      const href = ensureOptionalString(item?.href, {
        label: `quickLinks[${index}].href`,
        maxLength: 2048,
      });
      if (!label && !href) {
        return null;
      }
      const target = ensureOptionalString(item?.target, {
        label: `quickLinks[${index}].target`,
        maxLength: 16,
        toLowerCase: true,
      });
      const id = ensureOptionalString(item?.id, {
        label: `quickLinks[${index}].id`,
        maxLength: 120,
      });
      return {
        ...(id !== undefined ? { id } : {}),
        ...(label ? { label } : {}),
        ...(href ? { href } : {}),
        ...(target ? { target } : {}),
      };
    })
    .filter(Boolean);
  return sanitized.length > 0 ? sanitized : undefined;
}

function sanitizeHomepageTestimonials(items) {
  if (items == null) return undefined;
  const list = Array.isArray(items) ? items : [items];
  const sanitized = list
    .map((item, index) => {
      const quote = ensureOptionalString(item?.quote, {
        label: `testimonials[${index}].quote`,
        maxLength: 500,
      });
      const authorName = ensureOptionalString(item?.authorName, {
        label: `testimonials[${index}].authorName`,
        maxLength: 160,
      });
      if (!quote && !authorName) {
        return null;
      }
      const id = ensureOptionalString(item?.id, {
        label: `testimonials[${index}].id`,
        maxLength: 120,
      });
      const authorRole = ensureOptionalString(item?.authorRole, {
        label: `testimonials[${index}].authorRole`,
        maxLength: 160,
      });
      const avatarUrl = ensureOptionalString(item?.avatarUrl, {
        label: `testimonials[${index}].avatarUrl`,
        maxLength: 2048,
      });
      const highlight = ensureOptionalBoolean(item?.highlight, {
        label: `testimonials[${index}].highlight`,
      });
      return {
        ...(id !== undefined ? { id } : {}),
        ...(quote ? { quote } : {}),
        ...(authorName ? { authorName } : {}),
        ...(authorRole ? { authorRole } : {}),
        ...(avatarUrl ? { avatarUrl } : {}),
        ...(highlight !== undefined ? { highlight } : {}),
      };
    })
    .filter(Boolean);
  return sanitized.length > 0 ? sanitized : undefined;
}

function sanitizeHomepageFaqs(items) {
  if (items == null) return undefined;
  const list = Array.isArray(items) ? items : [items];
  const sanitized = list
    .map((item, index) => {
      const question = ensureOptionalString(item?.question, {
        label: `faqs[${index}].question`,
        maxLength: 240,
      });
      const answer = ensureOptionalString(item?.answer, {
        label: `faqs[${index}].answer`,
        maxLength: 1000,
      });
      if (!question && !answer) {
        return null;
      }
      const id = ensureOptionalString(item?.id, {
        label: `faqs[${index}].id`,
        maxLength: 120,
      });
      return {
        ...(id !== undefined ? { id } : {}),
        ...(question ? { question } : {}),
        ...(answer ? { answer } : {}),
      };
    })
    .filter(Boolean);
  return sanitized.length > 0 ? sanitized : undefined;
}

function sanitizeHomepageSeo(input = {}) {
  const result = {};
  const title = ensureOptionalString(input.title, {
    label: 'seo.title',
    maxLength: 160,
  });
  if (title !== undefined) result.title = title;
  const description = ensureOptionalString(input.description, {
    label: 'seo.description',
    maxLength: 320,
  });
  if (description !== undefined) result.description = description;
  const keywords = ensureOptionalStringArray(input.keywords, {
    label: 'seo.keywords',
    maxItemLength: 60,
  });
  if (keywords !== undefined) result.keywords = keywords;
  const ogImageUrl = ensureOptionalString(input.ogImageUrl, {
    label: 'seo.ogImageUrl',
    maxLength: 2048,
  });
  if (ogImageUrl !== undefined) result.ogImageUrl = ogImageUrl;
  return result;
}

function sanitizeHomepageFeatureBullets(items, sectionIndex) {
  if (items == null) return undefined;
  const list = Array.isArray(items) ? items : [items];
  const sanitized = list
    .map((item, index) => {
      const text = ensureOptionalString(typeof item === 'string' ? item : item?.text ?? item?.label, {
        label: `featureSections[${sectionIndex}].bullets[${index}]`,
        maxLength: 280,
      });
      if (!text) {
        return null;
      }
      const id = ensureOptionalString(item?.id, {
        label: `featureSections[${sectionIndex}].bullets[${index}].id`,
        maxLength: 120,
      });
      return {
        ...(id !== undefined ? { id } : {}),
        text,
      };
    })
    .filter(Boolean);
  return sanitized.length > 0 ? sanitized : undefined;
}

function sanitizeHomepageFeatures(items) {
  if (items == null) return undefined;
  const list = Array.isArray(items) ? items : [items];
  const sanitized = list
    .map((item, index) => {
      const title = ensureOptionalString(item?.title, {
        label: `featureSections[${index}].title`,
        maxLength: 160,
      });
      const description = ensureOptionalString(item?.description, {
        label: `featureSections[${index}].description`,
        maxLength: 320,
      });
      if (!title && !description) {
        return null;
      }
      const id = ensureOptionalString(item?.id, {
        label: `featureSections[${index}].id`,
        maxLength: 120,
      });
      const mediaType = ensureOptionalString(item?.mediaType, {
        label: `featureSections[${index}].mediaType`,
        maxLength: 32,
        toLowerCase: true,
      });
      const mediaUrl = ensureOptionalString(item?.mediaUrl, {
        label: `featureSections[${index}].mediaUrl`,
        maxLength: 2048,
      });
      const mediaAlt = ensureOptionalString(item?.mediaAlt, {
        label: `featureSections[${index}].mediaAlt`,
        maxLength: 255,
      });
      const bullets = sanitizeHomepageFeatureBullets(item?.bullets, index);
      return {
        ...(id !== undefined ? { id } : {}),
        ...(title ? { title } : {}),
        ...(description ? { description } : {}),
        ...(mediaType ? { mediaType } : {}),
        ...(mediaUrl ? { mediaUrl } : {}),
        ...(mediaAlt ? { mediaAlt } : {}),
        ...(bullets ? { bullets } : {}),
      };
    })
    .filter(Boolean);
  return sanitized.length > 0 ? sanitized : undefined;
}

export function sanitizeHomepageSettingsInput(body = {}) {
  const result = {};
  if (body.announcementBar != null) {
    const enabled = ensureOptionalBoolean(body.announcementBar.enabled, {
      label: 'announcementBar.enabled',
    });
    const message = ensureOptionalString(body.announcementBar.message, {
      label: 'announcementBar.message',
      maxLength: 240,
    });
    const ctaLabel = ensureOptionalString(body.announcementBar.ctaLabel, {
      label: 'announcementBar.ctaLabel',
      maxLength: 120,
    });
    const ctaHref = ensureOptionalString(body.announcementBar.ctaHref, {
      label: 'announcementBar.ctaHref',
      maxLength: 2048,
    });
    const announcement = {};
    if (enabled !== undefined) announcement.enabled = enabled;
    if (message !== undefined) announcement.message = message;
    if (ctaLabel !== undefined) announcement.ctaLabel = ctaLabel;
    if (ctaHref !== undefined) announcement.ctaHref = ctaHref;
    if (Object.keys(announcement).length > 0) {
      result.announcementBar = announcement;
    }
  }

  if (body.hero != null) {
    const hero = {};
    const title = ensureOptionalString(body.hero.title, {
      label: 'hero.title',
      maxLength: 160,
    });
    if (title !== undefined) hero.title = title;
    const subtitle = ensureOptionalString(body.hero.subtitle, {
      label: 'hero.subtitle',
      maxLength: 320,
    });
    if (subtitle !== undefined) hero.subtitle = subtitle;
    const primaryCtaLabel = ensureOptionalString(body.hero.primaryCtaLabel, {
      label: 'hero.primaryCtaLabel',
      maxLength: 120,
    });
    if (primaryCtaLabel !== undefined) hero.primaryCtaLabel = primaryCtaLabel;
    const primaryCtaHref = ensureOptionalString(body.hero.primaryCtaHref, {
      label: 'hero.primaryCtaHref',
      maxLength: 2048,
    });
    if (primaryCtaHref !== undefined) hero.primaryCtaHref = primaryCtaHref;
    const secondaryCtaLabel = ensureOptionalString(body.hero.secondaryCtaLabel, {
      label: 'hero.secondaryCtaLabel',
      maxLength: 120,
    });
    if (secondaryCtaLabel !== undefined) hero.secondaryCtaLabel = secondaryCtaLabel;
    const secondaryCtaHref = ensureOptionalString(body.hero.secondaryCtaHref, {
      label: 'hero.secondaryCtaHref',
      maxLength: 2048,
    });
    if (secondaryCtaHref !== undefined) hero.secondaryCtaHref = secondaryCtaHref;
    const backgroundImageUrl = ensureOptionalString(body.hero.backgroundImageUrl, {
      label: 'hero.backgroundImageUrl',
      maxLength: 2048,
    });
    if (backgroundImageUrl !== undefined) hero.backgroundImageUrl = backgroundImageUrl;
    const backgroundImageAlt = ensureOptionalString(body.hero.backgroundImageAlt, {
      label: 'hero.backgroundImageAlt',
      maxLength: 255,
    });
    if (backgroundImageAlt !== undefined) hero.backgroundImageAlt = backgroundImageAlt;
    const overlayOpacity = ensureOptionalNumber(body.hero.overlayOpacity, {
      label: 'hero.overlayOpacity',
      min: 0,
      max: 1,
      precision: 2,
    });
    if (overlayOpacity !== undefined) hero.overlayOpacity = overlayOpacity;
    const stats = sanitizeHomepageStats(body.hero.stats);
    if (stats !== undefined) hero.stats = stats;
    if (Object.keys(hero).length > 0) {
      result.hero = hero;
    }
  }

  const valueProps = sanitizeHomepageValueProps(body.valueProps);
  if (valueProps !== undefined) result.valueProps = valueProps;

  const features = sanitizeHomepageFeatures(body.featureSections);
  if (features !== undefined) result.featureSections = features;

  const testimonials = sanitizeHomepageTestimonials(body.testimonials);
  if (testimonials !== undefined) result.testimonials = testimonials;

  const faqs = sanitizeHomepageFaqs(body.faqs);
  if (faqs !== undefined) result.faqs = faqs;

  const quickLinks = sanitizeHomepageQuickLinks(body.quickLinks);
  if (quickLinks !== undefined) result.quickLinks = quickLinks;

  if (body.seo != null) {
    const seo = sanitizeHomepageSeo(body.seo);
    if (Object.keys(seo).length > 0) {
      result.seo = seo;
    }
  }

  return result;
}

function sanitizeAffiliateTiers(items) {
  if (items == null) return undefined;
  const list = Array.isArray(items) ? items : [items];
  const sanitized = list.map((item, index) => {
    const name = ensureOptionalString(item?.name, {
      label: `tiers[${index}].name`,
      maxLength: 120,
      required: true,
    });
    const id = ensureOptionalString(item?.id, {
      label: `tiers[${index}].id`,
      maxLength: 120,
    });
    const minValue = ensureOptionalNumber(item?.minValue, {
      label: `tiers[${index}].minValue`,
      min: 0,
      precision: 2,
    });
    const maxValue = ensureOptionalNumber(item?.maxValue, {
      label: `tiers[${index}].maxValue`,
      min: 0,
      precision: 2,
    });
    const rate = ensureOptionalNumber(item?.rate, {
      label: `tiers[${index}].rate`,
      min: 0,
      max: 100,
      precision: 2,
    });
    return {
      ...(id !== undefined ? { id } : {}),
      name,
      ...(minValue !== undefined ? { minValue } : {}),
      ...(maxValue !== undefined ? { maxValue } : {}),
      ...(rate !== undefined ? { rate } : {}),
    };
  });
  return sanitized;
}

function sanitizeAffiliatePayouts(input = {}) {
  const payouts = {};
  const frequency = ensureOptionalString(input.frequency, {
    label: 'payouts.frequency',
    maxLength: 32,
    toLowerCase: true,
  });
  if (frequency !== undefined) payouts.frequency = frequency;
  const minimumThreshold = ensureOptionalNumber(input.minimumPayoutThreshold, {
    label: 'payouts.minimumPayoutThreshold',
    min: 0,
    precision: 2,
  });
  if (minimumThreshold !== undefined) payouts.minimumPayoutThreshold = minimumThreshold;
  const autoApprove = ensureOptionalBoolean(input.autoApprove, {
    label: 'payouts.autoApprove',
  });
  if (autoApprove !== undefined) payouts.autoApprove = autoApprove;
  if (input.recurrence != null) {
    const recurrence = {};
    const type = ensureOptionalString(input.recurrence.type, {
      label: 'payouts.recurrence.type',
      maxLength: 32,
      toLowerCase: true,
    });
    if (type !== undefined) recurrence.type = type;
    const limit = ensureOptionalNumber(input.recurrence.limit, {
      label: 'payouts.recurrence.limit',
      min: 1,
      max: 120,
      integer: true,
    });
    if (limit !== undefined) recurrence.limit = limit;
    if (Object.keys(recurrence).length > 0) {
      payouts.recurrence = recurrence;
    }
  }
  return payouts;
}

function sanitizeAffiliateCompliance(input = {}) {
  const compliance = {};
  const requiredDocuments = ensureOptionalStringArray(input.requiredDocuments, {
    label: 'compliance.requiredDocuments',
    maxItemLength: 120,
  });
  if (requiredDocuments !== undefined) compliance.requiredDocuments = requiredDocuments;
  const twoFactor = ensureOptionalBoolean(input.twoFactorRequired, {
    label: 'compliance.twoFactorRequired',
  });
  if (twoFactor !== undefined) compliance.twoFactorRequired = twoFactor;
  const payoutKyc = ensureOptionalBoolean(input.payoutKyc, {
    label: 'compliance.payoutKyc',
  });
  if (payoutKyc !== undefined) compliance.payoutKyc = payoutKyc;
  return compliance;
}

export function sanitizeAffiliateSettingsInput(body = {}) {
  const result = {};
  const enabled = ensureOptionalBoolean(body.enabled, { label: 'enabled' });
  if (enabled !== undefined) result.enabled = enabled;
  const defaultRate = ensureOptionalNumber(body.defaultCommissionRate, {
    label: 'defaultCommissionRate',
    min: 0,
    max: 100,
    precision: 2,
  });
  if (defaultRate !== undefined) result.defaultCommissionRate = defaultRate;
  const referralWindowDays = ensureOptionalNumber(body.referralWindowDays, {
    label: 'referralWindowDays',
    min: 1,
    max: 365,
    integer: true,
  });
  if (referralWindowDays !== undefined) result.referralWindowDays = referralWindowDays;
  const currency = ensureOptionalString(body.currency, {
    label: 'currency',
    maxLength: 3,
    toUpperCase: true,
  });
  if (currency !== undefined) result.currency = currency;
  if (body.payouts != null) {
    const payouts = sanitizeAffiliatePayouts(body.payouts);
    if (Object.keys(payouts).length > 0) {
      result.payouts = payouts;
    }
  }
  const tiers = sanitizeAffiliateTiers(body.tiers);
  if (tiers !== undefined) result.tiers = tiers;
  if (body.compliance != null) {
    const compliance = sanitizeAffiliateCompliance(body.compliance);
    if (Object.keys(compliance).length > 0) {
      result.compliance = compliance;
    }
  }
  return result;
}

