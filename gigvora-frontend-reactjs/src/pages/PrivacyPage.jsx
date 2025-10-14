import PageHeader from '../components/PageHeader.jsx';

const SECTIONS = [
  {
    title: '1. Data controller',
    body: [
      'Gigvora Technologies Ltd is the data controller for personal data processed via the platform. Our registered office is in London, United Kingdom.',
      'We comply with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.',
    ],
  },
  {
    title: '2. What data we collect',
    body: [
      'Profile information such as name, role, skills, biography, and avatar preferences.',
      'Engagement data including projects, gigs, volunteering missions, Experience Launchpad cohorts, and messaging activity.',
      'Usage analytics that help us improve product experience. We pseudonymise analytics wherever possible.',
    ],
  },
  {
    title: '3. How we use personal data',
    body: [
      'To operate the marketplace, match talent to opportunities, and enable payments and invoicing.',
      'To maintain security, detect fraud, and ensure compliance with trust and safety obligations.',
      'To communicate product updates, onboarding resources, and support responses.',
    ],
  },
  {
    title: '4. Legal bases',
    body: [
      'Performance of a contract when we deliver services you request.',
      'Legitimate interests to run and secure the platform, balanced against your rights.',
      'Consent for optional communications such as newsletters. You can withdraw consent at any time.',
    ],
  },
  {
    title: '5. Data sharing and international transfers',
    body: [
      'We share data with vetted processors who provide infrastructure, communications, and analytics. Contracts include UK GDPR-compliant clauses.',
      'When data leaves the UK or EEA, we rely on adequacy regulations or standard contractual clauses with supplementary safeguards.',
    ],
  },
  {
    title: '6. Retention',
    body: [
      'We keep account information for as long as the membership remains active and for up to six years afterwards to meet legal obligations.',
      'You can request deletion of your profile or opportunities by contacting privacy@gigvora.com. We may retain minimal records to evidence compliance.',
    ],
  },
  {
    title: '7. Your rights',
    body: [
      'You have rights to access, rectify, erase, restrict processing, and port your personal data. You also have the right to object to processing based on legitimate interests.',
      'To exercise your rights, email privacy@gigvora.com. You may also lodge a complaint with the UK Information Commissioner’s Office.',
    ],
  },
  {
    title: '8. Cookies and tracking',
    body: [
      'We use essential cookies to keep you signed in and secure. Optional analytics cookies are only activated with your consent.',
      'Cookie preferences can be managed in the Trust Centre and are synchronised across web and mobile experiences.',
    ],
  },
  {
    title: '9. Contact',
    body: [
      'For questions about this policy or data protection requests, contact privacy@gigvora.com or write to our registered office.',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <section className="relative overflow-hidden py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(191,219,254,0.35),_transparent_65%)]" aria-hidden="true" />
      <div className="absolute -left-14 top-10 h-64 w-64 rounded-full bg-emerald-200/40 blur-[130px]" aria-hidden="true" />
      <div className="relative mx-auto max-w-4xl px-6">
        <PageHeader
          eyebrow="Legal"
          title="Privacy notice (UK)"
          description="How Gigvora collects, uses, and protects personal data in accordance with UK GDPR and the Data Protection Act 2018."
        />
        <div className="mt-10 space-y-8 rounded-3xl border border-slate-200 bg-white/95 p-8 text-sm leading-6 text-slate-700 shadow-soft">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <h2 className="text-lg font-semibold text-slate-900">{section.title}</h2>
              <div className="mt-3 space-y-3">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </div>
          ))}
          <p className="text-xs text-slate-500">
            Last reviewed: {new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>
    </section>
  );
}
