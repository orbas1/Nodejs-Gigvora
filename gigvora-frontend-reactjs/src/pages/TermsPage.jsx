import PageHeader from '../components/PageHeader.jsx';

const SECTIONS = [
  {
    title: '1. Who we are',
    body: [
      'Gigvora is operated by Gigvora Technologies Ltd, a company registered in England and Wales. These terms govern your use of our marketplace, collaboration tools, dashboards, and mobile applications.',
      'We operate as a controller for personal data that we collect about members, companies, agencies, and headhunters using the platform.',
    ],
  },
  {
    title: '2. Acceptable use',
    body: [
      'Treat the community respectfully and comply with applicable law. You must not upload unlawful or infringing content, harass other members, or interfere with our services.',
      'You are responsible for safeguarding your login credentials and ensuring that anyone accessing your workspace is authorised to do so.',
    ],
  },
  {
    title: '3. Marketplace participation',
    body: [
      'Jobs, gigs, projects, volunteering missions, and Experience Launchpad opportunities published on Gigvora must be genuine. Budgets, scopes, and timescales should be transparent and updated when they change.',
      'Companies and agencies agree to honour accepted offers and provide timely feedback. Freelancers and talent agree to deliver work with due care and professionalism.',
    ],
  },
  {
    title: '4. Fees and payments',
    body: [
      'Platform fees, subscription charges, and escrow terms are set out in your commercial agreement or order form. Where we process payments, funds are held in segregated client accounts and released according to milestones or agreed schedules.',
      'All fees are exclusive of VAT, which will be charged where applicable under UK law.',
    ],
  },
  {
    title: '5. Intellectual property',
    body: [
      'You retain ownership of content that you upload, but grant Gigvora a licence to host and display it for the purpose of delivering the services.',
      'Gigvora retains all rights in the platform, branding, product designs, and proprietary datasets. Do not reverse engineer or resell access to our services.',
    ],
  },
  {
    title: '6. Data protection and confidentiality',
    body: [
      'We process personal data in line with the UK GDPR and the Data Protection Act 2018. Each party must handle confidential information responsibly and only share it with authorised personnel who need it to perform the agreement.',
      'If you receive personal data via Gigvora, you must use it solely for legitimate talent engagement purposes and delete it when no longer required.',
    ],
  },
  {
    title: '7. Termination',
    body: [
      'We may suspend or terminate access where accounts breach these terms, overdue invoices remain unpaid, or security risks are identified.',
      'You may close your account by contacting support. Termination does not affect accrued rights or obligations, including payment of outstanding fees.',
    ],
  },
  {
    title: '8. Liability',
    body: [
      'Nothing limits liability for fraud, fraudulent misrepresentation, or death or personal injury caused by negligence.',
      'Subject to that, Gigvora’s aggregate liability in any 12-month period is limited to the fees paid to us in that period. We are not responsible for indirect or consequential losses.',
    ],
  },
  {
    title: '9. Governing law',
    body: [
      'These terms are governed by the laws of England and Wales and disputes are subject to the exclusive jurisdiction of the English courts.',
      'We will provide at least 30 days’ notice of material updates. Continued use after changes take effect constitutes acceptance.',
    ],
  },
];

export default function TermsPage() {
  return (
    <section className="relative overflow-hidden py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(191,219,254,0.35),_transparent_65%)]" aria-hidden="true" />
      <div className="absolute -right-16 top-10 h-72 w-72 rounded-full bg-accent/10 blur-[140px]" aria-hidden="true" />
      <div className="relative mx-auto max-w-4xl px-6">
        <PageHeader
          eyebrow="Legal"
          title="Terms and conditions"
          description="These terms set out the legal framework for using Gigvora’s marketplace, dashboards, and communication tools."
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
            Last updated: {new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>
    </section>
  );
}
