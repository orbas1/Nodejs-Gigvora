const DEFAULT_THEME = Object.freeze({
  background: '#ffffff',
  border: '#e5e7eb',
  text: '#111827',
  accent: '#7c3aed',
  muted: '#6b7280',
});

function escapeHtml(value) {
  if (value == null) {
    return '';
  }
  return `${value}`
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function resolveThemeTokens(themeConfig = {}) {
  const tokens = { ...DEFAULT_THEME, ...(themeConfig ?? {}) };
  return {
    background: tokens.background ?? DEFAULT_THEME.background,
    border: tokens.border ?? DEFAULT_THEME.border,
    text: tokens.text ?? DEFAULT_THEME.text,
    accent: tokens.accent ?? DEFAULT_THEME.accent,
    muted: tokens.muted ?? DEFAULT_THEME.muted,
  };
}

function renderMetric(metric) {
  return `
    <div class="rv-metric">
      <div class="rv-metric-value">${escapeHtml(metric.value ?? '')}</div>
      <div class="rv-metric-label">${escapeHtml(metric.label ?? '')}</div>
      ${metric.trendLabel ? `<div class="rv-metric-trend">${escapeHtml(metric.trendLabel)}</div>` : ''}
    </div>
  `;
}

function renderTestimonial(testimonial) {
  return `
    <article class="rv-testimonial">
      <header class="rv-testimonial-header">
        <div>
          <strong>${escapeHtml(testimonial.clientName ?? 'Client')}</strong>
          ${testimonial.clientRole ? `<span class="rv-muted">${escapeHtml(testimonial.clientRole)}</span>` : ''}
        </div>
        ${testimonial.rating != null ? `<span class="rv-rating">${escapeHtml(testimonial.rating)}</span>` : ''}
      </header>
      <p class="rv-testimonial-body">${escapeHtml(testimonial.comment ?? '')}</p>
      ${testimonial.projectName ? `<footer class="rv-muted">${escapeHtml(testimonial.projectName)}</footer>` : ''}
    </article>
  `;
}

function renderJsonLd({ freelancer, testimonials }) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: freelancer?.name ?? 'Freelancer',
    jobTitle: freelancer?.title ?? undefined,
    url: freelancer?.profileUrl ?? undefined,
    review: (testimonials ?? []).map((testimonial) => ({
      '@type': 'Review',
      author: {
        '@type': 'Person',
        name: testimonial.clientName ?? 'Client',
      },
      reviewBody: testimonial.comment ?? '',
      reviewRating:
        testimonial.rating != null
          ? {
              '@type': 'Rating',
              ratingValue: Number(testimonial.rating),
              bestRating: 5,
              worstRating: 1,
            }
          : undefined,
    })),
  };
  return `<script type="application/ld+json">${escapeHtml(JSON.stringify(structuredData))}</script>`;
}

export function renderWidgetHtml({ freelancer, widget, testimonials = [], metrics = [], theme }) {
  const tokens = resolveThemeTokens(theme ?? widget?.themeTokens);
  const safeTestimonials = testimonials.slice(0, 6);
  const safeMetrics = metrics.slice(0, 4);

  const headerSubtitle = freelancer?.title ? `<p class="rv-subtitle">${escapeHtml(freelancer.title)}</p>` : '';
  const metricSection = safeMetrics.length
    ? `
      <section class="rv-metrics">
        ${safeMetrics.map((metric) => renderMetric(metric)).join('')}
      </section>
    `
    : '';
  const testimonialSection = safeTestimonials.length
    ? `
      <section class="rv-testimonials">
        ${safeTestimonials.map((testimonial) => renderTestimonial(testimonial)).join('')}
      </section>
    `
    : '<section class="rv-empty">No verified testimonials yet.</section>';

  const jsonLd = renderJsonLd({ freelancer, testimonials: safeTestimonials });

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(widget?.name ?? 'Reputation Widget')}</title>
    <style>
      :root {
        color-scheme: light;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }
      body {
        margin: 0;
        padding: 24px;
        background: ${tokens.background};
        color: ${tokens.text};
      }
      .rv-card {
        border: 1px solid ${tokens.border};
        border-radius: 16px;
        padding: 24px;
        max-width: 720px;
        margin: 0 auto;
        box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
        background: ${tokens.background};
      }
      .rv-header {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 24px;
      }
      .rv-avatar {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: ${tokens.accent};
        color: #fff;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 20px;
      }
      .rv-title {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
      }
      .rv-subtitle {
        margin: 4px 0 0;
        color: ${tokens.muted};
        font-size: 14px;
      }
      .rv-metrics {
        display: grid;
        gap: 16px;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        margin-bottom: 24px;
      }
      .rv-metric {
        padding: 16px;
        border-radius: 12px;
        border: 1px solid ${tokens.border};
        background: rgba(124, 58, 237, 0.04);
      }
      .rv-metric-value {
        font-size: 22px;
        font-weight: 600;
      }
      .rv-metric-label {
        color: ${tokens.muted};
        font-size: 14px;
      }
      .rv-metric-trend {
        margin-top: 8px;
        font-size: 12px;
        color: ${tokens.accent};
      }
      .rv-testimonials {
        display: grid;
        gap: 20px;
      }
      .rv-testimonial {
        border: 1px solid ${tokens.border};
        border-radius: 14px;
        padding: 20px;
        background: rgba(255, 255, 255, 0.92);
      }
      .rv-testimonial-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
      }
      .rv-rating {
        background: ${tokens.accent};
        color: #fff;
        padding: 4px 10px;
        border-radius: 9999px;
        font-size: 13px;
      }
      .rv-testimonial-body {
        margin: 0;
        font-size: 15px;
        line-height: 1.6;
      }
      .rv-muted {
        color: ${tokens.muted};
        font-size: 13px;
      }
      .rv-empty {
        padding: 32px;
        text-align: center;
        border-radius: 12px;
        border: 1px dashed ${tokens.border};
        color: ${tokens.muted};
      }
    </style>
  </head>
  <body>
    <main class="rv-card">
      <header class="rv-header">
        <div class="rv-avatar">${escapeHtml(freelancer?.initials ?? 'GV')}</div>
        <div>
          <h1 class="rv-title">${escapeHtml(widget?.name ?? 'Reputation Highlights')}</h1>
          ${headerSubtitle}
        </div>
      </header>
      ${metricSection}
      ${testimonialSection}
    </main>
    ${jsonLd}
  </body>
</html>`;
}

export default { renderWidgetHtml };
