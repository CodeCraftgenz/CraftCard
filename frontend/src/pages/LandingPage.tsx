import { motion } from 'framer-motion';
import { Header } from '@/components/organisms/Header';
import { Footer } from '@/components/organisms/Footer';
import { LandingBackground } from '@/components/atoms/LandingBackground';
import { ScrollProgressBar } from '@/components/atoms/ScrollProgressBar';
import { StickyCtaBanner } from '@/components/atoms/StickyCtaBanner';
import { BackToTopButton } from '@/components/atoms/BackToTopButton';
import { SectionDivider } from '@/components/atoms/SectionDivider';
import { RevealSection } from '@/components/atoms/RevealSection';
import { Marquee } from '@/components/atoms/Marquee';
import { HeroSection } from '@/components/sections/HeroSection';
import { TrustedBySection } from '@/components/sections/TrustedBySection';
import { BenefitsSection } from '@/components/sections/BenefitsSection';
import { FeaturesShowcaseSection } from '@/components/sections/FeaturesShowcaseSection';
import { HowItWorksSection } from '@/components/sections/HowItWorksSection';
import { UseCasesSection } from '@/components/sections/UseCasesSection';
import { SocialProofSection } from '@/components/sections/SocialProofSection';
import { TemplateGallerySection } from '@/components/sections/TemplateGallerySection';
import { PricingSection } from '@/components/sections/PricingSection';
import { FaqSection } from '@/components/sections/FaqSection';
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
          <RevealSection>
            <BenefitsSection />
          </RevealSection>

          <SectionDivider />
          <RevealSection>
            <FeaturesShowcaseSection />
          </RevealSection>

          <SectionDivider />
          <RevealSection>
            <HowItWorksSection />
          </RevealSection>

          <SectionDivider />
          <RevealSection>
            <UseCasesSection />
          </RevealSection>

          <SectionDivider />
          <RevealSection>
            <SocialProofSection />
          </RevealSection>

          <SectionDivider />
          <RevealSection>
            <TemplateGallerySection />
          </RevealSection>

          <SectionDivider />
          <RevealSection>
            <PricingSection />
          </RevealSection>

          <SectionDivider />
          <RevealSection>
            <FaqSection />
          </RevealSection>

          <CtaSection />
        </main>
        <Footer />
      </motion.div>

      <StickyCtaBanner />
      <BackToTopButton />
    </div>
  );
}
