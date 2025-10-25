import PropTypes from 'prop-types';
import { useEffect, useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { classNames } from '../../utils/classNames.js';

export default function VirtualizedMessageList({
  items,
  renderRow,
  itemKey,
  estimateSize,
  overscan,
  className,
}) {
  const containerRef = useRef(null);
  const sanitizedItems = useMemo(() => (Array.isArray(items) ? items : []), [items]);
  const virtualizer = useVirtualizer({
    count: sanitizedItems.length,
    getScrollElement: () => containerRef.current,
    estimateSize: estimateSize ?? (() => 96),
    overscan,
  });

  const virtualItems = virtualizer.getVirtualItems();
  const shouldFallback = virtualItems.length === 0 && sanitizedItems.length > 0;

  useEffect(() => {
    virtualizer.measure();
  }, [sanitizedItems, virtualizer]);

  return (
    <div
      ref={containerRef}
      className={classNames('overflow-y-auto', className)}
      data-testid="virtualized-message-list"
    >
      {shouldFallback ? (
        <div className="space-y-2">
          {sanitizedItems.map((item, index) => {
            const key = itemKey ? itemKey(item, index) : item?.id ?? index;
            return (
              <div key={key} data-index={index}>
                {renderRow(item, index)}
              </div>
            );
          })}
        </div>
      ) : (
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualItems.map((virtualRow) => {
            const item = sanitizedItems[virtualRow.index];
            const key = itemKey ? itemKey(item, virtualRow.index) : item?.id ?? virtualRow.index;
            return (
              <div
                key={key}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                className="absolute left-0 top-0 w-full"
                style={{ transform: `translateY(${virtualRow.start}px)` }}
              >
                {renderRow(item, virtualRow.index)}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

VirtualizedMessageList.propTypes = {
  items: PropTypes.arrayOf(PropTypes.any),
  renderRow: PropTypes.func.isRequired,
  itemKey: PropTypes.func,
  estimateSize: PropTypes.func,
  overscan: PropTypes.number,
  className: PropTypes.string,
};

VirtualizedMessageList.defaultProps = {
  items: [],
  itemKey: undefined,
  estimateSize: undefined,
  overscan: 8,
  className: '',
};
