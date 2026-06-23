/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Client, NutritionPlan, MealItem } from '../types';
import { 
  Apple, 
  Sparkles, 
  Plus, 
  Trash2, 
  Activity, 
  Zap, 
  CheckSquare, 
  Calendar,
  Layers,
  Heart,
  X
} from 'lucide-react';

interface NutritionViewProps {
  clients: Client[];
  nutritionPlans: NutritionPlan[];
  lang: 'en' | 'ar';
  t: any;
  onSaveNutrition: (plan: NutritionPlan) => void;
  activeSelectedClientId?: string;
}

export const DIET_STYLES = [
  "High Protein Balanced",
  "High Protein Low Carb",
  "Keto Bio-Performance",
  "Mediterranean Balance",
  "Plant-Based / Vegan Strength",
  "Cyclical Carb Builder"
];

export default function NutritionView({
  clients,
  nutritionPlans,
  lang,
  t,
  onSaveNutrition,
  activeSelectedClientId
}: NutritionViewProps) {
  const [selectedClientId, setSelectedClientId] = useState<string>(
    activeSelectedClientId || (clients[0]?.id || '')
  );

  const selectedClient = clients.find(c => c.id === selectedClientId);

  // Active plan for selected client (preferring explicitly active ones)
  const activePlan = nutritionPlans.find(p => p.clientId === selectedClientId && p.isActive) ||
                     nutritionPlans.find(p => p.clientId === selectedClientId);

  const [loadingAI, setLoadingAI] = useState(false);
  const [selectedDiet, setSelectedDiet] = useState("High Protein Balanced");
  const [targetCalories, setTargetCalories] = useState(2200);
  const [mealCount, setMealCount] = useState(3);
  const [aiError, setAiError] = useState<string | null>(null);

  // Synchronize target calories when client changes
  React.useEffect(() => {
    if (selectedClient) {
      // Estimate realistic target calories based on bodyweight and active levels
      const bmr = Math.round(selectedClient.weight * 22);
      let multiplier = 1.375; // moderate
      if (selectedClient.activity === 'sedentary') multiplier = 1.2;
      else if (selectedClient.activity === 'light') multiplier = 1.375;
      else if (selectedClient.activity === 'moderate') multiplier = 1.55;
      else if (selectedClient.activity === 'active') multiplier = 1.725;
      
      const tdee = Math.round(bmr * multiplier);
      // Caloric adjust depending on goals
      if (selectedClient.goal.toLowerCase().includes('loss') || selectedClient.goal.toLowerCase().includes('recomp')) {
        setTargetCalories(tdee - 450);
      } else {
        setTargetCalories(tdee + 300);
      }
    }
  }, [selectedClientId, selectedClient]);

  const handleAIGenerateNutrition = async () => {
    if (!selectedClient) return;
    setLoadingAI(true);
    setAiError(null);
    try {
      const res = await fetch('/api/coach-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: 'generate_nutrition',
          clientData: selectedClient,
          nutritionConfig: { calories: targetCalories, dietStyle: selectedDiet },
          lang: lang
        })
      });
      const data = await res.json();
      if (res.ok && data.result) {
        const plan: NutritionPlan = {
          id: `np_${Date.now()}`,
          clientId: selectedClientId,
          bmr: data.result.bmr || Math.round(selectedClient.weight * 22),
          tdee: data.result.tdee || Math.round(selectedClient.weight * 32),
          calories: data.result.calories || targetCalories,
          macros: data.result.macros || { protein: 160, carbs: 200, fat: 60 },
          mealTiming: data.result.mealTiming || "Evenly distributed across workouts.",
          mealCount: data.result.mealCount || mealCount,
          dietStyle: data.result.dietStyle || selectedDiet,
          allergies: selectedClient.medicalNotes || "None",
          meals: data.result.meals || [],
          groceryList: data.result.groceryList || [],
          createdAt: new Date().toISOString()
        };
        onSaveNutrition(plan);
      } else {
        const errMsg = data.error || (lang === 'en' ? "AI Sports Nutritionist offline." : "المساعد الفسيولوجي للتغذية غير متاح حالياً.");
        setAiError(errMsg);
      }
    } catch (e: any) {
      console.error(e);
      setAiError(e.message || String(e));
    } finally {
      setLoadingAI(false);
    }
  };

  const handleUpdateMeals = (updatedMeals: MealItem[]) => {
    if (!activePlan) return;
    onSaveNutrition({ ...activePlan, meals: updatedMeals });
  };

  const handleUpdateGroceryNote = (textId: number, val: string) => {
    if (!activePlan) return;
    const itemsCopy = [...activePlan.groceryList];
    itemsCopy[textId] = val;
    onSaveNutrition({ ...activePlan, groceryList: itemsCopy });
  };

  const handleAddGroceryItem = () => {
    if (!activePlan) return;
    onSaveNutrition({ ...activePlan, groceryList: [...activePlan.groceryList, "New grocery item"] });
  };

  const handleDeleteGroceryItem = (idx: number) => {
    if (!activePlan) return;
    const list = [...activePlan.groceryList];
    list.splice(idx, 1);
    onSaveNutrition({ ...activePlan, groceryList: list });
  };

  // Find all nutrition plans for the selected client to show in history section
  const clientPlans = nutritionPlans.filter(p => p.clientId === selectedClientId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleActivatePlanVersion = (plan: NutritionPlan) => {
    onSaveNutrition({ ...plan, isActive: true, isArchived: false });
  };

  const handleDuplicatePlanVersion = (plan: NutritionPlan) => {
    const maxVer = clientPlans.reduce((max, p) => Math.max(max, p.version || 1), 0);
    const nextVer = maxVer + 1;
    const duplicated: NutritionPlan = {
      ...plan,
      id: `nut_${Date.now()}`,
      version: nextVer,
      isActive: false,
      isArchived: false,
      createdAt: new Date().toISOString()
    };
    onSaveNutrition(duplicated);
  };

  const handleCreateNewBlankPlan = () => {
    const maxVer = clientPlans.reduce((max, p) => Math.max(max, p.version || 1), 0);
    const nextVer = maxVer + 1;
    const newPlan: NutritionPlan = {
      id: `nut_${Date.now()}`,
      clientId: selectedClientId,
      bmr: selectedClient ? Math.round(selectedClient.weight * 22) : 1800,
      tdee: selectedClient ? Math.round(selectedClient.weight * 32) : 2400,
      calories: targetCalories,
      macros: { protein: 150, carbs: 200, fat: 60 },
      mealTiming: "Distributed evenly across the day.",
      mealCount: 3,
      dietStyle: selectedDiet,
      allergies: selectedClient?.medicalNotes || "None",
      meals: [
        {
          name: lang === 'en' ? "Meal 1: Breakfast" : "الوجبة 1: الإفطار",
          timing: "08:00 AM",
          items: [
            lang === 'en' ? "3 Whole eggs & 50g Oats" : "3 بيضات كاملة مع 50 غرام شوفان"
          ]
        }
      ],
      groceryList: [
        lang === 'en' ? "Whole eggs, Oats" : "بيض كامل، شوفان"
      ],
      version: nextVer,
      isActive: true,
      isArchived: false,
      createdAt: new Date().toISOString()
    };
    onSaveNutrition(newPlan);
  };

  return (
    <div className="space-y-6" id="nutrition-view-root">
      
      {/* 1. Profile select & Calorie calculator bento */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate" id="nutrition-breakouts">
        
        {/* Planner controls card */}
        <div className="bg-[#101010] border border-neutral-850 rounded-2xl p-5 space-y-4" id="nutrition-planner-controls">
          <div className="flex items-center gap-2">
            <Apple className="w-5 h-5 text-[#FF4D00]" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">{t.nutritionCalculator}</h3>
          </div>

          <div className="space-y-3" id="nutrition-controls-form">
            <div>
              <label className="text-[10px] text-neutral-400 uppercase block mb-1">{t.clients}</label>
              <select
                id="nutrition-client-selector"
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full bg-[#181818] border border-neutral-800 rounded-xl py-2 px-3 text-xs text-white"
              >
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] text-neutral-400 uppercase block mb-1">{t.dietStyle}</label>
              <select
                id="nutrition-diet-selector"
                value={selectedDiet}
                onChange={(e) => setSelectedDiet(e.target.value)}
                className="w-full bg-[#181818] border border-neutral-800 rounded-xl py-2 px-3 text-xs text-white"
              >
                {DIET_STYLES.map(style => (
                  <option key={style} value={style}>{style}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] text-neutral-400 uppercase block mb-1">{t.calories} (kcal)</label>
              <input
                id="nutrition-target-calorise-input"
                type="number"
                value={targetCalories}
                onChange={(e) => setTargetCalories(Number(e.target.value))}
                className="w-full bg-[#181818] border border-neutral-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none"
              />
            </div>

            <button
              id="nutrition-generate-action-btn"
              onClick={handleAIGenerateNutrition}
              disabled={loadingAI || !selectedClient}
              className="w-full py-2.5 bg-[#FF4D00] hover:bg-[#E04400] text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 uppercase disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-white" />
              {loadingAI ? t.aiGenerating : t.generateNutrition}
            </button>

            {aiError && (
              <div className="bg-red-500/5 border border-red-500/20 text-red-400 text-xs rounded-xl p-3 space-y-1" id="ai-nutrition-error-box">
                <p className="font-bold flex items-center gap-1">⚠️ {lang === 'en' ? 'AI Diet Generator Notice:' : 'تنبيه من مرشد التغذية الذكي:'}</p>
                <p className="text-[11px] leading-relaxed opacity-90">{aiError}</p>
              </div>
            )}
          </div>
        </div>

        {/* Big Macros progress panel */}
        <div className="xl:col-span-2 bg-[#101010] border border-neutral-850 rounded-2xl p-5 flex flex-col justify-between" id="macros-summary-panel">
          
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-850 pb-3" id="macros-panel-header">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">{lang === 'en' ? 'Metabolic Threshold & Macro Splits' : 'أهداف السعرات وتقسيم العناصر الغذائية'}</h3>
                <p className="text-[10px] text-neutral-500">{lang === 'en' ? 'Calculated daily macronutrient grams' : 'الحجم الدقيق للبروتين، الكربوهيدرات والنشاط الهضمي'}</p>
              </div>
              <Activity className="w-5 h-5 text-neutral-600" />
            </div>

            {activePlan ? (
              <div className="space-y-6" id="active-nutrition-details">
                {/* BMR TDEE target rows */}
                <div className="grid grid-cols-3 gap-3 text-center text-xs" id="metabolism-stats">
                  <div className="bg-[#181818] rounded-xl p-2.5">
                    <span className="text-[9px] text-[#B5B5B5] uppercase block">BMR</span>
                    <span className="font-bold text-white font-mono mt-0.5 block">{activePlan.bmr} kcal</span>
                  </div>
                  <div className="bg-[#181818] rounded-xl p-2.5">
                    <span className="text-[9px] text-[#B5B5B5] uppercase block">TDEE</span>
                    <span className="font-bold text-white font-mono mt-0.5 block">{activePlan.tdee} kcal</span>
                  </div>
                  <div className="bg-gradient-to-tr from-[#FF4D00]/10 to-orange-500/10 border border-[#FF4D00]/20 rounded-xl p-2.5">
                    <span className="text-[9px] text-[#FF4D00] uppercase block font-bold">{t.calories}</span>
                    <span className="font-bold text-[#FF4D00] font-mono mt-0.5 block">{activePlan.calories} kcal</span>
                  </div>
                </div>

                {/* Gram breakout graphic bar */}
                <div className="grid grid-cols-3 gap-4" id="macros-bento">
                  <div className="bg-[#181818] border border-neutral-800 rounded-xl p-3 text-center">
                    <span className="text-[10px] text-[#16C47F] uppercase tracking-wide block font-semibold">{t.protein}</span>
                    <span className="text-lg font-bold font-mono text-white block mt-0.5">{activePlan.macros.protein}g</span>
                    <span className="text-[9px] text-neutral-500 font-mono">({activePlan.macros.protein * 4} kcal)</span>
                  </div>

                  <div className="bg-[#181818] border border-neutral-800 rounded-xl p-3 text-center">
                    <span className="text-[10px] text-yellow-500 uppercase tracking-wide block font-semibold">{t.carbs}</span>
                    <span className="text-lg font-bold font-mono text-white block mt-0.5">{activePlan.macros.carbs}g</span>
                    <span className="text-[9px] text-neutral-500 font-mono">({activePlan.macros.carbs * 4} kcal)</span>
                  </div>

                  <div className="bg-[#181818] border border-neutral-800 rounded-xl p-3 text-center">
                    <span className="text-[10px] text-orange-400 uppercase tracking-wide block font-semibold">{t.fat}</span>
                    <span className="text-lg font-bold font-mono text-white block mt-0.5">{activePlan.macros.fat}g</span>
                    <span className="text-[9px] text-neutral-500 font-mono">({activePlan.macros.fat * 9} kcal)</span>
                  </div>
                </div>

                {/* Meals timing note */}
                <div className="p-3 bg-neutral-950 rounded-xl text-neutral-300 text-xs border border-neutral-900 leading-normal font-mono" id="timing-tips">
                  <strong className="text-[#FF4D00]">{t.mealTiming}:</strong> {activePlan.mealTiming}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-neutral-500" id="empty-macros-alert">
                {lang === 'en' ? 'No active nutrition blueprint found. Press Generate Nutrition Plan to set calories, macros and meals.' : 'لم يتم تركيب خطة الوجبات بعد.'}
              </div>
            )}
          </div>

          {activePlan && (
            <div className="mt-4 pt-3 border-t border-neutral-850/50 flex items-center justify-between text-[10px] text-neutral-500 font-mono">
              <span>Goal: {selectedClient?.goal}</span>
              <span>Allergies: {activePlan.allergies}</span>
            </div>
          )}
        </div>

      </div>

      {/* 2. Structured meal items & grocery list splitter */}
      {activePlan && activePlan.meals.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="nutrition-bento-split">
          
          {/* Day meal details list layout */}
          <div className="lg:col-span-2 space-y-4" id="nutrition-meals-list">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">{lang === 'en' ? 'Consolidated Meal Recipes' : 'توزيع وجبات اليوم السعرات المحددة'}</h3>
            
            <div className="space-y-3" id="meals-stack">
              {activePlan.meals.map((meal, mealIdx) => (
                <div key={mealIdx} className="bg-[#101010] border border-neutral-850 rounded-xl p-4.5 space-y-2.5" id={`meal-card-${mealIdx}`}>
                  <div className="flex items-center justify-between border-b border-neutral-850 pb-1.5">
                    <h4 className="text-xs font-bold text-[#FF4D00]">{meal.name}</h4>
                    <span className="text-[10px] font-mono text-neutral-500">{meal.timing}</span>
                  </div>
                  
                  {/* Meal sub-elements items lists */}
                  <ul className="space-y-1.5 text-xs text-neutral-300 font-mono list-disc list-inside">
                    {meal.items.map((item, itemIdx) => (
                      <li key={itemIdx}>
                        <input
                          id={`meal-${mealIdx}-item-${itemIdx}`}
                          type="text"
                          value={item}
                          onChange={(e) => {
                            const mealsCopy = [...activePlan.meals];
                            mealsCopy[mealIdx].items[itemIdx] = e.target.value;
                            handleUpdateMeals(mealsCopy);
                          }}
                          className="bg-transparent border-b border-transparent focus:border-neutral-800 text-neutral-300 text-xs py-0.5 focus:outline-none w-11/12 inline-block ml-1 font-mono"
                        />
                      </li>
                    ))}
                  </ul>
                  
                  {/* Meal control layout (add item) */}
                  <div className="pt-1.5 flex justify-end">
                    <button
                      id={`add-item-meal-${mealIdx}-btn`}
                      onClick={() => {
                        const mealsCopy = [...activePlan.meals];
                        mealsCopy[mealIdx].items.push("New ingredient ingredient");
                        handleUpdateMeals(mealsCopy);
                      }}
                      className="text-[9px] text-neutral-400 font-bold uppercase hover:text-white cursor-pointer"
                    >
                      + Ingredient
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Smart consolidated Grocery shopping List */}
          <div className="bg-[#101010] border border-neutral-850 rounded-2xl p-5 space-y-4 h-fit" id="nutrition-grocery-list">
            <div className="flex items-center justify-between border-b border-neutral-850 pb-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">{t.groceryList}</h3>
              <button
                id="add-grocery-item-btn"
                onClick={handleAddGroceryItem}
                className="text-[10px] bg-neutral-900 hover:bg-neutral-800 text-neutral-300 px-2 py-1 rounded border border-neutral-800 cursor-pointer"
              >
                + Item
              </button>
            </div>

            <div className="space-y-2.5 max-h-96 overflow-y-auto" id="grocery-items-box">
              {activePlan.groceryList.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between bg-neutral-950/40 p-2 rounded-xl group border border-transparent hover:border-neutral-850" id={`grocery-row-${idx}`}>
                  <div className="flex items-center gap-2 w-full pr-2">
                    <CheckSquare className="w-3.5 h-3.5 text-[#16C47F]" />
                    <input
                      id={`grocery-item-input-${idx}`}
                      type="text"
                      value={item}
                      onChange={(e) => handleUpdateGroceryNote(idx, e.target.value)}
                      className="bg-transparent text-xs text-neutral-300 border-b border-transparent focus:border-neutral-800 focus:outline-none w-full font-mono py-0.5"
                    />
                  </div>
                  <button
                    id={`delete-grocery-item-btn-${idx}`}
                    onClick={() => handleDeleteGroceryItem(idx)}
                    className="p-1 hover:bg-neutral-800 rounded text-neutral-500 hover:text-[#FF3B30] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* 2.5. Nutrition History & Record Versions Section */}
      <div className="bg-[#101010] border border-neutral-850 rounded-2xl p-5 space-y-4" id="nutrition-history-versions-section">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-850 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#FF4D00]" />
              <span>{lang === 'en' ? 'Nutrition Plan Versions & History Records' : 'سجل وحفظ إصدارات النظام الغذائي للمشترك'}</span>
            </h3>
            <p className="text-[10px] text-neutral-500 mt-0.5">
              {lang === 'en' 
                ? 'Create, duplicate, copy, and swap active nutrition plans to track macronutrient progression.' 
                : 'استكشف الأنظمة الغذائية السابقة للعميل، نشّط أي نظام سابق، أو استنسخ نظام لتعديله.'}
            </p>
          </div>
          <button
            id="create-blank-nutrition-btn"
            onClick={handleCreateNewBlankPlan}
            className="px-3 py-1.5 bg-[#FF4D00]/10 hover:bg-[#FF4D00]/20 border border-[#FF4D00]/30 hover:border-[#FF4D00] text-white text-[11px] font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer uppercase self-start sm:self-center"
          >
            <Plus className="w-3.5 h-3.5 text-[#FF4D00]" />
            <span>{lang === 'en' ? 'Start Brand New Plan' : 'تأسيس نظام غذائي فارغ جديد'}</span>
          </button>
        </div>

        {clientPlans.length === 0 ? (
          <div className="py-8 text-center text-xs text-neutral-500">
            {lang === 'en' ? 'No recorded versions found for this athlete.' : 'لا يوجد سجلات غذائية محفوظة للعميل للآن.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="history-plans-grid">
            {clientPlans.map((pp) => {
              const active = pp.id === activePlan?.id;
              return (
                <div 
                  key={pp.id} 
                  className={`p-4 rounded-xl border transition-all ${
                    active 
                      ? 'bg-neutral-950 border-[#FF4D00] shadow-[#FF4D00]/5 shadow-md' 
                      : 'bg-[#181818] border-neutral-850 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white font-sans">{pp.dietStyle}</span>
                        <span className="text-[9px] uppercase font-mono font-bold text-[#FF4D00] bg-[#FF4D00]/10 px-1.5 py-0.5 rounded">
                          V{pp.version || 1}
                        </span>
                        {active && (
                          <span className="text-[9px] uppercase font-mono font-bold text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <CheckSquare className="w-2.5 h-2.5" />
                            {lang === 'en' ? 'Active' : 'نشط حالياً'}
                          </span>
                        )}
                      </div>
                      <p className="text-[9px] text-neutral-500 font-mono mt-1">
                        {pp.calories} kcal • P: {pp.macros.protein}g • C: {pp.macros.carbs}g • F: {pp.macros.fat}g • {lang === 'en' ? 'Created:' : 'تاريخ الصياغة:'} {new Date(pp.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      {pp.mealTiming && (
                        <p className="text-[10px] text-neutral-400 mt-2 line-clamp-2 italic bg-[#101010] p-1.5 rounded border border-neutral-900 leading-relaxed">
                          {pp.mealTiming}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#181818]">
                    {!active && (
                      <button
                        onClick={() => handleActivatePlanVersion(pp)}
                        className="flex-1 py-1.5 bg-neutral-900 border border-neutral-800 hover:border-[#FF4D00] text-neutral-300 hover:text-white text-[10px] font-bold rounded-lg transition-colors cursor-pointer text-center uppercase"
                      >
                        {lang === 'en' ? 'Activate plan' : 'تفعيل هذا النظام'}
                      </button>
                    )}
                    <button
                      onClick={() => handleDuplicatePlanVersion(pp)}
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

    </div>
  );
}
