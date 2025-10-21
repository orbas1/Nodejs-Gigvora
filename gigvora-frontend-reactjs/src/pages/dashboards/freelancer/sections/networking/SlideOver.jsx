import { Dialog, Transition } from '@headlessui/react';
import PropTypes from 'prop-types';
import { Fragment, useEffect, useMemo, useRef } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const noop = () => {};
const ElementType = typeof Element === 'undefined' ? function ElementType() {} : Element;

function resolvePanelWidth(size) {
  switch (size) {
    case 'lg':
      return 'max-w-2xl';
    case 'xl':
      return 'max-w-4xl';
    case 'md':
    default:
      return 'max-w-md';
  }
}

export default function SlideOver({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
  dismissible = true,
  initialFocusRef,
}) {
  const closeButtonRef = useRef(null);
  const resolvedTitle = useMemo(() => {
    if (typeof title === 'string' && title.trim() === '') {
      return 'Panel';
    }
    if (title == null) {
      return 'Panel';
    }
    return title;
  }, [title]);

  const safeOnClose = dismissible && typeof onClose === 'function' ? onClose : noop;
  const focusTarget = initialFocusRef ?? (dismissible ? closeButtonRef : null);

  useEffect(() => {
    if (!open && dismissible && closeButtonRef.current) {
      closeButtonRef.current.blur();
    }
  }, [open, dismissible]);

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-50"
        onClose={dismissible ? safeOnClose : noop}
        initialFocus={focusTarget}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/30" />
        </Transition.Child>

        <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
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
              className={`pointer-events-auto w-screen ${resolvePanelWidth(size)} bg-white shadow-xl`}
            >
              <div className="flex h-full flex-col overflow-y-auto">
                <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
                  <div>
                    <Dialog.Title className="text-lg font-semibold text-slate-900">
                      {resolvedTitle}
                    </Dialog.Title>
                    {subtitle ? (
                      <Dialog.Description className="mt-1 text-sm text-slate-500">
                        {subtitle}
                      </Dialog.Description>
                    ) : null}
                  </div>
                  {dismissible ? (
                    <button
                      type="button"
                      ref={closeButtonRef}
                      onClick={safeOnClose}
                      className="ml-3 inline-flex h-10 w-10 items-center justify-center rounded-full border border-transparent text-slate-400 transition hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                      <span className="sr-only">Close panel</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  ) : null}
                </div>
                <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">{children}</div>
                {footer ? <div className="border-t border-slate-200 px-6 py-4">{footer}</div> : null}
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

SlideOver.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  subtitle: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  children: PropTypes.node,
  footer: PropTypes.node,
  size: PropTypes.oneOf(['md', 'lg', 'xl']),
  dismissible: PropTypes.bool,
  initialFocusRef: PropTypes.shape({ current: PropTypes.instanceOf(ElementType) }),
};

SlideOver.defaultProps = {
  open: false,
  onClose: noop,
  title: 'Panel',
  subtitle: null,
  children: null,
  footer: null,
  size: 'md',
  dismissible: true,
  initialFocusRef: null,
};
