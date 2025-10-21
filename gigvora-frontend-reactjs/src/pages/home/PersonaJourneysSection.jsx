import clsx from 'clsx';
import { featureHighlights } from '../../content/home/featureHighlights.js';

export function PersonaJourneysSection({ loading, error, items = featureHighlights }) {
  const features = !loading && !error && items?.length ? items : featureHighlights;

  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">Everything your professional community needs</h2>
          <p className="mt-4 text-base text-slate-600">
            A single platform where relationships thrive, work stays visible, and trust scales with your ambitions.
          </p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => (
            <article
              key={feature.title}
              className={clsx(
                'flex h-full flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 text-left shadow-sm transition duration-300',
                loading ? 'opacity-60' : 'hover:-translate-y-1 hover:shadow-lg',
              )}
            >
              {feature.icon ? <feature.icon className="h-8 w-8 text-accent" aria-hidden="true" /> : null}
              <h3 className="text-xl font-semibold text-slate-900">{feature.title}</h3>
              <p className="text-sm text-slate-600">{feature.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
