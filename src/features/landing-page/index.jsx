import { useEffect } from 'react';
import './landing.css';
import NavBar from './NavBar';
import HeroSection from './HeroSection';
import SectoresSection from './SectoresSection';
import FeaturesSection from './FeaturesSection';
import DiffSection from './DiffSection';
import CTASection from './CTASection';
import FooterSection from './FooterSection';

function useReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('lp-reveal-visible');
      }),
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );
    document.querySelectorAll('.lp-reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

export default function LandingPage() {
  useReveal();

  return (
    <div style={{ fontFamily: 'var(--lp-font)', background: '#fff', overflowX: 'hidden' }}>
      <NavBar />
      <HeroSection />
      <SectoresSection />
      <FeaturesSection />
      <DiffSection />
      <CTASection />
      <FooterSection />
    </div>
  );
}
