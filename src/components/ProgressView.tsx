/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Client, ProgressLog } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  Activity, 
  Plus, 
  CheckCircle, 
  Image as ImageIcon, 
  TrendingUp, 
  Trash2, 
  ArrowUpRight, 
  Sparkles, 
  Heart,
  Scale,
  X
} from 'lucide-react';

interface ProgressViewProps {
  clients: Client[];
  progressLogs: ProgressLog[];
  lang: 'en' | 'ar';
  t: any;
  onAddProgressLog: (log: ProgressLog) => void;
  activeSelectedClientId?: string;
}

export default function ProgressView({
  clients,
  progressLogs,
  lang,
  t,
  onAddProgressLog,
  activeSelectedClientId
}: ProgressViewProps) {
  const [selectedClientId, setSelectedClientId] = useState<string>(
    activeSelectedClientId || (clients[0]?.id || '')
  );

  const selectedClient = clients.find(c => c.id === selectedClientId);

  const clientHistory = progressLogs
    .filter(log => log.clientId === selectedClientId)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const reversedLogs = [...clientHistory].reverse();

  // Dialog triggers
  const [isLogOpen, setIsLogOpen] = useState(false);

  // Form parameters
  const [formWeight, setFormWeight] = useState(80);
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formWaist, setFormWaist] = useState(82);
  const [formChest, setFormChest] = useState(100);
  const [formArms, setFormArms] = useState(38);
  const [formThighs, setFormThighs] = useState(58);
  const [formComplianceTrain, setFormComplianceTrain] = useState(90);
  const [formComplianceNutr, setFormComplianceNutr] = useState(85);
  const [formNotes, setFormNotes] = useState('');
  const [formPhoto, setFormPhoto] = useState('');
  const [formLoadVolume, setFormLoadVolume] = useState(12000);

  // Handle default forms when client transforms
  React.useEffect(() => {
    if (selectedClient) {
      setFormWeight(selectedClient.weight);
    }
  }, [selectedClientId, selectedClient]);

  const handleProgressResetForm = () => {
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormNotes('');
    setFormPhoto('');
    setIsLogOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) return;

    const rate = Math.round((formComplianceTrain + formComplianceNutr) / 2);

    const newLog: ProgressLog = {
      id: `log_${Date.now()}`,
      clientId: selectedClientId,
      date: formDate,
      weight: Number(formWeight),
      measurements: {
        waist: Number(formWaist),
        chest: Number(formChest),
        armsLeft: Number(formArms),
        armsRight: Number(formArms),
        thighLeft: Number(formThighs),
        thighRight: Number(formThighs)
      },
      complianceRate: rate,
      photos: formPhoto ? [formPhoto] : [],
      coachNotes: formNotes
    };

    onAddProgressLog(newLog);
    setIsLogOpen(false);
  };

  // Safe file upload simulation
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Chart configs
  const weightChartData = clientHistory.map(h => ({
    date: h.date,
    Weight: h.weight,
    Waist: h.measurements?.waist || 80,
    LoadVolume: h.weight * 150 // Estimated cumulative payload index
  }));

  return (
    <div className="space-y-6" id="progress-view-root">
      
      {/* 1. Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#101010] border border-neutral-850 p-4 rounded-2xl" id="progress-header">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-[#FF4D00]" />
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">{t.performanceCompliance}</h2>
            <p className="text-[10px] text-neutral-500">{lang === 'en' ? 'Biomechanical progress tracking over time intervals' : 'سجل تطور كتل الدهون، القياسات، والالتزام الأسبوعي بالمحاضرات والوجبات'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            id="progress-client-selector"
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="bg-[#181818] border border-neutral-800 rounded-xl py-1.5 px-3 text-xs font-semibold text-white focus:outline-none"
          >
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {selectedClient && (
            <button
              id="write-new-log-btn"
              onClick={handleProgressResetForm}
              className="px-3 py-1.5 bg-[#FF4D00] hover:bg-[#E04400] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {t.logProgress}
            </button>
          )}
        </div>
      </div>

      {selectedClient ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6" id="progress-workspace">
          
          {/* Left space - Overload charts / dynamic tracking diagrams */}
          <div className="xl:col-span-2 space-y-6" id="progress-chart-block">
            
            {clientHistory.length > 0 ? (
              <div className="bg-[#101010] border border-neutral-850 rounded-2xl p-5 space-y-4" id="progress-charts">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">{t.trend}</h3>
                    <p className="text-[10px] text-neutral-500">{lang === 'en' ? 'Track Weight (kg) vs Waist Circumference (cm)' : 'نمو عضلات الجسد بالمقارنة مع دهون البطن والخصر'}</p>
                  </div>
                  <TrendingUp className="w-4 h-4 text-[#FF4D00]" />
                </div>

                <div className="h-64 sm:h-72 w-full text-xs font-mono" id="progress-chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weightChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                      <XAxis dataKey="date" stroke="#737373" />
                      <YAxis stroke="#737373" />
                      <Tooltip contentStyle={{ backgroundColor: '#181818', borderColor: '#404040', borderRadius: '12px' }} />
                      <Line type="monotone" dataKey="Weight" stroke="#FF4D00" strokeWidth={2.5} name={`${t.weight} (kg)`} />
                      <Line type="monotone" dataKey="Waist" stroke="#F5B301" strokeWidth={2} name={`${lang === 'en' ? 'Waist' : 'الخصر'} (cm)`} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="bg-[#101010] border border-neutral-850 rounded-2xl p-8 text-center text-neutral-500">
                {lang === 'en' ? 'No achievements logged yet. File progressive workout markers to spin trend lines.' : 'سجل مؤشرات تطور جديدة لفتح منسوب التشارت الحركي.'}
              </div>
            )}

            {/* Photo comparison checkin gallery */}
            <div className="bg-[#101010] border border-neutral-850 rounded-2xl p-5 space-y-4" id="photo-gallery">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-orange-400" />
                {lang === 'en' ? 'Photo Check-Ins Gallery' : 'معرض المقارنات والصور التدريبية'}
              </h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" id="photos-grid">
                {reversedLogs.filter(log => log.photos && log.photos.length > 0).length === 0 ? (
                  <div className="col-span-4 p-8 text-center text-xs text-neutral-500 border border-dashed border-neutral-800 rounded-xl">
                    {lang === 'en' ? 'Aesthetic transformations start here. Attach picture updates on your next record.' : 'لا يوجد صور محملة للآن.'}
                  </div>
                ) : (
                  reversedLogs.filter(log => log.photos && log.photos.length > 0).map(log => (
                    <div key={log.id} className="bg-neutral-950 p-2 rounded-xl border border-neutral-900 flex flex-col justify-between" id={`p-card-${log.id}`}>
                      <div className="aspect-square w-full rounded-lg overflow-hidden bg-neutral-900 border border-neutral-850 relative">
                        <img 
                          src={log.photos[0]} 
                          alt="Athlete Form checkin" 
                          referrerPolicy="no-referrer"
                          className="object-cover h-full w-full"
                        />
                        <span className="absolute bottom-2 left-2 bg-black/70 px-2 py-0.5 rounded text-[8px] font-mono font-bold text-white uppercase">
                          {log.date}
                        </span>
                      </div>
                      <span className="text-[9px] text-neutral-500 font-mono mt-2 block text-center truncate">{log.weight} kg</span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Right column - Compliance ratios & tape diagnostics list */}
          <div className="space-y-6" id="progress-right-side">
            
            {/* Visual breakdown gauges */}
            {reversedLogs[0] ? (
              <div className="bg-[#101010] border border-neutral-850 rounded-2xl p-5 space-y-4" id="latestcheckin-bento">
                <div className="flex items-center justify-between border-b border-neutral-850 pb-3">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">{lang === 'en' ? 'Latest Assessment Data' : 'أحدث أرقام تطور المشترك'}</h3>
                  <span className="text-[10px] bg-neutral-800 text-neutral-300 font-bold px-2 py-0.5 rounded uppercase font-mono">{reversedLogs[0].date}</span>
                </div>

                {/* Compliance meters */}
                <div className="grid grid-cols-1 gap-4" id="compliance-gauges">
                  <div className="bg-neutral-950/60 border border-neutral-850 rounded-xl p-3 text-center">
                    <span className="text-[9px] text-neutral-500 uppercase block font-bold">{t.trainCompliance} / {t.nutrCompliance}</span>
                    <span className="text-lg font-bold font-mono text-[#16C47F] mt-1 block">{reversedLogs[0].complianceRate}%</span>
                  </div>
                </div>

                {/* Tape measurements breakout */}
                <div className="bg-neutral-950/60 p-4 rounded-xl border border-neutral-850 space-y-2 text-xs" id="tape-breakout">
                  <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider block">{lang === 'en' ? 'Biomechanical Girth Tape (cm)' : 'محيط القياسات الحركية (سم)'}</span>
                  <div className="grid grid-cols-2 gap-3 pt-2 text-[11px] font-mono">
                    <div className="flex justify-between border-b border-neutral-900 pb-1">
                      <span className="text-neutral-400">Waist</span>
                      <strong className="text-white">{reversedLogs[0].measurements?.waist || '---'}</strong>
                    </div>
                    <div className="flex justify-between border-b border-neutral-900 pb-1">
                      <span className="text-neutral-400">Chest</span>
                      <strong className="text-white">{reversedLogs[0].measurements?.chest || '---'}</strong>
                    </div>
                    <div className="flex justify-between border-b border-neutral-900 pb-1">
                      <span className="text-neutral-400">Arms</span>
                      <strong className="text-white">{reversedLogs[0].measurements?.armsLeft || '---'}</strong>
                    </div>
                    <div className="flex justify-between border-b border-neutral-900 pb-1">
                      <span className="text-neutral-400">Thighs</span>
                      <strong className="text-white">{reversedLogs[0].measurements?.thighLeft || '---'}</strong>
                    </div>
                  </div>
                </div>

                {/* Overload markers */}
                <div className="flex justify-between items-center text-xs text-neutral-400 font-mono bg-neutral-950/40 p-2.5 rounded-xl border border-neutral-850/50" id="overload-row">
                  <span>Workout Load Volume:</span>
                  <strong className="text-[#FF4D00]">{(reversedLogs[0].weight * 150).toLocaleString()} kg</strong>
                </div>

              </div>
            ) : null}

            {/* Historical list sidebar directory */}
            <div className="bg-[#101010] border border-neutral-850 rounded-2xl p-5 space-y-4" id="progress-history">
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">{t.history}</h3>
              
              <div className="space-y-2.5 max-h-64 overflow-y-auto" id="progress-history-list">
                {reversedLogs.length === 0 ? (
                  <div className="text-center py-6 text-xs text-neutral-500" id="hist-log-empty">
                    {lang === 'en' ? 'No checks logged.' : 'السجل فارغ تدريبياً.'}
                  </div>
                ) : (
                  reversedLogs.map(item => (
                    <div key={item.id} className="p-3 bg-[#181818] border border-neutral-850 rounded-xl text-xs space-y-1" id={`hist-item-${item.id}`}>
                      <div className="flex justify-between font-mono">
                        <strong className="text-white">{item.date}</strong>
                        <span className="text-[#FF4D00]">{item.weight} kg</span>
                      </div>
                      <p className="text-[10px] text-neutral-400 leading-normal italic">{item.coachNotes || '---'}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>
      ) : (
        <div className="bg-[#101010] border border-neutral-850 rounded-2xl p-8 text-center text-neutral-500 shadow-xl" id="no-client-screen">
          Register or select a client.
        </div>
      )}

      {/* 3. Progress Log Modal Dialog Onboarder */}
      {isLogOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm" id="progress-modal">
          <div className="bg-[#101010] border border-neutral-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl" id="progress-modal-inner">
            <div className="flex items-center justify-between p-4 border-b border-neutral-850">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-[#FF4D00]" />
                {t.logProgress}
              </h3>
              <button onClick={() => setIsLogOpen(false)} className="text-neutral-500 hover:text-white cursor-pointer"><X className="w-5 h-5"/></button>
            </div>

            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-5" id="progress-log-form">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Date */}
                <div>
                  <label className="text-[10px] text-neutral-400 uppercase tracking-wider mb-1 block">Log date</label>
                  <input
                    required
                    id="progress-form-date"
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-[#181818] border border-neutral-800 rounded-xl py-1.5 px-3 text-xs text-white"
                  />
                </div>

                {/* Weight */}
                <div>
                  <label className="text-[10px] text-neutral-400 uppercase tracking-wider mb-1 block">Weight (kg)</label>
                  <input
                    required
                    id="progress-form-weight"
                    type="number"
                    step="0.1"
                    value={formWeight}
                    onChange={(e) => setFormWeight(Number(e.target.value))}
                    className="w-full bg-[#181818] border border-neutral-800 rounded-xl py-1.5 px-3 text-xs text-white"
                  />
                </div>

                {/* Compliance Training */}
                <div>
                  <label className="text-[10px] text-neutral-400 uppercase tracking-wider mb-1 block">Workout compliance (%)</label>
                  <input
                    required
                    id="progress-form-comp-train"
                    type="number"
                    min="0"
                    max="100"
                    value={formComplianceTrain}
                    onChange={(e) => setFormComplianceTrain(Number(e.target.value))}
                    className="w-full bg-[#181818] border border-neutral-800 rounded-xl py-1.5 px-3 text-xs text-white"
                  />
                </div>

                {/* Compliance Nutrition */}
                <div>
                  <label className="text-[10px] text-neutral-400 uppercase tracking-wider mb-1 block">Nutrition compliance (%)</label>
                  <input
                    required
                    id="progress-form-comp-nutrition"
                    type="number"
                    min="0"
                    max="100"
                    value={formComplianceNutr}
                    onChange={(e) => setFormComplianceNutr(Number(e.target.value))}
                    className="w-full bg-[#181818] border border-neutral-800 rounded-xl py-1.5 px-3 text-xs text-white"
                  />
                </div>

                {/* Measurements girth */}
                <div className="col-span-1 sm:col-span-2 bg-[#181818] p-4 rounded-xl border border-neutral-850/60 grid grid-cols-4 gap-3">
                  <div className="col-span-4 border-b border-neutral-800 pb-1.5">
                    <span className="text-[9px] text-[#FF4D00] uppercase tracking-wider font-bold">Body Tape girth measurements (cm)</span>
                  </div>
                  <div>
                    <label className="text-[9px] text-neutral-400 uppercase block mb-1">Waist</label>
                    <input type="number" value={formWaist} onChange={(e) => setFormWaist(Number(e.target.value))} className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-xs text-white font-mono" />
                  </div>
                  <div>
                    <label className="text-[9px] text-neutral-400 uppercase block mb-1">Chest</label>
                    <input type="number" value={formChest} onChange={(e) => setFormChest(Number(e.target.value))} className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-xs text-white font-mono" />
                  </div>
                  <div>
                    <label className="text-[9px] text-neutral-400 uppercase block mb-1">Arms</label>
                    <input type="number" value={formArms} onChange={(e) => setFormArms(Number(e.target.value))} className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-xs text-white font-mono" />
                  </div>
                  <div>
                    <label className="text-[9px] text-neutral-400 uppercase block mb-1">Thighs</label>
                    <input type="number" value={formThighs} onChange={(e) => setFormThighs(Number(e.target.value))} className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-xs text-white font-mono" />
                  </div>
                </div>

                {/* Estimated load volume */}
                <div>
                  <label className="text-[10px] text-neutral-400 uppercase block mb-1">Accumulated Workout Load Volume (kg)</label>
                  <input
                    type="number"
                    id="progress-form-weight-vol"
                    value={formLoadVolume}
                    onChange={(e) => setFormLoadVolume(Number(e.target.value))}
                    className="w-full bg-[#181818] border border-neutral-800 rounded-xl py-1.5 px-3 text-xs text-white"
                  />
                </div>

                {/* Photo checkin */}
                <div>
                  <label className="text-[10px] text-neutral-400 uppercase block mb-1">Upload progression shot</label>
                  <input
                    id="progress-form-file"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="w-full text-xs text-neutral-400 file:mr-2 file:py-1 file:px-2 file:rounded-xl file:border-0 file:text-[10px] file:font-semibold file:bg-neutral-800 file:text-white hover:file:bg-neutral-700 cursor-pointer"
                  />
                </div>

                {/* Notes */}
                <div className="col-span-1 sm:col-span-2">
                  <label className="text-[10px] text-neutral-400 uppercase block mb-1">Biophysiological feedback remarks</label>
                  <textarea
                    id="progress-form-notes"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    rows={2}
                    className="w-full bg-[#181818] border border-neutral-800 rounded-xl py-1.5 px-3 text-xs text-white"
                  />
                </div>

              </div>

              {/* Form submit */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-neutral-850" id="progress-form-actions">
                <button
                  type="button"
                  id="progress-cancel-btn"
                  onClick={() => setIsLogOpen(false)}
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-medium rounded-xl text-xs sm:text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="progress-save-btn"
                  type="submit"
                  className="px-4 py-2 bg-[#FF4D00] hover:bg-[#E04400] text-white font-medium rounded-xl text-xs sm:text-sm cursor-pointer"
                >
                  Save Check
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
