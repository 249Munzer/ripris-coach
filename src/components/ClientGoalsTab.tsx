/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ClientGoal, Client } from '../types';
import { getClientGoals, saveClientGoals } from '../storage/db';
import { logTimelineEvent } from '../utils/timelineLogger';
import { 
  Target, 
  TrendingDown, 
  TrendingUp, 
  Calendar, 
  Plus, 
  Trash2, 
  Award, 
  CheckCircle, 
  Hourglass,
  HelpCircle,
  X
} from 'lucide-react';

interface ClientGoalsTabProps {
  client: Client;
  lang: 'en' | 'ar';
}

export default function ClientGoalsTab({ client, lang }: ClientGoalsTabProps) {
  const [goals, setGoals] = useState<ClientGoal[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form fields
  const [goalType, setGoalType] = useState<ClientGoal['type']>('weight_loss');
  const [goalName, setGoalName] = useState('');
  const [goalNameAr, setGoalNameAr] = useState('');
  const [startValue, setStartValue] = useState(80);
  const [targetValue, setTargetValue] = useState(75);
  const [currentValue, setCurrentValue] = useState(78);
  const [unit, setUnit] = useState('kg');
  const [targetDate, setTargetDate] = useState('');
  const [goalStatus, setGoalStatus] = useState<ClientGoal['status']>('on_schedule');

  const loadGoals = () => {
    const list = getClientGoals().filter(g => g.clientId === client.id);
    setGoals(list);
  };

  useEffect(() => {
    loadGoals();
  }, [client.id]);

  const handleOpenForm = () => {
    setGoalName('');
    setGoalNameAr('');
    setStartValue(client.weight);
    setCurrentValue(client.weight);
    setTargetValue(client.weight - 5);
    setUnit('kg');
    setTargetDate(new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]); // 60 days default
    setGoalStatus('on_schedule');
    setIsFormOpen(true);
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalName.trim()) return;

    // Calculate completion metrics
    const totalProg = Math.abs(startValue - targetValue);
    const completedProg = Math.abs(startValue - currentValue);
    const rawRate = totalProg === 0 ? 100 : Math.round((completedProg / totalProg) * 100);
    const completionRate = Math.max(0, Math.min(100, rawRate));

    // Simple Finish Estimation
    const targetTS = new Date(targetDate).getTime();
    const startTS = Date.now();
    const midTS = startTS + (targetTS - startTS) * (completionRate / 100);
    const estimatedFinishDate = new Date(midTS).toISOString().split('T')[0];

    const allGoals = getClientGoals();
    
    // Automatic recommendations generator
    const recommendations: string[] = [];
    const recommendationsAr: string[] = [];

    if (goalType === 'weight_loss') {
      recommendations.push("Engage in deliberate daily 300kcal nutritional deficit.", "Maintain step goals above 10,000 steps.");
      recommendationsAr.push("الحرص على عجز حراري يومي بمقدار 300 سعرة.", "المحافظة على خطوات يومية لا تقل عن 10 آلاف خطوة.");
    } else if (goalType === 'muscle_gain') {
      recommendations.push("Staple protein target to 2.2 grams per kg.", "Focus on Progressive Overload on lower-body splits.");
      recommendationsAr.push("تناول 2.2 جرام بروتين لكل كيلوجرام أسبوعياً.", "تطبيق الحمل التدريبي الزائد تدريجياً لتمارين الأرجل.");
    } else {
      recommendations.push("Adhere strictly to mechanical recovery protocols.", "Schedule routine deload weeks every 6-8 weeks.");
      recommendationsAr.push("الالتزام الكامل بجدول الاستشفاء العضلي المخصص.", "المحافظة على أسابيع ريست مستمرة كل 6 إلى 8 أسابيع.");
    }

    const newGoal: ClientGoal = {
      id: `goal_${Date.now()}`,
      clientId: client.id,
      type: goalType,
      name: goalName,
      nameAr: goalNameAr || goalName,
      startValue,
      targetValue,
      currentValue,
      unit,
      startDate: new Date().toISOString().split('T')[0],
      targetDate,
      status: currentValue === targetValue ? 'completed' : goalStatus,
      completionRate,
      estimatedFinishDate,
      recommendations,
      recommendationsAr
    };

    saveClientGoals([newGoal, ...allGoals]);

    logTimelineEvent(
      client.id,
      'goal_changed',
      `Created New Client Goal: ${goalName}`,
      `تم تحديد هدف مستهدف للعميل: ${goalName}`,
      'system',
      `Targeting ${targetValue} ${unit} by ${targetDate}.`
    );

    setIsFormOpen(false);
    loadGoals();
  };

  const handleDeleteGoal = (goalId: string) => {
    if (confirm(lang === 'en' ? 'Delete this goal tracker?' : 'حذف هذا الهدف؟')) {
      const all = getClientGoals();
      const filtered = all.filter(g => g.id !== goalId);
      saveClientGoals(filtered);
      loadGoals();
    }
  };

  const getStatusColor = (status: ClientGoal['status']) => {
    switch (status) {
      case 'ahead': return 'text-emerald-400 bg-emerald-950/40 border-emerald-900';
      case 'on_schedule': return 'text-yellow-400 bg-yellow-950/40 border-yellow-900';
      case 'behind': return 'text-red-400 bg-red-950/40 border-red-900';
      case 'completed': return 'text-teal-400 bg-teal-950/40 border-teal-950';
    }
  };

  return (
    <div className="space-y-4" id="goal-progress-engine-workspace">
      
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-display">
          <Target className="w-4 h-4 text-[#FF4D00]" />
          <span>{lang === 'en' ? 'Active Goal Center' : 'متابعة أهداف العميل'}</span>
        </h3>

        <button
          onClick={handleOpenForm}
          className="bg-[#181818] hover:bg-neutral-800 border border-neutral-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-[#FF4D00]" />
          <span>{lang === 'en' ? 'Add Goal' : 'هدف جديد'}</span>
        </button>
      </div>

      {isFormOpen && (
        <form onSubmit={handleCreateGoal} className="bg-neutral-950 p-5 rounded-2xl border border-neutral-850 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">{lang === 'en' ? 'Initialize Custom Goal' : 'إنشاء محدد هدف رياضي'}</h3>
            <button type="button" onClick={() => setIsFormOpen(false)} className="text-neutral-500 hover:text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-neutral-400 font-bold block mb-1">GOAL METRIC TYPE</label>
              <select
                value={goalType}
                onChange={(e) => setGoalType(e.target.value as any)}
                className="w-full bg-[#101010] border border-neutral-800 text-xs text-white rounded-lg p-2 focus:border-[#FF4D00] scroll-none"
              >
                <option value="weight_loss">Weight Loss</option>
                <option value="muscle_gain">Muscle Gain</option>
                <option value="strength">Strength Milestones</option>
                <option value="body_fat">Body Fat (%)</option>
                <option value="measurements">Measurements</option>
                <option value="competition_prep">Competition Prep</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-neutral-400 font-bold block mb-1">GOAL NAME (EN)</label>
              <input
                type="text"
                required
                value={goalName}
                onChange={(e) => setGoalName(e.target.value)}
                placeholder="e.g. InBody PBF drop down"
                className="w-full bg-[#101010] border border-neutral-800 text-xs text-white rounded-lg p-2 focus:border-[#FF4D00] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] text-neutral-400 font-bold block mb-1">GOAL NAME (ARABIC)</label>
              <input
                type="text"
                value={goalNameAr}
                onChange={(e) => setGoalNameAr(e.target.value)}
                placeholder="مثال: إسقاط نسبة الدهون الجسدية"
                className="w-full bg-[#101010] border border-neutral-800 text-xs text-white rounded-lg p-2 focus:border-[#FF4D00]"
              />
            </div>

            <div>
              <label className="text-[10px] text-neutral-400 font-bold block mb-1">UNIT</label>
              <input
                type="text"
                required
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="kg, %, cm, lbs..."
                className="w-full bg-[#101010] border border-neutral-800 text-xs text-white rounded-lg p-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] text-neutral-400 font-bold block mb-1">START VALUE</label>
              <input
                type="number"
                step="any"
                required
                value={startValue}
                onChange={(e) => setStartValue(Number(e.target.value))}
                className="w-full bg-[#101010] border border-neutral-800 text-xs text-white rounded-lg p-2 focus:border-[#FF4D00]"
              />
            </div>
            <div>
              <label className="text-[10px] text-neutral-400 font-bold block mb-1">CURRENT VALUE</label>
              <input
                type="number"
                step="any"
                required
                value={currentValue}
                onChange={(e) => setCurrentValue(Number(e.target.value))}
                className="w-full bg-[#101010] border border-neutral-800 text-xs text-white rounded-lg p-2 focus:border-[#FF4D00]"
              />
            </div>
            <div>
              <label className="text-[10px] text-neutral-400 font-bold block mb-1">TARGET VALUE</label>
              <input
                type="number"
                step="any"
                required
                value={targetValue}
                onChange={(e) => setTargetValue(Number(e.target.value))}
                className="w-full bg-[#101010] border border-neutral-800 text-xs text-white rounded-lg p-2 focus:border-[#FF4D00]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-neutral-400 font-bold block mb-1">TARGET DEADLINE DATE</label>
              <input
                type="date"
                required
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full bg-[#101010] border border-neutral-800 text-xs text-white rounded-lg p-2"
              />
            </div>
            <div>
              <label className="text-[10px] text-neutral-400 font-bold block mb-1">PROGRESS TRAJECTORY</label>
              <select
                value={goalStatus}
                onChange={(e) => setGoalStatus(e.target.value as any)}
                className="w-full bg-[#101010] border border-neutral-800 text-xs text-white rounded-lg p-2 focus:border-[#FF4D00]"
              >
                <option value="ahead">Ahead of schedule</option>
                <option value="on_schedule">On schedule</option>
                <option value="behind">Behind schedule</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1 border-t border-neutral-900">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="text-xs text-neutral-400 px-3 py-1.5 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-[#FF4D00] text-xs font-bold text-white px-5 py-1.5 rounded-lg hover:bg-orange-600 block"
            >
              Set Goal
            </button>
          </div>
        </form>
      )}

      {/* Rendering Goal list */}
      <div className="grid grid-cols-1 gap-4 font-sans text-xs">
        {goals.length === 0 ? (
          <div className="text-center py-10 text-neutral-500 border border-dashed border-neutral-850 rounded-2xl">
            {lang === 'en' ? 'No active client goals mapped.' : 'لم يتم تعيين أهداف معلنة لهذا المشترك.'}
          </div>
        ) : (
          goals.map(g => (
            <div key={g.id} className="bg-[#181818] border border-neutral-800 rounded-2xl p-5 space-y-4" id={`goal-box-${g.id}`}>
              
              <div className="flex justify-between items-start gap-4">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#FF4D00]">Target Path - {g.type}</span>
                  <h4 className="text-sm font-bold text-white">{lang === 'en' ? g.name : g.nameAr}</h4>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-lg border text-[9px] font-bold uppercase ${getStatusColor(g.status)}`}>
                    {g.status.replace('_', ' ')}
                  </span>
                  <button
                    onClick={() => handleDeleteGoal(g.id)}
                    className="p-1 text-neutral-500 hover:text-red-500 rounded hover:bg-neutral-900 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Progress Bar & Indicators */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-mono text-neutral-400">
                  <span>Start: {g.startValue}{g.unit}</span>
                  <span className="text-white font-extrabold font-sans">Current: {g.currentValue}{g.unit}</span>
                  <span>Target: {g.targetValue}{g.unit}</span>
                </div>

                <div className="h-2 w-full bg-neutral-950 border border-neutral-900/60 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-orange-600 to-[#FF4D00] rounded-full transition-all duration-300 shadow-sm"
                    style={{ width: `${g.completionRate}%` }}
                  />
                </div>

                <div className="flex justify-between text-[10px] text-neutral-500">
                  <span>Completion Rate: <strong className="text-white font-bold">{g.completionRate}%</strong></span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-neutral-500" />
                    Deadline: {g.targetDate}
                  </span>
                </div>
              </div>

              {/* Projection Card */}
              <div className="bg-neutral-950/60 p-3 rounded-xl border border-neutral-900/80 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <Hourglass className="w-4 h-4 text-neutral-400 animate-spin-slow" />
                  <div>
                    <span className="text-neutral-500 block text-[9px] uppercase font-bold tracking-widest leading-none">Estimated Finish Date</span>
                    <span className="text-orange-400 font-bold block mt-1">{g.estimatedFinishDate || 'Calculating...'}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-[#16C47F] font-bold block bg-[#16C47F]/10 px-2 py-0.5 rounded-lg">
                    {g.status === 'behind' ? 'Caloric Deficit Shift Needed' : 'On Target Velocity'}
                  </span>
                </div>
              </div>

              {/* Suggestions Cards */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-500 block">COACH RECOMMENDATIONS</span>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-neutral-300">
                  {(lang === 'en' ? g.recommendations : g.recommendationsAr)?.map((rec, idx) => (
                    <li key={idx} className="bg-neutral-900/40 border border-neutral-850 p-2.5 rounded-xl flex items-start gap-2 italic leading-relaxed">
                      <CheckCircle className="w-3.5 h-3.5 text-orange-500 shrink-0 mt-0.5" />
                      <span>"{rec}"</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          ))
        )}
      </div>

    </div>
  );
}
