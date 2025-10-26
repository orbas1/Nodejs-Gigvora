import PropTypes from 'prop-types';
import { LOGO_URL } from '../constants/branding.js';

const DEFAULT_NAV_LINKS = [
  { label: 'Product tour', href: '#product-tour' },
  { label: 'Outcomes', href: '#impact-insights' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Stories', href: '/blog' },
];

const DEFAULT_STATS = [
  { label: 'Verified specialists', value: '12,400+', helper: 'Across 34 countries' },
  { label: 'Median launch time', value: '9 days', helper: 'From brief to delivery' },
  { label: 'Enterprise NPS', value: '68', helper: 'Rolling 90-day window' },
];

const DEFAULT_TRUST_BADGES = [
  { label: 'SOC 2 Type II', description: 'Continuous compliance & logging' },
  { label: 'GDPR aligned', description: 'Cross-border privacy residency' },
  { label: '99.98% uptime', description: 'Monitored across 14 regions' },
];

function StatHighlight({ label, value, helper }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 shadow-[0_20px_45px_-35px_rgba(15,23,42,0.7)] backdrop-blur">
      <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">{label}</dt>
      <dd className="mt-2 text-2xl font-semibold text-white">{value}</dd>
      {helper ? <p className="mt-1 text-xs text-white/70">{helper}</p> : null}
    </div>
  );
}

StatHighlight.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  helper: PropTypes.string,
};

StatHighlight.defaultProps = {
  helper: undefined,
};

function TrustBadge({ label, description }) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-slate-200/30 bg-white/80 p-4 text-left shadow-lg shadow-slate-900/5 backdrop-blur">
      <span className="text-sm font-semibold text-slate-900">{label}</span>
      <p className="text-xs text-slate-600">{description}</p>
    </div>
  );
}

TrustBadge.propTypes = {
  label: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
};

function SocialProof({ logos }) {
  if (!logos?.length) {
    return null;
  }

  return (
    <div className="mt-12 flex flex-wrap items-center justify-center gap-x-10 gap-y-6 text-xs text-white/70">
      <span className="uppercase tracking-[0.35em] text-white/50">Trusted by</span>
      {logos.map((logo) => (
        <span key={logo.label} className="flex items-center gap-2">
          {logo.icon ? <logo.icon className="h-4 w-4 text-white/60" aria-hidden="true" /> : null}
          <span className="font-semibold text-white/80">{logo.label}</span>
        </span>
      ))}
    </div>
  );
}

SocialProof.propTypes = {
  logos: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      icon: PropTypes.elementType,
    }),
  ),
};

SocialProof.defaultProps = {
  logos: undefined,
};

function HeroMedia({ media }) {
  if (!media) {
    return (
      <div className="relative flex h-full items-center justify-center">
        <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-br from-sky-500/40 via-violet-500/30 to-indigo-600/40 blur-3xl" />
        <div className="relative flex w-full max-w-xl flex-col gap-5 rounded-[2.5rem] border border-white/10 bg-white/10 p-6 shadow-2xl shadow-slate-900/40 backdrop-blur-xl">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/60">
            <span>Community velocity</span>
            <span>Live signal</span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-left text-white">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-[11px] uppercase tracking-wider text-white/50">Talent pipeline</p>
              <p className="mt-1 text-3xl font-semibold">412</p>
              <p className="mt-1 text-xs text-white/60">Active briefs with verified leads</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-[11px] uppercase tracking-wider text-white/50">Engagement rate</p>
              <p className="mt-1 text-3xl font-semibold">4.7%</p>
              <p className="mt-1 text-xs text-white/60">Cross-channel conversion uplift</p>
            </div>
            <div className="col-span-2 rounded-2xl border border-white/10 bg-gradient-to-r from-white/10 via-white/5 to-white/10 p-4">
              <p className="text-[11px] uppercase tracking-wider text-white/50">Executive highlight</p>
              <p className="mt-1 text-base font-semibold">“Gigvora has become the operating layer for our go-to-market teams.”</p>
              <p className="mt-2 text-xs text-white/60">— Maya Serrano, Chief Experience Officer · Northshore Creative</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (media.type === 'image') {
    return (
      <div className="relative flex h-full items-center justify-center">
        <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-br from-sky-500/40 via-violet-500/30 to-indigo-600/40 blur-3xl" />
        <img
          src={media.src}
          alt={media.alt ?? ''}
          className="relative max-h-[540px] w-full rounded-[2.5rem] border border-white/10 object-cover shadow-2xl shadow-slate-900/40"
        />
      </div>
    );
  }

  if (media.type === 'video') {
    return (
      <div className="relative flex h-full items-center justify-center">
        <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-br from-sky-500/40 via-violet-500/30 to-indigo-600/40 blur-3xl" />
        <video
          className="relative aspect-[16/10] w-full rounded-[2.5rem] border border-white/10 object-cover shadow-2xl shadow-slate-900/40"
          autoPlay
          muted
          loop
          playsInline
        >
          {media.sources?.map((source) => (
            <source key={source.src} src={source.src} type={source.type} />
          ))}
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  return null;
}

HeroMedia.propTypes = {
  media: PropTypes.shape({
    type: PropTypes.oneOf(['image', 'video']),
    src: PropTypes.string,
    alt: PropTypes.string,
    sources: PropTypes.arrayOf(
      PropTypes.shape({
        src: PropTypes.string.isRequired,
        type: PropTypes.string,
      }),
    ),
  }),
};

HeroMedia.defaultProps = {
  media: undefined,
};

export default function MarketingLayout({
  announcement,
  navLinks,
  hero,
  stats,
  trustBadges,
  socialProof,
  children,
  footerLinks,
  footerCta,
}) {
  const heroCopy = hero ?? {
    eyebrow: 'Gigvora for Growth Teams',
    title: 'Unified marketing, content, and revenue acceleration',
    description:
      'Coordinate storytelling, community activations, and paid placements inside a single workspace with enterprise controls.',
    primaryAction: { label: 'Book a strategy lab', href: '/contact/sales' },
    secondaryAction: { label: 'Download capabilities deck', href: '/assets/gigvora-capabilities.pdf' },
    media: null,
  };

  const resolvedStats = stats?.length ? stats : DEFAULT_STATS;
  const resolvedTrust = trustBadges?.length ? trustBadges : DEFAULT_TRUST_BADGES;
  const resolvedNav = navLinks?.length ? navLinks : DEFAULT_NAV_LINKS;

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-x-0 top-0 h-[640px] bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.28),_transparent_55%)]" aria-hidden="true" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,_rgba(129,140,248,0.18),_transparent_45%)]" aria-hidden="true" />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/95 to-slate-950" aria-hidden="true" />

      <header className="relative mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 pb-12 pt-10">
        {announcement ? (
          <div className="flex items-center justify-center">
            <a
              href={announcement.href}
              className="inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-white/80 transition hover:bg-white/20"
            >
              <span>{announcement.label}</span>
              <span className="text-white/60">{announcement.caption}</span>
            </a>
          </div>
        ) : null}

        <nav className="flex items-center justify-between rounded-full border border-white/15 bg-white/5 px-6 py-3 shadow-[0_24px_80px_-35px_rgba(15,23,42,0.8)] backdrop-blur-xl">
          <a href="/" className="flex items-center gap-3 text-sm font-semibold text-white/90">
            <img src={LOGO_URL} alt="Gigvora" className="h-8 w-auto" />
            <span className="hidden sm:inline">Gigvora Marketing Cloud</span>
          </a>
          <div className="hidden items-center gap-8 text-sm font-medium text-white/70 lg:flex">
            {resolvedNav.map((link) => (
              <a key={link.href} href={link.href} className="transition hover:text-white">
                {link.label}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/login"
              className="hidden rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 transition hover:border-white/40 hover:text-white sm:inline-flex"
            >
              Sign in
            </a>
            <a
              href="/register?intent=company"
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg shadow-accent/20 transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              Join the network
            </a>
          </div>
        </nav>

        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-[minmax(0,_1fr)_minmax(0,_520px)]">
          <div className="space-y-8">
            {heroCopy.eyebrow ? (
              <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white/70">
                {heroCopy.eyebrow}
              </p>
            ) : null}
            <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-[56px]">
              {heroCopy.title}
            </h1>
            {heroCopy.description ? (
              <p className="max-w-xl text-base text-white/70 sm:text-lg">{heroCopy.description}</p>
            ) : null}
            <div className="flex flex-wrap items-center gap-4">
              {heroCopy.primaryAction ? (
                <a
                  href={heroCopy.primaryAction.href}
                  className="inline-flex items-center gap-3 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-accent/30 transition hover:-translate-y-0.5 hover:bg-accentDark"
                >
                  {heroCopy.primaryAction.label}
                </a>
              ) : null}
              {heroCopy.secondaryAction ? (
                <a
                  href={heroCopy.secondaryAction.href}
                  className="inline-flex items-center gap-3 rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white/80 transition hover:border-white/40 hover:text-white"
                >
                  {heroCopy.secondaryAction.label}
                </a>
              ) : null}
            </div>
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {resolvedStats.map((stat) => (
                <StatHighlight key={stat.label} {...stat} />
              ))}
            </dl>
            <SocialProof logos={socialProof} />
          </div>
          <div className="relative min-h-[420px]">
            <HeroMedia media={heroCopy.media} />
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-20 px-6 pb-24">
        {children}
        <section id="impact-insights" className="grid gap-6 rounded-[2.5rem] border border-white/10 bg-white/[0.07] p-10 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.9)] backdrop-blur-xl lg:grid-cols-3">
          {resolvedTrust.map((item) => (
            <TrustBadge key={item.label} {...item} />
          ))}
        </section>
      </main>

      <footer className="relative mt-auto border-t border-white/10 bg-slate-950/80 py-16 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 text-left text-white/70">
          {footerCta ? (
            <div className="flex flex-col justify-between gap-6 rounded-3xl border border-white/10 bg-white/10 px-8 py-10 shadow-[0_30px_70px_-40px_rgba(15,23,42,0.8)] backdrop-blur-xl lg:flex-row lg:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/60">{footerCta.eyebrow}</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">{footerCta.title}</h2>
                <p className="mt-2 max-w-xl text-sm text-white/70">{footerCta.description}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                {footerCta.primaryAction ? (
                  <a
                    href={footerCta.primaryAction.href}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-accent/20 transition hover:-translate-y-0.5 hover:shadow-xl"
                  >
                    {footerCta.primaryAction.label}
                  </a>
                ) : null}
                {footerCta.secondaryAction ? (
                  <a
                    href={footerCta.secondaryAction.href}
                    className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white/80 transition hover:border-white/40 hover:text-white"
                  >
                    {footerCta.secondaryAction.label}
                  </a>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="grid gap-8 text-sm text-white/60 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-3">
              <a href="/" className="inline-flex items-center gap-3 text-white">
                <img src={LOGO_URL} alt="Gigvora" className="h-8 w-auto" />
                <span className="text-sm font-semibold">Gigvora</span>
              </a>
              <p className="text-sm text-white/60">
                The professional network for operators, storytellers, and venture teams building the future of work.
              </p>
            </div>
            {footerLinks?.map((section) => (
              <div key={section.title} className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/50">{section.title}</p>
                <ul className="space-y-2">
                  {section.links?.map((link) => (
                    <li key={link.href}>
                      <a href={link.href} className="transition hover:text-white">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap justify-between gap-4 text-xs uppercase tracking-[0.35em] text-white/40">
            <span>© {new Date().getFullYear()} Gigvora Labs. All rights reserved.</span>
            <div className="flex gap-4">
              <a href="/privacy" className="transition hover:text-white/70">
                Privacy
              </a>
              <a href="/terms" className="transition hover:text-white/70">
                Terms
              </a>
              <a href="/security" className="transition hover:text-white/70">
                Security
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

MarketingLayout.propTypes = {
  announcement: PropTypes.shape({
    label: PropTypes.string.isRequired,
    caption: PropTypes.string,
    href: PropTypes.string,
  }),
  navLinks: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      href: PropTypes.string.isRequired,
    }),
  ),
  hero: PropTypes.shape({
    eyebrow: PropTypes.string,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    primaryAction: PropTypes.shape({
      label: PropTypes.string.isRequired,
      href: PropTypes.string.isRequired,
    }),
    secondaryAction: PropTypes.shape({
      label: PropTypes.string.isRequired,
      href: PropTypes.string.isRequired,
    }),
    media: PropTypes.shape({
      type: PropTypes.oneOf(['image', 'video']),
      src: PropTypes.string,
      alt: PropTypes.string,
      sources: PropTypes.arrayOf(
        PropTypes.shape({
          src: PropTypes.string.isRequired,
          type: PropTypes.string,
        }),
      ),
    }),
  }),
  stats: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
      helper: PropTypes.string,
    }),
  ),
  trustBadges: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
    }),
  ),
  socialProof: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      icon: PropTypes.elementType,
    }),
  ),
  children: PropTypes.node,
  footerLinks: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      links: PropTypes.arrayOf(
        PropTypes.shape({
          label: PropTypes.string.isRequired,
          href: PropTypes.string.isRequired,
        }),
      ),
    }),
  ),
  footerCta: PropTypes.shape({
    eyebrow: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    primaryAction: PropTypes.shape({
      label: PropTypes.string.isRequired,
      href: PropTypes.string.isRequired,
    }),
    secondaryAction: PropTypes.shape({
      label: PropTypes.string,
      href: PropTypes.string,
    }),
  }),
};

MarketingLayout.defaultProps = {
  announcement: undefined,
  navLinks: undefined,
  hero: undefined,
  stats: undefined,
  trustBadges: undefined,
  socialProof: undefined,
  children: null,
  footerLinks: undefined,
  footerCta: undefined,
};
