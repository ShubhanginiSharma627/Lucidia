import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { Category, Subject, RevisionSchedule, RevisionLog, AIAnalysisResult, Rating } from './types';
import {
  getCategories,
  saveCategories,
  getSubjects,
  saveSubjects,
  getSchedules,
  saveSchedules,
  getRevisionLogs,
  saveRevisionLogs,
  appendRevisionLog,
  getCachedAIAnalysis,
  saveCachedAIAnalysis,
} from './services/storage';
import {
  auth,
  signInWithGoogle,
  logOut,
  syncCategory,
  deleteCategoryDoc,
  syncSubject,
  deleteSubjectDoc,
  syncSchedule,
  deleteScheduleDoc,
  syncLog,
  subscribeToUserUserData,
} from './services/firebase';
import {
  calculateNextSubjectRevision,
  formatDateToYYYYMMDD,
  PRESET_SCHEDULES,
  recalculateSubjectForSchedule,
} from './services/spacedRepetition';
import { getSubjectCategoryIds } from './services/colors';
import {
  UserGamificationProfile,
  Achievement,
} from './types';
import {
  loadGamificationProfile,
  saveGamificationProfile,
  evaluateAchievements,
  calculateSessionTokens,
} from './services/gamification';
import { Header, NavTab } from './components/Header';
import { MobileNavDrawer } from './components/MobileNavDrawer';
import { RevisionCalendar } from './components/RevisionCalendar';
import { SubjectCategoryManager } from './components/SubjectCategoryManager';
import { CustomScheduleManager } from './components/CustomScheduleManager';
import { AIStatisticsDashboard } from './components/AIStatisticsDashboard';
import { TrophyVault3D } from './components/TrophyVault3D';
import { LogSessionModal } from './components/LogSessionModal';
import { NeuralCanvas } from './components/NeuralCanvas';
import { Trophy, Award, Sparkles, X, ArrowRight } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [categories, setCategories] = useState<Category[]>(() => getCategories());
  const [subjects, setSubjects] = useState<Subject[]>(() => getSubjects());
  const [schedules, setSchedules] = useState<RevisionSchedule[]>(() => getSchedules());
  const [logs, setLogs] = useState<RevisionLog[]>(() => getRevisionLogs());
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(() => getCachedAIAnalysis());

  // Gamification state
  const [gamificationProfile, setGamificationProfile] = useState<UserGamificationProfile>(() =>
    loadGamificationProfile()
  );
  const [achievements, setAchievements] = useState<Achievement[]>(() => {
    const prof = loadGamificationProfile();
    const evaluated = evaluateAchievements(prof, getSubjects(), getCategories(), getRevisionLogs());
    return evaluated.achievementsWithProgress;
  });
  const [unlockedCelebration, setUnlockedCelebration] = useState<Achievement | null>(null);

  const [activeTab, setActiveTab] = useState<NavTab>('calendar');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Modals state
  const [sessionModalSubject, setSessionModalSubject] = useState<Subject | null>(null);
  const [sessionModalTargetDate, setSessionModalTargetDate] = useState<string | undefined>(undefined);
  const [preselectedDateForNewSubject, setPreselectedDateForNewSubject] = useState<string | undefined>(undefined);
  const [isAddSubjectModalOpen, setIsAddSubjectModalOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [dismissedFocusUid, setDismissedFocusUid] = useState<string | null>(null);

  // Close all open popups, drawers, and cross-tab modal triggers when switching tabs
  const handleTabChange = useCallback((nextTab: NavTab) => {
    setSessionModalSubject(null);
    setSessionModalTargetDate(undefined);
    setIsMobileNavOpen(false);
    setUnlockedCelebration(null);
    setIsAddSubjectModalOpen(false);
    setPreselectedDateForNewSubject(undefined);
    setActiveTab(nextTab);
  }, []);

  // Update gamification profile helper
  const handleUpdateGamificationProfile = useCallback((updated: UserGamificationProfile) => {
    setGamificationProfile(updated);
    saveGamificationProfile(updated);
  }, []);

  // Auth listener & Firestore live sync
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, currentUser => {
      setUser(currentUser);
      if (!currentUser) {
        setDismissedFocusUid(null);
      }
      if (currentUser) {
        // Subscribe to user Firestore data
        const unsubscribeFirestore = subscribeToUserUserData(currentUser.uid, {
          onCategories: remoteCats => {
            setCategories(remoteCats);
            saveCategories(remoteCats);
          },
          onSubjects: remoteSubs => {
            setSubjects(remoteSubs);
            saveSubjects(remoteSubs);
          },
          onSchedules: remoteScheds => {
            const mergedMap = new Map<string, RevisionSchedule>();
            for (const preset of PRESET_SCHEDULES) {
              mergedMap.set(preset.id, preset);
            }
            for (const remote of remoteScheds) {
              mergedMap.set(remote.id, remote);
            }
            const merged = Array.from(mergedMap.values());
            setSchedules(merged);
            saveSchedules(merged);
          },
          onLogs: remoteLogs => {
            setLogs(remoteLogs);
            saveRevisionLogs(remoteLogs);
          },
        });

        return () => unsubscribeFirestore();
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Keep latest refs to avoid stale closures and impure state updaters
  const subjectsRef = useRef(subjects);
  subjectsRef.current = subjects;
  const schedulesRef = useRef(schedules);
  schedulesRef.current = schedules;
  const logsRef = useRef(logs);
  logsRef.current = logs;

  // Sync to local storage when state changes (offline & fallback resilience)
  useEffect(() => {
    saveCategories(categories);
  }, [categories]);

  useEffect(() => {
    saveSubjects(subjects);
  }, [subjects]);

  useEffect(() => {
    saveSchedules(schedules);
  }, [schedules]);

  useEffect(() => {
    saveRevisionLogs(logs);
  }, [logs]);

  // Reconcile subjects whose assigned custom-step schedule was already updated
  useEffect(() => {
    if (subjects.length === 0 || schedules.length === 0) return;

    const updatedList: Subject[] = [];
    const changedSubjects: Subject[] = [];

    for (const subj of subjects) {
      if ((subj.revisionStage || 0) < 1) {
        updatedList.push(subj);
        continue;
      }
      const sched = schedules.find(sc => sc.id === subj.scheduleId);
      if (!sched) {
        updatedList.push(subj);
        continue;
      }
      const usesCustomLadder = Boolean(
        (sched.useCustomSteps || sched.algorithm === 'fixed_intervals') &&
          sched.customStepsLadder &&
          sched.customStepsLadder.length > 0
      );
      if (!usesCustomLadder) {
        updatedList.push(subj);
        continue;
      }

      // Preserve explicit Hard/Again rating adjustments from the most recent log
      const latestLog = logs
        .filter(l => l.subjectId === subj.id)
        .sort((a, b) => (b.timestamp || b.revisedDate).localeCompare(a.timestamp || a.revisedDate))[0];
      if (latestLog && (latestLog.rating === 1 || latestLog.rating === 2)) {
        updatedList.push(subj);
        continue;
      }

      const recalculated = recalculateSubjectForSchedule(subj, sched, logs);
      if (recalculated.intervalDays !== subj.intervalDays) {
        updatedList.push(recalculated);
        changedSubjects.push(recalculated);
      } else {
        updatedList.push(subj);
      }
    }

    if (changedSubjects.length > 0) {
      setSubjects(updatedList);
      if (user) {
        for (const ch of changedSubjects) {
          syncSubject(user.uid, ch);
        }
      }
    }
  }, [subjects, schedules, logs, user]);

  // Compute due subjects
  const todayStr = formatDateToYYYYMMDD(new Date());
  const dueSubjectsCount = useMemo(() => {
    return subjects.filter(s => s.nextDueDate <= todayStr).length;
  }, [subjects, todayStr]);

  // Handle study session logging
  const handleSubmitSessionLog = useCallback(
    (
      subject: Subject,
      rating: Rating,
      durationMinutes: number,
      sessionNotes: string,
      revisedDate: string
    ) => {
      const schedule = schedules.find(s => s.id === subject.scheduleId) || schedules[0];
      const calc = calculateNextSubjectRevision(
        subject,
        rating,
        schedule,
        new Date(revisedDate + 'T00:00:00')
      );

      const updatedSubject: Subject = {
        ...subject,
        revisionStage: calc.revisionStage,
        intervalDays: calc.intervalDays,
        stability: calc.stability,
        difficulty: calc.difficulty,
        nextDueDate: calc.nextDueDate,
        status: calc.status,
        lastRevisedAt: new Date().toISOString(),
      };

      const newLog: RevisionLog = {
        id: `log-${Date.now()}`,
        subjectId: subject.id,
        subjectName: subject.name,
        categoryId: subject.categoryId,
        rating,
        durationMinutes,
        revisedDate,
        notes: sessionNotes,
        previousInterval: subject.intervalDays,
        newInterval: calc.intervalDays,
        userId: user?.uid,
        timestamp: new Date().toISOString(),
      };

      // Update state
      setSubjects(prev => prev.map(s => (s.id === subject.id ? updatedSubject : s)));
      setLogs(prev => [newLog, ...prev]);

      // Calculate token reward for this session
      const isMasteredLeap = calc.intervalDays >= 30;
      const tokenEarned = calculateSessionTokens(
        subject,
        rating,
        gamificationProfile.currentStreak,
        isMasteredLeap
      );

      // Evaluate new achievements & update profile
      const newLogsList = [newLog, ...logs];
      const newSubjectsList = subjects.map(s => (s.id === subject.id ? updatedSubject : s));

      const evaluation = evaluateAchievements(
        {
          ...gamificationProfile,
          tokens: gamificationProfile.tokens + tokenEarned.totalTokens,
          lifetimeTokensEarned: gamificationProfile.lifetimeTokensEarned + tokenEarned.totalTokens,
        },
        newSubjectsList,
        categories,
        newLogsList
      );

      setGamificationProfile(evaluation.updatedProfile);
      saveGamificationProfile(evaluation.updatedProfile);
      setAchievements(evaluation.achievementsWithProgress);

      if (evaluation.newlyUnlocked.length > 0) {
        setUnlockedCelebration(evaluation.newlyUnlocked[0]);
      }

      // Cloud Firestore sync if authenticated
      if (user) {
        syncSubject(user.uid, updatedSubject);
        syncLog(user.uid, newLog);
      }
    },
    [schedules, user, gamificationProfile, logs, subjects, categories]
  );

  // Subject management
  const handleSaveSubject = useCallback(
    (subject: Subject) => {
      const currentSubjects = subjectsRef.current;
      const currentSchedules = schedulesRef.current;
      const currentLogs = logsRef.current;

      let subjectToSave = subject;
      const prevSubject = currentSubjects.find(s => s.id === subject.id);
      if (
        prevSubject &&
        prevSubject.scheduleId !== subject.scheduleId &&
        prevSubject.nextDueDate === subject.nextDueDate &&
        prevSubject.revisionStage === subject.revisionStage &&
        subject.revisionStage >= 1
      ) {
        const targetSchedule = currentSchedules.find(sc => sc.id === subject.scheduleId);
        if (targetSchedule) {
          subjectToSave = recalculateSubjectForSchedule(subject, targetSchedule, currentLogs);
        }
      }

      setSubjects(prev => {
        const exists = prev.some(s => s.id === subjectToSave.id);
        if (exists) return prev.map(s => (s.id === subjectToSave.id ? subjectToSave : s));
        return [subjectToSave, ...prev];
      });

      if (user) {
        syncSubject(user.uid, subjectToSave);
      }
    },
    [user]
  );

  const handleDeleteSubject = useCallback(
    (subjectId: string) => {
      setSubjects(prev => prev.filter(s => s.id !== subjectId));
      if (user) {
        deleteSubjectDoc(user.uid, subjectId);
      }
    },
    [user]
  );

  // Category management
  const handleSaveCategory = useCallback(
    (category: Category) => {
      setCategories(prev => {
        const exists = prev.some(c => c.id === category.id);
        if (exists) return prev.map(c => (c.id === category.id ? category : c));
        return [...prev, category];
      });

      if (user) {
        syncCategory(user.uid, category);
      }
    },
    [user]
  );

  const handleDeleteCategory = useCallback(
    (categoryId: string) => {
      const remainingCategories = categories.filter(c => c.id !== categoryId);
      setCategories(remainingCategories);

      setSubjects(prev => {
        const nextSubjects: Subject[] = [];
        for (const subj of prev) {
          const currentIds = getSubjectCategoryIds(subj);
          if (!currentIds.includes(categoryId)) {
            nextSubjects.push(subj);
            continue;
          }

          const remainingIds = currentIds.filter(id => id !== categoryId);
          if (remainingIds.length === 0) {
            if (user) {
              deleteSubjectDoc(user.uid, subj.id);
            }
            continue;
          }

          const remainingNames = remainingIds.map(
            id => remainingCategories.find(c => c.id === id)?.name || 'General'
          );
          const updatedSubj: Subject = {
            ...subj,
            categoryId: remainingIds[0],
            categoryName: remainingNames[0],
            categoryIds: remainingIds,
            categoryNames: remainingNames,
          };
          if (user) {
            syncSubject(user.uid, updatedSubj);
          }
          nextSubjects.push(updatedSubj);
        }
        return nextSubjects;
      });

      if (user) {
        deleteCategoryDoc(user.uid, categoryId);
      }
    },
    [categories, user]
  );

  // Schedule management
  const handleSaveSchedule = useCallback(
    (schedule: RevisionSchedule) => {
      const currentSubjects = subjectsRef.current;
      const currentLogs = logsRef.current;

      setSchedules(prev => {
        const exists = prev.some(s => s.id === schedule.id);
        if (exists) return prev.map(s => (s.id === schedule.id ? schedule : s));
        return [...prev, schedule];
      });

      // Recalculate all subjects already assigned to this schedule
      const changedSubjects: Subject[] = [];
      const nextSubjects = currentSubjects.map(s => {
        if (s.scheduleId === schedule.id) {
          const recalculated = recalculateSubjectForSchedule(s, schedule, currentLogs);
          if (recalculated.intervalDays !== s.intervalDays || recalculated.nextDueDate !== s.nextDueDate) {
            changedSubjects.push(recalculated);
          }
          return recalculated;
        }
        return s;
      });

      if (changedSubjects.length > 0) {
        setSubjects(nextSubjects);
        if (user) {
          for (const updated of changedSubjects) {
            syncSubject(user.uid, updated);
          }
        }
      }

      if (user) {
        syncSchedule(user.uid, schedule);
      }
    },
    [user]
  );

  const handleDeleteSchedule = useCallback(
    (scheduleId: string) => {
      const currentSubjects = subjectsRef.current;
      setSchedules(prev => prev.filter(s => s.id !== scheduleId));

      const changedSubjects: Subject[] = [];
      const nextSubjects = currentSubjects.map(s => {
        if (s.scheduleId === scheduleId) {
          const updated = { ...s, scheduleId: 'lucidia-adaptive' };
          changedSubjects.push(updated);
          return updated;
        }
        return s;
      });

      if (changedSubjects.length > 0) {
        setSubjects(nextSubjects);
        if (user) {
          for (const updated of changedSubjects) {
            syncSubject(user.uid, updated);
          }
        }
      }

      if (user) {
        deleteScheduleDoc(user.uid, scheduleId);
      }
    },
    [user]
  );

  const handleAssignScheduleToSubject = useCallback(
    (subjectId: string, scheduleId: string) => {
      const targetSchedule = schedulesRef.current.find(sc => sc.id === scheduleId);
      const currentSubjects = subjectsRef.current;
      const currentLogs = logsRef.current;

      let updatedTarget: Subject | null = null;
      const nextSubjects = currentSubjects.map(s => {
        if (s.id === subjectId) {
          const withSchedule = { ...s, scheduleId };
          const updated = targetSchedule
            ? recalculateSubjectForSchedule(withSchedule, targetSchedule, currentLogs)
            : withSchedule;
          updatedTarget = updated;
          return updated;
        }
        return s;
      });

      setSubjects(nextSubjects);
      if (user && updatedTarget) {
        syncSubject(user.uid, updatedTarget);
      }
    },
    [user]
  );

  const handleAssignScheduleToCategory = useCallback(
    (categoryId: string, scheduleId: string) => {
      const targetSchedule = schedulesRef.current.find(sc => sc.id === scheduleId);
      const currentSubjects = subjectsRef.current;
      const currentLogs = logsRef.current;

      const updatedSubjects: Subject[] = [];
      const nextSubjects = currentSubjects.map(s => {
        if (getSubjectCategoryIds(s).includes(categoryId)) {
          const withSchedule = { ...s, scheduleId };
          const updated = targetSchedule
            ? recalculateSubjectForSchedule(withSchedule, targetSchedule, currentLogs)
            : withSchedule;
          updatedSubjects.push(updated);
          return updated;
        }
        return s;
      });

      if (updatedSubjects.length > 0) {
        setSubjects(nextSubjects);
        if (user) {
          for (const updated of updatedSubjects) {
            syncSubject(user.uid, updated);
          }
        }
      }
    },
    [user]
  );

  const handleApplyScheduleRecommendation = useCallback(
    (multiplier: number, targetRetention: number) => {
      const baseSchedule = schedulesRef.current[0];
      if (!baseSchedule) return;
      const updatedSchedule: RevisionSchedule = {
        ...baseSchedule,
        intervalMultiplier: multiplier,
        targetRetention,
      };
      handleSaveSchedule(updatedSchedule);
      handleTabChange('schedules');
    },
    [handleSaveSchedule, handleTabChange]
  );

  // AI Cognitive Audit
  const handleRefreshAIAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const activeSchedule = schedules[0];
      const response = await fetch('/api/ai/analyze-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjects,
          categories,
          revisionLogs: logs,
          activeSchedule,
        }),
      });

      if (!response.ok) {
        throw new Error(`Analysis failed with status ${response.status}`);
      }

      const result: AIAnalysisResult = await response.json();
      setAiAnalysis(result);
      saveCachedAIAnalysis(result);
    } catch (err) {
      console.error('Failed to run AI analysis:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative w-full max-w-full overflow-x-hidden selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Background Neural Canvas */}
      <div className="fixed inset-0 pointer-events-none opacity-20 z-0 overflow-hidden">
        <NeuralCanvas intensity="subtle" interactive={false} />
      </div>

      {/* Top Bar Navigation with Google Sign-In */}
      <Header
        activeTab={activeTab}
        onTabChange={handleTabChange}
        dueSubjectsCount={dueSubjectsCount}
        user={user}
        onSignInWithGoogle={signInWithGoogle}
        onSignOut={logOut}
        onOpenMobileNav={() => setIsMobileNavOpen(true)}
        tokens={gamificationProfile.tokens}
      />

      {/* Achievement Unlocked Floating Celebration Banner */}
      {unlockedCelebration && (
        <div className="fixed top-16 inset-x-3 sm:inset-x-auto sm:right-6 z-50 sm:max-w-sm sm:w-full bg-slate-900/95 backdrop-blur-md border border-amber-500/60 rounded-2xl p-4 shadow-2xl animate-bounce-subtle ring-1 ring-amber-500/40">
          <div className="flex items-start justify-between gap-3 min-w-0">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                <Trophy className="w-5 h-5 text-amber-400" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 font-mono">
                  Achievement Unlocked!
                </span>
                <h4 className="text-sm font-bold text-white leading-tight break-words">
                  {unlockedCelebration.title}
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  +{unlockedCelebration.tokenReward} Synaptic Tokens & 3D Trophy!
                </p>
              </div>
            </div>
            <button
              onClick={() => setUnlockedCelebration(null)}
              className="text-slate-400 hover:text-white p-1 shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              onClick={() => {
                handleTabChange('vault');
              }}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors flex items-center gap-1 shadow-sm"
            >
              <span>Inspect in 3D Vault</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Router */}
      <main className={`flex-1 relative z-10 w-full max-w-full overflow-x-hidden ${activeTab === 'vault' ? 'pb-0' : 'pb-16'}`}>
        {activeTab === 'calendar' && (
          <RevisionCalendar
            subjects={subjects}
            categories={categories}
            logs={logs}
            schedules={schedules}
            user={user}
            isFocusBannerDismissed={Boolean(user && dismissedFocusUid === user.uid)}
            onDismissFocusBanner={() => {
              if (user) {
                setDismissedFocusUid(user.uid);
              }
            }}
            onOpenLogSession={(subject, targetDate) => {
              setSessionModalSubject(subject);
              setSessionModalTargetDate(targetDate);
            }}
            onOpenAddSubject={preselectedDate => {
              setSessionModalSubject(null);
              setSessionModalTargetDate(undefined);
              setIsMobileNavOpen(false);
              setUnlockedCelebration(null);
              setPreselectedDateForNewSubject(preselectedDate);
              setIsAddSubjectModalOpen(true);
              setActiveTab('subjects');
            }}
          />
        )}

        {activeTab === 'subjects' && (
          <SubjectCategoryManager
            categories={categories}
            subjects={subjects}
            schedules={schedules}
            onSaveCategory={handleSaveCategory}
            onDeleteCategory={handleDeleteCategory}
            onSaveSubject={handleSaveSubject}
            onDeleteSubject={handleDeleteSubject}
            onOpenLogSession={subject => {
              setSessionModalSubject(subject);
              setSessionModalTargetDate(undefined);
            }}
            isAddModalOpenInitially={isAddSubjectModalOpen}
            preselectedDateForNew={preselectedDateForNewSubject}
            onAddModalDismissed={() => {
              setIsAddSubjectModalOpen(false);
              setPreselectedDateForNewSubject(undefined);
            }}
          />
        )}

        {activeTab === 'schedules' && (
          <CustomScheduleManager
            schedules={schedules}
            categories={categories}
            subjects={subjects}
            onSaveSchedule={handleSaveSchedule}
            onDeleteSchedule={handleDeleteSchedule}
            onAssignScheduleToSubject={handleAssignScheduleToSubject}
            onAssignScheduleToCategory={handleAssignScheduleToCategory}
          />
        )}

        {activeTab === 'analytics' && (
          <AIStatisticsDashboard
            subjects={subjects}
            categories={categories}
            logs={logs}
            schedules={schedules}
            aiAnalysis={aiAnalysis}
            onRefreshAIAnalysis={handleRefreshAIAnalysis}
            isAnalyzing={isAnalyzing}
            onApplyScheduleRecommendation={handleApplyScheduleRecommendation}
          />
        )}

        {activeTab === 'vault' && (
          <TrophyVault3D
            profile={gamificationProfile}
            onUpdateProfile={handleUpdateGamificationProfile}
            achievements={achievements}
          />
        )}
      </main>

      {/* Root-Level Slide-out Mobile Navigation Drawer */}
      <MobileNavDrawer
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        dueSubjectsCount={dueSubjectsCount}
        user={user}
        onSignInWithGoogle={signInWithGoogle}
        onSignOut={logOut}
        tokens={gamificationProfile.tokens}
        onQuickLogRevision={() => {
          const firstDue = subjects.find(s => s.nextDueDate <= todayStr) || subjects[0];
          if (firstDue) {
            setSessionModalSubject(firstDue);
            setSessionModalTargetDate(todayStr);
          } else {
            handleTabChange('calendar');
          }
        }}
        onQuickAddSubject={() => {
          setSessionModalSubject(null);
          setSessionModalTargetDate(undefined);
          setIsMobileNavOpen(false);
          setUnlockedCelebration(null);
          setPreselectedDateForNewSubject(todayStr);
          setIsAddSubjectModalOpen(true);
          setActiveTab('subjects');
        }}
      />

      {/* Log Session Modal */}
      <LogSessionModal
        subject={sessionModalSubject}
        schedules={schedules}
        targetDate={sessionModalTargetDate}
        isOpen={Boolean(sessionModalSubject)}
        onClose={() => {
          setSessionModalSubject(null);
          setSessionModalTargetDate(undefined);
        }}
        onSubmitLog={handleSubmitSessionLog}
        currentStreak={gamificationProfile.currentStreak}
      />
    </div>
  );
}
