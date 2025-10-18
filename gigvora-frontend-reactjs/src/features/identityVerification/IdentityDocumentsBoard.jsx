import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { ArrowPathIcon, CloudArrowUpIcon, EyeIcon } from '@heroicons/react/24/outline';
import { DOCUMENT_FIELDS } from './constants.js';

function DocumentCard({
  label,
  value,
  onChange,
  onUpload,
  onPreview,
  accept,
  uploading,
  helper,
}) {
  const statusTone = value ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-600';
  return (
    <div className={`flex flex-col justify-between rounded-3xl border ${statusTone} p-5 shadow-sm transition`}> 
      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm font-semibold">
          <span>{label}</span>
          {value ? (
            <button
              type="button"
              onClick={onPreview}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-white px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:border-emerald-400 hover:text-emerald-800"
            >
              <EyeIcon className="h-4 w-4" aria-hidden="true" /> View
            </button>
          ) : null}
        </div>
        <input
          value={value ?? ''}
          onChange={(event) => onChange?.(event.target.value)}
          placeholder="Storage key"
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-700 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
        />
        {helper ? <p className="text-xs font-semibold text-slate-400">{helper}</p> : null}
      </div>
      <label className="mt-6 inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900">
        <CloudArrowUpIcon className="h-5 w-5" aria-hidden="true" />
        {uploading ? (
          <span className="inline-flex items-center gap-2">
            <ArrowPathIcon className="h-4 w-4 animate-spin" aria-hidden="true" /> Uploading…
          </span>
        ) : (
          'Upload'
        )}
        <input
          type="file"
          className="sr-only"
          accept={accept}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              onUpload?.(file);
              event.target.value = '';
            }
          }}
        />
      </label>
    </div>
  );
}

DocumentCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func,
  onUpload: PropTypes.func,
  onPreview: PropTypes.func,
  accept: PropTypes.string,
  uploading: PropTypes.bool,
  helper: PropTypes.string,
};

DocumentCard.defaultProps = {
  value: '',
  onChange: undefined,
  onUpload: undefined,
  onPreview: undefined,
  accept: 'image/*,application/pdf',
  uploading: false,
  helper: undefined,
};

export default function IdentityDocumentsBoard({
  formValues,
  metadata,
  onFieldChange,
  onMetadataChange,
  onUpload,
  onPreview,
  uploadState,
}) {
  const documentEntries = useMemo(() => DOCUMENT_FIELDS, []);
  const uploading = uploadState?.status === 'uploading';

  const resolveValue = (field) => {
    if (field.startsWith('metadata.')) {
      const key = field.split('.', 2)[1];
      return metadata?.[key] ?? '';
    }
    return formValues?.[field] ?? '';
  };

  const handleChange = (field, value) => {
    if (field.startsWith('metadata.')) {
      const key = field.split('.', 2)[1];
      onMetadataChange?.(key, value);
      return;
    }
    onFieldChange?.(field, value);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
      {documentEntries.map((doc) => (
        <DocumentCard
          key={doc.id}
          label={doc.label}
          value={resolveValue(doc.field)}
          helper={doc.helper}
          accept={doc.accept}
          uploading={uploading}
          onChange={(value) => handleChange(doc.field, value)}
          onUpload={(file) => onUpload?.(doc.field, file)}
          onPreview={() => onPreview?.(doc)}
        />
      ))}
    </div>
  );
}

IdentityDocumentsBoard.propTypes = {
  formValues: PropTypes.object.isRequired,
  metadata: PropTypes.object,
  onFieldChange: PropTypes.func.isRequired,
  onMetadataChange: PropTypes.func.isRequired,
  onUpload: PropTypes.func.isRequired,
  onPreview: PropTypes.func.isRequired,
  uploadState: PropTypes.shape({
    status: PropTypes.string,
    error: PropTypes.oneOfType([PropTypes.instanceOf(Error), PropTypes.object]),
  }),
};

IdentityDocumentsBoard.defaultProps = {
  metadata: {},
  uploadState: { status: 'idle', error: null },
};
