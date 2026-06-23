/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Client, InBodyRecord, SegmentalLeanAnalysis, SegmentalFatAnalysis } from '../types';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  Scale, 
  Plus, 
  TrendingUp, 
  Sparkles, 
  Activity, 
  Layers, 
  ChevronRight, 
  Info,
  Check,
  Zap,
  HelpCircle,
  Clock,
  X
} from 'lucide-react';

import { AIOutputFormatter } from './AIOutputFormatter';

interface InBodyViewProps {
  clients: Client[];
  inbodyRecords: InBodyRecord[];
  lang: 'en' | 'ar';
  t: any;
  onAddRecord: (record: InBodyRecord) => void;
  activeSelectedClientId?: string;
}

export default function InBodyView({
  clients,
  inbodyRecords,
  lang,
  t,
  onAddRecord,
  activeSelectedClientId
}: InBodyViewProps) {
  const [selectedClientId, setSelectedClientId] = useState<string>(
    activeSelectedClientId || (clients[0]?.id || '')
  );

  const selectedClient = clients.find(c => c.id === selectedClientId);
  const clientRecords = inbodyRecords
    .filter(r => r.clientId === selectedClientId)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // chronological for chart
  
  const reverseChronologicalRecords = [...clientRecords].reverse(); // latest first for logs list

  const [activeRecord, setActiveRecord] = useState<InBodyRecord | null>(
    reverseChronologicalRecords[0] || null
  );

  // Auto-align active record when client changes
  React.useEffect(() => {
    const records = inbodyRecords
      .filter(r => r.clientId === selectedClientId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setActiveRecord(records[0] || null);
  }, [selectedClientId, inbodyRecords]);

  // Form setup
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  
  // New Record Form Fields (Defaults represent a standard healthy adult)
  const [formWeight, setFormWeight] = useState(80);
  const [formSmm, setFormSmm] = useState(35);
  const [formBodyFat, setFormBodyFat] = useState(15);
  const [formPbf, setFormPbf] = useState(18);
  const [formBmi, setFormBmi] = useState(24.5);
  const [formBmr, setFormBmr] = useState(1750);
  const [formVisceral, setFormVisceral] = useState(6);
  const [formEcwTbw, setFormEcwTbw] = useState(0.380);
  const [formWhr, setFormWhr] = useState(0.85);
  const [formFatControl, setFormFatControl] = useState(-2.0);
  const [formMuscleControl, setFormMuscleControl] = useState(1.0);
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);

  // Segmental Lean Fields
  const [leanTrunk, setLeanTrunk] = useState(26.5);
  const [leanLArm, setLeanLArm] = useState(3.2);
  const [leanRArm, setLeanRArm] = useState(3.3);
  const [leanLLeg, setLeanLLeg] = useState(8.5);
  const [leanRLeg, setLeanRLeg] = useState(8.6);

  // Segmental Fat Fields
  const [fatTrunk, setFatTrunk] = useState(8.5);
  const [fatLArm, setFatLArm] = useState(1.2);
  const [fatRArm, setFatRArm] = useState(1.2);
  const [fatLLeg, setFatLLeg] = useState(2.2);
  const [fatRLeg, setFatRLeg] = useState(2.2);

  const triggerAIInterpretation = async (record: InBodyRecord) => {
    if (!record) return;
    setLoadingAI(true);
    try {
      const response = await fetch('/api/coach-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: 'interpret_inbody',
          clientData: selectedClient,
          inbodyData: record
        })
      });
      const data = await response.json();
      if (response.ok && data.result) {
        // Find record index and update it locally/save it
        record.interpretation = data.result;
        setActiveRecord({ ...record });
      } else {
        const errMsg = data.error || (lang === 'en' ? "AI Service currently offline." : "خدمة الذكاء الاصطناعي غير متاحة حالياً.");
        record.interpretation = `${lang === 'en' ? 'AI Interpretation Error:' : 'خطأ في التحليل الذكي:'} ${errMsg}`;
        setActiveRecord({ ...record });
      }
    } catch (e: any) {
      console.error(e);
      record.interpretation = `${lang === 'en' ? 'Network/API connection failed:' : 'فشل اتصال الشبكة/الخدمة:'} ${e.message || e}`;
      setActiveRecord({ ...record });
    } finally {
      setLoadingAI(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) return;

    const newRecord: InBodyRecord = {
      id: `ib_${Date.now()}`,
      clientId: selectedClientId,
      date: formDate,
      weight: Number(formWeight),
      smm: Number(formSmm),
      bodyFat: Number(formBodyFat),
      pbf: Number(formPbf),
      bmi: Number(formBmi),
      bmr: Number(formBmr),
      visceralFat: Number(formVisceral),
      ecwTbw: Number(formEcwTbw),
      whr: Number(formWhr),
      fatControl: Number(formFatControl),
      muscleControl: Number(formMuscleControl),
      segmentalLean: {
        trunk: Number(leanTrunk),
        leftArm: Number(leanLArm),
        rightArm: Number(leanRArm),
        leftLeg: Number(leanLLeg),
        rightLeg: Number(leanRLeg)
      },
      segmentalFat: {
        trunk: Number(fatTrunk),
        leftArm: Number(fatLArm),
        rightArm: Number(fatRArm),
        leftLeg: Number(fatLLeg),
        rightLeg: Number(fatRLeg)
      },
      interpretation: lang === 'en' 
        ? "Composition record registered successfully. Click 'Trigger AI' to compile scientific diagnostic insights." 
        : "تم تسجيل مخطط قياسات الجسم بنجاح. انقر فوق زر الذكاء الاصطناعي لاستخراج التوصيات والملاحظات الدقيقة."
    };

    onAddRecord(newRecord);
    setActiveRecord(newRecord);
    setIsFormOpen(false);
  };

  // Prepare chart metrics
  const chartData = clientRecords.map(r => ({
    date: r.date,
    Weight: r.weight,
    Muscle: r.smm,
    Fat: r.bodyFat,
    PBF: r.pbf
  }));

  return (
    <div className="space-y-6" id="inbody-view-root">
      
      {/* 1. Header controls (Selector & Creation toggle) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#101010] border border-neutral-850 p-4 rounded-2xl" id="inbody-header">
        <div className="flex items-center gap-3">
          <Scale className="w-5 h-5 text-[#16C47F]" />
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">{t.inbodyAnalysis}</h2>
            <p className="text-[10px] text-neutral-500">{lang === 'en' ? 'Track diagnostic bio-markers and segmental skeletal ratios' : 'سجل قياسات الوزن، والكتل المقطعية للماء والدهون'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Client select drop */}
          <select
            id="inbody-client-selector"
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="bg-[#181818] border border-neutral-800 rounded-xl py-1.5 px-3 text-xs font-semibold text-white focus:outline-none focus:border-[#FF4D00]"
          >
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {selectedClient && (
            <button
              id="write-new-inbody-btn"
              onClick={() => setIsFormOpen(true)}
              className="px-3 py-1.5 bg-[#FF4D00] hover:bg-[#E04400] text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {t.addInBody}
            </button>
          )}
        </div>
      </div>

      {selectedClient ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6" id="inbody-grid-bento">
          
          {/* 2. Left column - Timeline & comparative Chart */}
          <div className="xl:col-span-2 space-y-6" id="inbody-left-charts">
            
            {/* Visual comparative line charts */}
            {clientRecords.length > 0 ? (
              <div className="bg-[#101010] border border-neutral-850 rounded-2xl p-5 space-y-4" id="inbody-charts-panel">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">{t.trend}</h3>
                    <p className="text-[10px] text-neutral-500">{lang === 'en' ? 'Progress charts for Body Fat %, Weight & Muscle Mass' : 'منحنيات عضلات الجسم والدهون في ميزان المترتب'}</p>
                  </div>
                  <TrendingUp className="w-4 h-4 text-[#16C47F]" />
                </div>

                {/* Line Chart Component Container */}
                <div className="h-64 sm:h-72 w-full text-xs font-mono" id="recharts-trend-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                      <XAxis dataKey="date" stroke="#737373" />
                      <YAxis stroke="#737373" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#181818', borderColor: '#404040', borderRadius: '12px', color: '#fff' }}
                        labelStyle={{ fontWeight: 'bold' }}
                      />
                      <Legend verticalAlign="top" height={36} />
                      <Line type="monotone" dataKey="Weight" stroke="#FF4D00" strokeWidth={2.5} activeDot={{ r: 8 }} name={`${t.weight} (kg)`} />
                      <Line type="monotone" dataKey="Muscle" stroke="#16C47F" strokeWidth={2} name={`${t.smm} (kg)`} />
                      <Line type="monotone" dataKey="PBF" stroke="#F5B301" strokeWidth={2} name={`${t.pbf} (%)`} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="bg-[#101010] border border-neutral-850 rounded-2xl p-8 text-center text-neutral-500" id="empty-charts">
                {lang === 'en' ? 'Register an InBody assessment to generate chronological charts.' : 'قم بتسجيل قياسات المشترك للبدء برسم منحنيات التطور.'}
              </div>
            )}

            {/* Selected record metrics breakout bento */}
            {activeRecord ? (
              <div className="bg-[#101010] border border-neutral-850 rounded-2xl p-5 space-y-6" id="record-breakout-panel">
                <div className="flex items-center justify-between border-b border-neutral-850 pb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-neutral-500" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">{t.inbodyAnalysis} / {activeRecord.date}</span>
                  </div>
                  <span className="text-[10px] bg-neutral-800 text-neutral-300 font-bold px-2 py-0.5 rounded">
                    BMR: {activeRecord.bmr} kcal
                  </span>
                </div>

                {/* Primary Weight/Muscle/Fat ratios row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" id="ratios-primary-bento">
                  <div className="bg-[#181818] border border-neutral-800 rounded-xl p-3">
                    <span className="text-[10px] text-neutral-500 uppercase font-medium tracking-wide block">{t.weight}</span>
                    <span className="text-xl font-bold font-mono text-white block mt-1">{activeRecord.weight} kg</span>
                  </div>
                  <div className="bg-[#181818] border border-neutral-800 rounded-xl p-3">
                    <span className="text-[10px] text-[#16C47F] uppercase font-semibold tracking-wide block">{t.smm}</span>
                    <span className="text-xl font-bold font-mono text-[#16C47F] block mt-1">{activeRecord.smm} kg</span>
                  </div>
                  <div className="bg-[#181818] border border-neutral-800 rounded-xl p-3">
                    <span className="text-[10px] text-yellow-500 uppercase font-semibold tracking-wide block">{t.pbf}</span>
                    <span className="text-xl font-bold font-mono text-yellow-500 block mt-1">{activeRecord.pbf}%</span>
                  </div>
                </div>

                {/* Clinical biometric metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4" id="clinical-biometrics-grid">
                  <div>
                    <span className="text-[10px] text-neutral-500 uppercase block">{t.bmi}</span>
                    <span className="text-sm font-semibold text-white block mt-0.5 font-mono">{activeRecord.bmi}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-500 uppercase block">{t.visceralFat}</span>
                    <span className="text-sm font-semibold text-white block mt-0.5 font-mono">Lvl {activeRecord.visceralFat}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-500 uppercase block">{t.ecwTbw}</span>
                    <span className="text-sm font-semibold text-white block mt-0.5 font-mono">{activeRecord.ecwTbw}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-500 uppercase block">{t.whr} (WHR)</span>
                    <span className="text-sm font-semibold text-white block mt-0.5 font-mono">{activeRecord.whr}</span>
                  </div>
                </div>

                {/* Muscle-Fat Targets control */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-neutral-950 p-4 rounded-xl" id="targets-control">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-[#FF3B30] uppercase block font-semibold">{t.fatControl}</span>
                      <span className="text-xs text-neutral-500">{lang === 'en' ? 'Target reduction needed' : 'كتلة التخسيس الموصى بها'}</span>
                    </div>
                    <span className="text-sm font-bold font-mono text-[#FF3B30]">{activeRecord.fatControl} kg</span>
                  </div>
                  <div className="flex items-center justify-between border-t sm:border-t-0 sm:border-l border-neutral-800 pt-3 sm:pt-0 sm:pl-4">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-[#16C47F] uppercase block font-semibold">{t.muscleControl}</span>
                      <span className="text-xs text-neutral-500">{lang === 'en' ? 'Target skeletal accretion' : 'الزيادة العضلية المستهدفة'}</span>
                    </div>
                    <span className="text-sm font-bold font-mono text-[#16C47F]">{activeRecord.muscleControl > 0 ? `+${activeRecord.muscleControl}` : activeRecord.muscleControl} kg</span>
                  </div>
                </div>

                {/* Segmental lean & fat graphics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2" id="segmental-grids">
                  {/* Segmental Lean */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-[#16C47F] uppercase tracking-wider">{t.segmentalLean}</h4>
                    <div className="space-y-2.5 bg-neutral-950/60 p-3.5 rounded-xl border border-neutral-850">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-neutral-400">{t.trunk}</span>
                        <span className="font-mono text-white font-medium">{activeRecord.segmentalLean.trunk} kg</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-xs pt-1 border-t border-neutral-900">
                        <div>
                          <span className="text-[10px] text-neutral-500 uppercase block">{t.leftArm}</span>
                          <span className="font-mono text-white font-medium block">{activeRecord.segmentalLean.leftArm} kg</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-neutral-500 uppercase block">{t.rightArm}</span>
                          <span className="font-mono text-white font-medium block">{activeRecord.segmentalLean.rightArm} kg</span>
                        </div>
                        <div className="pt-1.5">
                          <span className="text-[10px] text-neutral-500 uppercase block">{t.leftLeg}</span>
                          <span className="font-mono text-white font-medium block">{activeRecord.segmentalLean.leftLeg} kg</span>
                        </div>
                        <div className="pt-1.5">
                          <span className="text-[10px] text-neutral-500 uppercase block">{t.rightLeg}</span>
                          <span className="font-mono text-white font-medium block">{activeRecord.segmentalLean.rightLeg} kg</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Segmental Fat */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-yellow-500 uppercase tracking-wider">{t.segmentalFat}</h4>
                    <div className="space-y-2.5 bg-neutral-950/60 p-3.5 rounded-xl border border-neutral-850">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-neutral-400">{t.trunk}</span>
                        <span className="font-mono text-white font-medium">{activeRecord.segmentalFat.trunk} kg</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-xs pt-1 border-t border-neutral-900">
                        <div>
                          <span className="text-[10px] text-neutral-500 uppercase block">{t.leftArm}</span>
                          <span className="font-mono text-white font-medium block">{activeRecord.segmentalFat.leftArm} kg</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-neutral-500 uppercase block">{t.rightArm}</span>
                          <span className="font-mono text-white font-medium block">{activeRecord.segmentalFat.rightArm} kg</span>
                        </div>
                        <div className="pt-1.5">
                          <span className="text-[10px] text-neutral-500 uppercase block">{t.leftLeg}</span>
                          <span className="font-mono text-white font-medium block">{activeRecord.segmentalFat.leftLeg} kg</span>
                        </div>
                        <div className="pt-1.5">
                          <span className="text-[10px] text-neutral-500 uppercase block">{t.rightLeg}</span>
                          <span className="font-mono text-white font-medium block">{activeRecord.segmentalFat.rightLeg} kg</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            ) : null}
          </div>

          {/* 3. Right column - AI Interpretation & History logs listing */}
          <div className="space-y-6" id="inbody-right-aside">
            {/* AI Diagnostics Diagnostic Card */}
            {activeRecord ? (
              <div className="bg-[#101010] border border-neutral-850 rounded-2xl p-5 space-y-4" id="ai-inbody-card">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#FF4D00]" />
                      {t.aiInterpretation}
                    </h3>
                  </div>
                </div>

                <div id="ai-interpretation-box" className="w-full">
                  {loadingAI ? (
                    <div className="bg-[#181818] border border-neutral-800 rounded-xl p-4 text-xs text-neutral-300 leading-relaxed">
                      <div className="py-8 text-center space-y-2 text-neutral-400 font-mono" id="ai-loading">
                        <Zap className="w-5 h-5 animate-bounce stroke-1 mx-auto text-[#FF4D00]" />
                        <p>{t.aiGenerating}</p>
                      </div>
                    </div>
                  ) : (
                    <AIOutputFormatter text={activeRecord.interpretation} lang={lang} />
                  )}
                </div>

                {!loadingAI && (
                  <button
                    id="trigger-ai-interpretation-btn"
                    onClick={() => triggerAIInterpretation(activeRecord)}
                    className="w-full py-2 bg-neutral-900 border border-neutral-800 hover:border-[#FF4D00] hover:bg-neutral-850 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#FF4D00]" />
                    {lang === 'en' ? 'Trigger AI Precision diagnostic' : 'استخرج تحليل الذكاء الاصطناعي'}
                  </button>
                )}
              </div>
            ) : null}

            {/* InBody History logs sidebar list */}
            <div className="bg-[#101010] border border-neutral-850 rounded-2xl p-5 space-y-4" id="inbody-logs-sidebar">
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">{t.history}</h3>
              
              <div className="space-y-2 max-h-64 overflow-y-auto" id="inbody-history-list">
                {reverseChronologicalRecords.length === 0 ? (
                  <div className="text-center py-6 text-xs text-neutral-500" id="empty-history">
                    {lang === 'en' ? 'Empty record directory.' : 'سجل قياسات فارغ حالياً.'}
                  </div>
                ) : (
                  reverseChronologicalRecords.map((item) => {
                    const isSelected = activeRecord?.id === item.id;
                    return (
                      <div
                        key={item.id}
                        id={`historical-record-btn-${item.id}`}
                        onClick={() => setActiveRecord(item)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected 
                            ? 'bg-neutral-900 border-[#FF4D00]/50' 
                            : 'bg-[#181818] border-transparent hover:bg-neutral-900/60'
                        }`}
                      >
                        <div>
                          <span className="text-xs font-bold text-white block font-mono">{item.date}</span>
                          <span className="text-[10px] text-neutral-500 block">{item.bmi} BMI • {item.visceralFat} Lvl</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-[#16C47F] block font-mono">{item.pbf}%</span>
                          <span className="text-[10px] text-neutral-400 block font-mono">{item.weight} kg</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

        </div>
      ) : (
        <div className="bg-[#101010] border border-neutral-850 rounded-2xl p-8 text-center text-neutral-500" id="no-client-error shadow">
          {lang === 'en' ? 'Register or select a client' : 'إستكمال بيانات للتسجيل'}
        </div>
      )}

      {/* 4. Form Dialog - Record InBody assessment modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm shadow-xl" id="inbody-modal">
          <div className="bg-[#101010] border border-[#2e2e2e] rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col" id="inbody-inner-content">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-850">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-[#16C47F]" />
                {t.addInBody}
              </h3>
              <button 
                id="close-inbody-modal"
                onClick={() => setIsFormOpen(false)}
                className="text-neutral-500 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable form body */}
            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-6" id="inbody-form">
              
              {/* Part A: Basic stats */}
              <div className="space-y-3" id="part-basic-metrics">
                <h4 className="text-[11px] font-bold text-[#FF4D00] uppercase tracking-wider">{lang === 'en' ? 'Core Body Composition metrics' : 'القياسات الأساسية للجفن والكتل'}</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="text-[10px] text-neutral-400 uppercase tracking-wider mb-1 block">{lang === 'en' ? 'Assessment Date' : 'تاريخ الفحص'}</label>
                    <input
                      required
                      id="inbody-form-date"
                      type="date"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full bg-[#181818] border border-neutral-800 rounded-xl py-1.5 px-3 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-400 uppercase tracking-wider mb-1 block">{lang === 'en' ? 'Total Weight (kg)' : 'الوزن الإجمالي (كغ)'}</label>
                    <input
                      required
                      id="inbody-form-weight"
                      type="number"
                      step="0.01"
                      value={formWeight}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setFormWeight(val);
                        // Safe estimate of SMM and Fat to assist the coach
                        setFormSmm(Math.round(val * 0.44));
                        setFormBodyFat(Math.round(val * 0.18));
                        if (selectedClient) {
                          const heightM = selectedClient.height / 100;
                          setFormBmi(Number((val / (heightM * heightM)).toFixed(1)));
                        }
                      }}
                      className="w-full bg-[#181818] border border-neutral-800 rounded-xl py-1.5 px-3 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-400 uppercase tracking-wider mb-1 block">{t.smm} (kg)</label>
                    <input
                      required
                      id="inbody-form-smm"
                      type="number"
                      step="0.1"
                      value={formSmm}
                      onChange={(e) => setFormSmm(Number(e.target.value))}
                      className="w-full bg-[#181818] border border-neutral-800 rounded-xl py-1.5 px-3 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-400 uppercase tracking-wider mb-1 block">{lang === 'en' ? 'Percent Fat (%)' : 'نسبة الدهون (%)'}</label>
                    <input
                      required
                      id="inbody-form-pbf"
                      type="number"
                      step="0.1"
                      value={formPbf}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setFormPbf(val);
                        setFormBodyFat(Number(((formWeight * val) / 100).toFixed(1)));
                      }}
                      className="w-full bg-[#181818] border border-neutral-800 rounded-xl py-1.5 px-3 text-xs text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Part B: Secondary clinical statistics (Visceral / WHR) */}
              <div className="space-y-3 border-t border-neutral-900 pt-4" id="part-clinical-metrics">
                <h4 className="text-[11px] font-bold text-yellow-500 uppercase tracking-wider">{lang === 'en' ? 'Clinical Bio-indicators' : 'المؤشرات الطبيعية'}</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="text-[10px] text-neutral-400 uppercase block mb-1">{t.bmi}</label>
                    <input
                      type="number"
                      step="0.1"
                      id="inbody-form-bmi"
                      value={formBmi}
                      onChange={(e) => setFormBmi(Number(e.target.value))}
                      className="w-full bg-[#181818] border border-neutral-800 rounded-xl py-1.5 px-3 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-400 uppercase block mb-1">BMR (kcal)</label>
                    <input
                      type="number"
                      id="inbody-form-bmr"
                      value={formBmr}
                      onChange={(e) => setFormBmr(Number(e.target.value))}
                      className="w-full bg-[#181818] border border-neutral-800 rounded-xl py-1.5 px-3 text-xs text-[#fff]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-400 uppercase block mb-1">{lang === 'en' ? 'Visceral Fat lvl (1-20)' : 'الدهون الحشوية (1-20)'}</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      id="inbody-form-visceral"
                      value={formVisceral}
                      onChange={(e) => setFormVisceral(Number(e.target.value))}
                      className="w-full bg-[#181818] border border-neutral-800 rounded-xl py-1.5 px-3 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-400 uppercase block mb-1">ECW/TBW (ideal ~0.380)</label>
                    <input
                      type="number"
                      step="0.001"
                      id="inbody-form-ecwtbw"
                      value={formEcwTbw}
                      onChange={(e) => setFormEcwTbw(Number(e.target.value))}
                      className="w-full bg-[#181818] border border-neutral-800 rounded-xl py-1.5 px-3 text-xs text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Part C: Segmental lean & fat elements */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-neutral-900 pt-4" id="part-segmental-inputs">
                {/* Lean */}
                <div className="space-y-3">
                  <h4 className="text-[11px] font-bold text-[#16C47F] uppercase tracking-wider">{t.segmentalLean} (kg)</h4>
                  <div className="grid grid-cols-2 gap-3 bg-[#181818] p-3 rounded-xl border border-neutral-850">
                    <div className="col-span-2">
                      <label className="text-[9px] text-neutral-400 uppercase block mb-1">{t.trunk}</label>
                      <input type="number" step="0.1" value={leanTrunk} onChange={(e) => setLeanTrunk(Number(e.target.value))} className="w-full bg-neutral-900 rounded-lg p-1.5 text-xs text-white" />
                    </div>
                    <div>
                      <label className="text-[9px] text-neutral-500 uppercase block mb-1">{t.leftArm}</label>
                      <input type="number" step="0.1" value={leanLArm} onChange={(e) => setLeanLArm(Number(e.target.value))} className="w-full bg-neutral-900 rounded-lg p-1.5 text-xs text-white font-mono" />
                    </div>
                    <div>
                      <label className="text-[9px] text-neutral-500 uppercase block mb-1">{t.rightArm}</label>
                      <input type="number" step="0.1" value={leanRArm} onChange={(e) => setLeanRArm(Number(e.target.value))} className="w-full bg-neutral-900 rounded-lg p-1.5 text-xs text-white font-mono" />
                    </div>
                    <div>
                      <label className="text-[9px] text-neutral-500 uppercase block mb-1">{t.leftLeg}</label>
                      <input type="number" step="0.1" value={leanLLeg} onChange={(e) => setLeanLLeg(Number(e.target.value))} className="w-full bg-neutral-900 rounded-lg p-1.5 text-xs text-white font-mono" />
                    </div>
                    <div>
                      <label className="text-[9px] text-neutral-500 uppercase block mb-1">{t.rightLeg}</label>
                      <input type="number" step="0.1" value={leanRLeg} onChange={(e) => setLeanRLeg(Number(e.target.value))} className="w-full bg-neutral-900 rounded-lg p-1.5 text-xs text-white font-mono" />
                    </div>
                  </div>
                </div>

                {/* Fat */}
                <div className="space-y-3">
                  <h4 className="text-[11px] font-bold text-yellow-500 uppercase tracking-wider">{t.segmentalFat} (kg)</h4>
                  <div className="grid grid-cols-2 gap-3 bg-[#181818] p-3 rounded-xl border border-neutral-850">
                    <div className="col-span-2">
                      <label className="text-[9px] text-neutral-400 uppercase block mb-1">{t.trunk}</label>
                      <input type="number" step="0.1" value={fatTrunk} onChange={(e) => setFatTrunk(Number(e.target.value))} className="w-full bg-neutral-900 rounded-lg p-1.5 text-xs text-white" />
                    </div>
                    <div>
                      <label className="text-[9px] text-neutral-500 uppercase block mb-1">{t.leftArm}</label>
                      <input type="number" step="0.1" value={fatLArm} onChange={(e) => setFatLArm(Number(e.target.value))} className="w-full bg-neutral-900 rounded-lg p-1.5 text-xs text-white font-mono" />
                    </div>
                    <div>
                      <label className="text-[9px] text-neutral-500 uppercase block mb-1">{t.rightArm}</label>
                      <input type="number" step="0.1" value={fatRArm} onChange={(e) => setFatRArm(Number(e.target.value))} className="w-full bg-neutral-900 rounded-lg p-1.5 text-xs text-white font-mono" />
                    </div>
                    <div>
                      <label className="text-[9px] text-neutral-500 uppercase block mb-1">{t.leftLeg}</label>
                      <input type="number" step="0.1" value={fatLLeg} onChange={(e) => setFatLLeg(Number(e.target.value))} className="w-full bg-neutral-900 rounded-lg p-1.5 text-xs text-white font-mono" />
                    </div>
                    <div>
                      <label className="text-[9px] text-neutral-500 uppercase block mb-1">{t.rightLeg}</label>
                      <input type="number" step="0.1" value={fatRLeg} onChange={(e) => setFatRLeg(Number(e.target.value))} className="w-full bg-neutral-900 rounded-lg p-1.5 text-xs text-white font-mono" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Form submit footer */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-neutral-850" id="inbody-form-actions">
                <button
                  id="inbody-cancel-btn"
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-medium rounded-xl text-xs sm:text-sm cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  id="inbody-save-btn"
                  type="submit"
                  className="px-4 py-2 bg-[#FF4D00] hover:bg-[#E04400] text-white font-medium rounded-xl text-xs sm:text-sm cursor-pointer"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
