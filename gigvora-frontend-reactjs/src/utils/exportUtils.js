const LINE_BREAK = '\r\n';

function normaliseHeaders(headers) {
  if (!Array.isArray(headers)) {
    return [];
  }

  return headers
    .map((header) => {
      if (!header) {
        return null;
      }

      if (typeof header === 'string') {
        const key = header.trim();
        if (!key) {
          return null;
        }
        return { key, label: header };
      }

      const key = typeof header.key === 'string' ? header.key.trim() : '';
      const label = typeof header.label === 'string' ? header.label : key;

      if (!key) {
        return null;
      }

      return { key, label };
    })
    .filter(Boolean);
}

function escapeCell(value) {
  if (value == null) {
    return '';
  }

  const stringValue = Array.isArray(value) ? value.join('; ') : `${value}`;
  const needsEscaping = /["\n,]/.test(stringValue);

  if (!needsEscaping) {
    return stringValue;
  }

  return `"${stringValue.replace(/"/g, '""')}"`;
}

function buildCsv(headers, rows) {
  const headerLine = headers.map((header) => escapeCell(header.label)).join(',');
  const rowLines = rows.map((row) => {
    return headers
      .map((header) => {
        const value = row?.[header.key];
        return escapeCell(value);
      })
      .join(',');
  });
  return [headerLine, ...rowLines].join(LINE_BREAK);
}

export function exportToCsv({ filename, headers, rows }) {
  const resolvedHeaders = normaliseHeaders(headers);
  const resolvedRows = Array.isArray(rows) ? rows : [];

  if (!resolvedHeaders.length || !resolvedRows.length) {
    console.warn('Unable to export CSV: headers or rows are missing.');
    return '';
  }

  const csvContent = buildCsv(resolvedHeaders, resolvedRows);

  if (typeof document === 'undefined') {
    return csvContent;
  }

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename || 'export.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return csvContent;
}

export default {
  exportToCsv,
};
