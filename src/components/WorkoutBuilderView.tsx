/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Client, WorkoutPlan, WorkoutDay, WorkoutExercise, Exercise, SetTemplate } from '../types';
import { EXERCISE_DATABASE } from '../data/exercises';
import { 
  Dumbbell, 
  Sparkles, 
  Plus, 
  Trash2, 
  Search, 
  Layers, 
  Play, 
  CornerDownRight, 
  ArrowUpRight,
  UserCheck,
  Check,
  Zap,
  Info,
  X
} from 'lucide-react';

import { AIOutputFormatter } from './AIOutputFormatter';

interface WorkoutBuilderViewProps {
  clients: Client[];
  workouts: WorkoutPlan[];
  lang: 'en' | 'ar';
  t: any;
  onSaveWorkout: (workout: WorkoutPlan) => void;
  activeSelectedClientId?: string;
}

export const TRAINING_TEMPLATES = [
  "Upper Lower", 
  "Push Pull Legs", 
  "Full Body", 
  "Arnold Split", 
  "PHUL", 
  "Powerbuilding", 
  "Women's Programs", 
  "Home Options", 
  "Rehabilitation"
];

export default function WorkoutBuilderView({
  clients,
  workouts,
  lang,
  t,
  onSaveWorkout,
  activeSelectedClientId
}: WorkoutBuilderViewProps) {
  const [selectedClientId, setSelectedClientId] = useState<string>(
    activeSelectedClientId || (clients[0]?.id || '')
  );

  const selectedClient = clients.find(c => c.id === selectedClientId);

  // Active workout plan for selected client (preferring explicitly active ones)
  const activePlan = workouts.find(w => w.clientId === selectedClientId && w.isActive) ||
                     workouts.find(w => w.clientId === selectedClientId);

  const [loadingAI, setLoadingAI] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("Upper Lower");
  const [aiError, setAiError] = useState<string | null>(null);

  // Search & add states
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [targetDayIdForAdd, setTargetDayIdForAdd] = useState<string | null>(null);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Chest' | 'Back' | 'Quads' | 'Hamstrings' | 'Shoulders' | 'Arms'>('All');

  // Multi-lingual exercise filter
  const filteredExercises = EXERCISE_DATABASE.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(exerciseSearch.toLowerCase()) || 
                          ex.nameAr.includes(exerciseSearch);
    const matchesCategory = selectedCategory === 'All' || ex.muscle === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAIMinusProgram = async () => {
    if (!selectedClient) return;
    setLoadingAI(true);
    setAiError(null);
    try {
      const res = await fetch('/api/coach-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: 'generate_workout',
          clientData: selectedClient,
          workoutConfig: { splitType: selectedTemplate }
        })
      });
      const data = await res.json();
      if (res.ok && data.result) {
        // Construct verified WorkoutPlan object
        const program: WorkoutPlan = {
          id: `wp_${Date.now()}`,
          clientId: selectedClientId,
          name: data.result.name || `Custom ${selectedTemplate} Program`,
          templateType: data.result.templateType || selectedTemplate,
          weeks: data.result.weeks || 8,
          notes: data.result.notes || "Adjust parameters dynamically according to daily biofeedback.",
          days: data.result.days || [],
          createdAt: new Date().toISOString()
        };
        onSaveWorkout(program);
      } else {
        const errMsg = data.error || (lang === 'en' ? "AI Coach could not generate template." : "لم يتمكن المساعد الذكي من تكوين الجدول بنجاح.");
        setAiError(errMsg);
      }
    } catch (e: any) {
      console.error(e);
      setAiError(e.message || String(e));
    } finally {
      setLoadingAI(false);
    }
  };

  // Manual actions
  const handleDeleteDay = (dayId: string) => {
    if (!activePlan) return;
    const updatedDays = activePlan.days.filter(d => d.id !== dayId);
    onSaveWorkout({ ...activePlan, days: updatedDays });
  };

  const handleAddDay = () => {
    if (!activePlan) return;
    const newDay: WorkoutDay = {
      id: `day_${Date.now()}`,
      name: lang === 'en' ? `Day ${activePlan.days.length + 1}: Custom split` : `اليوم ${activePlan.days.length + 1}: تمرين مخصص`,
      exercises: []
    };
    onSaveWorkout({ ...activePlan, days: [...activePlan.days, newDay] });
  };

  const handleDeleteExercise = (dayId: string, itemIdx: number) => {
    if (!activePlan) return;
    const updatedDays = activePlan.days.map(d => {
      if (d.id === dayId) {
        const copy = [...d.exercises];
        copy.splice(itemIdx, 1);
        return { ...d, exercises: copy };
      }
      return d;
    });
    onSaveWorkout({ ...activePlan, days: updatedDays });
  };

  const handleAddSetToExercise = (dayId: string, exIdx: number) => {
    if (!activePlan) return;
    const updatedDays = activePlan.days.map(d => {
      if (d.id === dayId) {
        const copy = [...d.exercises];
        const newSet: SetTemplate = {
          id: `set_${Date.now()}`,
          reps: "10",
          weight: "---",
          rpe: 8,
          rir: 2,
          rest: "90s",
          type: "working"
        };
        copy[exIdx].sets.push(newSet);
        return { ...d, exercises: copy };
      }
      return d;
    });
    onSaveWorkout({ ...activePlan, days: updatedDays });
  };

  const handleDeleteSetFromExercise = (dayId: string, exIdx: number, setIdx: number) => {
    if (!activePlan) return;
    const updatedDays = activePlan.days.map(d => {
      if (d.id === dayId) {
        const copyEx = [...d.exercises];
        copyEx[exIdx].sets.splice(setIdx, 1);
        return { ...d, exercises: copyEx };
      }
      return d;
    });
    onSaveWorkout({ ...activePlan, days: updatedDays });
  };

  const handleSelectExerciseFromLib = (ex: Exercise) => {
    if (!activePlan || !targetDayIdForAdd) return;

    const newEx: WorkoutExercise = {
      id: `wpe_${Date.now()}`,
      exerciseId: ex.id,
      name: ex.name,
      nameAr: ex.nameAr,
      sets: [
        { id: `s_${Date.now()}_1`, reps: "8-10", weight: "---", rpe: 8, rir: 2, rest: "90s", type: "working" },
        { id: `s_${Date.now()}_2`, reps: "8-10", weight: "---", rpe: 8, rir: 2, rest: "90s", type: "working" }
      ],
      tempo: "3-1-1-0",
      notes: lang === 'en' ? "Control the concentric motion." : "تثبيت التحكم عند العصر الحركي التام."
    };

    const updatedDays = activePlan.days.map(d => {
      if (d.id === targetDayIdForAdd) {
        return { ...d, exercises: [...d.exercises, newEx] };
      }
      return d;
    });

    onSaveWorkout({ ...activePlan, days: updatedDays });
    setIsLibraryOpen(false);
    setTargetDayIdForAdd(null);
  };

  const updateSetProperty = (dayId: string, exIdx: number, setIdx: number, field: keyof SetTemplate, val: any) => {
    if (!activePlan) return;
    const updatedDays = activePlan.days.map(d => {
      if (d.id === dayId) {
        const copyEx = [...d.exercises];
        const copySet = [...copyEx[exIdx].sets];
        copySet[setIdx] = { ...copySet[setIdx], [field]: val };
        copyEx[exIdx] = { ...copyEx[exIdx], sets: copySet };
        return { ...d, exercises: copyEx };
      }
      return d;
    });
    onSaveWorkout({ ...activePlan, days: updatedDays });
  };

  const handleUpdateNotes = (dayId: string, exIdx: number, text: string) => {
    if (!activePlan) return;
    const updatedDays = activePlan.days.map(d => {
      if (d.id === dayId) {
        const copyEx = [...d.exercises];
        copyEx[exIdx] = { ...copyEx[exIdx], notes: text };
        return { ...d, exercises: copyEx };
      }
      return d;
    });
    onSaveWorkout({ ...activePlan, days: updatedDays });
  };

  // Find all programs for the selected client to show in history section
  const clientWorkouts = workouts.filter(w => w.clientId === selectedClientId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleActivateVersionDirect = (plan: WorkoutPlan) => {
    onSaveWorkout({ ...plan, isActive: true, isArchived: false });
  };

  const handleDuplicateVersionDirect = (plan: WorkoutPlan) => {
    const maxVer = clientWorkouts.reduce((max, w) => Math.max(max, w.version || 1), 0);
    const nextVer = maxVer + 1;
    const duplicated: WorkoutPlan = {
      ...plan,
      id: `wp_${Date.now()}`,
      name: `${plan.name.replace(/\s*\(V\d+\)/g, '')} (V${nextVer})`,
      version: nextVer,
      isActive: false,
      isArchived: false,
      createdAt: new Date().toISOString()
    };
    onSaveWorkout(duplicated);
  };

  const handleCreateNewBlankPlan = () => {
    const maxVer = clientWorkouts.reduce((max, w) => Math.max(max, w.version || 1), 0);
    const nextVer = maxVer + 1;
    const newPlan: WorkoutPlan = {
      id: `wp_${Date.now()}`,
      clientId: selectedClientId,
      name: lang === 'en' ? `Workout Program V${nextVer}` : `جدول التمارين إصدار ${nextVer}`,
      templateType: "Split",
      weeks: 8,
      notes: lang === 'en' ? "Focus on progressive overload." : "تركيز على زيادة الحمل التدريجي الثنائي المستمر.",
      days: [
        {
          id: `day_${Date.now()}`,
          name: lang === 'en' ? "Day 1: Upper Split" : "اليوم 1: تمرين الجزء العلوي",
          exercises: []
        }
      ],
      version: nextVer,
      isActive: true,
      isArchived: false,
      createdAt: new Date().toISOString()
    };
    onSaveWorkout(newPlan);
  };

  return (
    <div className="space-y-6" id="workout-builder-root">
      
      {/* 1. Profile select & AI program generator layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6" id="dashboard-programming-setup">
        
        {/* Core Generator Card */}
        <div className="bg-[#101010] border border-neutral-850 rounded-2xl p-5 space-y-4" id="ai-generator-panel">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#FF4D00]" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">{t.generateWorkout}</h3>
          </div>

          <div className="space-y-3" id="ai-generation-form">
            <div>
              <label className="text-[10px] text-neutral-400 uppercase tracking-wider mb-1 block">{lang === 'en' ? 'Target Athlete' : 'المشترك المستهدف'}</label>
              <select
                id="workout-client-selector"
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full bg-[#181818] border border-neutral-800 rounded-xl py-2 px-3 text-xs text-white"
              >
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {selectedClient && (
              <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-900 space-y-1.5" id="client-onboard-summary">
                <span className="text-[9px] text-[#FF4D00] block uppercase font-bold">{t.clientProfile}</span>
                <span className="text-xs font-bold text-white block">{selectedClient.name}</span>
                <div className="text-[10px] text-neutral-400 space-y-0.5">
                  <p>{t.goal}: {selectedClient.goal}</p>
                  <p>{t.trainingDays}: {selectedClient.trainingDays} {t.daysPerWeek}</p>
                  <p className="text-red-400 truncate">{t.injuries}: {selectedClient.injuries || 'None'}</p>
                </div>
              </div>
            )}

            <div>
              <label className="text-[10px] text-neutral-400 uppercase tracking-wider mb-1 block">{t.template}</label>
              <select
                id="workout-template-selector"
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full bg-[#181818] border border-neutral-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none"
              >
                {TRAINING_TEMPLATES.map(item => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>

            <button
              id="ai-generate-workout-btn"
              onClick={handleAIMinusProgram}
              disabled={loadingAI || !selectedClient}
              className="w-full py-2.5 bg-[#FF4D00] hover:bg-[#E04400] text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wide disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {loadingAI ? t.aiGenerating : t.generateWorkout}
            </button>

            {aiError && (
              <div className="bg-red-500/5 border border-red-500/20 text-red-400 text-xs rounded-xl p-3 space-y-1" id="ai-workout-error-box">
                <p className="font-bold flex items-center gap-1">⚠️ {lang === 'en' ? 'AI Generator Notice:' : 'تنبيه من خدمة الذكاء الاصطناعي:'}</p>
                <p className="text-[11px] leading-relaxed opacity-90">{aiError}</p>
              </div>
            )}
          </div>
        </div>

        {/* Tactical Advice & Program summary */}
        <div className="xl:col-span-2 bg-[#101010] border border-neutral-850 rounded-2xl p-5 flex flex-col justify-between" id="program-summary-bento">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-850 pb-3">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">{lang === 'en' ? 'Active Coaching Program' : 'الخطة التدريبية النشطة'}</h3>
                <p className="text-[10px] text-neutral-500">{lang === 'en' ? 'Full-range compound loading schedules' : 'قائمة التمارين المعينة والمستهدفة للمعدل الفسيولوجي'}</p>
              </div>
              <Dumbbell className="w-5 h-5 text-neutral-600" />
            </div>

            {activePlan ? (
              <div className="space-y-3" id="active-plan-summary">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-[#FF4D00] font-sans">{activePlan.name}</h4>
                  <span className="text-[10px] bg-neutral-800 text-neutral-300 font-mono px-2 py-0.5 rounded">
                    {activePlan.templateType} ({activePlan.weeks} Wks)
                  </span>
                </div>
                <div className="w-full mt-1.5" id="workout-notes-formatter">
                  <AIOutputFormatter text={activePlan.notes} lang={lang} />
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-neutral-500" id="empty-coaching-plan">
                {lang === 'en' ? 'No active training programs generated. Use the sidebar module to spin a secure custom template instantly.' : 'لا يوجد برنامج حالي. استخدم اللوحة لتركيب الخطة بالذكاء الاصطناعي.'}
              </div>
            )}
          </div>

          {activePlan && (
            <div className="mt-4 flex items-center justify-between bg-neutral-950 p-2.5 rounded-xl text-xs" id="program-analytics">
              <span className="text-neutral-500">{lang === 'en' ? 'Directives:' : 'التجزيء:'} {activePlan.days.length} {lang === 'en' ? 'Logged days' : 'أيام مبرمجة'}</span>
              <button 
                id="manually-add-day-btn"
                onClick={handleAddDay}
                className="text-[10px] text-[#FF4D00] font-bold uppercase hover:underline cursor-pointer"
              >
                + {lang === 'en' ? 'Add training Day' : 'إضافة يوم تمريني'}
              </button>
            </div>
          )}
        </div>

      </div>

      {/* 2. Live Builder Sandboard (Day lists, exercises sets rows) */}
      {activePlan && activePlan.days.length > 0 && (
        <div className="space-y-6" id="programming-sandboard-days">
          {activePlan.days.map((day) => (
            <div key={day.id} className="bg-[#101010] border border-neutral-850 rounded-2xl p-5 space-y-4" id={`program-day-card-${day.id}`}>
              <div className="flex items-center justify-between border-b border-neutral-850 pb-3">
                <input
                  id={`day-name-input-${day.id}`}
                  type="text"
                  value={day.name}
                  onChange={(e) => {
                    const daysCopy = activePlan.days.map(d => d.id === day.id ? { ...d, name: e.target.value } : d);
                    onSaveWorkout({ ...activePlan, days: daysCopy });
                  }}
                  className="bg-transparent text-sm font-bold text-white uppercase tracking-tight focus:outline-none focus:border-neutral-700 border-b border-transparent w-full max-w-sm"
                />
                
                <button
                  id={`delete-day-btn-${day.id}`}
                  onClick={() => handleDeleteDay(day.id)}
                  className="text-neutral-500 hover:text-[#FF3B30] p-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Day exercises stack */}
              <div className="space-y-4" id={`exercises-list-day-${day.id}`}>
                {day.exercises.length === 0 ? (
                  <div className="py-6 text-center text-xs text-neutral-500 border border-dashed border-neutral-800 rounded-xl">
                    {lang === 'en' ? 'No exercises loaded in this microcycle.' : 'لا يوجد تمارين في هذا اليوم للآن.'}
                  </div>
                ) : (
                  day.exercises.map((wex, wexIdx) => (
                    <div key={wex.id} className="bg-[#181818] border border-neutral-800/80 rounded-xl p-4 space-y-3" id={`exercise-row-${wex.id}`}>
                      
                      {/* Exercise meta header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CornerDownRight className="w-3.5 h-3.5 text-neutral-500" />
                          <h5 className="text-xs sm:text-sm font-bold text-white">{lang === 'en' ? wex.name : wex.nameAr}</h5>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-neutral-400 font-mono">
                            Tempo: <input type="text" value={wex.tempo} onChange={(e) => {
                              const daysCopy = activePlan.days.map(d => {
                                if (d.id === day.id) {
                                  const exCopy = [...d.exercises];
                                  exCopy[wexIdx] = { ...exCopy[wexIdx], tempo: e.target.value };
                                  return { ...d, exercises: exCopy };
                                }
                                return d;
                              });
                              onSaveWorkout({ ...activePlan, days: daysCopy });
                            }} className="bg-neutral-900 border border-neutral-850 px-1 py-0.5 rounded text-center w-16 focus:outline-none text-white text-[10px]" />
                          </span>
                          <button
                            id={`delete-exercise-btn-${wex.id}`}
                            onClick={() => handleDeleteExercise(day.id, wexIdx)}
                            className="p-1 hover:bg-neutral-900 rounded text-neutral-500 hover:text-[#FF3B30] transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Sets RPE/RIR Matrix table */}
                      <div className="overflow-x-auto" id={`matrix-sets-${wex.id}`}>
                        <table className="w-full text-left text-xs text-neutral-400 font-mono table-auto min-w-[500px]">
                          <thead>
                            <tr className="border-b border-neutral-850 text-[10px] uppercase text-neutral-500">
                              <th className="py-2 w-12 text-center">Set</th>
                              <th className="py-2 w-20">Type</th>
                              <th className="py-2 w-24">Reps</th>
                              <th className="py-2 w-28">Weight</th>
                              <th className="py-2 w-16 text-center">RPE</th>
                              <th className="py-2 w-16 text-center">RIR</th>
                              <th className="py-2 w-24">Rest</th>
                              <th className="py-2 w-12 text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {wex.sets.map((set, setIdx) => (
                              <tr key={set.id} className="border-b border-neutral-850 last:border-b-0 hover:bg-neutral-900/40">
                                <td className="py-2 text-center text-white font-bold">{setIdx + 1}</td>
                                <td className="py-1">
                                  <select
                                    id={`set-type-${set.id}`}
                                    value={set.type}
                                    onChange={(e) => updateSetProperty(day.id, wexIdx, setIdx, 'type', e.target.value)}
                                    className="bg-neutral-900 text-[10px] rounded px-1.5 py-0.5 text-neutral-300 border border-neutral-850 w-full focus:outline-none"
                                  >
                                    <option value="working">Work</option>
                                    <option value="warmup">Warm</option>
                                    <option value="dropset">Drop</option>
                                    <option value="superset">Super</option>
                                  </select>
                                </td>
                                <td className="py-1">
                                  <input 
                                    id={`set-reps-${set.id}`}
                                    type="text" 
                                    value={set.reps} 
                                    onChange={(e) => updateSetProperty(day.id, wexIdx, setIdx, 'reps', e.target.value)}
                                    className="bg-neutral-900 border border-neutral-850 px-1.5 py-0.5 text-white text-[10px] rounded w-full focus:outline-none" 
                                  />
                                </td>
                                <td className="py-1">
                                  <input 
                                    id={`set-weight-${set.id}`}
                                    type="text" 
                                    value={set.weight || ''} 
                                    onChange={(e) => updateSetProperty(day.id, wexIdx, setIdx, 'weight', e.target.value)}
                                    className="bg-neutral-900 border border-neutral-850 px-1.5 py-0.5 text-white text-[10px] rounded w-full focus:outline-none" 
                                  />
                                </td>
                                <td className="py-1 text-center">
                                  <input 
                                    id={`set-rpe-${set.id}`}
                                    type="number" 
                                    min="1" 
                                    max="10" 
                                    value={set.rpe || 8} 
                                    onChange={(e) => updateSetProperty(day.id, wexIdx, setIdx, 'rpe', Number(e.target.value))}
                                    className="bg-neutral-900 border border-neutral-850 px-1 py-0.5 text-white text-center rounded w-10 focus:outline-none text-[10px]" 
                                  />
                                </td>
                                <td className="py-1 text-center">
                                  <input 
                                    id={`set-rir-${set.id}`}
                                    type="number" 
                                    min="0" 
                                    max="5" 
                                    value={set.rir ?? 2} 
                                    onChange={(e) => updateSetProperty(day.id, wexIdx, setIdx, 'rir', Number(e.target.value))}
                                    className="bg-neutral-900 border border-neutral-850 px-1 py-0.5 text-white text-center rounded w-10 focus:outline-none text-[10px]" 
                                  />
                                </td>
                                <td className="py-1">
                                  <input 
                                    id={`set-rest-${set.id}`}
                                    type="text" 
                                    value={set.rest || '90s'} 
                                    onChange={(e) => updateSetProperty(day.id, wexIdx, setIdx, 'rest', e.target.value)}
                                    className="bg-neutral-900 border border-neutral-850 px-1.5 py-0.5 text-white text-[10px] rounded w-full focus:outline-none" 
                                  />
                                </td>
                                <td className="py-1 text-center">
                                  <button
                                    id={`delete-set-btn-${set.id}`}
                                    type="button" 
                                    onClick={() => handleDeleteSetFromExercise(day.id, wexIdx, setIdx)}
                                    className="text-neutral-500 hover:text-[#FF3B30] p-1 cursor-pointer"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Coach Strategy & tips input */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-neutral-850/40 text-xs">
                        <input
                          id={`exercise-tips-input-${wex.id}`}
                          type="text"
                          value={wex.notes}
                          onChange={(e) => handleUpdateNotes(day.id, wexIdx, e.target.value)}
                          placeholder={lang === 'en' ? 'Coach tip: focused squeeze...' : 'مساعدة التوافق العضلي والوضعية...'}
                          className="bg-neutral-900/60 border border-neutral-850 rounded-lg py-1 px-3 text-neutral-300 placeholder-neutral-500 focus:outline-none w-full"
                        />
                        <button
                          id={`add-set-btn-${wex.id}`}
                          type="button"
                          onClick={() => handleAddSetToExercise(day.id, wexIdx)}
                          className="px-2.5 py-1 text-[10px] font-bold bg-neutral-800 hover:bg-neutral-700 text-white rounded uppercase whitespace-nowrap transition-colors cursor-pointer"
                        >
                          + Set
                        </button>
                      </div>

                    </div>
                  ))
                )}
              </div>

              {/* Day controller actions (Add exercise launcher) */}
              <div className="flex justify-end pt-2" id={`day-footer-${day.id}`}>
                <button
                  id={`add-exercise-to-day-btn-${day.id}`}
                  onClick={() => {
                    setTargetDayIdForAdd(day.id);
                    setIsLibraryOpen(true);
                  }}
                  className="px-3.5 py-1.5 bg-neutral-900 hover:bg-[#FF4D00]/10 border border-neutral-800 hover:border-[#FF4D00] text-neutral-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 uppercase"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {t.addExercise}
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* 2.5. Program History & Record Versions Section */}
      <div className="bg-[#101010] border border-neutral-850 rounded-2xl p-5 space-y-4" id="programs-history-versions-section">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-850 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#FF4D00]" />
              <span>{lang === 'en' ? 'Workout Program Versions & History Records' : 'سجل وحفظ إصدارات جدول التمرين للمشترك'}</span>
            </h3>
            <p className="text-[10px] text-neutral-500 mt-0.5">
              {lang === 'en' 
                ? 'Create, duplicate, copy, and swap active training splits to track progression.' 
                : 'استكشف الأنظمة السابقة للعميل، نشّط أي جدول سابق، أو استنسخ جدول لتعديله.'}
            </p>
          </div>
          <button
            id="create-blank-workout-btn"
            onClick={handleCreateNewBlankPlan}
            className="px-3 py-1.5 bg-[#FF4D00]/10 hover:bg-[#FF4D00]/20 border border-[#FF4D00]/30 hover:border-[#FF4D00] text-white text-[11px] font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer uppercase self-start sm:self-center"
          >
            <Plus className="w-3.5 h-3.5 text-[#FF4D00]" />
            <span>{lang === 'en' ? 'Start Brand New Program' : 'تأسيس جدول جديد بالكامل'}</span>
          </button>
        </div>

        {clientWorkouts.length === 0 ? (
          <div className="py-8 text-center text-xs text-neutral-500">
            {lang === 'en' ? 'No recorded versions found for this athlete.' : 'لا يوجد سجلات تدريبية محفوظة للعميل للآن.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="history-programs-grid">
            {clientWorkouts.map((pw) => {
              const active = pw.id === activePlan?.id;
              return (
                <div 
                  key={pw.id} 
                  className={`p-4 rounded-xl border transition-all ${
                    active 
                      ? 'bg-neutral-950 border-[#FF4D00] shadow-[#FF4D00]/5 shadow-md' 
                      : 'bg-[#181818] border-neutral-850 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white font-sans">{pw.name}</span>
                        <span className="text-[9px] uppercase font-mono font-bold text-[#FF4D00] bg-[#FF4D00]/10 px-1.5 py-0.5 rounded">
                          V{pw.version || 1}
                        </span>
                        {active && (
                          <span className="text-[9px] uppercase font-mono font-bold text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <Check className="w-2.5 h-2.5" />
                            {lang === 'en' ? 'Active' : 'نشط حالياً'}
                          </span>
                        )}
                      </div>
                      <p className="text-[9px] text-neutral-500 font-mono mt-1">
                        {lang === 'en' ? 'Split:' : 'النوع:'} {pw.templateType} • {pw.weeks} Wks • {lang === 'en' ? 'Created:' : 'تاريخ الصياغة:'} {new Date(pw.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      {pw.notes && (
                        <p className="text-[10px] text-neutral-400 mt-2 line-clamp-2 italic bg-[#101010] p-1.5 rounded border border-neutral-900 leading-relaxed">
                          {pw.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-neutral-900">
                    {!active && (
                      <button
                        onClick={() => handleActivateVersionDirect(pw)}
                        className="flex-1 py-1.5 bg-neutral-900 border border-neutral-800 hover:border-[#FF4D00] text-neutral-300 hover:text-white text-[10px] font-bold rounded-lg transition-colors cursor-pointer text-center uppercase"
                      >
                        {lang === 'en' ? 'Activate routine' : 'تفعيل هذا الجدول'}
                      </button>
                    )}
                    <button
                      onClick={() => handleDuplicateVersionDirect(pw)}
                      className="flex-1 py-1.5 bg-neutral-900 border border-neutral-800 hover:bg-neutral-850 text-neutral-300 text-[10px] font-bold uppercase rounded-lg transition-colors cursor-pointer text-center"
                    >
                      {lang === 'en' ? 'Duplicate to edit' : 'استنساخ للتعديل'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Exercise Database Selection Dialog overlay */}
      {isLibraryOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm" id="exercise-lib-modal">
          <div className="bg-[#101010] border border-neutral-800 rounded-3xl w-full max-w-xl max-h-[85vh] overflow-hidden flex flex-col" id="exercise-lib-holder animate">
            <div className="flex items-center justify-between p-4 border-b border-neutral-850">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">{t.exerciseLibrary}</h3>
              <button onClick={() => setIsLibraryOpen(false)} className="text-neutral-500 hover:text-white cursor-pointer"><X className="w-5 h-5"/></button>
            </div>

            {/* Filters */}
            <div className="p-4 space-y-3 bg-[#181818] border-b border-neutral-850" id="lib-filtering">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" />
                <input
                  id="lib-search"
                  type="text"
                  placeholder="e.g. Bench press"
                  value={exerciseSearch}
                  onChange={(e) => setExerciseSearch(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-1.5 pl-9 pr-4 text-xs text-white focus:outline-none"
                />
              </div>

              {/* Quick Muscle filters scrolling */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 text-[10px]" id="muscle-tags-row">
                {['All', 'Chest', 'Back', 'Quads', 'Hamstrings', 'Shoulders', 'Arms'].map((cat: any) => (
                  <button
                    key={cat}
                    id={`muscle-tag-${cat}`}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-full cursor-pointer font-semibold border ${selectedCategory === cat ? 'bg-[#FF4D00] border-transparent text-white' : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrolling list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5" id="lib-items">
              {filteredExercises.map((ex) => (
                <div
                  key={ex.id}
                  id={`lib-exercise-item-${ex.id}`}
                  onClick={() => handleSelectExerciseFromLib(ex)}
                  className="p-3 bg-[#181818] hover:bg-[#FF4D00]/10 border border-neutral-850 hover:border-[#FF4D00] rounded-xl flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div>
                    <h4 className="text-xs font-bold text-white mb-0.5">{lang === 'en' ? ex.name : ex.nameAr}</h4>
                    <span className="text-[9px] text-[#FF4D00] uppercase font-mono block">{ex.muscle} • {ex.equipment}</span>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-neutral-500" />
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
