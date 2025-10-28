import { useNavigate } from 'react-router-dom';
import useSession from '../hooks/useSession.js';
import useHomeExperience from '../hooks/useHomeExperience.js';
import analytics from '../services/analytics.js';
import HomeHeroSection from './home/HomeHeroSection.jsx';
import Footer from '../components/Footer.jsx';

export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useSession();
  const { data: homeData, loading, error } = useHomeExperience({ enabled: true });

  const heroHeadline = homeData?.settings?.heroHeadline ?? homeData?.marketing?.hero?.headline ?? null;
  const heroSubheading = homeData?.settings?.heroSubheading ?? homeData?.marketing?.hero?.subheading ?? null;
  const heroMedia = homeData?.settings?.heroMedia ?? homeData?.marketing?.hero?.media ?? null;

  const handleJoin = () => {
    analytics.track('web_home_join_clicked', { placement: 'hero_primary', authenticated: isAuthenticated });
    navigate('/register');
  };

  const handleBrowse = () => {
    analytics.track('web_home_browse_opportunities_clicked', { placement: 'hero_secondary', authenticated: isAuthenticated });
    navigate('/gigs');
  };

  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <main className="flex-1">
        <HomeHeroSection
          headline={heroHeadline}
          subheading={heroSubheading}
          media={heroMedia}
          loading={loading}
          error={error}
          onPrimaryAction={handleJoin}
          onSecondaryAction={handleBrowse}
        />
      </main>
      <Footer />
    </div>
  );
}
