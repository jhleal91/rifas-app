import React, { useState, useEffect } from 'react';
import SEO from './SEO';
import analytics from '../services/analytics';
import AffiliateLinks from './AffiliateLinks';
import CreatorPlans from './CreatorPlans';
import LoginModal from './modals/LoginModal';
import RegisterModal from './modals/RegisterModal';
import ParticipantRegisterModal from './modals/ParticipantRegisterModal';
import HeroSection from './landing/HeroSection';
import AboutSection from './landing/AboutSection';
import FeaturesSection from './landing/FeaturesSection';
import HowItWorksSection from './landing/HowItWorksSection';
import CTASection from './landing/CTASection';
import AdvertisersSection from './landing/AdvertisersSection';
import './LandingPage.css';

const LandingPage = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showParticipantRegister, setShowParticipantRegister] = useState(false);

  // Manejar eventos de modales desde otros componentes
  useEffect(() => {
    const handleShowRegister = () => setShowRegister(true);
    const handleShowLogin = () => setShowLogin(true);
    
    window.addEventListener('showRegisterModal', handleShowRegister);
    window.addEventListener('showLoginModal', handleShowLogin);
    
    return () => {
      window.removeEventListener('showRegisterModal', handleShowRegister);
      window.removeEventListener('showLoginModal', handleShowLogin);
    };
  }, []);

  // Track page view
  useEffect(() => {
    analytics.trackPageView('Landing Page');
  }, []);

  return (
    <div className="landing-page">
      <SEO 
        title="SorteoHub - Plataforma Profesional de Rifas"
        description="Organiza rifas de manera segura, transparente y profesional. Gestiona participantes, sorteos en vivo y pagos de forma fácil y confiable."
        keywords="rifas, sorteos, lotería, organizar rifas, plataforma rifas, rifas sin fines de lucro"
      />
      
      <HeroSection 
        onShowRegister={() => setShowRegister(true)}
        onShowLogin={() => setShowLogin(true)}
      />
      
      <AboutSection />
      
      <FeaturesSection />
      
      <HowItWorksSection />
      
      <CTASection onShowRegister={() => setShowRegister(true)} />
      
      {/* Sección de Planes para Creadores */}
      <section className="creator-plans-section">
        <div className="container">
          <CreatorPlans />
        </div>
      </section> 

      {/* Affiliate Links Section */}
      <section className="affiliate-section">
        <div className="container">
          <AffiliateLinks category="general" limit={3} />
        </div>
      </section>

      <AdvertisersSection />

      {/* Modales */}
      <LoginModal 
        isOpen={showLogin} 
        onClose={() => setShowLogin(false)} 
      />
      <RegisterModal 
        isOpen={showRegister} 
        onClose={() => setShowRegister(false)} 
      />
      <ParticipantRegisterModal 
        isOpen={showParticipantRegister} 
        onClose={() => setShowParticipantRegister(false)} 
      />
    </div>
  );
};

export default LandingPage;
