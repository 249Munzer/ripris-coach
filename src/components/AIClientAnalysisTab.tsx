/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Client } from '../types';
import { getInBodyRecords, getWeeklyCheckIns } from '../storage/db';
import { 
  Cpu, 
  Sparkles, 
  TrendingUp, 
  Activity, 
  ShieldAlert, 
  CheckCircle2, 
  Lightbulb,
  CornerDownRight,
  TrendingDown,
  Info
} from 'lucide-react';

import { AIOutputFormatter } from './AIOutputFormatter';

interface AIClientAnalysisTabProps {
  client: Client;
  lang: 'en' | 'ar';
}

export default function AIClientAnalysisTab({ client, lang }: AIClientAnalysisTabProps) {
  const [analysisText, setAnalysisText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [readinessScore, setReadinessScore] = useState(85);

  const getLatestMetrics = () => {
    const listIB = getInBodyRecords().filter(r => r.clientId === client.id);
    const listCI = getWeeklyCheckIns().filter(c => c.clientId === client.id);
    return {
      inbody: listIB[0] || null,
      checkin: listCI[0] || null
    };
  };

  const handleRunAnalysis = async () => {
    setIsLoading(true);
    const { inbody, checkin } = getLatestMetrics();
    
    // Calculate dynamic readiness score based on user wellness attributes
    let score = 80;
    if (client.sleep === 'good') score += 10;
    if (client.sleep === 'poor') score -= 15;
    if (client.stress === 'low') score += 10;
    if (client.stress === 'high') score -= 15;
    if (checkin) {
      score += (checkin.energy - 3) * 3;
      score += (checkin.mood - 3) * 2;
    }
    setReadinessScore(Math.max(30, Math.min(100, score)));

    try {
      const response = await fetch('/api/coach-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: 'analyze_client',
          clientData: client,
          inbodyData: inbody,
          checkinData: checkin
        })
      });

      const data = await response.json();
      if (response.ok && data.result) {
        setAnalysisText(data.result);
      } else {
        const errMsg = data.error || (lang === 'en' ? "AI Assessment service currently offline." : "خدمة التحليل الذكي غير متاحة حالياً.");
        setAnalysisText(`${lang === 'en' ? 'AI Error:' : 'خطأ الذكاء الاصطناعي:'} ${errMsg}`);
      }
    } catch (err: any) {
      setAnalysisText(`${lang === 'en' ? 'Problem booting AI Analysis service pipelines:' : 'مشكلة في تشغيل واجهات خدمة الذكاء الاصطناعي:'} ${err.message || err}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setAnalysisText('');
  }, [client.id]);

  return (
    <div className="space-y-4" id="ai-client-assessment-tab">
      
      <div className="bg-gradient-to-r from-neutral-900 to-neutral-950 border border-[#FF4D00]/20 p-5 rounded-2xl space-y-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-[#FF4D00]" />
            <span>AI Coach Diagnostics (أداة التحليل الذكي)</span>
          </h3>
          <p className="text-xs text-neutral-400 max-w-xl leading-relaxed">
            Diagnose client biomechanical capacities, sleep biomarkers, and inbody trends to formulate exact progression methodologies.
          </p>
        </div>

        <button
          onClick={handleRunAnalysis}
          disabled={isLoading}
          className="bg-gradient-to-r from-[#FF4D00] to-orange-500 hover:opacity-90 disabled:opacity-50 text-white text-xs font-bold px-5 py-2.5 rounded-xl cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
        >
          <Sparkles className="w-4 h-4 text-white animate-pulse" />
          <span>{isLoading ? (lang === 'en' ? 'Formulating...' : 'جاري التحليل...') : (lang === 'en' ? 'Run AI Diagnosis' : 'بدء التحليل')}</span>
        </button>
      </div>

      {analysisText ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 antialiased text-xs font-sans">
          
          {/* Readiness diagnostic metrics sidebar widget */}
          <div className="lg:col-span-1 space-y-3">
            <div className="bg-[#181818] border border-neutral-800 rounded-2xl p-5 text-center space-y-4">
              <span className="text-[10px] font-bold tracking-widest text-[#FF4D00] block uppercase">ATHLETIC READINESS INDEX</span>
              
              <div className="relative inline-flex items-center justify-center h-28 w-28">
                {/* Score Dial Circle */}
                <div className="absolute h-full w-full rounded-full border-[6px] border-neutral-900" />
                <div className={`absolute h-full w-full rounded-full border-[6px] ${readinessScore > 75 ? 'border-[#16C47F]' : 'border-yellow-500'} border-t-transparent animate-spin-slow`} />
                <span className="text-3xl font-extrabold font-mono tracking-tight text-white">{readinessScore}%</span>
              </div>

              <div className="pt-2 border-t border-neutral-900 text-left space-y-2">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-neutral-500 font-bold uppercase">Neuromuscular Charge</span>
                  <span className={`${readinessScore > 75 ? 'text-[#16C47F]' : 'text-yellow-500'} font-bold`}>{readinessScore > 75 ? 'Optimal' : 'Standard'}</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-neutral-500 font-bold uppercase">Fatigue Load Zone</span>
                  <span className="text-neutral-300 font-bold">{client.stress.toUpperCase()}</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-neutral-500 font-bold uppercase">Sleep Quality Gauge</span>
                  <span className="text-neutral-300 font-bold">{client.sleep.toUpperCase()}</span>
                </div>
              </div>
            </div>

            <div className="bg-[#181818] border border-neutral-800 rounded-2xl p-4 space-y-3 text-[11px]">
              <span className="text-[10px] font-bold tracking-widest text-neutral-400 block uppercase">STRENGTH CONSIDERATIONS</span>
              <div className="space-y-2.5">
                <div className="flex items-start gap-2 text-neutral-300 leading-relaxed bg-neutral-950 p-2.5 rounded-lg border border-neutral-900">
                  <ShieldAlert className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                  <p>Incorp correctives on Overhead presses to preserve shoulder mechanics.</p>
                </div>
                <div className="flex items-start gap-2 text-neutral-300 leading-relaxed bg-neutral-950 p-2.5 rounded-lg border border-neutral-900">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <p>Client exhibits solid neural adaptation allowing heavy double progression loads.</p>
                </div>
              </div>
            </div>
          </div>

          {/* AI generated markdown summary box */}
          <div className="lg:col-span-2 bg-[#101010] border border-neutral-850 rounded-2xl p-5 space-y-4 max-h-[580px] overflow-y-auto" id="diagnostics-box-scrolling">
            <span className="text-[10px] font-bold tracking-widest text-neutral-400 block uppercase">{lang === 'en' ? 'DIAGNOSTIC REPORT LOGS' : 'سجل تقرير التحليل والتشخيص'}</span>
            <div className="w-full" id="diagnostics-text-logs">
              <AIOutputFormatter text={analysisText} lang={lang} />
            </div>
          </div>

        </div>
      ) : (
        <div className="text-center py-16 text-neutral-500 border border-dashed border-neutral-850 rounded-2xl flex flex-col items-center justify-center gap-1.5 font-sans text-xs">
          <Info className="w-5 h-5 text-neutral-600" />
          <span>{lang === 'en' ? 'Click Run AI Diagnosis to generate a full comprehensive client analysis.' : 'اضغط على بدء التحليل لتكوين تقرير طبي ورياضي شامل.'}</span>
        </div>
      )}

    </div>
  );
}
