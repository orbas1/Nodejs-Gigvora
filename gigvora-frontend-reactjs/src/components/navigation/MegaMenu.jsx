import { Fragment, useCallback, useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { Popover, Transition } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { analytics } from '../../services/analytics.js';
import { useNavigationTheme } from '../../context/NavigationThemeContext.jsx';
import { classNames } from '../../utils/classNames.js';

function MegaMenuBody({ item, open }) {
  const panelRef = useRef(null);
  const previousOpen = useRef(open);
  const theme = useNavigationTheme();

  const sectionLengths = useMemo(() => item.sections.map((section) => section.items.length), [item.sections]);

  useEffect(() => {
    if (open && !previousOpen.current) {
      analytics.track('navigation.megamenu.opened', {
        menuId: item.id,
        menuLabel: item.label,
      });
    }
    previousOpen.current = open;
  }, [item.id, item.label, open]);

  const focusItem = useCallback((columnIndex, itemIndex) => {
    const node = panelRef.current?.querySelector(
      `[data-column-index="${columnIndex}"][data-item-index="${itemIndex}"]`,
    );
    node?.focus();
  }, []);

  const handleItemKeyDown = useCallback(
    (event) => {
      const { key } = event;
      if (!['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(key)) {
        return;
      }
      event.preventDefault();
      const columnIndex = Number(event.currentTarget.dataset.columnIndex);
      const itemIndex = Number(event.currentTarget.dataset.itemIndex);
      if (Number.isNaN(columnIndex) || Number.isNaN(itemIndex)) {
        return;
      }
      const columnLength = sectionLengths[columnIndex] ?? 0;
      let nextColumn = columnIndex;
      let nextItem = itemIndex;

      if (key === 'ArrowDown') {
        nextItem = Math.min(itemIndex + 1, columnLength - 1);
      } else if (key === 'ArrowUp') {
        nextItem = Math.max(itemIndex - 1, 0);
      } else if (key === 'Home') {
        nextItem = 0;
      } else if (key === 'End') {
        nextItem = Math.max(0, columnLength - 1);
      } else if (key === 'ArrowRight') {
        nextColumn = Math.min(columnIndex + 1, sectionLengths.length - 1);
        nextItem = Math.min(nextItem, Math.max(0, (sectionLengths[nextColumn] ?? 1) - 1));
      } else if (key === 'ArrowLeft') {
        nextColumn = Math.max(columnIndex - 1, 0);
        nextItem = Math.min(nextItem, Math.max(0, (sectionLengths[nextColumn] ?? 1) - 1));
      }

      focusItem(nextColumn, nextItem);
    },
    [focusItem, sectionLengths],
  );

  const handleNavigate = useCallback(
    (entry) => {
      analytics.track('navigation.megamenu.navigate', {
        menuId: item.id,
        menuLabel: item.label,
        itemLabel: entry.name,
        target: entry.to,
      });
    },
    [item.id, item.label],
  );

  const buttonClassName = classNames(
    'inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    theme.button?.base,
    open ? theme.button?.open : null,
  );

  const iconClassName = classNames('h-4 w-4 transition', open ? theme.button?.iconOpen : theme.button?.icon);

  const panelClassName = classNames(
    'overflow-hidden rounded-3xl border shadow-xl backdrop-blur',
    theme.panel?.container,
  );

  const headingClassName = classNames('text-xs font-semibold uppercase tracking-[0.25em]', theme.panel?.heading);
  const descriptionClassName = classNames('mt-1 text-sm', theme.panel?.description);
  const panelHeaderClassName = classNames('border-b px-6 py-4', theme.panel?.divider);
  const itemClassName = classNames(
    'group flex items-start gap-3 rounded-2xl border px-3 py-2 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    theme.panel?.item,
  );
  const itemHeadingClassName = classNames('text-sm font-semibold', theme.panel?.itemHeading);
  const itemDescriptionClassName = classNames('mt-1 text-xs', theme.panel?.itemDescription);
  const itemIconClassName = classNames('h-6 w-6 flex-none transition-colors', theme.panel?.itemIcon);

  return (
    <>
      <Popover.Button className={buttonClassName}>
        <span>{item.label}</span>
        <ChevronDownIcon className={iconClassName} aria-hidden="true" />
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
        <Popover.Panel
          ref={panelRef}
          className="absolute left-1/2 z-50 mt-6 w-screen max-w-3xl -translate-x-1/2 transform px-4 sm:px-0"
        >
          <div className={panelClassName}>
            <div className={panelHeaderClassName}>
              <p className={headingClassName}>{item.label}</p>
              <p className={descriptionClassName}>{item.description}</p>
            </div>
            <div className="grid gap-6 px-6 py-6 sm:grid-cols-2">
              {item.sections.map((section, columnIndex) => (
                <div key={section.title} className="space-y-4">
                  <div>
                    <p className={headingClassName}>{section.title}</p>
                  </div>
                  <ul className="space-y-3">
                    {section.items.map((entry, itemIndex) => (
                      <li key={entry.name}>
                        <Link
                          to={entry.to}
                          className={itemClassName}
                          data-column-index={columnIndex}
                          data-item-index={itemIndex}
                          onKeyDown={handleItemKeyDown}
                          onClick={() => handleNavigate(entry)}
                        >
                          <entry.icon className={itemIconClassName} />
                          <div>
                            <p className={itemHeadingClassName}>{entry.name}</p>
                            <p className={itemDescriptionClassName}>{entry.description}</p>
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
  );
}

MegaMenuBody.propTypes = {
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
  open: PropTypes.bool.isRequired,
};

export default function MegaMenu({ item }) {
  return (
    <Popover className="relative">
      {({ open }) => <MegaMenuBody item={item} open={open} />}
    </Popover>
  );
}

MegaMenu.propTypes = MegaMenuBody.propTypes;
