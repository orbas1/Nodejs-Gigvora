import PropTypes from 'prop-types';
import { ArrowTopRightOnSquareIcon, LinkIcon } from '@heroicons/react/24/outline';

function getDomain(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch (error) {
    return null;
  }
}

export default function PortfolioGallery({ links, emptyMessage }) {
  if (!links.length) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white/90 p-8 text-center text-sm text-slate-600 shadow-sm">
        <p className="font-semibold text-slate-800">Portfolio &amp; case studies</p>
        <p className="mt-2 text-slate-500">{emptyMessage}</p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Portfolio &amp; case studies</h2>
          <p className="text-sm text-slate-500">Curated proof points that showcase narrative craft, measurable outcomes, and product polish.</p>
        </div>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {links.map((link, index) => {
          const label = link.label || link.url || `Link ${index + 1}`;
          const description = link.description || link.summary || '';
          const domain = link.url ? getDomain(link.url) : null;
          const tags = Array.isArray(link.tags) ? link.tags : [];

          return (
            <article key={`${label}-${index}`} className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-white to-surfaceMuted/80 p-6 shadow-soft transition hover:-translate-y-1 hover:border-accent/60">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <LinkIcon className="h-5 w-5 text-accent" aria-hidden="true" />
                  <span className="truncate">{label}</span>
                </div>
                {link.url ? (
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent transition hover:bg-accent/20"
                  >
                    View
                    <ArrowTopRightOnSquareIcon className="h-4 w-4" aria-hidden="true" />
                  </a>
                ) : null}
              </div>
              {domain ? <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">{domain}</p> : null}
              {description ? <p className="mt-3 text-sm text-slate-600">{description}</p> : null}
              {tags.length ? (
                <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
                  {tags.map((tag) => (
                    <span key={tag} className="rounded-full border border-slate-200 bg-white/80 px-3 py-1">
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
              {link.metrics ? (
                <dl className="mt-4 grid gap-3 text-xs text-slate-500 sm:grid-cols-2">
                  {Object.entries(link.metrics).map(([metric, value]) => (
                    <div key={metric} className="rounded-2xl border border-slate-200 bg-white/70 px-3 py-2">
                      <dt className="font-semibold text-slate-700">{value}</dt>
                      <dd className="uppercase tracking-wide text-[10px] text-slate-400">{metric}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

PortfolioGallery.propTypes = {
  links: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      url: PropTypes.string,
      description: PropTypes.string,
      summary: PropTypes.string,
      tags: PropTypes.arrayOf(PropTypes.string),
      metrics: PropTypes.object,
    }),
  ),
  emptyMessage: PropTypes.string,
};

PortfolioGallery.defaultProps = {
  links: [],
  emptyMessage: 'Add curated projects, case studies, or campaign recaps to showcase delivery excellence.',
};
