import {
  Achievement,
  TrophyArtifact,
  UserGamificationProfile,
  Subject,
  RevisionLog,
  Category,
  Rating,
  MaterialFinishType,
  PedestalStyleType,
} from '../types';
import { formatDateToYYYYMMDD } from './spacedRepetition';

const GAMIFICATION_STORAGE_KEY = 'lucidia_gamification_profile_v1';

export const LEVEL_TIERS = [
  { level: 1, title: 'Synaptic Initiate', minTokens: 0 },
  { level: 2, title: 'Memory Apprentice', minTokens: 100 },
  { level: 3, title: 'Consolidation Adept', minTokens: 250 },
  { level: 4, title: 'Ebbinghaus Scholar', minTokens: 500 },
  { level: 5, title: 'Neuro-Architect', minTokens: 1000 },
  { level: 6, title: 'Cognitive Ascendant', minTokens: 2000 },
];

export const PEDESTAL_SHOP_ITEMS: {
  id: PedestalStyleType;
  name: string;
  description: string;
  tokenCost: number;
}[] = [
  {
    id: 'minimal_slate',
    name: 'Minimal Deep Slate',
    description: 'Matte beveled slate foundation with sub-surface contact ring.',
    tokenCost: 0,
  },
  {
    id: 'floating_obsidian',
    name: 'Levitating Obsidian',
    description: 'High-gloss volcanic obsidian disc with levitation gap.',
    tokenCost: 150,
  },
  {
    id: 'cyber_monolith',
    name: 'Cybernetic Lattice',
    description: 'Brushed titanium octagonal dais with cobalt neon perimeter.',
    tokenCost: 300,
  },
  {
    id: 'golden_sanctuary',
    name: 'Golden Solarium',
    description: 'Polished aurum sanctuary plinth with radial contact shadow.',
    tokenCost: 500,
  },
];

export const MATERIAL_SHOP_ITEMS: {
  id: MaterialFinishType;
  name: string;
  description: string;
  tokenCost: number;
}[] = [
  {
    id: 'obsidian_titanium',
    name: 'Obsidian Titanium',
    description: 'Dark satin titanium paired with volcanic obsidian glass facets.',
    tokenCost: 0,
  },
  {
    id: 'brushed_gold',
    name: 'Celestial Aurum (Gold)',
    description: 'Anisotropic brushed 24k gold with micro-machined radial sheen.',
    tokenCost: 120,
  },
  {
    id: 'iridescent_chrome',
    name: 'Iridescent Chromium',
    description: 'Thin-film multi-layer interference chrome with spectrum shifts.',
    tokenCost: 250,
  },
  {
    id: 'emerald_matrix',
    name: 'Emerald Neuro-Crystal',
    description: 'Deep luminescent emerald crystal with internal light scattering.',
    tokenCost: 350,
  },
  {
    id: 'celestial_platinum',
    name: 'Starlight Platinum',
    description: 'Mirror-polished stellar platinum alloy with clearcoat brilliance.',
    tokenCost: 600,
  },
];

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'ach_first_spark',
    title: 'First Synaptic Spark',
    description: 'Complete your first spaced revision session and record recall feedback.',
    category: 'habit',
    icon: 'Sparkles',
    tokenReward: 50,
    artifactId: 'art_synaptic_spark',
    progress: 0,
    requirementLabel: 'Log 1 study session',
  },
  {
    id: 'ach_streak_3',
    title: 'Consolidation Triad',
    description: 'Maintain an active daily revision streak across 3 consecutive days.',
    category: 'habit',
    icon: 'Flame',
    tokenReward: 80,
    artifactId: 'art_memory_prism',
    progress: 0,
    requirementLabel: 'Reach 3-day revision streak',
  },
  {
    id: 'ach_ebbinghaus_defier',
    title: 'Ebbinghaus Defier',
    description: 'Achieve an estimated retention rate above 80% with at least 3 subjects.',
    category: 'intel',
    icon: 'Target',
    tokenReward: 100,
    artifactId: 'art_chrono_compass',
    progress: 0,
    requirementLabel: 'Maintain 80%+ memory retention',
  },
  {
    id: 'ach_architect_5',
    title: 'Curriculum Architect',
    description: 'Structure your knowledge base with at least 2 categories and 5 active subjects.',
    category: 'intel',
    icon: 'Layers',
    tokenReward: 120,
    artifactId: 'art_neuro_lattice',
    progress: 0,
    requirementLabel: 'Create 2 categories & 5 subjects',
  },
  {
    id: 'ach_mastery_pioneer',
    title: 'Mastery Pioneer',
    description: 'Consolidate any subject past the 30-day interval boundary on your calendar.',
    category: 'mastery',
    icon: 'Award',
    tokenReward: 150,
    artifactId: 'art_feynman_monolith',
    progress: 0,
    requirementLabel: 'Reach interval ≥ 30 days on a subject',
  },
  {
    id: 'ach_deep_focus_60',
    title: 'Deep Recall Marathon',
    description: 'Accumulate over 60 total minutes of focused revision logged in your tracker.',
    category: 'velocity',
    icon: 'Clock',
    tokenReward: 90,
    artifactId: 'art_polymath_sphere',
    progress: 0,
    requirementLabel: 'Log 60+ minutes total revision',
  },
  {
    id: 'ach_token_hoard_500',
    title: 'Cognitive Ascendant',
    description: 'Accumulate a lifetime total of 500 Synaptic Tokens through disciplined learning.',
    category: 'mastery',
    icon: 'Crown',
    tokenReward: 200,
    artifactId: 'art_cognitive_ascendant',
    progress: 0,
    requirementLabel: 'Earn 500 lifetime tokens',
  },
];

export const INITIAL_ARTIFACTS: TrophyArtifact[] = [
  {
    id: 'art_synaptic_spark',
    name: 'The Synaptic Spark',
    subtitle: 'Kinetic Gyroscope of Awakening Recall',
    lore: 'Constructed from concentric counter-rotating aurum gimbals embracing an ionized plasma node. It commemorates the initial spark of active spaced retrieval.',
    achievementId: 'ach_first_spark',
    defaultFinish: 'brushed_gold',
    unlocked: false,
    meshType: 'synaptic_spark',
  },
  {
    id: 'art_memory_prism',
    name: 'The Memory Prism',
    subtitle: 'Octahedral Crystalline Stabilizer',
    lore: 'A mathematically pure dual-pyramid lattice suspended above an obsidian ring. Reputed to focus diffuse cognitive threads into coherent permanent synaptic bonds.',
    achievementId: 'ach_streak_3',
    defaultFinish: 'emerald_matrix',
    unlocked: false,
    meshType: 'memory_prism',
  },
  {
    id: 'art_chrono_compass',
    name: 'The Chrono Compass',
    subtitle: 'Ebbinghaus Astrolabe & Interval Calibrator',
    lore: 'An astronomical spacing mechanism with dual graduated chapter rings that track cognitive decay vectors and pinpoint the exact optimal hour for spaced repetition.',
    achievementId: 'ach_ebbinghaus_defier',
    defaultFinish: 'obsidian_titanium',
    unlocked: false,
    meshType: 'chrono_compass',
  },
  {
    id: 'art_neuro_lattice',
    name: 'The Neuro-Lattice',
    subtitle: 'Geometric Knowledge Web',
    lore: 'An interconnected 12-node icosahedral polyhedral matrix embodying the organic web of interconnected concepts across academic domains.',
    achievementId: 'ach_architect_5',
    defaultFinish: 'iridescent_chrome',
    unlocked: false,
    meshType: 'neuro_lattice',
  },
  {
    id: 'art_feynman_monolith',
    name: 'The Feynman Monolith',
    subtitle: 'Pillar of Permanent Consolidation',
    lore: 'A towering beveled obelisk sculpted from high-density titanium-obsidian with gold geometric inlays. Bestowed upon achieving permanent 30+ day memory intervals.',
    achievementId: 'ach_mastery_pioneer',
    defaultFinish: 'brushed_gold',
    unlocked: false,
    meshType: 'feynman_monolith',
  },
  {
    id: 'art_polymath_sphere',
    name: 'The Polymath Sphere',
    subtitle: 'Tri-Orbital Conceptual Armillary',
    lore: 'An intricate nested armillary globe that orbits around an equatorial meridian, honoring learners who delve deeply into multi-disciplinary study regimes.',
    achievementId: 'ach_deep_focus_60',
    defaultFinish: 'celestial_platinum',
    unlocked: false,
    meshType: 'polymath_sphere',
  },
  {
    id: 'art_cognitive_ascendant',
    name: 'The Celestial Synapse',
    subtitle: 'Crown of Transcendent Cognition',
    lore: 'A multi-tiered apex artifact fusing floating magnetic orbital discs with an elevated stellar spire. The ultimate testament to lifelong mastery.',
    achievementId: 'ach_token_hoard_500',
    defaultFinish: 'celestial_platinum',
    unlocked: false,
    meshType: 'cognitive_ascendant',
  },
];

export function getInitialGamificationProfile(): UserGamificationProfile {
  return {
    tokens: 50, // Welcome bonus
    lifetimeTokensEarned: 50,
    unlockedAchievements: [],
    unlockedFinishes: ['obsidian_titanium'],
    unlockedPedestals: ['minimal_slate'],
    activeFinish: 'obsidian_titanium',
    activePedestal: 'minimal_slate',
    currentStreak: 0,
    longestStreak: 0,
    level: 1,
    levelTitle: 'Synaptic Initiate',
  };
}

export function loadGamificationProfile(): UserGamificationProfile {
  try {
    const raw = localStorage.getItem(GAMIFICATION_STORAGE_KEY);
    if (!raw) {
      const initial = getInitialGamificationProfile();
      saveGamificationProfile(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    return {
      ...getInitialGamificationProfile(),
      ...parsed,
    };
  } catch {
    return getInitialGamificationProfile();
  }
}

export function saveGamificationProfile(profile: UserGamificationProfile): void {
  try {
    localStorage.setItem(GAMIFICATION_STORAGE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed to save gamification profile to localStorage', e);
  }
}

export function computeLevelFromTokens(lifetimeTokens: number): { level: number; title: string } {
  let matched = LEVEL_TIERS[0];
  for (const tier of LEVEL_TIERS) {
    if (lifetimeTokens >= tier.minTokens) {
      matched = tier;
    }
  }
  return { level: matched.level, title: matched.title };
}

/**
 * Calculates tokens earned for a revision session
 */
export function calculateSessionTokens(
  subject: Subject,
  rating: Rating,
  streakDays: number,
  isMasteredLeap: boolean
): { totalTokens: number; breakdown: { label: string; amount: number }[] } {
  const breakdown: { label: string; amount: number }[] = [];

  // Base completion
  const base = 15;
  breakdown.push({ label: 'Scheduled Revision Completed', amount: base });

  // Rating bonus
  if (rating === 4) {
    breakdown.push({ label: 'Flawless Recall ("Easy")', amount: 15 });
  } else if (rating === 3) {
    breakdown.push({ label: 'Solid Retention ("Good")', amount: 10 });
  }

  // Streak bonus
  if (streakDays >= 3) {
    const streakBonus = Math.min(50, streakDays * 5);
    breakdown.push({ label: `${streakDays}-Day Revision Streak`, amount: streakBonus });
  }

  // Mastery bonus
  if (isMasteredLeap) {
    breakdown.push({ label: 'Mastery Interval Unlocked (≥30d)', amount: 100 });
  }

  const totalTokens = breakdown.reduce((acc, item) => acc + item.amount, 0);
  return { totalTokens, breakdown };
}

/**
 * Evaluates all achievements and returns newly unlocked achievements
 */
export function evaluateAchievements(
  profile: UserGamificationProfile,
  subjects: Subject[],
  categories: Category[],
  logs: RevisionLog[],
  avgRetentionRate: number = 85
): {
  updatedProfile: UserGamificationProfile;
  achievementsWithProgress: Achievement[];
  newlyUnlocked: Achievement[];
} {
  const newlyUnlocked: Achievement[] = [];
  const currentUnlocked = new Set(profile.unlockedAchievements);
  let tokensToAdd = 0;

  const totalStudyMinutes = logs.reduce((acc, l) => acc + (l.durationMinutes || 0), 0);
  const hasMasteredSubject = subjects.some(s => s.intervalDays >= 30);

  const achievementsWithProgress: Achievement[] = INITIAL_ACHIEVEMENTS.map(ach => {
    const isAlreadyUnlocked = currentUnlocked.has(ach.id);
    let progress = 0;

    switch (ach.id) {
      case 'ach_first_spark':
        progress = Math.min(1, logs.length / 1);
        break;
      case 'ach_streak_3':
        progress = Math.min(1, profile.currentStreak / 3);
        break;
      case 'ach_ebbinghaus_defier':
        progress = subjects.length >= 3 ? Math.min(1, avgRetentionRate / 80) : Math.min(1, subjects.length / 3);
        break;
      case 'ach_architect_5':
        const catProgress = Math.min(1, categories.length / 2);
        const subjProgress = Math.min(1, subjects.length / 5);
        progress = (catProgress + subjProgress) / 2;
        break;
      case 'ach_mastery_pioneer':
        progress = hasMasteredSubject ? 1 : Math.min(1, (Math.max(0, ...subjects.map(s => s.intervalDays)) || 0) / 30);
        break;
      case 'ach_deep_focus_60':
        progress = Math.min(1, totalStudyMinutes / 60);
        break;
      case 'ach_token_hoard_500':
        progress = Math.min(1, profile.lifetimeTokensEarned / 500);
        break;
      default:
        progress = 0;
    }

    const shouldUnlock = !isAlreadyUnlocked && progress >= 1;
    if (shouldUnlock) {
      currentUnlocked.add(ach.id);
      tokensToAdd += ach.tokenReward;
      const unlockedAch: Achievement = {
        ...ach,
        progress: 1,
        unlockedAt: new Date().toISOString(),
      };
      newlyUnlocked.push(unlockedAch);
      return unlockedAch;
    }

    return {
      ...ach,
      progress: isAlreadyUnlocked ? 1 : progress,
      unlockedAt: isAlreadyUnlocked ? new Date().toISOString() : undefined,
    };
  });

  const updatedTokens = profile.tokens + tokensToAdd;
  const updatedLifetime = profile.lifetimeTokensEarned + tokensToAdd;
  const { level, title } = computeLevelFromTokens(updatedLifetime);

  const updatedProfile: UserGamificationProfile = {
    ...profile,
    tokens: updatedTokens,
    lifetimeTokensEarned: updatedLifetime,
    unlockedAchievements: Array.from(currentUnlocked),
    level,
    levelTitle: title,
  };

  return {
    updatedProfile,
    achievementsWithProgress,
    newlyUnlocked,
  };
}

/**
 * Purchases a finish or pedestal from the Trophy Vault shop
 */
export function purchaseShopItem(
  profile: UserGamificationProfile,
  itemType: 'finish' | 'pedestal',
  itemId: string
): { success: boolean; updatedProfile: UserGamificationProfile; error?: string } {
  if (itemType === 'finish') {
    const finish = MATERIAL_SHOP_ITEMS.find(f => f.id === itemId);
    if (!finish) return { success: false, updatedProfile: profile, error: 'Item not found' };
    if (profile.unlockedFinishes.includes(finish.id)) {
      // Already unlocked, just equip
      return {
        success: true,
        updatedProfile: { ...profile, activeFinish: finish.id },
      };
    }
    if (profile.tokens < finish.tokenCost) {
      return { success: false, updatedProfile: profile, error: `Requires ${finish.tokenCost} tokens (you have ${profile.tokens})` };
    }
    const updated: UserGamificationProfile = {
      ...profile,
      tokens: profile.tokens - finish.tokenCost,
      unlockedFinishes: [...profile.unlockedFinishes, finish.id],
      activeFinish: finish.id,
    };
    saveGamificationProfile(updated);
    return { success: true, updatedProfile: updated };
  } else {
    const pedestal = PEDESTAL_SHOP_ITEMS.find(p => p.id === itemId);
    if (!pedestal) return { success: false, updatedProfile: profile, error: 'Item not found' };
    if (profile.unlockedPedestals.includes(pedestal.id)) {
      // Already unlocked, just equip
      return {
        success: true,
        updatedProfile: { ...profile, activePedestal: pedestal.id },
      };
    }
    if (profile.tokens < pedestal.tokenCost) {
      return { success: false, updatedProfile: profile, error: `Requires ${pedestal.tokenCost} tokens (you have ${profile.tokens})` };
    }
    const updated: UserGamificationProfile = {
      ...profile,
      tokens: profile.tokens - pedestal.tokenCost,
      unlockedPedestals: [...profile.unlockedPedestals, pedestal.id],
      activePedestal: pedestal.id,
    };
    saveGamificationProfile(updated);
    return { success: true, updatedProfile: updated };
  }
}
