import { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Popover, Transition } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function MegaMenu({ item }) {
  return (
    <Popover className="relative">
      {({ open }) => (
        <>
          <Popover.Button
            className={classNames(
              open
                ? 'text-slate-900'
                : 'text-slate-600 hover:text-slate-900 focus:text-slate-900',
              'inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-white',
            )}
          >
            <span>{item.label}</span>
            <ChevronDownIcon
              className={classNames(open ? 'rotate-180 text-slate-900' : 'text-slate-400', 'h-4 w-4 transition')}
              aria-hidden="true"
            />
          </Popover.Button>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-1"
          >
            <Popover.Panel className="absolute left-1/2 z-50 mt-6 w-screen max-w-3xl -translate-x-1/2 transform px-4 sm:px-0">
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white/95 shadow-xl backdrop-blur">
                <div className="border-b border-slate-200/60 px-6 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">{item.label}</p>
                  <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                </div>
                <div className="grid gap-6 px-6 py-6 sm:grid-cols-2">
                  {item.sections.map((section) => (
                    <div key={section.title} className="space-y-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">{section.title}</p>
                      </div>
                      <ul className="space-y-3">
                        {section.items.map((entry) => (
                          <li key={entry.name}>
                            <Link
                              to={entry.to}
                              className="group flex items-start gap-3 rounded-2xl border border-transparent px-3 py-2 transition hover:border-slate-200 hover:bg-slate-50"
                            >
                              <entry.icon className="h-6 w-6 flex-none text-accent group-hover:text-accent-strong" />
                              <div>
                                <p className="text-sm font-semibold text-slate-900 group-hover:text-slate-900">{entry.name}</p>
                                <p className="mt-1 text-xs text-slate-500">{entry.description}</p>
                              </div>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </Popover.Panel>
          </Transition>
        </>
      )}
    </Popover>
  );
}

MegaMenu.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    description: PropTypes.string,
    sections: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string.isRequired,
        items: PropTypes.arrayOf(
          PropTypes.shape({
            name: PropTypes.string.isRequired,
            description: PropTypes.string.isRequired,
            to: PropTypes.string.isRequired,
            icon: PropTypes.elementType.isRequired,
          }),
        ).isRequired,
      }),
    ).isRequired,
  }).isRequired,
};
