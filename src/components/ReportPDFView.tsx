/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Client, InBodyRecord, WorkoutPlan, NutritionPlan, ClientGoal, WeeklyCheckIn, CoachNote } from '../types';
import { 
  FileText, 
  Printer, 
  QrCode, 
  Scale, 
  Dumbbell, 
  Apple, 
  Info, 
  Target, 
  ClipboardCheck, 
  MessageSquare, 
  Sparkles,
  Layers,
  Flame,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { getClientGoals, getWeeklyCheckIns, getCoachNotes } from '../storage/db';

interface ReportPDFViewProps {
  clients: Client[];
  inbodyRecords: InBodyRecord[];
  workouts: WorkoutPlan[];
  nutritionPlans: NutritionPlan[];
  lang: 'en' | 'ar';
  t: any;
  activeSelectedClientId?: string;
}

export default function ReportPDFView({
  clients,
  inbodyRecords,
  workouts,
  nutritionPlans,
  lang,
  t,
  activeSelectedClientId
}: ReportPDFViewProps) {
  const [selectedClientId, setSelectedClientId] = useState<string>(
    activeSelectedClientId || (clients[0]?.id || '')
  );

  // Configuration toggles for modular printing
  const [showInBody, setShowInBody] = useState(true);
  const [showWorkouts, setShowWorkouts] = useState(true);
  const [showNutrition, setShowNutrition] = useState(true);
  const [showGoals, setShowGoals] = useState(true);
  const [showCheckins, setShowCheckins] = useState(true);
  const [showNotes, setShowNotes] = useState(true);

  // Load client data state
  const [allGoals, setAllGoals] = useState<ClientGoal[]>([]);
  const [allCheckins, setAllCheckins] = useState<WeeklyCheckIn[]>([]);
  const [allNotes, setAllNotes] = useState<CoachNote[]>([]);
  const [coachName, setCoachName] = useState<string>('');

  useEffect(() => {
    setAllGoals(getClientGoals());
    setAllCheckins(getWeeklyCheckIns());
    setAllNotes(getCoachNotes());

    // Load active coach name
    try {
      const cached = localStorage.getItem('reprise_coach_profile');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.name) {
          setCoachName(parsed.name);
        }
      }
    } catch (e) {
      console.warn("Could not load coach profile for pdf reports:", e);
    }
  }, [selectedClientId]);

  const selectedClient = clients.find(c => c.id === selectedClientId);

  // Filter systems specifically for this client
  const latestInBody = inbodyRecords
    .filter(r => r.clientId === selectedClientId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  const activeWorkout = workouts.find(w => w.clientId === selectedClientId);
  const activeNutrition = nutritionPlans.find(n => n.clientId === selectedClientId);
  const clientGoals = allGoals.filter(g => g.clientId === selectedClientId);
  const clientCheckins = allCheckins
    .filter(c => c.clientId === selectedClientId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const clientNotes = allNotes.filter(n => n.clientId === selectedClientId && !n.isArchived);
  
  const isIframe = typeof window !== 'undefined' && window.self !== window.top;

  const handlePrint = () => {
    try {
      window.print();
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenNewTab = () => {
    try {
      window.open(window.location.href, '_blank');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6" id="report-sheet-root">
      
      {/* 1. Header toolbar (Selector & Print triggering) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#101010] border border-neutral-850 p-4 rounded-2xl no-print" id="pdf-toolbar-header">
         <div className="flex items-center gap-3">
           <FileText className="w-5 h-5 text-[#FF4D00]" />
           <div>
             <h2 className="text-sm font-bold text-white uppercase tracking-wider">{t.pdfReport}</h2>
             <p className="text-[10px] text-neutral-500">
               {lang === 'en' 
                 ? 'Export custom structured PDF reports with selectable section binders' 
                 : 'تصدير وطباعة تقرير المشترك الشامل مع تحكم كامل بالفقرات المطبوعة'}
             </p>
           </div>
         </div>

         <div className="flex flex-wrap items-center gap-2">
           <select
             id="pdf-client-selector"
             value={selectedClientId}
             onChange={(e) => setSelectedClientId(e.target.value)}
             className="bg-[#181818] border border-neutral-800 rounded-xl py-1.5 px-3 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
           >
             {clients.map(c => (
               <option key={c.id} value={c.id}>{c.name}</option>
             ))}
           </select>

           {isIframe && (
             <button
               id="trigger-new-tab-btn"
               onClick={handleOpenNewTab}
               title={lang === 'en' ? 'Open in standalone window to enable print' : 'فتح في نافذة مستقلة لتفعيل الطباعة'}
               className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-300 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
             >
               <ExternalLink className="w-3.5 h-3.5 text-[#FF4D00]" />
               <span>{lang === 'en' ? 'Open New Tab' : 'افتح في نافذة جديدة'}</span>
             </button>
           )}

           {selectedClient && (
             <button
               id="trigger-print-btn"
               onClick={handlePrint}
               className="px-3.5 py-1.5 bg-[#FF4D00] hover:bg-[#E04400] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
             >
               <Printer className="w-4 h-4" />
               {t.print}
             </button>
           )}
         </div>
      </div>

      {isIframe && (
        <div className="bg-[#FF4D00]/5 border border-[#FF4D00]/25 rounded-2xl p-4 flex gap-3 items-start no-print" id="iframe-print-warning">
          <Info className="w-5 h-5 text-[#FF4D00] shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <h4 className="font-bold text-white">
              {lang === 'en' ? 'Browser Print Block Active' : 'تنبيه: قيود حماية المتصفح للمعاينة المدمجة'}
            </h4>
            <p className="text-neutral-400 leading-relaxed">
              {lang === 'en' 
                ? 'Modern web browsers secure embedded preview windows and seal direct print commands inside them. To print or save this dossier as PDF fully, please click "Open New Tab" to load the application standalone, then try printing.'
                : 'تقوم المتصفحات الحديثة بحظر أوامر الطباعة المباشرة من داخل نوافذ المعاينة المصغرة لحماية الأمان. لتصدير التقرير وتحميله بصيغة PDF بنجاح، يرجى الضغط على زر "افتح في نافذة جديدة" أعلاه لتشغيل التطبيق بشكل مستقل، ثم اضغط على زر "طباعة".'}
            </p>
          </div>
        </div>
      )}

      {selectedClient ? (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6" id="report-grid-preview">
          
          {/* Print Section Selectors & Pro Tips Sidebar */}
          <div className="xl:col-span-1 space-y-4 h-fit no-print" id="print-controls-sidebar">
            
            {/* Customizer */}
            <div className="bg-[#101010] border border-neutral-850 p-5 rounded-2xl space-y-4" id="pdf-customizer-panel">
              <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-neutral-850">
                <Layers className="w-4 h-4 text-[#FF4D00]" />
                {lang === 'en' ? 'Report Sections' : 'أقسام التقرير المرفقة'}
              </h3>
              
              <div className="space-y-3 pt-1">
                {/* 1 */}
                <label className="flex items-center gap-2.5 text-xs text-neutral-300 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={showInBody}
                    onChange={(e) => setShowInBody(e.target.checked)}
                    className="rounded border-neutral-800 text-[#FF4D00] focus:ring-0 focus:ring-offset-0 bg-[#181818] h-4 w-4"
                  />
                  <span>{lang === 'en' ? 'InBody Analysis' : 'تحليل قياسات الجسم'}</span>
                </label>

                {/* 2 */}
                <label className="flex items-center gap-2.5 text-xs text-neutral-300 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={showWorkouts}
                    onChange={(e) => setShowWorkouts(e.target.checked)}
                    className="rounded border-neutral-800 text-[#FF4D00] focus:ring-0 focus:ring-offset-0 bg-[#181818] h-4 w-4"
                  />
                  <span>{lang === 'en' ? 'Active Workouts Split' : 'الجدול التدريبي الفعال'}</span>
                </label>

                {/* 3 */}
                <label className="flex items-center gap-2.5 text-xs text-neutral-300 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={showNutrition}
                    onChange={(e) => setShowNutrition(e.target.checked)}
                    className="rounded border-neutral-800 text-[#FF4D00] focus:ring-0 focus:ring-offset-0 bg-[#181818] h-4 w-4"
                  />
                  <span>{lang === 'en' ? 'Macro Nutrition Plan' : 'برنامج الالتزام الغذائي والسعرات'}</span>
                </label>

                {/* 4 */}
                <label className="flex items-center gap-2.5 text-xs text-neutral-300 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={showGoals}
                    onChange={(e) => setShowGoals(e.target.checked)}
                    className="rounded border-neutral-800 text-[#FF4D00] focus:ring-0 focus:ring-offset-0 bg-[#181818] h-4 w-4"
                  />
                  <span>{lang === 'en' ? 'Active Athletic Goals' : 'الأهداف الرياضية ومؤشرات الإنجاز'}</span>
                </label>

                {/* 5 */}
                <label className="flex items-center gap-2.5 text-xs text-neutral-300 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={showCheckins}
                    onChange={(e) => setShowCheckins(e.target.checked)}
                    className="rounded border-neutral-800 text-[#FF4D00] focus:ring-0 focus:ring-offset-0 bg-[#181818] h-4 w-4"
                  />
                  <span>{lang === 'en' ? 'Weekly Check-In Logs' : 'سجل الالتزام والوزن الأسبوعي'}</span>
                </label>

                {/* 6 */}
                <label className="flex items-center gap-2.5 text-xs text-neutral-300 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={showNotes}
                    onChange={(e) => setShowNotes(e.target.checked)}
                    className="rounded border-neutral-800 text-[#FF4D00] focus:ring-0 focus:ring-offset-0 bg-[#181818] h-4 w-4"
                  />
                  <span>{lang === 'en' ? 'Coach Directive Notes' : 'ملاحظات وتوجيهات الكوتش'}</span>
                </label>
              </div>
            </div>

            {/* Quick instructions panel */}
            <div className="bg-[#101010] border border-neutral-850 p-5 rounded-2xl space-y-3" id="print-pro-tips">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Info className="w-4 h-4 text-[#FF4D00]" />
                {lang === 'en' ? 'Pro Printing Instructions' : 'تعليمات الطباعة والتحميل'}
              </h3>
              <ul className="text-[11px] text-neutral-400 space-y-2 list-decimal list-inside leading-relaxed font-sans">
                <li>{lang === 'en' ? 'Confirm target size is A4 or Letter.' : 'تأكد من اختيار مقاس الورقة A4.'}</li>
                <li>{lang === 'en' ? 'Check the option: "Background graphics" to include colors.' : 'فضل تفعيل خيار "طباعة الخلفيات والألوان" من خيارات المتصفح.'}</li>
                <li>{lang === 'en' ? 'Select "Save as PDF" to download a clean file.' : 'اختر "حفظ بتنسيق PDF" لتحميل الملف على حاسوبك فوراً.'}</li>
              </ul>
            </div>
          </div>

          {/* 2. Interactive Page Layout designed as A4 Paper */}
          <div className="xl:col-span-3 bg-white text-black p-8 sm:p-12 rounded-2xl shadow-2xl relative overflow-hidden font-sans border border-neutral-300" id="print-document">
            
            {/* Custom Embedded print media print-rules */}
            <style dangerouslySetInnerHTML={{ __html: `
              @media print {
                body {
                  background: white !important;
                  color: black !important;
                }
                .no-print {
                  display: none !important;
                }
                #print-document {
                  border: none !important;
                  box-shadow: none !important;
                  padding: 0 !important;
                  margin: 0 !important;
                  width: 100% !important;
                }
                .print-break {
                  page-break-before: always;
                }
              }
            ` }} />

            {/* Document Cover segment */}
            <div className="border-b-4 border-[#FF4D00] pb-6 space-y-4" id="print-cover-header">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-extrabold text-black tracking-tight">{lang === 'en' ? 'REPRISE COACH' : 'ريبرايز كوتش'}</h1>
                  <div className="flex flex-col md:flex-row md:items-center gap-1.5 md:gap-3 mt-1 text-[11px] font-mono font-bold text-neutral-500">
                    <span className="uppercase tracking-widest">COACH SMARTER. BUILD STRONGER.</span>
                    {coachName && (
                      <>
                        <span className="hidden md:inline text-neutral-350 select-none">•</span>
                        <span className="text-xs text-[#FF4D00] font-extrabold uppercase tracking-wide">
                          {lang === 'en' ? `COACH / ${coachName}` : `الكوتش / ${coachName}`}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                {/* SVG QR Code component */}
                <div className="text-right">
                  <div className="h-14 w-14 bg-neutral-100 rounded-lg border border-neutral-300 flex items-center justify-center p-1 cursor-pointer">
                    <QrCode className="w-full h-full text-black" />
                  </div>
                  <span className="text-[7px] text-neutral-400 block mt-1 uppercase font-mono">Mobile App Sync</span>
                </div>
              </div>

              {/* Cover Details rows */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-xs font-mono" id="print-cover-details">
                <div>
                  <span className="text-neutral-500 block uppercase font-bold text-[9px]">{lang === 'en' ? 'CLIENT NAME' : 'اسم المشترك'}</span>
                  <span className="text-black font-semibold uppercase">{selectedClient.name}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block uppercase font-bold text-[9px]">{lang === 'en' ? 'AGE / GENDER' : 'العمر / الجنس'}</span>
                  <span className="text-black font-semibold">{selectedClient.age} Yrs / {selectedClient.gender.toUpperCase()}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block uppercase font-bold text-[9px]">{lang === 'en' ? 'GOAL split' : 'الهدف الرياضي'}</span>
                  <span className="text-black font-semibold truncate block w-11/12">{selectedClient.goal}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block uppercase font-bold text-[9px]">{lang === 'en' ? 'DATE COMPILED' : 'تاريخ إنتاج التقرير'}</span>
                  <span className="text-black font-semibold">{new Date().toISOString().split('T')[0]}</span>
                </div>
              </div>
            </div>

            {/* InBody Section */}
            {showInBody && (
              latestInBody ? (
                <div className="pt-6 space-y-4" id="print-inbody">
                  <div className="flex items-center gap-1.5 border-b border-neutral-300 pb-1.5">
                    <Scale className="w-4 h-4 text-[#FF4D00]" />
                    <h3 className="text-sm font-bold uppercase tracking-wider">
                      {lang === 'en' ? 'InBody Analysis' : 'تحليل تكوين الجسم'} ({latestInBody.date})
                    </h3>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-xs" id="print-inbody-stats">
                    <div className="bg-neutral-55 p-2.5 rounded border border-neutral-200">
                      <span className="text-[9px] text-neutral-500 block font-semibold">{t.weight}</span>
                      <strong className="text-base text-black font-mono mt-0.5 block">{latestInBody.weight} kg</strong>
                    </div>
                    <div className="bg-neutral-55 p-2.5 rounded border border-neutral-200">
                      <span className="text-[9px] text-neutral-500 block font-semibold">{t.smm}</span>
                      <strong className="text-base text-black font-mono mt-0.5 block">{latestInBody.smm} kg</strong>
                    </div>
                    <div className="bg-neutral-55 p-2.5 rounded border border-neutral-200">
                      <span className="text-[9px] text-neutral-500 block font-semibold">{t.pbf}</span>
                      <strong className="text-base text-black font-mono mt-0.5 block">{latestInBody.pbf}%</strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono" id="print-secondary-inbody">
                    <div>
                      <span className="text-neutral-500 block text-[9px]">BMI</span>
                      <strong className="text-black font-semibold text-xs">{latestInBody.bmi}</strong>
                    </div>
                    <div>
                      <span className="text-neutral-500 block text-[9px]">BMR</span>
                      <strong className="text-black font-semibold text-xs">{latestInBody.bmr} kcal</strong>
                    </div>
                    <div>
                      <span className="text-neutral-500 block text-[9px]">VISCERAL LEVEL</span>
                      <strong className="text-black font-semibold text-xs">Level {latestInBody.visceralFat}</strong>
                    </div>
                    <div>
                      <span className="text-neutral-500 block text-[9px]">ECW/TBW</span>
                      <strong className="text-black font-semibold text-xs">{latestInBody.ecwTbw}</strong>
                    </div>
                  </div>

                  <div className="bg-neutral-100 p-3 rounded text-xs leading-normal italic font-mono text-neutral-700" id="print-interpretation-box">
                    <strong className="text-[#FF4D00]">AI Analyst Diagnostic:</strong> {latestInBody.interpretation}
                  </div>
                </div>
              ) : (
                <div className="pt-6 text-center text-xs text-neutral-400 border border-neutral-200 rounded p-4">
                  {lang === 'en' ? 'No InBody records registered for this profile.' : 'لا توجد مستندات قياسات مسجلة لهذا المشترك.'}
                </div>
              )
            )}

            {/* Active Goals Section */}
            {showGoals && (
              clientGoals.length > 0 ? (
                <div className="pt-8 space-y-4 print-break" id="print-goals">
                  <div className="flex items-center gap-1.5 border-b border-neutral-300 pb-1.5">
                    <Target className="w-4 h-4 text-[#FF4D00]" />
                    <h3 className="text-sm font-bold uppercase tracking-wider">
                      {lang === 'en' ? 'Athletic & Performance Milestones' : 'الأهداف ومؤشرات الإنجاز الرياضية'}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs" id="print-goals-grid">
                    {clientGoals.map(g => (
                      <div key={g.id} className="bg-neutral-50 p-3 rounded border border-neutral-200 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start">
                            <strong className="text-black text-[12px]">{lang === 'en' ? g.name : g.nameAr}</strong>
                            <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                              g.status === 'completed' ? 'bg-[#16C47F]/20 text-[#16C47F]' :
                              g.status === 'ahead' ? 'bg-blue-100 text-blue-600' :
                              g.status === 'behind' ? 'bg-red-100 text-red-650' : 'bg-yellow-100 text-yellow-600'
                            }`}>
                              {g.status.toUpperCase()}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-2 mt-2 font-mono text-[10px]">
                            <div>
                              <span className="text-neutral-400 block text-[8px]">START</span>
                              <span className="text-neutral-800 font-bold">{g.startValue} {g.unit}</span>
                            </div>
                            <div>
                              <span className="text-neutral-400 block text-[8px]">CURRENT</span>
                              <span className="text-neutral-800 font-bold">{g.currentValue} {g.unit}</span>
                            </div>
                            <div>
                              <span className="text-neutral-400 block text-[8px]">TARGET</span>
                              <span className="text-neutral-800 font-bold">{g.targetValue} {g.unit}</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-2.5">
                          <div className="w-full bg-neutral-200 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-[#FF4D00] h-full" style={{ width: `${Math.min(100, Math.max(0, g.completionRate))}%` }} />
                          </div>
                          <span className="text-[9px] text-[#FF4D00] font-bold block mt-1 font-mono text-right">{g.completionRate}% Done</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null
            )}

            {/* Workouts Sheet -> Breaks page if needed */}
            {showWorkouts && (
              <div className="pt-8 space-y-4 print-break" id="print-workouts">
                <div className="flex items-center gap-1.5 border-b border-neutral-300 pb-1.5">
                  <Dumbbell className="w-4 h-4 text-[#FF4D00]" />
                  <h3 className="text-sm font-bold uppercase tracking-wider">
                    {lang === 'en' ? 'Structured Physical Conditioning Split' : 'الجدول التدريبي لتطوير البناء العضلي'}
                  </h3>
                </div>

                {activeWorkout ? (
                  <div className="space-y-4" id="print-workouts-content">
                    <div className="flex items-center justify-between text-xs pb-1">
                      <strong className="text-black">{activeWorkout.name}</strong>
                      <span className="text-[10px] text-neutral-500 font-mono">
                        Template: {activeWorkout.templateType} ({activeWorkout.weeks} Weeks)
                      </span>
                    </div>

                    {activeWorkout.days.map((day) => (
                      <div key={day.id} className="space-y-1.5 bg-neutral-50 p-3.5 rounded border border-neutral-200 mb-2" id={`print-day-${day.id}`}>
                        <h4 className="text-[11px] font-bold text-[#FF4D00] uppercase tracking-wide border-b border-neutral-205 pb-1">
                          {day.name}
                        </h4>
                        
                        <div className="space-y-2 mt-2">
                          {day.exercises.length === 0 ? (
                            <span className="text-xs text-neutral-400 italic block">Rest or no structural movements.</span>
                          ) : (
                            day.exercises.map((wex, exIdx) => (
                              <div key={wex.id} className="text-xs flex items-start justify-between font-mono" id={`print-ex-${wex.id}`}>
                                <div className="space-y-0.5">
                                  <span className="text-black font-semibold">{exIdx + 1}. {lang === 'en' ? wex.name : wex.nameAr}</span>
                                  <p className="text-[9px] text-neutral-500 pl-4">Tempo: {wex.tempo} | {wex.notes}</p>
                                </div>
                                <span className="text-black text-[11px] whitespace-nowrap pl-2">
                                  {wex.sets.length} Sets x {wex.sets[0]?.reps || '8'} ({wex.sets[0]?.rest || '90s'} rest)
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-4 text-center text-xs text-neutral-500 border border-neutral-200 rounded">
                    No active workout blueprint generated for this report.
                  </div>
                )}
              </div>
            )}

            {/* Nutrition Sheet Section */}
            {showNutrition && (
              <div className="pt-8 space-y-4 print-break" id="print-nutrition">
                <div className="flex items-center gap-1.5 border-b border-neutral-300 pb-1.5">
                  <Apple className="w-4 h-4 text-[#FF4D00]" />
                  <h3 className="text-sm font-bold uppercase tracking-wider">
                    {lang === 'en' ? 'Target Metamorphic Nutrition parameters' : 'البرنامج الغذائي وسعرات الغذاء الدقيقة'}
                  </h3>
                </div>

                {activeNutrition ? (
                  <div className="space-y-4" id="print-nutrition-content">
                    
                    {/* Calorie Macro headers */}
                    <div className="grid grid-cols-4 gap-3 text-center text-xs" id="print-nutrition-stats">
                      <div className="bg-neutral-55 p-2.5 rounded border border-neutral-200">
                        <span className="text-[9px] text-neutral-500 block uppercase font-mono">Calorie Target</span>
                        <strong className="text-sm text-black font-mono block font-extrabold">{activeNutrition.calories} kcal</strong>
                      </div>
                      <div className="bg-neutral-55 p-2.5 rounded border border-neutral-200">
                        <span className="text-[9px] text-neutral-500 block uppercase font-mono">Protein (gr)</span>
                        <strong className="text-sm text-neutral-800 font-mono block font-extrabold">{activeNutrition.macros.protein}g</strong>
                      </div>
                      <div className="bg-neutral-55 p-2.5 rounded border border-neutral-200">
                        <span className="text-[9px] text-neutral-500 block uppercase font-mono">Carbohydrates</span>
                        <strong className="text-sm text-neutral-800 font-mono block font-extrabold">{activeNutrition.macros.carbs}g</strong>
                      </div>
                      <div className="bg-neutral-55 p-2.5 rounded border border-neutral-200">
                        <span className="text-[9px] text-neutral-500 block uppercase font-mono">Fat (gr)</span>
                        <strong className="text-sm text-neutral-800 font-mono block font-extrabold">{activeNutrition.macros.fat}g</strong>
                      </div>
                    </div>

                    <div className="bg-neutral-100 p-2 text-[10px] text-neutral-600 font-mono rounded" id="print-nutrition-tips">
                      <strong>Meal Timing Split:</strong> {activeNutrition.mealTiming}
                    </div>

                    {/* Meals listing */}
                    <div className="space-y-2" id="print-meals">
                      {activeNutrition.meals.map((meal, idx) => (
                        <div key={idx} className="bg-neutral-50 p-3 rounded border border-neutral-200 text-xs font-mono space-y-1" id={`print-meal-${idx}`}>
                          <div className="flex justify-between border-b border-neutral-205 pb-1">
                            <strong className="text-black">{meal.name}</strong>
                            <span className="text-neutral-500 text-[10px]">{meal.timing}</span>
                          </div>
                          <p className="text-neutral-700 leading-relaxed pt-1 text-[11px]">{meal.items.join(' • ')}</p>
                        </div>
                      ))}
                    </div>

                  </div>
                ) : (
                  <div className="py-4 text-center text-xs text-neutral-500 border border-neutral-200 rounded">
                    No active nutrition blueprint generated for this report.
                  </div>
                )}
              </div>
            )}

            {/* Checkins Section */}
            {showCheckins && (
              clientCheckins.length > 0 ? (
                <div className="pt-8 space-y-4 print-break" id="print-checkins">
                  <div className="flex items-center gap-1.5 border-b border-neutral-300 pb-1.5">
                    <ClipboardCheck className="w-4 h-4 text-[#FF4D00]" />
                    <h3 className="text-sm font-bold uppercase tracking-wider">
                      {lang === 'en' ? 'Recent Assessment & Habit Metrics Logs' : 'سجل التقييم والالتزام الأسبوعي الأخير'}
                    </h3>
                  </div>

                  <div className="space-y-3" id="print-checkins-content">
                    {clientCheckins.slice(0, 3).map((ch, idx) => (
                      <div key={ch.id || idx} className="bg-neutral-50 p-3 rounded border border-neutral-200 text-xs font-mono space-y-2">
                        <div className="flex justify-between items-center border-b border-neutral-200 pb-1">
                          <span className="text-black font-extrabold">{lang === 'en' ? `CHECK-IN DATE: ${ch.date}` : `تاريخ التقييم: ${ch.date}`}</span>
                          <span className="text-[10px] text-neutral-400">Week #{clientCheckins.length - idx}</span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px]" id="checkin-quick-stats">
                          <div>
                            <span className="text-[9px] text-neutral-400 block uppercase">Weight</span>
                            <strong className="text-neutral-800">{ch.weight} kg</strong>
                          </div>
                          <div>
                            <span className="text-[9px] text-neutral-400 block uppercase">Sleep Avg</span>
                            <strong className="text-neutral-800">{ch.sleepHours} hrs ({ch.sleepQuality}/5 stars)</strong>
                          </div>
                          <div>
                            <span className="text-[9px] text-neutral-400 block uppercase">Workout Compliance</span>
                            <strong className="text-neutral-805 font-bold text-[#FF4D00]">{ch.workoutAdherence}%</strong>
                          </div>
                          <div>
                            <span className="text-[9px] text-neutral-400 block uppercase">Nutrition Compliance</span>
                            <strong className="text-neutral-805 font-bold text-[#16C47F]">{ch.nutritionAdherence}%</strong>
                          </div>
                        </div>

                        {ch.additionalComments && (
                          <div className="text-[10.5px] italic text-neutral-600 border-l-2 border-neutral-300 pl-2 leading-relaxed pt-1">
                            " {ch.additionalComments} "
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null
            )}

            {/* Coach Directive Notes */}
            {showNotes && (
              clientNotes.length > 0 ? (
                <div className="pt-8 space-y-4 print-break" id="print-directive-notes">
                  <div className="flex items-center gap-1.5 border-b border-neutral-300 pb-1.5">
                    <MessageSquare className="w-4 h-4 text-[#FF4D00]" />
                    <h3 className="text-sm font-bold uppercase tracking-wider">
                      {lang === 'en' ? 'Coach Advisory Directives' : 'توجيهات وملاحظات الكوتش الفنية'}
                    </h3>
                  </div>

                  <div className="space-y-3" id="print-notes-list">
                    {clientNotes.map(n => (
                      <div key={n.id} className="bg-neutral-52 p-3.5 rounded border border-neutral-200 text-xs">
                        <div className="flex items-center justify-between font-mono pb-1 border-b border-neutral-100">
                          <strong className="text-black uppercase text-[11px]">{n.title}</strong>
                          <span className="text-[9px] text-neutral-400">{n.date}</span>
                        </div>
                        <p className="text-neutral-700 leading-relaxed pt-1.5 text-[11px] whitespace-pre-wrap">{n.content}</p>
                        
                        {n.tags.length > 0 && (
                          <div className="flex gap-1 pt-2 flex-wrap">
                            {n.tags.map(t => (
                              <span key={t} className="text-[8px] font-mono bg-neutral-150 text-neutral-600 px-1 py-0.5 rounded">
                                #{t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null
            )}

            {/* Print Sign Cover signatures footer */}
            <div className="pt-12 border-t-2 border-neutral-300 flex items-center justify-between text-xs font-mono print-break mt-12" id="print-signatures">
              <div>
                <span className="text-neutral-500 block text-[9px]">COACH DIRECTIVE SIGNATURE</span>
                <span className="text-black font-semibold uppercase block mt-1 tracking-wider">RepRise Certified S&C Coach</span>
              </div>
              <div className="text-right">
                <span className="text-neutral-500 block text-[9px]">DATE OF SUBMISSION</span>
                <span className="text-black font-semibold block mt-1">{new Date().toISOString().split('T')[0]}</span>
              </div>
            </div>

          </div>

        </div>
      ) : (
        <div className="bg-[#101010] border border-neutral-850 rounded-2xl p-8 text-center text-neutral-500" id="no-client-error">
          Register or select a client report.
        </div>
      )}

    </div>
  );
}
