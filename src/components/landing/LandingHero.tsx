import React from 'react';
import { GovInsightLogo } from '../common/GovInsightLogo';
import { SupportedLanguage } from '../../types';
import { t } from '../../services/i18n';
import { handleCivicImageError } from '../../utils/imageFallback';
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Globe2,
  Mic,
  MapPin,
  HeartPulse,
  Utensils,
  GraduationCap,
  Droplets,
} from 'lucide-react';

interface LandingHeroProps {
  currentLanguage: SupportedLanguage;
  onGetStarted: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  currentLanguage,
  onGetStarted,
}) => {
  return (
    <div className="relative w-full overflow-hidden bg-[#07080B] text-slate-100 flex flex-col justify-center">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-b from-red-600/15 via-red-950/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Main Hero Visual Card */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 pb-12">
        <div className="relative rounded-3xl overflow-hidden border border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.2)] bg-[#0c0e14]">
          {/* Hero Banner Image */}
          <div className="relative w-full h-[380px] sm:h-[480px] lg:h-[560px]">
            <img
              src="/hero-banner.jpg"
              alt="GOVINSIGHT - Global Civic Intelligence Platform"
              onError={(e) => handleCivicImageError(e, 'hero')}
              className="w-full h-full object-cover object-center filter brightness-95 contrast-105"
            />
            {/* Gradient Overlays for High-Tech Contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#07080B] via-[#07080B]/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#07080B]/80 via-transparent to-[#07080B]/80" />



            <div className="absolute top-4 right-4 hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/75 backdrop-blur-md border border-white/10 text-xs text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-red-400" />
              <span>RESPONSIBLE AI DECISION SUPPORT</span>
            </div>

            {/* Central Overlay: Logo, Tagline, & GET STARTED Button */}
            <div className="absolute inset-x-0 bottom-8 sm:bottom-14 px-6 sm:px-12 flex flex-col items-center text-center">
              {/* Prominent Logo */}
              <div className="mb-3 transform hover:scale-105 transition-transform duration-300">
                <GovInsightLogo size="xl" showTagline={false} />
              </div>

              {/* Taglines */}
              <p className="text-sm sm:text-base md:text-xl font-extrabold text-red-400 tracking-widest uppercase mb-1 drop-shadow-[0_0_12px_rgba(239,68,68,0.5)]">
                “{t('tagline', currentLanguage.code)}”
              </p>

              <p className="max-w-2xl text-xs sm:text-sm md:text-base text-slate-300/90 font-medium mb-8">
                {t('subtitle', currentLanguage.code)}
              </p>

              {/* FIRST GET STARTED BUTTON */}
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <button
                  onClick={onGetStarted}
                  className="px-10 py-4 rounded-2xl font-black text-base sm:text-lg text-white bg-gradient-to-r from-red-600 via-rose-600 to-red-700 shadow-[0_0_35px_rgba(239,68,68,0.8)] hover:shadow-[0_0_50px_rgba(239,68,68,1)] hover:scale-105 active:scale-95 transition-all flex items-center gap-3 border border-red-400/60"
                >
                  <Sparkles className="w-5 h-5 text-white animate-spin" style={{ animationDuration: '6s' }} />
                  <span className="tracking-wide">{t('getStarted', currentLanguage.code)}</span>
                  <ArrowRight className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
