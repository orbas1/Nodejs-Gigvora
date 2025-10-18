import { Dialog, Transition } from '@headlessui/react';
import PropTypes from 'prop-types';
import { Fragment } from 'react';

const SIZE_CLASS = {
  sm: 'sm:max-w-lg',
  md: 'sm:max-w-2xl',
  lg: 'sm:max-w-4xl',
  xl: 'sm:max-w-6xl',
  full: 'sm:max-w-7xl',
};

export default function WorkspaceDialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size,
  fullHeight,
}) {
  const sizeClass = SIZE_CLASS[size] || SIZE_CLASS.md;

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
          <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-stretch justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel
                className={`relative flex w-full transform flex-col overflow-hidden rounded-3xl bg-white shadow-2xl transition-all ${sizeClass}`}
                style={fullHeight ? { maxHeight: 'calc(100vh - 4rem)' } : undefined}
              >
                <div className="border-b border-slate-100 p-6">
                  <Dialog.Title className="text-lg font-semibold text-slate-900">{title}</Dialog.Title>
                  {description ? (
                    <p className="mt-2 text-sm text-slate-500">{description}</p>
                  ) : null}
                </div>
                <div className={`flex-1 overflow-y-auto ${fullHeight ? 'p-6' : 'p-6'}`}>{children}</div>
                {footer ? (
                  <div className="border-t border-slate-100 bg-slate-50 p-6">{footer}</div>
                ) : null}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

WorkspaceDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  children: PropTypes.node.isRequired,
  footer: PropTypes.node,
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl', 'full']),
  fullHeight: PropTypes.bool,
};

WorkspaceDialog.defaultProps = {
  description: undefined,
  footer: undefined,
  size: 'md',
  fullHeight: false,
};
