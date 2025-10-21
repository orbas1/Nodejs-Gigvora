import { AcademicCapIcon, PlusCircleIcon } from '@heroicons/react/24/outline';
import PropTypes from 'prop-types';

export default function ProfileCredentialsCard({
  qualifications,
  onAddQualification,
  onUpdateQualification,
  onRemoveQualification,
  portfolioLinks,
  onAddPortfolioLink,
  onUpdatePortfolioLink,
  onRemovePortfolioLink,
  canEdit,
}) {
  const qualificationItems = Array.isArray(qualifications) ? qualifications : [];
  const linkItems = Array.isArray(portfolioLinks) ? portfolioLinks : [];

  return (
    <section className="space-y-8">
      <header className="flex items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-slate-900">Credentials</h3>
        <AcademicCapIcon className="h-6 w-6 text-accent" aria-hidden="true" />
      </header>

      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-slate-800">Qualifications</span>
          <button
            type="button"
            onClick={onAddQualification}
            disabled={!canEdit}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 disabled:cursor-not-allowed disabled:text-slate-300"
          >
            <PlusCircleIcon className="h-4 w-4" aria-hidden="true" /> Add
          </button>
        </div>

        <div className="space-y-4">
          {qualificationItems.length === 0 ? (
            <p className="text-sm text-slate-500">Add certificates or accreditations.</p>
          ) : null}
          {qualificationItems.map((item, index) => (
            <details key={`qualification-${index}`} className="rounded-3xl border border-slate-200 bg-white p-4" open={index === 0}>
              <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm font-semibold text-slate-800">
                <span>{item.title || 'Title'}</span>
                <span className="text-xs font-medium text-slate-500">{item.year || 'Year'}</span>
              </summary>
              <div className="mt-4 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="flex flex-col gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Title</span>
                    <input
                      type="text"
                      value={item.title}
                      onChange={(event) => onUpdateQualification(index, { title: event.target.value })}
                      disabled={!canEdit}
                      className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:bg-slate-100"
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Authority</span>
                    <input
                      type="text"
                      value={item.authority}
                      onChange={(event) => onUpdateQualification(index, { authority: event.target.value })}
                      disabled={!canEdit}
                      className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:bg-slate-100"
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Year</span>
                    <input
                      type="text"
                      value={item.year}
                      onChange={(event) => onUpdateQualification(index, { year: event.target.value })}
                      disabled={!canEdit}
                      className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:bg-slate-100"
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Credential ID</span>
                    <input
                      type="text"
                      value={item.credentialId}
                      onChange={(event) => onUpdateQualification(index, { credentialId: event.target.value })}
                      disabled={!canEdit}
                      className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:bg-slate-100"
                    />
                  </label>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="flex flex-col gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Credential URL</span>
                    <input
                      type="url"
                      value={item.credentialUrl}
                      onChange={(event) => onUpdateQualification(index, { credentialUrl: event.target.value })}
                      disabled={!canEdit}
                      placeholder="https://"
                      className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:bg-slate-100"
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</span>
                    <textarea
                      rows={3}
                      value={item.description}
                      onChange={(event) => onUpdateQualification(index, { description: event.target.value })}
                      disabled={!canEdit}
                      className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:bg-slate-100"
                    />
                  </label>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => onRemoveQualification(index)}
                    disabled={!canEdit}
                    className="text-xs font-semibold text-rose-500 transition hover:text-rose-600 disabled:cursor-not-allowed disabled:text-slate-300"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </details>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-slate-800">Portfolio</span>
          <button
            type="button"
            onClick={onAddPortfolioLink}
            disabled={!canEdit}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 disabled:cursor-not-allowed disabled:text-slate-300"
          >
            <PlusCircleIcon className="h-4 w-4" aria-hidden="true" /> Add
          </button>
        </div>

        <div className="space-y-4">
          {linkItems.length === 0 ? <p className="text-sm text-slate-500">Link to live work.</p> : null}
          {linkItems.map((item, index) => (
            <details key={`portfolio-${index}`} className="rounded-3xl border border-slate-200 bg-white p-4" open={index === 0}>
              <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm font-semibold text-slate-800">
                <span>{item.label || 'Portfolio item'}</span>
                <span className="text-xs font-medium text-slate-500">{item.url || ''}</span>
              </summary>
              <div className="mt-4 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="flex flex-col gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Label</span>
                    <input
                      type="text"
                      value={item.label}
                      onChange={(event) => onUpdatePortfolioLink(index, { label: event.target.value })}
                      disabled={!canEdit}
                      className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:bg-slate-100"
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">URL</span>
                    <input
                      type="url"
                      value={item.url}
                      onChange={(event) => onUpdatePortfolioLink(index, { url: event.target.value })}
                      placeholder="https://"
                      disabled={!canEdit}
                      className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:bg-slate-100"
                    />
                  </label>
                </div>
                <label className="flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</span>
                  <textarea
                    rows={3}
                    value={item.description}
                    onChange={(event) => onUpdatePortfolioLink(index, { description: event.target.value })}
                    disabled={!canEdit}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                </label>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => onRemovePortfolioLink(index)}
                    disabled={!canEdit}
                    className="text-xs font-semibold text-rose-500 transition hover:text-rose-600 disabled:cursor-not-allowed disabled:text-slate-300"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

const qualificationShape = PropTypes.shape({
  title: PropTypes.string,
  authority: PropTypes.string,
  year: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  credentialId: PropTypes.string,
  credentialUrl: PropTypes.string,
  description: PropTypes.string,
});

const portfolioLinkShape = PropTypes.shape({
  label: PropTypes.string,
  url: PropTypes.string,
  description: PropTypes.string,
});

ProfileCredentialsCard.propTypes = {
  qualifications: PropTypes.arrayOf(qualificationShape).isRequired,
  onAddQualification: PropTypes.func.isRequired,
  onUpdateQualification: PropTypes.func.isRequired,
  onRemoveQualification: PropTypes.func.isRequired,
  portfolioLinks: PropTypes.arrayOf(portfolioLinkShape).isRequired,
  onAddPortfolioLink: PropTypes.func.isRequired,
  onUpdatePortfolioLink: PropTypes.func.isRequired,
  onRemovePortfolioLink: PropTypes.func.isRequired,
  canEdit: PropTypes.bool,
};

ProfileCredentialsCard.defaultProps = {
  canEdit: false,
};
