/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CoachNote, Client } from '../types';
import { getCoachNotes, saveCoachNotes } from '../storage/db';
import { logTimelineEvent } from '../utils/timelineLogger';
import { 
  Pin, 
  Trash2, 
  Star, 
  Archive, 
  Search, 
  Plus, 
  Tag, 
  AlertTriangle, 
  X, 
  Edit3, 
  Folder,
  History
} from 'lucide-react';

interface CoachNotesTabProps {
  client: Client;
  lang: 'en' | 'ar';
}

export default function CoachNotesTab({ client, lang }: CoachNotesTabProps) {
  const [notes, setNotes] = useState<CoachNote[]>([]);
  const [search, setSearch] = useState('');
  const [selectedNote, setSelectedNote] = useState<CoachNote | null>(null);

  // Form edit elements
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteCategory, setNoteCategory] = useState<CoachNote['category']>('general');
  const [noteIsPinned, setNoteIsPinned] = useState(false);
  const [noteIsPriority, setNoteIsPriority] = useState(false);
  const [noteIsFavorite, setNoteIsFavorite] = useState(false);
  const [noteTags, setNoteTags] = useState('');

  const loadNotes = () => {
    const list = getCoachNotes().filter(n => n.clientId === client.id);
    setNotes(list);
  };

  useEffect(() => {
    loadNotes();
  }, [client.id]);

  const handleOpenNewForm = () => {
    setSelectedNote(null);
    setNoteTitle('');
    setNoteContent('');
    setNoteCategory('general');
    setNoteIsPinned(false);
    setNoteIsPriority(false);
    setNoteIsFavorite(false);
    setNoteTags('');
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (note: CoachNote) => {
    setSelectedNote(note);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setNoteCategory(note.category);
    setNoteIsPinned(note.isPinned);
    setNoteIsPriority(note.isPriority);
    setNoteIsFavorite(note.isFavorite);
    setNoteTags(note.tags.join(', '));
    setIsFormOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteContent.trim()) return;

    const allNotes = getCoachNotes();
    const currentDate = new Date().toISOString().split('T')[0];
    const tagsArr = noteTags.split(',').map(t => t.trim()).filter(Boolean);

    if (selectedNote) {
      // Update
      const oldVersions = selectedNote.editHistory || [];
      const editHistory = [
        ...oldVersions,
        { date: currentDate, content: selectedNote.content }
      ];

      const updated: CoachNote = {
        ...selectedNote,
        title: noteTitle,
        content: noteContent,
        category: noteCategory,
        isPinned: noteIsPinned,
        isPriority: noteIsPriority,
        isFavorite: noteIsFavorite,
        tags: tagsArr,
        updatedAt: new Date().toISOString(),
        editHistory
      };

      const changedList = allNotes.map(n => n.id === selectedNote.id ? updated : n);
      saveCoachNotes(changedList);

      logTimelineEvent(
        client.id,
        'note_added',
        `Updated Note: ${noteTitle}`,
        `تحديث ملاحظة: ${noteTitle}`,
        'notes',
        `Note content rewritten. Old version archived in note structural history.`
      );
    } else {
      // Create
      const newNote: CoachNote = {
        id: `note_${Date.now()}`,
        clientId: client.id,
        title: noteTitle,
        content: noteContent,
        date: currentDate,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        category: noteCategory,
        isPinned: noteIsPinned,
        isPriority: noteIsPriority,
        isFavorite: noteIsFavorite,
        isArchived: false,
        tags: tagsArr,
        editHistory: []
      };

      saveCoachNotes([newNote, ...allNotes]);

      logTimelineEvent(
        client.id,
        'note_added',
        `Added New Coach Note: ${noteTitle}`,
        `إضافة ملاحظة جديدة: ${noteTitle}`,
        'notes',
        `Categorized under ${noteCategory}. Marked as ${noteIsPriority ? 'HIGH PRIORITY' : 'standard frequency'}.`
      );
    }

    setIsFormOpen(false);
    loadNotes();
  };

  const handleTogglePin = (note: CoachNote) => {
    const allNotes = getCoachNotes();
    const updated = allNotes.map(n => n.id === note.id ? { ...n, isPinned: !n.isPinned } : n);
    saveCoachNotes(updated);
    loadNotes();
  };

  const handleToggleFavorite = (note: CoachNote) => {
    const allNotes = getCoachNotes();
    const updated = allNotes.map(n => n.id === note.id ? { ...n, isFavorite: !n.isFavorite } : n);
    saveCoachNotes(updated);
    loadNotes();
  };

  const handleToggleArchive = (note: CoachNote) => {
    const allNotes = getCoachNotes();
    const updated = allNotes.map(n => n.id === note.id ? { ...n, isArchived: !n.isArchived } : n);
    saveCoachNotes(updated);
    loadNotes();
  };

  const handleDeleteNote = (noteId: string) => {
    if (confirm(lang === 'en' ? 'Permanently delete this note?' : 'هل أنت متأكد من حذف هذه الملاحظة نهائياً؟')) {
      const allNotes = getCoachNotes();
      const filtered = allNotes.filter(n => n.id !== noteId);
      saveCoachNotes(filtered);
      loadNotes();
    }
  };

  // Filter & priority sorts
  const filteredNotes = notes.filter(n => {
    const searchLow = search.toLowerCase();
    const matchesSearch = n.title.toLowerCase().includes(searchLow) || 
                          n.content.toLowerCase().includes(searchLow) ||
                          n.tags.some(t => t.toLowerCase().includes(searchLow));
    return matchesSearch;
  });

  // Sort notes: pinned first, then priority, then favorite, then date
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    if (a.isPriority && !b.isPriority) return -1;
    if (!a.isPriority && b.isPriority) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  return (
    <div className="space-y-4" id="coach-notes-engine-layout">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            placeholder={lang === 'en' ? 'Search coaching notes by title, tag...' : 'ابحث في الملاحظات والتاجات...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#181818] border border-neutral-800 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#FF4D00]"
          />
        </div>
        <button
          onClick={handleOpenNewForm}
          className="bg-[#FF4D00] hover:bg-orange-600 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{lang === 'en' ? 'Create Private Note' : 'إضافة ملاحظة خاصة'}</span>
        </button>
      </div>

      {isFormOpen && (
        <form onSubmit={handleFormSubmit} className="bg-neutral-950 p-5 rounded-2xl border border-neutral-850 space-y-4" id="note-editor-form">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              {selectedNote ? (lang === 'en' ? 'Edit Coaching Note' : 'تعديل ملاحظة للتلميذ') : (lang === 'en' ? 'Create Coaching Note' : 'إضافة ملاحظة للتلميذ')}
            </h3>
            <button type="button" onClick={() => setIsFormOpen(false)} className="text-neutral-500 hover:text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[10px] text-neutral-400 font-bold block mb-1">NOTE TITLE</label>
              <input
                type="text"
                required
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="Title summarizing core athletic observation..."
                className="w-full bg-[#101010] border border-neutral-800 text-xs text-white rounded-lg p-2.5 focus:border-[#FF4D00] focus:outline-none placeholder-neutral-600 font-semibold"
              />
            </div>

            <div>
              <label className="text-[10px] text-neutral-400 font-bold block mb-1">DETAILED ANALYSIS & ROADMAP (LONG OR QUICK COCH NOTE)</label>
              <textarea
                rows={4}
                required
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Identify deficits, changes to program progression, corrective cueing..."
                className="w-full bg-[#101010] border border-neutral-800 text-xs text-white rounded-lg p-2.5 focus:border-[#FF4D00] focus:outline-none placeholder-neutral-600 leading-relaxed font-sans"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-neutral-400 font-bold block mb-1">CATEGORY</label>
                <select
                  value={noteCategory}
                  onChange={(e) => setNoteCategory(e.target.value as any)}
                  className="w-full bg-[#101010] border border-neutral-800 text-xs text-white rounded-lg p-2 focus:border-[#FF4D00] focus:outline-none font-medium"
                >
                  <option value="general">General</option>
                  <option value="training">Training</option>
                  <option value="nutrition">Nutrition</option>
                  <option value="medical">Medical</option>
                  <option value="recovery">Recovery</option>
                  <option value="psychology">Psychology</option>
                  <option value="lifestyle">Lifestyle</option>
                  <option value="competition">Competition</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-neutral-400 font-bold block mb-1">TAGS (SEPARATED BY COMMA)</label>
                <input
                  type="text"
                  value={noteTags}
                  onChange={(e) => setNoteTags(e.target.value)}
                  placeholder="e.g. Mobility, Ankles, Quads, Squat"
                  className="w-full bg-[#101010] border border-neutral-800 text-xs text-white rounded-lg p-2 focus:border-[#FF4D00] focus:outline-none placeholder-neutral-600"
                />
              </div>
            </div>

            {/* Quick checkbox toggles */}
            <div className="flex flex-wrap gap-4 pt-1 text-xs">
              <label className="flex items-center gap-1.5 text-neutral-300 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={noteIsPinned}
                  onChange={(e) => setNoteIsPinned(e.target.checked)}
                  className="rounded border-neutral-800 text-[#FF4D00] focus:ring-0 bg-neutral-900"
                />
                <Pin className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500/10" />
                <span>Pin to top</span>
              </label>

              <label className="flex items-center gap-1.5 text-neutral-300 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={noteIsPriority}
                  onChange={(e) => setNoteIsPriority(e.target.checked)}
                  className="rounded border-neutral-800 text-[#FF4D00] focus:ring-0 bg-neutral-900"
                />
                <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                <span>High Priority</span>
              </label>

              <label className="flex items-center gap-1.5 text-neutral-300 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={noteIsFavorite}
                  onChange={(e) => setNoteIsFavorite(e.target.checked)}
                  className="rounded border-neutral-800 text-[#FF4D00] focus:ring-0 bg-neutral-900"
                />
                <Star className="w-3.5 h-3.5 text-orange-400 fill-orange-400/10" />
                <span>Mark as Favorite</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-neutral-900">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="text-xs text-neutral-400 px-3 py-1.5 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-[#FF4D00] text-xs font-bold text-white px-5 py-1.5 rounded-lg hover:bg-orange-600"
            >
              Save Note
            </button>
          </div>
        </form>
      )}

      {/* Render Note Cards */}
      <div className="grid grid-cols-1 gap-3 pr-1 pl-1">
        {sortedNotes.length === 0 ? (
          <div className="text-center py-10 text-xs text-neutral-500 border border-dashed border-neutral-850 rounded-2xl">
            {lang === 'en' ? 'No private coach notes registered yet.' : 'لا توجد ملاحظات خاصة مسجلة حالياً.'}
          </div>
        ) : (
          sortedNotes.map(note => (
            <div key={note.id} className="bg-[#181818] border border-neutral-800/80 rounded-2xl p-5 space-y-4 hover:border-neutral-700 transition-all flex flex-col justify-between" id={`note-card-${note.id}`}>
              
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2.5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[9px] bg-neutral-900 text-neutral-400 border border-neutral-800 px-2 py-0.5 rounded uppercase font-bold tracking-wider flex items-center gap-1">
                        <Folder className="w-2.5 h-2.5" />
                        {note.category}
                      </span>
                      {note.isPriority && (
                        <span className="text-[9px] bg-red-950/40 text-red-400 border border-red-900/45 px-1.5 py-0.5 rounded uppercase font-extrabold flex items-center gap-1">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          High
                        </span>
                      )}
                      {note.isPinned && (
                        <Pin className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                      )}
                      {note.isFavorite && (
                        <Star className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-white tracking-tight">{note.title}</h3>
                  </div>

                  <span className="text-[10px] text-neutral-500 font-mono">
                    {note.date}
                  </span>
                </div>

                <p className="text-xs text-neutral-300 font-sans leading-relaxed whitespace-pre-wrap">{note.content}</p>

                {/* Tags lists */}
                {note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {note.tags.map(tag => (
                      <span key={tag} className="text-[10px] text-neutral-400 bg-neutral-950/50 hover:bg-neutral-900 hover:text-white transition-colors border border-neutral-900 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Tag className="w-2.5 h-2.5 text-[#FF4D00]" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Edit History view */}
              {note.editHistory && note.editHistory.length > 0 && (
                <div className="bg-neutral-950/60 p-2.5 rounded-lg border border-neutral-900 text-[10px] text-neutral-500 flex items-start gap-2 max-h-24 overflow-y-auto">
                  <History className="w-3.5 h-3.5 text-neutral-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-extrabold tracking-widest text-[8px] uppercase text-neutral-400 block">EDIT HISTORY PANEL</span>
                    {note.editHistory.map((h, i) => (
                      <div key={i} className="border-t border-neutral-900/60 pt-1 mt-1">
                        <span className="font-mono text-neutral-500 block">{h.date}:</span>
                        <p className="italic text-neutral-400">"{h.content.length > 80 ? h.content.substring(0, 80) + '...' : h.content}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Toolbar buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-neutral-900 mt-2 text-xs">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleTogglePin(note)}
                    className={`p-1.5 hover:bg-neutral-900 rounded-lg cursor-pointer ${note.isPinned ? 'text-yellow-500' : 'text-neutral-500 hover:text-neutral-300'}`}
                    title="Pin Note"
                  >
                    <Pin className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => handleToggleFavorite(note)}
                    className={`p-1.5 hover:bg-neutral-900 rounded-lg cursor-pointer ${note.isFavorite ? 'text-orange-400' : 'text-neutral-500 hover:text-neutral-300'}`}
                    title="Favorite Note"
                  >
                    <Star className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => handleToggleArchive(note)}
                    className={`p-1.5 hover:bg-neutral-900 rounded-lg cursor-pointer ${note.isArchived ? 'text-[#FF4D00]' : 'text-neutral-500 hover:text-neutral-300'}`}
                    title="Archive Note"
                  >
                    <Archive className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => handleOpenEditForm(note)}
                    className="p-1 px-3 text-xs border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg cursor-pointer flex items-center gap-1"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                  <button 
                    onClick={() => handleDeleteNote(note.id)}
                    className="p-1.5 hover:bg-red-950/20 text-neutral-500 hover:text-red-500 rounded-lg cursor-pointer"
                    title="Delete Note"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          ))
        )}
      </div>

    </div>
  );
}
