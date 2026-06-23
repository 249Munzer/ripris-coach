/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState } from 'react';
import { EXERCISE_DATABASE } from '../data/exercises';
import { Search, ShieldAlert, BadgeInfo, CheckCircle, SlidersHorizontal, Dumbbell } from 'lucide-react';

interface ExerciseLibraryViewProps {
  lang: 'en' | 'ar';
  t: any;
}

export default function ExerciseLibraryView({ lang, t }: ExerciseLibraryViewProps) {
  const [search, setSearch] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState('All');
  const [selectedEquip, setSelectedEquip] = useState('All');

  const muscles = ['All', 'Chest', 'Back', 'Quads', 'Hamstrings', 'Shoulders', 'Arms'];
  const equipment = ['All', 'Barbell', 'Dumbbell', 'Cable', 'Machine', 'Bodyweight'];

  const filtered = EXERCISE_DATABASE.filter(ex => {
    const term = search.toLowerCase();
    const nameMatches = ex.name.toLowerCase().includes(term) || ex.nameAr.includes(term);
    const muscleMatches = selectedMuscle === 'All' || ex.muscle === selectedMuscle;
    const equipMatches = selectedEquip === 'All' || ex.equipment === selectedEquip;
    return nameMatches && muscleMatches && equipMatches;
  });

  return (
    <div className="bg-[#101010] border border-neutral-850 rounded-2xl p-6 space-y-6" id="exercise-catalog-root">
      {/* Catalog Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-850 pb-4" id="cat-header">
        <div className="flex items-center gap-3">
          <Dumbbell className="w-5 h-5 text-[#FF4D00]" />
          <div>
            <h2 className="text-base font-bold text-white uppercase tracking-wider">{t.exerciseLibrary}</h2>
            <p className="text-[10px] text-neutral-500">{lang === 'en' ? 'Biomechanical instructions, primary load types & execution protocols' : 'تعليمات الأداء الحركي، استهداف العضلات والأدوات المستخدمة بالتفصيل'}</p>
          </div>
        </div>
      </div>

      {/* Directory Searching filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3" id="filters-grid">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" />
          <input
            id="cat-search-input"
            type="text"
            placeholder={lang === 'en' ? 'Search movements...' : 'ابحث عن تمرين محدد...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#181818] border border-neutral-800 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-neutral-500 focus:outline-none"
          />
        </div>

        <div>
          <select
            id="cat-muscle-select"
            value={selectedMuscle}
            onChange={(e) => setSelectedMuscle(e.target.value)}
            className="w-full bg-[#181818] border border-neutral-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none"
          >
            {muscles.map(m => (
              <option key={m} value={m}>{m === 'All' ? `${t.filterMuscle}: ${t.all}` : m}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            id="cat-equip-select"
            value={selectedEquip}
            onChange={(e) => setSelectedEquip(e.target.value)}
            className="w-full bg-[#181818] border border-neutral-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none"
          >
            {equipment.map(e => (
              <option key={e} value={e}>{e === 'All' ? `${t.filterEquipment}: ${t.all}` : e}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid of movements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="movements-result-grid">
        {filtered.map((item) => (
          <div key={item.id} className="bg-[#181818] border border-neutral-800 rounded-xl p-4 flex flex-col justify-between space-y-4" id={`movement-card-${item.id}`}>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] bg-neutral-800 text-[#FF4D00] font-mono px-2 py-0.5 rounded font-bold">
                  {item.muscle.toUpperCase()}
                </span>
                <span className={`text-[10px] uppercase font-bold flex items-center gap-1 ${item.injurySafe ? 'text-[#16C47F]' : 'text-yellow-500'}`}>
                  {item.injurySafe ? (
                    <>
                      <CheckCircle className="w-3 h-3" />
                      {lang === 'en' ? 'Injury Safe' : 'آمن للمفاصل'}
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-3 h-3" />
                      {lang === 'en' ? 'Form Critical' : 'يتطلب دقة حركية'}
                    </>
                  )}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white">{lang === 'en' ? item.name : item.nameAr}</h3>
              <p className="text-xs text-neutral-400 !leading-relaxed">
                {lang === 'en' ? item.instructions : item.instructionsAr}
              </p>
            </div>

            <div className="pt-2 border-t border-neutral-850 flex items-center justify-between text-[10px] text-neutral-500 font-mono">
              <span>{lang === 'en' ? 'Equipment' : 'الأداة'}: <span className="text-white">{item.equipment}</span></span>
              <span>{lang === 'en' ? 'Action' : 'الرتم'}: <span className="text-white">{item.pattern}</span></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
