import { vi } from 'vitest';

import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfileIdentityCard from '../ProfileIdentityCard.jsx';
import ProfileAvailabilityCard from '../ProfileAvailabilityCard.jsx';
import ProfileStoryCard from '../ProfileStoryCard.jsx';
import ProfileTagsCard from '../ProfileTagsCard.jsx';
import ProfileExperienceCard from '../ProfileExperienceCard.jsx';
import ProfileCredentialsCard from '../ProfileCredentialsCard.jsx';
import ProfileReferencesCard from '../ProfileReferencesCard.jsx';
import ProfileCollaborationCard from '../ProfileCollaborationCard.jsx';

function getDetailsBySummaryText(container, text) {
  const summarySpan = within(container).getAllByText(text, { selector: 'summary span' })[0];
  if (!summarySpan) {
    throw new Error(`Unable to locate details summary for "${text}"`);
  }
  const details = summarySpan.closest('details');
  if (!details) {
    throw new Error(`Unable to find details element for summary "${text}"`);
  }
  return details;
}

describe('Profile settings cards', () => {
  it('guards identity save actions', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <ProfileIdentityCard
        identityDraft={{ firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com', location: 'London', timezone: 'UTC' }}
        profileDraft={{ location: 'London', avatarSeed: 'ada' }}
        onIdentityChange={vi.fn()}
        onProfileChange={vi.fn()}
        onSubmit={onSubmit}
        saving={false}
        canEdit
        isDirty
        validationErrors={[]}
      />,
    );

    const saveButton = screen.getByRole('button', { name: /^save$/i });
    await user.click(saveButton);
    expect(onSubmit).toHaveBeenCalled();
  });

  it('updates availability fields via callbacks', async () => {
    const user = userEvent.setup();
    const onAvailabilityChange = vi.fn();

    render(
      <ProfileAvailabilityCard
        availabilityDraft={{ status: 'limited', hoursPerWeek: 10, openToRemote: true, notes: '', timezone: 'UTC' }}
        onAvailabilityChange={onAvailabilityChange}
        canEdit
        lastUpdatedAt="yesterday"
      />,
    );

    await user.selectOptions(screen.getByLabelText('Status'), 'available');
    expect(onAvailabilityChange).toHaveBeenCalledWith('status', 'available');
  });

  it('exposes story inputs', async () => {
    const user = userEvent.setup();
    const onProfileChange = vi.fn();

    render(
      <ProfileStoryCard
        profileDraft={{ headline: '', missionStatement: '', bio: '', education: '' }}
        onProfileChange={onProfileChange}
        canEdit
      />,
    );

    fireEvent.change(screen.getByLabelText('Headline'), { target: { value: 'Product builder' } });
    expect(onProfileChange).toHaveBeenCalledWith('headline', 'Product builder');
  });

  it('relays tag changes through TagInput', async () => {
    const user = userEvent.setup();
    const onProfileChange = vi.fn();

    render(
      <ProfileTagsCard
        profileDraft={{ skills: [], areasOfFocus: [], preferredEngagements: [], statusFlags: [], volunteerBadges: [] }}
        onProfileChange={onProfileChange}
        canEdit
      />,
    );

    const skillsInput = screen.getByPlaceholderText('Add a skill');
    await act(async () => {
      fireEvent.change(skillsInput, { target: { value: 'Leadership' } });
    });
    const actionRow = skillsInput.closest('div');
    const skillsAddButton = within(actionRow ?? document.body).getByRole('button', { name: /^add$/i });
    await act(async () => {
      fireEvent.click(skillsAddButton);
    });
    expect(onProfileChange).toHaveBeenCalledWith('skills', ['Leadership']);
  });

  it('handles experience collection events', async () => {
    const user = userEvent.setup();
    const onAddExperience = vi.fn();
    const onUpdateExperience = vi.fn();
    const onRemoveExperience = vi.fn();

    render(
      <ProfileExperienceCard
        experience={[{ organization: 'Org', role: 'Lead', startDate: '', endDate: '', description: '', highlights: [] }]}
        onAddExperience={onAddExperience}
        onUpdateExperience={onUpdateExperience}
        onRemoveExperience={onRemoveExperience}
        canEdit
      />,
    );

    const card = screen.getByText('Work').closest('section');
    fireEvent.change(within(card).getByLabelText('Organisation'), { target: { value: 'Org Labs' } });
    expect(onUpdateExperience).toHaveBeenCalledWith(0, expect.objectContaining({ organization: 'Org Labs' }));

    await user.click(within(card).getByRole('button', { name: /^add$/i }));
    expect(onAddExperience).toHaveBeenCalled();

    await user.click(within(card).getByRole('button', { name: /^remove$/i }));
    expect(onRemoveExperience).toHaveBeenCalled();
  });

  it('manages credentials and portfolio entries', async () => {
    const user = userEvent.setup();
    const onAddQualification = vi.fn();
    const onUpdateQualification = vi.fn();
    const onRemoveQualification = vi.fn();
    const onAddPortfolioLink = vi.fn();
    const onUpdatePortfolioLink = vi.fn();
    const onRemovePortfolioLink = vi.fn();

    render(
      <ProfileCredentialsCard
        qualifications={[{ title: 'Certification', authority: '', year: '', credentialId: '', credentialUrl: '', description: '' }]}
        onAddQualification={onAddQualification}
        onUpdateQualification={onUpdateQualification}
        onRemoveQualification={onRemoveQualification}
        portfolioLinks={[{ label: 'Portfolio', url: '', description: '' }]}
        onAddPortfolioLink={onAddPortfolioLink}
        onUpdatePortfolioLink={onUpdatePortfolioLink}
        onRemovePortfolioLink={onRemovePortfolioLink}
        canEdit
      />,
    );

    const credentialsHeading = screen.getByRole('heading', { name: /credentials/i });
    const credentialsSection = credentialsHeading.closest('section');
    const qualificationDetails = getDetailsBySummaryText(credentialsSection, 'Certification');
    fireEvent.change(within(qualificationDetails).getByLabelText('Title'), { target: { value: 'Certification Advanced' } });
    expect(onUpdateQualification).toHaveBeenCalledWith(0, expect.objectContaining({ title: 'Certification Advanced' }));

    const addButtons = within(credentialsSection).getAllByRole('button', { name: /^add$/i });
    await user.click(addButtons[0]);
    expect(onAddQualification).toHaveBeenCalled();

    await user.click(within(qualificationDetails).getByRole('button', { name: /^remove$/i }));
    expect(onRemoveQualification).toHaveBeenCalled();

    await user.click(addButtons[1]);
    expect(onAddPortfolioLink).toHaveBeenCalled();

    const portfolioDetails = getDetailsBySummaryText(credentialsSection, 'Portfolio');
    fireEvent.change(within(portfolioDetails).getByLabelText('Label'), { target: { value: 'Portfolio Showcase' } });
    expect(onUpdatePortfolioLink).toHaveBeenCalledWith(0, expect.objectContaining({ label: 'Portfolio Showcase' }));

    await user.click(within(portfolioDetails).getByRole('button', { name: /^remove$/i }));
    expect(onRemovePortfolioLink).toHaveBeenCalled();
  });

  it('updates references roster', async () => {
    const user = userEvent.setup();
    const onAddReference = vi.fn();
    const onUpdateReference = vi.fn();
    const onRemoveReference = vi.fn();

    render(
      <ProfileReferencesCard
        references={[{ name: 'Ref', relationship: '', company: '', email: '', phone: '', endorsement: '', weight: '', isVerified: false, lastInteractedAt: '' }]}
        onAddReference={onAddReference}
        onUpdateReference={onUpdateReference}
        onRemoveReference={onRemoveReference}
        canEdit
      />,
    );

    const referencesHeading = screen.getByRole('heading', { name: /refs/i });
    const referencesSection = referencesHeading.closest('section');
    const referenceDetails = getDetailsBySummaryText(referencesSection, 'Ref');
    fireEvent.change(within(referenceDetails).getByLabelText('Name'), { target: { value: 'Reference' } });
    expect(onUpdateReference).toHaveBeenCalledWith(0, expect.objectContaining({ name: 'Reference' }));

    await user.click(within(referencesSection).getByRole('button', { name: /^add$/i }));
    expect(onAddReference).toHaveBeenCalled();

    await user.click(within(referenceDetails).getByRole('button', { name: /^remove$/i }));
    expect(onRemoveReference).toHaveBeenCalled();
  });

  it('handles collaboration and pipeline updates', async () => {
    const user = userEvent.setup();
    const onAddCollaborator = vi.fn();
    const onUpdateCollaborator = vi.fn();
    const onRemoveCollaborator = vi.fn();
    const onAddImpact = vi.fn();
    const onUpdateImpact = vi.fn();
    const onRemoveImpact = vi.fn();
    const onAddPipeline = vi.fn();
    const onUpdatePipeline = vi.fn();
    const onRemovePipeline = vi.fn();

    render(
      <ProfileCollaborationCard
        collaborationRoster={[{ name: 'Partner', role: 'Designer', avatarSeed: '', contact: '' }]}
        onAddCollaborator={onAddCollaborator}
        onUpdateCollaborator={onUpdateCollaborator}
        onRemoveCollaborator={onRemoveCollaborator}
        impactHighlights={[{ title: 'Impact', value: '', description: '' }]}
        onAddImpact={onAddImpact}
        onUpdateImpact={onUpdateImpact}
        onRemoveImpact={onRemoveImpact}
        pipelineInsights={[{ project: 'Project', payout: '', status: '', countdown: '' }]}
        onAddPipeline={onAddPipeline}
        onUpdatePipeline={onUpdatePipeline}
        onRemovePipeline={onRemovePipeline}
        canEdit
      />,
    );

    const collaborationHeading = screen.getByRole('heading', { name: /team/i });
    const collaborationSection = collaborationHeading.closest('section');
    const collaboratorDetails = getDetailsBySummaryText(collaborationSection, 'Partner');
    fireEvent.change(within(collaboratorDetails).getByLabelText('Name'), { target: { value: 'Partner One' } });
    expect(onUpdateCollaborator).toHaveBeenCalledWith(0, expect.objectContaining({ name: 'Partner One' }));

    const addButtons = within(collaborationSection).getAllByRole('button', { name: /^add$/i });
    await user.click(addButtons[0]);
    expect(onAddCollaborator).toHaveBeenCalled();

    await user.click(within(collaboratorDetails).getByRole('button', { name: /^remove$/i }));
    expect(onRemoveCollaborator).toHaveBeenCalled();

    const impactDetails = getDetailsBySummaryText(collaborationSection, 'Impact');
    fireEvent.change(within(impactDetails).getByLabelText('Title'), { target: { value: 'Impact Growth' } });
    expect(onUpdateImpact).toHaveBeenCalledWith(0, expect.objectContaining({ title: 'Impact Growth' }));

    await user.click(addButtons[1]);
    expect(onAddImpact).toHaveBeenCalled();

    await user.click(within(impactDetails).getByRole('button', { name: /^remove$/i }));
    expect(onRemoveImpact).toHaveBeenCalled();

    const pipelineDetails = getDetailsBySummaryText(collaborationSection, 'Project');
    fireEvent.change(within(pipelineDetails).getByLabelText('Project'), { target: { value: 'Project Launch' } });
    expect(onUpdatePipeline).toHaveBeenCalledWith(0, expect.objectContaining({ project: 'Project Launch' }));

    await user.click(addButtons[2]);
    expect(onAddPipeline).toHaveBeenCalled();

    await user.click(within(pipelineDetails).getByRole('button', { name: /^remove$/i }));
    expect(onRemovePipeline).toHaveBeenCalled();
  });
});
