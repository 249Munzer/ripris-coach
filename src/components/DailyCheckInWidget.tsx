/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Client, DailyCheckIn } from '../types';
import { getDailyCheckIns, saveDailyCheckIns } from '../storage/db';
import { 
  Smile, 
  Meh, 
  Frown, 
  Droplet, 
  Moon, 
  Sparkles,
  Check, 
  FileText, 
  Calendar, 
  Search,
  Activity,
  Apple,
  Dumbbell,
  ShieldCheck,
  Plus,
  Minus
} from 'lucide-react';

interface DailyCheckInWidgetProps {
  clients: Client[];
  lang: 'en' | 'ar';
}

const localT = {
  en: {
    title: "Daily Adherence Check-in",
    subtitle: "Quickly log and review bio-feedback parameters for active clients",
    selectClient: "Select Client",
    today: "Today",
    yesterday: "Yesterday",
    sleep: "Sleep Quality",
    mood: "Mood State",
    stress: "Stress Level",
    water: "Hydration Intake",
    workoutAdherence: "Workout Completed?",
    dietAdherence: "Diet compliance?",
    notes: "Coaching Notes / Remarks",
    notesPlaceholder: "Add context (e.g. extra fatigue, complains of mechanical joint strain, custom meal swaps)...",
    save: "Log Daily Adherence",
    update: "Update Log",
    edit: "Edit Log Entry",
    loggedToday: "Adherence Record Synced!",
    noLog: "No entry logged for this client yet",
    poor: "Poor Quality",
    average: "Average Sleep",
    good: "Restful & Decompressed",
    bad: "Stressed / Fatigued",
    neutral: "Stable / Balanced",
    highMood: "Excellent / Energized",
    low: "Low Stress",
    medium: "Moderate / Controlled",
    high: "High Neural Fatigue",
    completed: "Yes, Session Complete",
    missed: "No / Skipped Session",
    perfect: "100% On-Plan",
    deviated: "Off-Plan / Deviated",
    adherenceStats: "Daily Dashboard Diagnostics",
    clientsLogged: "Clients Logged Today",
    avgHydration: "Avg. Hydration Intake",
    predMood: "Predominant Mood",
    averageStress: "Predominant Neuro-Stress",
    liter: "Liters",
    searchPlaceholder: "Search student by name...",
    noActiveClients: "No active clients registered. Please create a client profile.",
    activeCheckinDate: "Active Log Date:",
    activeState: "Active Profile",
    viewHistory: "Review Checklist History"
  },
  ar: {
    title: "متابعة الالتزام واستثارة الاستشفاء",
    subtitle: "تسجيل فوري وتحليل فسيولوجي للنوم، والمزاج، والترطيب لجميع المشتركين النشطين",
    selectClient: "اختر المشترك النشط",
    today: "اليوم",
    yesterday: "الأمس",
    sleep: "جودة واستقرار النوم",
    mood: "الحالة العصبية والمزاجية",
    stress: "مستوى الإجهاد والضغط العصبي",
    water: "معدل شرب الماء اليومي",
    workoutAdherence: "هل تم إكمال الحصة التدريبية؟",
    dietAdherence: "الالتزام بالجدول الغذائي؟",
    notes: "ملاحظات وتوجيهات الكوتش اليومية",
    notesPlaceholder: "سجل أي طارئ (مثل: إرهاق مفرط، آلام ميكانيكية بالمفاصل، تعديل السعرات)...",
    save: "تسجيل المتابعة وحفظ الاتزان",
    update: "تحديث تقييم اليوم",
    edit: "تعديل المتابعة اليومية",
    loggedToday: "تم مزامنة حالة المشترك لليوم!",
    noLog: "لم تسجل حالة المشترك لهذا اليوم بعد",
    poor: "نوم مضطرب / سيء",
    average: "نوم متوسط الاستشفاء",
    good: "نوم عميق ومثالي",
    bad: "مزاج متوتر / مرهق",
    neutral: "حالة معتدلة ومتزنة",
    highMood: "طاقة مرتفعة وحماس مميز",
    low: "إجهاد عصبي منخفض",
    medium: "إجهاد متوسط ومتحكم به",
    high: "إجهاد عصبي مركزي مرتفع",
    completed: "نعم، تم إتمام التمرين",
    missed: "لا / يوم استشفاء أو تفويت",
    perfect: "التزام كامل بالدايت",
    deviated: "تجاوز السعرات أو تخطى الخطة",
    adherenceStats: "تشخيصات تفاعل الالتزام لليوم",
    clientsLogged: "عدد المشتركين المسجلين",
    avgHydration: "متوسط شرب الماء",
    predMood: "الاندفاع المزاجي العام",
    averageStress: "معدل الإجهاد الإجمالي",
    liter: "لتر",
    searchPlaceholder: "ابحث عن ملف مشترك نشط...",
    noActiveClients: "لا يوجد مشتركين نشطين. يرجى تسجيل مشترك أولاً.",
    activeCheckinDate: "تاريخ المتابعة الحالي:",
    activeState: "الملف النشط",
    viewHistory: "مراجعة تقييم الأيام الماضية"
  }
};

export default function DailyCheckInWidget({ clients, lang }: DailyCheckInWidgetProps) {
  const isRtl = lang === 'ar';
  const lt = localT[lang];

  // System local time setup for dates
  const getLocalDateString = (offsetDays = 0) => {
    const d = new Date();
    if (offsetDays !== 0) {
      d.setDate(d.getDate() - offsetDays);
    }
    return d.toISOString().split('T')[0];
  };

  const activeClients = clients.filter(c => c.status === 'active');
  
  // State variables
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [targetDateOffset, setTargetDateOffset] = useState<number>(0); // 0 = Today, 1 = Yesterday
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dailyLogs, setDailyLogs] = useState<DailyCheckIn[]>([]);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Form states matching client check-in variables
  const [sleep, setSleep] = useState<'poor' | 'average' | 'good'>('average');
  const [mood, setMood] = useState<'bad' | 'neutral' | 'good'>('neutral');
  const [stress, setStress] = useState<'low' | 'medium' | 'high'>('medium');
  const [waterLitres, setWaterLitres] = useState<number>(2.5);
  const [workoutCompleted, setWorkoutCompleted] = useState<boolean>(true);
  const [nutritionAdhered, setNutritionAdhered] = useState<boolean>(true);
  const [coachNotes, setCoachNotes] = useState<string>('');

  // Hydrate actual saved daily logs on mount & update selected client
  useEffect(() => {
    const saved = getDailyCheckIns();
    setDailyLogs(saved);
    if (activeClients.length > 0 && !selectedClientId) {
      setSelectedClientId(activeClients[0].id);
    }
  }, [clients]);

  // Load selected client's log for the selected target date
  const activeDate = getLocalDateString(targetDateOffset);
  const existingLog = dailyLogs.find(l => l.clientId === selectedClientId && l.date === activeDate);

  useEffect(() => {
    if (existingLog) {
      setSleep(existingLog.sleep);
      setMood(existingLog.mood);
      setStress(existingLog.stress);
      setWaterLitres(existingLog.waterLitres);
      setWorkoutCompleted(!!existingLog.workoutCompleted);
      setNutritionAdhered(!!existingLog.nutritionAdhered);
      setCoachNotes(existingLog.notes || '');
      setIsEditing(false);
    } else {
      // Setup smart defaults based on the client's baseline profiles if possible
      const client = activeClients.find(c => c.id === selectedClientId);
      if (client) {
        setSleep(client.sleep === 'poor' ? 'poor' : client.sleep === 'good' ? 'good' : 'average');
        setStress(client.stress === 'low' ? 'low' : client.stress === 'high' ? 'high' : 'medium');
      } else {
        setSleep('average');
        setStress('medium');
      }
      setMood('neutral');
      setWaterLitres(3.0);
      setWorkoutCompleted(true);
      setNutritionAdhered(true);
      setCoachNotes('');
      setIsEditing(true);
    }
  }, [selectedClientId, targetDateOffset, dailyLogs]);

  // Save/Update daily checklist action
  const handleSaveLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) return;

    const logId = existingLog?.id || `d_log_${selectedClientId}_${activeDate}`;
    const entry: DailyCheckIn = {
      id: logId,
      clientId: selectedClientId,
      date: activeDate,
      sleep,
      mood,
      waterLitres,
      stress,
      notes: coachNotes.trim(),
      workoutCompleted,
      nutritionAdhered
    };

    const updatedLogs = [...dailyLogs.filter(l => l.id !== logId), entry];
    setDailyLogs(updatedLogs);
    saveDailyCheckIns(updatedLogs);

    setIsEditing(false);
  };

  // Quick increment/decrement for hydration L
  const adjustWater = (amount: number) => {
    if (!isEditing) return;
    setWaterLitres(prev => {
      const val = Math.round((prev + amount) * 10) / 10;
      return Math.min(Math.max(val, 0), 10);
    });
  };

  // Search filtered clients
  const filteredClients = activeClients.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Compute Today's Dashboard stats
  const todayDate = getLocalDateString(0);
  const todayLogs = dailyLogs.filter(l => l.date === todayDate);
  const loggedCount = todayLogs.length;
  const loggedPercentage = activeClients.length > 0 ? Math.round((loggedCount / activeClients.length) * 100) : 0;
  
  const avgWater = todayLogs.length > 0 
    ? (todayLogs.reduce((sum, l) => sum + l.waterLitres, 0) / todayLogs.length).toFixed(1)
    : '0.0';

  const computePredominantMood = () => {
    if (todayLogs.length === 0) return '—';
    const counts = { good: 0, neutral: 0, bad: 0 };
    todayLogs.forEach(l => counts[l.mood] = (counts[l.mood] || 0) + 1);
    if (counts.good >= counts.neutral && counts.good >= counts.bad) {
      return lang === 'en' ? '😊 Energetic' : '😊 نشيط ومتحمس';
    } else if (counts.neutral >= counts.bad) {
      return lang === 'en' ? '😐 Stable' : '😐 معتدل ومتزن';
    } else {
      return lang === 'en' ? '😣 Tired' : '😣 مرهق ومتوتر';
    }
  };

  const computeAvgStress = () => {
    if (todayLogs.length === 0) return '—';
    const counts = { low: 0, medium: 0, high: 0 };
    todayLogs.forEach(l => counts[l.stress] = (counts[l.stress] || 0) + 1);
    if (counts.low >= counts.medium && counts.low >= counts.high) {
      return lang === 'en' ? '🟢 Low Tension' : '🟢 إجهاد منخفض';
    } else if (counts.medium >= counts.high) {
      return lang === 'en' ? '🟡 Moderate stress' : '🟡 إجهاد متوسط';
    } else {
      return lang === 'en' ? '🔴 High fatigue' : '🔴 إجهاد عالي';
    }
  };

  // Find currently selected client profile details
  const selectedClient = activeClients.find(c => c.id === selectedClientId);

  return (
    <div className="bg-[#101010] border border-neutral-850 rounded-2xl p-5" id="daily-checkin-wrapper">
      {/* Widget Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-850 pb-5" id="daily-checkin-header">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-[#16C47F] animate-pulse" />
            <h3 className="text-base font-sans font-bold text-white uppercase tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#16C47F]" />
              {lt.title}
            </h3>
          </div>
          <p className="text-xs text-neutral-400 capitalize">{lt.subtitle}</p>
        </div>

        {/* Date Selection Toggles */}
        <div className="flex bg-neutral-950 p-1.5 rounded-xl border border-neutral-800 shrink-0 self-start sm:self-center" id="date-toggle-deck">
          <button
            onClick={() => setTargetDateOffset(0)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              targetDateOffset === 0 
                ? 'bg-neutral-800 text-white shadow-md' 
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            {lt.today}
          </button>
          <button
            onClick={() => setTargetDateOffset(1)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              targetDateOffset === 1 
                ? 'bg-neutral-800 text-white shadow-md' 
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            {lt.yesterday}
          </button>
        </div>
      </div>

      {activeClients.length === 0 ? (
        <div className="py-12 text-center text-xs text-neutral-500" id="daily-checkin-no-clients">
          {lt.noActiveClients}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-5" id="daily-checkin-grid">
          
          {/* LEFT PANEL: Client Selector Strip (3 cols) */}
          <div className="lg:col-span-4 flex flex-col space-y-4" id="daily-checkin-sidebar">
            <div className="relative" id="client-search-wrapper">
              <span className="absolute inset-y-0 left-3 flex items-center text-neutral-500">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={lt.searchPlaceholder}
                className="w-full text-xs font-sans font-medium text-white bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 pl-9 pr-3 focus:outline-none focus:border-[#FF4D00] transition-colors"
              />
            </div>

            {/* List scroll of clients */}
            <div className="max-h-[340px] overflow-y-auto space-y-2 pr-1" id="client-adherence-list">
              {filteredClients.map((client) => {
                const logsToday = dailyLogs.some(
                  l => l.clientId === client.id && l.date === activeDate
                );

                return (
                  <button
                    key={client.id}
                    onClick={() => {
                      setSelectedClientId(client.id);
                      setIsEditing(false);
                    }}
                    className={`w-full text-left p-3 rounded-xl border flex items-center justify-between transition-colors ${
                      selectedClientId === client.id
                        ? 'bg-neutral-900 border-[#FF4D00]'
                        : 'bg-neutral-950 border-neutral-850 hover:bg-neutral-900/50 hover:border-neutral-750'
                    }`}
                    id={`checkin-cl-${client.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-neutral-800 to-neutral-700 text-white font-bold text-xs flex items-center justify-center">
                        {client.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-white block truncate">{client.name}</span>
                        <span className="text-[9px] text-neutral-400 font-mono tracking-wider">
                          {client.goal.length > 22 ? `${client.goal.slice(0, 20)}...` : client.goal}
                        </span>
                      </div>
                    </div>

                    {/* Completion indicator */}
                    <div className="shrink-0 pl-1">
                      {logsToday ? (
                        <span className="inline-flex h-5 w-5 rounded-full bg-[#16C47F]/10 border border-[#16C47F]/20 text-[#16C47F] items-center justify-center">
                          <Check className="w-3 h-3 stroke-[2.5]" />
                        </span>
                      ) : (
                        <span className="inline-block h-2 w-2 rounded-full bg-neutral-800 border border-neutral-700" />
                      )}
                    </div>
                  </button>
                );
              })}
              {filteredClients.length === 0 && (
                <div className="py-6 text-center text-[10px] text-neutral-500">
                  {lang === 'en' ? 'No matching profiles found.' : 'لا يوجد نتائج مطابقة للبحث.'}
                </div>
              )}
            </div>

            {/* Micro diagnostic reports */}
            <div className="bg-neutral-950 border border-neutral-850 rounded-xl p-3.5 space-y-3" id="daily-checkin-analytics font-sans">
              <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest pt-0.5">{lt.adherenceStats}</h4>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-500 font-medium">{lt.clientsLogged}</span>
                  <span className="font-mono font-bold text-white">{loggedCount} / {activeClients.length} <span className="text-neutral-500 font-normal">({loggedPercentage}%)</span></span>
                </div>
                <div className="w-full bg-neutral-900 h-1 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full rounded-full" style={{ width: `${loggedPercentage}%` }} />
                </div>

                <div className="flex justify-between items-center text-xs pt-1">
                  <span className="text-neutral-500 font-medium">{lt.avgHydration}</span>
                  <span className="font-mono font-bold text-[#FF4D00] flex items-center gap-1">
                    <Droplet className="w-3.5 h-3.5 text-blue-400" />
                    {avgWater} {lt.liter}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-500 font-medium">{lt.predMood}</span>
                  <span className="font-semibold text-white">{computePredominantMood()}</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-500 font-medium">{lt.averageStress}</span>
                  <span className="font-semibold text-white">{computeAvgStress()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL: Details & Log forms (8 cols) */}
          <div className="lg:col-span-8 bg-neutral-950/70 border border-neutral-850 rounded-xl p-4 sm:p-5 flex flex-col justify-between" id="daily-checkin-main-panel">
            {selectedClient ? (
              <form onSubmit={handleSaveLog} className="space-y-5">
                {/* Panel Sub-header */}
                <div className="flex items-center justify-between border-b border-neutral-850 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-500 font-medium">{lt.activeCheckinDate}</span>
                    <span className="text-xs font-mono font-bold text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-full inline-block">{activeDate}</span>
                  </div>

                  {existingLog && !isEditing && (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="text-xs font-sans font-bold text-[#FF4D00] hover:text-[#E04400] transition-colors border border-[#FF4D00]/25 rounded-lg px-2.5 py-1 hover:bg-[#FF4D00]/5"
                    >
                      {lt.edit}
                    </button>
                  )}
                </div>

                {existingLog && !isEditing ? (
                  /* REVIEW EXCEL DATA MODE */
                  <div className="space-y-5" id="checkin-review-mode">
                    <div className="p-3 bg-emerald-950/20 border border-emerald-900/35 rounded-xl flex items-center gap-2.5 text-[#16C47F] text-xs">
                      <ShieldCheck className="w-4 h-4 shrink-0" />
                      <span>{lt.loggedToday} ({selectedClient.name})</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Sleep Value Card */}
                      <div className="bg-neutral-900/50 border border-neutral-850 rounded-xl p-3.5 space-y-2">
                        <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold font-display flex items-center gap-1.5">
                          <Moon className="w-3.5 h-3.5 text-blue-400" />
                          {lt.sleep}
                        </span>
                        <div className="text-xs sm:text-sm font-semibold text-white">
                          {existingLog.sleep === 'good' && `🟢 ${lt.good}`}
                          {existingLog.sleep === 'average' && `🟡 ${lt.average}`}
                          {existingLog.sleep === 'poor' && `🔴 ${lt.poor}`}
                        </div>
                      </div>

                      {/* Stress Value Card */}
                      <div className="bg-neutral-900/50 border border-neutral-850 rounded-xl p-3.5 space-y-2">
                        <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold font-display flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-amber-500" />
                          {lt.stress}
                        </span>
                        <div className="text-xs sm:text-sm font-semibold text-white">
                          {existingLog.stress === 'low' && `🟢 ${lt.low}`}
                          {existingLog.stress === 'medium' && `🟡 ${lt.medium}`}
                          {existingLog.stress === 'high' && `🔴 ${lt.high}`}
                        </div>
                      </div>

                      {/* Mood Value Card */}
                      <div className="bg-neutral-900/50 border border-neutral-850 rounded-xl p-3.5 space-y-2">
                        <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold font-display flex items-center gap-1.5 flex-row">
                          <Smile className="w-3.5 h-3.5 text-green-400" />
                          {lt.mood}
                        </span>
                        <div className="text-xs sm:text-sm font-semibold text-white leading-none">
                          {existingLog.mood === 'good' && `😊 ${lt.highMood}`}
                          {existingLog.mood === 'neutral' && `😐 ${lt.neutral}`}
                          {existingLog.mood === 'bad' && `😣 ${lt.bad}`}
                        </div>
                      </div>

                      {/* Hydration Value Card */}
                      <div className="bg-neutral-900/50 border border-neutral-850 rounded-xl p-3.5 space-y-2">
                        <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold font-display flex items-center gap-1.5">
                          <Droplet className="w-3.5 h-3.5 text-blue-400" />
                          {lt.water}
                        </span>
                        <div className="text-xs sm:text-sm font-semibold text-white font-mono flex items-center gap-1.5">
                          {existingLog.waterLitres} {lt.liter}
                        </div>
                      </div>
                    </div>

                    {/* Binary Adherence Flags */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" id="binary-flags-review">
                      <div className="bg-neutral-900/30 border border-neutral-850 rounded-xl p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Dumbbell className="w-4 h-4 text-[#FF4D00]" />
                          <span className="text-xs text-neutral-300 font-medium">{lt.workoutAdherence}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          existingLog.workoutCompleted 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15'
                            : 'bg-neutral-850 text-neutral-500 border border-neutral-800'
                        }`}>
                          {existingLog.workoutCompleted ? (lang === 'en' ? 'Completed' : 'مكتمل') : (lang === 'en' ? 'Missed / Rest' : 'مفوت / راحة')}
                        </span>
                      </div>

                      <div className="bg-neutral-900/30 border border-neutral-850 rounded-xl p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Apple className="w-4 h-4 text-emerald-500" />
                          <span className="text-xs text-neutral-300 font-medium">{lt.dietAdherence}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          existingLog.nutritionAdhered
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15'
                            : 'bg-red-500/10 text-red-400 border border-red-500/15'
                        }`}>
                          {existingLog.nutritionAdhered ? (lang === 'en' ? 'In Compliance' : 'ملتزم') : (lang === 'en' ? 'Deviated' : 'غير ملتزم')}
                        </span>
                      </div>
                    </div>

                    {/* notes segment */}
                    {existingLog.notes && (
                      <div className="bg-neutral-900/40 border border-neutral-850 rounded-xl p-3.5 space-y-1.5" id="review-notes-segment">
                        <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold block">{lt.notes}</span>
                        <p className="text-xs text-neutral-300 italic whitespace-pre-wrap leading-relaxed">
                          "{existingLog.notes}"
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  /* EDIT / WRITE MODE */
                  <div className="space-y-5" id="checkin-edit-mode">
                    {/* Sleep select */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-neutral-400 block">{lt.sleep}</label>
                      <div className="grid grid-cols-3 gap-2.5">
                        <button
                          type="button"
                          onClick={() => setSleep('poor')}
                          className={`py-2 px-3 text-xs font-medium rounded-xl border text-center transition-all ${
                            sleep === 'poor'
                              ? 'bg-red-950/20 border-red-500 text-red-400 shadow-md'
                              : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                          }`}
                        >
                          🔴 {lang === 'en' ? 'Poor' : 'سيء'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setSleep('average')}
                          className={`py-2 px-3 text-xs font-medium rounded-xl border text-center transition-all ${
                            sleep === 'average'
                              ? 'bg-amber-950/20 border-amber-500 text-amber-400 shadow-md'
                              : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                          }`}
                        >
                          🟡 {lang === 'en' ? 'Average' : 'متوسط'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setSleep('good')}
                          className={`py-2 px-3 text-xs font-medium rounded-xl border text-center transition-all ${
                            sleep === 'good'
                              ? 'bg-emerald-950/20 border-emerald-500 text-emerald-400 shadow-md'
                              : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                          }`}
                        >
                          🟢 {lang === 'en' ? 'Resilient' : 'ممتاز'}
                        </button>
                      </div>
                    </div>

                    {/* Stress State selector */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-neutral-400 block">{lt.stress}</label>
                      <div className="grid grid-cols-3 gap-2.5">
                        <button
                          type="button"
                          onClick={() => setStress('low')}
                          className={`py-2 px-3 text-xs font-medium rounded-xl border text-center transition-all ${
                            stress === 'low'
                              ? 'bg-emerald-950/20 border-emerald-500 text-emerald-400 shadow-md'
                              : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                          }`}
                        >
                          🟢 {lang === 'en' ? 'Low Tension' : 'منخفض'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setStress('medium')}
                          className={`py-2 px-3 text-xs font-medium rounded-xl border text-center transition-all ${
                            stress === 'medium'
                              ? 'bg-amber-950/20 border-amber-500 text-amber-400 shadow-md'
                              : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                          }`}
                        >
                          🟡 {lang === 'en' ? 'Moderate' : 'متوسط'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setStress('high')}
                          className={`py-2 px-3 text-xs font-medium rounded-xl border text-center transition-all ${
                            stress === 'high'
                              ? 'bg-red-950/20 border-red-500 text-red-500 shadow-md'
                              : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                          }`}
                        >
                          🔴 {lang === 'en' ? 'Overloaded' : 'مرتفع'}
                        </button>
                      </div>
                    </div>

                    {/* Mood select */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-neutral-400 block">{lt.mood}</label>
                      <div className="grid grid-cols-3 gap-2.5">
                        <button
                          type="button"
                          onClick={() => setMood('bad')}
                          className={`py-2 px-3 text-xs font-medium rounded-xl border text-center transition-all ${
                            mood === 'bad'
                              ? 'bg-red-950/15 border-red-500/40 text-red-400 shadow-md animate-pulse'
                              : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                          }`}
                        >
                          😣 {lang === 'en' ? 'Fatigued' : 'سيء'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setMood('neutral')}
                          className={`py-2 px-3 text-xs font-medium rounded-xl border text-center transition-all ${
                            mood === 'neutral'
                              ? 'bg-neutral-900 border-neutral-750 text-neutral-300 shadow-md'
                              : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                          }`}
                        >
                          😐 {lang === 'en' ? 'Balanced' : 'طبيعي'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setMood('good')}
                          className={`py-2 px-3 text-xs font-medium rounded-xl border text-center transition-all ${
                            mood === 'good'
                              ? 'bg-[#16C47F]/10 border-[#16C47F] text-[#16C47F] shadow-md'
                              : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                          }`}
                        >
                          😊 {lang === 'en' ? 'Excellent' : 'ممتاز'}
                        </button>
                      </div>
                    </div>

                    {/* Hydration (with interactive droplet controls) */}
                    <div className="bg-neutral-900/30 border border-neutral-850 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-neutral-400 flex items-center gap-1.5">
                          <Droplet className="w-4 h-4 text-blue-400 animate-bounce" />
                          {lt.water}
                        </label>
                        <span className="text-xs font-mono font-bold text-white bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
                          {waterLitres.toFixed(1)} {lt.liter}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => adjustWater(-0.5)}
                          className="p-2 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-neutral-300 transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <div className="flex-1 bg-neutral-950 h-5 border border-neutral-850 rounded-lg overflow-hidden relative">
                          <div 
                            className="bg-gradient-to-r from-blue-600 to-blue-400 h-full rounded-l transition-all duration-300"
                            style={{ width: `${Math.min((waterLitres / 5.0) * 100, 100)}%` }}
                          />
                          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono text-neutral-500">
                            {waterLitres >= 3.0 ? 'Optimal Intake Target' : 'Increments of 0.5L'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => adjustWater(0.5)}
                          className="p-2 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-neutral-300 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Checkbox toggles for Workouts and Nutrition */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-1" id="log-checkouts">
                      <button
                        type="button"
                        onClick={() => setWorkoutCompleted(prev => !prev)}
                        className={`p-3.5 rounded-xl border flex items-center justify-between text-left transition-all ${
                          workoutCompleted
                            ? 'bg-neutral-900 border-[#FF4D00]'
                            : 'bg-neutral-950 border-neutral-850'
                        }`}
                      >
                        <span className="text-xs text-neutral-300 font-semibold">{lt.workoutAdherence}</span>
                        <div className={`h-5 w-5 rounded border ${
                          workoutCompleted
                            ? 'bg-[#FF4D00] border-[#FF4D00] text-white'
                            : 'border-neutral-700 bg-neutral-950'
                        } flex items-center justify-center`}>
                          {workoutCompleted && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setNutritionAdhered(prev => !prev)}
                        className={`p-3.5 rounded-xl border flex items-center justify-between text-left transition-all ${
                          nutritionAdhered
                            ? 'bg-neutral-900 border-emerald-500'
                            : 'bg-neutral-950 border-neutral-850'
                        }`}
                      >
                        <span className="text-xs text-neutral-300 font-semibold">{lt.dietAdherence}</span>
                        <div className={`h-5 w-5 rounded border ${
                          nutritionAdhered
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'border-neutral-700 bg-neutral-950'
                        } flex items-center justify-center`}>
                          {nutritionAdhered && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </button>
                    </div>

                    {/* Custom Remarks Notes Textbox */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-neutral-400 block">{lt.notes}</label>
                      <textarea
                        value={coachNotes}
                        onChange={(e) => setCoachNotes(e.target.value)}
                        placeholder={lt.notesPlaceholder}
                        rows={3}
                        className="w-full text-xs font-sans font-medium text-white bg-[#0a0a0a] border border-neutral-800 rounded-xl p-3 focus:outline-none focus:border-[#FF4D00] transition-colors resize-none leading-relaxed"
                      />
                    </div>

                    {/* Commit Save Action Button */}
                    <div className="pt-2 flex justify-end gap-3">
                      {existingLog && (
                        <button
                          type="button"
                          onClick={() => setIsEditing(false)}
                          className="px-4 py-2 bg-neutral-850 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 font-medium rounded-xl text-xs transition-colors cursor-pointer"
                        >
                          {lang === 'en' ? 'Discard Changes' : 'إلغاء التعديلات'}
                        </button>
                      )}
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-[#FF4D00] hover:bg-[#E04400] text-white font-semibold rounded-xl text-xs tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                      >
                        <Sparkles className="w-4 h-4" />
                        {existingLog ? lt.update : lt.save}
                      </button>
                    </div>
                  </div>
                )}
              </form>
            ) : (
              <div className="py-20 text-center text-xs text-neutral-500">
                {lt.selectClient}
              </div>
            )}
          </div>
          
        </div>
      )}
    </div>
  );
}
