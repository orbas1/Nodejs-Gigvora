import PropTypes from 'prop-types';
import { useMemo } from 'react';
import { DEFAULT_WEBSITE_PREFERENCES, ensureArray } from '../defaults.js';

const TEMPLATE_CONFIG = [
  {
    id: 'spotlight',
    label: 'Spotlight narrative',
    description: 'Immersive hero, story, services, and proof with contact close by.',
    heroStyle: 'immersive',
    order: ['hero', 'services', 'testimonials', 'about', 'contact', 'gallery', 'blog', 'newsletter'],
  },
  {
    id: 'publisher',
    label: 'Editorial digest',
    description: 'Lead with story and content for thought leadership heavy brands.',
    heroStyle: 'editorial',
    order: ['hero', 'about', 'blog', 'services', 'testimonials', 'gallery', 'newsletter', 'contact'],
  },
  {
    id: 'commerce',
    label: 'Conversion focused',
    description: 'Productised services, social proof, and instant booking cues.',
    heroStyle: 'conversion',
    order: ['hero', 'services', 'contact', 'testimonials', 'about', 'gallery', 'newsletter', 'blog'],
  },
];

const SPAN_OPTIONS = [
  { value: 'full', label: 'Full width', description: 'Hero or story modules with cinematic presence.' },
  { value: 'half', label: 'Half width', description: 'Pair complementary modules side-by-side.' },
  { value: 'third', label: 'Third width', description: 'Grid cards for galleries, resources, or stats.' },
];

const PREVIEW_SPAN_CLASS = {
  full: 'col-span-12',
  half: 'col-span-6',
  third: 'col-span-4',
};

function cloneModules(modules) {
  return ensureArray(modules).map((module) => ({ ...module }));
}

function TemplateCard({ template, active = false, onSelect, disabled = false }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(template)}
      disabled={disabled}
      className={`flex flex-col rounded-3xl border px-4 py-4 text-left transition ${
        active
          ? 'border-accent bg-accent/10 shadow-lg shadow-accent/20'
          : 'border-slate-200 bg-white/90 hover:border-accent/40 hover:shadow-md'
      } ${disabled ? 'cursor-not-allowed opacity-60 hover:shadow-none' : ''}`}
    >
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
        <span>{template.label}</span>
        {active ? (
          <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[0.65rem] font-bold text-white">Active</span>
        ) : null}
      </div>
      <p className="mt-3 text-sm text-slate-600">{template.description}</p>
      <div className="mt-4 h-20 w-full overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100">
        <div className="grid h-full grid-cols-12 gap-1 p-3">
          {template.order.slice(0, 6).map((moduleId) => {
            const spanClass = PREVIEW_SPAN_CLASS[moduleId === 'hero' ? 'full' : moduleId === 'services' ? 'half' : 'third'];
            return (
              <div
                key={moduleId}
                className={`${spanClass} rounded-xl bg-white/80 text-[0.6rem] font-semibold uppercase tracking-widest text-slate-400`}
              >
                <span className="flex h-full items-center justify-center px-2">{moduleId}</span>
              </div>
            );
          })}
        </div>
      </div>
    </button>
  );
}

TemplateCard.propTypes = {
  template: PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    heroStyle: PropTypes.string.isRequired,
    order: PropTypes.arrayOf(PropTypes.string).isRequired,
  }).isRequired,
  active: PropTypes.bool,
  onSelect: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

function ModuleRow({ module, index, total, onToggle, onMove, onSpanChange, disabled = false }) {
  const canMoveUp = index > 0 && !disabled && !module.pinned;
  const canMoveDown = index < total - 1 && !disabled && !module.pinned;

  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl border px-4 py-4 text-sm transition ${
        module.enabled ? 'border-slate-200 bg-white/85' : 'border-dashed border-slate-300 bg-white/60'
      }`}
    >
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-900">{module.label}</p>
          <p className="text-xs text-slate-500">{module.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onToggle(module.id, !module.enabled)}
            disabled={disabled || module.pinned}
            className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition ${
              module.enabled
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-300 text-slate-500 hover:border-slate-500 hover:text-slate-700'
            } ${disabled || module.pinned ? 'cursor-not-allowed opacity-60 hover:border-slate-300 hover:text-slate-500' : ''}`}
          >
            {module.enabled ? 'Active' : 'Hidden'}
          </button>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onMove(module.id, -1)}
              disabled={!canMoveUp}
              aria-label={`Move ${module.label} up`}
              className="rounded-full border border-slate-200 px-2 py-1 text-xs text-slate-500 transition hover:border-slate-300 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => onMove(module.id, 1)}
              disabled={!canMoveDown}
              aria-label={`Move ${module.label} down`}
              className="rounded-full border border-slate-200 px-2 py-1 text-xs text-slate-500 transition hover:border-slate-300 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ↓
            </button>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {SPAN_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onSpanChange(module.id, option.value)}
            disabled={disabled}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
              module.span === option.value
                ? 'border-accent bg-accent/10 text-slate-900'
                : 'border-slate-300 text-slate-500 hover:border-slate-400 hover:text-slate-700'
            } ${disabled ? 'cursor-not-allowed opacity-60 hover:border-slate-300 hover:text-slate-500' : ''}`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

ModuleRow.propTypes = {
  module: PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    description: PropTypes.string,
    enabled: PropTypes.bool,
    pinned: PropTypes.bool,
    span: PropTypes.oneOf(['full', 'half', 'third']),
  }).isRequired,
  index: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
  onToggle: PropTypes.func.isRequired,
  onMove: PropTypes.func.isRequired,
  onSpanChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

export default function LayoutManager({ value = null, onChange, canEdit = true }) {
  const baseline = useMemo(() => {
    if (value && ensureArray(value.modules).length) {
      return { ...value, modules: cloneModules(value.modules) };
    }
    const defaults = DEFAULT_WEBSITE_PREFERENCES.personalization.layout;
    return { ...defaults, modules: cloneModules(defaults.modules) };
  }, [value]);

  const emitChange = (next) => {
    onChange?.({ ...baseline, ...next });
  };

  const handleTemplate = (template) => {
    if (!canEdit) return;
    const map = new Map(cloneModules(baseline.modules).map((module) => [module.id, module]));
    const ordered = template.order
      .map((moduleId) => {
        if (map.has(moduleId)) {
          return map.get(moduleId);
        }
        return null;
      })
      .filter(Boolean);
    const remaining = Array.from(map.values()).filter((module) => !template.order.includes(module.id));
    emitChange({
      template: template.id,
      heroStyle: template.heroStyle,
      modules: [...ordered, ...remaining],
    });
  };

  const handleToggle = (moduleId, nextState) => {
    if (!canEdit) return;
    emitChange({
      modules: cloneModules(baseline.modules).map((module) => {
        if (module.id !== moduleId) return module;
        if (module.pinned) return module;
        return { ...module, enabled: nextState };
      }),
    });
  };

  const handleMove = (moduleId, direction) => {
    if (!canEdit || !direction) return;
    const modules = cloneModules(baseline.modules);
    const index = modules.findIndex((module) => module.id === moduleId);
    if (index === -1) return;
    if (modules[index].pinned) return;
    const target = index + direction;
    if (target < 0 || target >= modules.length) return;
    if (modules[target]?.pinned) return;
    const next = [...modules];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    emitChange({ modules: next });
  };

  const handleSpanChange = (moduleId, span) => {
    if (!canEdit) return;
    emitChange({
      modules: cloneModules(baseline.modules).map((module) =>
        module.id === moduleId ? { ...module, span } : module,
      ),
    });
  };

  const handleCalloutChange = (event) => {
    emitChange({ featuredCallout: event.target.value });
  };

  const handleAnalyticsToggle = (event) => {
    emitChange({ analyticsEnabled: event.target.checked });
  };

  const previewModules = baseline.modules.filter((module) => module.enabled !== false);

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">Layout templates</h3>
        <p className="mt-1 text-sm text-slate-500">
          Personalise module flow and hero energy to match premium executive expectations.
        </p>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {TEMPLATE_CONFIG.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              active={baseline.template === template.id}
              onSelect={handleTemplate}
              disabled={!canEdit}
            />
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          {baseline.modules.map((module, index) => (
            <ModuleRow
              key={module.id}
              module={module}
              index={index}
              total={baseline.modules.length}
              onToggle={handleToggle}
              onMove={handleMove}
              onSpanChange={handleSpanChange}
              disabled={!canEdit}
            />
          ))}
        </div>
        <div className="flex flex-col gap-6">
          <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
            <h4 className="text-base font-semibold text-slate-900">Live preview</h4>
            <p className="mt-1 text-xs text-slate-500">Stacked order, spans, and hero style update instantly.</p>
            <div className="mt-4 rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 p-4">
              <div className="grid grid-cols-12 gap-3">
                {previewModules.map((module) => (
                  <div
                    key={module.id}
                    className={`${PREVIEW_SPAN_CLASS[module.span ?? 'full']} rounded-2xl border border-slate-200 bg-white/80 p-3 shadow-sm`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">{module.label}</p>
                    <p className="mt-2 text-xs text-slate-500 line-clamp-2">{module.description}</p>
                  </div>
                ))}
              </div>
            </div>
            <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Narrative callout
              <textarea
                value={baseline.featuredCallout ?? ''}
                onChange={handleCalloutChange}
                disabled={!canEdit}
                rows={3}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
                placeholder="Summarise the promise your layout delivers."
              />
            </label>
            <label className="mt-4 flex items-center justify-between rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-600">
              <span className="font-semibold text-slate-900">Enable layout analytics</span>
              <input
                type="checkbox"
                checked={baseline.analyticsEnabled !== false}
                onChange={handleAnalyticsToggle}
                disabled={!canEdit}
                className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

LayoutManager.propTypes = {
  value: PropTypes.shape({
    template: PropTypes.string,
    heroStyle: PropTypes.string,
    modules: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        label: PropTypes.string,
        description: PropTypes.string,
        enabled: PropTypes.bool,
        pinned: PropTypes.bool,
        span: PropTypes.oneOf(['full', 'half', 'third']),
      }),
    ),
    featuredCallout: PropTypes.string,
    analyticsEnabled: PropTypes.bool,
  }),
  onChange: PropTypes.func,
  canEdit: PropTypes.bool,
};
