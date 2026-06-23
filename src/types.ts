/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Gender = 'male' | 'female';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'extremely_active';
export type GymAccess = 'gym' | 'home' | 'hybrid';
export type ClientStatus = 'active' | 'paused' | 'vacation' | 'injured' | 'prep' | 'archived' | 'returning' | 'lead' | 'inactive' | 'soft_deleted';

export interface StatusHistoryEntry {
  status: ClientStatus;
  date: string;
  reason?: string;
  reasonAr?: string;
}

export interface Client {
  id: string;
  name: string;
  gender: Gender;
  age: number;
  height: number; // in cm
  weight: number; // in kg
  goal: string;
  experience: ExperienceLevel;
  activity: ActivityLevel;
  gymAccess: GymAccess;
  equipment: string[];
  trainingDays: number;
  workoutDuration: number; // in minutes
  injuries: string;
  limitations: string;
  medicalNotes: string;
  sleep: 'poor' | 'average' | 'good';
  stress: 'low' | 'medium' | 'high';
  notes: string;
  tags: string[];
  status: ClientStatus;
  createdAt: string;
  statusHistory?: StatusHistoryEntry[];
  deleteTimerStartedAt?: string; // timestamp if soft deleted
}

export interface SegmentalLeanAnalysis {
  trunk: number;
  leftArm: number;
  rightArm: number;
  leftLeg: number;
  rightLeg: number;
}

export interface SegmentalFatAnalysis {
  trunk: number;
  leftArm: number;
  rightArm: number;
  leftLeg: number;
  rightLeg: number;
}

export interface InBodyRecord {
  id: string;
  clientId: string;
  date: string;
  weight: number; // kg
  smm: number; // kg (Skeletal Muscle Mass)
  bodyFat: number; // kg (Body Fat Mass)
  pbf: number; // % (Percent Body Fat)
  bmi: number; // kg/m2
  bmr: number; // kcal
  visceralFat: number; // level 1-20
  segmentalLean: SegmentalLeanAnalysis;
  segmentalFat: SegmentalFatAnalysis;
  ecwTbw: number; // ECW/TBW ratio (usually 0.360 to 0.400)
  whr: number; // Waist-Hip Ratio
  fatControl: number; // kg change needed
  muscleControl: number; // kg change needed
  interpretation: string; // generated text summary
}

export interface Exercise {
  id: string;
  name: string;
  nameAr: string;
  muscle: string;
  equipment: string;
  difficulty: ExperienceLevel;
  pattern: string; // Push, Pull, Squat, Hinge, etc.
  instructions: string;
  instructionsAr: string;
  injurySafe: boolean;
}

export interface SetTemplate {
  id: string;
  reps: string;
  weight?: string;
  rpe?: number; // 1-10 rate of perceived exertion
  rir?: number; // 0-5 reps in reserve
  rest?: string; // e.g. "90s"
  type: 'warmup' | 'working' | 'dropset' | 'superset';
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  name: string;
  nameAr: string;
  sets: SetTemplate[];
  tempo: string; // e.g. "3-1-1-0"
  notes: string;
  isSupersetWithPrevious?: boolean;
}

export interface WorkoutDay {
  id: string;
  name: string; // e.g. Day 1: Upper Body, Day 1: Pull
  exercises: WorkoutExercise[];
}

export interface WorkoutPlan {
  id: string;
  clientId: string;
  name: string;
  templateType: string; // Push Pull Legs, Arnold Split, Upper Lower, etc.
  weeks: number;
  days: WorkoutDay[];
  notes: string;
  createdAt: string;
  version?: number;
  isActive?: boolean;
  isArchived?: boolean;
  activationDate?: string;
  changeSummary?: string;
  goal?: string;
}

export interface MealItem {
  name: string;
  timing: string;
  items: string[];
}

export interface NutritionPlan {
  id: string;
  clientId: string;
  bmr: number;
  tdee: number;
  calories: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  };
  mealTiming: string;
  mealCount: number;
  dietStyle: string; // High Protein, Balanced, Keto, Mediterranean, Low Fat, Vegan
  allergies: string;
  meals: MealItem[];
  groceryList: string[];
  createdAt: string;
  version?: number;
  isActive?: boolean;
  isArchived?: boolean;
  activationDate?: string;
  updateReason?: string;
  supplementPlan?: string;
  notes?: string;
}

export interface ProgressLog {
  id: string;
  clientId: string;
  date: string;
  weight: number;
  bodyFat?: number;
  photos: string[]; // data URLs
  complianceRate: number; // compliance percentage: 0-100
  measurements?: {
    chest?: number;
    armsRight?: number;
    armsLeft?: number;
    waist?: number;
    hips?: number;
    thighRight?: number;
    thighLeft?: number;
  };
  coachNotes?: string;
}

// ----------------------------------------------------
// NEW SYSTEMS DEFINITIONS (1-12)
// ----------------------------------------------------

export interface TimelineEntry {
  id: string;
  clientId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  type: 
    | 'client_created' 
    | 'workout_created' 
    | 'workout_updated' 
    | 'nutrition_updated' 
    | 'inbody_created' 
    | 'checkin_submitted' 
    | 'photos_added' 
    | 'measurements_updated' 
    | 'weight_changed' 
    | 'goal_changed' 
    | 'note_added' 
    | 'version_activated' 
    | 'pdf_generated' 
    | 'client_archived' 
    | 'client_reactivated'
    | 'status_changed';
  icon: string;
  summary: string;
  summaryAr: string;
  coachComments?: string;
  category: 'training' | 'nutrition' | 'measurements' | 'inbody' | 'photos' | 'notes' | 'programs' | 'system';
}

export interface CoachNote {
  id: string;
  clientId: string;
  title: string;
  content: string;
  date: string; // YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
  category: 'general' | 'training' | 'nutrition' | 'medical' | 'recovery' | 'psychology' | 'lifestyle' | 'competition';
  isPinned: boolean;
  isPriority: boolean;
  isFavorite: boolean;
  isArchived: boolean;
  tags: string[];
  editHistory?: Array<{ date: string; content: string }>;
}

export interface WeeklyCheckIn {
  id: string;
  clientId: string;
  date: string; // YYYY-MM-DD
  weight: number;
  mood: number; // 1-10 or 1-5
  energy: number; // 1-10 or 1-5
  sleepHours: number;
  sleepQuality: number; // 1-10 or 1-5
  stress: number; // 1-10 or 1-5
  recovery: number; // 1-10 or 1-5
  hunger: number; // 1-10 or 1-5
  digestion: number; // 1-10 or 1-5
  waterLitres: number;
  cardioMinutes: number;
  steps: number;
  workoutAdherence: number; // 0-100
  nutritionAdherence: number; // 0-100
  supplementAdherence: number; // 0-100
  motivation: number; // 1-10 or 1-5
  soreness: number; // 1-10 or 1-5
  photos: string[]; // Base64 data URLs
  coachFeedback?: string;
  additionalComments?: string;
}

export interface DailyCheckIn {
  id: string;
  clientId: string;
  date: string; // YYYY-MM-DD
  sleep: 'poor' | 'average' | 'good';
  mood: 'bad' | 'neutral' | 'good';
  waterLitres: number; // e.g. 1.5, 2.0, 3.0, 4.0
  stress: 'low' | 'medium' | 'high';
  notes?: string;
  workoutCompleted?: boolean;
  nutritionAdhered?: boolean;
}

export interface SmartAlert {
  id: string;
  clientId: string;
  clientName: string;
  date: string;
  type: 'inactive' | 'workout_missed' | 'low_compliance' | 'weight_abnormal' | 'checkin_overdue' | 'photos_missing' | 'plateau' | 'overtraining' | 'under_recovery';
  priority: 'low' | 'medium' | 'high';
  category: 'training' | 'nutrition' | 'compliance' | 'medical' | 'general';
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  suggestedAction: string;
  suggestedActionAr: string;
  status: 'active' | 'dismissed' | 'resolved' | 'archived';
}

export interface ClientGoal {
  id: string;
  clientId: string;
  type: 'weight_loss' | 'muscle_gain' | 'strength' | 'body_fat' | 'measurements' | 'competition_prep';
  name: string;
  nameAr: string;
  targetValue: number;
  startValue: number;
  currentValue: number;
  unit: string;
  startDate: string; // YYYY-MM-DD
  targetDate: string; // YYYY-MM-DD
  status: 'ahead' | 'on_schedule' | 'behind' | 'completed';
  completionRate: number; // percentage (e.g. 75)
  estimatedFinishDate?: string;
  recommendations?: string[];
  recommendationsAr?: string[];
}

export interface CoachSettings {
  theme: 'dark' | 'light';
  language: 'en' | 'ar';
  units: {
    weight: 'kg' | 'lbs';
    height: 'cm' | 'in';
  };
}

export interface CoachProfile {
  id: string;
  name: string;
  email: string;
  gymName: string;
  registered: boolean;
  subscription: 'Free' | 'Pro' | 'Elite';
}

export interface DashboardStats {
  clientCount: number;
  activeClients: number;
  pendingReviews: number;
  upcomingCheckins: number;
  recentAssessments: number;
}
