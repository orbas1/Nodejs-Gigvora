import { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../../layouts/DashboardLayout.jsx';
import VolunteeringWorkspaceLayout from '../../../components/admin/volunteering/VolunteeringWorkspaceLayout.jsx';
import VolunteeringOverview from '../../../components/admin/volunteering/VolunteeringOverview.jsx';
import VolunteeringProgramsPanel from '../../../components/admin/volunteering/VolunteeringProgramsPanel.jsx';
import VolunteeringRolesPanel from '../../../components/admin/volunteering/VolunteeringRolesPanel.jsx';
import VolunteeringShiftsPanel from '../../../components/admin/volunteering/VolunteeringShiftsPanel.jsx';
import VolunteeringAssignmentsPanel from '../../../components/admin/volunteering/VolunteeringAssignmentsPanel.jsx';
import useSession from '../../../hooks/useSession.js';
import {
  fetchVolunteerInsights,
  fetchVolunteerPrograms,
  createVolunteerProgram,
  updateVolunteerProgram,
  deleteVolunteerProgram,
  fetchVolunteerRoles,
  fetchVolunteerRole,
  createVolunteerRole,
  updateVolunteerRole,
  deleteVolunteerRole,
  publishVolunteerRole,
  fetchVolunteerShifts,
  createVolunteerShift,
  updateVolunteerShift,
  deleteVolunteerShift,
  fetchVolunteerAssignments,
  createVolunteerAssignment,
  updateVolunteerAssignment,
  deleteVolunteerAssignment,
} from '../../../services/adminVolunteering.js';

const ADMIN_ALIASES = new Set(['admin', 'administrator', 'super-admin', 'superadmin']);

function hasAdminAccess(session) {
  if (!session) {
    return false;
  }
  const membershipList = Array.isArray(session.memberships) ? session.memberships : [];
  const roleList = Array.isArray(session.roles) ? session.roles : [];
  const permissionList = Array.isArray(session.permissions) ? session.permissions : [];
  const capabilityList = Array.isArray(session.capabilities) ? session.capabilities : [];
  const primaryDashboard = (session.primaryDashboard ?? session.user?.primaryDashboard ?? '').toLowerCase();
  const directRole = (session.role ?? session.user?.role ?? '').toLowerCase();

  const hasExplicitAccess =
    membershipList.some((value) => ADMIN_ALIASES.has(String(value).toLowerCase())) ||
    roleList.some((value) => ADMIN_ALIASES.has(String(value).toLowerCase())) ||
    capabilityList.some((value) => value?.toLowerCase?.() === 'admin:access') ||
    permissionList.some((value) => value?.toLowerCase?.() === 'admin:full') ||
    ADMIN_ALIASES.has(directRole);

  return hasExplicitAccess || primaryDashboard === 'admin';
}

const INITIAL_ROLE_FILTERS = {
  status: 'all',
  programId: 'all',
  remoteType: 'all',
  search: '',
};

export default function AdminVolunteeringPage() {
  const { session, isAuthenticated } = useSession();
  const canAccess = useMemo(() => isAuthenticated && hasAdminAccess(session), [isAuthenticated, session]);

  const [activeSection, setActiveSection] = useState('overview');
  const [banner, setBanner] = useState({ type: '', message: '' });

  const [insights, setInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

  const [programs, setPrograms] = useState([]);
  const [programsLoading, setProgramsLoading] = useState(false);

  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [roleFilters, setRoleFilters] = useState(INITIAL_ROLE_FILTERS);

  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [shifts, setShifts] = useState([]);
  const [shiftsLoading, setShiftsLoading] = useState(false);

  const [selectedShift, setSelectedShift] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);

  const resetBanner = () => setBanner({ type: '', message: '' });

  const handleError = (error, fallback = 'Something went wrong.') => {
    const message = error?.message ?? fallback;
    setBanner({ type: 'error', message });
    throw error;
  };

  const loadInsights = useCallback(async () => {
    try {
      setInsightsLoading(true);
      resetBanner();
      const snapshot = await fetchVolunteerInsights();
      setInsights(snapshot);
    } catch (error) {
      setInsights(null);
      handleError(error, 'Unable to load volunteering insights.');
    } finally {
      setInsightsLoading(false);
    }
  }, []);

  const loadPrograms = useCallback(
    async (params = {}) => {
      try {
        setProgramsLoading(true);
        resetBanner();
        const response = await fetchVolunteerPrograms(params);
        setPrograms(Array.isArray(response?.items) ? response.items : []);
      } catch (error) {
        setPrograms([]);
        handleError(error, 'Unable to load programs.');
      } finally {
        setProgramsLoading(false);
      }
    },
    [],
  );

  const loadRoles = useCallback(async () => {
    try {
      setRolesLoading(true);
      resetBanner();
      const params = {};
      if (roleFilters.status !== 'all') params.status = roleFilters.status;
      if (roleFilters.remoteType !== 'all') params.remoteType = roleFilters.remoteType;
      if (roleFilters.programId !== 'all') params.programId = roleFilters.programId;
      if (roleFilters.search) params.search = roleFilters.search;
      const response = await fetchVolunteerRoles(params);
      setRoles(Array.isArray(response?.items) ? response.items : []);
    } catch (error) {
      setRoles([]);
      handleError(error, 'Unable to load roles.');
    } finally {
      setRolesLoading(false);
    }
  }, [roleFilters]);

  const loadShifts = useCallback(
    async (roleId) => {
      if (!roleId) {
        setShifts([]);
        return;
      }
      try {
        setShiftsLoading(true);
        resetBanner();
        const response = await fetchVolunteerShifts(roleId);
        setShifts(Array.isArray(response) ? response : []);
      } catch (error) {
        setShifts([]);
        handleError(error, 'Unable to load shifts.');
      } finally {
        setShiftsLoading(false);
      }
    },
    [],
  );

  const loadAssignments = useCallback(
    async (roleId, shiftId) => {
      if (!roleId || !shiftId) {
        setAssignments([]);
        return;
      }
      try {
        setAssignmentsLoading(true);
        resetBanner();
        const response = await fetchVolunteerAssignments(roleId, shiftId);
        setAssignments(Array.isArray(response) ? response : []);
      } catch (error) {
        setAssignments([]);
        handleError(error, 'Unable to load assignments.');
      } finally {
        setAssignmentsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!canAccess) {
      return;
    }
    loadInsights();
    loadPrograms();
  }, [canAccess, loadInsights, loadPrograms]);

  useEffect(() => {
    if (!canAccess) {
      return;
    }
    loadRoles();
  }, [canAccess, loadRoles]);

  useEffect(() => {
    if (!canAccess) {
      return;
    }
    loadShifts(selectedRoleId);
  }, [canAccess, selectedRoleId, loadShifts]);

  useEffect(() => {
    if (!canAccess) {
      return;
    }
    loadAssignments(selectedRoleId, selectedShift?.id);
  }, [canAccess, selectedRoleId, selectedShift?.id, loadAssignments]);

  const handleSelectShift = async (shift) => {
    setSelectedShift(shift);
    if (shift && selectedRoleId) {
      await loadAssignments(selectedRoleId, shift.id);
    }
  };

  const handleSelectRole = async (roleId) => {
    setSelectedRoleId(roleId);
    setSelectedShift(null);
    if (roleId) {
      await loadShifts(roleId);
    }
  };

  if (!canAccess) {
    return (
      <DashboardLayout>
        <div className="rounded-3xl bg-white p-10 text-center shadow-xl ring-1 ring-slate-100">
          <h1 className="text-2xl font-semibold text-slate-900">Admin access required</h1>
          <p className="mt-4 text-sm text-slate-500">
            Switch to an administrator profile to manage volunteering programmes.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const toolbar = (
    <div className="flex flex-wrap items-center gap-3">
      <div>
        <p className="text-sm font-semibold text-slate-900">Volunteering workspace</p>
        <p className="text-xs text-slate-500">Programmes, roles, and shift coordination in one place.</p>
      </div>
      {banner.message ? (
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            banner.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
          }`}
        >
          {banner.message}
        </span>
      ) : null}
    </div>
  );

  return (
    <DashboardLayout>
      <VolunteeringWorkspaceLayout active={activeSection} onSelect={setActiveSection} toolbar={toolbar}>
        {activeSection === 'overview' ? (
          <VolunteeringOverview
            data={insights}
            loading={insightsLoading}
            onRefresh={loadInsights}
            onOpenPrograms={() => setActiveSection('programs')}
            onOpenRoles={() => setActiveSection('roles')}
            onOpenShifts={() => setActiveSection('shifts')}
            onSelectShift={(shift) => {
              if (shift?.role?.id) {
                handleSelectRole(shift.role.id);
              }
              setActiveSection('shifts');
              handleSelectShift(shift);
            }}
          />
        ) : null}

        {activeSection === 'programs' ? (
          <VolunteeringProgramsPanel
            programs={programs}
            loading={programsLoading}
            onReload={() => loadPrograms()}
            onCreate={(payload) => createVolunteerProgram(payload).catch((error) => handleError(error, error.message))}
            onUpdate={(programId, payload) =>
              updateVolunteerProgram(programId, payload).catch((error) => handleError(error, error.message))
            }
            onDelete={(programId) => deleteVolunteerProgram(programId).catch((error) => handleError(error, error.message))}
            onSelect={(program) => {
              if (program?.id) {
                setRoleFilters((previous) => ({ ...previous, programId: program.id }));
                setActiveSection('roles');
              }
            }}
          />
        ) : null}

        {activeSection === 'roles' ? (
          <VolunteeringRolesPanel
            programs={programs}
            roles={roles}
            loading={rolesLoading}
            filters={roleFilters}
            onChangeFilters={(next) => setRoleFilters(next)}
            onReload={loadRoles}
            onCreate={(payload) => createVolunteerRole(payload).catch((error) => handleError(error, error.message))}
            onUpdate={(roleId, payload) => updateVolunteerRole(roleId, payload).catch((error) => handleError(error, error.message))}
            onDelete={(roleId) => deleteVolunteerRole(roleId).catch((error) => handleError(error, error.message))}
            onPublish={(roleId) => publishVolunteerRole(roleId).catch((error) => handleError(error, error.message))}
            onSelect={async (role) => {
              if (!role?.id) return;
              setActiveSection('shifts');
              await handleSelectRole(role.id);
              const fullRole = await fetchVolunteerRole(role.id).catch(() => role);
              setSelectedShift(null);
              setBanner({ type: 'info', message: `${fullRole.title ?? role.title} ready for scheduling.` });
            }}
          />
        ) : null}

        {activeSection === 'shifts' ? (
          <VolunteeringShiftsPanel
            roles={roles}
            selectedRoleId={selectedRoleId ?? undefined}
            onSelectRole={(value) => handleSelectRole(value)}
            shifts={shifts}
            loading={shiftsLoading}
            onReload={(roleId) => loadShifts(roleId ?? selectedRoleId)}
            onCreate={(roleId, payload) => createVolunteerShift(roleId, payload).catch((error) => handleError(error, error.message))}
            onUpdate={(roleId, shiftId, payload) =>
              updateVolunteerShift(roleId, shiftId, payload).catch((error) => handleError(error, error.message))
            }
            onDelete={(roleId, shiftId) =>
              deleteVolunteerShift(roleId, shiftId).catch((error) => handleError(error, error.message))
            }
            onSelectShift={handleSelectShift}
          />
        ) : null}

        {activeSection === 'people' ? (
          <VolunteeringAssignmentsPanel
            selectedShift={selectedShift}
            assignments={assignments}
            loading={assignmentsLoading}
            onReload={(shiftId) => loadAssignments(selectedRoleId, shiftId)}
            onCreate={(shiftId, payload) =>
              createVolunteerAssignment(selectedRoleId, shiftId, payload).catch((error) => handleError(error, error.message))
            }
            onUpdate={(shiftId, assignmentId, payload) =>
              updateVolunteerAssignment(selectedRoleId, shiftId, assignmentId, payload).catch((error) =>
                handleError(error, error.message),
              )
            }
            onDelete={(shiftId, assignmentId) =>
              deleteVolunteerAssignment(selectedRoleId, shiftId, assignmentId).catch((error) =>
                handleError(error, error.message),
              )
            }
          />
        ) : null}
      </VolunteeringWorkspaceLayout>
    </DashboardLayout>
  );
}
