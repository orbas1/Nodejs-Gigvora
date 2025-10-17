import { useMemo, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import DataStatus from '../../components/DataStatus.jsx';
import ProfileBasicsForm from '../../components/agency/ProfileBasicsForm.jsx';
import MediaGalleryManager from '../../components/agency/MediaGalleryManager.jsx';
import SkillTagManager from '../../components/agency/SkillTagManager.jsx';
import CredentialManager from '../../components/agency/CredentialManager.jsx';
import ExperienceManager from '../../components/agency/ExperienceManager.jsx';
import WorkforceManager from '../../components/agency/WorkforceManager.jsx';
import { AGENCY_DASHBOARD_MENU_SECTIONS } from '../../constants/agencyDashboardMenu.js';
import useAgencyProfileManagement from '../../hooks/useAgencyProfileManagement.js';

const availableDashboards = ['agency', 'company', 'freelancer', 'user'];

export default function AgencyProfileManagementPage() {
  const {
    data,
    loading,
    error,
    fromCache,
    lastUpdated,
    refresh,
    updateBasics,
    createMedia,
    updateMedia,
    deleteMedia,
    createSkill,
    updateSkill,
    deleteSkill,
    createCredential,
    updateCredential,
    deleteCredential,
    createExperience,
    updateExperience,
    deleteExperience,
    createWorkforceSegment,
    updateWorkforceSegment,
    deleteWorkforceSegment,
  } = useAgencyProfileManagement();

  const profile = data?.profile ?? {};
  const gallery = data?.gallery ?? [];
  const skills = data?.skills ?? [];
  const qualifications = data?.qualifications ?? [];
  const certificates = data?.certificates ?? [];
  const experiences = data?.experiences ?? [];
  const workforce = data?.workforce ?? [];

  const credentials = useMemo(() => [...qualifications, ...certificates], [qualifications, certificates]);

  const PANELS = useMemo(
    () => [
      {
        id: 'basics',
        label: 'Basics',
        render: () => <ProfileBasicsForm profile={profile} onSubmit={updateBasics} />,
      },
      {
        id: 'media',
        label: 'Media',
        render: () => (
          <MediaGalleryManager media={gallery} onCreate={createMedia} onUpdate={updateMedia} onDelete={deleteMedia} />
        ),
      },
      {
        id: 'skills',
        label: 'Skills',
        render: () => (
          <SkillTagManager skills={skills} onCreate={createSkill} onUpdate={updateSkill} onDelete={deleteSkill} />
        ),
      },
      {
        id: 'creds',
        label: 'Creds',
        render: () => <CredentialsWorkspace credentials={credentials} onCreate={createCredential} onUpdate={updateCredential} onDelete={deleteCredential} />,
      },
      {
        id: 'projects',
        label: 'Work',
        render: () => (
          <ExperienceManager experiences={experiences} onCreate={createExperience} onUpdate={updateExperience} onDelete={deleteExperience} />
        ),
      },
      {
        id: 'bench',
        label: 'Bench',
        render: () => (
          <WorkforceManager workforce={workforce} onCreate={createWorkforceSegment} onUpdate={updateWorkforceSegment} onDelete={deleteWorkforceSegment} />
        ),
      },
    ],
    [
      profile,
      updateBasics,
      gallery,
      createMedia,
      updateMedia,
      deleteMedia,
      skills,
      createSkill,
      updateSkill,
      deleteSkill,
      credentials,
      createCredential,
      updateCredential,
      deleteCredential,
      experiences,
      createExperience,
      updateExperience,
      deleteExperience,
      workforce,
      createWorkforceSegment,
      updateWorkforceSegment,
      deleteWorkforceSegment,
    ],
  );

  const [activePanelId, setActivePanelId] = useState('basics');
  const activePanel = PANELS.find((panel) => panel.id === activePanelId) ?? PANELS[0];

  return (
    <DashboardLayout
      currentDashboard="agency"
      title="Profile"
      subtitle="Studio"
      description=""
      menuSections={AGENCY_DASHBOARD_MENU_SECTIONS}
      availableDashboards={availableDashboards}
      activeMenuItem="agency-profile-management"
    >
      <div className="mx-auto w-full max-w-[1400px] px-8 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Profile workspace</h1>
          </div>
          <DataStatus
            loading={loading}
            error={error}
            fromCache={fromCache}
            lastUpdated={lastUpdated}
            onRefresh={() => refresh({ force: true })}
            statusLabel="Live"
          />
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[200px_1fr] xl:grid-cols-[220px_1fr]">
          <nav className="flex flex-col gap-2">
            {PANELS.map((panel) => {
              const isActive = panel.id === activePanel?.id;
              return (
                <button
                  key={panel.id}
                  type="button"
                  onClick={() => setActivePanelId(panel.id)}
                  className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    isActive
                      ? 'bg-accent text-white shadow-sm'
                      : 'border border-slate-200 bg-white text-slate-600 hover:border-accent hover:text-accent'
                  }`}
                >
                  {panel.label}
                </button>
              );
            })}
          </nav>

          <div className="space-y-8">
            {activePanel?.render()}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function CredentialsWorkspace({ credentials, onCreate, onUpdate, onDelete }) {
  const [activeTab, setActiveTab] = useState('qualification');
  const tabs = [
    { id: 'qualification', label: 'Quals', title: 'Qualifications' },
    { id: 'certificate', label: 'Awards', title: 'Certificates' },
  ];
  const currentTab = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        {tabs.map((tab) => {
          const isActive = tab.id === currentTab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                isActive
                  ? 'bg-slate-900 text-white'
                  : 'border border-slate-200 bg-white text-slate-600 hover:border-accent hover:text-accent'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <CredentialManager
        credentials={credentials}
        type={currentTab.id}
        title={currentTab.title}
        onCreate={onCreate}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />
    </div>
  );
}
