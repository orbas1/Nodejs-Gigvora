import FormField from '../components/FormField.jsx';
import { ensureArray, ensureObject } from '../defaults.js';
import { createLocalId } from '../utils.js';

const MEDIA_TYPES = [
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Video' },
  { value: 'none', label: 'None' },
];

export default function HeroForm({ hero, about, onHeroChange, onAboutChange, canEdit }) {
  const highlights = ensureArray(about.highlights);
  const media = ensureObject(hero.media, { type: 'image', url: '', alt: '' });

  const handleHighlightChange = (id, value) => {
    const nextHighlights = highlights.map((item) => (item.id === id ? { ...item, text: value } : item));
    onAboutChange({ ...about, highlights: nextHighlights });
  };

  const handleAddHighlight = () => {
    const nextHighlights = [...highlights, { id: createLocalId('highlight'), text: 'Add highlight' }];
    onAboutChange({ ...about, highlights: nextHighlights });
  };

  const handleRemoveHighlight = (id) => {
    const nextHighlights = highlights.filter((item) => item.id !== id);
    onAboutChange({ ...about, highlights: nextHighlights });
  };

  const handleMediaChange = (next) => {
    onHeroChange({ ...hero, media: { ...media, ...next } });
  };

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Hero</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <FormField label="Kicker" description="Short intro text.">
            <input
              type="text"
              value={hero.kicker}
              onChange={(event) => onHeroChange({ ...hero, kicker: event.target.value })}
              disabled={!canEdit}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
            />
          </FormField>
          <FormField label="Headline">
            <input
              type="text"
              value={hero.headline}
              onChange={(event) => onHeroChange({ ...hero, headline: event.target.value })}
              disabled={!canEdit}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
            />
          </FormField>
          <FormField label="Subheadline">
            <textarea
              rows={3}
              value={hero.subheadline}
              onChange={(event) => onHeroChange({ ...hero, subheadline: event.target.value })}
              disabled={!canEdit}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
            />
          </FormField>
          <div className="space-y-4">
            <FormField label="Primary button">
              <div className="grid gap-2">
                <input
                  type="text"
                  value={hero.primaryCtaLabel}
                  onChange={(event) => onHeroChange({ ...hero, primaryCtaLabel: event.target.value })}
                  disabled={!canEdit}
                  placeholder="Label"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                />
                <input
                  type="text"
                  value={hero.primaryCtaLink}
                  onChange={(event) => onHeroChange({ ...hero, primaryCtaLink: event.target.value })}
                  disabled={!canEdit}
                  placeholder="#contact"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                />
              </div>
            </FormField>
            <FormField label="Secondary button">
              <div className="grid gap-2">
                <input
                  type="text"
                  value={hero.secondaryCtaLabel}
                  onChange={(event) => onHeroChange({ ...hero, secondaryCtaLabel: event.target.value })}
                  disabled={!canEdit}
                  placeholder="Label"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                />
                <input
                  type="text"
                  value={hero.secondaryCtaLink}
                  onChange={(event) => onHeroChange({ ...hero, secondaryCtaLink: event.target.value })}
                  disabled={!canEdit}
                  placeholder="https://"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                />
              </div>
            </FormField>
          </div>
          <FormField label="Background image">
            <input
              type="url"
              value={hero.backgroundImageUrl}
              onChange={(event) => onHeroChange({ ...hero, backgroundImageUrl: event.target.value })}
              disabled={!canEdit}
              placeholder="https://..."
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
            />
          </FormField>
          <FormField label="Media">
            <div className="space-y-2">
              <div className="flex gap-2">
                {MEDIA_TYPES.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleMediaChange({ type: option.value })}
                    disabled={!canEdit}
                    className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium ${
                      media.type === option.value
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {media.type !== 'none' ? (
                <div className="grid gap-2">
                  <input
                    type="url"
                    value={media.url}
                    onChange={(event) => handleMediaChange({ url: event.target.value })}
                    disabled={!canEdit}
                    placeholder="https://..."
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                  />
                  <input
                    type="text"
                    value={media.alt}
                    onChange={(event) => handleMediaChange({ alt: event.target.value })}
                    disabled={!canEdit}
                    placeholder="Alt text"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                  />
                </div>
              ) : null}
            </div>
          </FormField>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">About</h3>
          <button
            type="button"
            onClick={handleAddHighlight}
            disabled={!canEdit}
            className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-200"
          >
            Add highlight
          </button>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <FormField label="Section title">
            <input
              type="text"
              value={about.title}
              onChange={(event) => onAboutChange({ ...about, title: event.target.value })}
              disabled={!canEdit}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
            />
          </FormField>
          <FormField label="Summary">
            <textarea
              rows={4}
              value={about.body}
              onChange={(event) => onAboutChange({ ...about, body: event.target.value })}
              disabled={!canEdit}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
            />
          </FormField>
        </div>
        <div className="mt-4 space-y-3">
          {highlights.length ? (
            highlights.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <input
                  type="text"
                  value={item.text || ''}
                  onChange={(event) => handleHighlightChange(item.id, event.target.value)}
                  disabled={!canEdit}
                  className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveHighlight(item.id)}
                  disabled={!canEdit}
                  className="text-rose-500 hover:text-rose-600 disabled:cursor-not-allowed disabled:text-slate-300"
                >
                  Remove
                </button>
              </div>
            ))
          ) : (
            <p className="rounded-xl border border-dashed border-slate-200 px-4 py-3 text-sm text-slate-500">
              Add quick bullet points for your story.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
