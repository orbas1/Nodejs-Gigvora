import FormField from '../components/FormField.jsx';

export default function SeoForm({ seo, onChange, canEdit }) {
  const handleChange = (next) => {
    onChange({ ...seo, ...next });
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">SEO</h3>
      <div className="mt-4 space-y-4">
        <FormField label="Meta title">
          <input
            type="text"
            value={seo.metaTitle}
            onChange={(event) => handleChange({ metaTitle: event.target.value })}
            disabled={!canEdit}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
        </FormField>
        <FormField label="Meta description">
          <textarea
            rows={3}
            value={seo.metaDescription}
            onChange={(event) => handleChange({ metaDescription: event.target.value })}
            disabled={!canEdit}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
        </FormField>
        <FormField label="Keywords" description="Comma separated.">
          <input
            type="text"
            value={seo.keywordsInput}
            onChange={(event) => handleChange({ keywordsInput: event.target.value })}
            disabled={!canEdit}
            placeholder="product design, launch, mentor"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="OpenGraph image">
            <input
              type="url"
              value={seo.ogImageUrl}
              onChange={(event) => handleChange({ ogImageUrl: event.target.value })}
              disabled={!canEdit}
              placeholder="https://..."
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
            />
          </FormField>
          <FormField label="Twitter handle">
            <input
              type="text"
              value={seo.twitterHandle}
              onChange={(event) => handleChange({ twitterHandle: event.target.value })}
              disabled={!canEdit}
              placeholder="@handle"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
            />
          </FormField>
        </div>
      </div>
    </div>
  );
}
