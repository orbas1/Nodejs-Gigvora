import SectionShell from '../../SectionShell.jsx';
import ProjectWorkspaceModule from './project-workspace/ProjectWorkspaceModule.jsx';

export default function ProjectWorkspaceExcellenceSection() {
  return (
    <SectionShell
      id="workspace"
      title="Workspace"
      description="Open the project room to manage delivery in one place."
    >
      <ProjectWorkspaceModule />
    </SectionShell>
  );
}
