import { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import classNames from '../../utils/classNames.js';

export default function NetworkingSlideOver({
  open,
  title,
  subtitle,
  onClose,
  children,
  footer,
  size,
  preventClose,
}) {
  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={preventClose ? () => {} : onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 flex justify-end overflow-hidden">
          <Transition.Child
            as={Fragment}
            enter="transform transition ease-in-out duration-300"
            enterFrom="translate-x-full"
            enterTo="translate-x-0"
            leave="transform transition ease-in-out duration-200"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-full"
          >
            <Dialog.Panel
              className={classNames(
                'relative flex h-full w-full max-w-2xl flex-col overflow-hidden bg-white shadow-2xl',
                size === 'wide' ? 'max-w-3xl' : '',
              )}
            >
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-4">
                <div className="space-y-1">
                  <Dialog.Title className="text-lg font-semibold text-slate-900">{title}</Dialog.Title>
                  {subtitle ? <p className="text-sm text-slate-500">{subtitle}</p> : null}
                </div>
                <button
                  type="button"
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500 shadow-sm hover:bg-slate-100"
                  onClick={() => (!preventClose ? onClose() : null)}
                  disabled={preventClose}
                >
                  Close
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>

              {footer ? <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">{footer}</div> : null}
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

NetworkingSlideOver.propTypes = {
  open: PropTypes.bool,
  title: PropTypes.string,
  subtitle: PropTypes.string,
  onClose: PropTypes.func,
  children: PropTypes.node,
  footer: PropTypes.node,
  size: PropTypes.oneOf(['default', 'wide']),
  preventClose: PropTypes.bool,
};

NetworkingSlideOver.defaultProps = {
  open: false,
  title: '',
  subtitle: undefined,
  onClose: () => {},
  children: null,
  footer: null,
  size: 'default',
  preventClose: false,
};
