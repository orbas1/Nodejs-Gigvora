import PropTypes from 'prop-types';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

function classNames(...values) {
  return values.filter(Boolean).join(' ');
}

export default function MarketplaceSearchInput({
  id,
  label = 'Search',
  value,
  onChange,
  placeholder,
  className = '',
  inputClassName = '',
  autoComplete = 'off',
  ...rest
}) {
  const inputId = id ?? 'marketplace-search-input';

  return (
    <div className={classNames('w-full', className)}>
      <label className="sr-only" htmlFor={inputId}>
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
          <MagnifyingGlassIcon className="h-5 w-5" aria-hidden="true" />
        </span>
        <input
          id={inputId}
          type="search"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={classNames(
            'w-full rounded-full border border-slate-200 bg-white py-3 pl-11 pr-5 text-sm text-slate-700 shadow-sm transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30',
            inputClassName,
          )}
          {...rest}
        />
      </div>
    </div>
  );
}

MarketplaceSearchInput.propTypes = {
  id: PropTypes.string,
  label: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  inputClassName: PropTypes.string,
  autoComplete: PropTypes.string,
};
