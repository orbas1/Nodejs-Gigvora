import { ArrowTopRightOnSquareIcon, UserGroupIcon, UsersIcon } from '@heroicons/react/24/outline';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import UserAvatar from '../UserAvatar.jsx';

export default function ProfileHubQuickPanel({ profileOverview, profileHub, onOpen }) {
  const navigate = useNavigate();
  const handleOpen = () => {
    if (onOpen) {
      onOpen();
      return;
    }
    navigate('/dashboard/user/profile');
  };

  const followers = profileHub?.followers ?? {};
  const connections = profileHub?.connections ?? {};

  return (
    <section className="rounded-4xl border border-slate-200 bg-white/80 p-6 shadow-soft">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <UserAvatar
            name={profileOverview?.name}
            imageUrl={profileOverview?.avatarUrl}
            seed={profileOverview?.avatarSeed ?? profileOverview?.name}
            size="lg"
          />
          <div className="min-w-0">
            <h3 className="truncate text-xl font-semibold text-slate-900">{profileOverview?.name ?? 'Your profile'}</h3>
            <p className="truncate text-sm text-slate-500">{profileOverview?.headline ?? 'Add headline'}</p>
            <p className="truncate text-xs text-slate-400">{profileOverview?.location}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-3xl border border-slate-200 bg-white/70 px-4 py-2 text-sm text-slate-600">
            <UserGroupIcon className="h-4 w-4 text-accent" />
            <span>{followers.total ?? 0} followers</span>
          </div>
          <div className="flex items-center gap-2 rounded-3xl border border-slate-200 bg-white/70 px-4 py-2 text-sm text-slate-600">
            <UsersIcon className="h-4 w-4 text-accent" />
            <span>{connections.total ?? connections.items?.length ?? 0} connections</span>
          </div>
          <button
            type="button"
            onClick={handleOpen}
            className="inline-flex items-center gap-2 rounded-2xl bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent/90"
          >
            Workspace <ArrowTopRightOnSquareIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

ProfileHubQuickPanel.propTypes = {
  profileOverview: PropTypes.shape({
    name: PropTypes.string,
    headline: PropTypes.string,
    location: PropTypes.string,
    avatarUrl: PropTypes.string,
    avatarSeed: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
  profileHub: PropTypes.shape({
    followers: PropTypes.shape({
      total: PropTypes.number,
    }),
    connections: PropTypes.shape({
      total: PropTypes.number,
      items: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        }),
      ),
    }),
  }),
  onOpen: PropTypes.func,
};

ProfileHubQuickPanel.defaultProps = {
  profileOverview: undefined,
  profileHub: undefined,
  onOpen: undefined,
};
