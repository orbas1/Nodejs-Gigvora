import PropTypes from 'prop-types';
import classNames from '../../utils/classNames.js';

const TAB_STYLE_BASE =
  'flex-1 rounded-2xl px-3 py-2 text-center text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2';

const ACTIVE_STYLE = 'bg-slate-900 text-white shadow-sm focus:ring-slate-200';
const INACTIVE_STYLE = 'bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-100 focus:ring-slate-300';

export default function NetworkingTabBar({ value, onChange, tabs }) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-3xl bg-slate-100 p-2">
      {tabs.map((tab) => {
        const isActive = tab === value;
        return (
          <button
            key={tab}
            type="button"
            className={classNames(TAB_STYLE_BASE, isActive ? ACTIVE_STYLE : INACTIVE_STYLE)}
            onClick={() => onChange(tab)}
          >
            {tab}
          </button>
        );
      })}
    </div>
  );
}

NetworkingTabBar.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  tabs: PropTypes.arrayOf(PropTypes.string),
};

NetworkingTabBar.defaultProps = {
  tabs: ['Home', 'Sessions', 'Spend', 'People'],
};
