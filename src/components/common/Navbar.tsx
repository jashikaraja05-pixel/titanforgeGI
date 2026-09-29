import React, { useState } from 'react';
import { GovInsightLogo } from './GovInsightLogo';
import { SUPPORTED_LANGUAGES, COUNTRY_PROFILES, t } from '../../services/i18n';
import { SupportedLanguage, CountryProfile } from '../../types';
import { Globe, Shield, Users, Building2, ChevronDown, Check, Sparkles, Menu, X, Radio, MessageSquare, Activity } from 'lucide-react';

interface NavbarProps {
  currentView: 'landing' | 'auth' | 'people' | 'government';
  onNavigate: (view: 'landing' | 'auth' | 'people' | 'government') => void;
  currentLanguage: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  currentCountry: CountryProfile;
  onCountryChange: (country: CountryProfile) => void;
  onOpenResponsibleAi: () => void;
  onOpenFeedback?: () => void;
  onOpenDiagnostics?: () => void;
  isLoggedIn?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  currentLanguage,
  onLanguageChange,
  currentCountry,
  onCountryChange,
  onOpenResponsibleAi,
  onOpenFeedback,
  onOpenDiagnostics,
  isLoggedIn = false,
}) => {
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-[#08090C]/90 backdrop-blur-xl border-b border-white/10 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* Logo */}
        <div
          onClick={() => onNavigate('landing')}
          className="cursor-pointer transition-transform hover:scale-[1.02] flex items-center"
        >
          <GovInsightLogo size="md" showTagline={false} />
        </div>

        {/* Right Action Tools: Language, Country & AI Oversight */}
        <div className="flex items-center gap-2.5">
          {/* Responsible AI Button */}
          <button
            onClick={onOpenResponsibleAi}
            title="Responsible AI & Human-in-the-Loop Architecture"
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-950/30 hover:bg-red-900/40 border border-red-500/30 text-[11px] font-medium text-red-300 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-red-400 animate-pulse" />
            <span>Responsible AI</span>
          </button>

          {/* Worldwide Language Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setIsLangOpen(!isLangOpen);
                setIsCountryOpen(false);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/60 hover:bg-white/10 border border-white/10 text-xs text-slate-200 transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-red-400" />
              <span className="font-semibold">{currentLanguage.flag}</span>
              <span className="hidden sm:inline font-medium">{currentLanguage.nativeName}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isLangOpen && (
              <div className="absolute right-0 mt-2 w-64 max-h-96 overflow-y-auto rounded-xl bg-slate-900 border border-red-500/30 shadow-2xl p-1.5 z-50">
                <div className="px-3 py-1.5 flex items-center justify-between border-b border-white/10 mb-1">
                  <span className="text-[10px] uppercase font-bold text-red-400 tracking-wider">
                    Select Language ({SUPPORTED_LANGUAGES.length})
                  </span>
                  <button
                    onClick={() => setIsLangOpen(false)}
                    className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white"
                    title="Close"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-0.5">
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        onLanguageChange(lang);
                        setIsLangOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                        currentLanguage.code === lang.code
                          ? 'bg-red-600/20 border border-red-500/40 text-white font-semibold'
                          : 'text-slate-300 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">{lang.flag}</span>
                        <div className="text-left">
                          <p className="leading-none text-white">{lang.nativeName}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{lang.name}</p>
                        </div>
                      </div>
                      {currentLanguage.code === lang.code && (
                        <Check className="w-4 h-4 text-red-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Country / Jurisdiction Selector */}
          <div className="relative">
            <button
              onClick={() => {
                setIsCountryOpen(!isCountryOpen);
                setIsLangOpen(false);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/60 hover:bg-white/10 border border-white/10 text-xs text-slate-200 transition-colors"
            >
              <span className="text-sm">{currentCountry.flag}</span>
              <span className="hidden md:inline font-medium">{currentCountry.name}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isCountryOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl bg-slate-900 border border-red-500/30 shadow-2xl p-1.5 z-50">
                <div className="px-3 py-1.5 flex items-center justify-between border-b border-white/10 mb-1">
                  <span className="text-[10px] uppercase font-bold text-red-400 tracking-wider">
                    Country Jurisdiction (BRICS + Spain)
                  </span>
                  <button
                    onClick={() => setIsCountryOpen(false)}
                    className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white"
                    title="Close"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-0.5">
                  {COUNTRY_PROFILES.map((c) => (
                    <button
                      key={c.code}
                      onClick={() => {
                        onCountryChange(c);
                        setIsCountryOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                        currentCountry.code === c.code
                          ? 'bg-red-600/20 border border-red-500/40 text-white font-semibold'
                          : 'text-slate-300 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{c.flag}</span>
                        <span>{c.name}</span>
                      </div>
                      {currentCountry.code === c.code && (
                        <Check className="w-3.5 h-3.5 text-red-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-black/60 border border-white/10 text-slate-300"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden px-4 pt-2 pb-4 bg-slate-950/95 border-b border-white/10 space-y-2">
          <button
            onClick={() => {
              onNavigate('landing');
              setIsMobileMenuOpen(false);
            }}
            className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm font-semibold ${
              currentView === 'landing' ? 'bg-red-600 text-white' : 'text-slate-300 hover:bg-white/5'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => {
              onNavigate('auth');
              setIsMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm font-semibold ${
              currentView === 'auth' ? 'bg-red-600 text-white' : 'text-slate-300 hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-4 h-4 text-red-400" />
            <span>{t('getStarted', currentLanguage.code)} / Login</span>
          </button>
          <button
            onClick={() => {
              onNavigate('people');
              setIsMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm font-semibold ${
              currentView === 'people' ? 'bg-red-600 text-white' : 'text-slate-300 hover:bg-white/5'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{t('peoplePortal', currentLanguage.code)}</span>
          </button>
          <button
            onClick={() => {
              onNavigate('government');
              setIsMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm font-semibold ${
              currentView === 'government' ? 'bg-red-600 text-white' : 'text-slate-300 hover:bg-white/5'
            }`}
          >
            <Building2 className="w-4 h-4 text-red-400" />
            <span>{t('govPortal', currentLanguage.code)}</span>
          </button>
        </div>
      )}
    </header>
  );
};
