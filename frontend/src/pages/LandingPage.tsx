import { motion } from 'framer-motion';
import { Header } from '@/components/organisms/Header';
import { Footer } from '@/components/organisms/Footer';
import { LandingBackground } from '@/components/atoms/LandingBackground';
import { ScrollProgressBar } from '@/components/atoms/ScrollProgressBar';
import { StickyCtaBanner } from '@/components/atoms/StickyCtaBanner';
import { SectionDivider } from '@/components/atoms/SectionDivider';
import { Marquee } from '@/components/atoms/Marquee';
import { HeroSection } from '@/components/sections/HeroSection';
import { TrustedBySection } from '@/components/sections/TrustedBySection';
import { BenefitsSection } from '@/components/sections/BenefitsSection';
import { HowItWorksSection } from '@/components/sections/HowItWorksSection';
import { UseCasesSection } from '@/components/sections/UseCasesSection';
import { SocialProofSection } from '@/components/sections/SocialProofSection';
import { PricingSection } from '@/components/sections/PricingSection';
import { FaqSection } from '@/components/sections/FaqSection';
import { FeaturesShowcaseSection } from '@/components/sections/FeaturesShowcaseSection';
import { CtaSection } from '@/components/sections/CtaSection';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#020617] text-white relative">
      <ScrollProgressBar />
      <LandingBackground />

      {/* Page entrance animation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-[1]"
      >
        <Header />
        <main>
          <HeroSection />

          <TrustedBySection />
          <Marquee />

          <SectionDivider />
          <BenefitsSection />

          <SectionDivider />
          <FeaturesShowcaseSection />

          <SectionDivider />
          <HowItWorksSection />

          <SectionDivider />
          <UseCasesSection />

          <SectionDivider />
          <SocialProofSection />

          <SectionDivider />
          <PricingSection />

          <SectionDivider />
          <FaqSection />

          <CtaSection />
        </main>
        <Footer />
      </motion.div>

      <StickyCtaBanner />
    </div>
  );
}
