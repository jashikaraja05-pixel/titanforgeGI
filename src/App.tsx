import React, { useState, useEffect } from 'react';
import { Navbar } from './components/common/Navbar';
import { LandingHero } from './components/landing/LandingHero';
import { AuthScreen } from './components/auth/AuthScreen';
import { PeopleDashboard } from './components/people/PeopleDashboard';
import { GovernmentDashboard } from './components/government/GovernmentDashboard';
import { ResponsibleAIModal } from './components/common/ResponsibleAIModal';
import { FeedbackModal } from './components/common/FeedbackModal';
import { LanguageDiagnosticsModal } from './components/common/LanguageDiagnosticsModal';
import { PolicySpeechPlayer } from './components/common/PolicySpeechPlayer';
import { GovInsightLogo } from './components/common/GovInsightLogo';
import { SUPPORTED_LANGUAGES, COUNTRY_PROFILES, t } from './services/i18n';
import { SupportedLanguage, CountryProfile } from './types';
import { ShieldCheck, Users, Building2, LogOut } from 'lucide-react';
import { auth, db } from './services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'auth' | 'people' | 'government'>('landing');
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(() => {
    try {
      const saved = localStorage.getItem('govinsight_app_language');
      if (saved) {
        const found = SUPPORTED_LANGUAGES.find((l) => l.code === saved);
        if (found) return found;
      }
    } catch {}
    return SUPPORTED_LANGUAGES[0]; // English default
  });
  const [currentCountry, setCurrentCountry] = useState<CountryProfile>(COUNTRY_PROFILES[0]); // India default
  const [isResponsibleAiOpen, setIsResponsibleAiOpen] = useState<boolean>(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState<boolean>(false);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  const handleLanguageChange = (lang: SupportedLanguage) => {
    setCurrentLanguage(lang);
    try {
      localStorage.setItem('govinsight_app_language', lang.code);
    } catch {}
  };

  // Sync Firebase Auth session on boot
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userSnap = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userSnap.exists()) {
            const data = userSnap.data();
            setCurrentUser(data);
            setIsLoggedIn(true);
            if (currentView === 'landing' || currentView === 'auth') {
              setCurrentView(data.role === 'government' ? 'government' : 'people');
            }
          } else {
            const basicUser = {
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || 'Registered Citizen',
              email: firebaseUser.email,
              role: 'people',
              country: 'India',
              state: 'Tamil Nadu',
              district: 'Chennai',
              provider: 'google',
            };
            setCurrentUser(basicUser);
            setIsLoggedIn(true);
            if (currentView === 'landing' || currentView === 'auth') {
              setCurrentView('people');
            }
          }
        } catch (e) {
          console.warn('Firebase user sync notice:', e);
        }
      }
    });

    return () => unsubscribe();
  }, [currentView]);

  const handleLoginSuccess = (role: 'people' | 'government', userData?: any) => {
    setCurrentUser(userData || null);
    setIsLoggedIn(true);
    setCurrentView(role);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch {}
    setIsLoggedIn(false);
    setCurrentUser(null);
    setCurrentView('landing');
  };

  const handleNavigate = (view: 'landing' | 'auth' | 'people' | 'government') => {
    if ((view === 'people' || view === 'government') && !isLoggedIn) {
      setCurrentView('auth');
      return;
    }
    setCurrentView(view);
  };

  return (
    <div className="min-h-screen bg-[#07080B] text-slate-100 flex flex-col selection:bg-red-600 selection:text-white">
      {/* Universal Top Navigation */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        currentLanguage={currentLanguage}
        onLanguageChange={handleLanguageChange}
        currentCountry={currentCountry}
        onCountryChange={(country) => setCurrentCountry(country)}
        onOpenResponsibleAi={() => setIsResponsibleAiOpen(true)}
        onOpenFeedback={() => setIsFeedbackOpen(true)}
        onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
        isLoggedIn={isLoggedIn}
      />

      {/* User Session Bar when logged in */}
      {isLoggedIn && currentUser && (
        <div className="bg-red-950/40 border-b border-red-500/20 px-4 py-2 text-xs text-slate-300">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-slate-400">Authenticated Session:</span>
              <span className="font-bold text-white">{currentUser.name}</span>
              {currentUser.department && (
                <span className="hidden sm:inline text-red-400 font-mono">({currentUser.department})</span>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-red-400 font-semibold transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Main View Router */}
      <main className="flex-1">
        {/* VIEW 1: CLEAN LANDING PAGE */}
        {currentView === 'landing' && (
          <LandingHero
            currentLanguage={currentLanguage}
            onGetStarted={() => setCurrentView('auth')}
          />
        )}

        {/* VIEW 2: LOGIN & REGISTRATION SCREEN */}
        {currentView === 'auth' && (
          <AuthScreen
            currentLanguage={currentLanguage}
            onLoginSuccess={handleLoginSuccess}
            onBackToLanding={() => setCurrentView('landing')}
          />
        )}

        {/* VIEW 3: CITIZEN PEOPLE DASHBOARD */}
        {currentView === 'people' &&
          (isLoggedIn ? (
            <PeopleDashboard
              currentLanguage={currentLanguage}
              onLanguageChange={(lang) => setCurrentLanguage(lang)}
              onOpenResponsibleAi={() => setIsResponsibleAiOpen(true)}
              onSwitchToGov={() => setCurrentView('government')}
              userData={currentUser}
            />
          ) : (
            <AuthScreen
              currentLanguage={currentLanguage}
              onLoginSuccess={handleLoginSuccess}
              onBackToLanding={() => setCurrentView('landing')}
            />
          ))}

        {/* VIEW 4: AUTHORIZED GOVERNMENT DASHBOARD */}
        {currentView === 'government' &&
          (isLoggedIn ? (
            <GovernmentDashboard
              currentLanguage={currentLanguage}
              currentCountry={currentCountry}
              onOpenResponsibleAi={() => setIsResponsibleAiOpen(true)}
              onSwitchToCitizen={() => setCurrentView('people')}
              userData={currentUser}
            />
          ) : (
            <AuthScreen
              currentLanguage={currentLanguage}
              onLoginSuccess={handleLoginSuccess}
              onBackToLanding={() => setCurrentView('landing')}
            />
          ))}
      </main>

      {/* Responsible AI Oversight Modal */}
      <ResponsibleAIModal
        isOpen={isResponsibleAiOpen}
        onClose={() => setIsResponsibleAiOpen(false)}
      />

      {/* User Feedback & Firestore Satisfaction Modal */}
      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />

      {/* Language Output & Linguistic Accuracy Diagnostic Utility */}
      <LanguageDiagnosticsModal
        isOpen={isDiagnosticsOpen}
        onClose={() => setIsDiagnosticsOpen(false)}
        initialLangCode={currentLanguage.code}
      />

      {/* Persistent Policy SpeechSynthesis Player Bar */}
      <PolicySpeechPlayer />
    </div>
  );
}
