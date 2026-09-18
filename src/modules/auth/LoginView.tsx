import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, getFirstAccessibleRoute } from './AuthContext';
import { useTranslation } from 'react-i18next';
import { getUsers, updateRawUserPin } from '../../data/index';
import { verifyPin } from '../../lib/security';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  MapPin,
  Phone,
  Globe,
  BarChart2,
  FileText,
  ShieldCheck,
  Leaf,
  Loader2,
  Shield,
  Download,
} from 'lucide-react';
import { PrivacyPolicyModal } from '../../components/PrivacyPolicyModal';
import { DownloadAppsModal } from '../../components/DownloadAppsModal';

export const LoginView: React.FC = () => {
  const { login, resetPin } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Disable page scrollbars on login screen
  useEffect(() => {
    document.documentElement.classList.add('login-active');
    document.body.classList.add('login-active');
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    return () => {
      document.documentElement.classList.remove('login-active');
      document.body.classList.remove('login-active');
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, []);

  // Mode: 'login' | 'forgot_step_1' | 'forgot_step_2' | 'forgot_step_3' | 'force_reset_pin'
  const [mode, setMode] = useState<
    'login' | 'forgot_step_1' | 'forgot_step_2' | 'forgot_step_3' | 'force_reset_pin'
  >('login');

  // Form States
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forgot / Force Password States
  const [forgotUser, setForgotUser] = useState<any>(null);
  const [contactInput, setContactInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [newPin, setNewPin] = useState('');
  const [resetError, setResetError] = useState('');
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isDownloadAppsOpen, setIsDownloadAppsOpen] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!username || !pin) {
      setLoginError('Username and Password/PIN are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const users = getUsers();
      const cleanUser = username.trim().toLowerCase();
      const cleanPin = pin.trim();

      const found = users.find(u => {
        const uName = u.username.toLowerCase();
        const matchName =
          uName === cleanUser ||
          (cleanUser === 'shop' && (uName === 'shopper' || u.role === 'Shopper')) ||
          (cleanUser === 'pulper' && (uName === 'pulper' || u.role === 'LabOperator'));
        return matchName && verifyPin(cleanPin, u.pin);
      });

      if (found) {
        if (found.active === false) {
          setLoginError(t('login.invalid_credentials'));
          setIsSubmitting(false);
          return;
        }
        if (found.needsPinReset) {
          setForgotUser(found);
          setNewPin('');
          setResetError('');
          setMode('force_reset_pin');
        } else {
          const success = await login(username, pin);
          if (success) {
            navigate(getFirstAccessibleRoute(found));
          } else {
            setLoginError(t('login.invalid_credentials'));
          }
        }
      } else {
        await login(username, pin);
        setLoginError(t('login.invalid_credentials'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForceResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');

    if (!newPin.trim()) {
      setResetError('New PIN is required');
      return;
    }

    if (newPin.length !== 4 || isNaN(Number(newPin))) {
      setResetError('PIN must be exactly 4 digits');
      return;
    }

    if (newPin === pin) {
      setResetError('New PIN cannot be the same as current temporary PIN.');
      return;
    }

    const success = updateRawUserPin(forgotUser.username, newPin);
    if (success) {
      const loggedIn = await login(forgotUser.username, newPin);
      if (loggedIn) {
        navigate(getFirstAccessibleRoute(forgotUser));
      } else {
        setResetError('Error logging in. Please try again.');
      }
    } else {
      setResetError('Error updating PIN');
    }
  };

  const handleForgotStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');

    if (!contactInput.trim()) {
      setResetError('Email or registered mobile number is required');
      return;
    }

    const users = getUsers();
    const found = users.find(
      u =>
        (u.email && u.email.toLowerCase() === contactInput.trim().toLowerCase()) ||
        (u.phone && u.phone.replace(/\s+/g, '') === contactInput.trim().replace(/\s+/g, ''))
    );

    if (found) {
      const otp = String(Math.floor(100000 + Math.random() * 900000));
      setGeneratedOtp(otp);
      setForgotUser(found);
      setOtpInput('');
      setNewPin('');
      setMode('forgot_step_2');
    } else {
      setResetError('No account found with this email or phone number.');
    }
  };

  const handleOtpVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');

    if (otpInput.trim() !== generatedOtp) {
      setResetError('Invalid 6-digit OTP code. Please try again.');
      return;
    }

    setResetError('');
    setMode('forgot_step_3');
  };

  const handleNewPinSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');

    if (!newPin.trim()) {
      setResetError('New PIN is required');
      return;
    }

    if (newPin.length !== 4 || isNaN(Number(newPin))) {
      setResetError('PIN must be exactly 4 digits');
      return;
    }

    const success = await resetPin(forgotUser.username, newPin);
    if (success) {
      navigate(getFirstAccessibleRoute(forgotUser));
    } else {
      setResetError('Failed to reset PIN. Please try again.');
    }
  };

  const logoUrl = `${import.meta.env.BASE_URL}logo.png`;
  const warehouseBgUrl = `${import.meta.env.BASE_URL}login_paper_rolls_bg.jpg`;

  return (
    <div className="login-page-container fixed inset-0 h-screen h-[100dvh] w-screen w-full bg-[#EFEFFD] flex items-center justify-center p-0 lg:p-4 xl:p-8 font-sans z-50 overflow-hidden select-none">
      
      {/* =========================================================================
          DESKTOP VIEW (EXACT MATCH TO LAPTOP MOCKUP IN REFERENCE IMAGE)
          ========================================================================= */}
      <div className="hidden lg:flex w-full max-w-[1400px] h-[90vh] max-h-[860px] bg-white rounded-[36px] shadow-[0_25px_70px_rgba(94,59,232,0.14)] overflow-hidden relative border border-[#E5E3FB]">
        
        {/* Left Branding & Content Area */}
        <div className="w-[52%] xl:w-[50%] h-full p-8 xl:p-12 2xl:p-14 flex flex-col justify-between relative z-10 bg-gradient-to-br from-white via-[#FCFBFF] to-[#F5F3FF]">
          
          {/* Top Logo */}
          <div>
            <img
              src={logoUrl}
              alt="Saheb Paper Pvt. Ltd."
              className="h-14 xl:h-16 w-auto object-contain drop-shadow-xs"
            />
          </div>

          {/* Main Headline & Description */}
          <div className="space-y-4 xl:space-y-5 my-auto max-w-[500px]">
            <h1 className="text-3xl xl:text-4xl 2xl:text-[44px] font-black text-[#1E1B4B] leading-[1.12] tracking-tight font-heading">
              Efficient<br />
              Paper Management<br />
              <span className="text-[#5E3BE8]">for a Brighter</span><br />
              <span className="text-[#5E3BE8]">Tomorrow</span>
            </h1>

            <p className="text-xs xl:text-sm text-slate-500 font-medium leading-relaxed">
              Streamline your operations, track production, manage inventory and empower your business
              with Saheb Paper's smart management system.
            </p>

            {/* 3 Feature Pills / Badges */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-white border border-[#EAE7FA] shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-[#F0EEFF] text-[#5E3BE8] flex items-center justify-center mb-2">
                  <BarChart2 className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-[#1E1B4B] leading-tight">
                  Real-time<br />Tracking
                </span>
              </div>

              <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-white border border-[#EAE7FA] shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-[#F0EEFF] text-[#5E3BE8] flex items-center justify-center mb-2">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-[#1E1B4B] leading-tight">
                  Better<br />Productivity
                </span>
              </div>

              <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-white border border-[#EAE7FA] shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-[#F0EEFF] text-[#5E3BE8] flex items-center justify-center mb-2">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-[#1E1B4B] leading-tight">
                  Secure<br />&amp; Reliable
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Handwritten Script Accent */}
          <div className="pt-2">
            <div
              className="text-3xl xl:text-4xl text-[#5E3BE8] font-bold select-none"
              style={{ fontFamily: "'Caveat', 'Dancing Script', cursive, sans-serif" }}
            >
              Grow with Paper
            </div>
            <div className="w-20 h-0.5 bg-[#5E3BE8] rounded-full mt-1 ml-1"></div>
          </div>
        </div>

        {/* Right Area: Warehouse Image Background + Floating Login Card */}
        <div className="w-[48%] xl:w-[50%] h-full relative flex items-center justify-center p-6 xl:p-10 overflow-hidden">
          
          {/* Background Warehouse Photo with Subtle Purple Glass Tint */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${warehouseBgUrl})` }}
          >
            {/* Soft periwinkle gradient overlay & organic curves */}
            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/40 to-transparent" />
            <div className="absolute inset-0 bg-[#5E3BE8]/10 backdrop-blur-[0.5px]" />
          </div>

          {/* Top Left Download Apps Button */}
          <div className="absolute top-8 left-10 z-20">
            <button
              type="button"
              onClick={() => setIsDownloadAppsOpen(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 hover:bg-white text-[#5E3BE8] text-xs font-bold border border-[#E2E0F8] shadow-xs hover:shadow-md transition cursor-pointer backdrop-blur-xs active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-[#5E3BE8]" />
              <span>Download Apps</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-[#F0EEFF] text-[#5E3BE8] rounded-full font-bold">.exe / .apk</span>
            </button>
          </div>

          {/* Top Right Slogan */}
          <div className="absolute top-8 right-10 text-right z-10 select-none">
            <div className="text-xs font-semibold text-slate-600 tracking-wide">Turning Paper</div>
            <div className="text-xs font-bold text-[#5E3BE8] tracking-wide">Into Possibilities</div>
            <div className="w-10 h-0.5 bg-[#5E3BE8] rounded-full mt-1.5 ml-auto"></div>
          </div>

          {/* Bottom Right Slogan */}
          <div className="absolute bottom-8 right-10 flex items-center gap-2 z-10 select-none text-right">
            <div>
              <div className="text-[11px] font-black tracking-wider text-[#1E1B4B]">PAPER</div>
              <div className="text-[9px] font-bold tracking-widest text-[#5E3BE8]">FOR A BETTER TOMORROW</div>
            </div>
            <Leaf className="w-4 h-4 text-emerald-600 shrink-0" />
          </div>

          {/* Floating White Login Card */}
          <div className="w-full max-w-[400px] xl:max-w-[420px] bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(94,59,232,0.22)] p-7 xl:p-8 border border-white/80 relative z-20">
            
            {/* Card Header */}
            <div className="flex items-start justify-between mb-5">
              <div>
                <span className="text-xs font-extrabold text-[#5E3BE8] tracking-wider uppercase">
                  Welcome Back
                </span>
                <h2 className="text-base xl:text-lg font-black text-[#1E1B4B] tracking-tight mt-0.5">
                  SAHEB PAPER PVT. LTD.
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Paper Mill Management System
                </p>
              </div>

              <div className="w-11 h-11 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-center p-1 shrink-0">
                <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
              </div>
            </div>

            {/* Main Form Mode */}
            {mode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                {loginError && (
                  <div className="p-2.5 bg-red-50 text-red-600 text-xs rounded-xl border border-red-200 text-center font-semibold">
                    {loginError}
                  </div>
                )}

                {/* Username Pill Input */}
                <div className="relative flex items-center">
                  <User className="w-4 h-4 text-[#5E3BE8] absolute left-4.5 pointer-events-none" />
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-[#F8F8FD] border border-[#E2E0F8] focus:border-[#5E3BE8] focus:bg-white rounded-full text-xs xl:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5E3BE8]/20 transition"
                    placeholder="Username"
                    autoComplete="username"
                  />
                </div>

                {/* Password Pill Input */}
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-[#5E3BE8] absolute left-4.5 pointer-events-none" />
                  <input
                    type={showPin ? 'text' : 'password'}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={pin}
                    onChange={e => setPin(e.target.value)}
                    className="w-full pl-11 pr-11 py-3 bg-[#F8F8FD] border border-[#E2E0F8] focus:border-[#5E3BE8] focus:bg-white rounded-full text-xs xl:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5E3BE8]/20 tracking-wider transition"
                    placeholder="Password / PIN"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-4 text-slate-400 hover:text-slate-600 transition cursor-pointer p-1"
                    title={showPin ? 'Hide Password' : 'Show Password'}
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Forgot Password Link */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setMode('forgot_step_1')}
                    className="text-[#5E3BE8] hover:text-[#4A28D1] text-xs font-bold transition cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>

                {/* Submit Login Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-[#5E3BE8] to-[#4E27E0] hover:from-[#522fd6] hover:to-[#431fc9] text-white font-bold text-sm tracking-wide shadow-lg shadow-[#5E3BE8]/25 hover:shadow-[#5E3BE8]/35 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <>
                      <span>Login</span>
                      <ArrowRight className="w-4 h-4 text-white" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Forgot Password Step 1: Input Mobile/Email */}
            {mode === 'forgot_step_1' && (
              <form onSubmit={handleForgotStep1Submit} className="space-y-3">
                <div className="text-center pb-1">
                  <h3 className="text-sm font-bold text-[#1E1B4B]">Forgot Password / PIN</h3>
                  <p className="text-[11px] text-slate-500">Enter your registered email or phone</p>
                </div>

                {resetError && (
                  <div className="p-2 bg-red-50 text-red-600 text-xs rounded-xl border border-red-200 text-center font-medium">
                    {resetError}
                  </div>
                )}

                <input
                  type="text"
                  value={contactInput}
                  onChange={e => setContactInput(e.target.value)}
                  placeholder="Email or Mobile Number"
                  className="w-full px-4 py-2.5 bg-[#F8F8FD] border border-[#E2E0F8] focus:border-[#5E3BE8] focus:bg-white rounded-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
                />

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="w-1/2 py-2.5 rounded-full border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-2.5 rounded-full bg-[#5E3BE8] text-white text-xs font-bold hover:bg-[#4E27E0]"
                  >
                    Send OTP
                  </button>
                </div>
              </form>
            )}

            {/* Forgot Password Step 2: Verify OTP */}
            {mode === 'forgot_step_2' && (
              <form onSubmit={handleOtpVerifySubmit} className="space-y-3">
                <div className="text-center pb-1">
                  <h3 className="text-sm font-bold text-[#1E1B4B]">Verify 6-Digit OTP</h3>
                  <p className="text-[11px] text-slate-500">
                    OTP sent (Verification Code: <span className="font-mono font-bold text-[#5E3BE8]">{generatedOtp}</span>)
                  </p>
                </div>

                {resetError && (
                  <div className="p-2 bg-red-50 text-red-600 text-xs rounded-xl border border-red-200 text-center font-medium">
                    {resetError}
                  </div>
                )}

                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={otpInput}
                  onChange={e => setOtpInput(e.target.value)}
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
                  className="w-full text-center tracking-widest font-mono text-sm px-4 py-2.5 bg-[#F8F8FD] border border-[#E2E0F8] focus:border-[#5E3BE8] rounded-full"
                />

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setMode('forgot_step_1')}
                    className="w-1/2 py-2.5 rounded-full border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-2.5 rounded-full bg-[#5E3BE8] text-white text-xs font-bold hover:bg-[#4E27E0]"
                  >
                    Verify OTP
                  </button>
                </div>
              </form>
            )}

            {/* Forgot Password Step 3: Enter New 4-Digit PIN */}
            {(mode === 'forgot_step_3' || mode === 'force_reset_pin') && (
              <form
                onSubmit={mode === 'force_reset_pin' ? handleForceResetSubmit : handleNewPinSaveSubmit}
                className="space-y-3"
              >
                <div className="text-center pb-1">
                  <h3 className="text-sm font-bold text-[#1E1B4B]">Create New 4-Digit PIN</h3>
                  <p className="text-[11px] text-slate-500">Enter a secure 4-digit PIN for your account</p>
                </div>

                {resetError && (
                  <div className="p-2 bg-red-50 text-red-600 text-xs rounded-xl border border-red-200 text-center font-medium">
                    {resetError}
                  </div>
                )}

                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={newPin}
                  onChange={e => setNewPin(e.target.value)}
                  maxLength={4}
                  placeholder="4-digit PIN"
                  className="w-full text-center tracking-widest font-mono text-sm px-4 py-2.5 bg-[#F8F8FD] border border-[#E2E0F8] focus:border-[#5E3BE8] rounded-full"
                />

                <div className="flex gap-2 pt-1">
                  {mode !== 'force_reset_pin' && (
                    <button
                      type="button"
                      onClick={() => setMode('forgot_step_2')}
                      className="w-1/2 py-2.5 rounded-full border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                    >
                      Back
                    </button>
                  )}
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-full bg-[#5E3BE8] text-white text-xs font-bold hover:bg-[#4E27E0]"
                  >
                    Save &amp; Login
                  </button>
                </div>
              </form>
            )}

            {/* Card Footer: Address & Contacts */}
            <div className="mt-6 pt-4 border-t border-slate-100 text-center space-y-1.5 text-slate-500 text-[10px] xl:text-[11px]">
              <a
                href="https://maps.app.goo.gl/fvPzeoVKC9BTmmYH6"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 font-medium hover:text-[#5E3BE8] transition cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 text-[#5E3BE8] shrink-0" />
                <span>Chandsar, Palanpur, Gujarat - 385510</span>
              </a>
              <div className="flex items-center justify-center gap-2 font-medium flex-wrap">
                <a
                  href="tel:+918000563666"
                  className="flex items-center gap-1 hover:text-[#5E3BE8] transition cursor-pointer"
                >
                  <Phone className="w-3.5 h-3.5 text-[#5E3BE8] shrink-0" />
                  <span>+91 80005 63666</span>
                </a>
                <a
                  href="https://www.sahebpaper.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-[#5E3BE8] transition cursor-pointer"
                >
                  <Globe className="w-3.5 h-3.5 text-[#5E3BE8] shrink-0" />
                  <span>www.sahebpaper.com</span>
                </a>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => setIsPrivacyModalOpen(true)}
                  className="flex items-center gap-1 hover:text-[#5E3BE8] transition cursor-pointer text-[#5E3BE8] font-bold"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Privacy Policy</span>
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => setIsDownloadAppsOpen(true)}
                  className="flex items-center gap-1 hover:text-[#5E3BE8] transition cursor-pointer text-[#5E3BE8] font-bold"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Apps</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* =========================================================================
          MOBILE VIEW (EXACT MATCH TO SMARTPHONE MOCKUP IN REFERENCE IMAGE)
          ========================================================================= */}
      <div className="lg:hidden w-full h-full min-h-screen min-h-[100dvh] flex flex-col justify-between bg-[#EFEFFD] overflow-y-auto no-scrollbar">
        
        {/* Top Hero Banner with Paper Rolls Graphic & Logo */}
        <div className="w-full relative pt-6 pb-4 px-5 text-center overflow-hidden">
          
          {/* Subtle Background warehouse photo with curved mask */}
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30 pointer-events-none"
            style={{ backgroundImage: `url(${warehouseBgUrl})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#EFEFFD]/60 via-[#EFEFFD]/90 to-[#EFEFFD]" />

          {/* Top Brand Bar */}
          <div className="relative z-10 flex items-center justify-between gap-2 max-w-[360px] mx-auto">
            <div className="flex-1 text-left flex items-center gap-2">
              <img src={logoUrl} alt="Logo" className="h-9 w-auto object-contain" />
              <button
                type="button"
                onClick={() => setIsDownloadAppsOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/95 text-[#5E3BE8] text-[10px] font-bold border border-[#E2E0F8] shadow-xs active:scale-95 cursor-pointer"
              >
                <Download className="w-3 h-3 text-[#5E3BE8]" />
                <span>App</span>
              </button>
            </div>
            <div className="flex items-center gap-1 text-right">
              <div>
                <div className="text-[9px] font-black tracking-wider text-[#1E1B4B]">PAPER</div>
                <div className="text-[7px] font-bold tracking-widest text-[#5E3BE8]">FOR A BETTER TOMORROW</div>
              </div>
              <Leaf className="w-3 h-3 text-emerald-600 shrink-0" />
            </div>
          </div>
        </div>

        {/* Mobile Login Card / Sheet */}
        <div className="w-full max-w-[380px] mx-auto px-4 my-auto relative z-10">
          <div className="bg-white rounded-3xl shadow-[0_15px_40px_rgba(94,59,232,0.16)] p-6 border border-white">
            
            {/* Card Header (Centered on Mobile) */}
            <div className="text-center mb-5">
              <span className="text-xs font-extrabold text-[#5E3BE8] tracking-wider uppercase">
                Welcome Back
              </span>
              <h2 className="text-base font-black text-[#1E1B4B] tracking-tight mt-0.5">
                SAHEB PAPER PVT. LTD.
              </h2>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Paper Mill Management System
              </p>
            </div>

            {/* Form */}
            {mode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                {loginError && (
                  <div className="p-2.5 bg-red-50 text-red-600 text-xs rounded-xl border border-red-200 text-center font-semibold">
                    {loginError}
                  </div>
                )}

                {/* Username Input */}
                <div className="relative flex items-center">
                  <User className="w-4 h-4 text-[#5E3BE8] absolute left-4 pointer-events-none" />
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#F8F8FD] border border-[#E2E0F8] focus:border-[#5E3BE8] focus:bg-white rounded-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
                    placeholder="Username"
                    autoComplete="username"
                  />
                </div>

                {/* Password Input */}
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-[#5E3BE8] absolute left-4 pointer-events-none" />
                  <input
                    type={showPin ? 'text' : 'password'}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={pin}
                    onChange={e => setPin(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-[#F8F8FD] border border-[#E2E0F8] focus:border-[#5E3BE8] focus:bg-white rounded-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none tracking-wider"
                    placeholder="Password / PIN"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3.5 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Forgot Password */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setMode('forgot_step_1')}
                    className="text-[#5E3BE8] text-[11px] font-bold"
                  >
                    Forgot Password?
                  </button>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-5 rounded-full bg-gradient-to-r from-[#5E3BE8] to-[#4E27E0] text-white font-bold text-xs tracking-wide shadow-md shadow-[#5E3BE8]/25 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <>
                      <span>Login</span>
                      <ArrowRight className="w-3.5 h-3.5 text-white" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Forgot Password Mobile */}
            {mode === 'forgot_step_1' && (
              <form onSubmit={handleForgotStep1Submit} className="space-y-3">
                <div className="text-center pb-1">
                  <h3 className="text-sm font-bold text-[#1E1B4B]">Forgot Password</h3>
                  <p className="text-[11px] text-slate-500">Enter registered email or phone</p>
                </div>
                {resetError && (
                  <div className="p-2 bg-red-50 text-red-600 text-xs rounded-xl border border-red-200 text-center font-medium">
                    {resetError}
                  </div>
                )}
                <input
                  type="text"
                  value={contactInput}
                  onChange={e => setContactInput(e.target.value)}
                  placeholder="Email or Mobile"
                  className="w-full px-4 py-2.5 bg-[#F8F8FD] border border-[#E2E0F8] rounded-full text-xs text-slate-800 focus:outline-none"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="w-1/2 py-2.5 rounded-full border border-slate-200 text-xs font-bold text-slate-600"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-2.5 rounded-full bg-[#5E3BE8] text-white text-xs font-bold"
                  >
                    Send OTP
                  </button>
                </div>
              </form>
            )}

            {mode === 'forgot_step_2' && (
              <form onSubmit={handleOtpVerifySubmit} className="space-y-3">
                <div className="text-center pb-1">
                  <h3 className="text-sm font-bold text-[#1E1B4B]">Verify OTP</h3>
                  <p className="text-[11px] text-slate-500">
                    Verification OTP: <span className="font-mono font-bold text-[#5E3BE8]">{generatedOtp}</span>
                  </p>
                </div>
                {resetError && (
                  <div className="p-2 bg-red-50 text-red-600 text-xs rounded-xl border border-red-200 text-center font-medium">
                    {resetError}
                  </div>
                )}
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={otpInput}
                  onChange={e => setOtpInput(e.target.value)}
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
                  className="w-full text-center tracking-widest font-mono text-sm px-4 py-2.5 bg-[#F8F8FD] border border-[#E2E0F8] rounded-full"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMode('forgot_step_1')}
                    className="w-1/2 py-2.5 rounded-full border border-slate-200 text-xs font-bold text-slate-600"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-2.5 rounded-full bg-[#5E3BE8] text-white text-xs font-bold"
                  >
                    Verify
                  </button>
                </div>
              </form>
            )}

            {(mode === 'forgot_step_3' || mode === 'force_reset_pin') && (
              <form
                onSubmit={mode === 'force_reset_pin' ? handleForceResetSubmit : handleNewPinSaveSubmit}
                className="space-y-3"
              >
                <div className="text-center pb-1">
                  <h3 className="text-sm font-bold text-[#1E1B4B]">New 4-Digit PIN</h3>
                  <p className="text-[11px] text-slate-500">Set a new personal PIN</p>
                </div>
                {resetError && (
                  <div className="p-2 bg-red-50 text-red-600 text-xs rounded-xl border border-red-200 text-center font-medium">
                    {resetError}
                  </div>
                )}
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={newPin}
                  onChange={e => setNewPin(e.target.value)}
                  maxLength={4}
                  placeholder="4-digit PIN"
                  className="w-full text-center tracking-widest font-mono text-sm px-4 py-2.5 bg-[#F8F8FD] border border-[#E2E0F8] rounded-full"
                />
                <div className="flex gap-2">
                  {mode !== 'force_reset_pin' && (
                    <button
                      type="button"
                      onClick={() => setMode('forgot_step_2')}
                      className="w-1/2 py-2.5 rounded-full border border-slate-200 text-xs font-bold text-slate-600"
                    >
                      Back
                    </button>
                  )}
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-full bg-[#5E3BE8] text-white text-xs font-bold"
                  >
                    Save &amp; Login
                  </button>
                </div>
              </form>
            )}

            {/* Contact Footer */}
            <div className="mt-5 pt-3.5 border-t border-slate-100 text-center space-y-1 text-slate-500 text-[10px]">
              <a
                href="https://maps.app.goo.gl/fvPzeoVKC9BTmmYH6"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1 font-medium hover:text-[#5E3BE8] transition cursor-pointer"
              >
                <MapPin className="w-3 h-3 text-[#5E3BE8] shrink-0" />
                <span>Chandsar, Palanpur, Gujarat - 385510</span>
              </a>
              <div className="flex items-center justify-center gap-1.5 font-medium flex-wrap">
                <a
                  href="tel:+918000563666"
                  className="flex items-center gap-0.5 hover:text-[#5E3BE8] transition cursor-pointer"
                >
                  <Phone className="w-3 h-3 text-[#5E3BE8] shrink-0" />
                  <span>+91 80005 63666</span>
                </a>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => setIsPrivacyModalOpen(true)}
                  className="flex items-center gap-0.5 hover:text-[#5E3BE8] transition cursor-pointer text-[#5E3BE8] font-bold"
                >
                  <Shield className="w-3 h-3" />
                  <span>Privacy Policy</span>
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => setIsDownloadAppsOpen(true)}
                  className="flex items-center gap-0.5 hover:text-[#5E3BE8] transition cursor-pointer text-[#5E3BE8] font-bold"
                >
                  <Download className="w-3 h-3" />
                  <span>Download App</span>
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Mobile Bottom Handwritten Accent */}
        <div className="w-full text-center py-4 relative z-10">
          <div
            className="text-2xl sm:text-3xl text-[#5E3BE8] font-bold select-none"
            style={{ fontFamily: "'Caveat', 'Dancing Script', cursive, sans-serif" }}
          >
            Grow with Paper
          </div>
        </div>

      </div>

      <PrivacyPolicyModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
      />

      <DownloadAppsModal
        isOpen={isDownloadAppsOpen}
        onClose={() => setIsDownloadAppsOpen(false)}
      />

    </div>
  );
};
