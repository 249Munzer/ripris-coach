/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Client, Gender, ExperienceLevel, ActivityLevel, GymAccess, ClientStatus } from '../types';
import { 
  Search, 
  Plus, 
  Trash2, 
  Archive, 
  CheckCircle, 
  Activity, 
  FileText, 
  Dumbbell, 
  Apple, 
  Scale, 
  Heart, 
  Sliders, 
  X, 
  Eye, 
  Tag,
  AlertCircle,
  Users,
  GitCommit,
  GitBranch,
  Target,
  Cpu,
  ClipboardCheck,
  ChevronDown,
  AlertTriangle,
  RefreshCw,
  FolderOpen
} from 'lucide-react';

import ClientTimelineTab from './ClientTimelineTab';
import CoachNotesTab from './CoachNotesTab';
import ClientGoalsTab from './ClientGoalsTab';
import AIClientAnalysisTab from './AIClientAnalysisTab';
import CheckInHistoryTab from './CheckInHistoryTab';
import ProgramVersionsTab from './ProgramVersionsTab';
import NutritionVersionsTab from './NutritionVersionsTab';

interface ClientsViewProps {
  clients: Client[];
  lang: 'en' | 'ar';
  t: any;
  onAddClient: (client: Client) => void;
  onUpdateClient: (client: Client) => void;
  onDeleteClient: (id: string) => void;
  onSelectClient: (view: string, clientId: string) => void;
  activeSelectedClientId?: string;
}

export default function ClientsView({
  clients,
  lang,
  t,
  onAddClient,
  onUpdateClient,
  onDeleteClient,
  onSelectClient,
  activeSelectedClientId
}: ClientsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived' | 'soft_deleted'>('active');
  const [selectedClient, setSelectedClient] = useState<Client | null>(
    clients.find(c => c.id === activeSelectedClientId) || clients[0] || null
  );

  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'timeline' | 'notes' | 'goals' | 'checkins' | 'workouts' | 'nutrition' | 'ai_analysis'>('profile');

  useEffect(() => {
    if (activeSelectedClientId) {
      const found = clients.find(c => c.id === activeSelectedClientId);
      if (found) {
        setSelectedClient(found);
      }
    }
  }, [activeSelectedClientId, clients]);


  // Form states (Add/Edit)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Single-state client form values
  const [formName, setFormName] = useState('');
  const [formGender, setFormGender] = useState<Gender>('male');
  const [formAge, setFormAge] = useState(25);
  const [formHeight, setFormHeight] = useState(175);
  const [formWeight, setFormWeight] = useState(70);
  const [formGoal, setFormGoal] = useState('');
  const [formExperience, setFormExperience] = useState<ExperienceLevel>('beginner');
  const [formActivity, setFormActivity] = useState<ActivityLevel>('moderate');
  const [formGymAccess, setFormGymAccess] = useState<GymAccess>('gym');
  const [formEquipment, setFormEquipment] = useState<string[]>(['Dumbbell']);
  const [formTrainingDays, setFormTrainingDays] = useState(3);
  const [formWorkoutDuration, setFormWorkoutDuration] = useState(60);
  const [formInjuries, setFormInjuries] = useState('');
  const [formLimitations, setFormLimitations] = useState('');
  const [formMedicalNotes, setFormMedicalNotes] = useState('');
  const [formSleep, setFormSleep] = useState<'poor' | 'average' | 'good'>('average');
  const [formStress, setFormStress] = useState<'low' | 'medium' | 'high'>('medium');
  const [formNotes, setFormNotes] = useState('');
  const [formTags, setFormTags] = useState('');

  // Handle open creation dialog
  const openAddForm = () => {
    setIsEditing(false);
    setFormName('');
    setFormGender('male');
    setFormAge(28);
    setFormHeight(180);
    setFormWeight(80);
    setFormGoal('Body Recomposition');
    setFormExperience('intermediate');
    setFormActivity('moderate');
    setFormGymAccess('gym');
    setFormEquipment(['Barbell', 'Dumbbell', 'Cable']);
    setFormTrainingDays(4);
    setFormWorkoutDuration(60);
    setFormInjuries('');
    setFormLimitations('');
    setFormMedicalNotes('');
    setFormSleep('average');
    setFormStress('medium');
    setFormNotes('');
    setFormTags('Recomp');
    setIsFormOpen(true);
  };

  // Handle open editing dialog
  const openEditForm = (client: Client) => {
    setIsEditing(true);
    setFormName(client.name);
    setFormGender(client.gender);
    setFormAge(client.age);
    setFormHeight(client.height);
    setFormWeight(client.weight);
    setFormGoal(client.goal);
    setFormExperience(client.experience);
    setFormActivity(client.activity);
    setFormGymAccess(client.gymAccess);
    setFormEquipment(client.equipment);
    setFormTrainingDays(client.trainingDays);
    setFormWorkoutDuration(client.workoutDuration);
    setFormInjuries(client.injuries);
    setFormLimitations(client.limitations);
    setFormMedicalNotes(client.medicalNotes);
    setFormSleep(client.sleep);
    setFormStress(client.stress);
    setFormNotes(client.notes);
    setFormTags(client.tags.join(', '));
    setIsFormOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const parsedTags = formTags.split(',').map(tag => tag.trim()).filter(Boolean);

    if (isEditing && selectedClient) {
      const updated: Client = {
        ...selectedClient,
        name: formName,
        gender: formGender,
        age: Number(formAge),
        height: Number(formHeight),
        weight: Number(formWeight),
        goal: formGoal,
        experience: formExperience,
        activity: formActivity,
        gymAccess: formGymAccess,
        equipment: formEquipment,
        trainingDays: Number(formTrainingDays),
        workoutDuration: Number(formWorkoutDuration),
        injuries: formInjuries,
        limitations: formLimitations,
        medicalNotes: formMedicalNotes,
        sleep: formSleep,
        stress: formStress,
        notes: formNotes,
        tags: parsedTags
      };
      onUpdateClient(updated);
      setSelectedClient(updated);
    } else {
      const created: Client = {
        id: `cl_${Date.now()}`,
        name: formName,
        gender: formGender,
        age: Number(formAge),
        height: Number(formHeight),
        weight: Number(formWeight),
        goal: formGoal,
        experience: formExperience,
        activity: formActivity,
        gymAccess: formGymAccess,
        equipment: formEquipment,
        trainingDays: Number(formTrainingDays),
        workoutDuration: Number(formWorkoutDuration),
        injuries: formInjuries,
        limitations: formLimitations,
        medicalNotes: formMedicalNotes,
        sleep: formSleep,
        stress: formStress,
        notes: formNotes,
        tags: parsedTags,
        status: 'active',
        createdAt: new Date().toISOString()
      };
      onAddClient(created);
      setSelectedClient(created);
    }
    setIsFormOpen(false);
  };

  const toggleArchiveStatus = (client: Client) => {
    const updated: Client = {
      ...client,
      status: client.status === 'active' ? 'archived' : 'active'
    };
    onUpdateClient(updated);
    setSelectedClient(updated);
  };

  const handleEquipmentToggle = (item: string) => {
    if (formEquipment.includes(item)) {
      setFormEquipment(formEquipment.filter(x => x !== item));
    } else {
      setFormEquipment([...formEquipment, item]);
    }
  };

  // Filter clients List
  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          client.goal.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="clients-view-root">
      
      {/* 1. Sidebar - Client Finder & Directory */}
      <div className="lg:col-span-1 bg-[#101010] border border-neutral-850 rounded-2xl p-4 space-y-4 flex flex-col h-[calc(100vh-140px)] overflow-hidden" id="clients-directory-list">
        
        {/* Header Search Box */}
        <div className="space-y-3" id="finder-header">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white uppercase tracking-tight flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-[#FF4D00]" />
              {t.clients}
            </h2>
            <button
              id="add-client-icon-btn"
              onClick={openAddForm}
              className="p-1.5 bg-[#FF4D00] hover:bg-[#E04400] text-white rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              {t.add}
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" />
            <input
              id="client-search-input"
              type="text"
              placeholder={lang === 'en' ? 'Search by name, goal...' : 'ابحث باسم المشترك، أو الهدف...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#181818] border border-neutral-800 rounded-xl py-2 pl-9 pr-4 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#FF4D00]"
            />
          </div>

          {/* Status Tabs (Active / Archived / Soft Deleted / All) */}
          <div className="flex bg-[#181818] rounded-xl p-1 text-[10px] uppercase font-bold scrollbar-none overflow-x-auto gap-0.5" id="status-quick-selection">
            <button
              id="tab-active-clients"
              onClick={() => setStatusFilter('active')}
              className={`flex-1 text-center py-1.5 rounded-lg transition-colors cursor-pointer shrink-0 px-2 ${statusFilter === 'active' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-neutral-200'}`}
            >
              {t.active}
            </button>
            <button
              id="tab-archived-clients"
              onClick={() => setStatusFilter('archived')}
              className={`flex-1 text-center py-1.5 rounded-lg transition-colors cursor-pointer shrink-0 px-2 ${statusFilter === 'archived' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-neutral-200'}`}
            >
              {t.archived}
            </button>
            <button
              id="tab-deleted-clients"
              onClick={() => setStatusFilter('soft_deleted')}
              className={`flex-1 text-center py-1.5 rounded-lg transition-colors cursor-pointer shrink-0 px-2 ${statusFilter === 'soft_deleted' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-neutral-200'}`}
            >
              {t.trash}
            </button>
            <button
              id="tab-all-clients"
              onClick={() => setStatusFilter('all')}
              className={`flex-1 text-center py-1.5 rounded-lg transition-colors cursor-pointer shrink-0 px-2 ${statusFilter === 'all' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-neutral-200'}`}
            >
              {t.all}
            </button>
          </div>
        </div>

        {/* Dynamic Client List Scroll */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1" id="client-items-scroll">
          {filteredClients.length === 0 ? (
            <div className="text-center py-8 text-xs text-neutral-500" id="no-search-results">
              {t.noClients}
            </div>
          ) : (
            filteredClients.map((client) => {
              const isSelected = selectedClient?.id === client.id;
              return (
                <div
                  key={client.id}
                  id={`client-preview-card-${client.id}`}
                  onClick={() => setSelectedClient(client)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected 
                      ? 'bg-neutral-900 border-[#FF4D00] shadow-sm' 
                      : 'bg-[#181818] border-transparent hover:bg-neutral-900/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-200 flex items-center justify-center font-bold text-xs">
                      {client.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white truncate max-w-[140px]">{client.name}</h4>
                      <p className="text-[10px] text-neutral-400 truncate max-w-[140px] mt-0.5">{client.goal}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {client.status === 'archived' && (
                      <span className="text-[9px] bg-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded uppercase">
                        {t.archived}
                      </span>
                    )}
                    <span className="h-1.5 w-1.5 rounded-full bg-[#16C47F]" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Main Workspace - Client Profile & Rapid Action Suite */}
      <div className="lg:col-span-2 bg-[#101010] border border-neutral-850 rounded-2xl p-6 h-[calc(100vh-140px)] overflow-y-auto space-y-6" id="client-workspace-panel">
        {selectedClient ? (
          <div className="space-y-6" id={`workspace-content-${selectedClient.id}`}>
            
            {/* Soft Deleted Purge Count Down Alert */}
            {selectedClient.status === 'soft_deleted' && (
              <div className="bg-red-950/50 border border-red-900/60 p-4 rounded-2xl text-xs text-red-200 flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse shrink-0" />
                  <div>
                    <span className="font-extrabold block uppercase tracking-wider text-[9px] text-red-400">Soft Deleted State Activated</span>
                    <p className="mt-0.5">This profile is in the recycle bin. Scheduled for permanent deletion in 30 days.</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const restored: Client = {
                      ...selectedClient,
                      status: 'active',
                      deleteTimerStartedAt: undefined,
                      statusHistory: [...(selectedClient.statusHistory || []), {
                        status: 'active',
                        date: new Date().toISOString().split('T')[0],
                        reason: 'Client restored from soft_deleted state.'
                      }]
                    };
                    onUpdateClient(restored);
                    setSelectedClient(restored);
                  }}
                  className="bg-red-900 hover:bg-red-800 text-white font-bold px-4 py-1.5 rounded-xl cursor-pointer"
                >
                  Restore From Trash
                </button>
              </div>
            )}

            {/* Header / Primary details Card */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-850 pb-5" id="client-profile-header">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-[#FF4D00] to-orange-400 text-white flex items-center justify-center font-bold text-lg shrink-0">
                  {selectedClient.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h1 className="text-xl font-bold text-white font-sans">{selectedClient.name}</h1>
                    
                    {/* Dynamic Status Selector */}
                    <div className="relative">
                      <select
                        value={selectedClient.status}
                        onChange={(e) => {
                          const newStatus = e.target.value as ClientStatus;
                          const nextHistory = selectedClient.statusHistory || [];
                          const updated: Client = {
                            ...selectedClient,
                            status: newStatus,
                            deleteTimerStartedAt: newStatus === 'soft_deleted' ? new Date().toISOString() : undefined,
                            statusHistory: [...nextHistory, {
                              status: newStatus,
                              date: new Date().toISOString().split('T')[0],
                              reason: `Coach changed status to ${newStatus}.`
                            }]
                          };
                          onUpdateClient(updated);
                          setSelectedClient(updated);
                        }}
                        className={`text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded cursor-pointer focus:outline-none border border-neutral-850 ${
                          selectedClient.status === 'active' ? 'bg-[#16C47F]/10 text-[#16C47F] border-[#16C47F]/30' : 
                          selectedClient.status === 'paused' ? 'bg-yellow-950/30 text-yellow-500' :
                          selectedClient.status === 'vacation' ? 'bg-blue-950/30 text-blue-400' :
                          selectedClient.status === 'injured' ? 'bg-red-950/30 text-red-400 border-red-900/30' :
                          selectedClient.status === 'prep' ? 'bg-purple-950/30 text-purple-400' :
                          selectedClient.status === 'soft_deleted' ? 'bg-red-950/40 text-red-400' :
                          'bg-neutral-900 text-neutral-400'
                        }`}
                      >
                        <option value="active" className="bg-[#101010] text-[#16C47F]">Active</option>
                        <option value="paused" className="bg-[#101010] text-yellow-500">Paused</option>
                        <option value="vacation" className="bg-[#101010] text-blue-400">Vacation</option>
                        <option value="injured" className="bg-[#101010] text-red-400">Injured</option>
                        <option value="prep" className="bg-[#101010] text-purple-400">Prep</option>
                        <option value="returning" className="bg-[#101010] text-orange-400">Returning</option>
                        <option value="lead" className="bg-[#101010] text-teal-400">Lead</option>
                        <option value="inactive" className="bg-[#101010] text-neutral-400">Inactive</option>
                        <option value="archived" className="bg-[#101010] text-neutral-500">Archived</option>
                        <option value="soft_deleted" className="bg-[#101010] text-red-500">Trash</option>
                      </select>
                    </div>

                  </div>
                  <div className="flex items-center gap-3.5 text-xs text-neutral-400 mt-1 max-w-md flex-wrap">
                    <span>{selectedClient.gender === 'male' ? t.male : t.female}</span>
                    <span>•</span>
                    <span>{selectedClient.age} {t.age}</span>
                    <span>•</span>
                    <span>{selectedClient.height} cm / {selectedClient.weight} kg</span>
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-2" id="client-actions-toolbar">
                <button
                  id="client-edit-btn"
                  onClick={() => openEditForm(selectedClient)}
                  className="px-3 py-1.5 bg-neutral-900 border border-neutral-850 hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  {t.edit}
                </button>
                <button
                  id="client-archive-btn"
                  onClick={() => toggleArchiveStatus(selectedClient)}
                  className="p-1 px-3 h-8 text-neutral-400 bg-neutral-900 hover:bg-neutral-800 border border-neutral-850 rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Archive className="w-3.5 h-3.5" />
                  {selectedClient.status === 'active' ? t.archive : t.restore}
                </button>
                <button
                  id="client-delete-btn"
                  onClick={() => {
                    const promptText = lang === 'en' 
                      ? 'Move this client to Soft-Deleted Trash with a 30-day recovery timeline?' 
                      : 'أرسل المشترك إلى سلة المحذوفات المؤقتة مع فرصة استرجاع مدتها 30 يوماً؟';
                    if (confirm(promptText)) {
                      const updated: Client = {
                        ...selectedClient,
                        status: 'soft_deleted',
                        deleteTimerStartedAt: new Date().toISOString(),
                        statusHistory: [...(selectedClient.statusHistory || []), {
                          status: 'soft_deleted',
                          date: new Date().toISOString().split('T')[0],
                          reason: 'Client soft-deleted by coach.'
                        }]
                      };
                      onUpdateClient(updated);
                      setSelectedClient(updated);
                    }
                  }}
                  className="p-2 bg-neutral-900 hover:bg-[#FF3B30]/15 border border-neutral-850 hover:border-[#FF3B30] text-neutral-400 hover:text-[#FF3B30] rounded-xl transition-all cursor-pointer animate-pulse"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Structured workspace premium sub-tab row */}
            <div className="flex bg-[#181818] p-1 rounded-2xl scrollbar-none overflow-x-auto gap-0.5 select-none" id="workspace-view-tabs">
              {[
                { id: 'profile', label: 'Overview', icon: Sliders },
                { id: 'timeline', label: 'Timeline', icon: Activity },
                { id: 'checkins', label: 'Check-ins', icon: ClipboardCheck },
                { id: 'goals', label: 'Goals', icon: Target },
                { id: 'notes', label: 'Coach Notes', icon: FileText },
                { id: 'workouts', label: 'Workouts', icon: GitCommit },
                { id: 'nutrition', label: 'Nutrition', icon: GitBranch },
                { id: 'ai_analysis', label: 'AI Review', icon: Cpu },
              ].map(sub => {
                const isSubActive = activeSubTab === sub.id;
                const SubIcon = sub.icon;
                return (
                  <button
                    key={sub.id}
                    onClick={() => setActiveSubTab(sub.id as any)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[10px] font-extrabold uppercase transition-all cursor-pointer shrink-0 ${
                      isSubActive 
                        ? 'bg-[#FF4D00] text-white shadow-md' 
                        : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/40'
                    }`}
                  >
                    <SubIcon className="w-3.5 h-3.5 shrink-0" />
                    <span>{sub.label}</span>
                  </button>
                );
              })}
            </div>

             {/* Conditionally Render Active Workspace Tab */}
            {activeSubTab === 'profile' && (
              <>
                {/* Tactical Action Triggers */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-neutral-950 p-3 rounded-2xl border border-neutral-850/60" id="tactical-actions-grid">
                  <button 
                    id="tactical-inbody"
                    onClick={() => onSelectClient('inbody', selectedClient.id)}
                    className="p-3 bg-[#101010] hover:bg-neutral-900 border border-neutral-850 rounded-xl transition-all text-center flex flex-col items-center justify-center cursor-pointer space-y-1.5 group"
                  >
                    <Scale className="w-5 h-5 text-[#16C47F] group-hover:scale-105 transition-transform" />
                    <span className="text-xs font-bold text-white block">{t.inbody}</span>
                    <span className="text-[9px] text-neutral-500 block">{lang === 'en' ? 'Assessments' : 'تقييمات ميزان'}</span>
                  </button>

                  <button 
                    id="tactical-workouts"
                    onClick={() => onSelectClient('workouts', selectedClient.id)}
                    className="p-3 bg-[#101010] hover:bg-neutral-900 border border-neutral-850 rounded-xl transition-all text-center flex flex-col items-center justify-center cursor-pointer space-y-1.5 group"
                  >
                    <Dumbbell className="w-5 h-5 text-yellow-500 group-hover:scale-105 transition-transform" />
                    <span className="text-xs font-bold text-white block">{t.workouts}</span>
                    <span className="text-[9px] text-neutral-500 block">{lang === 'en' ? 'Scheduler programs' : 'برامج وتدريبات'}</span>
                  </button>

                  <button 
                    id="tactical-nutrition"
                    onClick={() => onSelectClient('nutrition', selectedClient.id)}
                    className="p-3 bg-[#101010] hover:bg-neutral-900 border border-neutral-850 rounded-xl transition-all text-center flex flex-col items-center justify-center cursor-pointer space-y-1.5 group"
                  >
                    <Apple className="w-5 h-5 text-orange-400 group-hover:scale-105 transition-transform" />
                    <span className="text-xs font-bold text-white block">{t.nutrition}</span>
                    <span className="text-[9px] text-neutral-500 block">{lang === 'en' ? 'Meal timing' : 'توقيت وتوزيع الوجبات'}</span>
                  </button>

                  <button 
                    id="tactical-progress"
                    onClick={() => onSelectClient('progress', selectedClient.id)}
                    className="p-3 bg-[#101010] hover:bg-neutral-900 border border-neutral-850 rounded-xl transition-all text-center flex flex-col items-center justify-center cursor-pointer space-y-1.5 group"
                  >
                    <Activity className="w-5 h-5 text-[#FF4D00] group-hover:scale-105 transition-transform" />
                    <span className="text-xs font-bold text-white block">{t.progress}</span>
                    <span className="text-[9px] text-neutral-500 block">{lang === 'en' ? 'Achievements' : 'سجل تطور وصور'}</span>
                  </button>
                </div>

                {/* Profile bento sections */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="bento-profile-sections">
                  
                  {/* Card 1: Sports & Training Preferences */}
                  <div className="bg-[#181818] border border-neutral-800/80 rounded-2xl p-4 space-y-3" id="bento-sports-preferences">
                    <h3 className="text-xs font-bold text-[#FF4D00] uppercase tracking-widest flex items-center gap-1.5 font-display">
                      <Sliders className="w-3.5 h-3.5" />
                      {lang === 'en' ? 'Training & Goals' : 'الأهداف والتدريب الفعلي'}
                    </h3>
                    <div className="space-y-4" id="details-goals-stats">
                      <div>
                        <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">{t.goal}</span>
                        <span className="text-sm font-semibold text-white block mt-0.5">{selectedClient.goal}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3" id="inner-training-grid">
                        <div>
                          <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">{t.experience}</span>
                          <span className="text-xs font-medium text-white block mt-0.5">{selectedClient.experience.toUpperCase()}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">{t.activity}</span>
                          <span className="text-xs font-medium text-white block mt-0.5">{selectedClient.activity.toUpperCase()}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">{t.gymAccess}</span>
                          <span className="text-xs font-medium text-white block mt-0.5">{selectedClient.gymAccess.toUpperCase()}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">{lang === 'en' ? 'Active Frequency' : 'تردد التدريب أسبوعيا'}</span>
                          <span className="text-xs font-medium text-white block mt-0.5">{selectedClient.trainingDays} {t.daysPerWeek}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">{t.equipment}</span>
                        <div className="flex flex-wrap gap-1.5 mt-1" id="equipment-badges">
                          {selectedClient.equipment.length === 0 ? (
                            <span className="text-xs text-neutral-500">No specific gears tagged</span>
                          ) : (
                            selectedClient.equipment.map((item) => (
                              <span key={item} className="text-[10px] bg-neutral-900 text-neutral-300 font-medium px-2 py-0.5 rounded">
                                {item}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Biomechanical Safety & Health (Injuries, sleep) */}
                  <div className="bg-[#181818] border border-neutral-800/80 rounded-2xl p-4 space-y-3" id="bento-health">
                    <h3 className="text-xs font-bold text-yellow-500 uppercase tracking-widest flex items-center gap-1.5 font-display">
                      <Heart className="w-3.5 h-3.5" />
                      {lang === 'en' ? 'Biomechanical Wellness' : 'الحالة الطبية والصحية'}
                    </h3>
                    <div className="space-y-4" id="details-biomechanics-stats">
                      <div>
                        <span className="text-[10px] text-red-400 uppercase tracking-wider block flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {t.injuries}
                        </span>
                        <span className="text-xs text-neutral-300 block mt-0.5">{selectedClient.injuries || (lang === 'en' ? 'No recorded active injuries.' : 'لا يوجد إصابات مسجلة.')}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-yellow-500 uppercase tracking-wider block">{t.limitations}</span>
                        <span className="text-xs text-neutral-300 block mt-0.5">{selectedClient.limitations || (lang === 'en' ? 'No movement limitations.' : 'لا توجد قيود حركة.')}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3" id="lifestyle-bento">
                        <div>
                          <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">{t.sleep}</span>
                          <span className="text-xs font-medium text-white block mt-0.5">{selectedClient.sleep.toUpperCase()}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">{t.stress}</span>
                          <span className="text-xs font-medium text-white block mt-0.5">{selectedClient.stress.toUpperCase()}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">{t.medicalNotes}</span>
                        <span className="text-xs text-neutral-300 block mt-0.5">{selectedClient.medicalNotes || (lang === 'en' ? 'Unmarked' : 'غير مسجلة')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Coach general field notes */}
                <div className="bg-[#181818] border border-neutral-800/80 rounded-2xl p-4" id="coach-general-notes">
                  <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">{t.coachNotes}</h3>
                  <p className="text-xs text-neutral-300 leading-relaxed italic">{selectedClient.notes || (lang === 'en' ? 'No coaching notes logged yet.' : 'لا يوجد أي ملاحظات كوتش خاصة مكتوبة.')}</p>
                </div>
              </>
            )}

            {activeSubTab === 'timeline' && (
              <ClientTimelineTab client={selectedClient} lang={lang} />
            )}

            {activeSubTab === 'checkins' && (
              <CheckInHistoryTab client={selectedClient} lang={lang} />
            )}

            {activeSubTab === 'goals' && (
              <ClientGoalsTab client={selectedClient} lang={lang} />
            )}

            {activeSubTab === 'notes' && (
              <CoachNotesTab client={selectedClient} lang={lang} />
            )}

            {activeSubTab === 'workouts' && (
              <ProgramVersionsTab client={selectedClient} lang={lang} />
            )}

            {activeSubTab === 'nutrition' && (
              <NutritionVersionsTab client={selectedClient} lang={lang} />
            )}

            {activeSubTab === 'ai_analysis' && (
              <AIClientAnalysisTab client={selectedClient} lang={lang} />
            )}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-center p-8 text-neutral-500" id="no-client-selected">
            <div>
              <Users className="w-12 h-12 stroke-1 text-neutral-600 mx-auto mb-2" />
              <p className="text-sm">{lang === 'en' ? 'Select a client from the finder sidebar directory.' : 'اختر مشتركاً من القائمة الجانبية للمتابعة.'}</p>
            </div>
          </div>
        )}
      </div>

      {/* 3. Form Dialog overlay — Multi-step onboard client drawer */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm" id="client-form-modal">
          <div className="bg-[#101010] border border-neutral-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" id="form-inner-content">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-850">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-[#FF4D00]" />
                {isEditing ? t.editClient : t.createClient}
              </h3>
              <button 
                id="close-form-btn"
                onClick={() => setIsFormOpen(false)}
                className="text-neutral-500 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Scrollable Body */}
            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-4" id="onboard-form">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" id="form-grid-info">
                {/* Name */}
                <div className="col-span-1 sm:col-span-2">
                  <label className="text-[10px] text-neutral-400 uppercase tracking-wider mb-1 block">{lang === 'en' ? 'Client Full Name' : 'اسم المشترك الثلاثي'}</label>
                  <input
                    id="form-client-name"
                    required
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Liam Johnson"
                    className="w-full bg-[#181818] border border-neutral-800 rounded-xl py-2 px-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-[#FF4D00]"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="text-[10px] text-neutral-400 uppercase tracking-wider mb-1 block">{t.gender}</label>
                  <select
                    id="form-client-gender"
                    value={formGender}
                    onChange={(e) => setFormGender(e.target.value as Gender)}
                    className="w-full bg-[#181818] border border-neutral-800 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-[#FF4D00]"
                  >
                    <option value="male">{t.male}</option>
                    <option value="female">{t.female}</option>
                  </select>
                </div>

                {/* Age */}
                <div>
                  <label className="text-[10px] text-neutral-400 uppercase tracking-wider mb-1 block">{t.age}</label>
                  <input
                    id="form-client-age"
                    type="number"
                    min="1"
                    max="120"
                    value={formAge}
                    onChange={(e) => setFormAge(Number(e.target.value))}
                    className="w-full bg-[#181818] border border-neutral-800 rounded-xl py-2 px-3 text-sm text-white focus:outline-none"
                  />
                </div>

                {/* Height */}
                <div>
                  <label className="text-[10px] text-neutral-400 uppercase tracking-wider mb-1 block">{t.height} (cm)</label>
                  <input
                    id="form-client-height"
                    type="number"
                    min="50"
                    max="250"
                    value={formHeight}
                    onChange={(e) => setFormHeight(Number(e.target.value))}
                    className="w-full bg-[#181818] border border-neutral-800 rounded-xl py-2 px-3 text-sm text-white focus:outline-none"
                  />
                </div>

                {/* Weight */}
                <div>
                  <label className="text-[10px] text-neutral-400 uppercase tracking-wider mb-1 block">{t.weight} (kg)</label>
                  <input
                    id="form-client-weight"
                    type="number"
                    min="20"
                    max="300"
                    value={formWeight}
                    onChange={(e) => setFormWeight(Number(e.target.value))}
                    className="w-full bg-[#181818] border border-neutral-800 rounded-xl py-2 px-3 text-sm text-white"
                  />
                </div>

                {/* Primary goal */}
                <div className="col-span-1 sm:col-span-2">
                  <label className="text-[10px] text-neutral-400 uppercase tracking-wider mb-1 block">{t.goal}</label>
                  <input
                    id="form-client-goal"
                    type="text"
                    value={formGoal}
                    onChange={(e) => setFormGoal(e.target.value)}
                    placeholder="e.g. Strength buildup & trunk stability"
                    className="w-full bg-[#181818] border border-neutral-800 rounded-xl py-2 px-3 text-sm text-white"
                  />
                </div>

                {/* Training splits, experience */}
                <div>
                  <label className="text-[10px] text-neutral-400 uppercase tracking-wider mb-1 block">{t.experience}</label>
                  <select
                    id="form-client-experience"
                    value={formExperience}
                    onChange={(e) => setFormExperience(e.target.value as ExperienceLevel)}
                    className="w-full bg-[#181818] border border-neutral-800 rounded-xl py-2 px-3 text-sm text-white"
                  >
                    <option value="beginner">{t.beginner}</option>
                    <option value="intermediate">{t.intermediate}</option>
                    <option value="advanced">{t.advanced}</option>
                  </select>
                </div>

                {/* Activity level */}
                <div>
                  <label className="text-[10px] text-neutral-400 uppercase tracking-wider mb-1 block">{t.activity}</label>
                  <select
                    id="form-client-activity"
                    value={formActivity}
                    onChange={(e) => setFormActivity(e.target.value as ActivityLevel)}
                    className="w-full bg-[#181818] border border-neutral-800 rounded-xl py-2 px-3 text-sm text-white"
                  >
                    <option value="sedentary">{t.sedentary}</option>
                    <option value="light">{t.light}</option>
                    <option value="moderate">{t.moderate}</option>
                    <option value="active">{t.active_level}</option>
                    <option value="extremely_active">{t.extremely_active}</option>
                  </select>
                </div>

                {/* Gym Access */}
                <div>
                  <label className="text-[10px] text-neutral-400 uppercase tracking-wider mb-1 block">{t.gymAccess}</label>
                  <select
                    id="form-client-gym-access"
                    value={formGymAccess}
                    onChange={(e) => setFormGymAccess(e.target.value as GymAccess)}
                    className="w-full bg-[#181818] border border-neutral-800 rounded-xl py-2 px-3 text-sm text-white"
                  >
                    <option value="gym">{t.gym}</option>
                    <option value="home">{t.home}</option>
                    <option value="hybrid">{t.hybrid}</option>
                  </select>
                </div>

                {/* Training days per week */}
                <div>
                  <label className="text-[10px] text-neutral-400 uppercase tracking-wider mb-1 block">{t.trainingDays}</label>
                  <input
                    id="form-client-days"
                    type="number"
                    min="1"
                    max="7"
                    value={formTrainingDays}
                    onChange={(e) => setFormTrainingDays(Number(e.target.value))}
                    className="w-full bg-[#181818] border border-neutral-800 rounded-xl py-2 px-3 text-sm text-white"
                  />
                </div>

                {/* Equipment Checkboxes */}
                <div className="col-span-1 sm:col-span-2 space-y-1.5">
                  <label className="text-[10px] text-neutral-400 uppercase tracking-wider m-0 block">{t.equipment}</label>
                  <div className="flex flex-wrap gap-2" id="equipment-checker-options">
                    {['Barbell', 'Dumbbell', 'Cable', 'Machine', 'Bands', 'Kettlebell'].map((item) => {
                      const active = formEquipment.includes(item);
                      return (
                        <button
                          key={item}
                          id={`equipment-checkbox-${item}`}
                          type="button"
                          onClick={() => handleEquipmentToggle(item)}
                          className={`px-3 py-1 text-xs rounded-xl font-semibold border transition-all cursor-pointer ${active ? 'bg-[#FF4D00]/10 border-[#FF4D00] text-white' : 'bg-[#181818] border-neutral-800 text-neutral-400'}`}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Injuries */}
                <div className="col-span-1 sm:col-span-2">
                  <label className="text-[10px] text-red-400 uppercase tracking-wider mb-1 block">{t.injuries}</label>
                  <input
                    id="form-client-injuries"
                    type="text"
                    value={formInjuries}
                    onChange={(e) => setFormInjuries(e.target.value)}
                    placeholder="e.g. Slight lower back strains or shoulder impingements"
                    className="w-full bg-[#181818] border border-neutral-800 rounded-xl py-2 px-3 text-sm text-white placeholder-neutral-600 focus:outline-none"
                  />
                </div>

                {/* Limitations */}
                <div>
                  <label className="text-[10px] text-neutral-400 uppercase tracking-wider mb-1 block">{t.limitations}</label>
                  <input
                    id="form-client-limitations"
                    type="text"
                    value={formLimitations}
                    onChange={(e) => setFormLimitations(e.target.value)}
                    className="w-full bg-[#181818] border border-neutral-800 rounded-xl py-2 px-3 text-sm text-white"
                  />
                </div>

                {/* Medical Notes */}
                <div>
                  <label className="text-[10px] text-neutral-400 uppercase tracking-wider mb-1 block">{t.medicalNotes}</label>
                  <input
                    id="form-client-medical"
                    type="text"
                    value={formMedicalNotes}
                    onChange={(e) => setFormMedicalNotes(e.target.value)}
                    className="w-full bg-[#181818] border border-neutral-800 rounded-xl py-2 px-3 text-sm text-white"
                  />
                </div>

                {/* Sleep Quality */}
                <div>
                  <label className="text-[10px] text-neutral-400 uppercase tracking-wider mb-1 block">{t.sleep}</label>
                  <select
                    id="form-client-sleep"
                    value={formSleep}
                    onChange={(e) => setFormSleep(e.target.value as any)}
                    className="w-full bg-[#181818] border border-neutral-800 rounded-xl py-2 px-3 text-sm text-white"
                  >
                    <option value="poor">{t.poor}</option>
                    <option value="average">{t.average}</option>
                    <option value="good">{t.good}</option>
                  </select>
                </div>

                {/* Stress levels */}
                <div>
                  <label className="text-[10px] text-neutral-400 uppercase tracking-wider mb-1 block">{t.stress}</label>
                  <select
                    id="form-client-stress"
                    value={formStress}
                    onChange={(e) => setFormStress(e.target.value as any)}
                    className="w-full bg-[#181818] border border-neutral-800 rounded-xl py-2 px-3 text-sm text-white"
                  >
                    <option value="low">{t.low}</option>
                    <option value="medium">{t.medium}</option>
                    <option value="high">{t.high}</option>
                  </select>
                </div>

                {/* Tags input */}
                <div className="col-span-1 sm:col-span-2">
                  <label className="text-[10px] text-neutral-400 uppercase tracking-wider mb-1 block">{t.tags} ({lang === 'en' ? 'Comma separated' : 'مفصولة بفاصلة'})</label>
                  <input
                    id="form-client-tags"
                    type="text"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    placeholder="e.g. Powerbuilding, PCOS, Mobility"
                    className="w-full bg-[#181818] border border-neutral-800 rounded-xl py-2 px-3 text-sm text-white focus:outline-none"
                  />
                </div>

                {/* General notes */}
                <div className="col-span-1 sm:col-span-2">
                  <label className="text-[10px] text-neutral-400 uppercase tracking-wider mb-1 block">{t.coachNotes}</label>
                  <textarea
                    id="form-client-notes"
                    rows={2}
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="w-full bg-[#181818] border border-neutral-800 rounded-xl py-2 px-3 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Form Actions Footer */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-neutral-850" id="form-actions-bar">
                <button
                  id="form-cancel-btn"
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-medium rounded-xl text-xs sm:text-sm transition-colors cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  id="form-submit-btn"
                  type="submit"
                  className="px-4 py-2 bg-[#FF4D00] hover:bg-[#E04400] text-white font-medium rounded-xl text-xs sm:text-sm transition-colors cursor-pointer"
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
