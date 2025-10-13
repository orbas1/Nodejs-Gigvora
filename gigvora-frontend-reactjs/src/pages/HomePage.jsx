import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HeroSection from '../components/HeroSection.jsx';
import PartnerStrip from '../components/PartnerStrip.jsx';
import FeatureGrid from '../components/FeatureGrid.jsx';
import MomentumSection from '../components/MomentumSection.jsx';
import OpportunitySections from '../components/OpportunitySections.jsx';
import TestimonialsSection from '../components/TestimonialsSection.jsx';
import CTASection from '../components/CTASection.jsx';
import ProductShowcase from '../components/ProductShowcase.jsx';
import useSession from '../hooks/useSession.js';

export default function HomePage() {
  const { isAuthenticated } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/feed', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="space-y-0">
      <HeroSection />
      <PartnerStrip />
      <FeatureGrid />
      <MomentumSection />
      <ProductShowcase />
      <OpportunitySections />
      <TestimonialsSection />
      <CTASection />
    </div>
  );
}
