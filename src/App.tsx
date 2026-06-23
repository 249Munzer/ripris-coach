/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  loadInitialState, 
  saveClients, 
  saveInBodyRecords, 
  saveWorkouts, 
  saveNutritionPlans, 
  saveProgressLogs, 
  restoreBulkState, 
  clearAllState,
  resetToDemoData,
  signOutCoachInFirebase,
  initDemoDatabase,
  syncCloudToLocal,
  getActiveCoachId
} from './storage/db';
import { translations } from './utils/translations';
import { Client, InBodyRecord, WorkoutPlan, NutritionPlan, ProgressLog } from './types';

// Modular Subviews
import LandingView from './components/LandingView';
import DashboardView from './components/DashboardView';
import ClientsView from './components/ClientsView';
import InBodyView from './components/InBodyView';
import WorkoutBuilderView from './components/WorkoutBuilderView';
import ExerciseLibraryView from './components/ExerciseLibraryView';
import NutritionView from './components/NutritionView';
import ProgressView from './components/ProgressView';
import ReportPDFView from './components/ReportPDFView';
import SettingsView from './components/SettingsView';

import { 
  LayoutDashboard, 
  Users, 
  Scale, 
  Dumbbell, 
  Apple, 
  Activity, 
  FileText, 
  Sliders, 
  Flame, 
  Globe, 
  Languages, 
  Menu, 
  X,
  Bell
} from 'lucide-react';

export default function App() {
  // Authentication & Coach Profile State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const cachedCoach = localStorage.getItem('reprise_coach_profile');
    if (cachedCoach) {
      try {
        const parsed = JSON.parse(cachedCoach);
        return !!parsed.id;
      } catch (e) {
        return false;
      }
    }
    return false;
  });

  const [coachProfile, setCoachProfile] = useState<any>(() => {
    const cachedCoach = localStorage.getItem('reprise_coach_profile');
    if (cachedCoach) {
      try {
        const parsed = JSON.parse(cachedCoach);
        return parsed;
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  // Locale State
  const [lang, setLang] = useState<'en' | 'ar'>(() => {
    const savedLang = localStorage.getItem('reprise_coach_lang');
    if (savedLang === 'en' || savedLang === 'ar') {
      return savedLang;
    }
    const browserLang = navigator.language.slice(0, 2);
    return browserLang === 'ar' ? 'ar' : 'en';
  });
  const [units, setUnits] = useState<'metric' | 'imperial'>('metric');

  // Load language dictionary
  const t = useMemo(() => translations[lang], [lang]);

  // Synchronize document direction with active language and persist language preference
  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    localStorage.setItem('reprise_coach_lang', lang);
  }, [lang]);

  // Core Application Database State
  const [clients, setClients] = useState<Client[]>([]);
  const [inbodyRecords, setInbodyRecords] = useState<InBodyRecord[]>([]);
  const [workouts, setWorkouts] = useState<WorkoutPlan[]>([]);
  const [nutritionPlans, setNutritionPlans] = useState<NutritionPlan[]>([]);
  const [progressLogs, setProgressLogs] = useState<ProgressLog[]>([]);

  // Navigation state - active pane
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [activeSelectedClientId, setActiveSelectedClientId] = useState<string | undefined>(undefined);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Initialize data on mount and reload on authentication transitions
  useEffect(() => {
    const data = loadInitialState();
    setClients(data.clients);
    setInbodyRecords(data.inbodyRecords);
    setWorkouts(data.workouts);
    setNutritionPlans(data.nutrition);
    setProgressLogs(data.progressLogs);
  }, [isAuthenticated]);

  // Synchronize dynamic updates with localStorage persistence
  const handleAddClient = (client: Client) => {
    const updated = [client, ...clients];
    setClients(updated);
    saveClients(updated);
  };

  const handleUpdateClient = (client: Client) => {
    const updated = clients.map(c => c.id === client.id ? client : c);
    setClients(updated);
    saveClients(updated);
  };

  const handleDeleteClient = (id: string) => {
    // Delete client
    const updatedClients = clients.filter(c => c.id !== id);
    setClients(updatedClients);
    saveClients(updatedClients);

    // Cascade deletions of and cleanup associated child records
    const updatedInBody = inbodyRecords.filter(r => r.clientId !== id);
    setInbodyRecords(updatedInBody);
    saveInBodyRecords(updatedInBody);

    const updatedWorkouts = workouts.filter(w => w.clientId !== id);
    setWorkouts(updatedWorkouts);
    saveWorkouts(updatedWorkouts);

    const updatedNutrition = nutritionPlans.filter(n => n.clientId !== id);
    setNutritionPlans(updatedNutrition);
    saveNutritionPlans(updatedNutrition);

    const updatedProgress = progressLogs.filter(p => p.clientId !== id);
    setProgressLogs(updatedProgress);
    saveProgressLogs(updatedProgress);

    if (activeSelectedClientId === id) {
      setActiveSelectedClientId(undefined);
    }
  };

  const handleAddInBodyRecord = (record: InBodyRecord) => {
    const updated = [record, ...inbodyRecords];
    setInbodyRecords(updated);
    saveInBodyRecords(updated);
  };

  const handleSaveWorkout = (workout: WorkoutPlan) => {
    let base = workouts;
    if (workout.isActive) {
      // Deactivate all other plans of the same client
      base = workouts.map(w => w.clientId === workout.clientId && w.id !== workout.id 
        ? { ...w, isActive: false, isArchived: true } 
        : w
      );
    }
    const exists = base.some(w => w.id === workout.id);
    let updated: WorkoutPlan[];
    if (exists) {
      updated = base.map(w => w.id === workout.id ? workout : w);
    } else {
      updated = [workout, ...base];
    }
    setWorkouts(updated);
    saveWorkouts(updated);
  };

  const handleSaveNutrition = (plan: NutritionPlan) => {
    let base = nutritionPlans;
    if (plan.isActive) {
      // Deactivate all other plans of the same client
      base = nutritionPlans.map(n => n.clientId === plan.clientId && n.id !== plan.id 
        ? { ...n, isActive: false, isArchived: true } 
        : n
      );
    }
    const exists = base.some(n => n.id === plan.id);
    let updated: NutritionPlan[];
    if (exists) {
      updated = base.map(n => n.id === plan.id ? plan : n);
    } else {
      updated = [plan, ...base];
    }
    setNutritionPlans(updated);
    saveNutritionPlans(updated);
  };

  const handleAddProgressLog = (log: ProgressLog) => {
    const updated = [log, ...progressLogs];
    setProgressLogs(updated);
    saveProgressLogs(updated);

    // Update client bodyweight to the latest checked log weight as well for evidence sync
    const client = clients.find(c => c.id === log.clientId);
    if (client) {
      handleUpdateClient({
        ...client,
        weight: log.weight
      });
    }
  };

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState('');

  const handleSyncCloudData = async () => {
    setIsSyncing(true);
    setSyncSuccessMsg('');
    try {
      const coachId = getActiveCoachId();
      await syncCloudToLocal(coachId);
      
      // Reload states cleanly to update React components
      const data = loadInitialState();
      setClients(data.clients);
      setInbodyRecords(data.inbodyRecords);
      setWorkouts(data.workouts);
      setNutritionPlans(data.nutrition);
      setProgressLogs(data.progressLogs);

      setSyncSuccessMsg(lang === 'en' ? 'Synchronized with Firebase Cloud!' : 'تم التحديث والمزامنة مع قاعدة بيانات السحابة بنجاح!');
      setTimeout(() => setSyncSuccessMsg(''), 4000);
    } catch (e: any) {
      console.error(e);
      alert(lang === 'en' ? `Failed to sync with cloud: ${e.message || 'Unknown network error'}` : `فشل الاتصال والمزامنة مع السحابة: ${e.message || 'خطأ غير معروف في الاتصال'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRestoreBulkDump = (snapshotJSON: string) => {
    restoreBulkState(snapshotJSON);
  };

  const handleClearDatabase = async () => {
    setIsSyncing(true);
    setSyncSuccessMsg(lang === 'en' ? 'Wiping workspace database... Please wait.' : 'جاري إخلاء ومسح قاعدة البيانات... يرجى الانتظار.');
    try {
      await clearAllState();
      // Flush local react states immediately as well!
      setClients([]);
      setInbodyRecords([]);
      setWorkouts([]);
      setNutritionPlans([]);
      setProgressLogs([]);
      setSyncSuccessMsg(lang === 'en' ? 'Workspace completely cleaned!' : 'تم تنظيف مساحة العمل بالكامل بنجاح!');
      setTimeout(() => setSyncSuccessMsg(''), 4000);
    } catch (e: any) {
      console.error(e);
      alert(lang === 'en' ? 'Failed to completely clear database.' : 'فشل مسح وتطهير قاعدة البيانات.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Quick navigation jumping helper to focus specific client inside secondary screens
  const handleSelectClientRedirect = (view: string, clientId: string) => {
    setActiveSelectedClientId(clientId);
    setActiveTab(view);
  };

  // Sidebar list configurations
  const NAV_ITEMS = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
    { id: 'clients', label: t.clients, icon: Users },
    { id: 'inbody', label: t.inbody, icon: Scale },
    { id: 'workouts', label: t.workouts, icon: Dumbbell },
    { id: 'nutrition', label: t.nutrition, icon: Apple },
    { id: 'progress', label: t.progress, icon: Activity },
    { id: 'exercises', label: t.exerciseLibrary, icon: Dumbbell },
    { id: 'pdf', label: t.pdfReport, icon: FileText },
    { id: 'settings', label: t.settings, icon: Sliders }
  ];

  if (!isAuthenticated) {
    return (
      <LandingView 
        lang={lang}
        setLang={setLang}
        onLoginSuccess={(profile) => {
          setCoachProfile(profile);
          setIsAuthenticated(true);
        }}
        onExploreDemo={() => {
          initDemoDatabase();
          const demoCoach = {
            id: "coach_master",
            name: lang === 'en' ? "David Al-Khalili" : "ديفيد الخليلي",
            email: "munzerm50@gmail.com",
            gymName: lang === 'en' ? "RepRise Elite HQ" : "ريب رايز الرائدة",
            registered: true,
            subscription: "Elite"
          };
          localStorage.setItem('reprise_coach_profile', JSON.stringify(demoCoach));
          setCoachProfile(demoCoach);
          setIsAuthenticated(true);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-[#FFFFFF] font-sans flex flex-col md:flex-row antialiased select-none" id="rep-rise-app-wrapper">
      
      {/* Dynamic LTR / RTL Side Panel menu */}
      <aside className={`fixed md:sticky top-0 z-40 h-screen w-64 bg-[#101010] border-r border-[#1a1a1a] flex flex-col justify-between transition-all duration-300 md:translate-x-0 outline-none select-none no-print ${
        isMobileMenuOpen 
          ? 'translate-x-0' 
          : lang === 'ar' ? 'translate-x-full md:translate-x-0' : '-translate-x-full md:translate-x-0'
      }`} id="sidebar-layout">
        
        <div className="p-5 space-y-7" id="sidebar-top-box">
          
          {/* Logo Brand bar */}
          <div className="flex items-center justify-between" id="brand-header">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-[#FF4D00] to-orange-400 flex items-center justify-center p-2 text-white">
                <Flame className="w-5 h-5 fill-white stroke-none" />
              </div>
              <div>
                <h1 className="text-sm font-extrabold tracking-tight text-white font-display uppercase">{t.appName}</h1>
                <span className="text-[9px] text-neutral-500 tracking-wider font-mono font-medium block uppercase">{t.tagline}</span>
              </div>
            </div>

            {/* Mobile close toggle */}
            <button
              id="mobile-close-sidebar-btn"
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden text-neutral-500 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Directory navigation maps */}
          <nav className="space-y-1" id="nav-directory-links">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                    isActive 
                      ? 'bg-neutral-900 border border-neutral-850 text-white font-bold shadow-inner' 
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/40 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#FF4D00]' : 'text-neutral-500'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Unified Bottom Footer metadata */}
        <div className="p-5 border-t border-[#1a1a1a] flex flex-col gap-3 text-[10px] text-neutral-500 font-mono" id="sidebar-footer">
          <div className="flex items-center justify-between">
            <span>Coach dashboard v1.0.1</span>
            <span className="h-2 w-2 rounded-full bg-[#16C47F] animate-pulse" />
          </div>
          
          <button
            id="toggle-lang-quick"
            onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
            className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer text-[9px] font-bold uppercase py-1 border border-neutral-800 rounded px-2 w-fit bg-neutral-950"
          >
            <Languages className="w-3 h-3 text-[#FF4D00]" />
            <span>{lang === 'en' ? 'Arabic Version' : 'التحويل للإنجليزية'}</span>
          </button>

          <button
            id="logout-quick-btn"
            onClick={async () => {
              await signOutCoachInFirebase();
              setIsAuthenticated(false);
              setCoachProfile(null);
            }}
            className="flex items-center gap-1.5 hover:text-red-400 text-neutral-400 transition-colors cursor-pointer text-[9px] font-bold uppercase py-1 border border-neutral-800 rounded px-2 w-fit bg-neutral-950"
          >
            <span className="text-red-500 font-bold">●</span>
            <span>{lang === 'en' ? 'Log out' : 'خروج من الحساب'}</span>
          </button>
        </div>
      </aside>

      {/* Main content body wrap layout */}
      <div className="flex-1 flex flex-col min-w-0" id="main-content-canvas">
        
        {/* Top bar panel controls */}
        <header className="sticky top-0 bg-[#050505]/85 backdrop-blur-md border-b border-[#1a1a1a] p-4.5 px-6 flex items-center justify-between z-30 select-none no-print" id="header-toolbar">
          <div className="flex items-center gap-3">
            <button
              id="mobile-menu-trigger-btn"
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden text-neutral-400 hover:text-white p-1 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <div id="quickbar-greetings">
              <span className="text-[10px] text-neutral-500 font-mono font-bold block uppercase">
                {lang === 'en' ? `Coach: ${coachProfile?.name || 'David Al-Khalili'} / ${coachProfile?.gymName || 'RepRise Elite HQ'}` : `المدرب: ${coachProfile?.name || 'ديفيد الخليلي'} / ${coachProfile?.gymName || 'ريب رايز الرائدة'}`}
              </span>
              <h2 className="text-sm font-bold text-white uppercase tracking-tight font-display flex items-center gap-1.5">
                {activeTab === 'dashboard' && t.dashboard}
                {activeTab === 'clients' && t.clientProfile}
                {activeTab === 'inbody' && t.inbodyAnalysis}
                {activeTab === 'workouts' && t.workoutEngine}
                {activeTab === 'nutrition' && t.macronutrients}
                {activeTab === 'progress' && t.performanceCompliance}
                {activeTab === 'exercises' && t.exerciseLibrary}
                {activeTab === 'pdf' && t.pdfReport}
                {activeTab === 'settings' && t.settings}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3" id="header-tools font-mono text-xs">
            {/* Real-time UTC timezone helper */}
            <div className="hidden sm:block text-right">
              <span className="text-[10px] text-neutral-500 font-mono uppercase block">UTC ZONE</span>
              <span className="text-[11px] font-bold text-neutral-300 font-mono block">2026-06-19</span>
            </div>
            
            <div className="h-8 w-px bg-neutral-800 hidden sm:block" />

            <button
              id="notification-bell-btn"
              className="p-1.5 hover:bg-neutral-900 rounded-lg text-neutral-500 hover:text-white transition-colors cursor-pointer relative"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 bg-[#FF4D00] rounded-full" />
            </button>
          </div>
        </header>

        {/* Central Component Subview Router Canvas */}
        <main className="flex-1 p-6 space-y-6 overflow-y-auto" id="router-container-canvas">
          
          {activeTab === 'dashboard' && (
            <DashboardView 
              clients={clients}
              inbody={inbodyRecords}
              progress={progressLogs}
              lang={lang}
              t={t}
              onNavigate={handleSelectClientRedirect}
              onImportDemo={handleSyncCloudData}
              coachName={coachProfile?.name}
            />
          )}

          {activeTab === 'clients' && (
            <ClientsView 
              clients={clients}
              lang={lang}
              t={t}
              onAddClient={handleAddClient}
              onUpdateClient={handleUpdateClient}
              onDeleteClient={handleDeleteClient}
              onSelectClient={handleSelectClientRedirect}
              activeSelectedClientId={activeSelectedClientId}
            />
          )}

          {activeTab === 'inbody' && (
            <InBodyView 
              clients={clients}
              inbodyRecords={inbodyRecords}
              lang={lang}
              t={t}
              onAddRecord={handleAddInBodyRecord}
              activeSelectedClientId={activeSelectedClientId}
            />
          )}

          {activeTab === 'workouts' && (
            <WorkoutBuilderView 
              clients={clients}
              workouts={workouts}
              lang={lang}
              t={t}
              onSaveWorkout={handleSaveWorkout}
              activeSelectedClientId={activeSelectedClientId}
            />
          )}

          {activeTab === 'nutrition' && (
            <NutritionView 
              clients={clients}
              nutritionPlans={nutritionPlans}
              lang={lang}
              t={t}
              onSaveNutrition={handleSaveNutrition}
              activeSelectedClientId={activeSelectedClientId}
            />
          )}

          {activeTab === 'progress' && (
            <ProgressView 
              clients={clients}
              progressLogs={progressLogs}
              lang={lang}
              t={t}
              onAddProgressLog={handleAddProgressLog}
              activeSelectedClientId={activeSelectedClientId}
            />
          )}

          {activeTab === 'exercises' && (
            <ExerciseLibraryView 
              lang={lang}
              t={t}
            />
          )}

          {activeTab === 'pdf' && (
            <ReportPDFView 
              clients={clients}
              inbodyRecords={inbodyRecords}
              workouts={workouts}
              nutritionPlans={nutritionPlans}
              lang={lang}
              t={t}
              activeSelectedClientId={activeSelectedClientId}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView 
              lang={lang}
              setLang={setLang}
              units={units}
              setUnits={setUnits}
              t={t}
              onRestoreState={handleRestoreBulkDump}
              onClearState={handleClearDatabase}
              onLogout={async () => {
                await signOutCoachInFirebase();
                setIsAuthenticated(false);
                setCoachProfile(null);
              }}
            />
          )}

        </main>

      </div>

      {syncSuccessMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#101010] border border-[#FF4D00] text-white text-xs px-5 py-3.5 rounded-xl flex items-center gap-2.5 shadow-2xl animate-fade-in select-none">
          <span className="text-[#FF4D00] text-sm">✓</span>
          <span className="font-medium tracking-tight">{syncSuccessMsg}</span>
        </div>
      )}

      {isSyncing && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#101010]/95 backdrop-blur-md border border-neutral-800 text-white text-xs px-5 py-3.5 rounded-xl flex items-center gap-3 shadow-2xl select-none">
          <svg className="animate-spin h-4 w-4 text-[#FF4D00]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-neutral-300">{lang === 'en' ? 'Syncing workspace with Cloud...' : 'جاري سحب وتحديث البيانات من السحابة...'}</span>
        </div>
      )}

    </div>
  );
}

