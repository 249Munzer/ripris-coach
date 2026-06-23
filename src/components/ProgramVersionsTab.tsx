/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { WorkoutPlan, Client } from '../types';
import { getWorkouts, saveWorkouts } from '../storage/db';
import { logTimelineEvent } from '../utils/timelineLogger';
import { 
  GitCommit, 
  Check, 
  Copy, 
  RefreshCcw, 
  ArrowLeftRight, 
  Activity, 
  Calendar, 
  TrendingUp, 
  Dumbbell, 
  ChevronRight,
  ChevronDown,
  Info,
  X
} from 'lucide-react';

interface ProgramVersionsTabProps {
  client: Client;
  lang: 'en' | 'ar';
}

export default function ProgramVersionsTab({ client, lang }: ProgramVersionsTabProps) {
  const [workouts, setWorkouts] = useState<WorkoutPlan[]>([]);
  const [compareA, setCompareA] = useState<WorkoutPlan | null>(null);
  const [compareB, setCompareB] = useState<WorkoutPlan | null>(null);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [expandedWorkoutId, setExpandedWorkoutId] = useState<string | null>(null);

  const loadWorkouts = () => {
    // Filter workouts for selected client
    const list = getWorkouts().filter(w => w.clientId === client.id);
    setWorkouts(list);
  };

  useEffect(() => {
    loadWorkouts();
  }, [client.id]);

  const handleActivateVersion = (workout: WorkoutPlan) => {
    // To activate, set all other client workout versions to isActive = false
    const all = getWorkouts();
    const updated = all.map(w => {
      if (w.clientId === client.id) {
        return {
          ...w,
          isActive: w.id === workout.id,
          isArchived: w.id !== workout.id
        };
      }
      return w;
    });

    saveWorkouts(updated);
    loadWorkouts();

    logTimelineEvent(
      client.id,
      'version_activated',
      `Activated workout version ${workout.version || 1}: ${workout.name}`,
      `تفعيل نسخة تمرين رقم ${workout.version || 1}: ${workout.name}`,
      'programs',
      `Assigned as active workout routine schedule.`
    );
  };

  const handleDuplicateVersion = (workout: WorkoutPlan) => {
    const all = getWorkouts();
    const clientWorkouts = all.filter(w => w.clientId === client.id);
    
    // Find highest version number
    const maxVer = clientWorkouts.reduce((max, w) => Math.max(max, w.version || 1), 0);
    const nextVer = maxVer + 1;

    const duplicated: WorkoutPlan = {
      ...workout,
      id: `work_${Date.now()}`,
      name: `${workout.name} (V${nextVer})`,
      version: nextVer,
      isActive: false,
      isArchived: false,
      createdAt: new Date().toISOString(),
      changeSummary: `Duplicated from V${workout.version || 1} progression flow.`
    };

    saveWorkouts([duplicated, ...all]);
    loadWorkouts();

    logTimelineEvent(
      client.id,
      'workout_created',
      `Duplicated workout version to V${nextVer}`,
      `تم استنساخ نسخة تمرين جديدة رقم ${nextVer}`,
      'programs',
      `Duplicated from V${workout.version || 1} to customize further.`
    );
  };

  const handleTriggerCompare = () => {
    if (workouts.length < 2) {
      alert(lang === 'en' ? 'Need at least 2 versions to compare.' : 'تحتاج لنسختين من التمرين على الأقل للمقارنة بينهما.');
      return;
    }
    setCompareA(workouts[0]);
    setCompareB(workouts[1] || workouts[0]);
    setIsCompareOpen(true);
  };

  return (
    <div className="space-y-4" id="workout-versions-tab">
      
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
          <GitCommit className="w-4 h-4 text-[#FF4D00]" />
          <span>{lang === 'en' ? 'Program History Splits & Versions' : 'إصدارات وسجل تمرين المشترك'}</span>
        </h3>

        <button
          onClick={handleTriggerCompare}
          className="bg-[#181818] hover:bg-neutral-800 border border-neutral-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer text-xs"
        >
          <ArrowLeftRight className="w-3.5 h-3.5 text-[#FF4D00]" />
          <span>Compare Versions</span>
        </button>
      </div>

      {isCompareOpen && compareA && compareB && (
        <div className="bg-neutral-950 p-5 rounded-2xl border border-neutral-850 space-y-4 fixed inset-x-4 top-24 bottom-10 z-50 overflow-y-auto" id="compare-modal-canvas">
          <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
            <h4 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-[#FF4D00]" />
              <span>Diagnostic Workout Versions Comparison</span>
            </h4>
            <button onClick={() => setIsCompareOpen(false)} className="text-neutral-500 hover:text-white cursor-pointer p-1">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-[10px] text-neutral-400 font-bold block mb-1">COMPARE SOURCE A</span>
              <select
                value={compareA.id}
                onChange={(e) => setCompareA(workouts.find(w => w.id === e.target.value) || compareA)}
                className="w-full bg-[#101010] border border-neutral-800 text-xs text-white p-2 rounded-lg mb-3"
              >
                {workouts.map(w => (
                  <option key={w.id} value={w.id}>{w.name} (V{w.version || 1}) {w.isActive ? '[ACTIVE]' : ''}</option>
                ))}
              </select>

              <div className="bg-[#181818] rounded-xl p-4 border border-neutral-800/80 space-y-3">
                <span className="text-[#FF4D00] font-bold">V{compareA.version || 1} - Exercises Sequence</span>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {compareA.days.map((d, index) => (
                    <div key={index} className="bg-neutral-950 p-2 rounded border border-neutral-900">
                      <span className="font-bold text-white block text-[10px] uppercase">{d.name}</span>
                      <ul className="list-disc pl-4 space-y-1 mt-1 text-[11px] text-neutral-400">
                        {d.exercises.map((ex, idx) => (
                          <li key={idx}>
                            {ex.name} - {ex.sets.length} sets ({ex.tempo})
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-neutral-400 font-bold block mb-1">COMPARE SOURCE B</span>
              <select
                value={compareB.id}
                onChange={(e) => setCompareB(workouts.find(w => w.id === e.target.value) || compareB)}
                className="w-full bg-[#101010] border border-neutral-800 text-xs text-white p-2 rounded-lg mb-3"
              >
                {workouts.map(w => (
                  <option key={w.id} value={w.id}>{w.name} (V{w.version || 1}) {w.isActive ? '[ACTIVE]' : ''}</option>
                ))}
              </select>

              <div className="bg-[#181818] rounded-xl p-4 border border-neutral-800/80 space-y-3">
                <span className="text-[#FF4D00] font-bold">V{compareB.version || 1} - Exercises Sequence</span>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {compareB.days.map((d, index) => (
                    <div key={index} className="bg-neutral-950 p-2 rounded border border-neutral-900">
                      <span className="font-bold text-white block text-[10px] uppercase">{d.name}</span>
                      <ul className="list-disc pl-4 space-y-1 mt-1 text-[11px] text-neutral-400">
                        {d.exercises.map((ex, idx) => (
                          <li key={idx}>
                            {ex.name} - {ex.sets.length} sets ({ex.tempo})
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Structured workout list */}
      <div className="space-y-3 text-xs font-sans">
        {workouts.length === 0 ? (
          <div className="text-center py-12 text-neutral-500 border border-dashed border-neutral-850 rounded-2xl flex flex-col items-center justify-center gap-1">
            <Dumbbell className="w-5 h-5 text-neutral-600 mb-1" />
            <span>No workout programs compiled. Create one in the Workout Engine.</span>
          </div>
        ) : (
          workouts.map(w => {
            const isExpanded = expandedWorkoutId === w.id;
            return (
              <div key={w.id} className="bg-[#181818] border border-neutral-800 rounded-2xl p-4 space-y-3" id={`workout-version-${w.id}`}>
                
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-sm">{w.name}</h4>
                      <span className="px-2 py-0.5 bg-neutral-900 text-[#FF4D00] border border-neutral-800 text-[10px] font-mono rounded font-bold">
                        VERSION {w.version || 1}
                      </span>
                      {w.isActive && (
                        <span className="px-2 py-0.5 bg-emerald-950/40 text-emerald-400 border border-emerald-900 text-[10px] font-bold rounded flex items-center gap-1 uppercase">
                          <Check className="w-3 h-3" />
                          Active
                        </span>
                      )}
                    </div>
                    
                    <span className="text-[10px] text-neutral-500 font-mono flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Compiled: {w.createdAt ? w.createdAt.substring(0, 10) : 'Preloaded'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {!w.isActive && (
                      <button
                        onClick={() => handleActivateVersion(w)}
                        className="bg-neutral-900 hover:bg-neutral-850 hover:text-white border border-neutral-800 px-3 py-1 rounded text-[10px] font-bold uppercase cursor-pointer"
                      >
                        Activate V{w.version || 1}
                      </button>
                    )}
                    <button
                      onClick={() => handleDuplicateVersion(w)}
                      className="p-1 px-2.5 bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white rounded-lg hover:border-[#FF4D00] cursor-pointer"
                      title="Duplicate version"
                    >
                      <Copy className="w-3 h-3 block" />
                    </button>
                    <button
                      onClick={() => setExpandedWorkoutId(isExpanded ? null : w.id)}
                      className="p-1 px-2.5 bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white rounded-lg cursor-pointer col-span-1"
                    >
                      {isExpanded ? <ChevronDown className="w-3 h-3 block text-[#FF4D00]" /> : <ChevronRight className="w-3 h-3 block" />}
                    </button>
                  </div>
                </div>

                {w.changeSummary && (
                  <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-900/60 text-[11px] text-neutral-400 italic">
                    Change Note: "{w.changeSummary}"
                  </div>
                )}

                {isExpanded && (
                  <div className="pt-3 border-t border-neutral-900 space-y-3">
                    <span className="font-extrabold text-[9px] tracking-widest text-[#FF4D00] block uppercase">Workout plan splits scheme</span>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {w.days.map((day, dIdx) => (
                        <div key={dIdx} className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-900 flex flex-col justify-between">
                          <span className="font-extrabold text-[10px] text-white block uppercase tracking-tight mb-2 pb-1 border-b border-neutral-900">{day.name}</span>
                          <ul className="space-y-1.5 text-[11px]">
                            {day.exercises.map((ex, exIdx) => (
                              <li key={exIdx} className="flex justify-between text-neutral-400">
                                <span>{ex.name}</span>
                                <span className="font-mono text-neutral-500">{ex.sets.length} sets • {ex.tempo}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
