export type Rating = 1 | 2 | 3 | 4; // 1: Again (Lapsed), 2: Hard, 3: Good, 4: Easy

export interface Category {
  id: string;
  name: string;
  color: string; // indigo, emerald, amber, violet, rose, sky, cyan, teal, orange, fuchsia, lime, pink
  description: string;
  userId?: string;
  createdAt: string;
}

export interface Subject {
  id: string;
  name: string;
  categoryId: string; // Primary category
  categoryName: string;
  categoryIds?: string[]; // Multiple categories support
  categoryNames?: string[];
  color?: string; // Optional subject-level accent color override
  scheduleId: string;
  revisionStage: number; // e.g. 0, 1, 2, 3...
  intervalDays: number;
  stability: number; // Memory stability in days
  difficulty: number; // 1-10 difficulty rating
  nextDueDate: string; // YYYY-MM-DD
  lastRevisedAt?: string; // ISO string
  status: 'due' | 'scheduled' | 'mastered';
  notes: string;
  userId?: string;
  createdAt: string;
}

export interface RevisionSchedule {
  id: string;
  name: string;
  description: string;
  isPreset: boolean;
  algorithm: 'sm2_custom' | 'exponential_custom' | 'fixed_intervals' | 'fsrs_custom';
  learningSteps: number[]; // in minutes or hours
  graduatingInterval: number; // in days (e.g. 1)
  easyInterval: number; // in days (e.g. 3)
  intervalMultiplier: number; // e.g. 2.0x
  easyBonus: number; // e.g. 1.3x
  hardPenalty: number; // e.g. 0.8x
  lapseResetPercentage: number; // % of interval preserved on lapse
  maximumInterval: number; // in days
  targetRetention: number; // e.g. 0.90
  useCustomSteps?: boolean; // When true, progression strictly follows customStepsLadder
  customStepsLadder?: number[]; // custom sequence of days e.g. [1, 3, 7, 14, 30, 60, 120]
  userId?: string;
  createdAt?: string;
}

export interface RevisionLog {
  id: string;
  subjectId: string;
  subjectName: string;
  categoryId: string;
  rating: Rating;
  durationMinutes: number;
  revisedDate: string; // YYYY-MM-DD
  notes: string;
  previousInterval: number;
  newInterval: number;
  userId?: string;
  timestamp: string;
}

export interface AIAnalysisResult {
  cognitiveAudit: string;
  retentionScore: number;
  cognitiveLoadRisk: 'Optimal' | 'Moderate' | 'Fatigue Warning';
  memoryStabilityIndex: number;
  scheduleRecommendations: {
    recommendedMultiplier: number;
    recommendedRetentionTarget: number;
    recommendedSteps: string[];
    rationale: string;
  };
  subjectInsights: {
    subjectId: string;
    subjectName: string;
    issue: string;
    recommendation: string;
  }[];
  predictedMasteryDate: string;
  analyzedAt: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export type MaterialFinishType = 'obsidian_titanium' | 'brushed_gold' | 'iridescent_chrome' | 'emerald_matrix' | 'celestial_platinum';

export type PedestalStyleType = 'minimal_slate' | 'floating_obsidian' | 'golden_sanctuary' | 'cyber_monolith';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: 'habit' | 'mastery' | 'intel' | 'velocity';
  icon: string;
  tokenReward: number;
  artifactId: string;
  unlockedAt?: string;
  progress: number; // 0 to 1
  requirementLabel: string;
}

export interface TrophyArtifact {
  id: string;
  name: string;
  subtitle: string;
  lore: string;
  achievementId: string;
  defaultFinish: MaterialFinishType;
  unlocked: boolean;
  unlockedAt?: string;
  meshType: 'synaptic_spark' | 'memory_prism' | 'chrono_compass' | 'neuro_lattice' | 'feynman_monolith' | 'polymath_sphere' | 'cognitive_ascendant';
}

export interface UserGamificationProfile {
  tokens: number;
  lifetimeTokensEarned: number;
  unlockedAchievements: string[]; // achievement IDs
  unlockedFinishes: MaterialFinishType[];
  unlockedPedestals: PedestalStyleType[];
  activeFinish: MaterialFinishType;
  activePedestal: PedestalStyleType;
  currentStreak: number;
  longestStreak: number;
  lastStudyDate?: string;
  level: number;
  levelTitle: string;
}
