import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import OverviewHeroCard from './OverviewHeroCard.jsx';

export default function OverviewPreviewModal({ open, data, onClose }) {
  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/60" aria-hidden="true" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-6">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4"
              enterTo="opacity-100 translate-y-0"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-4"
            >
              <Dialog.Panel className="relative w-full max-w-5xl">
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute right-4 top-4 z-20 rounded-full bg-white/80 p-2 text-slate-700 shadow hover:bg-white"
                >
                  <span className="sr-only">Close preview</span>
                  <XMarkIcon className="h-5 w-5" />
                </button>
                <OverviewHeroCard data={data} canEdit={false} />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

OverviewPreviewModal.propTypes = {
  open: PropTypes.bool.isRequired,
  data: PropTypes.object,
  onClose: PropTypes.func.isRequired,
};
