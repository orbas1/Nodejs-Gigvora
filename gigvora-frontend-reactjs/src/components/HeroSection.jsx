import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { LOGO_URL } from '../constants/branding.js';
import LanguageSelector from './LanguageSelector.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';

const heroImage =
  'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1600&q=80';

const highlightMoments = [
  {
    title: 'Design launch ready in days',
    actor: 'Atlas Labs',
    image:
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Community pop-up sold out',
    actor: 'Nova Collective',
    image:
      'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Global product squad assembled',
    actor: 'Aster Ventures',
    image:
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80',
  },
];

export default function HeroSection() {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const { t } = useLanguage();

  const stats = useMemo(
    () => [
      { label: t('hero.stats.teams', 'teams scaling global talent'), value: '12k+' },
      { label: t('hero.stats.projects', 'projects delivered with heart'), value: '48k' },
      { label: t('hero.stats.onboarding', 'average onboarding time'), value: '24 hrs' },
    ],
    [t],
  );

  const handleMouseMove = (event) => {
    const { currentTarget, clientX, clientY } = event;
    const bounds = currentTarget.getBoundingClientRect();
    const relativeX = (clientX - bounds.left) / bounds.width - 0.5;
    const relativeY = (clientY - bounds.top) / bounds.height - 0.5;
    setTilt({ x: relativeX * 18, y: relativeY * 18 });
  };

  return (
    <section
      className="relative overflow-hidden bg-surface"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setTilt({ x: 0, y: 0 })}
    >
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-surface via-accentSoft/40 to-surfaceMuted" aria-hidden="true" />
      <div className="absolute inset-y-0 right-0 hidden w-1/2 lg:block" aria-hidden="true">
        <div className="h-full w-full bg-gradient-to-l from-white/80 to-transparent" />
        <img
          src={heroImage}
          alt="Creative team collaborating around a laptop"
          className="absolute inset-0 h-full w-full object-cover object-center opacity-90"
        />
      </div>
      <div className="relative mx-auto flex max-w-6xl flex-col gap-16 px-6 pb-24 pt-24 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl space-y-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-white/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-accentDark backdrop-blur">
            {t('hero.tagline', 'Gigvora platform')}
          </span>
          <div className="space-y-6">
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              {t('hero.heading', 'Hire brilliantly. Collaborate beautifully.')}
            </h1>
            <p className="text-lg text-slate-600">
              {t(
                'hero.subheading',
                'Gigvora pairs curated talent with effortless workflows so your team can launch ideas without the jargon and without the wait.',
              )}
            </p>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
            <Link
              to="/register"
              className="rounded-full bg-accent px-8 py-3 text-center text-base font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-accentDark"
            >
              {t('auth.startProfile', 'Start your free profile')}
            </Link>
            <Link
              to="/about"
              className="rounded-full border border-slate-200 px-8 py-3 text-center text-base font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
            >
              {t('auth.watchTour', 'Watch a 90-second walk-through')}
            </Link>
            <LanguageSelector variant="hero" className="sm:ml-2" />
          </div>
          <dl className="grid grid-cols-1 gap-6 text-sm text-slate-500 sm:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/60 bg-white/70 p-4 backdrop-blur">
                <dt className="text-[0.7rem] uppercase tracking-[0.3em] text-slate-400">{stat.label}</dt>
                <dd className="mt-2 text-2xl font-semibold text-slate-900">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="w-full max-w-md">
          <div className="relative rounded-3xl border border-slate-200/60 bg-white/90 p-6 shadow-2xl shadow-accent/10 backdrop-blur">
            <div
              className="absolute -top-12 right-12 hidden h-32 w-32 rounded-full bg-accent/30 blur-3xl lg:block"
              style={{ transform: `translate3d(${tilt.x}px, ${tilt.y}px, 0)` }}
              aria-hidden="true"
            />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accentDark">
                  {t('hero.liveMoments', 'Live moments')}
                </p>
                <p className="text-sm text-slate-500">{t('hero.liveMomentsDescription', 'Real teams shipping now')}</p>
              </div>
              <span className="rounded-full bg-accentSoft px-3 py-1 text-xs font-semibold text-accentDark">
                {t('hero.statusBadge', 'In sync')}
              </span>
            </div>
            <div className="mt-6 space-y-4">
              {highlightMoments.map((moment) => (
                <article
                  key={moment.title}
                  className="flex items-center gap-4 overflow-hidden rounded-2xl border border-slate-100 bg-surface shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-accent/40"
                  style={{ transform: `translate3d(${tilt.x / 3}px, ${tilt.y / 3}px, 0)` }}
                >
                  <img src={moment.image} alt={moment.title} className="h-16 w-16 flex-shrink-0 object-cover" />
                  <div className="py-3 pr-4">
                    <h3 className="text-sm font-semibold text-slate-900">{moment.title}</h3>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{moment.actor}</p>
                  </div>
                </article>
              ))}
            </div>
            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-slate-100 bg-surfaceMuted/80 px-4 py-3">
              <img src={LOGO_URL} alt="Gigvora" className="h-8 w-auto" />
              <p className="text-xs text-slate-500">{t('hero.deckSubtitle', 'Web and mobile dashboards stay perfectly in step.')}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
