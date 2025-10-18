import { useCallback } from 'react';

function mappingToText(mapping = {}) {
  return Object.entries(mapping)
    .map(([localField, externalField]) => `${localField}:${externalField}`)
    .join('\n');
}

function textToMapping(text) {
  if (!text) {
    return {};
  }
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .reduce((accumulator, line) => {
      const [localField, externalField] = line.split(':');
      if (!localField || !externalField) {
        return accumulator;
      }
      accumulator[localField.trim()] = externalField.trim();
      return accumulator;
    }, {});
}

export default function FieldMappingEditor({ value = [], onChange, templates = [] }) {
  const handleChange = useCallback(
    (index, field, newValue) => {
      if (!onChange) {
        return;
      }
      const next = value.map((mapping, mappingIndex) => {
        if (mappingIndex !== index) {
          return mapping;
        }
        if (field === 'mapping') {
          return { ...mapping, mapping: textToMapping(newValue) };
        }
        return { ...mapping, [field]: newValue };
      });
      onChange(next);
    },
    [onChange, value],
  );

  const handleAdd = useCallback(() => {
    if (!onChange) {
      return;
    }
    onChange([
      ...value,
      {
        id: `mapping-${Date.now()}`,
        externalObject: '',
        localObject: '',
        mapping: {},
      },
    ]);
  }, [onChange, value]);

  const handleTemplateLoad = useCallback(() => {
    if (!onChange) {
      return;
    }
    onChange(
      templates.map((template, index) => ({
        id: template.id ?? `template-${index}`,
        externalObject: template.externalObject ?? '',
        localObject: template.localObject ?? '',
        mapping: template.mapping ?? {},
      })),
    );
  }, [onChange, templates]);

  const handleRemove = useCallback(
    (index) => {
      if (!onChange) {
        return;
      }
      onChange(value.filter((_, mappingIndex) => mappingIndex !== index));
    },
    [onChange, value],
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleAdd}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-accent hover:text-accent"
        >
          Add mapping
        </button>
        {templates.length > 0 && !value.length ? (
          <button
            type="button"
            onClick={handleTemplateLoad}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-accent hover:text-accent"
          >
            Load template
          </button>
        ) : null}
      </div>

      <div className="space-y-4">
        {value.map((mapping, index) => (
          <div key={mapping.id ?? index} className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">External object</label>
                <input
                  type="text"
                  value={mapping.externalObject ?? ''}
                  onChange={(event) => handleChange(index, 'externalObject', event.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Local object</label>
                <input
                  type="text"
                  value={mapping.localObject ?? ''}
                  onChange={(event) => handleChange(index, 'localObject', event.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>
            </div>
            <div className="mt-3">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Field mapping</label>
              <textarea
                rows={4}
                value={mappingToText(mapping.mapping)}
                onChange={(event) => handleChange(index, 'mapping', event.target.value)}
                placeholder="localField:externalField"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
              <p className="mt-1 text-[11px] text-slate-500">One field per line using the format localField:externalField.</p>
            </div>
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="inline-flex items-center rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
        {!value.length ? (
          <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
            No mappings defined yet.
          </p>
        ) : null}
      </div>
    </div>
  );
}
