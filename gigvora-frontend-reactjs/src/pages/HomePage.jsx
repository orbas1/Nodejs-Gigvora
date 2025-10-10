import HeroSection from '../components/HeroSection.jsx';
import FeatureGrid from '../components/FeatureGrid.jsx';
import OpportunitySections from '../components/OpportunitySections.jsx';
import CTASection from '../components/CTASection.jsx';

export default function HomePage() {
  return (
    <div className="space-y-0">
      <HeroSection />
      <FeatureGrid />
      <OpportunitySections />
      <CTASection />
    </div>
  );
}
