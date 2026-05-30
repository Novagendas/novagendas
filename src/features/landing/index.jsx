import { useReveal, ScrollProgress, BackToTop } from './ui';
import { Nav, Hero } from './Hero';
import { StatStrip, Features } from './Features';
import { Showcase } from './Showcase';
import { Steps, Quote, Pillars, FinalCTA, Footer } from './Sections';
import { Channels, Pricing, FAQ } from './Sections2';

import './assets/colors_and_type.css';
import './landing.css';

export default function LandingPage({ onLaunchDemo }) {
  useReveal();

  return (
    <div className="landing-page-root">
      <ScrollProgress />
      <Nav onLaunchDemo={onLaunchDemo} />
      <main>
        <Hero onLaunchDemo={onLaunchDemo} />
        <StatStrip />
        <Channels />
        <Features />
        <Showcase />
        <Steps />
        <Quote />
        <Pillars />
        <Pricing onLaunchDemo={onLaunchDemo} />
        <FAQ />
        <FinalCTA onLaunchDemo={onLaunchDemo} />
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}
