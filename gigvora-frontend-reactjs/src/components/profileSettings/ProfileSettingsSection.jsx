import { useEffect, useMemo, useState } from 'react';
import {
  buildProfileDraft,
  normalizeProfileDraft,
  buildAvailabilityDraft,
  buildAvailabilityPayload,
  buildIdentityDraft,
  validateIdentityDraft,
} from '../../utils/profileDraft.js';
import { formatRelativeTime } from '../../utils/date.js';
import { updateProfile } from '../../services/profile.js';
import { updateUserAccount } from '../../services/user.js';
import ProfileEditor from '../ProfileEditor.jsx';
import ProfileIdentityCard from './ProfileIdentityCard.jsx';
import ProfileAvailabilityCard from './ProfileAvailabilityCard.jsx';
import ProfileStoryCard from './ProfileStoryCard.jsx';
import ProfileTagsCard from './ProfileTagsCard.jsx';
import ProfileExperienceCard from './ProfileExperienceCard.jsx';
import ProfileCredentialsCard from './ProfileCredentialsCard.jsx';
import ProfileReferencesCard from './ProfileReferencesCard.jsx';
import ProfileCollaborationCard from './ProfileCollaborationCard.jsx';
import { Squares2X2Icon, UserCircleIcon, ChatBubbleBottomCenterTextIcon, UsersIcon } from '@heroicons/react/24/outline';
import { ClockIcon, AcademicCapIcon, BriefcaseIcon, BookmarkIcon } from '@heroicons/react/24/outline';
import PropTypes from 'prop-types';

function stableStringify(value) {
  return JSON.stringify(value, Object.keys(value).sort());
}

const EDIT_ROLES = new Set(['user', 'freelancer', 'agency', 'company', 'headhunter', 'mentor', 'admin']);

function buildNavItems({ completionValue, trustScoreValue, availabilityLabel, launchpadBadge }) {
  return [
    { id: 'identity', label: 'Identity', icon: UserCircleIcon },
    { id: 'availability', label: 'Availability', icon: ClockIcon },
    { id: 'story', label: 'Story', icon: ChatBubbleBottomCenterTextIcon },
    { id: 'tags', label: 'Tags', icon: BookmarkIcon },
    { id: 'work', label: 'Work', icon: BriefcaseIcon },
    { id: 'credentials', label: 'Credentials', icon: AcademicCapIcon },
    { id: 'references', label: 'Refs', icon: Squares2X2Icon },
    { id: 'team', label: 'Team', icon: UsersIcon },
  ].map((item) => ({
    ...item,
    badge:
      item.id === 'identity' && completionValue
        ? completionValue
        : item.id === 'identity' && trustScoreValue
        ? trustScoreValue
        : item.id === 'availability' && availabilityLabel
        ? availabilityLabel
        : item.id === 'team' && launchpadBadge
        ? launchpadBadge
        : null,
  }));
}

export default function ProfileSettingsSection({ profile, userId, onRefresh, session }) {
  const initialProfileDraft = useMemo(() => buildProfileDraft(profile), [profile]);
  const initialAvailabilityDraft = useMemo(() => buildAvailabilityDraft(profile), [profile]);
  const initialIdentityDraft = useMemo(() => buildIdentityDraft(profile), [profile]);

  const [profileDraft, setProfileDraft] = useState(initialProfileDraft);
  const [availabilityDraft, setAvailabilityDraft] = useState(initialAvailabilityDraft);
  const [identityDraft, setIdentityDraft] = useState(initialIdentityDraft);
  const [profileSaving, setProfileSaving] = useState(false);
  const [identitySaving, setIdentitySaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const [identityErrors, setIdentityErrors] = useState([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [activePanel, setActivePanel] = useState('identity');

  useEffect(() => {
    setProfileDraft(initialProfileDraft);
    setAvailabilityDraft(initialAvailabilityDraft);
    setIdentityDraft(initialIdentityDraft);
    setValidationErrors([]);
    setIdentityErrors([]);
  }, [initialProfileDraft, initialAvailabilityDraft, initialIdentityDraft]);

  const memberships = Array.isArray(session?.memberships) ? session.memberships : [];
  const canEdit = memberships.length === 0 || memberships.some((role) => EDIT_ROLES.has(role));

  const initialProfilePayload = useMemo(
    () => normalizeProfileDraft(initialProfileDraft).payload,
    [initialProfileDraft],
  );
  const currentProfilePayload = useMemo(
    () => normalizeProfileDraft(profileDraft).payload,
    [profileDraft],
  );

  const isProfileDirty = useMemo(() => {
    return stableStringify(initialProfilePayload) !== stableStringify(currentProfilePayload);
  }, [currentProfilePayload, initialProfilePayload]);

  const isAvailabilityDirty = useMemo(() => {
    const normalize = (draft) => ({
      status: draft.status ?? 'limited',
      hoursPerWeek: draft.hoursPerWeek === '' || draft.hoursPerWeek == null ? '' : Number(draft.hoursPerWeek),
      openToRemote: Boolean(draft.openToRemote),
      notes: draft.notes ?? '',
      timezone: draft.timezone ?? '',
    });
    return stableStringify(normalize(initialAvailabilityDraft)) !== stableStringify(normalize(availabilityDraft));
  }, [availabilityDraft, initialAvailabilityDraft]);

  const isIdentityDirty = useMemo(() => {
    return stableStringify(initialIdentityDraft) !== stableStringify(identityDraft);
  }, [identityDraft, initialIdentityDraft]);

  const availabilityLastUpdated = profile?.availability?.lastUpdatedAt
    ? formatRelativeTime(profile.availability.lastUpdatedAt)
    : null;

  const profileMetrics = profile?.metrics ?? {};
  const completionValue = profileMetrics.profileCompletion == null
    ? null
    : `${Number(profileMetrics.profileCompletion).toFixed(0)}%`;

  const trustScoreValue = profileMetrics.trustScore == null
    ? null
    : Number(profileMetrics.trustScore).toFixed(2);

  const launchpadBadge = profile?.launchpadEligibility?.status === 'eligible' ? 'Launchpad ready' : null;
  const availabilityLabel = profile?.availability?.status
    ? profile.availability.status
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
    : null;

  const badges = [launchpadBadge, availabilityLabel].filter(Boolean);

  const navItems = buildNavItems({ completionValue, trustScoreValue, availabilityLabel, launchpadBadge });

  const handleIdentityChange = (field, value) => {
    setIdentityDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleAvailabilityChange = (field, value) => {
    setAvailabilityDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleProfileFieldChange = (field, value) => {
    setProfileDraft((prev) => ({ ...prev, [field]: value }));
  };

  const updateDraftCollectionItem = (field, index, updates) => {
    setProfileDraft((prev) => ({
      ...prev,
      [field]: prev[field].map((item, idx) => (idx === index ? { ...item, ...updates } : item)),
    }));
  };

  const removeDraftCollectionItem = (field, index) => {
    setProfileDraft((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, idx) => idx !== index),
    }));
  };

  const appendDraftCollectionItem = (field, item) => {
    setProfileDraft((prev) => ({
      ...prev,
      [field]: [...prev[field], item],
    }));
  };

  const resetDrafts = () => {
    setProfileDraft(initialProfileDraft);
    setAvailabilityDraft(initialAvailabilityDraft);
    setIdentityDraft(initialIdentityDraft);
    setValidationErrors([]);
    setIdentityErrors([]);
    setError(null);
    setFeedback(null);
  };

  const handleIdentitySave = async () => {
    if (!canEdit || !userId) {
      return;
    }
    const errors = validateIdentityDraft(identityDraft);
    setIdentityErrors(errors);
    if (errors.length > 0) {
      return;
    }
    setIdentitySaving(true);
    setFeedback(null);
    setError(null);
    try {
      await updateUserAccount(userId, {
        firstName: identityDraft.firstName?.trim() || null,
        lastName: identityDraft.lastName?.trim() || null,
        email: identityDraft.email?.trim() || null,
        location: identityDraft.location?.trim() || null,
        timezone: identityDraft.timezone?.trim() || null,
      });
      setIdentityErrors([]);
      setFeedback('Account contact details updated.');
      if (onRefresh) {
        await onRefresh({ force: true });
      }
    } catch (err) {
      setError(err?.body?.message ?? err.message ?? 'Unable to update account details.');
    } finally {
      setIdentitySaving(false);
    }
  };

  const handleProfileSave = async () => {
    if (!canEdit || !userId) {
      return;
    }
    const { payload, errors } = normalizeProfileDraft(profileDraft);
    setValidationErrors(errors);
    if (errors.length > 0) {
      return;
    }
    const availabilityPayload = buildAvailabilityPayload(availabilityDraft, payload);
    setProfileSaving(true);
    setFeedback(null);
    setError(null);
    try {
      const result = await updateProfile(userId, { ...payload, ...availabilityPayload });
      setProfileDraft(buildProfileDraft(result));
      setAvailabilityDraft(buildAvailabilityDraft(result));
      setValidationErrors([]);
      setFeedback('Profile settings updated.');
      if (onRefresh) {
        await onRefresh({ force: true });
      }
    } catch (err) {
      setError(err?.body?.message ?? err.message ?? 'Unable to update profile settings.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleEditorSave = async (payload) => {
    if (!canEdit || !userId) {
      return;
    }
    setProfileSaving(true);
    setFeedback(null);
    setError(null);
    try {
      const result = await updateProfile(userId, payload);
      setProfileDraft(buildProfileDraft(result));
      setAvailabilityDraft(buildAvailabilityDraft(result));
      setValidationErrors([]);
      setEditorOpen(false);
      setFeedback('Profile settings updated.');
      if (onRefresh) {
        await onRefresh({ force: true });
      }
    } catch (err) {
      setError(err?.body?.message ?? err.message ?? 'Unable to update profile settings.');
      throw err;
    } finally {
      setProfileSaving(false);
    }
  };

  const disableProfileSave = !canEdit || (!isProfileDirty && !isAvailabilityDirty) || profileSaving;

  const renderPanel = (panel) => {
    switch (panel) {
      case 'identity':
        return (
          <ProfileIdentityCard
            identityDraft={identityDraft}
            profileDraft={profileDraft}
            onIdentityChange={handleIdentityChange}
            onProfileChange={handleProfileFieldChange}
            onSubmit={handleIdentitySave}
            saving={identitySaving}
            canEdit={canEdit}
            isDirty={isIdentityDirty}
            validationErrors={identityErrors}
          />
        );
      case 'availability':
        return (
          <ProfileAvailabilityCard
            availabilityDraft={availabilityDraft}
            onAvailabilityChange={handleAvailabilityChange}
            canEdit={canEdit}
            lastUpdatedAt={availabilityLastUpdated}
          />
        );
      case 'story':
        return <ProfileStoryCard profileDraft={profileDraft} onProfileChange={handleProfileFieldChange} canEdit={canEdit} />;
      case 'tags':
        return <ProfileTagsCard profileDraft={profileDraft} onProfileChange={handleProfileFieldChange} canEdit={canEdit} />;
      case 'work':
        return (
          <ProfileExperienceCard
            experience={profileDraft.experience}
            onAddExperience={() =>
              appendDraftCollectionItem('experience', {
                organization: '',
                role: '',
                startDate: '',
                endDate: '',
                description: '',
                highlights: [],
              })
            }
            onUpdateExperience={(index, updates) => updateDraftCollectionItem('experience', index, updates)}
            onRemoveExperience={(index) => removeDraftCollectionItem('experience', index)}
            canEdit={canEdit}
          />
        );
      case 'credentials':
        return (
          <ProfileCredentialsCard
            qualifications={profileDraft.qualifications}
            onAddQualification={() =>
              appendDraftCollectionItem('qualifications', {
                title: '',
                authority: '',
                year: '',
                credentialId: '',
                credentialUrl: '',
                description: '',
              })
            }
            onUpdateQualification={(index, updates) => updateDraftCollectionItem('qualifications', index, updates)}
            onRemoveQualification={(index) => removeDraftCollectionItem('qualifications', index)}
            portfolioLinks={profileDraft.portfolioLinks}
            onAddPortfolioLink={() =>
              appendDraftCollectionItem('portfolioLinks', {
                label: '',
                url: '',
                description: '',
              })
            }
            onUpdatePortfolioLink={(index, updates) => updateDraftCollectionItem('portfolioLinks', index, updates)}
            onRemovePortfolioLink={(index) => removeDraftCollectionItem('portfolioLinks', index)}
            canEdit={canEdit}
          />
        );
      case 'references':
        return (
          <ProfileReferencesCard
            references={profileDraft.references}
            onAddReference={() =>
              appendDraftCollectionItem('references', {
                name: '',
                relationship: '',
                company: '',
                email: '',
                phone: '',
                endorsement: '',
                weight: '',
                isVerified: false,
                lastInteractedAt: '',
              })
            }
            onUpdateReference={(index, updates) => updateDraftCollectionItem('references', index, updates)}
            onRemoveReference={(index) => removeDraftCollectionItem('references', index)}
            canEdit={canEdit}
          />
        );
      case 'team':
        return (
          <ProfileCollaborationCard
            collaborationRoster={profileDraft.collaborationRoster}
            onAddCollaborator={() =>
              appendDraftCollectionItem('collaborationRoster', {
                name: '',
                role: '',
                avatarSeed: '',
                contact: '',
              })
            }
            onUpdateCollaborator={(index, updates) => updateDraftCollectionItem('collaborationRoster', index, updates)}
            onRemoveCollaborator={(index) => removeDraftCollectionItem('collaborationRoster', index)}
            impactHighlights={profileDraft.impactHighlights}
            onAddImpact={() =>
              appendDraftCollectionItem('impactHighlights', {
                title: '',
                value: '',
                description: '',
              })
            }
            onUpdateImpact={(index, updates) => updateDraftCollectionItem('impactHighlights', index, updates)}
            onRemoveImpact={(index) => removeDraftCollectionItem('impactHighlights', index)}
            pipelineInsights={profileDraft.pipelineInsights}
            onAddPipeline={() =>
              appendDraftCollectionItem('pipelineInsights', {
                project: '',
                payout: '',
                status: '',
                countdown: '',
              })
            }
            onUpdatePipeline={(index, updates) => updateDraftCollectionItem('pipelineInsights', index, updates)}
            onRemovePipeline={(index) => removeDraftCollectionItem('pipelineInsights', index)}
            canEdit={canEdit}
          />
        );
      default:
        return null;
    }
  };

  return (
    <section
      id="profile"
      className="rounded-3xl border border-slate-200 bg-white p-0 shadow-sm ring-1 ring-black/5"
    >
      <div className="grid min-h-[720px] grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="flex flex-col gap-6 border-b border-slate-100 bg-slate-50/60 p-6 lg:border-b-0 lg:border-r">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">Profile</h2>
              <button
                type="button"
                onClick={() => setEditorOpen(true)}
                disabled={!canEdit}
                className="rounded-full border border-accent/40 bg-white px-3 py-1 text-xs font-semibold text-accent transition hover:border-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 disabled:cursor-not-allowed disabled:text-slate-300"
              >
                Wizard
              </button>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-slate-600">
              {completionValue ? (
                <span className="rounded-full border border-accent/40 bg-accentSoft px-2.5 py-1 font-semibold text-accent">
                  {completionValue}
                </span>
              ) : null}
              {trustScoreValue ? (
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700">
                  {trustScoreValue}
                </span>
              ) : null}
              {badges.slice(0, 2).map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-slate-200 bg-white px-2.5 py-1 font-medium text-slate-600"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePanel === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActivePanel(item.id)}
                  className={`flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-sm ring-1 ring-accent/20'
                      : 'text-slate-600 hover:bg-white hover:text-slate-900'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                    {item.label}
                  </span>
                  {item.badge ? (
                    <span className="rounded-full bg-slate-900/5 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto space-y-3 text-xs text-slate-500">
            {!canEdit ? (
              <p className="rounded-2xl border border-amber-200 bg-amber-50/80 p-3 text-amber-700">
                View only access
              </p>
            ) : null}
            {error ? (
              <p className="rounded-2xl border border-rose-200 bg-rose-50/80 p-3 text-rose-700">{error}</p>
            ) : null}
            {feedback ? (
              <p className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3 text-emerald-700">{feedback}</p>
            ) : null}
            <p>Last update {availabilityLastUpdated ?? '—'}</p>
          </div>
        </aside>

        <div className="flex flex-col gap-6 bg-white p-6">
          <div className="grow overflow-y-auto rounded-3xl bg-slate-50/40 p-6">
            {renderPanel(activePanel)}
          </div>

          {validationErrors.length ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-800">
              <ul className="list-disc space-y-1 pl-4">
                {validationErrors.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white p-4">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleProfileSave}
                disabled={disableProfileSave}
                className="inline-flex items-center justify-center rounded-2xl bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Save
              </button>
              <button
                type="button"
                onClick={resetDrafts}
                disabled={profileSaving || identitySaving}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 disabled:cursor-not-allowed disabled:text-slate-300"
              >
                Reset
              </button>
            </div>
            <button
              type="button"
              onClick={() => setEditorOpen(true)}
              disabled={!canEdit}
              className="inline-flex items-center justify-center rounded-2xl border border-accent/40 bg-accentSoft px-4 py-2 text-sm font-semibold text-accent shadow-sm transition hover:border-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 disabled:cursor-not-allowed disabled:text-slate-300"
            >
              Advanced
            </button>
          </div>
        </div>
      </div>

      <ProfileEditor
        open={editorOpen}
        profile={profile}
        saving={profileSaving}
        onClose={() => setEditorOpen(false)}
        onSave={handleEditorSave}
      />
    </section>
  );
}

ProfileSettingsSection.propTypes = {
  profile: PropTypes.shape({
    identity: PropTypes.object,
    availability: PropTypes.object,
    metrics: PropTypes.shape({
      profileCompletion: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      trustScore: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    }),
    launchpadEligibility: PropTypes.shape({ status: PropTypes.string }),
  }),
  userId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onRefresh: PropTypes.func,
  session: PropTypes.shape({
    memberships: PropTypes.arrayOf(PropTypes.string),
  }),
};

ProfileSettingsSection.defaultProps = {
  profile: null,
  onRefresh: undefined,
  session: null,
};
