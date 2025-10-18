import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useEffect, useState } from 'react';

const INITIAL_STATE = Object.freeze({
  name: '',
  wipLimit: '',
  color: '',
});

export default function ColumnDrawer({ open, mode, initialValue, onSubmit, onClose }) {
  const [form, setForm] = useState(INITIAL_STATE);

  useEffect(() => {
    if (open) {
      setForm({
        name: initialValue?.name ?? '',
        wipLimit: initialValue?.wipLimit ?? '',
        color: initialValue?.color ?? '',
      });
    }
  }, [open, initialValue]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onSubmit?.({
      name: form.name,
      wipLimit: form.wipLimit === '' ? null : Number(form.wipLimit),
      color: form.color || null,
    });
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
                <form className="space-y-4" onSubmit={handleSubmit}>
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
                      className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      placeholder="In progress"
                    />
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
                      className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      placeholder="Unlimited"
                    />
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
                      className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      placeholder="#2563eb"
                    />
                  </div>
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
                      className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accentDark"
                    >
                      Save
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
