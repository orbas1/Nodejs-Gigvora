import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import DataStatus from '../DataStatus.jsx';
import JobApplicationWorkspaceLayout from './JobApplicationWorkspaceLayout.jsx';
import WorkspaceDrawer from './WorkspaceDrawer.jsx';
import ApplicationForm from './forms/ApplicationForm.jsx';
import InterviewForm from './forms/InterviewForm.jsx';
import FavouriteForm from './forms/FavouriteForm.jsx';
import ResponseForm from './forms/ResponseForm.jsx';
import {
  fetchJobApplicationWorkspace,
  createWorkspaceJobApplication,
  updateWorkspaceJobApplication,
  archiveWorkspaceJobApplication,
  createWorkspaceJobApplicationInterview,
  updateWorkspaceJobApplicationInterview,
  deleteWorkspaceJobApplicationInterview,
  createWorkspaceJobApplicationFavourite,
  updateWorkspaceJobApplicationFavourite,
  deleteWorkspaceJobApplicationFavourite,
  createWorkspaceJobApplicationResponse,
  updateWorkspaceJobApplicationResponse,
  deleteWorkspaceJobApplicationResponse,
} from '../../services/jobApplications.js';

const INITIAL_FORM_STATE = {
  open: false,
  type: null,
  mode: 'create',
  record: null,
  busy: false,
  error: null,
};

function resolveInitialView() {
  return 'overview';
}

export default function JobApplicationWorkspaceContainer({ userId, initialData }) {
  const [workspace, setWorkspace] = useState(initialData ?? null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState(resolveInitialView);
  const [formState, setFormState] = useState(INITIAL_FORM_STATE);
  const [actionError, setActionError] = useState(null);

  const formOptions = workspace?.formOptions ?? {};
  const applications = workspace?.applications ?? [];

  const loadWorkspace = useCallback(async () => {
    if (!userId) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetchJobApplicationWorkspace(userId);
      setWorkspace(response);
    } catch (loadError) {
      console.error('Failed to load job workspace', loadError);
      setError(loadError);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (initialData) {
      setWorkspace(initialData);
      setLoading(false);
      setError(null);
      return;
    }
    if (userId) {
      loadWorkspace();
    }
  }, [initialData, loadWorkspace, userId]);

  const openForm = useCallback((type, mode = 'create', record = null) => {
    setFormState({ open: true, type, mode, record, busy: false, error: null });
  }, []);

  const closeForm = useCallback(() => {
    setFormState(INITIAL_FORM_STATE);
  }, []);

  const handleArchiveApplication = useCallback(
    async (application) => {
      if (!application) return;
      try {
        setActionError(null);
        await archiveWorkspaceJobApplication(userId, application.id);
        await loadWorkspace();
      } catch (archiveError) {
        console.error('Failed to archive application', archiveError);
        setActionError(archiveError);
      }
    },
    [userId, loadWorkspace],
  );

  const handleDeleteInterview = useCallback(
    async (interview) => {
      if (!interview) return;
      try {
        setActionError(null);
        await deleteWorkspaceJobApplicationInterview(userId, interview.applicationId, interview.id);
        await loadWorkspace();
      } catch (deleteError) {
        console.error('Failed to delete interview', deleteError);
        setActionError(deleteError);
      }
    },
    [userId, loadWorkspace],
  );

  const handleDeleteFavourite = useCallback(
    async (favourite) => {
      if (!favourite) return;
      try {
        setActionError(null);
        await deleteWorkspaceJobApplicationFavourite(userId, favourite.id);
        await loadWorkspace();
      } catch (deleteError) {
        console.error('Failed to delete saved role', deleteError);
        setActionError(deleteError);
      }
    },
    [userId, loadWorkspace],
  );

  const handleDeleteResponse = useCallback(
    async (response) => {
      if (!response) return;
      try {
        setActionError(null);
        await deleteWorkspaceJobApplicationResponse(userId, response.applicationId, response.id);
        await loadWorkspace();
      } catch (deleteError) {
        console.error('Failed to delete response', deleteError);
        setActionError(deleteError);
      }
    },
    [userId, loadWorkspace],
  );

  const submitForm = useCallback(
    async (state, values) => {
      if (!state?.type) {
        return;
      }
      setFormState((prev) => ({ ...prev, busy: true, error: null }));
      try {
        switch (state.type) {
          case 'application':
            if (state.mode === 'edit' && state.record) {
              await updateWorkspaceJobApplication(userId, state.record.id, values);
            } else {
              await createWorkspaceJobApplication(userId, values);
            }
            break;
          case 'interview': {
            const { applicationId, ...payload } = values;
            if (state.mode === 'edit' && state.record) {
              await updateWorkspaceJobApplicationInterview(
                userId,
                state.record.applicationId,
                state.record.id,
                payload,
              );
            } else {
              await createWorkspaceJobApplicationInterview(userId, applicationId, payload);
            }
            break;
          }
          case 'favourite':
            if (state.mode === 'edit' && state.record) {
              await updateWorkspaceJobApplicationFavourite(userId, state.record.id, values);
            } else {
              await createWorkspaceJobApplicationFavourite(userId, values);
            }
            break;
          case 'response': {
            const { applicationId, ...payload } = values;
            if (state.mode === 'edit' && state.record) {
              await updateWorkspaceJobApplicationResponse(
                userId,
                state.record.applicationId,
                state.record.id,
                payload,
              );
            } else {
              await createWorkspaceJobApplicationResponse(userId, applicationId, payload);
            }
            break;
          }
          default:
            break;
        }
        setActionError(null);
        await loadWorkspace();
        setFormState(INITIAL_FORM_STATE);
      } catch (submitError) {
        console.error('Failed to submit form', submitError);
        setFormState((prev) => ({ ...prev, busy: false, error: submitError }));
      }
    },
    [userId, loadWorkspace],
  );

  const handleArchiveFromDrawer = useCallback(
    async (application) => {
      await handleArchiveApplication(application);
      closeForm();
    },
    [handleArchiveApplication, closeForm],
  );

  const drawerTitle = useMemo(() => {
    switch (formState.type) {
      case 'application':
        return formState.mode === 'edit' ? 'Edit application' : 'New application';
      case 'interview':
        return formState.mode === 'edit' ? 'Edit interview' : 'Schedule interview';
      case 'favourite':
        return formState.mode === 'edit' ? 'Edit saved role' : 'Save role';
      case 'response':
        return formState.mode === 'edit' ? 'Edit reply' : 'Log reply';
      default:
        return '';
    }
  }, [formState]);

  const drawerDescription = useMemo(() => {
    switch (formState.type) {
      case 'application':
        return 'Track the opportunity details and stage.';
      case 'interview':
        return 'Keep your next meeting organised.';
      case 'favourite':
        return 'Store quick facts for roles you are watching.';
      case 'response':
        return 'Capture the latest conversation for this role.';
      default:
        return undefined;
    }
  }, [formState.type]);

  return (
    <section
      id="job-hub"
      className="flex h-full flex-col gap-6 rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-6 shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Job hub</h1>
          <p className="text-sm text-slate-500">Manage applications, meetings, saved roles, and replies in one place.</p>
        </div>
        <DataStatus
          loading={loading}
          error={error}
          lastUpdated={workspace?.lastUpdated}
          onRefresh={loadWorkspace}
        />
      </div>

      <div className="flex-1 overflow-hidden">
        <JobApplicationWorkspaceLayout
          workspace={workspace}
          activeView={activeView}
          onChangeView={setActiveView}
          onCreateApplication={() => openForm('application', 'create')}
          onEditApplication={(application) => openForm('application', 'edit', application)}
          onArchiveApplication={handleArchiveApplication}
          onCreateInterview={() => openForm('interview', 'create')}
          onEditInterview={(interview) => openForm('interview', 'edit', interview)}
          onDeleteInterview={handleDeleteInterview}
          onCreateFavourite={() => openForm('favourite', 'create')}
          onEditFavourite={(favourite) => openForm('favourite', 'edit', favourite)}
          onDeleteFavourite={handleDeleteFavourite}
          onCreateResponse={() => openForm('response', 'create')}
          onEditResponse={(response) => openForm('response', 'edit', response)}
          onDeleteResponse={handleDeleteResponse}
          actionError={actionError}
        />
      </div>

      <WorkspaceDrawer
        open={formState.open}
        title={drawerTitle}
        description={drawerDescription}
        onClose={closeForm}
      >
        {formState.open && formState.type === 'application' ? (
          <ApplicationForm
            mode={formState.mode}
            initialApplication={formState.record}
            statusOptions={formOptions.statuses ?? []}
            busy={formState.busy}
            error={formState.error}
            onSubmit={(values) => submitForm(formState, values)}
            onCancel={closeForm}
            onArchive={formState.mode === 'edit' ? () => handleArchiveFromDrawer(formState.record) : undefined}
          />
        ) : null}
        {formState.open && formState.type === 'interview' ? (
          <InterviewForm
            mode={formState.mode}
            applications={applications}
            initialInterview={formState.record}
            statusOptions={formOptions.interviewStatuses ?? []}
            typeOptions={formOptions.interviewTypes ?? []}
            busy={formState.busy}
            error={formState.error}
            onSubmit={(values) => submitForm(formState, values)}
            onCancel={closeForm}
            onDelete={formState.mode === 'edit' ? () => handleDeleteInterview(formState.record) : undefined}
          />
        ) : null}
        {formState.open && formState.type === 'favourite' ? (
          <FavouriteForm
            mode={formState.mode}
            initialFavourite={formState.record}
            priorityOptions={formOptions.favouritePriorities ?? []}
            busy={formState.busy}
            error={formState.error}
            onSubmit={(values) => submitForm(formState, values)}
            onCancel={closeForm}
            onDelete={formState.mode === 'edit' ? () => handleDeleteFavourite(formState.record) : undefined}
          />
        ) : null}
        {formState.open && formState.type === 'response' ? (
          <ResponseForm
            mode={formState.mode}
            applications={applications}
            initialResponse={formState.record}
            directionOptions={formOptions.responseDirections ?? []}
            channelOptions={formOptions.responseChannels ?? []}
            statusOptions={formOptions.responseStatuses ?? []}
            busy={formState.busy}
            error={formState.error}
            onSubmit={(values) => submitForm(formState, values)}
            onCancel={closeForm}
            onDelete={formState.mode === 'edit' ? () => handleDeleteResponse(formState.record) : undefined}
          />
        ) : null}
      </WorkspaceDrawer>
    </section>
  );
}

JobApplicationWorkspaceContainer.propTypes = {
  userId: PropTypes.number.isRequired,
  initialData: PropTypes.object,
};

JobApplicationWorkspaceContainer.defaultProps = {
  initialData: null,
};
