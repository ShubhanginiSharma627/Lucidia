import { Category, Subject, RevisionSchedule, RevisionLog, AIAnalysisResult } from '../types';
import { PRESET_SCHEDULES } from './spacedRepetition';

const STORAGE_KEYS = {
  CATEGORIES: 'lucidia_categories_v1',
  SUBJECTS: 'lucidia_subjects_v1',
  SCHEDULES: 'lucidia_schedules_v1',
  LOGS: 'lucidia_logs_v1',
  AI_CACHE: 'lucidia_ai_cache_v1',
};

// Clean up any legacy dummy data from previous versions
export function purgeLegacyDummyData(): void {
  try {
    const legacyKeys = [
      'synapse_decks_v1',
      'synapse_cards_v1',
      'synapse_schedules_v1',
      'synapse_logs_v1',
      'synapse_ai_cache_v1',
      'synapse_categories_v2',
      'synapse_subjects_v2',
      'synapse_logs_v2',
      'synapse_ai_cache_v2',
    ];
    legacyKeys.forEach(k => localStorage.removeItem(k));
  } catch (e) {
    // ignore
  }
}

// Execute purge immediately on load
purgeLegacyDummyData();

export function getCategories(): Category[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES) || localStorage.getItem('synapse_categories_v3');
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveCategories(categories: Category[]): void {
  localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
}

export function getSubjects(): Subject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SUBJECTS) || localStorage.getItem('synapse_subjects_v3');
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveSubjects(subjects: Subject[]): void {
  localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(subjects));
}

export function getSchedules(): RevisionSchedule[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SCHEDULES) || localStorage.getItem('synapse_schedules_v3');
    if (!raw) {
      saveSchedules(PRESET_SCHEDULES);
      return PRESET_SCHEDULES;
    }
    const parsed = JSON.parse(raw) as RevisionSchedule[];
    const mergedMap = new Map<string, RevisionSchedule>();
    for (const preset of PRESET_SCHEDULES) {
      mergedMap.set(preset.id, preset);
    }
    if (Array.isArray(parsed)) {
      for (const sched of parsed) {
        if (sched && sched.id) {
          mergedMap.set(sched.id, sched);
        }
      }
    }
    return Array.from(mergedMap.values());
  } catch {
    return PRESET_SCHEDULES;
  }
}

export function saveSchedules(schedules: RevisionSchedule[]): void {
  localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(schedules));
}

export function getRevisionLogs(): RevisionLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOGS) || localStorage.getItem('synapse_logs_v3');
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveRevisionLogs(logs: RevisionLog[]): void {
  localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
}

export function appendRevisionLog(log: RevisionLog): void {
  const current = getRevisionLogs();
  current.push(log);
  saveRevisionLogs(current);
}

export function getCachedAIAnalysis(): AIAnalysisResult | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AI_CACHE);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveCachedAIAnalysis(data: AIAnalysisResult): void {
  localStorage.setItem(STORAGE_KEYS.AI_CACHE, JSON.stringify(data));
}
