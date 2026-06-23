/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  Client, 
  InBodyRecord, 
  WorkoutPlan, 
  NutritionPlan, 
  ProgressLog, 
  TimelineEntry, 
  CoachNote, 
  WeeklyCheckIn, 
  SmartAlert, 
  ClientGoal,
  CoachProfile,
  CoachSettings
} from '../types';
import { 
  SAMPLE_CLIENTS, 
  SAMPLE_INBODY_RECORDS, 
  SAMPLE_WORKOUTS, 
  SAMPLE_NUTRITION, 
  SAMPLE_PROGRESS_LOGS 
} from '../data/mockData';
import { 
  SAMPLE_TIMELINE, 
  SAMPLE_NOTES, 
  SAMPLE_CHECKINS, 
  SAMPLE_ALERTS, 
  SAMPLE_GOALS 
} from '../data/mockDataOS';

/**
 * Interface defining the abstract Repository/Storage pattern.
 * This ensures that any data source (LocalStorage, Firestore, Cloud SQL, etc.)
 * is plug-and-play and doesn't leak storage-specific code into the main UI components.
 * 
 * All methods are asynchronous and return Promises, making transition to any
 * cloud-hosted persistent database direct and seamless.
 */
export interface IStorageAdapter {
  init(): Promise<void>;
  loadInitialState(): Promise<{
    clients: Client[];
    inbodyRecords: InBodyRecord[];
    workouts: WorkoutPlan[];
    nutrition: NutritionPlan[];
    progressLogs: ProgressLog[];
    timeline: TimelineEntry[];
    coachNotes: CoachNote[];
    weeklyCheckins: WeeklyCheckIn[];
    smartAlerts: SmartAlert[];
    clientGoals: ClientGoal[];
  }>;

  // Clients
  getClients(): Promise<Client[]>;
  saveClients(clients: Client[]): Promise<void>;
  addClient(client: Client): Promise<void>;
  updateClient(client: Client): Promise<void>;
  deleteClientCascade(clientId: string): Promise<void>;

  // InBody Records
  getInBodyRecords(): Promise<InBodyRecord[]>;
  saveInBodyRecords(records: InBodyRecord[]): Promise<void>;

  // Workouts
  getWorkouts(): Promise<WorkoutPlan[]>;
  saveWorkouts(workouts: WorkoutPlan[]): Promise<void>;

  // Nutrition
  getNutritionPlans(): Promise<NutritionPlan[]>;
  saveNutritionPlans(plans: NutritionPlan[]): Promise<void>;

  // Progress Logs
  getProgressLogs(): Promise<ProgressLog[]>;
  saveProgressLogs(logs: ProgressLog[]): Promise<void>;

  // Timeline
  getTimeline(): Promise<TimelineEntry[]>;
  saveTimeline(entries: TimelineEntry[]): Promise<void>;
  addTimelineEntry(entry: TimelineEntry): Promise<void>;

  // Coach Notes
  getCoachNotes(): Promise<CoachNote[]>;
  saveCoachNotes(notes: CoachNote[]): Promise<void>;

  // Weekly CheckIns
  getWeeklyCheckIns(): Promise<WeeklyCheckIn[]>;
  saveWeeklyCheckIns(checkins: WeeklyCheckIn[]): Promise<void>;

  // Smart Alerts
  getSmartAlerts(): Promise<SmartAlert[]>;
  saveSmartAlerts(alerts: SmartAlert[]): Promise<void>;

  // Client Goals
  getClientGoals(): Promise<ClientGoal[]>;
  saveClientGoals(goals: ClientGoal[]): Promise<void>;

  // Coach Profile & Settings
  getCoachProfile(): Promise<CoachProfile>;
  saveCoachProfile(profile: CoachProfile): Promise<void>;
  getCoachSettings(): Promise<CoachSettings>;
  saveCoachSettings(settings: CoachSettings): Promise<void>;

  // State Management & Utilities
  resetToDemoData(): Promise<void>;
  restoreBulkState(snapshotJSON: string): Promise<void>;
  clearAllState(): Promise<void>;
}

// Global Storage Keys mapping for Local Storage implementation
const KEYS = {
  CLIENTS: 'reprise_coach_clients',
  INBODY: 'reprise_coach_inbody',
  WORKOUTS: 'reprise_coach_workouts',
  NUTRITION: 'reprise_coach_nutrition',
  PROGRESS: 'reprise_coach_progress',
  SETTINGS: 'reprise_coach_settings',
  COACH: 'reprise_coach_profile',
  TIMELINE: 'reprise_coach_timeline',
  NOTES: 'reprise_coach_notes',
  CHECKINS: 'reprise_coach_checkins',
  ALERTS: 'reprise_coach_alerts',
  GOALS: 'reprise_coach_goals',
};

/**
 * Implementation of IStorageAdapter utilizing the browser's localStorage API.
 * This is the active offline storage system.
 */
export class LocalStorageAdapter implements IStorageAdapter {
  
  private getFromLocal<T>(key: string, fallback: T): T {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    try {
      return JSON.parse(item) as T;
    } catch (e) {
      console.error(`Error parsing localStorage key: ${key}`, e);
      return fallback;
    }
  }

  private saveToLocal<T>(key: string, data: T): void {
    localStorage.setItem(key, JSON.stringify(data));
  }

  async init(): Promise<void> {
    if (!localStorage.getItem(KEYS.CLIENTS)) {
      this.saveToLocal(KEYS.CLIENTS, SAMPLE_CLIENTS);
    }
    if (!localStorage.getItem(KEYS.INBODY)) {
      this.saveToLocal(KEYS.INBODY, SAMPLE_INBODY_RECORDS);
    }
    if (!localStorage.getItem(KEYS.WORKOUTS)) {
      const workoutsWithV = SAMPLE_WORKOUTS.map(w => ({
        ...w,
        version: w.version || 1,
        isActive: w.isActive !== undefined ? w.isActive : true,
        isArchived: w.isArchived !== undefined ? w.isArchived : false,
        activationDate: w.createdAt
      }));
      this.saveToLocal(KEYS.WORKOUTS, workoutsWithV);
    }
    if (!localStorage.getItem(KEYS.NUTRITION)) {
      const nutritionsWithV = SAMPLE_NUTRITION.map(n => ({
        ...n,
        version: n.version || 1,
        isActive: n.isActive !== undefined ? n.isActive : true,
        isArchived: n.isArchived !== undefined ? n.isArchived : false,
        activationDate: n.createdAt
      }));
      this.saveToLocal(KEYS.NUTRITION, nutritionsWithV);
    }
    if (!localStorage.getItem(KEYS.PROGRESS)) {
      this.saveToLocal(KEYS.PROGRESS, SAMPLE_PROGRESS_LOGS);
    }
    if (!localStorage.getItem(KEYS.TIMELINE)) {
      this.saveToLocal(KEYS.TIMELINE, SAMPLE_TIMELINE);
    }
    if (!localStorage.getItem(KEYS.NOTES)) {
      this.saveToLocal(KEYS.NOTES, SAMPLE_NOTES);
    }
    if (!localStorage.getItem(KEYS.CHECKINS)) {
      this.saveToLocal(KEYS.CHECKINS, SAMPLE_CHECKINS);
    }
    if (!localStorage.getItem(KEYS.ALERTS)) {
      this.saveToLocal(KEYS.ALERTS, SAMPLE_ALERTS);
    }
    if (!localStorage.getItem(KEYS.GOALS)) {
      this.saveToLocal(KEYS.GOALS, SAMPLE_GOALS);
    }
    if (!localStorage.getItem(KEYS.COACH)) {
      this.saveToLocal(KEYS.COACH, {
        id: "coach_master",
        name: "David Al-Khalili",
        email: "munzerm50@gmail.com",
        gymName: "RepRise Elite HQ",
        registered: true,
        subscription: "Elite"
      });
    }
    if (!localStorage.getItem(KEYS.SETTINGS)) {
      this.saveToLocal(KEYS.SETTINGS, {
        theme: "dark",
        language: "en",
        units: {
          weight: "kg",
          height: "cm"
        }
      });
    }
  }

  async loadInitialState() {
    await this.init();
    return {
      clients: await this.getClients(),
      inbodyRecords: await this.getInBodyRecords(),
      workouts: await this.getWorkouts(),
      nutrition: await this.getNutritionPlans(),
      progressLogs: await this.getProgressLogs(),
      timeline: await this.getTimeline(),
      coachNotes: await this.getCoachNotes(),
      weeklyCheckins: await this.getWeeklyCheckIns(),
      smartAlerts: await this.getSmartAlerts(),
      clientGoals: await this.getClientGoals()
    };
  }

  // Clients CRUD
  async getClients(): Promise<Client[]> {
    return this.getFromLocal<Client[]>(KEYS.CLIENTS, []);
  }

  async saveClients(clients: Client[]): Promise<void> {
    this.saveToLocal(KEYS.CLIENTS, clients);
  }

  async addClient(client: Client): Promise<void> {
    const list = await this.getClients();
    list.unshift(client);
    await this.saveClients(list);
  }

  async updateClient(client: Client): Promise<void> {
    const list = await this.getClients();
    const idx = list.findIndex(c => c.id === client.id);
    if (idx !== -1) {
      list[idx] = client;
      await this.saveClients(list);
    }
  }

  async deleteClientCascade(clientId: string): Promise<void> {
    const list = await this.getClients();
    const filtered = list.filter(c => c.id !== clientId);
    await this.saveClients(filtered);

    const inbody = await this.getInBodyRecords();
    await this.saveInBodyRecords(inbody.filter(r => r.clientId !== clientId));

    const workouts = await this.getWorkouts();
    await this.saveWorkouts(workouts.filter(w => w.clientId !== clientId));

    const nutrition = await this.getNutritionPlans();
    await this.saveNutritionPlans(nutrition.filter(n => n.clientId !== clientId));

    const progress = await this.getProgressLogs();
    await this.saveProgressLogs(progress.filter(p => p.clientId !== clientId));

    const timeline = await this.getTimeline();
    await this.saveTimeline(timeline.filter(t => t.clientId !== clientId));

    const notes = await this.getCoachNotes();
    await this.saveCoachNotes(notes.filter(n => n.clientId !== clientId));

    const checkins = await this.getWeeklyCheckIns();
    await this.saveWeeklyCheckIns(checkins.filter(c => c.clientId !== clientId));

    const alerts = await this.getSmartAlerts();
    await this.saveSmartAlerts(alerts.filter(a => a.clientId !== clientId));

    const goals = await this.getClientGoals();
    await this.saveClientGoals(goals.filter(g => g.clientId !== clientId));
  }

  // InBody Records
  async getInBodyRecords(): Promise<InBodyRecord[]> {
    return this.getFromLocal<InBodyRecord[]>(KEYS.INBODY, []);
  }

  async saveInBodyRecords(records: InBodyRecord[]): Promise<void> {
    this.saveToLocal(KEYS.INBODY, records);
  }

  // Workouts
  async getWorkouts(): Promise<WorkoutPlan[]> {
    return this.getFromLocal<WorkoutPlan[]>(KEYS.WORKOUTS, []);
  }

  async saveWorkouts(workouts: WorkoutPlan[]): Promise<void> {
    this.saveToLocal(KEYS.WORKOUTS, workouts);
  }

  // Nutrition Plans
  async getNutritionPlans(): Promise<NutritionPlan[]> {
    return this.getFromLocal<NutritionPlan[]>(KEYS.NUTRITION, []);
  }

  async saveNutritionPlans(plans: NutritionPlan[]): Promise<void> {
    this.saveToLocal(KEYS.NUTRITION, plans);
  }

  // Progress Logs
  async getProgressLogs(): Promise<ProgressLog[]> {
    return this.getFromLocal<ProgressLog[]>(KEYS.PROGRESS, []);
  }

  async saveProgressLogs(logs: ProgressLog[]): Promise<void> {
    this.saveToLocal(KEYS.PROGRESS, logs);
  }

  // Timeline
  async getTimeline(): Promise<TimelineEntry[]> {
    return this.getFromLocal<TimelineEntry[]>(KEYS.TIMELINE, []);
  }

  async saveTimeline(entries: TimelineEntry[]): Promise<void> {
    this.saveToLocal(KEYS.TIMELINE, entries);
  }

  async addTimelineEntry(entry: TimelineEntry): Promise<void> {
    const list = await this.getTimeline();
    list.unshift(entry);
    await this.saveTimeline(list);
  }

  // Coach Notes
  async getCoachNotes(): Promise<CoachNote[]> {
    return this.getFromLocal<CoachNote[]>(KEYS.NOTES, []);
  }

  async saveCoachNotes(notes: CoachNote[]): Promise<void> {
    this.saveToLocal(KEYS.NOTES, notes);
  }

  // Weekly CheckIns
  async getWeeklyCheckIns(): Promise<WeeklyCheckIn[]> {
    return this.getFromLocal<WeeklyCheckIn[]>(KEYS.CHECKINS, []);
  }

  async saveWeeklyCheckIns(checkins: WeeklyCheckIn[]): Promise<void> {
    this.saveToLocal(KEYS.CHECKINS, checkins);
  }

  // Smart Alerts
  async getSmartAlerts(): Promise<SmartAlert[]> {
    return this.getFromLocal<SmartAlert[]>(KEYS.ALERTS, []);
  }

  async saveSmartAlerts(alerts: SmartAlert[]): Promise<void> {
    this.saveToLocal(KEYS.ALERTS, alerts);
  }

  // Client Goals
  async getClientGoals(): Promise<ClientGoal[]> {
    return this.getFromLocal<ClientGoal[]>(KEYS.GOALS, []);
  }

  async saveClientGoals(goals: ClientGoal[]): Promise<void> {
    this.saveToLocal(KEYS.GOALS, goals);
  }

  // Coach Profile & Settings
  async getCoachProfile(): Promise<CoachProfile> {
    return this.getFromLocal<CoachProfile>(KEYS.COACH, {
      id: "coach_master",
      name: "David Al-Khalili",
      email: "munzerm50@gmail.com",
      gymName: "RepRise Elite HQ",
      registered: true,
      subscription: "Elite"
    });
  }

  async saveCoachProfile(profile: CoachProfile): Promise<void> {
    this.saveToLocal(KEYS.COACH, profile);
  }

  async getCoachSettings(): Promise<CoachSettings> {
    return this.getFromLocal<CoachSettings>(KEYS.SETTINGS, {
      theme: "dark",
      language: "en",
      units: {
        weight: "kg",
        height: "cm"
      }
    });
  }

  async saveCoachSettings(settings: CoachSettings): Promise<void> {
    this.saveToLocal(KEYS.SETTINGS, settings);
  }

  // Portability & Helpers
  async resetToDemoData(): Promise<void> {
    this.saveToLocal(KEYS.CLIENTS, SAMPLE_CLIENTS);
    this.saveToLocal(KEYS.INBODY, SAMPLE_INBODY_RECORDS);
    this.saveToLocal(KEYS.WORKOUTS, SAMPLE_WORKOUTS.map(w => ({ ...w, version: w.version || 1, isActive: true })));
    this.saveToLocal(KEYS.NUTRITION, SAMPLE_NUTRITION.map(n => ({ ...n, version: n.version || 1, isActive: true })));
    this.saveToLocal(KEYS.PROGRESS, SAMPLE_PROGRESS_LOGS);
    this.saveToLocal(KEYS.TIMELINE, SAMPLE_TIMELINE);
    this.saveToLocal(KEYS.NOTES, SAMPLE_NOTES);
    this.saveToLocal(KEYS.CHECKINS, SAMPLE_CHECKINS);
    this.saveToLocal(KEYS.ALERTS, SAMPLE_ALERTS);
    this.saveToLocal(KEYS.GOALS, SAMPLE_GOALS);
  }

  async restoreBulkState(snapshotJSON: string): Promise<void> {
    try {
      const data = JSON.parse(snapshotJSON);
      Object.keys(data).forEach(key => {
        if (data[key]) {
          let targetKey = key;
          if (key === 'reprise_clients') targetKey = KEYS.CLIENTS;
          if (key === 'reprise_inbody') targetKey = KEYS.INBODY;
          if (key === 'reprise_workouts') targetKey = KEYS.WORKOUTS;
          if (key === 'reprise_nutrition') targetKey = KEYS.NUTRITION;
          if (key === 'reprise_progressLogs') targetKey = KEYS.PROGRESS;
          if (key === 'reprise_timeline') targetKey = KEYS.TIMELINE;
          if (key === 'reprise_notes') targetKey = KEYS.NOTES;
          if (key === 'reprise_checkins') targetKey = KEYS.CHECKINS;
          if (key === 'reprise_alerts') targetKey = KEYS.ALERTS;
          if (key === 'reprise_goals') targetKey = KEYS.GOALS;
          if (key === 'reprise_settings') targetKey = KEYS.SETTINGS;
          if (key === 'reprise_coach_profile') targetKey = KEYS.COACH;
          
          localStorage.setItem(targetKey, typeof data[key] === 'string' ? data[key] : JSON.stringify(data[key]));
        }
      });
    } catch (e) {
      console.error("Failed to parse file payload", e);
      throw e;
    }
  }

  async clearAllState(): Promise<void> {
    localStorage.clear();
  }
}

/**
 * Placeholder skeleton for a future Google Cloud Firestore Adapter.
 * Integrates error handling patterns defined in `firebase-integration` guidelines.
 */
export class FirestoreAdapter implements IStorageAdapter {
  
  // Here, the Firestore database dependencies would be initialized
  // e.g.: private db = getFirestore();
  
  async init(): Promise<void> {
    // Perform any Firestore connection tests or check if client is online
    console.log("Firestore Adapter Initializing... (Connected to cloud database)");
  }

  async loadInitialState() {
    return {
      clients: await this.getClients(),
      inbodyRecords: await this.getInBodyRecords(),
      workouts: await this.getWorkouts(),
      nutrition: await this.getNutritionPlans(),
      progressLogs: await this.getProgressLogs(),
      timeline: await this.getTimeline(),
      coachNotes: await this.getCoachNotes(),
      weeklyCheckins: await this.getWeeklyCheckIns(),
      smartAlerts: await this.getSmartAlerts(),
      clientGoals: await this.getClientGoals()
    };
  }

  // Below are placeholder methods demonstrating Firestore's SDK syntax logic

  async getClients(): Promise<Client[]> {
    // Placeholder Implementation leveraging custom error handler wrapper:
    // try {
    //   const q = query(collection(this.db, 'clients'), orderBy('createdAt', 'desc'));
    //   const snapshot = await getDocs(q);
    //   return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
    // } catch (e) {
    //   handleFirestoreError(e, 'get', 'clients');
    //   throw e;
    // }
    console.warn("FirestoreAdapter.getClients invoked. Returning empty placeholder.");
    return [];
  }

  async saveClients(clients: Client[]): Promise<void> {
    // In Firestore, documents are saved individually. 
    // This helper would write a Firestore batch write or multiple setDoc operations.
    console.log("FirestoreAdapter.saveClients invoked as placeholder.");
  }

  async addClient(client: Client): Promise<void> {
    // await setDoc(doc(this.db, 'clients', client.id), client);
    console.log("FirestoreAdapter.addClient placeholder called for ID:", client.id);
  }

  async updateClient(client: Client): Promise<void> {
    // await updateDoc(doc(this.db, 'clients', client.id), client);
    console.log("FirestoreAdapter.updateClient placeholder called for ID:", client.id);
  }

  async deleteClientCascade(clientId: string): Promise<void> {
    // Trigger transactions or multiple deleteDoc calls to remove nested subcollections safely.
    console.log("FirestoreAdapter.deleteClientCascade placeholder for:", clientId);
  }

  async getInBodyRecords(): Promise<InBodyRecord[]> { return []; }
  async saveInBodyRecords(records: InBodyRecord[]): Promise<void> {}

  async getWorkouts(): Promise<WorkoutPlan[]> { return []; }
  async saveWorkouts(workouts: WorkoutPlan[]): Promise<void> {}

  async getNutritionPlans(): Promise<NutritionPlan[]> { return []; }
  async saveNutritionPlans(plans: NutritionPlan[]): Promise<void> {}

  async getProgressLogs(): Promise<ProgressLog[]> { return []; }
  async saveProgressLogs(logs: ProgressLog[]): Promise<void> {}

  async getTimeline(): Promise<TimelineEntry[]> { return []; }
  async saveTimeline(entries: TimelineEntry[]): Promise<void> {}
  async addTimelineEntry(entry: TimelineEntry): Promise<void> {}

  async getCoachNotes(): Promise<CoachNote[]> { return []; }
  async saveCoachNotes(notes: CoachNote[]): Promise<void> {}

  async getWeeklyCheckIns(): Promise<WeeklyCheckIn[]> { return []; }
  async saveWeeklyCheckIns(checkins: WeeklyCheckIn[]): Promise<void> {}

  async getSmartAlerts(): Promise<SmartAlert[]> { return []; }
  async saveSmartAlerts(alerts: SmartAlert[]): Promise<void> {}

  async getClientGoals(): Promise<ClientGoal[]> { return []; }
  async saveClientGoals(goals: ClientGoal[]): Promise<void> {}

  async getCoachProfile(): Promise<CoachProfile> {
    return {
      id: "coach_master",
      name: "David Al-Khalili",
      email: "munzerm50@gmail.com",
      gymName: "RepRise Elite HQ",
      registered: true,
      subscription: "Elite"
    };
  }
  async saveCoachProfile(profile: CoachProfile): Promise<void> {}

  async getCoachSettings(): Promise<CoachSettings> {
    return {
      theme: "dark",
      language: "en",
      units: { weight: "kg", height: "cm" }
    };
  }
  async saveCoachSettings(settings: CoachSettings): Promise<void> {}

  async resetToDemoData(): Promise<void> {}
  async restoreBulkState(snapshotJSON: string): Promise<void> {}
  async clearAllState(): Promise<void> {}
}

// Current Active Adapter instances initialization
const activeAdapterType: 'local' | 'firestore' = 'local';

export const storage: IStorageAdapter = (activeAdapterType as string) === 'firestore' 
  ? new FirestoreAdapter() 
  : new LocalStorageAdapter();
