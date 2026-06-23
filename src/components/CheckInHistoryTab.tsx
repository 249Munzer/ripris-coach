/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { WeeklyCheckIn, Client } from '../types';
import { getWeeklyCheckIns, saveWeeklyCheckIns } from '../storage/db';
import { logTimelineEvent } from '../utils/timelineLogger';
import { 
  ClipboardCheck, 
  Plus, 
  Trash2, 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Smile, 
  Droplet,
  Flame,
  Info,
  X
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface CheckInHistoryTabProps {
  client: Client;
  lang: 'en' | 'ar';
}

export default function CheckInHistoryTab({ client, lang }: CheckInHistoryTabProps) {
  const [history, setHistory] = useState<WeeklyCheckIn[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // 17 Questionnaires Fields
  const [weight, setWeight] = useState(client.weight);
  const [mood, setMood] = useState(8);
  const [energy, setEnergy] = useState(8);
  const [sleepHours, setSleepHours] = useState(7.5);
  const [sleepQuality, setSleepQuality] = useState(8);
  const [stress, setStress] = useState(4);
  const [recovery, setRecovery] = useState(8);
  const [hunger, setHunger] = useState(3);
  const [digestion, setDigestion] = useState(9);
  const [waterLitres, setWaterLitres] = useState(3);
  const [cardioMinutes, setCardioMinutes] = useState(60);
  const [steps, setSteps] = useState(10000);
  const [workoutAdherence, setWorkoutAdherence] = useState(90);
  const [nutritionAdherence, setNutritionAdherence] = useState(90);
  const [supplementAdherence, setSupplementAdherence] = useState(100);
  const [motivation, setMotivation] = useState(8);
  const [soreness, setSoreness] = useState(2);
  const [comments, setComments] = useState('');

  const loadHistory = () => {
    const list = getWeeklyCheckIns().filter(c => c.clientId === client.id).sort((a,b)=> new Date(b.date).getTime() - new Date(a.date).getTime());
    setHistory(list);
  };

  useEffect(() => {
    loadHistory();
  }, [client.id]);

  const handleSubmitCheckin = (e: React.FormEvent) => {
    e.preventDefault();
    const all = getWeeklyCheckIns();
    const currentDate = new Date().toISOString().split('T')[0];

    const newCheckIn: WeeklyCheckIn = {
      id: `ch_${Date.now()}`,
      clientId: client.id,
      date: currentDate,
      weight,
      mood,
      energy,
      sleepHours,
      sleepQuality,
      stress,
      recovery,
      hunger,
      digestion,
      waterLitres,
      cardioMinutes,
      steps,
      workoutAdherence,
      nutritionAdherence,
      supplementAdherence,
      motivation,
      soreness,
      photos: [],
      additionalComments: comments
    };

    saveWeeklyCheckIns([newCheckIn, ...all]);

    logTimelineEvent(
      client.id,
      'checkin_submitted',
      `Submitted Weekly Check-In questionnaire`,
      `تم تقديم استبيان التقييم الأسبوعي`,
      'nutrition',
      `Weight registered: ${weight}kg. Workout compliance: ${workoutAdherence}%. Nutrition: ${nutritionAdherence}%.`
    );

    setIsFormOpen(false);
    setComments('');
    loadHistory();
  };

  const handleDeleteCheckin = (id: string) => {
    if (confirm('Delete this check-in entry?')) {
      const all = getWeeklyCheckIns();
      const filtered = all.filter(c => c.id !== id);
      saveWeeklyCheckIns(filtered);
      loadHistory();
    }
  };

  // Prepares data for chart trend visualization
  const chartData = [...history].reverse().map(h => ({
    date: h.date.substring(5), // MM-DD
    weight: h.weight,
    workoutAdherence: h.workoutAdherence,
    nutritionAdherence: h.nutritionAdherence,
    sleep: h.sleepHours,
  }));

  return (
    <div className="space-y-4" id="checkin-questionnaire-panel">
      
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-display">
          <ClipboardCheck className="w-4 h-4 text-[#FF4D00]" />
          <span>{lang === 'en' ? 'Weekly Multi-Measure Check-ins' : 'استبيانات التقييم الأسبوعية'}</span>
        </h3>

        <button
          onClick={() => setIsFormOpen(true)}
          className="bg-[#181818] hover:bg-neutral-800 border border-neutral-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-[#FF4D00]" />
          <span>{lang === 'en' ? 'Submit Weekly Diary' : 'تسجيل التقييم الحالي'}</span>
        </button>
      </div>

      {isFormOpen && (
        <form onSubmit={handleSubmitCheckin} className="bg-neutral-950 p-5 rounded-2xl border border-neutral-850 space-y-4 max-h-[500px] overflow-y-auto relative" id="submission-questionnaire-form">
          <div className="flex items-center justify-between sticky top-0 bg-neutral-950 z-10 pb-2 border-b border-neutral-900 mb-2">
            <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">Weekly Performance & Biometric Questionnaire</h3>
            <button type="button" onClick={() => setIsFormOpen(false)} className="text-neutral-500 hover:text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 text-xs">
            <div>
              <label className="text-[10px] text-neutral-400 font-bold block mb-1">CURRENT BODYWEIGHT (KG)</label>
              <input 
                type="number" step="any" required value={weight} onChange={e=>setWeight(Number(e.target.value))}
                className="w-full bg-[#101010] border border-neutral-800 text-xs text-white rounded-lg p-2 focus:border-[#FF4D00]"
              />
            </div>
            <div>
              <label className="text-[10px] text-neutral-400 font-bold block mb-1">MOOD STATUS (1-10)</label>
              <input 
                type="number" min="1" max="10" required value={mood} onChange={e=>setMood(Number(e.target.value))}
                className="w-full bg-[#101010] border border-neutral-800 text-xs text-white rounded-lg p-2 focus:border-[#FF4D00]"
              />
            </div>
            <div>
              <label className="text-[10px] text-neutral-400 font-bold block mb-1">AMPLIFIED ENERGY LEVEL (1-10)</label>
              <input 
                type="number" min="1" max="10" required value={energy} onChange={e=>setEnergy(Number(e.target.value))}
                className="w-full bg-[#101010] border border-neutral-800 text-xs text-white rounded-lg p-2 focus:border-[#FF4D00]"
              />
            </div>
            <div>
              <label className="text-[10px] text-neutral-400 font-bold block mb-1">SLEEP QUANTITY (HOURS)</label>
              <input 
                type="number" step="any" required value={sleepHours} onChange={e=>setSleepHours(Number(e.target.value))}
                className="w-full bg-[#101010] border border-neutral-800 text-xs text-white rounded-lg p-2"
              />
            </div>
            <div>
              <label className="text-[10px] text-neutral-400 font-bold block mb-1">SLEEP REST QUALITY (1-10)</label>
              <input 
                type="number" min="1" max="10" required value={sleepQuality} onChange={e=>setSleepQuality(Number(e.target.value))}
                className="w-full bg-[#101010] border border-neutral-800 text-xs text-white rounded-lg p-2"
              />
            </div>
            <div>
              <label className="text-[10px] text-neutral-400 font-bold block mb-1">STRESS EXPOSURE LEVEL (1-10)</label>
              <input 
                type="number" min="1" max="10" required value={stress} onChange={e=>setStress(Number(e.target.value))}
                className="w-full bg-[#101010] border border-neutral-800 text-xs text-white rounded-lg p-2"
              />
            </div>
            <div>
              <label className="text-[10px] text-neutral-400 font-bold block mb-1">RECOVERY STATUS (1-10)</label>
              <input 
                type="number" min="1" max="10" required value={recovery} onChange={e=>setRecovery(Number(e.target.value))}
                className="w-full bg-[#101010] border border-neutral-800 text-xs text-white rounded-lg p-2"
              />
            </div>
            <div>
              <label className="text-[10px] text-neutral-400 font-bold block mb-1">HUNGER RATINGS (1-10)</label>
              <input 
                type="number" min="1" max="10" required value={hunger} onChange={e=>setHunger(Number(e.target.value))}
                className="w-full bg-[#101010] border border-neutral-800 text-xs text-white rounded-lg p-2"
              />
            </div>
            <div>
              <label className="text-[10px] text-neutral-400 font-bold block mb-1">DIGESTION & GI TRACT HEALTH (1-10)</label>
              <input 
                type="number" min="1" max="10" required value={digestion} onChange={e=>setDigestion(Number(e.target.value))}
                className="w-full bg-[#101010] border border-neutral-800 text-xs text-white rounded-lg p-2"
              />
            </div>
            <div>
              <label className="text-[10px] text-neutral-400 font-bold block mb-1">WATER DAILY OUTTAKE (LITRES)</label>
              <input 
                type="number" step="any" required value={waterLitres} onChange={e=>setWaterLitres(Number(e.target.value))}
                className="w-full bg-[#101010] border border-neutral-800 text-xs text-white rounded-lg p-2"
              />
            </div>
            <div>
              <label className="text-[10px] text-neutral-400 font-bold block mb-1">CARDIO DURATION (MINUTES)</label>
              <input 
                type="number" required value={cardioMinutes} onChange={e=>setCardioMinutes(Number(e.target.value))}
                className="w-full bg-[#101010] border border-neutral-800 text-xs text-white rounded-lg p-2"
              />
            </div>
            <div>
              <label className="text-[10px] text-neutral-400 font-bold block mb-1">AVERAGE STEPS COUNT</label>
              <input 
                type="number" required value={steps} onChange={e=>setSteps(Number(e.target.value))}
                className="w-full bg-[#101010] border border-neutral-800 text-xs text-white rounded-lg p-2"
              />
            </div>
            <div>
              <label className="text-[10px] text-neutral-400 font-bold block mb-1">WORKOUT ADHERENCE RATE (%)</label>
              <input 
                type="number" min="0" max="100" required value={workoutAdherence} onChange={e=>setWorkoutAdherence(Number(e.target.value))}
                className="w-full bg-[#101010] border border-neutral-800 text-xs text-white rounded-lg p-2"
              />
            </div>
            <div>
              <label className="text-[10px] text-neutral-400 font-bold block mb-1">NUTRITION COMPLIANCE SPEED (%)</label>
              <input 
                type="number" min="0" max="100" required value={nutritionAdherence} onChange={e=>setNutritionAdherence(Number(e.target.value))}
                className="w-full bg-[#101010] border border-neutral-800 text-xs text-white rounded-lg p-2"
              />
            </div>
            <div>
              <label className="text-[10px] text-neutral-400 font-bold block mb-1">SUPPLEMENT COMPLIANCE RATE (%)</label>
              <input 
                type="number" min="0" max="100" required value={supplementAdherence} onChange={e=>setSupplementAdherence(Number(e.target.value))}
                className="w-full bg-[#101010] border border-neutral-800 text-xs text-white rounded-lg p-2"
              />
            </div>
            <div>
              <label className="text-[10px] text-neutral-400 font-bold block mb-1">MOTIVATION GAINS (1-10)</label>
              <input 
                type="number" min="1" max="10" required value={motivation} onChange={e=>setMotivation(Number(e.target.value))}
                className="w-full bg-[#101010] border border-neutral-800 text-xs text-white rounded-lg p-2"
              />
            </div>
            <div>
              <label className="text-[10px] text-neutral-400 font-bold block mb-1">DOMS / MUSCLE SORENESS (1-10)</label>
              <input 
                type="number" min="1" max="10" required value={soreness} onChange={e=>setSoreness(Number(e.target.value))}
                className="w-full bg-[#101010] border border-neutral-800 text-xs text-white rounded-lg p-2"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-neutral-400 font-bold block mb-1">CLIENT COMMENTS & NOTES</label>
            <textarea 
              rows={2} value={comments} onChange={e=>setComments(e.target.value)}
              placeholder="Tell coach about bio-feedback energy, lifts, cravings..."
              className="w-full bg-[#101010] border border-neutral-800 text-xs text-white rounded-lg p-2 focus:border-[#FF4D00] focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-neutral-900">
            <button
              type="button" onClick={() => setIsFormOpen(false)}
              className="text-xs text-neutral-400 px-3 py-1.5 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-[#FF4D00] text-xs font-bold text-white px-5 py-1.5 rounded-lg hover:bg-orange-600 block"
            >
              Submit Check-in
            </button>
          </div>
        </form>
      )}

      {/* Checkin Trends Line charts render block */}
      {history.length > 1 && (
        <div className="bg-neutral-950/40 border border-neutral-850 p-4 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-[#FF4D00] uppercase tracking-wider block">Biofeedback Weight Trend (kg)</span>
            <div className="h-40 w-full bg-neutral-950 p-2 rounded-xl border border-neutral-900">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="date" stroke="#555" fontSize={9} />
                  <YAxis stroke="#555" fontSize={9} domain={['dataMin - 1', 'dataMax + 1']} />
                  <Tooltip contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: '8px' }} />
                  <CartesianGrid stroke="#222" strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="weight" stroke="#FF4D00" strokeWidth={2.5} dot={{ fill: '#FF4D00', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider block">Nutrition Compliance (%)</span>
            <div className="h-40 w-full bg-neutral-950 p-2 rounded-xl border border-neutral-900">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="date" stroke="#555" fontSize={9} />
                  <YAxis stroke="#555" fontSize={9} domain={[50, 100]} />
                  <Tooltip contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: '8px' }} />
                  <CartesianGrid stroke="#222" strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="nutritionAdherence" stroke="#16C47F" strokeWidth={2.5} dot={{ fill: '#16C47F', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

      {/* Render Questionnaire logs */}
      <div className="space-y-3 font-sans text-xs">
        {history.length === 0 ? (
          <div className="text-center py-10 text-neutral-500 border border-dashed border-neutral-850 rounded-2xl flex flex-col items-center justify-center gap-1.5 font-sans">
            <Info className="w-5 h-5 text-neutral-600" />
            <span>No check-in questionnaires logged for this client yet.</span>
          </div>
        ) : (
          history.map(c => (
            <div key={c.id} className="bg-[#181818] border border-neutral-800 rounded-2xl p-5 space-y-4" id={`checkin-card-${c.id}`}>
              
              <div className="flex justify-between items-center flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-neutral-900 rounded-xl border border-neutral-800 text-[#FF4D00]">
                    <ClipboardCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-bold text-white uppercase tracking-tight">Check-In Registry Log</h5>
                    <span className="text-[9px] text-neutral-500 font-mono flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Date Registered: {c.date}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono text-neutral-400 bg-neutral-950 px-2.5 py-1 rounded-lg border border-neutral-900">
                    WEIGHT: <strong className="text-white">{c.weight} kg</strong>
                  </span>
                  <button 
                    onClick={() => handleDeleteCheckin(c.id)}
                    className="p-1 px-1.5 hover:bg-neutral-900 text-neutral-500 hover:text-red-500 rounded transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Grid indices */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-1 text-[11px]">
                <div className="bg-neutral-950/40 p-2.5 rounded-xl border border-neutral-900/60 text-center">
                  <span className="text-[9px] text-neutral-500 block uppercase font-bold">Workout Adh</span>
                  <span className="text-white font-mono font-bold block mt-1">{c.workoutAdherence}%</span>
                </div>
                <div className="bg-neutral-950/40 p-2.5 rounded-xl border border-neutral-900/60 text-center">
                  <span className="text-[9px] text-neutral-500 block uppercase font-bold">Nutrition Adh</span>
                  <span className="text-[#16C47F] font-mono font-bold block mt-1">{c.nutritionAdherence}%</span>
                </div>
                <div className="bg-neutral-950/40 p-2.5 rounded-xl border border-neutral-900/60 text-center">
                  <span className="text-[9px] text-neutral-500 block uppercase font-bold">Sleep Hrs</span>
                  <span className="text-white font-mono font-bold block mt-1">{c.sleepHours} hrs</span>
                </div>
                <div className="bg-neutral-950/40 p-2.5 rounded-xl border border-neutral-900/60 text-center">
                  <span className="text-[9px] text-neutral-500 block uppercase font-bold">Sleep Quality</span>
                  <span className="text-yellow-500 font-mono font-bold block mt-1">{c.sleepQuality}/10</span>
                </div>
                <div className="bg-neutral-950/40 p-2.5 rounded-xl border border-neutral-900/60 text-center">
                  <span className="text-[9px] text-neutral-500 block uppercase font-bold">Digestion</span>
                  <span className="text-white font-mono font-bold block mt-1">{c.digestion}/10</span>
                </div>
                <div className="bg-neutral-950/40 p-2.5 rounded-xl border border-neutral-900/60 text-center">
                  <span className="text-[9px] text-neutral-500 block uppercase font-bold">Stress Loading</span>
                  <span className="text-red-400 font-mono font-bold block mt-1">{c.stress}/10</span>
                </div>
              </div>

              {/* Comments box */}
              {c.additionalComments && (
                <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-900 text-neutral-300 leading-relaxed font-sans italic">
                  "{c.additionalComments}"
                </div>
              )}

            </div>
          ))
        )}
      </div>

    </div>
  );
}
