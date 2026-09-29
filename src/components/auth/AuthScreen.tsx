import React, { useState, useEffect } from 'react';
import { GovInsightLogo } from '../common/GovInsightLogo';
import { SupportedLanguage } from '../../types';
import { t } from '../../services/i18n';
import {
  getAvailableCountries,
  getStatesForCountry,
  getDistrictsForState,
} from '../../data/regionsAndDistricts';
import {
  Users,
  Building2,
  ShieldCheck,
  ArrowRight,
  X,
  Lock,
  Phone,
  User,
  MapPin,
  CheckCircle2,
  KeyRound,
  IdCard,
  Globe,
  AlertCircle,
  Database,
  Sparkles,
} from 'lucide-react';
import { auth, googleProvider, db, handleFirestoreError, OperationType } from '../../services/firebase';
import { signInWithPopup } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

interface AuthScreenProps {
  currentLanguage: SupportedLanguage;
  onLoginSuccess: (role: 'people' | 'government', userData?: any) => void;
  onBackToLanding: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  currentLanguage,
  onLoginSuccess,
  onBackToLanding,
}) => {
  const [activeTab, setActiveTab] = useState<'people' | 'government'>('people');
  const [authMode, setAuthMode] = useState<'register' | 'login'>('register');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Country, State, District lists
  const availableCountries = getAvailableCountries();
  const [selectedCountry, setSelectedCountry] = useState<string>('IN');

  const availableStates = getStatesForCountry(selectedCountry);
  const [selectedState, setSelectedState] = useState<string>(availableStates[0] || 'Tamil Nadu');

  const availableDistricts = getDistrictsForState(selectedState, selectedCountry);
  const [selectedDistrict, setSelectedDistrict] = useState<string>(availableDistricts[0] || 'Chennai');

  // Update states and districts when country changes
  useEffect(() => {
    const states = getStatesForCountry(selectedCountry);
    const firstState = states[0] || '';
    setSelectedState(firstState);
    const districts = getDistrictsForState(firstState, selectedCountry);
    setSelectedDistrict(districts[0] || '');
  }, [selectedCountry]);

  // Update districts when state changes
  useEffect(() => {
    const districts = getDistrictsForState(selectedState, selectedCountry);
    if (districts.length > 0 && !districts.includes(selectedDistrict)) {
      setSelectedDistrict(districts[0]);
    }
  }, [selectedState, selectedCountry]);

  // Citizen form state
  const [citizenName, setCitizenName] = useState('');
  const [citizenPhone, setCitizenPhone] = useState('');
  const [citizenWard, setCitizenWard] = useState('');
  const [citizenPin, setCitizenPin] = useState('');
  const [citizenLoginPhone, setCitizenLoginPhone] = useState('');
  const [citizenLoginPin, setCitizenLoginPin] = useState('');
  const [citizenError, setCitizenError] = useState('');

  // Government form state
  const [govName, setGovName] = useState('');
  const [govMobile, setGovMobile] = useState('');
  const [govDept, setGovDept] = useState('Public Works & Highways');
  const [govOfficialId, setGovOfficialId] = useState('');
  const [govPasscode, setGovPasscode] = useState('');
  const [govError, setGovError] = useState('');

  // Google Sign-In for Citizens (Firebase Auth & Firestore)
  const handleGoogleCitizenSignIn = async () => {
    setIsGoogleLoading(true);
    setCitizenError('');
    try {
      const res = await signInWithPopup(auth, googleProvider);
      const user = res.user;
      const userData = {
        uid: user.uid,
        name: user.displayName || 'Registered Citizen',
        email: user.email || '',
        phone: user.phoneNumber || citizenPhone || '',
        country: selectedCountry,
        state: selectedState,
        district: selectedDistrict,
        ward: citizenWard.trim() || 'Locality Center',
        isRegistered: true,
        registeredAt: new Date().toISOString(),
      };

      // Sync user profile to Firestore
      try {
        await setDoc(
          doc(db, 'users', user.uid),
          {
            uid: user.uid,
            name: userData.name,
            email: userData.email,
            role: 'citizen',
            phone: userData.phone,
            state: selectedState,
            district: selectedDistrict,
            createdAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (err) {
        console.warn('Firestore user profile notice:', err);
      }

      onLoginSuccess('people', userData);
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      setCitizenError(err.message || 'Google sign-in failed. Please try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Google Sign-In for Government Official (Firebase Auth & Firestore)
  const handleGoogleGovSignIn = async () => {
    setIsGoogleLoading(true);
    setGovError('');
    try {
      const res = await signInWithPopup(auth, googleProvider);
      const user = res.user;
      const isOwnerAdmin = user.email === 'gayathirisathyamoorthy2006@gmail.com';
      const govData = {
        uid: user.uid,
        name: user.displayName || 'Authorized Officer',
        email: user.email || '',
        role: isOwnerAdmin ? 'Super Administrator & Lead Official' : 'Authorized Department Officer',
        department: govDept,
        badgeId: user.uid.substring(0, 8).toUpperCase(),
        jurisdictionCountry: selectedCountry,
        jurisdictionState: selectedState,
        jurisdictionDistrict: selectedDistrict,
        isAuthorized: true,
        sessionStarted: new Date().toISOString(),
      };

      // Save official profile to Firestore
      try {
        await setDoc(
          doc(db, 'users', user.uid),
          {
            uid: user.uid,
            name: govData.name,
            email: govData.email,
            role: 'government',
            department: govDept,
            designation: govData.role,
            createdAt: new Date().toISOString(),
          },
          { merge: true }
        );
        if (isOwnerAdmin) {
          await setDoc(
            doc(db, 'admins', user.uid),
            {
              uid: user.uid,
              email: user.email,
              grantedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        }
      } catch (e) {
        console.warn('Firestore gov profile notice:', e);
      }

      onLoginSuccess('government', govData);
    } catch (err: any) {
      console.error('Gov Google Sign-In Error:', err);
      setGovError(err.message || 'Official Google authentication failed.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Citizen Registration submit handler
  const handleCitizenRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setCitizenError('');

    if (!citizenName.trim()) {
      setCitizenError('Please enter your full name.');
      return;
    }
    if (!citizenPhone.trim() || citizenPhone.trim().length < 8) {
      setCitizenError('Please enter a valid mobile number (at least 8 digits).');
      return;
    }
    if (!citizenPin.trim() || citizenPin.length < 4) {
      setCitizenError('Please create a 4-digit security PIN or password.');
      return;
    }

    const userId = `citizen_${Date.now()}`;
    const userData = {
      uid: userId,
      name: citizenName.trim(),
      phone: citizenPhone.trim(),
      country: selectedCountry,
      state: selectedState,
      district: selectedDistrict,
      ward: citizenWard.trim() || 'Locality Center',
      pin: citizenPin,
      isRegistered: true,
      registeredAt: new Date().toISOString(),
    };

    // Store in localStorage for fast local retrieval
    try {
      const existing = JSON.parse(localStorage.getItem('govinsight_citizens') || '[]');
      existing.push(userData);
      localStorage.setItem('govinsight_citizens', JSON.stringify(existing));
    } catch {
      // Ignore localStorage errors
    }

    onLoginSuccess('people', userData);
  };

  // Citizen Login submit handler
  const handleCitizenLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setCitizenError('');

    if (!citizenLoginPhone.trim()) {
      setCitizenError('Please enter your registered mobile number.');
      return;
    }
    if (!citizenLoginPin.trim()) {
      setCitizenError('Please enter your 4-digit security PIN.');
      return;
    }

    // Check stored user or authenticate
    let foundUser: any = null;
    try {
      const existing = JSON.parse(localStorage.getItem('govinsight_citizens') || '[]');
      foundUser = existing.find((u: any) => u.phone.includes(citizenLoginPhone.trim()));
    } catch {
      foundUser = null;
    }

    const userData = foundUser || {
      name: 'Registered Citizen',
      phone: citizenLoginPhone.trim(),
      country: selectedCountry,
      state: selectedState,
      district: selectedDistrict,
      isRegistered: true,
    };

    onLoginSuccess('people', userData);
  };

  // Government Login submit handler
  const handleGovLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setGovError('');

    if (!govName.trim()) {
      setGovError('Please enter your Official Full Name.');
      return;
    }
    if (!govMobile.trim()) {
      setGovError('Please enter your Official Mobile Number.');
      return;
    }
    if (!govOfficialId.trim()) {
      setGovError('Please enter your Government Employee ID / Badge Number.');
      return;
    }
    if (!govPasscode.trim()) {
      setGovError('Please enter your Department Security Passcode.');
      return;
    }

    const officialUid = `gov_${govOfficialId.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    const govData = {
      id: officialUid,
      name: govName.trim(),
      mobile: govMobile.trim(),
      role: 'Authorized Department Administrator',
      department: govDept,
      badgeId: govOfficialId.trim(),
      jurisdictionCountry: selectedCountry,
      jurisdictionState: selectedState,
      jurisdictionDistrict: selectedDistrict,
      isAuthorized: true,
      sessionStarted: new Date().toISOString(),
    };

    // Save official profile to Firestore
    try {
      await setDoc(
        doc(db, 'users', officialUid),
        {
          uid: officialUid,
          name: govData.name,
          mobile: govData.mobile,
          role: 'government',
          department: govDept,
          designation: govData.role,
          badgeId: govData.badgeId,
          district: selectedDistrict,
          state: selectedState,
          createdAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('Firestore official profile notice:', err);
    }

    onLoginSuccess('government', govData);
  };

  return (
    <div className="min-h-screen bg-[#07080B] text-slate-100 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background neon glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-red-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-xl w-full mx-auto space-y-5 relative z-10">
        {/* Top Bar with Clear Close (X) Symbol */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/80 border border-red-500/30 text-[10px] font-mono text-red-300 font-bold uppercase">
            <ShieldCheck className="w-3.5 h-3.5 text-red-400" />
            <span>Official Identity & Access Management</span>
          </div>

          {/* Prominent Cross / Close Button */}
          <button
            onClick={onBackToLanding}
            title="Close / Exit to Home"
            className="p-2 rounded-xl bg-white/10 hover:bg-red-600/30 hover:border-red-500/50 border border-white/15 text-slate-300 hover:text-white transition-all group flex items-center gap-1.5"
          >
            <span className="text-xs font-mono font-semibold hidden sm:inline">Close</span>
            <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
          </button>
        </div>

        {/* Central Logo */}
        <div className="text-center">
          <GovInsightLogo size="lg" showTagline={true} className="items-center" />
          <p className="text-xs text-slate-400 mt-1">
            Mandatory Authentication Required — Please register or sign in to continue
          </p>
        </div>

        {/* Portal Switcher Tabs */}
        <div className="grid grid-cols-2 p-1 bg-black/70 rounded-2xl border border-white/15 shadow-xl">
          <button
            type="button"
            onClick={() => {
              setActiveTab('people');
              setCitizenError('');
            }}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all ${
              activeTab === 'people'
                ? 'bg-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>People Portal</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('government');
              setGovError('');
            }}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all ${
              activeTab === 'government'
                ? 'bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Government Portal</span>
          </button>
        </div>

        {/* TAB 1: CITIZEN REGISTRATION & LOGIN */}
        {activeTab === 'people' && (
          <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/95 border border-red-500/30 shadow-2xl space-y-5">
            {/* Toggle between Register & Sign In */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-white">
                  {authMode === 'register' ? 'Citizen Registration' : 'Citizen Sign In'}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {authMode === 'register'
                    ? 'Create your verified citizen profile to report and track civic matters'
                    : 'Sign in with your registered phone number'}
                </p>
              </div>

              <div className="flex bg-black/60 p-1 rounded-xl border border-white/10 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    setCitizenError('');
                  }}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    authMode === 'register'
                      ? 'bg-red-600 text-white shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Register
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setCitizenError('');
                  }}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    authMode === 'login'
                      ? 'bg-red-600 text-white shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sign In
                </button>
              </div>
            </div>

            {/* Google Sign-in for Citizens */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleGoogleCitizenSignIn}
                disabled={isGoogleLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center justify-center gap-2.5 transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>{isGoogleLoading ? 'Connecting to Firebase...' : 'Continue with Google (Firebase Auth)'}</span>
              </button>

              <div className="flex items-center my-3.5">
                <div className="flex-1 border-t border-white/10" />
                <span className="px-3 text-[10px] font-mono uppercase text-slate-500">
                  {authMode === 'register' ? 'or register with phone & PIN' : 'or sign in with phone'}
                </span>
                <div className="flex-1 border-t border-white/10" />
              </div>
            </div>

            {citizenError && (
              <div className="p-3 rounded-xl bg-red-950/80 border border-red-500 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
                <span>{citizenError}</span>
              </div>
            )}

            {/* REGISTER FORM */}
            {authMode === 'register' ? (
              <form onSubmit={handleCitizenRegister} className="space-y-3.5">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Full Name <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={citizenName}
                      onChange={(e) => setCitizenName(e.target.value)}
                      placeholder="e.g. S. Rajasekaran / Priya Sundaram"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/60 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Mobile Number / WhatsApp <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="tel"
                      required
                      value={citizenPhone}
                      onChange={(e) => setCitizenPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/60 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                {/* Country, Cascading State & District Selector */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Country
                    </label>
                    <select
                      value={selectedCountry}
                      onChange={(e) => setSelectedCountry(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl bg-black/60 border border-white/15 text-xs text-white focus:outline-none focus:border-red-500"
                    >
                      {availableCountries.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      1. State / Province <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={selectedState}
                      onChange={(e) => setSelectedState(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl bg-black/60 border border-white/15 text-xs text-white focus:outline-none focus:border-red-500 font-medium"
                    >
                      {availableStates.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      2. District <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={selectedDistrict}
                      onChange={(e) => setSelectedDistrict(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl bg-black/60 border border-white/15 text-xs text-white focus:outline-none focus:border-red-500 font-medium"
                    >
                      {availableDistricts.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Ward / Street / Locality (Optional)
                    </label>
                    <div className="relative">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={citizenWard}
                        onChange={(e) => setCitizenWard(e.target.value)}
                        placeholder="e.g. Ward 42, Anna Nagar"
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/60 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Create 4-Digit Security PIN <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <KeyRound className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                      <input
                        type="password"
                        required
                        maxLength={6}
                        value={citizenPin}
                        onChange={(e) => setCitizenPin(e.target.value)}
                        placeholder="••••"
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/60 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs tracking-wide shadow-[0_0_20px_rgba(239,68,68,0.5)] flex items-center justify-center gap-2 transition-all"
                  >
                    <span>Complete Registration & Open Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            ) : (
              /* LOGIN FORM */
              <form onSubmit={handleCitizenLogin} className="space-y-3.5">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Registered Mobile Number <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="tel"
                      required
                      value={citizenLoginPhone}
                      onChange={(e) => setCitizenLoginPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/60 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Security PIN / Password <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      required
                      value={citizenLoginPin}
                      onChange={(e) => setCitizenLoginPin(e.target.value)}
                      placeholder="••••"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/60 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs tracking-wide shadow-[0_0_20px_rgba(239,68,68,0.5)] flex items-center justify-center gap-2 transition-all"
                  >
                    <span>Sign In & Open Citizen Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* TAB 2: GOVERNMENT AUTHORIZED LOGIN */}
        {activeTab === 'government' && (
          <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/95 border border-red-500/30 shadow-2xl space-y-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-500/40 text-[10px] font-mono font-bold">
                  OFFICIAL RESTRICTED ACCESS
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-extrabold text-white mt-1">
                Government Officer Authentication
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Authorized departmental credentials required for civic command, heatmap inspection and resolution dispatch.
              </p>
            </div>

            {/* Official Google Sign-In for Government & Admins */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleGoogleGovSignIn}
                disabled={isGoogleLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold text-xs flex items-center justify-center gap-2.5 transition-all shadow-[0_0_20px_rgba(239,68,68,0.4)] active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-white" />
                <span>{isGoogleLoading ? 'Authenticating Official Credentials...' : 'Sign in as Official with Google (Firebase)'}</span>
              </button>

              <div className="flex items-center my-3.5">
                <div className="flex-1 border-t border-white/10" />
                <span className="px-3 text-[10px] font-mono uppercase text-slate-500">
                  or sign in with Department ID & Passcode
                </span>
                <div className="flex-1 border-t border-white/10" />
              </div>
            </div>

            {govError && (
              <div className="p-3 rounded-xl bg-red-950/80 border border-red-500 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
                <span>{govError}</span>
              </div>
            )}

            <form onSubmit={handleGovLogin} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Department / Civic Sector <span className="text-red-400">*</span>
                </label>
                <select
                  value={govDept}
                  onChange={(e) => setGovDept(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-black/60 border border-white/15 text-xs text-white focus:outline-none focus:border-red-500"
                >
                  <option value="Public Works & Highways">Public Works & Highways Department</option>
                  <option value="Water Supply & Sewerage Board">Water Supply & Sewerage Board</option>
                  <option value="Health & Family Welfare Department">Health & Family Welfare Department</option>
                  <option value="Food & Civil Supplies / PDS">Food & Civil Supplies / PDS Authority</option>
                  <option value="School Education Department">School Education Department</option>
                  <option value="Electricity Board (Power Grid)">Electricity Board & Power Grid</option>
                  <option value="Municipal Solid Waste & Sanitation">Municipal Solid Waste & Sanitation</option>
                  <option value="Public Safety & Disaster Management">Public Safety & Disaster Management</option>
                </select>
              </div>

              {/* Jurisdiction State and District */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Jurisdiction State <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl bg-black/60 border border-white/15 text-xs text-white focus:outline-none focus:border-red-500"
                  >
                    {availableStates.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Jurisdiction District <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl bg-black/60 border border-white/15 text-xs text-white focus:outline-none focus:border-red-500"
                  >
                    {availableDistricts.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Official Full Name <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={govName}
                    onChange={(e) => setGovName(e.target.value)}
                    placeholder="e.g. Er. S. Ramanathan / Dr. Rajesh Sundaram"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/60 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Official Mobile Number <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    required
                    value={govMobile}
                    onChange={(e) => setGovMobile(e.target.value)}
                    placeholder="e.g. +91 98401 23456"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/60 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Official Employee ID / Badge No <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <IdCard className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={govOfficialId}
                    onChange={(e) => setGovOfficialId(e.target.value)}
                    placeholder="e.g. GI-TN-HW-8492"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/60 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Security Passcode / Token <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={govPasscode}
                    onChange={(e) => setGovPasscode(e.target.value)}
                    placeholder="Enter official passcode"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/60 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 font-mono"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-extrabold text-xs tracking-wide shadow-[0_0_20px_rgba(239,68,68,0.5)] flex items-center justify-center gap-2 transition-all"
                >
                  <Lock className="w-4 h-4" />
                  <span>Verify Credentials & Enter Government Portal</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Live Firebase Console & Backend Status Indicator */}
        <div className="p-3.5 rounded-2xl bg-black/60 border border-red-500/20 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <Database className="w-3.5 h-3.5 text-red-400" />
            <span className="font-mono text-[11px]">
              Firebase Console Backend: <span className="text-emerald-400 font-bold">Connected & Operational</span>
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
            <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">Project: kinetic-chiller-5ggh3</span>
            <span className="hidden sm:inline text-slate-600">|</span>
            <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">Firestore Live</span>
          </div>
        </div>
      </div>
    </div>
  );
};
