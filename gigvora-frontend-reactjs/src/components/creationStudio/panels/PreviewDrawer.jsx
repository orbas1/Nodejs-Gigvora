import { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import { extractPackages, extractFaqs, CREATION_TYPES } from '../config.js';

export default function PreviewDrawer({ open, item, onClose, onEdit }) {
  const typeLabel = item ? CREATION_TYPES.find((type) => type.id === item.type)?.name ?? item.type : '';
  const packages = item ? extractPackages(item.metadata) : [];
  const faqs = item ? extractFaqs(item.metadata) : [];

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-40" onClose={onClose}>
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

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-out duration-200"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in duration-150"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-3xl bg-white shadow-xl">
                  <div className="flex h-full flex-col">
                    <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                      <div>
                        <Dialog.Title className="text-lg font-semibold text-slate-900">{item?.title}</Dialog.Title>
                        <p className="text-sm text-slate-500">
                          {typeLabel}
                          {item?.status ? ` · ${item.status}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onEdit(item)}
                          className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={onClose}
                          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                        >
                          Close
                        </button>
                      </div>
                    </header>
                    <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
                      {item?.summary ? (
                        <section className="space-y-2">
                          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Summary</h3>
                          <p className="text-sm text-slate-700">{item.summary}</p>
                        </section>
                      ) : null}
                      {item?.description ? (
                        <section className="space-y-2">
                          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Details</h3>
                          <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">{item.description}</p>
                        </section>
                      ) : null}
                      {item?.deliverables?.length ? (
                        <section className="space-y-2">
                          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Deliverables</h3>
                          <ul className="space-y-1 text-sm text-slate-700">
                            {item.deliverables.map((entry) => (
                              <li key={entry}>• {entry}</li>
                            ))}
                          </ul>
                        </section>
                      ) : null}
                      {packages?.some((pkg) => pkg.price || pkg.features?.length) ? (
                        <section className="space-y-3">
                          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Packages</h3>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {packages.map((pkg) => (
                              <article key={pkg.id} className="rounded-2xl border border-slate-200 p-4">
                                <h4 className="text-sm font-semibold text-slate-900">{pkg.name}</h4>
                                {pkg.price ? <p className="text-lg font-bold text-slate-900">{pkg.price}</p> : null}
                                {pkg.deliveryTime ? (
                                  <p className="text-xs font-medium text-slate-500">{pkg.deliveryTime}</p>
                                ) : null}
                                {pkg.features?.length ? (
                                  <ul className="mt-2 space-y-1 text-xs text-slate-600">
                                    {pkg.features.map((feature) => (
                                      <li key={feature}>• {feature}</li>
                                    ))}
                                  </ul>
                                ) : null}
                              </article>
                            ))}
                          </div>
                        </section>
                      ) : null}
                      {faqs?.length ? (
                        <section className="space-y-3">
                          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">FAQ</h3>
                          <dl className="space-y-3">
                            {faqs.map((faq) => (
                              <div key={faq.id} className="space-y-1 rounded-xl border border-slate-200 p-4">
                                <dt className="text-sm font-semibold text-slate-900">{faq.question}</dt>
                                <dd className="text-sm text-slate-600">{faq.answer}</dd>
                              </div>
                            ))}
                          </dl>
                        </section>
                      ) : null}
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

PreviewDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  item: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    type: PropTypes.string.isRequired,
    title: PropTypes.string,
    summary: PropTypes.string,
    description: PropTypes.string,
    status: PropTypes.string,
    deliverables: PropTypes.arrayOf(PropTypes.string),
    metadata: PropTypes.object,
  }),
  onClose: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
};
