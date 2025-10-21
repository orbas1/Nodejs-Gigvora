import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useEffect, useState } from 'react';
import { isValidHexColor } from './utils.js';

const INITIAL_STATE = Object.freeze({
  name: '',
  wipLimit: '',
  color: '',
});

export default function ColumnDrawer({ open, mode, initialValue, onSubmit, onClose }) {
  const [form, setForm] = useState(INITIAL_STATE);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        name: initialValue?.name ?? '',
        wipLimit: initialValue?.wipLimit ?? '',
        color: initialValue?.color ?? '',
      });
      setErrors({});
    }
  }, [open, initialValue]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    const trimmedName = form.name.trim();
    if (!trimmedName) {
      nextErrors.name = 'Column name is required.';
    }

    let normalizedLimit = null;
    if (form.wipLimit !== '') {
      const parsed = Number(form.wipLimit);
      if (!Number.isInteger(parsed) || parsed < 0) {
        nextErrors.wipLimit = 'Work limit must be a positive whole number.';
      } else {
        normalizedLimit = parsed;
      }
    }

    if (form.color && !isValidHexColor(form.color)) {
      nextErrors.color = 'Use a valid hex value (e.g. #2563eb).';
    }

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit?.({
        name: trimmedName,
        wipLimit: normalizedLimit,
        color: form.color || null,
      });
      setErrors({});
      onClose?.();
    } catch (error) {
      setErrors({ form: error?.message ?? 'Unable to save the column. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Transition show={open} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-6">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="translate-y-4 opacity-0"
              enterTo="translate-y-0 opacity-100"
              leave="ease-in duration-150"
              leaveFrom="translate-y-0 opacity-100"
              leaveTo="translate-y-4 opacity-0"
            >
              <Dialog.Panel className="w-full max-w-md space-y-6 rounded-3xl bg-white p-6 shadow-xl">
                <div className="space-y-1">
                  <Dialog.Title className="text-lg font-semibold text-slate-900">
                    {mode === 'edit' ? 'Edit column' : 'New column'}
                  </Dialog.Title>
                  <p className="text-sm text-slate-500">Name a stage and optionally set a work limit.</p>
                </div>
                <form className="space-y-4" onSubmit={handleSubmit} noValidate>
                  <div className="space-y-2">
                    <label htmlFor="column-name" className="text-sm font-semibold text-slate-700">
                      Name
                    </label>
                    <input
                      id="column-name"
                      name="name"
                      required
                      value={form.name}
                      onChange={handleChange}
                      aria-invalid={Boolean(errors.name)}
                      aria-describedby={errors.name ? 'column-name-error' : undefined}
                      className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      placeholder="In progress"
                    />
                    {errors.name ? (
                      <p id="column-name-error" className="text-xs text-rose-600">
                        {errors.name}
                      </p>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="column-wip" className="text-sm font-semibold text-slate-700">
                      Limit
                    </label>
                    <input
                      id="column-wip"
                      name="wipLimit"
                      type="number"
                      min="0"
                      value={form.wipLimit}
                      onChange={handleChange}
                      aria-invalid={Boolean(errors.wipLimit)}
                      aria-describedby={errors.wipLimit ? 'column-wip-error' : undefined}
                      className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      placeholder="Unlimited"
                    />
                    {errors.wipLimit ? (
                      <p id="column-wip-error" className="text-xs text-rose-600">
                        {errors.wipLimit}
                      </p>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="column-color" className="text-sm font-semibold text-slate-700">
                      Accent color
                    </label>
                    <input
                      id="column-color"
                      name="color"
                      type="text"
                      value={form.color}
                      onChange={handleChange}
                      aria-invalid={Boolean(errors.color)}
                      aria-describedby={errors.color ? 'column-color-error' : undefined}
                      className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      placeholder="#2563eb"
                    />
                    {errors.color ? (
                      <p id="column-color-error" className="text-xs text-rose-600">
                        {errors.color}
                      </p>
                    ) : null}
                  </div>
                  {errors.form ? <p className="text-xs text-rose-600">{errors.form}</p> : null}
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accentDark disabled:opacity-60"
                    >
                      {submitting ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

ColumnDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  mode: PropTypes.oneOf(['create', 'edit']).isRequired,
  initialValue: PropTypes.shape({
    name: PropTypes.string,
    wipLimit: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    color: PropTypes.string,
  }),
  onSubmit: PropTypes.func,
  onClose: PropTypes.func,
};

ColumnDrawer.defaultProps = {
  initialValue: null,
};
