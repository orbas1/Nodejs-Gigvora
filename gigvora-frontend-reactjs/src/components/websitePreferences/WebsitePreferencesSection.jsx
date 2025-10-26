import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { ArrowTopRightOnSquareIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import WebsitePreferencesSummary from './WebsitePreferencesSummary.jsx';
import WebsitePreferencesDesigner from './WebsitePreferencesDesigner.jsx';
import WebsitePreferencesPreview from './WebsitePreferencesPreview.jsx';
import WebsitePersonalizationTools from './WebsitePersonalizationTools.jsx';
import { withDefaults, ensureArray } from './defaults.js';
import websitePreferencesShape from './propTypes.js';

function buildHostedUrl(preferences) {
  if (preferences.settings.customDomain) {
    return preferences.settings.customDomain;
  }
  return `https://${preferences.settings.siteSlug || 'my-site'}.gigvora.com`;
}

export default function WebsitePreferencesSection({ userId, initialPreferences, onRefresh, canEdit }) {
  const [preferences, setPreferences] = useState(initialPreferences ?? null);
  const [designerState, setDesignerState] = useState({ open: false, section: 'basics' });

  useEffect(() => {
    setPreferences(initialPreferences ?? null);
  }, [initialPreferences]);

  const merged = useMemo(() => withDefaults(preferences), [preferences]);
  const hostedUrl = buildHostedUrl(merged);
  const published = Boolean(merged.settings.published);
  const navLinks = ensureArray(merged.navigation.links).slice(0, 4);

  const openDesigner = (section = 'basics') => {
    setDesignerState({ open: true, section });
  };

  const handleCloseDesigner = () => {
    setDesignerState((state) => ({ ...state, open: false }));
  };

  const handleSaved = (next) => {
    setPreferences(next);
    onRefresh?.();
  };

  return (
    <>
      <section
        id="website-preferences"
        className="rounded-4xl border border-slate-200 bg-white px-6 py-8 shadow-sm"
      >
        <div className="flex flex-col gap-8 xl:flex-row">
          <div className="flex-1 space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">Website</h2>
                <p className="text-sm text-slate-500">Launch a clean public profile with brand, offers, and SEO in sync.</p>
              </div>
              {canEdit ? (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openDesigner('basics')}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                  >
                    <PencilSquareIcon className="h-4 w-4" />
                    Designer
                  </button>
                  <a
                    href={hostedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300"
                  >
                    <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                    Visit
                  </a>
                </div>
              ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span className="text-slate-600">Status</span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs uppercase tracking-widest ${
                      published ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {published ? 'Published' : 'Draft'}
                  </span>
                </div>
                <p className="mt-3 text-lg font-semibold text-slate-900">{merged.settings.siteTitle}</p>
                <p className="text-sm text-slate-500">{merged.settings.tagline || 'Add a short description.'}</p>
                <div className="mt-4 text-xs">
                  <p className="font-semibold text-slate-500">Live URL</p>
                  <p className="mt-1 font-medium text-accent">{hostedUrl}</p>
                </div>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Navigation</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                  {navLinks.length ? (
                    navLinks.map((link) => (
                      <li key={link.id} className="flex items-center justify-between">
                        <span>{link.label || 'Menu item'}</span>
                        <span className="text-slate-400">{link.url}</span>
                      </li>
                    ))
                  ) : (
                    <li>No links added yet.</li>
                  )}
                </ul>
              </div>
            </div>

            <WebsitePreferencesSummary
              preferences={merged}
              updatedAt={preferences?.updatedAt}
              onSelectSection={(section) => openDesigner(section)}
            />
          </div>
          <div className="w-full max-w-sm">
            <WebsitePreferencesPreview preferences={merged} />
          </div>
        </div>

        <WebsitePreferencesDesigner
          open={designerState.open}
          initialPreferences={preferences ?? merged}
          initialSection={designerState.section}
          userId={userId}
          canEdit={canEdit}
          onClose={handleCloseDesigner}
          onSaved={handleSaved}
        />
      </section>

      <WebsitePersonalizationTools
        userId={userId}
        preferences={preferences ?? merged}
        onSaved={handleSaved}
        canEdit={canEdit}
      />
    </>
  );
}

WebsitePreferencesSection.propTypes = {
  userId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  initialPreferences: websitePreferencesShape,
  onRefresh: PropTypes.func,
  canEdit: PropTypes.bool,
};

WebsitePreferencesSection.defaultProps = {
  initialPreferences: null,
  onRefresh: undefined,
  canEdit: false,
};
