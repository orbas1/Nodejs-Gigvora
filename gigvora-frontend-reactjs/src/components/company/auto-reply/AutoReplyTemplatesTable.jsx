import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '../../ui/Modal.jsx';
import AutoReplyTemplateForm from './AutoReplyTemplateForm.jsx';
import { CHANNEL_OPTIONS, normalizeTemplate } from './templateOptions.js';

export default function AutoReplyTemplatesTable({ templates, onCreate, onUpdate, onDelete, busy = {}, className = '' }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  const [statusTone, setStatusTone] = useState('success');

  const sortedTemplates = useMemo(() => {
    const items = Array.isArray(templates) ? [...templates] : [];
    return items.sort((a, b) => {
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0);
    });
  }, [templates]);

  const showStatus = (message, tone = 'success') => {
    setStatusMessage(message);
    setStatusTone(tone);
    window.setTimeout(() => setStatusMessage(null), 2500);
  };

  const handleCreate = async (draft) => {
    if (typeof onCreate !== 'function') return;
    await onCreate({ ...draft });
    setCreateOpen(false);
    showStatus('Template created');
  };

  const handleUpdate = async (templateId, draft) => {
    if (typeof onUpdate !== 'function') return;
    await onUpdate(templateId, { ...draft });
    setActiveTemplate(null);
    showStatus('Template updated');
  };

  const handleDelete = async (templateId) => {
    if (typeof onDelete !== 'function') return;
    await onDelete(templateId);
    setActiveTemplate(null);
    showStatus('Template removed', 'info');
  };

  const renderChannelBadges = (channels = []) => {
    if (!channels.length) {
      return <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">None</span>;
    }
    return channels.slice(0, 3).map((channel) => {
      const option = CHANNEL_OPTIONS.find((item) => item.value === channel);
      const label = option?.label ?? channel;
      return (
        <span
          key={channel}
          className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-600"
        >
          {label}
        </span>
      );
    });
  };

  return (
    <div className={`rounded-3xl border border-slate-200 bg-white p-6 shadow-sm ${className}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-slate-900">Templates</h3>
          <p className="text-sm text-slate-500">{sortedTemplates.length} saved</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {statusMessage ? (
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                statusTone === 'info'
                  ? 'border-slate-200 bg-slate-50 text-slate-600'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700'
              }`}
            >
              {statusMessage}
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            New
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {sortedTemplates.map((template) => (
          <button
            type="button"
            key={template.id}
            onClick={() => setActiveTemplate(template)}
            className="flex w-full flex-col gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4 text-left shadow-sm transition hover:border-accent hover:shadow"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-base font-semibold text-slate-900">{template.title}</span>
                  {template.isDefault ? (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                      Default
                    </span>
                  ) : null}
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                    {template.status}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-500">{template.summary || 'No summary'}</p>
              </div>
              <div className="flex flex-col items-start gap-2 text-xs text-slate-500 sm:items-end">
                <div className="flex flex-wrap gap-2">{renderChannelBadges(template.channels)}</div>
                <span>Temperature {Number(template.temperature ?? 0.35).toFixed(2)}</span>
                {template.tone ? <span>Tone {template.tone}</span> : null}
              </div>
            </div>
          </button>
        ))}
      </div>

      {!sortedTemplates.length ? (
        <p className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-white/70 p-4 text-sm text-slate-500">
          No templates yet.
        </p>
      ) : null}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New template"
        description="Walk through the steps to capture tone and delivery"
        wide
      >
        <AutoReplyTemplateForm
          mode="create"
          submitting={busy.creating}
          onSubmit={async (draft) => {
            await handleCreate(draft);
          }}
          onCancel={() => setCreateOpen(false)}
        />
      </Modal>

      <Modal
        open={Boolean(activeTemplate)}
        onClose={() => setActiveTemplate(null)}
        title={activeTemplate ? activeTemplate.title : 'Template'}
        description={activeTemplate?.summary || ''}
        wide
      >
        {activeTemplate ? (
          <div className="space-y-5">
            <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 sm:grid-cols-2">
              <div className="space-y-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</p>
                  <p className="text-sm font-semibold text-slate-800">{activeTemplate.status}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Channels</p>
                  <div className="mt-1 flex flex-wrap gap-2">{renderChannelBadges(activeTemplate.channels)}</div>
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Temperature</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {Number(activeTemplate.temperature ?? 0.35).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tone</p>
                  <p className="text-sm font-semibold text-slate-800">{activeTemplate.tone || 'Not set'}</p>
                </div>
              </div>
            </div>

            <AutoReplyTemplateForm
              mode="edit"
              initialValue={normalizeTemplate(activeTemplate)}
              submitting={busy.updatingId === activeTemplate.id}
              deleting={busy.deletingId === activeTemplate.id}
              onSubmit={async (draft) => {
                await handleUpdate(activeTemplate.id, draft);
              }}
              onDelete={onDelete ? async () => handleDelete(activeTemplate.id) : null}
              onCancel={() => setActiveTemplate(null)}
            />

            {activeTemplate.sampleReply ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sample</p>
                <p className="mt-2 whitespace-pre-line">{activeTemplate.sampleReply}</p>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

AutoReplyTemplatesTable.propTypes = {
  templates: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      title: PropTypes.string,
      summary: PropTypes.string,
      tone: PropTypes.string,
      instructions: PropTypes.string,
      sampleReply: PropTypes.string,
      channels: PropTypes.arrayOf(PropTypes.string),
      temperature: PropTypes.number,
      status: PropTypes.string,
      isDefault: PropTypes.bool,
      updatedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
      createdAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    }),
  ),
  onCreate: PropTypes.func,
  onUpdate: PropTypes.func,
  onDelete: PropTypes.func,
  busy: PropTypes.shape({
    creating: PropTypes.bool,
    updatingId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    deletingId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  }),
  className: PropTypes.string,
};

AutoReplyTemplatesTable.defaultProps = {
  templates: [],
  onCreate: null,
  onUpdate: null,
  onDelete: null,
  busy: {},
  className: '',
};
