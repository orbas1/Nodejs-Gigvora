import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { CallToActionBand } from '../../components/marketing/CallToActionBand.jsx';

export function JoinCommunitySection() {
  return (
    <div className="py-24">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <CallToActionBand
          eyebrow="Membership"
          title="Join the community where elite crews, mentors, and operators ship together"
          description="Onboard in minutes, align your collaborators, and access vetted specialists who move at the pace of your programme."
          primaryAction={{ label: 'Claim your seat', to: '/register' }}
          secondaryAction={{
            label: 'Talk with our team',
            href: 'mailto:hello@gigvora.com',
            icon: ArrowRightIcon,
          }}
          supportingPoints={[
            'Curated crews that stay in sync with your roadmap',
            'Mentorship from seasoned operators and advisors',
            'Enterprise compliance, payments, and onboarding built-in',
            {
              title: 'Global reach with local nuance',
              description: '42 countries represented across product, growth, and impact missions.',
            },
          ]}
          stats={[
            { label: 'Teams onboarded', value: '3,800+', helper: 'Accelerating launches worldwide' },
            { label: 'Average go-live', value: '6 weeks', helper: 'From kickoff to first delivery' },
            { label: 'Mentor network', value: '420+', helper: 'Operators coaching every cohort' },
          ]}
          logos={['Northwind Digital', 'Forma Studio', 'Atlas Labs', 'Redbird Ventures']}
          guarantees={['SOC2 Type II', { label: 'Global compliance' }, { label: 'Escrow protected' }]}
          testimonial={{
            quote: 'Gigvora aligned our mentors and operators within days—we shipped our launch playbook 3x faster.',
            name: 'Leah Patel',
            role: 'Programme Director',
            company: 'Northwind Digital',
            avatar: {
              src: 'https://cdn.gigvora.com/assets/avatars/leah-patel.png',
              alt: 'Portrait of Leah Patel smiling',
            },
          }}
          footnote="Backed by production telemetry across venture, enterprise, and social impact programmes."
        />
      </div>
    </div>
  );
}
