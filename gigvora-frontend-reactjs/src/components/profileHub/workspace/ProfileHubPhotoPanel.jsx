import PropTypes from 'prop-types';
import UserAvatar from '../../UserAvatar.jsx';

export default function ProfileHubPhotoPanel({
  profile,
  avatarUrlDraft,
  onAvatarDraftChange,
  onSelectFile,
  onApplyUrl,
  saving,
  fileInputRef,
}) {
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <UserAvatar
        name={profile?.name}
        imageUrl={profile?.avatarUrl}
        seed={profile?.avatarSeed ?? profile?.name}
        size="xl"
      />
      <div className="w-full max-w-sm space-y-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={saving}
          className="w-full rounded-2xl bg-slate-900/90 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Upload photo
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onSelectFile}
          className="hidden"
        />
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-3 text-left text-sm text-slate-600">
          <label className="flex flex-col gap-2">
            <span className="font-medium text-slate-700">Paste image link</span>
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={avatarUrlDraft}
                onChange={(event) => onAvatarDraftChange(event.target.value)}
                placeholder="https://"
                className="flex-1 rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
              />
              <button
                type="button"
                onClick={onApplyUrl}
                disabled={saving || !avatarUrlDraft}
                className="rounded-2xl bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Apply
              </button>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}

ProfileHubPhotoPanel.propTypes = {
  profile: PropTypes.shape({
    name: PropTypes.string,
    avatarUrl: PropTypes.string,
    avatarSeed: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
  avatarUrlDraft: PropTypes.string.isRequired,
  onAvatarDraftChange: PropTypes.func.isRequired,
  onSelectFile: PropTypes.func.isRequired,
  onApplyUrl: PropTypes.func.isRequired,
  saving: PropTypes.bool,
  fileInputRef: PropTypes.shape({ current: PropTypes.any }),
};

ProfileHubPhotoPanel.defaultProps = {
  profile: undefined,
  saving: false,
  fileInputRef: undefined,
};
