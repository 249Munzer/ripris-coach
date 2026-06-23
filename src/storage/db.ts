/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Client, InBodyRecord, WorkoutPlan, NutritionPlan, ProgressLog, TimelineEntry, CoachNote, WeeklyCheckIn, DailyCheckIn, SmartAlert, ClientGoal } from '../types';
import { SAMPLE_CLIENTS, SAMPLE_INBODY_RECORDS, SAMPLE_WORKOUTS, SAMPLE_NUTRITION, SAMPLE_PROGRESS_LOGS } from '../data/mockData';
import { SAMPLE_TIMELINE, SAMPLE_NOTES, SAMPLE_CHECKINS, SAMPLE_ALERTS, SAMPLE_GOALS } from '../data/mockDataOS';

import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  deleteDoc, 
  collection, 
  getDocs 
} from 'firebase/firestore';
import { db, auth } from './firebase';

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
  DAILY_CHECKINS: 'reprise_coach_daily_checkins',
  ALERTS: 'reprise_coach_alerts',
  GOALS: 'reprise_coach_goals',
};

export const initDatabase = () => {
  if (!localStorage.getItem(KEYS.CLIENTS)) {
    localStorage.setItem(KEYS.CLIENTS, JSON.stringify([]));
  }
  if (!localStorage.getItem(KEYS.INBODY)) {
    localStorage.setItem(KEYS.INBODY, JSON.stringify([]));
  }
  if (!localStorage.getItem(KEYS.WORKOUTS)) {
    localStorage.setItem(KEYS.WORKOUTS, JSON.stringify([]));
  }
  if (!localStorage.getItem(KEYS.NUTRITION)) {
    localStorage.setItem(KEYS.NUTRITION, JSON.stringify([]));
  }
  if (!localStorage.getItem(KEYS.PROGRESS)) {
    localStorage.setItem(KEYS.PROGRESS, JSON.stringify([]));
  }
  if (!localStorage.getItem(KEYS.TIMELINE)) {
    localStorage.setItem(KEYS.TIMELINE, JSON.stringify([]));
  }
  if (!localStorage.getItem(KEYS.NOTES)) {
    localStorage.setItem(KEYS.NOTES, JSON.stringify([]));
  }
  if (!localStorage.getItem(KEYS.CHECKINS)) {
    localStorage.setItem(KEYS.CHECKINS, JSON.stringify([]));
  }
  if (!localStorage.getItem(KEYS.DAILY_CHECKINS)) {
    localStorage.setItem(KEYS.DAILY_CHECKINS, JSON.stringify([]));
  }
  if (!localStorage.getItem(KEYS.ALERTS)) {
    localStorage.setItem(KEYS.ALERTS, JSON.stringify([]));
  }
  if (!localStorage.getItem(KEYS.GOALS)) {
    localStorage.setItem(KEYS.GOALS, JSON.stringify([]));
  }
  if (!localStorage.getItem(KEYS.SETTINGS)) {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify({
      theme: "dark",
      language: "en",
      units: {
        weight: "kg",
        height: "cm"
      }
    }));
  }
};

export const initDemoDatabase = () => {
  localStorage.setItem(KEYS.CLIENTS, JSON.stringify(SAMPLE_CLIENTS));
  localStorage.setItem(KEYS.INBODY, JSON.stringify(SAMPLE_INBODY_RECORDS));
  
  const workoutsWithV = SAMPLE_WORKOUTS.map(w => ({
    ...w,
    version: w.version || 1,
    isActive: w.isActive !== undefined ? w.isActive : true,
    isArchived: w.isArchived !== undefined ? w.isArchived : false,
    activationDate: w.createdAt
  }));
  localStorage.setItem(KEYS.WORKOUTS, JSON.stringify(workoutsWithV));

  const nutritionsWithV = SAMPLE_NUTRITION.map(n => ({
    ...n,
    version: n.version || 1,
    isActive: n.isActive !== undefined ? n.isActive : true,
    isArchived: n.isArchived !== undefined ? n.isArchived : false,
    activationDate: n.createdAt
  }));
  localStorage.setItem(KEYS.NUTRITION, JSON.stringify(nutritionsWithV));

  localStorage.setItem(KEYS.PROGRESS, JSON.stringify(SAMPLE_PROGRESS_LOGS));
  localStorage.setItem(KEYS.TIMELINE, JSON.stringify(SAMPLE_TIMELINE));
  localStorage.setItem(KEYS.NOTES, JSON.stringify(SAMPLE_NOTES));
  localStorage.setItem(KEYS.CHECKINS, JSON.stringify(SAMPLE_CHECKINS));
  localStorage.setItem(KEYS.ALERTS, JSON.stringify(SAMPLE_ALERTS));
  localStorage.setItem(KEYS.GOALS, JSON.stringify(SAMPLE_GOALS));
  
  localStorage.setItem(KEYS.COACH, JSON.stringify({
    id: "coach_master",
    name: "David Al-Khalili",
    email: "munzerm50@gmail.com",
    gymName: "RepRise Elite HQ",
    registered: true,
    subscription: "Elite"
  }));
};

// Low-level helper functions for quick Local Storage access
export const getFromStorage = <T>(key: string, fallback: T): T => {
  const item = localStorage.getItem(key);
  if (!item) return fallback;
  try {
    return JSON.parse(item) as T;
  } catch (e) {
    return fallback;
  }
};

export const saveToStorage = <T>(key: string, data: T): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Getting active authenticated configuration IDs
export const getActiveCoachId = (): string => {
  const profile = localStorage.getItem(KEYS.COACH);
  if (profile) {
    try {
      const parsed = JSON.parse(profile);
      return parsed.id || 'coach_master';
    } catch (e) {
      return 'coach_master';
    }
  }
  return 'coach_master';
};

// ==========================================
// BACKGROUND CLOUD SYNCHRONIZATION HELPERS
// ==========================================

export const syncClientToCloud = async (client: Client) => {
  if (!db) return;
  const coachId = getActiveCoachId();
  try {
    await setDoc(doc(db, `coaches/${coachId}/clients`, client.id), client);
  } catch (e) {
    console.warn("Could not sync client to Firestore:", e);
  }
};

export const deleteClientFromCloud = async (clientId: string) => {
  if (!db) return;
  const coachId = getActiveCoachId();
  try {
    await deleteDoc(doc(db, `coaches/${coachId}/clients`, clientId));
  } catch (e) {
    console.warn("Could not delete client from Firestore:", e);
  }
};

export const syncInBodyRecordToCloud = async (record: InBodyRecord) => {
  if (!db) return;
  const coachId = getActiveCoachId();
  try {
    await setDoc(doc(db, `coaches/${coachId}/clients/${record.clientId}/inbodyRecords`, record.id), record);
  } catch (e) {
    console.warn("Could not sync InBody record to Firestore:", e);
  }
};

export const syncWorkoutToCloud = async (workout: WorkoutPlan) => {
  if (!db) return;
  const coachId = getActiveCoachId();
  try {
    await setDoc(doc(db, `coaches/${coachId}/clients/${workout.clientId}/workoutPlans`, workout.id), workout);
  } catch (e) {
    console.warn("Could not sync workout plan to Firestore:", e);
  }
};

export const syncNutritionToCloud = async (nutrition: NutritionPlan) => {
  if (!db) return;
  const coachId = getActiveCoachId();
  try {
    await setDoc(doc(db, `coaches/${coachId}/clients/${nutrition.clientId}/nutritionPlans`, nutrition.id), nutrition);
  } catch (e) {
    console.warn("Could not sync nutrition plan to Firestore:", e);
  }
};

export const syncProgressLogToCloud = async (log: ProgressLog) => {
  if (!db) return;
  const coachId = getActiveCoachId();
  try {
    await setDoc(doc(db, `coaches/${coachId}/clients/${log.clientId}/progressLogs`, log.id), log);
  } catch (e) {
    console.warn("Could not sync progress log to Firestore:", e);
  }
};

export const syncTimelineEntryToCloud = async (entry: TimelineEntry) => {
  if (!db || !entry.clientId) return;
  const coachId = getActiveCoachId();
  try {
    await setDoc(doc(db, `coaches/${coachId}/clients/${entry.clientId}/timelineEntries`, entry.id), entry);
  } catch (e) {
    console.warn("Could not sync timeline entry to Firestore:", e);
  }
};

export const syncCoachNoteToCloud = async (note: CoachNote) => {
  if (!db) return;
  const coachId = getActiveCoachId();
  try {
    await setDoc(doc(db, `coaches/${coachId}/clients/${note.clientId}/coachNotes`, note.id), note);
  } catch (e) {
    console.warn("Could not sync coach note to Firestore:", e);
  }
};

export const syncWeeklyCheckInToCloud = async (checkin: WeeklyCheckIn) => {
  if (!db) return;
  const coachId = getActiveCoachId();
  try {
    await setDoc(doc(db, `coaches/${coachId}/clients/${checkin.clientId}/weeklyCheckins`, checkin.id), checkin);
  } catch (e) {
    console.warn("Could not sync check-in to Firestore:", e);
  }
};

export const syncSmartAlertToCloud = async (alert: SmartAlert) => {
  if (!db) return;
  const coachId = getActiveCoachId();
  try {
    await setDoc(doc(db, `coaches/${coachId}/clients/${alert.clientId}/smartAlerts`, alert.id), alert);
  } catch (e) {
    console.warn("Could not sync alert to Firestore:", e);
  }
};

export const syncClientGoalToCloud = async (goal: ClientGoal) => {
  if (!db) return;
  const coachId = getActiveCoachId();
  try {
    await setDoc(doc(db, `coaches/${coachId}/clients/${goal.clientId}/clientGoals`, goal.id), goal);
  } catch (e) {
    console.warn("Could not sync goal to Firestore:", e);
  }
};

// Bulk synchronization helper called on Registration to push samples
export const syncAllLocalToCloud = async (coachId: string) => {
  if (!db || !auth) return;
  if (!auth.currentUser) {
    console.warn("Skipping Cloud upload: No authenticated Firebase user session active.");
    return;
  }
  if (coachId === 'coach_admin_local' || coachId === 'coach_master') {
    console.warn("Skipping Cloud upload: Operating in local offline fallback sandbox mode.");
    return;
  }

  try {
    const clients = getClients();
    const inbody = getInBodyRecords();
    const workouts = getWorkouts();
    const nutrition = getNutritionPlans();
    const progress = getProgressLogs();
    const timeline = getTimeline();
    const notes = getCoachNotes();
    const checkins = getWeeklyCheckIns();
    const dailyCheckins = getDailyCheckIns();
    const alerts = getSmartAlerts();
    const goals = getClientGoals();

    for (const client of clients) {
      await setDoc(doc(db, `coaches/${coachId}/clients`, client.id), client);
    }
    for (const item of inbody) {
      await setDoc(doc(db, `coaches/${coachId}/clients/${item.clientId}/inbodyRecords`, item.id), item);
    }
    for (const item of workouts) {
      await setDoc(doc(db, `coaches/${coachId}/clients/${item.clientId}/workoutPlans`, item.id), item);
    }
    for (const item of nutrition) {
      await setDoc(doc(db, `coaches/${coachId}/clients/${item.clientId}/nutritionPlans`, item.id), item);
    }
    for (const item of progress) {
      await setDoc(doc(db, `coaches/${coachId}/clients/${item.clientId}/progressLogs`, item.id), item);
    }
    for (const item of timeline) {
      if (item.clientId) {
        await setDoc(doc(db, `coaches/${coachId}/clients/${item.clientId}/timelineEntries`, item.id), item);
      }
    }
    for (const item of notes) {
      await setDoc(doc(db, `coaches/${coachId}/clients/${item.clientId}/coachNotes`, item.id), item);
    }
    for (const item of checkins) {
      await setDoc(doc(db, `coaches/${coachId}/clients/${item.clientId}/weeklyCheckins`, item.id), item);
    }
    for (const item of dailyCheckins) {
      if (item.clientId) {
        await setDoc(doc(db, `coaches/${coachId}/clients/${item.clientId}/dailyCheckins`, item.id), item);
      }
    }
    for (const item of alerts) {
      await setDoc(doc(db, `coaches/${coachId}/clients/${item.clientId}/smartAlerts`, item.id), item);
    }
    for (const item of goals) {
      await setDoc(doc(db, `coaches/${coachId}/clients/${item.clientId}/clientGoals`, item.id), item);
    }
    console.log("Bulk upload of local database cache completed.");
  } catch (err) {
    console.error("Error bulk uploading local data to Cloud:", err);
  }
};

// Pull down and sync all Firestore data to LocalStorage (e.g., when logging in on a new device)
export const syncCloudToLocal = async (coachId: string) => {
  if (!db || !auth) return;
  if (!auth.currentUser) {
    console.warn("Skipping Cloud restore: No authenticated Firebase user session active.");
    return;
  }
  if (coachId === 'coach_admin_local' || coachId === 'coach_master') {
    console.warn("Skipping Cloud restore: Operating in local offline fallback sandbox mode.");
    return;
  }

  try {
    const clientsSnap = await getDocs(collection(db, `coaches/${coachId}/clients`));
    const clients: Client[] = [];
    clientsSnap.forEach(doc => {
      clients.push(doc.data() as Client);
    });

    const inbody: InBodyRecord[] = [];
    const workouts: WorkoutPlan[] = [];
    const nutrition: NutritionPlan[] = [];
    const progress: ProgressLog[] = [];
    const timeline: TimelineEntry[] = [];
    const notes: CoachNote[] = [];
    const checkins: WeeklyCheckIn[] = [];
    const dailyCheckins: DailyCheckIn[] = [];
    const alerts: SmartAlert[] = [];
    const goals: ClientGoal[] = [];

    for (const client of clients) {
      const ibSnap = await getDocs(collection(db, `coaches/${coachId}/clients/${client.id}/inbodyRecords`));
      ibSnap.forEach(d => inbody.push(d.data() as InBodyRecord));

      const wkSnap = await getDocs(collection(db, `coaches/${coachId}/clients/${client.id}/workoutPlans`));
      wkSnap.forEach(d => workouts.push(d.data() as WorkoutPlan));

      const nuSnap = await getDocs(collection(db, `coaches/${coachId}/clients/${client.id}/nutritionPlans`));
      nuSnap.forEach(d => nutrition.push(d.data() as NutritionPlan));

      const prSnap = await getDocs(collection(db, `coaches/${coachId}/clients/${client.id}/progressLogs`));
      prSnap.forEach(d => progress.push(d.data() as ProgressLog));

      const tlSnap = await getDocs(collection(db, `coaches/${coachId}/clients/${client.id}/timelineEntries`));
      tlSnap.forEach(d => timeline.push(d.data() as TimelineEntry));

      const ntSnap = await getDocs(collection(db, `coaches/${coachId}/clients/${client.id}/coachNotes`));
      ntSnap.forEach(d => notes.push(d.data() as CoachNote));

      const chSnap = await getDocs(collection(db, `coaches/${coachId}/clients/${client.id}/weeklyCheckins`));
      chSnap.forEach(d => checkins.push(d.data() as WeeklyCheckIn));

      const dcSnap = await getDocs(collection(db, `coaches/${coachId}/clients/${client.id}/dailyCheckins`));
      dcSnap.forEach(d => dailyCheckins.push(d.data() as DailyCheckIn));

      const alSnap = await getDocs(collection(db, `coaches/${coachId}/clients/${client.id}/smartAlerts`));
      alSnap.forEach(d => alerts.push(d.data() as SmartAlert));

      const glSnap = await getDocs(collection(db, `coaches/${coachId}/clients/${client.id}/clientGoals`));
      glSnap.forEach(d => goals.push(d.data() as ClientGoal));
    }

    saveToStorage(KEYS.CLIENTS, clients);
    saveToStorage(KEYS.INBODY, inbody);
    saveToStorage(KEYS.WORKOUTS, workouts);
    saveToStorage(KEYS.NUTRITION, nutrition);
    saveToStorage(KEYS.PROGRESS, progress);
    saveToStorage(KEYS.TIMELINE, timeline);
    saveToStorage(KEYS.NOTES, notes);
    saveToStorage(KEYS.CHECKINS, checkins);
    saveToStorage(KEYS.DAILY_CHECKINS, dailyCheckins);
    saveToStorage(KEYS.ALERTS, alerts);
    saveToStorage(KEYS.GOALS, goals);

    console.log("Restore of workspace from Firebase Firestore complete!");
  } catch (err) {
    console.error("Error drawing down Cloud database state:", err);
  }
};

// ==========================================
// FIREBASE AUTHENTICATION API
// ==========================================

export const signUpCoachInFirebase = async (email: string, password: string, name: string, gymName: string, subscription: string) => {
  const cleanEmail = email.trim().toLowerCase();
  if (!auth || !db) {
    // If Firebase isn't configured, register in local memory
    const existingStr = localStorage.getItem('reprise_coach_users');
    const existing = existingStr ? JSON.parse(existingStr) : [];
    const newCoach = { id: `coach_${Date.now()}`, name, email: cleanEmail, password, gymName, subscription };
    existing.push(newCoach);
    localStorage.setItem('reprise_coach_users', JSON.stringify(existing));
    return newCoach;
  }

  try {
    const res = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    const coachId = res.user.uid;
    const profile = {
      id: coachId,
      name,
      email: cleanEmail,
      gymName,
      registered: true,
      subscription
    };

    // Persist directly to Firestore
    await setDoc(doc(db, 'coaches', coachId), profile);
    saveCoachProfile(profile);

    // Push existing samples so their new workspace has immediate demo context
    await syncAllLocalToCloud(coachId);

    return profile;
  } catch (err: any) {
    console.warn("Firebase Auth SignUp failed, falling back to local signup mode:", err);
    const existingStr = localStorage.getItem('reprise_coach_users');
    const existing = existingStr ? JSON.parse(existingStr) : [];
    const newCoach = { 
      id: `coach_${Date.now()}`, 
      name, 
      email: cleanEmail, 
      password, 
      gymName, 
      subscription,
      localFallback: true 
    };
    existing.push(newCoach);
    localStorage.setItem('reprise_coach_users', JSON.stringify(existing));
    saveCoachProfile(newCoach);
    return newCoach;
  }
};

export const signInCoachInFirebase = async (email: string, password: string, lang: 'en' | 'ar' = 'en') => {
  const cleanEmail = email.trim().toLowerCase();

  // Master resilient fallback so Munzer is never locked out of the workspace
  if (cleanEmail === 'munzerm50@gmail.com') {
    // Try background Firebase Auth signin if possible to fetch cloud records
    if (auth && db) {
      try {
        const res = await signInWithEmailAndPassword(auth, cleanEmail, password);
        const actualUid = res.user.uid;
        
        // Return a profile mapped with their real UID so future manual syncing and cloud actions are perfectly authorized!
        const munzerProfile = {
          id: actualUid,
          name: 'Munzer',
          email: cleanEmail,
          gymName: 'RepRise Premium HQ',
          registered: true,
          subscription: 'Elite'
        };
        saveCoachProfile(munzerProfile);
        
        // Successfully pull and synchronize all custom records with the correct UID permission!
        await syncCloudToLocal(actualUid);
        return munzerProfile;
      } catch (err) {
        console.warn("Resilient background firebase auth sync bypassed. Proceeding in offline database mode.", err);
      }
    }

    const defaultAdmin = {
      id: 'coach_admin_local',
      name: 'Munzer',
      email: cleanEmail,
      gymName: 'RepRise Premium HQ',
      registered: true,
      subscription: 'Elite',
      localFallback: true
    };
    saveCoachProfile(defaultAdmin);

    // Keep their custom credentials in local registration cache for persistence
    const existingStr = localStorage.getItem('reprise_coach_users');
    const existing = existingStr ? JSON.parse(existingStr) : [];
    if (!existing.some((u: any) => u.email.toLowerCase() === cleanEmail)) {
      existing.push({ ...defaultAdmin, password });
      localStorage.setItem('reprise_coach_users', JSON.stringify(existing));
    }
    return defaultAdmin;
  }

  if (!auth || !db) {
    // If Firebase isn't initialized, login from local memory
    const existingStr = localStorage.getItem('reprise_coach_users');
    const existing = existingStr ? JSON.parse(existingStr) : [];
    const found = existing.find((c: any) => c.email.toLowerCase() === cleanEmail && c.password === password);
    if (found) {
      return found;
    }
    if (lang === 'ar') {
      throw new Error("البريد الإلكتروني أو كلمة المرور غير صحيحة. يرجى التأكد من تسجيل حساب المدرب الجديد أولاً.");
    }
    throw new Error("Invalid email or password. Please make sure you have registered your coach account first.");
  }

  try {
    const res = await signInWithEmailAndPassword(auth, cleanEmail, password);
    const coachId = res.user.uid;

    const profileDoc = await getDoc(doc(db, 'coaches', coachId));
    if (profileDoc.exists()) {
      const profile = profileDoc.data();
      saveCoachProfile(profile);
      // Draw database records down to local storage to sync across devices dynamically!
      await syncCloudToLocal(coachId);
      return profile;
    } else {
      const profile = {
        id: coachId,
        name: cleanEmail.split('@')[0],
        email: cleanEmail,
        gymName: "RepRise Premium HQ",
        registered: true,
        subscription: "Elite"
      };
      await setDoc(doc(db, 'coaches', coachId), profile);
      saveCoachProfile(profile);
      return profile;
    }
  } catch (err: any) {
    console.warn("Firebase Auth SignIn failed, falling back to local check:", err);
    
    // Check local database cache
    const existingStr = localStorage.getItem('reprise_coach_users');
    const existing = existingStr ? JSON.parse(existingStr) : [];
    const found = existing.find((c: any) => c.email.toLowerCase() === cleanEmail && c.password === password);
    if (found) {
      const profile = { ...found, localFallback: true };
      saveCoachProfile(profile);
      return profile;
    }

    // If user is not found in either Firebase or local cached users, throw a precise registration/mismatch error.
    if (lang === 'ar') {
      throw new Error("البريد الإلكتروني أو كلمة المرور غير صحيحة. يرجى التأكد من تسجيل حساب المدرب الجديد أولاً.");
    }
    throw new Error("Invalid email or password. Please make sure you have registered your coach account first.");
  }
};

export const signInWithGoogleInFirebase = async () => {
  if (!auth || !db) {
    throw new Error('Firebase integration is not fully configured.');
  }

  try {
    const provider = new GoogleAuthProvider();
    const res = await signInWithPopup(auth, provider);
    const coachId = res.user.uid;
    const email = res.user.email || '';

    const profileDoc = await getDoc(doc(db, 'coaches', coachId));
    if (profileDoc.exists()) {
      const profile = profileDoc.data();
      saveCoachProfile(profile);
      await syncCloudToLocal(coachId);
      return profile;
    } else {
      const profile = {
        id: coachId,
        name: res.user.displayName || email.split('@')[0] || 'Coach',
        email,
        gymName: 'RepRise Premium HQ',
        registered: true,
        subscription: 'Elite'
      };
      await setDoc(doc(db, 'coaches', coachId), profile);
      saveCoachProfile(profile);
      return profile;
    }
  } catch (err: any) {
    console.warn("Google SignIn failed, falling back to local signin simulation:", err);
    const localGoogleUser = {
      id: 'coach_google_local',
      name: 'Munzer (Google Session)',
      email: 'munzerm50@gmail.com',
      gymName: 'RepRise Premium HQ',
      registered: true,
      subscription: 'Elite',
      localFallback: true
    };
    saveCoachProfile(localGoogleUser);
    return localGoogleUser;
  }
};

export const signOutCoachInFirebase = async () => {
  if (auth) {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.error(e);
    }
  }
  // Soft logout to preserve registrations, settings, and other local unsynced coach operations!
  localStorage.removeItem(KEYS.COACH);
};

// ==========================================
// CORE CRUD IMPLEMENTATIONS
// ==========================================

// Client CRUD
export const getClients = (): Client[] => getFromStorage<Client[]>(KEYS.CLIENTS, []);
export const saveClients = (clients: Client[]) => {
  saveToStorage(KEYS.CLIENTS, clients);
};

export const addClient = (client: Client) => {
  const list = getClients();
  list.unshift(client);
  saveToStorage(KEYS.CLIENTS, list);
};

export const updateClient = (client: Client) => {
  const list = getClients();
  const idx = list.findIndex(c => c.id === client.id);
  if (idx !== -1) {
    list[idx] = client;
    saveToStorage(KEYS.CLIENTS, list);
  }
};

// InBody Records CRUD
export const getInBodyRecords = (): InBodyRecord[] => getFromStorage<InBodyRecord[]>(KEYS.INBODY, []);
export const saveInBodyRecords = (records: InBodyRecord[]) => {
  saveToStorage(KEYS.INBODY, records);
};

// Workouts CRUD
export const getWorkouts = (): WorkoutPlan[] => getFromStorage<WorkoutPlan[]>(KEYS.WORKOUTS, []);
export const saveWorkouts = (workouts: WorkoutPlan[]) => {
  saveToStorage(KEYS.WORKOUTS, workouts);
};

// Nutrition CRUD
export const getNutritionPlans = (): NutritionPlan[] => getFromStorage<NutritionPlan[]>(KEYS.NUTRITION, []);
export const saveNutritionPlans = (plans: NutritionPlan[]) => {
  saveToStorage(KEYS.NUTRITION, plans);
};

// Progress Logs CRUD
export const getProgressLogs = (): ProgressLog[] => getFromStorage<ProgressLog[]>(KEYS.PROGRESS, []);
export const saveProgressLogs = (logs: ProgressLog[]) => {
  saveToStorage(KEYS.PROGRESS, logs);
};

// Timeline CRUD
export const getTimeline = (): TimelineEntry[] => getFromStorage<TimelineEntry[]>(KEYS.TIMELINE, []);
export const saveTimeline = (entries: TimelineEntry[]) => {
  saveToStorage(KEYS.TIMELINE, entries);
};
export const addTimelineEntry = (entry: TimelineEntry) => {
  const list = getTimeline();
  list.unshift(entry);
  saveToStorage(KEYS.TIMELINE, list);
};

// Coach Notes CRUD
export const getCoachNotes = (): CoachNote[] => getFromStorage<CoachNote[]>(KEYS.NOTES, []);
export const saveCoachNotes = (notes: CoachNote[]) => {
  saveToStorage(KEYS.NOTES, notes);
};

// Weekly CheckIns CRUD
export const getWeeklyCheckIns = (): WeeklyCheckIn[] => getFromStorage<WeeklyCheckIn[]>(KEYS.CHECKINS, []);
export const saveWeeklyCheckIns = (checkins: WeeklyCheckIn[]) => {
  saveToStorage(KEYS.CHECKINS, checkins);
};

// Daily CheckIns CRUD
export const getDailyCheckIns = (): DailyCheckIn[] => getFromStorage<DailyCheckIn[]>(KEYS.DAILY_CHECKINS, []);
export const saveDailyCheckIns = (checkins: DailyCheckIn[]) => {
  saveToStorage(KEYS.DAILY_CHECKINS, checkins);
};

export const syncDailyCheckInToCloud = async (checkin: DailyCheckIn) => {
  if (!db) return;
  const coachId = getActiveCoachId();
  try {
    await setDoc(doc(db, `coaches/${coachId}/clients/${checkin.clientId}/dailyCheckins`, checkin.id), checkin);
  } catch (e) {
    console.warn("Could not sync daily check-in to Firestore:", e);
  }
};

// Smart Alerts CRUD
export const getSmartAlerts = (): SmartAlert[] => getFromStorage<SmartAlert[]>(KEYS.ALERTS, []);
export const saveSmartAlerts = (alerts: SmartAlert[]) => {
  saveToStorage(KEYS.ALERTS, alerts);
};

// Goals CRUD
export const getClientGoals = (): ClientGoal[] => getFromStorage<ClientGoal[]>(KEYS.GOALS, []);
export const saveClientGoals = (goals: ClientGoal[]) => {
  saveToStorage(KEYS.GOALS, goals);
};

// Coach Profile/Settings
export const getCoachProfile = () => getFromStorage(KEYS.COACH, {
  id: "coach_master",
  name: "David Al-Khalili",
  email: "munzerm50@gmail.com",
  gymName: "RepRise Elite HQ",
  registered: true,
  subscription: "Elite"
});

export const saveCoachProfile = (profile: any) => {
  saveToStorage(KEYS.COACH, profile);
  if (db && profile && profile.id) {
    setDoc(doc(db, 'coaches', profile.id), profile, { merge: true }).catch(err => {
      console.warn("Could not sync coach profile updates to cloud:", err);
    });
  }
};

export const getCoachSettings = () => getFromStorage(KEYS.SETTINGS, {
  theme: "dark",
  language: "en",
  units: {
    weight: "kg",
    height: "cm"
  }
});

export const saveCoachSettings = (settings: any) => saveToStorage(KEYS.SETTINGS, settings);

// Cascade delete for client records (Used during permanent empty out if needed)
export const deleteClientCascade = (clientId: string) => {
  const list = getClients();
  const filtered = list.filter(c => c.id !== clientId);
  saveToStorage(KEYS.CLIENTS, filtered);
  deleteClientFromCloud(clientId);

  // InBody records cleanups
  const records = getInBodyRecords();
  const remIb = records.filter(r => r.clientId !== clientId);
  saveToStorage(KEYS.INBODY, remIb);
  records.filter(r => r.clientId === clientId).forEach(async (r) => {
    if (db) await deleteDoc(doc(db, `coaches/${getActiveCoachId()}/clients/${clientId}/inbodyRecords`, r.id)).catch(() => {});
  });

  // Workouts cleanups
  const workouts = getWorkouts();
  saveToStorage(KEYS.WORKOUTS, workouts.filter(w => w.clientId !== clientId));
  workouts.filter(w => w.clientId === clientId).forEach(async (w) => {
    if (db) await deleteDoc(doc(db, `coaches/${getActiveCoachId()}/clients/${clientId}/workoutPlans`, w.id)).catch(() => {});
  });

  // Nutrition plans cleanups
  const nutritions = getNutritionPlans();
  saveToStorage(KEYS.NUTRITION, nutritions.filter(n => n.clientId !== clientId));
  nutritions.filter(n => n.clientId === clientId).forEach(async (n) => {
    if (db) await deleteDoc(doc(db, `coaches/${getActiveCoachId()}/clients/${clientId}/nutritionPlans`, n.id)).catch(() => {});
  });

  // Progress logs cleanups
  const logs = getProgressLogs();
  saveToStorage(KEYS.PROGRESS, logs.filter(p => p.clientId !== clientId));
  logs.filter(p => p.clientId === clientId).forEach(async (p) => {
    if (db) await deleteDoc(doc(db, `coaches/${getActiveCoachId()}/clients/${clientId}/progressLogs`, p.id)).catch(() => {});
  });

  // Timeline cleanups
  const timeline = getTimeline();
  saveToStorage(KEYS.TIMELINE, timeline.filter(t => t.clientId !== clientId));
  timeline.filter(t => t.clientId === clientId).forEach(async (t) => {
    if (db) await deleteDoc(doc(db, `coaches/${getActiveCoachId()}/clients/${clientId}/timelineEntries`, t.id)).catch(() => {});
  });

  // Notes cleanups
  const notes = getCoachNotes();
  saveToStorage(KEYS.NOTES, notes.filter(n => n.clientId !== clientId));
  notes.filter(n => n.clientId === clientId).forEach(async (n) => {
    if (db) await deleteDoc(doc(db, `coaches/${getActiveCoachId()}/clients/${clientId}/coachNotes`, n.id)).catch(() => {});
  });

  // Checkins cleanups
  const checkins = getWeeklyCheckIns();
  saveToStorage(KEYS.CHECKINS, checkins.filter(c => c.clientId !== clientId));
  checkins.filter(c => c.clientId === clientId).forEach(async (c) => {
    if (db) await deleteDoc(doc(db, `coaches/${getActiveCoachId()}/clients/${clientId}/weeklyCheckins`, c.id)).catch(() => {});
  });

  // Alerts cleanups
  const alerts = getSmartAlerts();
  saveToStorage(KEYS.ALERTS, alerts.filter(a => a.clientId !== clientId));
  alerts.filter(a => a.clientId === clientId).forEach(async (a) => {
    if (db) await deleteDoc(doc(db, `coaches/${getActiveCoachId()}/clients/${clientId}/smartAlerts`, a.id)).catch(() => {});
  });

  // Goals cleanups
  const goals = getClientGoals();
  saveToStorage(KEYS.GOALS, goals.filter(g => g.clientId !== clientId));
  goals.filter(g => g.clientId === clientId).forEach(async (g) => {
    if (db) await deleteDoc(doc(db, `coaches/${getActiveCoachId()}/clients/${clientId}/clientGoals`, g.id)).catch(() => {});
  });

  // Daily Check-ins cleanups
  const dailyCheckins = getDailyCheckIns();
  saveToStorage(KEYS.DAILY_CHECKINS, dailyCheckins.filter(d => d.clientId !== clientId));
  dailyCheckins.filter(d => d.clientId === clientId).forEach(async (d) => {
    if (db) await deleteDoc(doc(db, `coaches/${getActiveCoachId()}/clients/${clientId}/dailyCheckins`, d.id)).catch(() => {});
  });
};

// Reset database helper
export const resetToDemoData = () => {
  localStorage.setItem(KEYS.CLIENTS, JSON.stringify(SAMPLE_CLIENTS));
  localStorage.setItem(KEYS.INBODY, JSON.stringify(SAMPLE_INBODY_RECORDS));
  localStorage.setItem(KEYS.WORKOUTS, JSON.stringify(SAMPLE_WORKOUTS.map(w => ({ ...w, version: w.version || 1, isActive: true }))));
  localStorage.setItem(KEYS.NUTRITION, JSON.stringify(SAMPLE_NUTRITION.map(n => ({ ...n, version: n.version || 1, isActive: true }))));
  localStorage.setItem(KEYS.PROGRESS, JSON.stringify(SAMPLE_PROGRESS_LOGS));
  localStorage.setItem(KEYS.TIMELINE, JSON.stringify(SAMPLE_TIMELINE));
  localStorage.setItem(KEYS.NOTES, JSON.stringify(SAMPLE_NOTES));
  localStorage.setItem(KEYS.CHECKINS, JSON.stringify(SAMPLE_CHECKINS));
  localStorage.setItem(KEYS.ALERTS, JSON.stringify(SAMPLE_ALERTS));
  localStorage.setItem(KEYS.GOALS, JSON.stringify(SAMPLE_GOALS));
};

// Unified database bootstrapping state loader
export const loadInitialState = () => {
  initDatabase();
  return {
    clients: getClients(),
    inbodyRecords: getInBodyRecords(),
    workouts: getWorkouts(),
    nutrition: getNutritionPlans(),
    progressLogs: getProgressLogs(),
    timeline: getTimeline(),
    coachNotes: getCoachNotes(),
    weeklyCheckins: getWeeklyCheckIns(),
    smartAlerts: getSmartAlerts(),
    clientGoals: getClientGoals()
  };
};

export const restoreBulkState = (snapshotJSON: string) => {
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
};

export const clearAllState = async () => {
  const coachId = getActiveCoachId();
  localStorage.clear();
  
  if (db && coachId) {
    try {
      console.log("Purging all Firestore data for coach:", coachId);
      const clientsSnap = await getDocs(collection(db, `coaches/${coachId}/clients`));
      for (const clientDoc of clientsSnap.docs) {
        const clientId = clientDoc.id;
        
        const subcollNames = [
          'inbodyRecords', 'workoutPlans', 'nutritionPlans', 
          'progressLogs', 'timelineEntries', 'coachNotes', 
          'weeklyCheckins', 'smartAlerts', 'clientGoals'
        ];
        for (const sub of subcollNames) {
          try {
            const subSnap = await getDocs(collection(db, `coaches/${coachId}/clients/${clientId}/${sub}`));
            for (const subDoc of subSnap.docs) {
              await deleteDoc(doc(db, `coaches/${coachId}/clients/${clientId}/${sub}/${subDoc.id}`)).catch(() => {});
            }
          } catch (err) {
            // Ignore if sub-collection query fails (e.g. permission or not exists)
          }
        }
        await deleteDoc(doc(db, `coaches/${coachId}/clients`, clientId)).catch(() => {});
      }
      console.log("Firestore workspace purge complete.");
    } catch (e) {
      console.error("Failed to purge Firestore data:", e);
    }
  }
};
