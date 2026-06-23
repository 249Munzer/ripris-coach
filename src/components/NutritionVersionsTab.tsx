/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { NutritionPlan, Client } from '../types';
import { getNutritionPlans, saveNutritionPlans } from '../storage/db';
import { logTimelineEvent } from '../utils/timelineLogger';
import { 
  GitBranch, 
  Check, 
  Copy, 
  ArrowLeftRight, 
  Calendar, 
  Apple, 
  ChevronRight,
  ChevronDown,
  Info,
  X 
} from 'lucide-react';

interface NutritionVersionsTabProps {
  client: Client;
  lang: 'en' | 'ar';
}

export default function NutritionVersionsTab({ client, lang }: NutritionVersionsTabProps) {
  const [plans, setPlans] = useState<NutritionPlan[]>([]);
  const [compareA, setCompareA] = useState<NutritionPlan | null>(null);
  const [compareB, setCompareB] = useState<NutritionPlan | null>(null);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);

  const loadPlans = () => {
    const list = getNutritionPlans().filter(p => p.clientId === client.id);
    setPlans(list);
  };

  useEffect(() => {
    loadPlans();
  }, [client.id]);

  const handleActivateVersion = (plan: NutritionPlan) => {
    const all = getNutritionPlans();
    const updated = all.map(p => {
      if (p.clientId === client.id) {
        return {
          ...p,
          isActive: p.id === plan.id,
          isArchived: p.id !== plan.id
        };
      }
      return p;
    });

    saveNutritionPlans(updated);
    loadPlans();

    logTimelineEvent(
      client.id,
      'version_activated',
      `Activated nutrition plan version ${plan.version || 1} (${plan.dietStyle})`,
      `تفعيل نسخة نظام غذائي رقم ${plan.version || 1} (${plan.dietStyle})`,
      'nutrition',
      `Allocated as the primary active nutritional prescription.`
    );
  };

  const handleDuplicateVersion = (plan: NutritionPlan) => {
    const all = getNutritionPlans();
    const clientPlans = all.filter(p => p.clientId === client.id);
    const maxVer = clientPlans.reduce((max, p) => Math.max(max, p.version || 1), 0);
    const nextVer = maxVer + 1;

    const duplicated: NutritionPlan = {
      ...plan,
      id: `nut_${Date.now()}`,
      version: nextVer,
      isActive: false,
      isArchived: false,
      createdAt: new Date().toISOString(),
      updateReason: `Duplicated from V${plan.version || 1} macronutrient splits.`
    };

    saveNutritionPlans([duplicated, ...all]);
    loadPlans();

    logTimelineEvent(
      client.id,
      'nutrition_updated',
      `Duplicated Nutrition Plan to V${nextVer}`,
      `تم استنساخ مخطط غذائي جديد رقم ${nextVer}`,
      'nutrition',
      `Macronutrients target calories: ${plan.calories}kcal. Protein: ${plan.macros.protein}g.`
    );
  };

  const handleTriggerCompare = () => {
    if (plans.length < 2) {
      alert('Need at least 2 versions to evaluate.');
      return;
    }
    setCompareA(plans[0]);
    setCompareB(plans[1] || plans[0]);
    setIsCompareOpen(true);
  };

  return (
    <div className="space-y-4" id="nutrition-versions-tab">
      
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-display">
          <GitBranch className="w-4 h-4 text-[#FF4D00]" />
          <span>{lang === 'en' ? 'Nutrition Versions & Allocations' : 'سجل الأنظمة الغذائية والمكرو'}</span>
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
        <div className="bg-neutral-950 p-5 rounded-2xl border border-neutral-850 space-y-4 fixed inset-x-4 top-24 bottom-10 z-50 overflow-y-auto" id="nut-compare-modal">
          <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
            <h4 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-[#FF4D00]" />
              <span>Diagnostic Nutrition Splits Comparison</span>
            </h4>
            <button onClick={() => setIsCompareOpen(false)} className="text-neutral-500 hover:text-white cursor-pointer p-1">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
            <div>
              <span className="text-[10px] text-neutral-400 font-bold block mb-1">COMPARE SOURCE A (V{compareA.version || 1})</span>
              <select
                value={compareA.id}
                onChange={(e) => setCompareA(plans.find(p => p.id === e.target.value) || compareA)}
                className="w-full bg-[#101010] border border-neutral-800 text-xs text-white p-2 rounded-lg mb-3"
              >
                {plans.map(p => (
                  <option key={p.id} value={p.id}>Version {p.version || 1} - {p.dietStyle} {p.isActive ? '[ACTIVE]' : ''}</option>
                ))}
              </select>

              <div className="bg-[#181818] rounded-xl p-4 border border-neutral-800 space-y-3">
                <div className="flex justify-between items-center bg-neutral-950 p-2.5 rounded-lg">
                  <span className="text-[#FF4D00] font-bold">Total Energy: {compareA.calories} kcal</span>
                  <span className="text-neutral-500 uppercase font-mono text-[9px]">{compareA.dietStyle}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center font-mono">
                  <div className="bg-neutral-950 p-2 rounded border border-neutral-900">
                    <span className="text-[9px] text-neutral-500 block">PROTEIN</span>
                    <strong className="text-teal-400">{compareA.macros.protein}g</strong>
                  </div>
                  <div className="bg-neutral-950 p-2 rounded border border-neutral-900">
                    <span className="text-[9px] text-neutral-500 block">CARBS</span>
                    <strong className="text-yellow-400">{compareA.macros.carbs}g</strong>
                  </div>
                  <div className="bg-neutral-950 p-2 rounded border border-neutral-900">
                    <span className="text-[9px] text-neutral-500 block">FAT</span>
                    <strong className="text-orange-400">{compareA.macros.fat}g</strong>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="font-bold text-white text-[10px] uppercase block">Meals Distribution</span>
                  {compareA.meals.map((meal, idx) => (
                    <div key={idx} className="bg-neutral-950 p-2 rounded text-[11px]">
                      <span className="font-bold text-[#FF4D00] block">{meal.name} - {meal.timing}</span>
                      <p className="text-neutral-400 mt-0.5">{meal.items.join(', ')}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-neutral-400 font-bold block mb-1">COMPARE SOURCE B (V{compareB.version || 1})</span>
              <select
                value={compareB.id}
                onChange={(e) => setCompareB(plans.find(p => p.id === e.target.value) || compareB)}
                className="w-full bg-[#101010] border border-neutral-800 text-xs text-white p-2 rounded-lg mb-3"
              >
                {plans.map(p => (
                  <option key={p.id} value={p.id}>Version {p.version || 1} - {p.dietStyle} {p.isActive ? '[ACTIVE]' : ''}</option>
                ))}
              </select>

              <div className="bg-[#181818] rounded-xl p-4 border border-neutral-800 space-y-3">
                <div className="flex justify-between items-center bg-neutral-950 p-2.5 rounded-lg">
                  <span className="text-[#FF4D00] font-bold">Total Energy: {compareB.calories} kcal</span>
                  <span className="text-neutral-500 uppercase font-mono text-[9px]">{compareB.dietStyle}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center font-mono">
                  <div className="bg-neutral-950 p-2 rounded border border-neutral-900">
                    <span className="text-[9px] text-neutral-500 block">PROTEIN</span>
                    <strong className="text-teal-400">{compareB.macros.protein}g</strong>
                  </div>
                  <div className="bg-neutral-950 p-2 rounded border border-neutral-900">
                    <span className="text-[9px] text-neutral-500 block">CARBS</span>
                    <strong className="text-yellow-400">{compareB.macros.carbs}g</strong>
                  </div>
                  <div className="bg-neutral-950 p-2 rounded border border-neutral-900">
                    <span className="text-[9px] text-neutral-500 block">FAT</span>
                    <strong className="text-orange-400">{compareB.macros.fat}g</strong>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="font-bold text-white text-[10px] uppercase block">Meals Distribution</span>
                  {compareB.meals.map((meal, idx) => (
                    <div key={idx} className="bg-neutral-950 p-2 rounded text-[11px]">
                      <span className="font-bold text-[#FF4D00] block">{meal.name} - {meal.timing}</span>
                      <p className="text-neutral-400 mt-0.5">{meal.items.join(', ')}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Styled meal list */}
      <div className="space-y-3 text-xs font-sans">
        {plans.length === 0 ? (
          <div className="text-center py-10 text-neutral-500 border border-dashed border-neutral-850 rounded-2xl flex flex-col items-center justify-center gap-1">
            <Apple className="w-5 h-5 text-neutral-600 mb-1" />
            <span>No nutrition plans compiled for this client yet. Use the Nutrition tab.</span>
          </div>
        ) : (
          plans.map(p => {
            const isExpanded = expandedPlanId === p.id;
            return (
              <div key={p.id} className="bg-[#181818] border border-neutral-800 rounded-2xl p-4 space-y-3" id={`plan-version-${p.id}`}>
                
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-xs">{p.dietStyle} Diet Layout</h4>
                      <span className="px-1.5 py-0.5 bg-neutral-950 border border-neutral-900 text-[10px] text-[#FF4D00] font-mono rounded font-extrabold">
                        V{p.version || 1}
                      </span>
                      {p.isActive && (
                        <span className="px-2 py-0.5 bg-emerald-950/40 text-emerald-400 border border-emerald-900 text-[10px] font-bold rounded flex items-center gap-1 uppercase">
                          <Check className="w-3 h-3" />
                          Active Plan
                        </span>
                      )}
                    </div>
                    
                    <span className="text-[10px] text-neutral-500 font-mono flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Allocated: {p.createdAt ? p.createdAt.substring(0, 10) : 'Preloaded'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {!p.isActive && (
                      <button
                        onClick={() => handleActivateVersion(p)}
                        className="bg-[#222] border border-neutral-800 px-2.5 py-1 text-[10px] text-neutral-300 font-bold hover:bg-neutral-800 hover:text-white rounded uppercase cursor-pointer"
                      >
                        Activate V{p.version || 1}
                      </button>
                    )}
                    <button
                      onClick={() => handleDuplicateVersion(p)}
                      className="p-1 px-2.5 bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white rounded-lg hover:border-[#FF4D00] cursor-pointer"
                      title="Duplicate version"
                    >
                      <Copy className="w-3 h-3 block" />
                    </button>
                    <button
                      onClick={() => setExpandedPlanId(isExpanded ? null : p.id)}
                      className="p-1 px-2.5 bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white rounded-lg cursor-pointer"
                    >
                      {isExpanded ? <ChevronDown className="w-3 h-3 text-[#FF4D00] block" /> : <ChevronRight className="w-3 h-3 block" />}
                    </button>
                  </div>
                </div>

                {p.updateReason && (
                  <div className="bg-neutral-950/60 p-2 rounded-lg border border-neutral-900 text-[11px] text-neutral-400 italic">
                    Log Reason: "{p.updateReason}"
                  </div>
                )}

                {isExpanded && (
                  <div className="pt-3 border-t border-neutral-900 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-neutral-950 p-2.5 rounded-xl border border-neutral-900 text-center font-mono">
                      <div className="bg-[#101010] p-2 rounded border border-neutral-850">
                        <span className="text-[9px] text-neutral-500 block uppercase font-bold">CALORIES</span>
                        <strong className="text-white text-xs">{p.calories} kcal</strong>
                      </div>
                      <div className="bg-[#101010] p-2 rounded border border-neutral-850">
                        <span className="text-[9px] text-neutral-500 block uppercase font-bold">PROTEIN</span>
                        <strong className="text-teal-400 text-xs">{p.macros.protein}g</strong>
                      </div>
                      <div className="bg-[#101010] p-2 rounded border border-neutral-850">
                        <span className="text-[9px] text-neutral-500 block uppercase font-bold">CARBS</span>
                        <strong className="text-yellow-400 text-xs">{p.macros.carbs}g</strong>
                      </div>
                      <div className="bg-[#101010] p-2 rounded border border-neutral-850">
                        <span className="text-[9px] text-neutral-500 block uppercase font-bold">FAT</span>
                        <strong className="text-orange-400 text-xs">{p.macros.fat}g</strong>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="font-extrabold text-[9px] tracking-widest text-[#FF4D00] block uppercase">MEALS MENU SCHEDULE</span>
                      {p.meals.map((meal, mIdx) => (
                        <div key={mIdx} className="bg-neutral-950 p-3 rounded-xl border border-neutral-900/60 flex flex-col sm:flex-row justify-between gap-2">
                          <div>
                            <span className="font-bold text-white block uppercase tracking-tight">{meal.name}</span>
                            <p className="text-neutral-400 mt-0.5 text-[11px] leading-relaxed">{meal.items.join(', ')}</p>
                          </div>
                          <span className="text-[10px] text-neutral-500 font-mono bg-neutral-900 border border-neutral-850 h-fit px-2 py-0.5 rounded uppercase font-bold shrink-0">
                            {meal.timing}
                          </span>
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
