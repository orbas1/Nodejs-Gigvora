import TagInput from '../TagInput.jsx';

export default function ProfileTagsCard({ profileDraft, onProfileChange, canEdit }) {
  return (
    <section className="space-y-6">
      <header>
        <h3 className="text-lg font-semibold text-slate-900">Tags</h3>
      </header>

      <TagInput
        label="Skills"
        items={profileDraft.skills}
        onChange={(value) => onProfileChange('skills', value)}
        placeholder="Add a skill"
        disabled={!canEdit}
      />

      <TagInput
        label="Areas of focus"
        items={profileDraft.areasOfFocus}
        onChange={(value) => onProfileChange('areasOfFocus', value)}
        placeholder="Product strategy, RevOps, inclusive design"
        disabled={!canEdit}
      />

      <TagInput
        label="Preferred engagements"
        items={profileDraft.preferredEngagements}
        onChange={(value) => onProfileChange('preferredEngagements', value)}
        placeholder="e.g. Retained advisory, Sprint facilitation"
        disabled={!canEdit}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <TagInput
          label="Flags"
          items={profileDraft.statusFlags}
          onChange={(value) => onProfileChange('statusFlags', value)}
          placeholder="Launchpad alumni"
          disabled={!canEdit}
        />

        <TagInput
          label="Badges"
          items={profileDraft.volunteerBadges}
          onChange={(value) => onProfileChange('volunteerBadges', value)}
          placeholder="Mentor"
          disabled={!canEdit}
        />
      </div>
    </section>
  );
}
