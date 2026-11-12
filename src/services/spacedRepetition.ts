import { Subject, Rating, RevisionSchedule } from '../types';

export const PRESET_SCHEDULES: RevisionSchedule[] = [
  {
    id: 'lucidia-adaptive',
    name: 'Lucidia Adaptive (SM-2+)',
    description: 'Dynamic neural adaptation combining SuperMemo SM-2 with custom ease bounds and 90% retention target.',
    isPreset: true,
    algorithm: 'sm2_custom',
    learningSteps: [1, 2], // days
    graduatingInterval: 1, // 1 day
    easyInterval: 3, // 3 days
    intervalMultiplier: 2.1,
    easyBonus: 1.3,
    hardPenalty: 0.85,
    lapseResetPercentage: 20,
    maximumInterval: 365,
    targetRetention: 0.90,
  },
  {
    id: 'exam-sprint',
    name: 'Exam Sprint (Aggressive Focus)',
    description: 'Compressed intervals designed for upcoming certifications or exams within 2–6 weeks.',
    isPreset: true,
    algorithm: 'fixed_intervals',
    learningSteps: [1, 2],
    graduatingInterval: 1,
    easyInterval: 3,
    intervalMultiplier: 1.6,
    easyBonus: 1.15,
    hardPenalty: 0.7,
    lapseResetPercentage: 0,
    maximumInterval: 60,
    targetRetention: 0.95,
    customStepsLadder: [1, 2, 4, 7, 12, 20, 35, 60],
  },
  {
    id: 'deep-retention',
    name: 'Long-Term Mastery (Gradual Curve)',
    description: 'Expanded spacing for durable multi-year retention without review fatigue.',
    isPreset: true,
    algorithm: 'exponential_custom',
    learningSteps: [2, 5],
    graduatingInterval: 2,
    easyInterval: 5,
    intervalMultiplier: 2.5,
    easyBonus: 1.4,
    hardPenalty: 0.8,
    lapseResetPercentage: 30,
    maximumInterval: 730,
    targetRetention: 0.85,
  },
  {
    id: 'fsrs-cognitive',
    name: 'FSRS Cognitive Decay Model',
    description: 'Memory stability & difficulty tracking calibrated against the Ebbinghaus forgetting equation R=e^(-t/S).',
    isPreset: true,
    algorithm: 'fsrs_custom',
    learningSteps: [1, 3],
    graduatingInterval: 1,
    easyInterval: 4,
    intervalMultiplier: 2.2,
    easyBonus: 1.35,
    hardPenalty: 0.8,
    lapseResetPercentage: 25,
    maximumInterval: 500,
    targetRetention: 0.92,
  },
];

export interface SubjectCalculationResult {
  intervalDays: number;
  revisionStage: number;
  stability: number;
  difficulty: number;
  nextDueDate: string; // YYYY-MM-DD
  intervalFormatted: string;
  status: Subject['status'];
}

export function formatInterval(days: number): string {
  if (days <= 0) return 'Immediate';
  const rounded = Math.round(days);
  if (rounded < 1) return '<1d';
  if (rounded === 1) return '1d';
  if (rounded < 30) return `${rounded}d`;
  const months = +(days / 30.4).toFixed(1);
  if (months < 12) return `${months}mo`;
  const years = +(days / 365.25).toFixed(1);
  return `${years}y`;
}

export function formatDateToYYYYMMDD(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates next revision timing and milestone for a subject.
 */
export function calculateNextSubjectRevision(
  subject: Subject,
  rating: Rating,
  schedule: RevisionSchedule,
  baseDate: Date = new Date()
): SubjectCalculationResult {
  let newStage = subject.revisionStage || 0;
  let newInterval = subject.intervalDays || 1;
  let newStability = subject.stability || 1;
  let newDifficulty = subject.difficulty || 5;

  if (rating === 1) {
    // Again (Lapse / Reset)
    newStage = 0;
    newDifficulty = Math.min(10, newDifficulty + 0.8);
    newStability = Math.max(0.5, newStability * 0.4);

    if (schedule.lapseResetPercentage > 0 && subject.intervalDays > 2) {
      newInterval = Math.max(1, Math.round(subject.intervalDays * (schedule.lapseResetPercentage / 100)));
    } else {
      newInterval = 1;
    }
  } else if (rating === 2) {
    // Hard
    newDifficulty = Math.min(10, newDifficulty + 0.3);
    newStage = Math.max(0, newStage + 1);
    if (newInterval <= 1) {
      newInterval = 2;
    } else {
      newInterval = Math.max(1, Math.round(newInterval * schedule.hardPenalty));
    }
    newStability = Math.max(1, newStability * 1.15);
  } else if (rating === 3) {
    // Good
    newStage += 1;
    newDifficulty = Math.max(1, newDifficulty - 0.1);

    if (schedule.algorithm === 'fixed_intervals' && schedule.customStepsLadder && schedule.customStepsLadder.length > 0) {
      const ladder = schedule.customStepsLadder;
      const currentIdx = ladder.findIndex(step => step >= newInterval);
      if (currentIdx === -1 || currentIdx >= ladder.length - 1) {
        newInterval = Math.min(schedule.maximumInterval, Math.round(newInterval * schedule.intervalMultiplier));
      } else {
        newInterval = ladder[currentIdx + 1];
      }
    } else {
      if (newInterval <= 1) {
        newInterval = schedule.graduatingInterval || 2;
      } else {
        const retentionFactor = Math.log(schedule.targetRetention) / Math.log(0.9);
        const multiplier = schedule.intervalMultiplier * retentionFactor;
        newInterval = Math.max(newInterval + 1, Math.round(newInterval * multiplier));
      }
    }
    newStability = newInterval;
  } else if (rating === 4) {
    // Easy
    newStage += 2;
    newDifficulty = Math.max(1, newDifficulty - 0.5);

    if (schedule.algorithm === 'fixed_intervals' && schedule.customStepsLadder && schedule.customStepsLadder.length > 0) {
      const ladder = schedule.customStepsLadder;
      const currentIdx = ladder.findIndex(step => step >= newInterval);
      const targetIdx = Math.min(ladder.length - 1, (currentIdx === -1 ? ladder.length - 1 : currentIdx + 2));
      newInterval = ladder[targetIdx];
    } else {
      const multiplier = schedule.intervalMultiplier * schedule.easyBonus;
      newInterval = Math.max(newInterval + 2, Math.round(newInterval * multiplier));
    }
    newStability = newInterval * 1.3;
  }

  // Cap at maximum interval
  newInterval = Math.min(schedule.maximumInterval, Math.max(1, newInterval));

  const targetDate = new Date(baseDate.getTime() + newInterval * 24 * 60 * 60 * 1000);
  const nextDueDate = formatDateToYYYYMMDD(targetDate);

  const status: Subject['status'] = newInterval >= 45 ? 'mastered' : 'scheduled';

  return {
    intervalDays: newInterval,
    revisionStage: newStage,
    stability: Number(newStability.toFixed(1)),
    difficulty: Number(newDifficulty.toFixed(1)),
    nextDueDate,
    intervalFormatted: formatInterval(newInterval),
    status,
  };
}

/**
 * Calculates current recall probability according to Ebbinghaus exponential forgetting curve:
 * R(t) = exp(-t / S)
 */
export function calculateCurrentRetention(subject: Subject, now: Date = new Date()): number {
  if (!subject.lastRevisedAt) return 0.95;
  const elapsedDays = (now.getTime() - new Date(subject.lastRevisedAt).getTime()) / (24 * 60 * 60 * 1000);
  const stability = Math.max(0.5, subject.stability || subject.intervalDays || 1);
  const retention = Math.exp(-elapsedDays / stability);
  return Math.min(1.0, Math.max(0.05, retention));
}

/**
 * Simulates future intervals for a given schedule over N consecutive 'Good' reviews.
 */
export function simulateScheduleProgression(schedule: RevisionSchedule, steps: number = 8): { step: number; intervalDays: number; formatted: string }[] {
  let simulatedSubject: Subject = {
    id: 'sim',
    name: 'Simulation Sample',
    categoryId: 'sim',
    categoryName: 'Sim',
    scheduleId: schedule.id,
    revisionStage: 0,
    intervalDays: 1,
    stability: 1,
    difficulty: 5,
    nextDueDate: formatDateToYYYYMMDD(new Date()),
    status: 'scheduled',
    notes: '',
    createdAt: new Date().toISOString(),
  };

  const results: { step: number; intervalDays: number; formatted: string }[] = [];

  for (let i = 1; i <= steps; i++) {
    const calc = calculateNextSubjectRevision(simulatedSubject, 3, schedule);
    results.push({
      step: i,
      intervalDays: calc.intervalDays,
      formatted: calc.intervalFormatted,
    });
    simulatedSubject = {
      ...simulatedSubject,
      revisionStage: calc.revisionStage,
      intervalDays: calc.intervalDays,
      stability: calc.stability,
      difficulty: calc.difficulty,
    };
  }

  return results;
}
