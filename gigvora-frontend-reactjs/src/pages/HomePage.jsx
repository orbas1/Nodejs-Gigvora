import HeroSection from '../components/HeroSection.jsx';
import PartnerStrip from '../components/PartnerStrip.jsx';
import FeatureGrid from '../components/FeatureGrid.jsx';
import MomentumSection from '../components/MomentumSection.jsx';
import OpportunitySections from '../components/OpportunitySections.jsx';
import TestimonialsSection from '../components/TestimonialsSection.jsx';
import CTASection from '../components/CTASection.jsx';

export default function HomePage() {
  return (
    <div className="space-y-0">
      <HeroSection />
      <PartnerStrip />
      <FeatureGrid />
      <MomentumSection />
      <OpportunitySections />
      <TestimonialsSection />
      <CTASection />
    </div>
  );
}
