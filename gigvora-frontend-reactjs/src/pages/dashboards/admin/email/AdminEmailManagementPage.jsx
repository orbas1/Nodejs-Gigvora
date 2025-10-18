import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createAdminEmailTemplate,
  deleteAdminEmailTemplate,
  fetchAdminEmailOverview,
  sendAdminTestEmail,
  updateAdminEmailTemplate,
  updateAdminSmtpSettings,
} from '../../../../services/adminEmail.js';
import DashboardLayout from '../../../../layouts/DashboardLayout.jsx';
import EmailNavigation from './EmailNavigation.jsx';
import SmtpPanel from './SmtpPanel.jsx';
import SenderPanel from './SenderPanel.jsx';
import TemplatePanel from './TemplatePanel.jsx';
import TestEmailDrawer from './TestEmailDrawer.jsx';
import TemplateEditorDrawer from './TemplateEditorDrawer.jsx';
import TemplatePreviewDrawer from './TemplatePreviewDrawer.jsx';

const MENU_SECTIONS = [
  {
    label: 'Email',
    items: [
      { id: 'smtp', name: 'SMTP', sectionId: 'smtp' },
      { id: 'sender', name: 'Sender', sectionId: 'sender' },
      { id: 'templates', name: 'Templates', sectionId: 'templates' },
      { id: 'checks', name: 'Checks', sectionId: 'checks' },
    ],
  },
];

const DEFAULT_OVERVIEW = Object.freeze({
  smtpConfig: null,
  templateSummary: { total: 0, enabled: 0, categories: {} },
  templates: [],
});

export default function AdminEmailManagementPage() {
  const [activeSection, setActiveSection] = useState('smtp');
  const [overview, setOverview] = useState(DEFAULT_OVERVIEW);
  const [loading, setLoading] = useState(true);
  const [smtpSaving, setSmtpSaving] = useState(false);
  const [error, setError] = useState(null);
  const [testDrawerOpen, setTestDrawerOpen] = useState(false);
  const [testDrawerDefaults, setTestDrawerDefaults] = useState({});
  const [editorState, setEditorState] = useState({ open: false, template: null });
  const [previewTemplate, setPreviewTemplate] = useState(null);

  const refreshOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminEmailOverview();
      const summary = {
        total: data?.templateSummary?.total ?? 0,
        enabled: data?.templateSummary?.enabled ?? 0,
        categories: data?.templateSummary?.categories ?? {},
      };
      setOverview({
        smtpConfig: data?.smtpConfig ?? null,
        templateSummary: summary,
        templates: Array.isArray(data?.templates) ? data.templates : [],
      });
    } catch (requestError) {
      console.error('Failed to load email overview', requestError);
      setError(requestError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshOverview();
  }, [refreshOverview]);

  const templates = useMemo(() => overview.templates ?? [], [overview.templates]);

  const handleSmtpSave = useCallback(
    async (payload) => {
      setSmtpSaving(true);
      setError(null);
      try {
        const result = await updateAdminSmtpSettings(payload);
        setOverview((previous) => ({
          ...previous,
          smtpConfig: result,
        }));
        return { ok: true };
      } catch (requestError) {
        console.error('Failed to save SMTP settings', requestError);
        setError(requestError);
        throw requestError;
      } finally {
        setSmtpSaving(false);
      }
    },
    [],
  );

  const handleOpenTestDrawer = useCallback((defaults = {}) => {
    setTestDrawerDefaults({
      subject: 'Gigvora test email',
      htmlBody: '<p>This is a test.</p>',
      textBody: 'This is a test.',
      ...defaults,
    });
    setTestDrawerOpen(true);
  }, []);

  const handleSendTest = useCallback(
    async (payload) => {
      setError(null);
      try {
        const result = await sendAdminTestEmail(payload);
        await refreshOverview();
        setTestDrawerOpen(false);
        return result;
      } catch (requestError) {
        console.error('Failed to send test email', requestError);
        setError(requestError);
        throw requestError;
      }
    },
    [refreshOverview],
  );

  const handleTemplateCreate = useCallback(
    async (payload) => {
      setError(null);
      try {
        await createAdminEmailTemplate(payload);
        await refreshOverview();
        setEditorState({ open: false, template: null });
      } catch (requestError) {
        console.error('Failed to create template', requestError);
        setError(requestError);
        throw requestError;
      }
    },
    [refreshOverview],
  );

  const handleTemplateUpdate = useCallback(
    async (templateId, payload) => {
      setError(null);
      try {
        await updateAdminEmailTemplate(templateId, payload);
        await refreshOverview();
        setEditorState({ open: false, template: null });
      } catch (requestError) {
        console.error('Failed to update template', requestError);
        setError(requestError);
        throw requestError;
      }
    },
    [refreshOverview],
  );

  const handleTemplateDelete = useCallback(
    async (template) => {
      if (!template?.id) {
        return;
      }
      setError(null);
      try {
        await deleteAdminEmailTemplate(template.id);
        await refreshOverview();
      } catch (requestError) {
        console.error('Failed to delete template', requestError);
        setError(requestError);
        throw requestError;
      }
    },
    [refreshOverview],
  );

  const handleEditTemplate = useCallback((template) => {
    setEditorState({ open: true, template: template ?? null });
  }, []);

  const closeEditor = useCallback(() => {
    setEditorState({ open: false, template: null });
  }, []);

  const handlePreviewTemplate = useCallback((template) => {
    setPreviewTemplate(template ?? null);
  }, []);

  const closePreview = useCallback(() => {
    setPreviewTemplate(null);
  }, []);

  const handleCreateTemplate = useCallback(() => {
    setEditorState({ open: true, template: null });
  }, []);

  const handleTestWithTemplate = useCallback(
    (template) => {
      handleOpenTestDrawer({ templateId: template?.id ?? null, subject: template?.subject ?? '', htmlBody: template?.htmlBody ?? '', textBody: template?.textBody ?? '' });
    },
    [handleOpenTestDrawer],
  );

  return (
    <DashboardLayout
      currentDashboard="admin"
      title="Email"
      subtitle="Manage delivery"
      menuSections={MENU_SECTIONS}
      activeMenuItem={activeSection}
      onMenuItemSelect={setActiveSection}
    >
      <div className="flex flex-col gap-8 lg:flex-row">
        <EmailNavigation
          sections={MENU_SECTIONS[0].items}
          activeSection={activeSection}
          onSelect={setActiveSection}
        />
        <div className="flex-1 space-y-8">
          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error.message ?? 'Action failed'}
            </div>
          ) : null}

          <section id="smtp" className={activeSection === 'smtp' ? 'block' : 'hidden lg:block'}>
            <SmtpPanel
              loading={loading}
              smtpConfig={overview.smtpConfig}
              saving={smtpSaving}
              onSave={handleSmtpSave}
              onTest={handleOpenTestDrawer}
            />
          </section>

          <section id="sender" className={activeSection === 'sender' ? 'block' : 'hidden lg:block'}>
            <SenderPanel smtpConfig={overview.smtpConfig} loading={loading} onEditSender={() => setActiveSection('smtp')} />
          </section>

          <section id="templates" className={activeSection === 'templates' ? 'block' : 'hidden lg:block'}>
            <TemplatePanel
              loading={loading}
              templates={templates}
              summary={overview.templateSummary}
              onCreate={handleCreateTemplate}
              onEdit={handleEditTemplate}
              onPreview={handlePreviewTemplate}
              onDelete={handleTemplateDelete}
              onTest={handleTestWithTemplate}
            />
          </section>

          <section id="checks" className={activeSection === 'checks' ? 'block' : 'hidden lg:block'}>
            <SenderPanel
              loading={loading}
              smtpConfig={overview.smtpConfig}
              condensed
              onEditSender={() => setActiveSection('smtp')}
            />
          </section>
        </div>
      </div>

      <TestEmailDrawer
        open={testDrawerOpen}
        defaults={testDrawerDefaults}
        onClose={() => setTestDrawerOpen(false)}
        onSend={handleSendTest}
        smtpConfig={overview.smtpConfig}
        templates={templates}
      />

      <TemplateEditorDrawer
        open={editorState.open}
        template={editorState.template}
        onClose={closeEditor}
        onCreate={handleTemplateCreate}
        onUpdate={handleTemplateUpdate}
      />

      <TemplatePreviewDrawer template={previewTemplate} onClose={closePreview} />
    </DashboardLayout>
  );
}
