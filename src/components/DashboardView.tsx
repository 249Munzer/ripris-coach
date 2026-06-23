/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Client, InBodyRecord, ProgressLog, SmartAlert } from '../types';
import { 
  getWeeklyCheckIns, 
  getSmartAlerts, 
  saveSmartAlerts, 
  getClientGoals 
} from '../storage/db';
import { 
  Users, 
  Scale, 
  Sparkles, 
  TrendingUp, 
  Calendar, 
  Plus, 
  ArrowUpRight,
  TrendingDown, 
  CheckCircle, 
  Flame, 
  Dumbbell,
  Bell,
  DollarSign,
  Percent,
  ShieldAlert,
  AlertTriangle,
  Award,
  Zap,
  Trash2,
  X
} from 'lucide-react';
import DailyCheckInWidget from './DailyCheckInWidget';

interface DashboardViewProps {
  clients: Client[];
  inbody: InBodyRecord[];
  progress: ProgressLog[];
  lang: 'en' | 'ar';
  t: any;
  onNavigate: (view: string, targetClientId?: string) => void;
  onImportDemo: () => void;
  coachName?: string;
}

export default function DashboardView({ 
  clients, 
  inbody, 
  progress, 
  lang, 
  t, 
  onNavigate, 
  onImportDemo,
  coachName
}: DashboardViewProps) {
  
  const isRtl = lang === 'ar';
  const activeClients = clients.filter(c => c.status === 'active');
  const recentInBody = inbody.slice(0, 3);

  // Dynamic system-level smart alerts
  const [alerts, setAlerts] = useState<SmartAlert[]>([]);

  useEffect(() => {
    const saved = getSmartAlerts();
    const compiled: SmartAlert[] = [];

    // Compliance Adherence warnings
    const checkins = getWeeklyCheckIns();
    clients.forEach(c => {
      if (c.status === 'soft_deleted') return;
      const cCheckins = checkins.filter(ch => ch.clientId === c.id);
      if (cCheckins.length > 0) {
        const avgAdh = cCheckins.reduce((sum, ch) => sum + ch.nutritionAdherence, 0) / cCheckins.length;
        if (avgAdh < 75) {
          compiled.push({
            id: `alert_adh_${c.id}`,
            clientId: c.id,
            clientName: c.name,
            date: new Date().toISOString().split('T')[0],
            type: 'low_compliance',
            priority: 'high',
            category: 'compliance',
            title: `Severe Adherence Deficit: ${c.name}`,
            titleAr: `عجز شديد بالالتزام: ${c.name}`,
            description: `Nutrition macro adherence average has fallen to ${avgAdh.toFixed(0)}% this week. Review diet plan.`,
            descriptionAr: `معدل التزام التغذية انخفض إلى ${avgAdh.toFixed(0)}% هذا الأسبوع.`,
            suggestedAction: 'Review diet plan',
            suggestedActionAr: 'مراجعة الخطة الغذائية',
            status: 'active'
          });
        }
      }
    });

    // Bio Safety warning
    clients.forEach(c => {
      if (c.status === 'injured') {
        compiled.push({
          id: `alert_injury_${c.id}`,
          clientId: c.id,
          clientName: c.name,
          date: new Date().toISOString().split('T')[0],
          type: 'under_recovery',
          priority: 'high',
          category: 'medical',
          title: `Movement Restriction Alert: ${c.name}`,
          titleAr: `تنبيه حدود الحركة: ${c.name}`,
          description: `Status marked as INJURED. Restructure load volume variables and preserve rehabilitation priority.`,
          descriptionAr: `الحالة مسجلة كإصابة نشطة. يُنصح بإعادة هيكلة زيادة الأحمال وتأمين سلامة العضلات المجاورة.`,
          suggestedAction: 'Restructure load volume',
          suggestedActionAr: 'تقليص أو تكييف الأحمال التدريبية',
          status: 'active'
        });
      }
    });

    // Soft deleted warning
    clients.forEach(c => {
      if (c.status === 'soft_deleted') {
        compiled.push({
          id: `alert_soft_${c.id}`,
          clientId: c.id,
          clientName: c.name,
          date: new Date().toISOString().split('T')[0],
          type: 'inactive',
          priority: 'medium',
          category: 'general',
          title: `Recycle Bin Count Down: ${c.name}`,
          titleAr: `عد السلة التنازلي: ${c.name}`,
          description: `Active profile moved to trash. Recovery grace period expires in 28 days.`,
          descriptionAr: `تم إرسال الملف إلى سلة الحذف المؤقت. مدة التراجع المتاحة تنتهي خلال 28 يوماً.`,
          suggestedAction: 'Restore profile or purge',
          suggestedActionAr: 'استعادة الملف أو تركة للحذف النهائي',
          status: 'active'
        });
      }
    });

    // Merge saved ones
    saved.forEach(s => {
      if (s.status !== 'dismissed' && !compiled.some(c => c.id === s.id)) {
        compiled.push(s);
      }
    });

    setAlerts(compiled.slice(0, 4));
  }, [clients]);

  const handleDismissAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId));
    // Persist in localStorage to survive restarts
    const saved = getSmartAlerts();
    const updated = saved.map(s => s.id === alertId ? { ...s, status: 'dismissed' as const } : s);
    saveSmartAlerts(updated);
  };

  // System 12 Coach Business Metrics calculations
  const monthlyPremiumCharge = 150; // Standard premium personal trainer fee
  const currentSaaSMRR = activeClients.length * monthlyPremiumCharge;
  const slotCapacityPercentage = Math.round((activeClients.length / 30) * 100);
  const clientRetentionScore = clients.length > 0 
    ? ((clients.filter(c => c.status !== 'inactive' && c.status !== 'soft_deleted').length / clients.length) * 100).toFixed(1)
    : '100';

  // Calculate key metrics
  const avgPbf = inbody.length > 0 
    ? (inbody.reduce((acc, curr) => acc + curr.pbf, 0) / inbody.length).toFixed(1) 
    : 'N/A';
    
  const totalVolumeProgress = progress.length > 0
    ? (progress.reduce((acc, curr) => acc + curr.complianceRate, 0) / progress.length).toFixed(0)
    : '0';

  return (
    <div className="space-y-6" id="dashboard-view-root">
      {/* Welcome Hero Panel */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-neutral-950 to-neutral-900 border border-neutral-800 p-6 sm:p-8" id="dashboard-hero">
        <div className="absolute right-0 top-0 h-40 w-40 bg-[#FF4D00]/10 rounded-full blur-3xl" />
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FF4D00]/10 text-[#FF4D00] text-xs font-medium uppercase tracking-wider" id="dash-live-badge">
            <Flame className="w-3.5 h-3.5 animate-pulse" />
            {t.tagline}
          </div>
          <h1 className="text-2xl sm:text-4xl font-sans font-bold tracking-tight text-white leading-tight">
            {lang === 'en' 
              ? `Welcome Back, Coach ${coachName || 'Sterling'}` 
              : `مرحباً بعودتك، كوتش ${coachName || 'سلمان'}`}
          </h1>
          <p className="text-sm sm:text-base text-neutral-400 max-w-xl">
            {lang === 'en' 
              ? 'Analyze body composition metrics, optimize progressive overload templates, and write sports nutrition recommendations.' 
              : 'حلل قياسات الجسم، صمّم البرامج التدريبية المتقدمة وفق الاستهداف وزيادة الأحمال، وركّب خطط التغذية الرياضية.'}
          </p>
          <div className="pt-3 flex flex-wrap gap-2.5">
            <button
              id="quick-add-client-btn"
              onClick={() => onNavigate('clients')}
              className="px-4 py-2 bg-[#FF4D00] hover:bg-[#E04400] text-white font-medium rounded-xl text-xs sm:text-sm transition-colors duration-150 flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {t.createClient}
            </button>
            {clients.length === 0 && (
              <button
                id="quick-import-demo-btn"
                onClick={onImportDemo}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 font-medium rounded-xl text-xs sm:text-sm transition-colors duration-150 flex items-center gap-2 cursor-pointer"
              >
                <TrendingUp className="w-4 h-4" />
                {t.importSample}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid of Key Statistics Card */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4" id="stats-grid">
        <div className="bg-[#101010] border border-neutral-800/80 rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between min-h-[110px] sm:min-h-[120px]" id="stat-card-clients">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-medium text-neutral-400 uppercase tracking-widest">{t.clients}</span>
            <div className="p-1.5 sm:p-2 h-7 w-7 sm:h-9 sm:w-9 bg-[#FF4D00]/10 rounded-xl flex items-center justify-center text-[#FF4D00]">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl sm:text-3xl font-bold text-white leading-none">{clients.length}</h3>
            <div className="flex flex-col sm:flex-row sm:items-center gap-y-0.5 sm:gap-x-1 text-[11px] sm:text-xs text-[#16C47F] mt-1.5">
              <span className="font-bold sm:font-semibold">{activeClients.length}</span>
              <span className="text-neutral-500">{t.active}</span>
            </div>
          </div>
        </div>

        <div className="bg-[#101010] border border-neutral-800/80 rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between min-h-[110px] sm:min-h-[120px]" id="stat-card-inbody">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-medium text-neutral-400 uppercase tracking-widest">{t.inbody}</span>
            <div className="p-1.5 sm:p-2 h-7 w-7 sm:h-9 sm:w-9 bg-[#16C47F]/10 rounded-xl flex items-center justify-center text-[#16C47F]">
              <Scale className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl sm:text-3xl font-bold text-white leading-none">{inbody.length}</h3>
            <div className="flex flex-col sm:flex-row sm:items-center gap-y-0.5 sm:gap-x-1 text-[11px] sm:text-xs text-neutral-400 mt-1.5">
              <span className="font-bold sm:font-semibold text-[#16C47F]">{avgPbf}%</span>
              <span className="truncate">{t.bodyFatMass} (Avg)</span>
            </div>
          </div>
        </div>

        <div className="bg-[#101010] border border-neutral-800/80 rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between min-h-[110px] sm:min-h-[120px]" id="stat-card-compliance">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-medium text-neutral-400 uppercase tracking-widest">{t.compliance}</span>
            <div className="p-1.5 sm:p-2 h-7 w-7 sm:h-9 sm:w-9 bg-yellow-500/10 rounded-xl flex items-center justify-center text-yellow-500">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl sm:text-3xl font-bold text-white leading-none">{totalVolumeProgress}%</h3>
            <div className="flex flex-col sm:flex-row sm:items-center gap-y-0.5 sm:gap-x-1 text-[11px] sm:text-xs text-yellow-500 mt-1.5">
              <span className="truncate">{lang === 'en' ? 'Target: >90%' : 'الهدف الأساسي: >90%'}</span>
            </div>
          </div>
        </div>

        <div className="bg-[#101010] border border-neutral-800/80 rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between min-h-[110px] sm:min-h-[120px]" id="stat-card-reviews">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-medium text-neutral-400 uppercase tracking-widest">{t.pendingReviews}</span>
            <div className="p-1.5 sm:p-2 h-7 w-7 sm:h-9 sm:w-9 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl sm:text-3xl font-bold text-white leading-none">{clients.length > 0 ? '0' : '1'}</h3>
            <div className="flex flex-col sm:flex-row sm:items-center gap-y-0.5 sm:gap-x-1 text-[11px] sm:text-xs text-neutral-400 mt-1.5">
              <span className="truncate">{lang === 'en' ? 'Auto-scheduled' : 'مجدولة تلقائياً'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* SYSTEM 12: Coach Business Metrics Deck */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="coach-business-metrics-deck">
        {/* Metric 1: Monthly Recurring Revenue (MRR) */}
        <div className="bg-neutral-900/40 border border-neutral-850 rounded-2xl p-4 flex items-center justify-between" id="mrr-metric-card">
          <div className="space-y-1">
            <span className="text-[10px] text-neutral-400 uppercase tracking-widest block font-display">
              {lang === 'en' ? 'Estimated Coach MRR' : 'العائد الشهري المتوقع'}
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono text-white">${currentSaaSMRR.toLocaleString()}</span>
              <span className="text-xs text-neutral-500 font-medium">/mo</span>
            </div>
            <p className="text-[10px] text-neutral-500">
              {lang === 'en' ? `Based on $${monthlyPremiumCharge}/mo fee per client` : `على أساس رسوم $${monthlyPremiumCharge} للمشترك`}
            </p>
          </div>
          <div className="p-3 bg-[#FF4D00]/5 rounded-2xl border border-[#FF4D00]/10 text-[#FF4D00]">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2: Slots Capacity Filled Rate */}
        <div className="bg-neutral-900/40 border border-neutral-850 rounded-2xl p-4 space-y-2.5" id="slots-metric-card">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] text-neutral-400 uppercase tracking-widest block font-display">
                {lang === 'en' ? 'Slots Capacity' : 'نسبة استيعاب المقاعد'}
              </span>
              <span className="text-xl font-bold font-mono text-white">{activeClients.length} <span className="text-xs text-neutral-500 font-sans font-normal">/ 30 {lang === 'en' ? 'Max Active' : 'أقصى حد'}</span></span>
            </div>
            <span className="text-xs font-bold font-mono text-yellow-500 bg-yellow-500/10 px-2.5 py-0.5 rounded-full">
              {slotCapacityPercentage}%
            </span>
          </div>
          {/* Custom micro-progress bar */}
          <div className="w-full bg-neutral-950 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-yellow-500 to-[#FF4D00] h-full rounded-full transition-all duration-500" 
              style={{ width: `${slotCapacityPercentage}%` }}
            />
          </div>
        </div>

        {/* Metric 3: Retention Score Rate */}
        <div className="bg-neutral-900/40 border border-neutral-850 rounded-2xl p-4 flex items-center justify-between" id="retention-metric-card">
          <div className="space-y-1">
            <span className="text-[10px] text-neutral-400 uppercase tracking-widest block font-display">
              {lang === 'en' ? 'Retention Rate' : 'معدل استبقاء المشتركين'}
            </span>
            <span className="text-xl font-bold font-mono text-[#16C47F] block">{clientRetentionScore}%</span>
            <p className="text-[10px] text-neutral-500">
              {lang === 'en' ? 'Excludes inactive/archived logs' : 'خارج خانة المشتركين غير النشطين'}
            </p>
          </div>
          <div className="p-3 bg-[#16C47F]/5 rounded-2xl border border-[#16C47F]/10 text-[#16C47F]">
            <Percent className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* SYSTEM 6: Smart Dashboard Alerts Centre */}
      {alerts.length > 0 && (
        <div className="bg-neutral-950 border border-neutral-850 rounded-2xl p-4 space-y-3" id="smart-alerts-board">
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Bell className="w-4 h-4 text-[#FF4D00]" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
              </div>
              <h3 className="text-xs font-bold text-white uppercase tracking-widest font-display">
                {lang === 'en' ? 'SMART DISPATCH ALERTS' : 'إشعارات وتنبيهات الكوتش الذكية'}
              </h3>
            </div>
            <span className="text-[10px] text-neutral-500 uppercase tracking-wider">
              {alerts.length} {lang === 'en' ? 'items pending review' : 'حالات تحتاج مراجعتك'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3" id="alerts-matrix">
            {alerts.map((alert) => {
              const bgClass = 
                alert.type === 'danger' ? 'bg-red-950/20 border-red-900/40 text-red-400' :
                alert.type === 'warning' ? 'bg-yellow-950/15 border-yellow-900/35 text-yellow-400' :
                'bg-blue-950/20 border-blue-900/40 text-blue-400';
              
              const iconColor = 
                alert.type === 'danger' ? 'text-red-500' :
                alert.type === 'warning' ? 'text-yellow-500' :
                'text-blue-500';

              return (
                <div 
                  key={alert.id} 
                  className={`p-3 rounded-xl border ${bgClass} flex items-start gap-2.5 transition-all relative group`}
                  id={`smart-alert-${alert.id}`}
                >
                  <div className="mt-0.5 shrink-0">
                    {alert.type === 'danger' && <AlertTriangle className={`w-4 h-4 ${iconColor}`} />}
                    {alert.type === 'warning' && <AlertTriangle className={`w-4 h-4 ${iconColor}`} />}
                    {alert.type === 'info' && <Bell className={`w-4 h-4 ${iconColor}`} />}
                  </div>
                  <div className="flex-1 min-w-0 pr-6">
                    <h4 className="text-xs font-bold text-white mb-0.5 tracking-tight flex items-center gap-1.5">
                      {alert.title}
                    </h4>
                    <p className="text-[10px] text-neutral-400 leading-relaxed">{alert.message}</p>
                  </div>
                  <button 
                    onClick={() => handleDismissAlert(alert.id)}
                    className="absolute top-2.5 right-2.5 p-1 text-neutral-500 hover:text-white rounded-md hover:bg-[#202020] transition-colors"
                    title={lang === 'en' ? 'Dismiss Alert' : 'تجاهل التنبيه'}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Daily Client Adherence Check-in Center */}
      <DailyCheckInWidget clients={clients} lang={lang} />

      {/* Main dashboard body split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="dashboard-two-column">
        {/* Left Col - Action Panels / Focus list */}
        <div className="lg:col-span-2 space-y-6" id="dashboard-left-aside">
          {/* Today's Client Focus List */}
          <div className="bg-[#101010] border border-neutral-850 rounded-2xl p-5" id="today-coaching-focus-panel">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-tight flex items-center gap-2">
                  <Flame className="w-4 h-4 text-[#FF4D00]" />
                  {t.todaySessions}
                </h3>
                <p className="text-xs text-neutral-500">{lang === 'en' ? 'Quick client triage and tactical assessments' : 'فرز وتوجيه الحالات الرياضية اليومية'}</p>
              </div>
              <Calendar className="w-4 h-4 text-neutral-500" />
            </div>

            <div className="space-y-3" id="today-focus-list">
              {clients.length === 0 ? (
                <div className="py-8 text-center text-xs text-neutral-500" id="empty-today-sessions">
                  {lang === 'en' ? 'No scheduled sessions. Add clients or import demo data to populate.' : 'لا يوجد مهام تدريبية مجدولة اليوم.'}
                </div>
              ) : (
                clients.map((client) => {
                  const clientInBody = inbody.filter(r => r.clientId === client.id);
                  const lastInBody = clientInBody[0];
                  
                  return (
                    <div 
                      key={client.id} 
                      className="group bg-[#181818] hover:bg-[#202020] border border-neutral-800/80 rounded-xl p-3.5 transition-colors duration-150 flex items-center justify-between"
                      id={`focused-client-${client.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-[#FF4D00] to-orange-400 text-white flex items-center justify-center font-bold text-sm">
                          {client.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-[#FF4D00] transition-colors">{client.name}</h4>
                          <span className="inline-flex gap-2 items-center text-[10px] text-neutral-400 mt-1">
                            <span>{client.experience.toUpperCase()}</span>
                            <span>•</span>
                            <span>{client.goal}</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className={`hidden sm:block text-right ${isRtl ? 'text-left' : 'text-right'}`}>
                          <div className="text-xs text-white font-mono font-medium">
                            {lastInBody ? `${lastInBody.weight} ${t.weight}` : `${client.weight} ${t.weight}`}
                          </div>
                          <div className="text-[10px] text-neutral-500">
                            {lastInBody ? `${t.pbf}: ${lastInBody.pbf}%` : t.assessment}
                          </div>
                        </div>
                        <button 
                          id={`go-train-client-${client.id}`}
                          onClick={() => onNavigate('clients', client.id)}
                          className="p-1.5 h-8 w-8 bg-neutral-800 hover:bg-[#FF4D00] text-neutral-400 hover:text-white rounded-lg transition-all flex items-center justify-center cursor-pointer"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="bg-[#101010] border border-neutral-850 rounded-2xl p-5" id="quick-actions-panel">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">{t.quickActions}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3" id="quick-actions-grid">
              <button 
                id="qa-new-client"
                onClick={() => onNavigate('clients')}
                className="p-3 bg-[#181818] hover:bg-[#202020] border border-neutral-800 rounded-xl text-left cursor-pointer transition-colors space-y-1"
              >
                <Users className="w-5 h-5 text-[#FF4D00]" />
                <div className="text-xs font-bold text-white">{t.createClient}</div>
                <div className="text-[10px] text-neutral-500">{lang === 'en' ? 'Register profile' : 'تسجيل مشترك'}</div>
              </button>

              <button 
                id="qa-new-assessment"
                onClick={() => {
                  if (clients.length > 0) {
                    onNavigate('inbody', clients[0].id);
                  } else {
                    onNavigate('clients');
                  }
                }}
                className="p-3 bg-[#181818] hover:bg-[#202020] border border-neutral-800 rounded-xl text-left cursor-pointer transition-colors space-y-1"
              >
                <Scale className="w-5 h-5 text-[#16C47F]" />
                <div className="text-xs font-bold text-white">{t.addInBody}</div>
                <div className="text-[10px] text-neutral-500">{lang === 'en' ? 'Evaluate composition' : 'تسجيل إن بادي'}</div>
              </button>

              <button 
                id="qa-workout-builder"
                onClick={() => {
                  if (clients.length > 0) {
                    onNavigate('workouts', clients[0].id);
                  } else {
                    onNavigate('clients');
                  }
                }}
                className="p-3 bg-[#181818] hover:bg-[#202020] border border-neutral-800 rounded-xl text-left cursor-pointer transition-colors space-y-1 col-span-2 sm:col-span-1"
              >
                <Dumbbell className="w-5 h-5 text-yellow-500" />
                <div className="text-xs font-bold text-white">{t.generateWorkout}</div>
                <div className="text-[10px] text-neutral-500">{lang === 'en' ? 'Hypertrophy template' : 'برنامج تدريب'}</div>
              </button>
            </div>
          </div>
        </div>

        {/* Right Col - Recent Alerts, Assessments, Reviews */}
        <div className="space-y-6" id="dashboard-right-aside">
          {/* Recent InBody Submissions */}
          <div className="bg-[#101010] border border-neutral-850 rounded-2xl p-5" id="recent-inbody-submissions-panel">
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-4">{t.newInBody}</h3>
            
            <div className="space-y-3" id="recent-inbody-list">
              {recentInBody.length === 0 ? (
                <div className="py-6 text-center text-xs text-neutral-500" id="empty-recent-inbody">
                  {lang === 'en' ? 'No recent body scans logged.' : 'لا يوجد أي قياس إن بادي مسجل مؤخراً.'}
                </div>
              ) : (
                recentInBody.map((item) => {
                  const client = clients.find(c => c.id === item.clientId);
                  if (!client) return null;
                  return (
                    <div 
                      key={item.id} 
                      className="p-3 bg-[#181818] border border-neutral-800 rounded-xl flex items-center justify-between cursor-pointer hover:border-neutral-700"
                      onClick={() => onNavigate('inbody', client.id)}
                      id={`recent-inbody-item-${item.id}`}
                    >
                      <div>
                        <span className="text-xs font-bold text-white truncate max-w-[140px] block">{client.name}</span>
                        <span className="text-[10px] text-neutral-500 mt-0.5 block font-mono">{item.date}</span>
                      </div>
                      <div className="text-right flex items-center gap-2">
                        <div>
                          <span className="text-xs font-mono font-bold text-[#16C47F] block">{item.pbf}% {t.pbf}</span>
                          <span className="text-[10px] text-neutral-400 block font-mono">{item.weight} kg</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Upcoming Check-ins */}
          <div className="bg-[#101010] border border-neutral-850 rounded-2xl p-5" id="upcoming-checkins-panel">
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-4">{t.upcomingCheckins}</h3>
            
            <div className="space-y-3" id="upcoming-checkins-list">
              {clients.length === 0 ? (
                <div className="py-6 text-center text-xs text-neutral-500" id="empty-upcoming-checkins">
                  {lang === 'en' ? 'No check-ins scheduled.' : 'لا يوجد أي موعد متابعة مجدول.'}
                </div>
              ) : (
                clients.slice(0, 2).map((client, index) => (
                  <div key={client.id} className="p-3 bg-neutral-900/40 border border-neutral-800 rounded-xl flex gap-3 items-center">
                    <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                    <div className="flex-1">
                      <span className="text-xs font-bold text-white block">{client.name}</span>
                      <span className="text-[10px] text-neutral-500 block">
                        {lang === 'en' ? `Milestone check-in #${index + 1}` : `متابعة تقييم الإنجاز #${index + 1}`}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#FF4D00] font-mono whitespace-nowrap bg-[#FF4D00]/10 px-2 py-0.5 rounded-full inline-block">
                      {lang === 'en' ? 'TOMORROW' : 'غداً'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
