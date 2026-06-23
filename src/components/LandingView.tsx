import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Dumbbell, 
  Users, 
  Scale, 
  Apple, 
  Activity, 
  FileText, 
  Shield, 
  Sparkles, 
  Globe, 
  Languages, 
  ArrowRight,
  User,
  Mail,
  Lock,
  Building,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  Award
} from 'lucide-react';
import { signInCoachInFirebase, signUpCoachInFirebase, signInWithGoogleInFirebase } from '../storage/db';

interface LandingViewProps {
  lang: 'en' | 'ar';
  setLang: (lang: 'en' | 'ar') => void;
  onLoginSuccess: (coachProfile: any) => void;
  onExploreDemo: () => void;
}

export default function LandingView({
  lang,
  setLang,
  onLoginSuccess,
  onExploreDemo
}: LandingViewProps) {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  
  // Auth Form parameters
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [gymName, setGymName] = useState('');
  const [subscription, setSubscription] = useState('Elite');
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  // Handle default user account registration in localStorage
  useEffect(() => {
    const coaches = localStorage.getItem('reprise_coach_users');
    if (!coaches) {
      const defaultUsers = [
        {
          id: "coach_master",
          name: "David Al-Khalili",
          email: "munzerm50@gmail.com",
          password: "admin",
          gymName: "RepRise Elite HQ",
          subscription: "Elite"
        }
      ];
      localStorage.setItem('reprise_coach_users', JSON.stringify(defaultUsers));
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (!email || !password) {
      setErrorMsg(lang === 'en' ? 'Please fill in all fields' : 'يرجى ملء جميع الحقول أولاً');
      return;
    }

    setIsLoading(true);
    try {
      const user = await signInCoachInFirebase(email, password, lang);
      setSuccessMsg(lang === 'en' ? 'Login successful! Syncing cloud workspace...' : 'تم تسجيل الدخول بنجاح! جاري مزامنة بيانات لوحتك...');
      setTimeout(() => {
        onLoginSuccess(user);
      }, 1500);
    } catch (err: any) {
      console.error(err);
      const errMsg = err.message || (lang === 'en' ? 'Invalid email or password' : 'البريد الإلكتروني أو كلمة المرور غير صحيحة');
      setErrorMsg(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name || !email || !password || !gymName) {
      setErrorMsg(lang === 'en' ? 'Please fill in all fields' : 'يرجى تدوين كافة البيانات المطلوبة');
      return;
    }

    setIsLoading(true);
    try {
      const coach = await signUpCoachInFirebase(email, password, name, gymName, subscription);
      setSuccessMsg(lang === 'en' ? 'Registration complete! Welcome aboard coach!' : 'تم تسجيل حسابك كمدرب بنجاح! أهلاً بك!');
      setTimeout(() => {
        onLoginSuccess(coach);
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(lang === 'en' ? `Registration failed: ${err.message}` : `فشل التسجيل: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setIsLoading(true);
    try {
      const user = await signInWithGoogleInFirebase();
      setSuccessMsg(lang === 'en' ? 'Google Login successful! Syncing cloud workspace...' : 'تم تسجيل الدخول بحساب Google بنجاح! جاري المزامنة...');
      setTimeout(() => {
        onLoginSuccess(user);
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(lang === 'en' ? `Google Login failed: ${err.message || 'Error occurred'}` : `فشل تسجيل الدخول بحساب Google: ${err.message || 'حدث خطأ ما'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const autofillDefaultCredentials = () => {
    setEmail('munzerm50@gmail.com');
    setPassword('admin');
  };

  // Translations object specific to landing page
  const tLanding = {
    en: {
      heroTitle: "THE ULTIMATE WORKSPACE FOR ELITE FITNESS COACHES",
      heroSubtitle: "Scale your coaching business, deliver premium client reports, and create high-definition customized workout programs. Backed by absolute local speed & security.",
      getStarted: "Create Coach Account",
      signIn: "Sign In to Suite",
      exploreDemo: "Start Demo Workspace",
      trustedBy: "OFFLINE-FIRST HYBRID PERFORMANCE ENGINE",
      featureClients: "Elite Client Tracking",
      featureClientsDesc: "All personal profiles, body assessment variables, active states, and custom metrics in one solid repository.",
      featureWorkouts: "Scientific Workout Builder",
      featureWorkoutsDesc: "Design modular multi-weeks programs with precise tracking of sets, tempo, reps and targeted intensity (RPE/RIR).",
      featureInBody: "Segmental InBody Analysis",
      featureInBodyDesc: "Translate complex body composition stats, lean/fat regional segments with intelligent graphical monitoring.",
      featureNutrition: "Smart Macronutrients",
      featureNutritionDesc: "Precise custom calories & food ratios calculator coupled with interactive shopping list generation.",
      featureReports: "Fabulous PDF Reports",
      featureReportsDesc: "Download and print sleek custom coach-branded review packages to send to your clients instantly.",
      featureOffline: "100% Client-Side Privacy",
      featureOfflineDesc: "Your files never leave your device. Infinite local speed with local backup/import utilities built-in.",
      loginTitle: "Sign In as Active Coach",
      registerTitle: "Register Coach Account",
      coachName: "Coach Full Name",
      gymName: "Gym / Business Name",
      gymPlaceholder: "e.g. RepRise Premium HQ",
      subTier: "Subscription Tier",
      eliteTier: "Elite Level (Fully Unlocked)",
      proTier: "Pro Level (Standard)",
      autofillBtn: "Autofill Trial Credentials",
      loginFooter: "New to RepRise?",
      registerFooter: "Already have a workspace?",
      pricingTitle: "Designed for Professional Results",
      pricingSubtitle: "No servers, no telemetry, no subscription surprise. 100% yours to customize and operate.",
      email: "Email Address",
      password: "Password",
      loginBtn: "Access Coaching Suite",
      registerBtn: "Register & Setup Workspace"
    },
    ar: {
      heroTitle: "مجموعة الأدوات المتكاملة للمدربين المحترفين وأصحاب الهمم",
      heroSubtitle: "نمي أعمالك التدريبية، وقدم تقارير دورية مذهلة، وصمم برامج رياضية مخصصة وعلمية بدقة فائقة. مبني بعناية لسرعة وأمان محلي تام.",
      getStarted: "تأسيس حساب مدرب جديد",
      signIn: "تسجيل دخول كمدرب",
      exploreDemo: "استكشاف لوحة التحكم كضيوف",
      trustedBy: "منظومة إدارية محلية هجينة غير متصلة بالشبكة بالضرورة",
      featureClients: "إدارة المشتركين الاحترافية",
      featureClientsDesc: "تتبع وحفظ البيانات الشخصية، الإصابات، تقييم النوم ونمط المعيشة الشامل لكل مشترك بوضوح تام.",
      featureWorkouts: "مصمم البرامج والتمارين العلمي",
      featureWorkoutsDesc: "صمم خطط تفصيلية على مدار أسابيع متعددة مع حقول متكاملة لجولات التكرار، الرتم (تمبو)، والجهد المقترح.",
      featureInBody: "تحليل إن بادي المقطعي المتطور",
      featureInBodyDesc: "أدخل بيانات InBody وحللها بصرياً لتوزيع الكتلة العضلية والدهنية في الأطراف والجذع مع تفسير ذكي.",
      featureNutrition: "الماكروز وأنظمة التغذية المخصصة",
      featureNutritionDesc: "حاسبة ميكانيكية دقيقة لنسب الماكروز والسعرات مع منشئ ذكي لقائمة مشتريات البقالة لتسهيل التزام العميل.",
      featureReports: "تقارير الـ PDF الفاخرة",
      featureReportsDesc: "بنقرة واحدة، استخرج ملفات غلاف وتقارير أنيقة ومصممة بهويتك لإرسالها لأعضائك وتحفيزهم.",
      featureOffline: "بيانات محمية وحفظ محلي بنسبة 100%",
      featureOfflineDesc: "بياناتك وبيانات مشتركيك لا تغادر متصفحك مطلقاً. أعلى سرعة تخزين ذاتية مع خيارات تصدير الأرشيف.",
      loginTitle: "تسجيل الدخول للمنصة",
      registerTitle: "تسجيل مدرب جديد بالمنظومة",
      coachName: "الاسم الكامل للمدرب",
      gymName: "اسم النادي / العمل التجاري",
      gymPlaceholder: "مثال: ريب رايز هيد كوارترز للتدريب",
      subTier: "مستوى العضوية المستهدفة",
      eliteTier: "الباقة النخبوية (مفتوح بالكامل)",
      proTier: "باقة المحترفين الأساسية",
      autofillBtn: "تعبئة بيانات الحساب التجريبي",
      loginFooter: "ليس لديك حساب مدرب بعد؟",
      registerFooter: "هل قمت بالتسجيل سابقاً؟",
      pricingTitle: "مصمم خصيصاً لتحقيق نتائج مذهلة لعملائك",
      pricingSubtitle: "لا خوادم تتجسس، لا اشتراكات مفاجئة. المنظومة ملكك ومخزنة على جهازك للتحكم والتصدير.",
      email: "البريد الإلكتروني",
      password: "كلمة المرور",
      loginBtn: "دخول منصة التدريب الاحترافية",
      registerBtn: "تسجيل وتجهيز مساحة العمل"
    }
  };

  const currentT = tLanding[lang];

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col relative overflow-x-hidden selection:bg-[#FF4D00] selection:text-white" id="landing-master">
      {/* Visual background details */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-gradient-to-b from-[#FF4D00]/10 via-transparent to-transparent blur-3xl rounded-full opacity-60 pointer-events-none -z-10" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-neutral-900/30 blur-3xl rounded-full pointer-events-none -z-10" />

      {/* Top Navigation Header */}
      <header className="max-w-7xl mx-auto w-full px-6 py-5 flex items-center justify-between z-20" id="landing-header">
        <div className="flex items-center gap-2.5">
          <div className="h-10 w-10 bg-neutral-900 rounded-xl flex items-center justify-center border border-neutral-800">
            <Dumbbell className="w-5 h-5 text-[#FF4D00]" />
          </div>
          <div>
            <h1 className="text-md font-bold uppercase tracking-wider font-display flex items-center gap-1.5">
              RepRise <span className="text-neutral-500 font-normal">Coach</span>
            </h1>
            <span className="text-[8px] text-neutral-500 font-mono tracking-widest block font-bold -mt-0.5">ELITE EDITION</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Language selection button */}
          <button
            onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
            className="flex items-center gap-1.5 hover:text-white text-neutral-400 text-xs font-semibold uppercase px-3 py-1.5 rounded-lg border border-neutral-800 bg-neutral-950/60 hover:bg-neutral-900 transition-all cursor-pointer"
            id="lang-toggler-landing"
          >
            <Globe className="w-3.5 h-3.5 text-[#FF4D00]" />
            <span>{lang === 'en' ? 'العربية' : 'English'}</span>
          </button>

          {/* Action Login */}
          <button
            onClick={() => setShowLoginModal(true)}
            className="text-xs font-bold uppercase text-neutral-300 hover:text-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            id="login-btn-header"
          >
            {currentT.signIn}
          </button>

          <button
            onClick={() => setShowRegisterModal(true)}
            className="bg-[#FF4D00] hover:bg-[#E04400] text-black hover:text-black font-bold text-xs uppercase px-4 py-2 rounded-xl transition-all font-mono tracking-wider shadow-md hover:shadow-orange-950/40 cursor-pointer"
            id="register-btn-header"
          >
            {lang === 'en' ? 'Join Now' : 'سجل الآن'}
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto w-full px-6 pt-16 pb-20 flex-1 flex flex-col items-center justify-center text-center z-10" id="landing-hero">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-neutral-850 bg-neutral-950/90 text-[10px] text-neutral-400 font-mono font-bold tracking-widest uppercase mb-7 shadow-sm"
        >
          <Sparkles className="w-3 h-3 text-[#FF4D00] animate-pulse" />
          <span>{currentT.trustedBy}</span>
        </motion.div>

        <motion.h1 
          className="text-3xl sm:text-5xl md:text-6xl font-black font-display tracking-tight text-white max-w-4xl leading-[1.1] uppercase mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          {currentT.heroTitle}
        </motion.h1>

        <motion.p 
          className="text-sm sm:text-lg text-neutral-400 max-w-2xl font-sans leading-relaxed mb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.3 }}
        >
          {currentT.heroSubtitle}
        </motion.p>

        {/* Buttons Call to Actions */}
        <motion.div 
          className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center max-w-md px-4 mb-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45 }}
        >
          <button
            onClick={() => setShowRegisterModal(true)}
            className="w-full sm:w-auto bg-white hover:bg-neutral-100 text-[#050505] font-bold text-sm uppercase px-7 py-4 rounded-xl shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer font-sans text-center"
            id="cta-create-account"
          >
            {currentT.getStarted}
          </button>

          <button
            onClick={() => setShowLoginModal(true)}
            className="w-full sm:w-auto border border-neutral-800 bg-neutral-950/50 hover:bg-neutral-900 text-white font-bold text-sm uppercase px-7 py-4 rounded-xl transition-all cursor-pointer font-sans flex items-center justify-center gap-2 group text-center"
            id="cta-sign-in"
          >
            <span>{currentT.signIn}</span>
            <ArrowRight className={`w-4 h-4 text-[#FF4D00] transition-transform ${lang === 'ar' ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} />
          </button>
        </motion.div>

        {/* Dynamic Guest Trial prompt underneath Hero CTA buttons */}
        <motion.div
          className="text-xs text-neutral-400 mb-14 transition-colors font-sans flex flex-col sm:flex-row items-center justify-center gap-2 text-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.52 }}
        >
          <span>
            {lang === 'en' 
              ? 'You can try the app as a guest from here:' 
              : 'يمكنك تجربة التطبيق كضيف من هنا:'}
          </span>
          <button 
            type="button"
            onClick={onExploreDemo}
            className="text-[#FF4D00] hover:text-orange-400 font-bold uppercase tracking-wider transition-colors cursor-pointer border-b border-dashed border-[#FF4D00]/50 pb-0.5"
            id="cta-guest-prompt"
          >
            {lang === 'en' ? 'Explore as Guest' : 'الدخول كضيف'}
          </button>
        </motion.div>

        {/* Dynamic App Dashboard Frame Mockup */}
        <motion.div
          className="w-full max-w-5xl rounded-2xl border border-neutral-850 bg-neutral-950/80 p-3 shadow-2xl relative"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.55 }}
          id="cta-dashboard-frame"
        >
          <div className="absolute top-0 right-0 left-0 h-10 border-b border-neutral-850 flex items-center px-4 justify-between text-neutral-600 bg-neutral-950/90 rounded-t-2xl">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-neutral-800" />
              <span className="w-2.5 h-2.5 rounded-full bg-neutral-800" />
              <span className="w-2.5 h-2.5 rounded-full bg-neutral-800" />
            </div>
            <div className="text-[10px] uppercase tracking-wider font-mono font-bold text-neutral-500">
              REPRISE COACH SUITE
            </div>
            <div className="w-12 h-1 bg-neutral-800 rounded-sm" />
          </div>

          <div className="relative bg-[#0d0d0d] rounded-xl overflow-hidden mt-8 select-none border border-neutral-900">
            {/* Visual presentation of client's details block */}
            <div className="p-6 md:p-8 text-left grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border border-neutral-850 bg-neutral-950/70 p-5 rounded-xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-9 w-9 bg-[#FF4D00]/10 border border-[#FF4D00]/20 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-[#FF4D00]" />
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-500 uppercase font-mono block">CLIENT BASE</span>
                    <span className="text-sm font-bold text-white uppercase font-display">Active Athletes</span>
                  </div>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-neutral-900">
                    <span className="text-neutral-400">Yousef Al-Masri</span>
                    <span className="text-emerald-400 font-bold uppercase font-mono text-[10px]">Active</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-neutral-900">
                    <span className="text-neutral-400">Fatima Al-Hassan</span>
                    <span className="text-emerald-400 font-bold uppercase font-mono text-[10px]">Active</span>
                  </div>
                </div>
              </div>

              <div className="border border-neutral-850 bg-neutral-950/70 p-5 rounded-xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-9 w-9 bg-[#FF4D00]/10 border border-[#FF4D00]/20 rounded-lg flex items-center justify-center">
                    <Scale className="w-4 h-4 text-[#FF4D00]" />
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-500 uppercase font-mono block">COMPOSITION</span>
                    <span className="text-sm font-bold text-white uppercase font-display">InBody Analyzer</span>
                  </div>
                </div>
                <div className="space-y-1.5 text-xs text-neutral-400 font-mono">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-[#FF4D00] rounded-full" />
                    <span>Skeletal Muscle: 39.5 kg</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-[#FF4D00] rounded-full" />
                    <span>Percent Body Fat: 14.2%</span>
                  </div>
                </div>
              </div>

              <div className="border border-neutral-850 bg-neutral-950/70 p-5 rounded-xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-9 w-9 bg-[#FF4D00]/10 border border-[#FF4D00]/20 rounded-lg flex items-center justify-center">
                    <Apple className="w-4 h-4 text-[#FF4D00]" />
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-500 uppercase font-mono block">NUTRITION</span>
                    <span className="text-sm font-bold text-white uppercase font-display">Macro-Distribution</span>
                  </div>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden flex">
                    <div className="w-[40%] bg-blue-500 h-full" />
                    <div className="w-[35%] bg-[#FF4D00] h-full" />
                    <div className="w-[25%] bg-amber-500 h-full" />
                  </div>
                  <div className="flex justify-between text-[10px] text-neutral-500 font-mono pt-1.5">
                    <span>Protein 40%</span>
                    <span>Carbs 35%</span>
                    <span>Fat 25%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Grid of Features */}
      <section className="bg-neutral-950/45 py-24 border-t border-b border-neutral-900 relative" id="landing-features">
        <div className="max-w-7xl mx-auto w-full px-6">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-4xl font-black font-display text-white uppercase mb-3">
              {currentT.pricingTitle}
            </h2>
            <p className="text-sm sm:text-md text-neutral-400 max-w-xl mx-auto font-sans leading-relaxed">
              {currentT.pricingSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6.5">
            {/* Feature 1 */}
            <div className="p-6 border border-neutral-850 bg-neutral-950/80 rounded-2xl group hover:border-[#FF4D00]/40 transition-colors">
              <div className="h-11 w-11 bg-neutral-900 rounded-xl flex items-center justify-center border border-neutral-800 mb-5 group-hover:bg-[#FF4D00]/10 group-hover:border-[#FF4D00]/30 transition-colors">
                <Users className="w-5 h-5 text-[#FF4D00]" />
              </div>
              <h3 className="text-base font-bold text-white uppercase mb-2 font-display">{currentT.featureClients}</h3>
              <p className="text-xs text-neutral-400 leading-relaxed font-sans">{currentT.featureClientsDesc}</p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 border border-neutral-850 bg-neutral-950/80 rounded-2xl group hover:border-[#FF4D00]/40 transition-colors">
              <div className="h-11 w-11 bg-neutral-900 rounded-xl flex items-center justify-center border border-neutral-800 mb-5 group-hover:bg-[#FF4D00]/10 group-hover:border-[#FF4D00]/30 transition-colors">
                <Dumbbell className="w-5 h-5 text-[#FF4D00]" />
              </div>
              <h3 className="text-base font-bold text-white uppercase mb-2 font-display">{currentT.featureWorkouts}</h3>
              <p className="text-xs text-neutral-400 leading-relaxed font-sans">{currentT.featureWorkoutsDesc}</p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 border border-neutral-850 bg-neutral-950/80 rounded-2xl group hover:border-[#FF4D00]/40 transition-colors">
              <div className="h-11 w-11 bg-neutral-900 rounded-xl flex items-center justify-center border border-neutral-800 mb-5 group-hover:bg-[#FF4D00]/10 group-hover:border-[#FF4D00]/30 transition-colors">
                <Scale className="w-5 h-5 text-[#FF4D00]" />
              </div>
              <h3 className="text-base font-bold text-white uppercase mb-2 font-display">{currentT.featureInBody}</h3>
              <p className="text-xs text-neutral-400 leading-relaxed font-sans">{currentT.featureInBodyDesc}</p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 border border-neutral-850 bg-neutral-950/80 rounded-2xl group hover:border-[#FF4D00]/40 transition-colors">
              <div className="h-11 w-11 bg-neutral-900 rounded-xl flex items-center justify-center border border-neutral-800 mb-5 group-hover:bg-[#FF4D00]/10 group-hover:border-[#FF4D00]/30 transition-colors">
                <Apple className="w-5 h-5 text-[#FF4D00]" />
              </div>
              <h3 className="text-base font-bold text-white uppercase mb-2 font-display">{currentT.featureNutrition}</h3>
              <p className="text-xs text-neutral-400 leading-relaxed font-sans">{currentT.featureNutritionDesc}</p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 border border-neutral-850 bg-neutral-950/80 rounded-2xl group hover:border-[#FF4D00]/40 transition-colors">
              <div className="h-11 w-11 bg-neutral-900 rounded-xl flex items-center justify-center border border-neutral-800 mb-5 group-hover:bg-[#FF4D00]/10 group-hover:border-[#FF4D00]/30 transition-colors">
                <FileText className="w-5 h-5 text-[#FF4D00]" />
              </div>
              <h3 className="text-base font-bold text-white uppercase mb-2 font-display">{currentT.featureReports}</h3>
              <p className="text-xs text-neutral-400 leading-relaxed font-sans">{currentT.featureReportsDesc}</p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 border border-neutral-850 bg-neutral-950/80 rounded-2xl group hover:border-[#FF4D00]/40 transition-colors">
              <div className="h-11 w-11 bg-neutral-900 rounded-xl flex items-center justify-center border border-neutral-800 mb-5 group-hover:bg-[#FF4D00]/10 group-hover:border-[#FF4D00]/30 transition-colors">
                <Shield className="w-5 h-5 text-[#FF4D00]" />
              </div>
              <h3 className="text-base font-bold text-white uppercase mb-2 font-display">{currentT.featureOffline}</h3>
              <p className="text-xs text-neutral-400 leading-relaxed font-sans">{currentT.featureOfflineDesc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Landing Visual Footer with Credit Line */}
      <footer className="border-t border-neutral-900 py-12 bg-neutral-950/90 text-neutral-500 font-mono text-center select-none" id="landing-footer">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <span>&copy; 2026 REPRISE COACHING SYSTEMS. ALL RIGHTS RESERVED.</span>
          <div className="flex gap-4">
            <span className="cursor-pointer hover:text-white transition-colors">LOCAL ARCHIVE DISK ACTIVE</span>
          </div>
        </div>
      </footer>

      {/* LOGIN MODAL */}
      <AnimatePresence>
        {showLoginModal && (
          <div className="fixed inset-0 bg-[#000]/70 backdrop-blur-md flex items-center justify-center p-4 z-50 select-none">
            <motion.div
              className="bg-neutral-950 border border-neutral-850 rounded-2xl w-full max-w-md p-6 relative overflow-hidden"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              id="login-dialog-wrap"
            >
              {/* Abs orange visual border top */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-600 via-[#FF4D00] to-orange-500" />

              <h3 className="text-lg font-bold text-white uppercase tracking-tight mb-1 flex items-center gap-2 font-display">
                <Dumbbell className="w-4 h-4 text-[#FF4D00]" />
                {currentT.loginTitle}
              </h3>
              <p className="text-[11px] text-neutral-500 tracking-wide font-sans mb-6">
                {lang === 'en' 
                  ? 'Key in your credentials or use the trial fast-track buttons' 
                  : 'أدخل بيانات المرور الخاصة بك أو اضغط حقل التعبئة التجريبية السريعة'}
              </p>

              {errorMsg && (
                <div className="mb-4 bg-red-950/40 border border-red-900/40 p-4 rounded-xl text-xs text-red-100 font-sans space-y-3 max-h-[220px] overflow-y-auto">
                  <div className="flex items-start gap-2">
                    <span className="text-sm">⚠️</span>
                    <p className="font-semibold text-red-300">{errorMsg}</p>
                  </div>
                  {(errorMsg.includes('operation-not-allowed') || errorMsg.includes('auth/operation-not-allowed')) && (
                    <div className="mt-2.5 pt-2.5 border-t border-red-900/30 text-neutral-300 space-y-2 leading-relaxed bg-black/50 p-3 rounded-lg border border-red-950/80">
                      <p className="font-bold text-[#FF4D00] text-[11px] uppercase tracking-wide">
                        {lang === 'en' ? '🚀 Action Required in Firebase Console:' : '🚀 خطوة مطلوبة في لوحة تحكم Firebase:'}
                      </p>
                      <ol className="list-decimal pl-4 pr-1 space-y-1.5 text-[11px] text-neutral-300">
                        {lang === 'en' ? (
                          <>
                            <li>Open your <strong>Firebase Console</strong> for this project.</li>
                            <li>Go to <strong>Authentication</strong> &gt; section <strong>Sign-in method</strong>.</li>
                            <li>Click <strong>Add new provider</strong> and choose <strong>Email/Password</strong>.</li>
                            <li>Toggle to <strong>Enable</strong> and click <strong>Save</strong> to start!</li>
                          </>
                        ) : (
                          <>
                            <li>افتح <strong>لوحة تحكم Firebase Console</strong> الخاصة بـهذا المشروع.</li>
                            <li>انتقل إلى قسم <strong>Authentication</strong> ثم تبويب <strong>Sign-in method</strong>.</li>
                            <li>اضغط على <strong>Add new provider</strong> واختر <strong>Email/Password</strong>.</li>
                            <li>قم بتفعيل خيار <strong>Enable</strong> ثم اضغط على <strong>Save (حفظ)</strong> لتبدأ بربط بياناتك الحقيقية.</li>
                          </>
                        )}
                      </ol>
                    </div>
                  )}
                </div>
              )}

              {successMsg && (
                <div className="mb-4 bg-emerald-950/40 border border-emerald-900/40 p-3 rounded-lg text-xs text-emerald-400 font-sans">
                  {successMsg}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4 font-sans">
                <div>
                  <label className="block text-[10px] text-neutral-400 font-bold uppercase tracking-wider mb-1.5">{currentT.email}</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. coach@example.com"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9.5 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-neutral-400 font-bold uppercase tracking-wider mb-1.5">{currentT.password}</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9.5 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
                    />
                  </div>
                </div>

                <div className="pt-2 flex flex-col gap-2.5">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-[#FF4D00] hover:bg-[#E04400] text-black hover:text-black font-bold text-xs uppercase py-3 rounded-xl transition-colors tracking-widest font-mono cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    id="login-submit-btn"
                  >
                    {isLoading && (
                      <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    )}
                    {currentT.loginBtn}
                  </button>

                  <div className="flex items-center my-1 select-none">
                    <div className="flex-grow border-t border-neutral-900"></div>
                    <span className="mx-3 text-[10px] text-neutral-600 font-mono uppercase tracking-widest">{lang === 'en' ? 'OR' : 'أو'}</span>
                    <div className="flex-grow border-t border-neutral-900"></div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="w-full border border-neutral-850 hover:border-neutral-750 bg-black hover:bg-neutral-950 text-xs text-white font-medium py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2.5 shadow-sm active:scale-[0.98]"
                    id="login-google-btn"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    {lang === 'en' ? 'Continue with Google' : 'الدخول السريع بحساب Google'}
                  </button>

                  <button
                    type="button"
                    onClick={autofillDefaultCredentials}
                    className="w-full border border-neutral-800 bg-neutral-900/30 hover:bg-neutral-900 text-[10px] text-neutral-300 hover:text-white py-2.5 rounded-xl transition-colors font-mono tracking-widest cursor-pointer"
                    id="login-autofill-btn"
                  >
                    {currentT.autofillBtn}
                  </button>
                </div>
              </form>

              <div className="mt-6 pt-5 border-t border-neutral-900 flex justify-between items-center text-xs text-neutral-500 font-sans">
                <span>{currentT.loginFooter}</span>
                <button
                  onClick={() => {
                    setShowLoginModal(false);
                    setShowRegisterModal(true);
                  }}
                  className="text-[#FF4D00] hover:text-orange-400 font-bold uppercase transition-colors text-[10px] tracking-wider cursor-pointer"
                >
                  {lang === 'en' ? 'Register Account' : 'تسجيل حساب'}
                </button>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setShowLoginModal(false)}
                className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors cursor-pointer"
                id="close-login-btn"
              >
                <span className="text-xs uppercase font-mono font-bold">{lang === 'en' ? 'Close' : 'إغلاق'}</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* REGISTER MODAL */}
      <AnimatePresence>
        {showRegisterModal && (
          <div className="fixed inset-0 bg-[#000]/70 backdrop-blur-md flex items-center justify-center p-4 z-50 select-none">
            <motion.div
              className="bg-neutral-950 border border-neutral-850 rounded-2xl w-full max-w-md p-6 relative overflow-hidden"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              id="register-dialog-wrap"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-600 via-[#FF4D00] to-orange-500" />

              <h3 className="text-lg font-bold text-white uppercase tracking-tight mb-1 flex items-center gap-2 font-display">
                <Award className="w-4 h-4 text-[#FF4D00]" />
                {currentT.registerTitle}
              </h3>
              <p className="text-[11px] text-neutral-500 tracking-wide font-sans mb-5">
                {lang === 'en' 
                  ? 'Setup your exclusive professional coach space (locally secure)' 
                  : 'أنشئ حسابك المهني في دقائق. بياناتك مؤمنة بالكامل على جهازك.'}
              </p>

              {errorMsg && (
                <div className="mb-4 bg-red-950/40 border border-red-900/40 p-4 rounded-xl text-xs text-red-100 font-sans space-y-3 max-h-[200px] overflow-y-auto">
                  <div className="flex items-start gap-2">
                    <span className="text-sm">⚠️</span>
                    <p className="font-semibold text-red-300">{errorMsg}</p>
                  </div>
                  {(errorMsg.includes('operation-not-allowed') || errorMsg.includes('auth/operation-not-allowed')) && (
                    <div className="mt-2.5 pt-2.5 border-t border-red-900/30 text-neutral-300 space-y-2 leading-relaxed bg-black/50 p-3 rounded-lg border border-red-950/80">
                      <p className="font-bold text-[#FF4D00] text-[11px] uppercase tracking-wide">
                        {lang === 'en' ? '🚀 Action Required in Firebase Console:' : '🚀 خطوة مطلوبة في لوحة تحكم Firebase:'}
                      </p>
                      <ol className="list-decimal pl-4 pr-1 space-y-1.5 text-[11px] text-neutral-300">
                        {lang === 'en' ? (
                          <>
                            <li>Open your <strong>Firebase Console</strong> for this project.</li>
                            <li>Go to <strong>Authentication</strong> &gt; section <strong>Sign-in method</strong>.</li>
                            <li>Click <strong>Add new provider</strong> and choose <strong>Email/Password</strong>.</li>
                            <li>Toggle to <strong>Enable</strong> and click <strong>Save</strong> to start!</li>
                          </>
                        ) : (
                          <>
                            <li>افتح <strong>لوحة تحكم Firebase Console</strong> الخاصة بـهذا المشروع.</li>
                            <li>انتقل إلى قسم <strong>Authentication</strong> ثم تبويب <strong>Sign-in method</strong>.</li>
                            <li>اضغط على <strong>Add new provider</strong> واختر <strong>Email/Password</strong>.</li>
                            <li>قم بتفعيل خيار <strong>Enable</strong> ثم اضغط على <strong>Save (حفظ)</strong> لتبدأ بربط بياناتك الحقيقية.</li>
                          </>
                        )}
                      </ol>
                    </div>
                  )}
                </div>
              )}

              {successMsg && (
                <div className="mb-4 bg-emerald-950/40 border border-emerald-900/40 p-3 rounded-lg text-xs text-emerald-400 font-sans">
                  {successMsg}
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-3.5 font-sans">
                <div>
                  <label className="block text-[10px] text-neutral-400 font-bold uppercase tracking-wider mb-1">{currentT.coachName}</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Capt. Mohamed"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9.5 pr-4 py-2 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-neutral-400 font-bold uppercase tracking-wider mb-1">{currentT.email}</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. coach@reprise.com"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9.5 pr-4 py-2 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-neutral-400 font-bold uppercase tracking-wider mb-1">{currentT.gymName}</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500">
                      <Building className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      required
                      value={gymName}
                      onChange={(e) => setGymName(e.target.value)}
                      placeholder={currentT.gymPlaceholder}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9.5 pr-4 py-2 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-neutral-400 font-bold uppercase tracking-wider mb-1">{currentT.password}</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9.5 pr-4 py-2 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-neutral-400 font-bold uppercase tracking-wider mb-1">{currentT.subTier}</label>
                  <select
                    value={subscription}
                    onChange={(e) => setSubscription(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
                  >
                    <option value="Elite">{currentT.eliteTier}</option>
                    <option value="Pro">{currentT.proTier}</option>
                  </select>
                </div>

                <div className="pt-2 flex flex-col gap-2.5">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-[#FF4D00] hover:bg-[#E04400] text-black hover:text-black font-bold text-xs uppercase py-3 rounded-xl transition-all tracking-widest font-mono cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    id="register-submit-btn"
                  >
                    {isLoading && (
                      <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    )}
                    {currentT.registerBtn}
                  </button>

                  <div className="flex items-center my-1 select-none">
                    <div className="flex-grow border-t border-neutral-900"></div>
                    <span className="mx-3 text-[10px] text-neutral-600 font-mono uppercase tracking-widest">{lang === 'en' ? 'OR' : 'أو'}</span>
                    <div className="flex-grow border-t border-neutral-900"></div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="w-full border border-neutral-850 hover:border-neutral-750 bg-black hover:bg-neutral-950 text-xs text-white font-medium py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2.5 shadow-sm active:scale-[0.98]"
                    id="register-google-btn"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    {lang === 'en' ? 'Register with Google' : 'التسجيل السريع بحساب Google'}
                  </button>
                </div>
              </form>

              <div className="mt-5 pt-4 border-t border-neutral-900 flex justify-between items-center text-xs text-neutral-500 font-sans">
                <span>{currentT.registerFooter}</span>
                <button
                  onClick={() => {
                    setShowRegisterModal(false);
                    setShowLoginModal(true);
                  }}
                  className="text-[#FF4D00] hover:text-orange-400 font-bold uppercase transition-colors text-[10px] tracking-wider cursor-pointer"
                >
                  {currentT.signIn}
                </button>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setShowRegisterModal(false)}
                className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors cursor-pointer"
                id="close-register-btn"
              >
                <span className="text-xs uppercase font-mono font-bold">{lang === 'en' ? 'Close' : 'إغلاق'}</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
