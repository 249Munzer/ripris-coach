/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sliders, Languages, Database, Scale, Trash2, ArrowRightLeft, FileUp, FileDown, CheckCircle, AlertOctagon, LogOut, Cloud, RefreshCw } from 'lucide-react';
import { syncAllLocalToCloud, syncCloudToLocal, getActiveCoachId } from '../storage/db';

interface SettingsViewProps {
  lang: 'en' | 'ar';
  setLang: (lang: 'en' | 'ar') => void;
  units: 'metric' | 'imperial';
  setUnits: (units: 'metric' | 'imperial') => void;
  t: any;
  onRestoreState: (snapshotJSON: string) => void;
  onClearState: () => void;
  onLogout: () => void;
}

export default function SettingsView({
  lang,
  setLang,
  units,
  setUnits,
  t,
  onRestoreState,
  onClearState,
  onLogout
}: SettingsViewProps) {
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSyncingUp, setIsSyncingUp] = useState(false);
  const [isSyncingDown, setIsSyncingDown] = useState(false);

  const handleManualSyncUp = async () => {
    setIsSyncingUp(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const coachId = getActiveCoachId();
      await syncAllLocalToCloud(coachId);
      setSuccessMsg(lang === 'en' ? 'Successfully push-synced all local records to the secure cloud database!' : 'تم مزامنة ورفع كافة بياناتك المحلية إلى السحابة بنجاح!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(lang === 'en' ? 'Cloud upload sync failed.' : 'فشلت عملية مزامنة الرفع إلى السحابة.');
      setTimeout(() => setErrorMsg(''), 4000);
    } finally {
      setIsSyncingUp(false);
    }
  };

  const handleManualSyncDown = async () => {
    setIsSyncingDown(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const coachId = getActiveCoachId();
      await syncCloudToLocal(coachId);
      setSuccessMsg(lang === 'en' ? 'Successfully draw-synced and restored workspace from the secure cloud!' : 'تم مزامنة وتحميل بيانات لوحتك من السحابة بنجاح! جاري التحديث...');
      setTimeout(() => {
        setSuccessMsg('');
        window.location.reload();
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(lang === 'en' ? 'Cloud restoration pull failed.' : 'فشلت عملية سحب البيانات ومزامنتها من السحابة.');
      setTimeout(() => setErrorMsg(''), 4000);
    } finally {
      setIsSyncingDown(false);
    }
  };

  const triggerExport = () => {
    try {
      const keyMap: Record<string, string> = {
        'reprise_clients': 'reprise_coach_clients',
        'reprise_inbody': 'reprise_coach_inbody',
        'reprise_workouts': 'reprise_coach_workouts',
        'reprise_nutrition': 'reprise_coach_nutrition',
        'reprise_progressLogs': 'reprise_coach_progress',
        'reprise_timeline': 'reprise_coach_timeline',
        'reprise_notes': 'reprise_coach_notes',
        'reprise_checkins': 'reprise_coach_checkins',
        'reprise_alerts': 'reprise_coach_alerts',
        'reprise_goals': 'reprise_coach_goals',
        'reprise_settings': 'reprise_coach_settings',
        'reprise_coach_profile': 'reprise_coach_profile',
      };
      
      const payload: Record<string, any> = {};
      Object.entries(keyMap).forEach(([fileKey, storageKey]) => {
        const item = localStorage.getItem(storageKey);
        try {
          payload[fileKey] = item ? JSON.parse(item) : null;
        } catch {
          payload[fileKey] = item;
        }
      });
      
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `reprise_coach_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      
      setSuccessMsg(lang === 'en' ? 'Database exported successfully!' : 'تم تصدير نسخة البيانات الرياضية بنجاح!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (e) {
      setErrorMsg(lang === 'en' ? 'Export failed.' : 'فشل تصدير البيانات الأرشيفية.');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  const triggerCSVExport = () => {
    try {
      const escapeCSV = (val: any) => {
        if (val === undefined || val === null) return '""';
        let str = String(val);
        // Clean multi-line characters to avoid breaking CSV records
        str = str.replace(/\r?\n|\r/g, ' ');
        str = str.replace(/"/g, '""');
        return `"${str}"`;
      };

      const clientsStr = localStorage.getItem('reprise_coach_clients') || '[]';
      const workoutsStr = localStorage.getItem('reprise_coach_workouts') || '[]';
      const nutritionStr = localStorage.getItem('reprise_coach_nutrition') || '[]';
      const progressStr = localStorage.getItem('reprise_coach_progress') || '[]';

      const clients = JSON.parse(clientsStr);
      const workouts = JSON.parse(workoutsStr);
      const nutrition = JSON.parse(nutritionStr);
      const progress = JSON.parse(progressStr);

      let csvContent = '\uFEFF'; // UTF-8 BOM to display Arabic correctly in Excel

      // 1. Title/Meta Header
      csvContent += `"RepRise Coach - Application Offline Archive"\n`;
      csvContent += `"Export Date:",${escapeCSV(new Date().toLocaleString())}\n\n`;

      // 2. Clients Section
      csvContent += `"--- CLIENTS ---"\n`;
      csvContent += `"ID","Name","Gender","Age","Height (cm)","Weight (kg)","Goal","Experience","Activity","Gym Access","Training Days","Workout Duration (min)","Status","Notes","Created At"\n`;
      clients.forEach((c: any) => {
        csvContent += [
          escapeCSV(c.id),
          escapeCSV(c.name),
          escapeCSV(c.gender),
          escapeCSV(c.age),
          escapeCSV(c.height),
          escapeCSV(c.weight),
          escapeCSV(c.goal),
          escapeCSV(c.experience),
          escapeCSV(c.activity),
          escapeCSV(c.gymAccess),
          escapeCSV(c.trainingDays),
          escapeCSV(c.workoutDuration),
          escapeCSV(c.status),
          escapeCSV(c.notes),
          escapeCSV(c.createdAt)
        ].join(',') + '\n';
      });
      csvContent += '\n';

      // 3. Workouts Section
      csvContent += `"--- WORKOUT PLANS ---"\n`;
      csvContent += `"ID","Client ID","Plan Name","Template Type","Weeks","Notes","Created At","Is Active","Is Archived"\n`;
      workouts.forEach((w: any) => {
        csvContent += [
          escapeCSV(w.id),
          escapeCSV(w.clientId),
          escapeCSV(w.name),
          escapeCSV(w.templateType),
          escapeCSV(w.weeks),
          escapeCSV(w.notes),
          escapeCSV(w.createdAt),
          escapeCSV(w.isActive),
          escapeCSV(w.isArchived)
        ].join(',') + '\n';
      });
      csvContent += '\n';

      // 4. Nutrition Section
      csvContent += `"--- NUTRITION PLANS ---"\n`;
      csvContent += `"ID","Client ID","BMR (kcal)","TDEE (kcal)","Calories (kcal)","Protein (g)","Carbs (g)","Fat (g)","Diet Style","Allergies","Created At","Is Active"\n`;
      nutrition.forEach((n: any) => {
        csvContent += [
          escapeCSV(n.id),
          escapeCSV(n.clientId),
          escapeCSV(n.bmr),
          escapeCSV(n.tdee),
          escapeCSV(n.calories),
          escapeCSV(n.macros?.protein),
          escapeCSV(n.macros?.carbs),
          escapeCSV(n.macros?.fat),
          escapeCSV(n.dietStyle),
          escapeCSV(n.allergies),
          escapeCSV(n.createdAt),
          escapeCSV(n.isActive)
        ].join(',') + '\n';
      });
      csvContent += '\n';

      // 5. Progress Logs Section
      csvContent += `"--- PROGRESS LOGS ---"\n`;
      csvContent += `"ID","Client ID","Date","Weight (kg)","Body Fat (%)","Compliance Rate (%)","Coach Notes"\n`;
      progress.forEach((log: any) => {
        csvContent += [
          escapeCSV(log.id),
          escapeCSV(log.clientId),
          escapeCSV(log.date),
          escapeCSV(log.weight),
          escapeCSV(log.bodyFat),
          escapeCSV(log.complianceRate),
          escapeCSV(log.coachNotes)
        ].join(',') + '\n';
      });

      // Trigger file download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", url);
      downloadAnchor.setAttribute("download", `reprise_coach_archive_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      URL.revokeObjectURL(url);

      setSuccessMsg(lang === 'en' ? 'CSV offline archive generated successfully!' : 'تم تصدير أرشيف CSV الشامل بنجاح!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (e) {
      console.error(e);
      setErrorMsg(lang === 'en' ? 'CSV Export failed.' : 'فشل تصدير أرشيف CSV.');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  const triggerImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          onRestoreState(content);
          setSuccessMsg(lang === 'en' ? 'State snapshot restored cleanly! Reloading dashboard...' : 'تم استعادة نسخة البيانات وإعادة تعيين اللوحة بنجاح!');
          setTimeout(() => {
            setSuccessMsg('');
            window.location.reload();
          }, 2000);
        } catch (err) {
          setErrorMsg(lang === 'en' ? 'Invalid backup file structure.' : 'ملف النسخة الاحتياطية غير متوافق.');
          setTimeout(() => setErrorMsg(''), 4000);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6" id="settings-root">
      
      {/* 1. Header description */}
      <div className="bg-[#101010] border border-neutral-850 p-5 rounded-2xl space-y-2" id="settings-header">
        <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
          <Sliders className="w-5 h-5 text-[#FF4D00]" />
          {t.settings}
        </h2>
        <p className="text-xs text-neutral-500">{lang === 'en' ? 'Tweak localized language protocols, biomechanical weight indices & data transfers' : 'تخصيص اللغات وتفضيلات المقاييس الرياضية، وإجراء النسخ وبناء البيانات'}</p>
      </div>

      {/* Notifications bar */}
      {successMsg && (
        <div className="bg-[#16C47F]/10 border border-[#16C47F]/30 p-3 rounded-xl flex items-center gap-2 text-xs text-[#16C47F] font-mono" id="settings-success animate">
          <CheckCircle className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-[#FF3B30]/10 border border-[#FF3B30]/30 p-3 rounded-xl flex items-center gap-2 text-xs text-[#FF3B30] font-mono" id="settings-error animate">
          <AlertOctagon className="w-4 h-4" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 2. Bento sections of parameters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="settings-grid">
        
        {/* Core preferences - Lang / Units */}
        <div className="bg-[#101010] border border-neutral-850 rounded-2xl p-5 space-y-5" id="bento-preferences">
          <h3 className="text-xs font-bold text-[#FF4D00] uppercase tracking-widest flex items-center gap-2 border-b border-neutral-850 pb-2.5">
            <Languages className="w-4 h-4" />
            {lang === 'en' ? 'Localization settings' : 'التفضيلات اللغوية'}
          </h3>

          {/* Languages selection */}
          <div className="space-y-2">
            <span className="text-[10px] text-neutral-500 uppercase tracking-widest block">{lang === 'en' ? 'Coach System Language' : 'لغة واجهة الكوتش والمستندات'}</span>
            <div className="grid grid-cols-2 gap-2 bg-[#181818] p-1 rounded-xl text-xs font-medium">
              <button
                id="select-lang-en"
                onClick={() => setLang('en')}
                className={`py-2 rounded-lg cursor-pointer transition-colors ${lang === 'en' ? 'bg-[#FF4D00] text-white' : 'text-neutral-400 hover:text-white'}`}
              >
                English / LTR
              </button>
              <button
                id="select-lang-ar"
                onClick={() => setLang('ar')}
                className={`py-2 rounded-lg cursor-pointer transition-colors ${lang === 'ar' ? 'bg-[#FF4D00] text-white' : 'text-neutral-400 hover:text-white'}`}
              >
                العربية / RTL
              </button>
            </div>
          </div>

          {/* Units Selection */}
          <div className="space-y-2">
            <span className="text-[10px] text-neutral-500 uppercase tracking-widest block">{lang === 'en' ? 'Biomechanical weight index' : 'مقياس الأوزان والأطوال'}</span>
            <div className="grid grid-cols-2 gap-2 bg-[#181818] p-1 rounded-xl text-xs font-medium">
              <button
                id="select-units-metric"
                onClick={() => setUnits('metric')}
                className={`py-2 rounded-lg cursor-pointer transition-colors ${units === 'metric' ? 'bg-[#FF4D00] text-white' : 'text-neutral-400 hover:text-white'}`}
              >
                Metric (KG / CM)
              </button>
              <button
                id="select-units-imperial"
                onClick={() => setUnits('imperial')}
                className={`py-2 rounded-lg cursor-pointer transition-colors ${units === 'imperial' ? 'bg-[#FF4D00] text-white' : 'text-neutral-400 hover:text-white'}`}
              >
                Imperial (LBS / IN)
              </button>
            </div>
          </div>
        </div>

        {/* Database state management / transfer snapshot */}
        <div className="bg-[#101010] border border-neutral-850 rounded-2xl p-5 space-y-5" id="bento-database">
          <h3 className="text-xs font-bold text-[#FF4D00] uppercase tracking-widest flex items-center gap-2 border-b border-neutral-850 pb-2.5">
            <Database className="w-4 h-4" />
            {lang === 'en' ? 'Database portfolio backups' : 'حفظ واسترجاع البيانات المكاملة'}
          </h3>

          <p className="text-xs text-neutral-400 leading-normal font-mono">
            {lang === 'en' ? 'Export the absolute snapshot of your active clients workouts, nutrition & assessments to a single secure file.' : 'يمكنك تصدير كافة بيانات المشتركين والقياسات وحفظها في ملف آمن خارجي لاستعادتها لاحقاً.'}
          </p>

          <div className="flex flex-col gap-3" id="db-action-container">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" id="db-action-toggles">
              
              {/* Export */}
              <button
                id="export-db-btn"
                onClick={triggerExport}
                className="py-2.5 bg-neutral-900 hover:bg-neutral-850 text-white font-bold border border-neutral-800 rounded-xl text-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <FileDown className="w-4 h-4 text-[#FF4D00]" />
                {lang === 'en' ? 'Export JSON Backup' : 'حفظ نسخة احتياطية'}
              </button>

              {/* Import */}
              <label className="py-2.5 bg-neutral-900 hover:bg-neutral-850 text-white font-bold border border-neutral-800 rounded-xl text-xs cursor-pointer flex items-center justify-center gap-1.5 text-center">
                <FileUp className="w-4 h-4 text-[#16C47F]" />
                <span>{lang === 'en' ? 'Import backup' : 'رفع نسخة احتياطية'}</span>
                <input
                  id="file-import"
                  type="file"
                  accept=".json"
                  onChange={triggerImport}
                  className="hidden"
                />
              </label>

            </div>

            {/* Offline CSV Archiving Export Button */}
            <button
              id="export-csv-archive-btn"
              onClick={triggerCSVExport}
              className="w-full py-2.5 bg-neutral-900 hover:bg-[#FF4D00]/10 hover:border-[#FF4D00]/40 text-white font-bold border border-neutral-800 rounded-xl text-xs cursor-pointer flex items-center justify-center gap-1.5 transition-all text-center"
            >
              <FileDown className="w-4 h-4 text-[#FF4D00]" />
              <span>{lang === 'en' ? 'Export All Data to CSV Archive' : 'تصدير أرشيف الملفات بصيغة CSV'}</span>
            </button>
          </div>
        </div>

      </div>

      {/* Cloud manual synchronization panel */}
      <div className="bg-[#101010] border border-neutral-850 rounded-2xl p-5 space-y-4" id="manual-cloud-sync-panel">
        <h3 className="text-xs font-bold text-[#FF4D00] uppercase tracking-widest flex items-center gap-2 border-b border-neutral-850 pb-2.5">
          <Cloud className="w-4 h-4 text-[#FF4D00]" />
          {lang === 'en' ? 'On-Demand Cloud Synchronization Suite' : 'منظومة المزامنة السحابية حسب الطلب'}
        </h3>
        
        <p className="text-xs text-neutral-400 leading-normal font-mono">
          {lang === 'en' 
            ? 'RepRise Coach operates entirely offline inside your browser for maximum speed & privacy. No client files, workouts, or reports are sent to the cloud unless you manually trigger a synchronization below.' 
            : 'يعمل نظام ريبرايز كوتش محلياً بالكامل داخل متصفحك لأرقام أداء فائقة السرعة وخصوصية مطلقة. لن يتم تخزين أو رفع أي ملفات مشتركين أو جداول تمارين أو قياسات للسحابة إلا إذا قمت بالمزامنة يدوياً من الأدوات أدناه.'
          }
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2" id="sync-buttons-grid">
          {/* Push to cloud */}
          <button
            id="sync-push-cloud-btn"
            onClick={handleManualSyncUp}
            disabled={isSyncingUp || isSyncingDown}
            className={`py-3 bg-neutral-900 hover:bg-[#FF4D00]/10 hover:border-[#FF4D00]/40 text-white font-semibold border border-neutral-850 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-2 text-center ${isSyncingUp ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <RefreshCw className={`w-4 h-4 text-[#FF4D00] ${isSyncingUp ? 'animate-spin' : ''}`} />
            <span>
              {isSyncingUp 
                ? (lang === 'en' ? 'Sycnhronizing Cloud Upload...' : 'جاري رفع ومزامنة السحابة...') 
                : (lang === 'en' ? 'Upload Workspace to Cloud' : 'مزامنة ورفع الملفات للسحابة')
              }
            </span>
          </button>

          {/* Pull from cloud */}
          <button
            id="sync-pull-cloud-btn"
            onClick={handleManualSyncDown}
            disabled={isSyncingUp || isSyncingDown}
            className={`py-3 bg-neutral-900 hover:bg-[#16C47F]/10 hover:border-[#16C47F]/40 text-white font-semibold border border-neutral-850 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-2 text-center ${isSyncingDown ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <RefreshCw className={`w-4 h-4 text-[#16C47F] ${isSyncingDown ? 'animate-spin' : ''}`} />
            <span>
              {isSyncingDown 
                ? (lang === 'en' ? 'Restoring local workspace...' : 'جاري تحميل واسترجاع الملفات...') 
                : (lang === 'en' ? 'Download Workspace from Cloud' : 'مزامنة وتحميل الملفات من السحابة')
              }
            </span>
          </button>
        </div>
      </div>

      {/* 3. Session management / Logout */}
      <div className="bg-[#101010] border border-neutral-850 rounded-2xl p-5 space-y-4" id="session-management-panel">
        <h3 className="text-xs font-bold text-[#FF4D00] uppercase tracking-wider flex items-center gap-1.5">
          <LogOut className="w-4 h-4" />
          {lang === 'en' ? 'Coach Account Session' : 'إدارة جلسة الكوتش'}
        </h3>
        
        <p className="text-xs text-neutral-400 leading-normal font-mono">
          {lang === 'en' 
            ? 'Access your unified workout library, client records, and bio-tracking fields from any device. Log out to end this session.' 
            : 'تتيح لك الجلسة تفعيل ومزامنة الملفات الحالية وجداول التمارين وكتل البيانات مع أي جهاز. يمكنك تسجيل الخروج لإنهاء الجلسة.'
          }
        </p>

        <div className="flex justify-start">
          <button
            id="settings-logout-btn"
            onClick={onLogout}
            className="px-5 py-2.5 bg-[#FF3B30] hover:bg-[#E0241B] text-black font-bold rounded-xl text-xs transition-all cursor-pointer uppercase tracking-widest font-mono flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            {lang === 'en' ? 'Log Out From Account' : 'تسجيل الخروج من الحساب'}
          </button>
        </div>
      </div>

      {/* 4. Safety purging panel */}
      <div className="bg-[#101010] border border-neutral-850 rounded-2xl p-5 space-y-4" id="purging-panel">
        <h3 className="text-xs font-bold text-[#FF3B30] uppercase tracking-wider flex items-center gap-1.5">
          <Trash2 className="w-4 h-4" />
          {lang === 'en' ? 'Critical Factory State Reset' : 'جدول إخلاء البيانات الرياضية'}
        </h3>
        
        <p className="text-xs text-neutral-400 leading-normal font-mono">
          {lang === 'en' ? 'Deleting critical states clears client profiles, logs & plans. This action cannot be undone.' : 'مسح البيانات يقضي تماماً على كافة قياسات الوزن، وجداول التمارين المسجلة واستعادة الإعدادات الأصلية الافتراضية.'}
        </p>

        <div className="flex justify-start">
          <button
            id="wipe-data-safety-btn"
            onClick={() => {
              if (confirm(lang === 'en' ? "CRITICAL: Confirm erasing your entire RepRise Coach workout databases? This is permanent." : "تنبيه هام للغاية: حذف كافة البيانات والجداول من المتصفح؟ هذا الإجراء فوري ولا يمكن التراجع عنه.")) {
                onClearState();
                setSuccessMsg(lang === 'en' ? 'Cleared state cleanly! Reloading setup...' : 'تم مسح البيانات تماماً!');
                setTimeout(() => window.location.reload(), 1500);
              }
            }}
            className="px-4 py-2 bg-[#FF3B30]/10 hover:bg-[#FF3B30] border border-[#FF3B30]/20 hover:border-transparent text-[#FF3B30] hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer uppercase tracking-wider"
          >
            {lang === 'en' ? 'Delete entire local Database' : 'تدمير ومسح قاعدة البيانات بالكامل'}
          </button>
        </div>
      </div>

    </div>
  );
}
