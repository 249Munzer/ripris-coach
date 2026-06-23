/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { TimelineEntry, Client } from '../types';
import { getTimeline, saveTimeline } from '../storage/db';
import { logTimelineEvent } from '../utils/timelineLogger';
import { 
  ClipboardCheck, 
  FileText, 
  Dumbbell, 
  Apple, 
  Scale, 
  Ruler, 
  Award, 
  Archive, 
  RefreshCw, 
  Activity, 
  UserPlus, 
  Image, 
  Search, 
  MessageSquare,
  Plus
} from 'lucide-react';

interface ClientTimelineTabProps {
  client: Client;
  lang: 'en' | 'ar';
}

export default function ClientTimelineTab({ client, lang }: ClientTimelineTabProps) {
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  
  // Manual comment modal/fields
  const [showAddLog, setShowAddLog] = useState(false);
  const [customSummary, setCustomSummary] = useState('');
  const [customSummaryAr, setCustomSummaryAr] = useState('');
  const [customComments, setCustomComments] = useState('');
  const [customCategory, setCustomCategory] = useState<TimelineEntry['category']>('system');

  const loadTimeline = () => {
    const list = getTimeline().filter(t => t.clientId === client.id);
    setTimeline(list);
  };

  useEffect(() => {
    loadTimeline();
  }, [client.id]);

  const handleAddManualLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSummary.trim()) return;

    logTimelineEvent(
      client.id,
      'status_changed',
      customSummary,
      customSummaryAr || customSummary,
      customCategory,
      customComments
    );

    setCustomSummary('');
    setCustomSummaryAr('');
    setCustomComments('');
    setShowAddLog(false);
    loadTimeline();
  };

  const categories = [
    { id: 'all', label: lang === 'en' ? 'All Events' : 'كل الأحداث' },
    { id: 'training', label: lang === 'en' ? 'Training' : 'التدريب' },
    { id: 'nutrition', label: lang === 'en' ? 'Nutrition' : 'التغذية' },
    { id: 'measurements', label: lang === 'en' ? 'Measurements' : 'القياسات' },
    { id: 'inbody', label: lang === 'en' ? 'InBody' : 'InBody' },
    { id: 'photos', label: lang === 'en' ? 'Photos' : 'الصور' },
    { id: 'notes', label: lang === 'en' ? 'Notes' : 'الملاحظات' },
    { id: 'programs', label: lang === 'en' ? 'Programs' : 'البرامج' },
    { id: 'system', label: lang === 'en' ? 'System' : 'النظام' },
  ];

  const filteredTimeline = timeline.filter(item => {
    const term = search.toLowerCase();
    const txt = ((lang === 'en' ? item.summary : item.summaryAr) || item.summary || '').toLowerCase();
    const com = (item.coachComments || '').toLowerCase();
    const matchesSearch = txt.includes(term) || com.includes(term);
    const matchesCat = activeCategory === 'all' || item.category === activeCategory;
    return matchesSearch && matchesCat;
  });

  const getIcon = (name: string) => {
    switch (name) {
      case 'ClipboardCheck': return <ClipboardCheck className="w-4 h-4 text-emerald-400" />;
      case 'FileText': return <FileText className="w-4 h-4 text-indigo-400" />;
      case 'Dumbbell': return <Dumbbell className="w-4 h-4 text-yellow-500" />;
      case 'Apple': return <Apple className="w-4 h-4 text-orange-400" />;
      case 'Scale': return <Scale className="w-4 h-4 text-teal-400" />;
      case 'Ruler': return <Ruler className="w-4 h-4 text-pink-400" />;
      case 'Award': return <Award className="w-4 h-4 text-amber-400" />;
      case 'Archive': return <Archive className="w-4 h-4 text-neutral-500" />;
      case 'RefreshCw': return <RefreshCw className="w-4 h-4 text-cyan-400" />;
      case 'UserPlus': return <UserPlus className="w-4 h-4 text-[#FF4D00]" />;
      case 'Image': return <Image className="w-4 h-4 text-purple-400" />;
      default: return <Activity className="w-4 h-4 text-neutral-400" />;
    }
  };

  return (
    <div className="space-y-4" id="timeline-engine-workspace">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            placeholder={lang === 'en' ? 'Search timeline details...' : 'ابحث في الأحداث الزمنية...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#181818] border border-neutral-800 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#FF4D00]"
          />
        </div>
        <button
          onClick={() => setShowAddLog(!showAddLog)}
          className="bg-[#222] border border-neutral-800 hover:bg-neutral-800 text-white text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-[#FF4D00]" />
          <span>{lang === 'en' ? 'Add Manual Log' : 'إضافة حدث يدوي'}</span>
        </button>
      </div>

      {showAddLog && (
        <form onSubmit={handleAddManualLog} className="bg-neutral-950 p-4 rounded-xl border border-neutral-850 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-neutral-400 font-bold block mb-1">EVENT SUMMARY (EN)</label>
              <input
                type="text"
                required
                placeholder="e.g. Completed a customized posture alignment workshop"
                value={customSummary}
                onChange={(e) => setCustomSummary(e.target.value)}
                className="w-full bg-[#101010] border border-neutral-800 text-xs text-white rounded-lg p-2 focus:border-[#FF4D00] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-neutral-400 font-bold block mb-1">EVENT SUMMARY (AR)</label>
              <input
                type="text"
                placeholder="مثال: أكمل ورشة تصحيح القوام الرياضية"
                value={customSummaryAr}
                onChange={(e) => setCustomSummaryAr(e.target.value)}
                className="w-full bg-[#101010] border border-neutral-800 text-xs text-white rounded-lg p-2 focus:border-[#FF4D00] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-neutral-400 font-bold block mb-1">COACH LOG COMMENTS</label>
              <input
                type="text"
                placeholder="Add special coach feedback comments..."
                value={customComments}
                onChange={(e) => setCustomComments(e.target.value)}
                className="w-full bg-[#101010] border border-neutral-800 text-xs text-white rounded-lg p-2 focus:border-[#FF4D00] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-neutral-400 font-bold block mb-1">CATEGORY</label>
              <select
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value as any)}
                className="w-full bg-[#101010] border border-neutral-800 text-xs text-white rounded-lg p-2 focus:border-[#FF4D00] focus:outline-none"
              >
                <option value="training">Training</option>
                <option value="nutrition">Nutrition</option>
                <option value="measurements">Measurements</option>
                <option value="inbody">InBody</option>
                <option value="photos">Photos</option>
                <option value="notes">Coach Notes</option>
                <option value="system">System/General</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddLog(false)}
              className="text-[10px] text-neutral-400 px-3 py-1.5 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-[#FF4D00] text-xs text-white px-4 py-1.5 rounded-lg hover:bg-orange-600 block"
            >
              Add Entry
            </button>
          </div>
        </form>
      )}

      {/* Category selector pill strip */}
      <div className="flex flex-wrap gap-1 bg-[#181818] p-1 rounded-xl scrollbar-none overflow-x-auto">
        {categories.map(c => (
          <button
            key={c.id}
            onClick={() => setActiveCategory(c.id)}
            className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer uppercase ${activeCategory === c.id ? 'bg-[#FF4D00] text-white' : 'text-neutral-400 hover:text-neutral-200'}`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Timeline entries stacked */}
      <div className="space-y-3 relative before:absolute before:top-2 before:bottom-2 before:left-[19px] before:w-0.5 before:bg-neutral-800 pr-1 pl-1">
        {filteredTimeline.length === 0 ? (
          <div className="text-center py-8 text-xs text-neutral-500">
            {lang === 'en' ? 'No history matching filters found.' : 'لا توجد أحداث مطابقة للبحث.'}
          </div>
        ) : (
          filteredTimeline.map(item => (
            <div key={item.id} className="relative pl-10 group" id={`timeline-entry-${item.id}`}>
              {/* Event Dot Icon absolute layout */}
              <div className="absolute left-0 top-1 h-10 w-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center p-2 group-hover:border-[#FF4D00] transition-colors">
                {getIcon(item.icon)}
              </div>

              <div className="bg-[#181818] border border-neutral-800/80 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-tight">
                    {lang === 'en' ? item.summary : (item.summaryAr || item.summary)}
                  </h4>
                  <span className="text-[9px] text-neutral-500 font-mono">
                    {item.date} • {item.time}
                  </span>
                </div>

                {item.coachComments && (
                  <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-900 text-[11px] text-neutral-400 flex gap-2">
                    <MessageSquare className="w-3.5 h-3.5 text-[#FF4D00] shrink-0 mt-0.5" />
                    <p className="italic">"{item.coachComments}"</p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
