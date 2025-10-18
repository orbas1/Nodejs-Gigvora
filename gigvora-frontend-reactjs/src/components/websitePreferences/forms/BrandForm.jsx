import FormField from '../components/FormField.jsx';

const BACKGROUND_STYLES = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'gradient', label: 'Gradient' },
];

const FONT_OPTIONS = ['Inter', 'Manrope', 'Space Grotesk', 'Work Sans', 'Playfair Display'];

const BUTTON_SHAPES = [
  { value: 'rounded', label: 'Rounded' },
  { value: 'pill', label: 'Pill' },
  { value: 'square', label: 'Square' },
];

export default function BrandForm({ theme, onChange, canEdit }) {
  const handleThemeChange = (next) => {
    onChange({ ...theme, ...next });
  };

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Colors</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <FormField label="Primary color">
            <input
              type="color"
              value={theme.primaryColor}
              onChange={(event) => handleThemeChange({ primaryColor: event.target.value })}
              disabled={!canEdit}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3"
            />
          </FormField>
          <FormField label="Accent color">
            <input
              type="color"
              value={theme.accentColor}
              onChange={(event) => handleThemeChange({ accentColor: event.target.value })}
              disabled={!canEdit}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3"
            />
          </FormField>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Style</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <FormField label="Background">
            <div className="grid grid-cols-3 gap-2">
              {BACKGROUND_STYLES.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleThemeChange({ backgroundStyle: option.value })}
                  disabled={!canEdit}
                  className={`rounded-xl border px-3 py-2 text-sm font-medium ${
                    theme.backgroundStyle === option.value
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-slate-200 bg-slate-50 text-slate-600'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </FormField>
          <FormField label="Buttons">
            <div className="grid grid-cols-3 gap-2">
              {BUTTON_SHAPES.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleThemeChange({ buttonShape: option.value })}
                  disabled={!canEdit}
                  className={`rounded-xl border px-3 py-2 text-sm font-medium ${
                    theme.buttonShape === option.value
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-slate-200 bg-slate-50 text-slate-600'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </FormField>
          <FormField label="Font">
            <select
              value={theme.fontFamily}
              onChange={(event) => handleThemeChange({ fontFamily: event.target.value })}
              disabled={!canEdit}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
            >
              {FONT_OPTIONS.map((font) => (
                <option key={font} value={font}>
                  {font}
                </option>
              ))}
            </select>
          </FormField>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Assets</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <FormField label="Logo URL">
            <input
              type="url"
              value={theme.logoUrl}
              onChange={(event) => handleThemeChange({ logoUrl: event.target.value })}
              disabled={!canEdit}
              placeholder="https://..."
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
            />
          </FormField>
          <FormField label="Favicon URL">
            <input
              type="url"
              value={theme.faviconUrl}
              onChange={(event) => handleThemeChange({ faviconUrl: event.target.value })}
              disabled={!canEdit}
              placeholder="https://..."
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
            />
          </FormField>
        </div>
      </div>
    </div>
  );
}
