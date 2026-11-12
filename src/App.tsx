import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import { calculateNextSubjectRevision, formatDateToYYYYMMDD } from './services/spacedRepetition';
import { Header, NavTab } from './components/Header';
import { MobileNavDrawer } from './components/MobileNavDrawer';
import { RevisionCalendar } from './components/RevisionCalendar';
import { SubjectCategoryManager } from './components/SubjectCategoryManager';
import { CustomScheduleManager } from './components/CustomScheduleManager';
import { AIStatisticsDashboard } from './components/AIStatisticsDashboard';
import { LogSessionModal } from './components/LogSessionModal';
import { NeuralCanvas } from './components/NeuralCanvas';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [categories, setCategories] = useState<Category[]>(() => getCategories());
  const [subjects, setSubjects] = useState<Subject[]>(() => getSubjects());
  const [schedules, setSchedules] = useState<RevisionSchedule[]>(() => getSchedules());
  const [logs, setLogs] = useState<RevisionLog[]>(() => getRevisionLogs());
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(() => getCachedAIAnalysis());

  const [activeTab, setActiveTab] = useState<NavTab>('calendar');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Modals state
  const [sessionModalSubject, setSessionModalSubject] = useState<Subject | null>(null);
  const [sessionModalTargetDate, setSessionModalTargetDate] = useState<string | undefined>(undefined);
  const [preselectedDateForNewSubject, setPreselectedDateForNewSubject] = useState<string | undefined>(undefined);
  const [isAddSubjectModalOpen, setIsAddSubjectModalOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Auth listener & Firestore live sync
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, currentUser => {
      setUser(currentUser);
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
            if (remoteScheds.length > 0) {
              setSchedules(remoteScheds);
              saveSchedules(remoteScheds);
            }
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

      // Cloud Firestore sync if authenticated
      if (user) {
        syncSubject(user.uid, updatedSubject);
        syncLog(user.uid, newLog);
      }
    },
    [schedules, user]
  );

  // Subject management
  const handleSaveSubject = useCallback(
    (subject: Subject) => {
      setSubjects(prev => {
        const exists = prev.some(s => s.id === subject.id);
        if (exists) return prev.map(s => (s.id === subject.id ? subject : s));
        return [subject, ...prev];
      });

      if (user) {
        syncSubject(user.uid, subject);
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
      setCategories(prev => prev.filter(c => c.id !== categoryId));
      setSubjects(prev => prev.filter(s => s.categoryId !== categoryId));
      if (user) {
        deleteCategoryDoc(user.uid, categoryId);
      }
    },
    [user]
  );

  // Schedule management
  const handleSaveSchedule = useCallback(
    (schedule: RevisionSchedule) => {
      setSchedules(prev => {
        const exists = prev.some(s => s.id === schedule.id);
        if (exists) return prev.map(s => (s.id === schedule.id ? schedule : s));
        return [...prev, schedule];
      });

      if (user) {
        syncSchedule(user.uid, schedule);
      }
    },
    [user]
  );

  const handleDeleteSchedule = useCallback(
    (scheduleId: string) => {
      setSchedules(prev => prev.filter(s => s.id !== scheduleId));
      setSubjects(prev =>
        prev.map(s => (s.scheduleId === scheduleId ? { ...s, scheduleId: 'lucidia-adaptive' } : s))
      );
      if (user) {
        deleteScheduleDoc(user.uid, scheduleId);
      }
    },
    [user]
  );

  const handleAssignScheduleToSubject = useCallback(
    (subjectId: string, scheduleId: string) => {
      setSubjects(prev =>
        prev.map(s => {
          if (s.id === subjectId) {
            const updated = { ...s, scheduleId };
            if (user) syncSubject(user.uid, updated);
            return updated;
          }
          return s;
        })
      );
    },
    [user]
  );

  const handleAssignScheduleToCategory = useCallback(
    (categoryId: string, scheduleId: string) => {
      setSubjects(prev =>
        prev.map(s => {
          if (s.categoryId === categoryId) {
            const updated = { ...s, scheduleId };
            if (user) syncSubject(user.uid, updated);
            return updated;
          }
          return s;
        })
      );
    },
    [user]
  );

  const handleApplyScheduleRecommendation = useCallback(
    (multiplier: number, targetRetention: number) => {
      setSchedules(prev => {
        return prev.map((s, idx) => {
          if (idx === 0) {
            const updated = {
              ...s,
              intervalMultiplier: multiplier,
              targetRetention,
            };
            if (user) syncSchedule(user.uid, updated);
            return updated;
          }
          return s;
        });
      });
      setActiveTab('schedules');
    },
    [user]
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Background Neural Canvas */}
      <div className="fixed inset-0 pointer-events-none opacity-20 z-0 overflow-hidden">
        <NeuralCanvas intensity="subtle" interactive={false} />
      </div>

      {/* Top Bar Navigation with Google Sign-In */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        dueSubjectsCount={dueSubjectsCount}
        user={user}
        onSignInWithGoogle={signInWithGoogle}
        onSignOut={logOut}
        onOpenMobileNav={() => setIsMobileNavOpen(true)}
      />

      {/* Main Content Router */}
      <main className="flex-1 relative z-10 pb-16">
        {activeTab === 'calendar' && (
          <RevisionCalendar
            subjects={subjects}
            categories={categories}
            logs={logs}
            schedules={schedules}
            onOpenLogSession={(subject, targetDate) => {
              setSessionModalSubject(subject);
              setSessionModalTargetDate(targetDate);
            }}
            onOpenAddSubject={preselectedDate => {
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
      </main>

      {/* Root-Level Slide-out Mobile Navigation Drawer */}
      <MobileNavDrawer
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        dueSubjectsCount={dueSubjectsCount}
        user={user}
        onSignInWithGoogle={signInWithGoogle}
        onSignOut={logOut}
        onQuickLogRevision={() => {
          const firstDue = subjects.find(s => s.nextDueDate <= todayStr) || subjects[0];
          if (firstDue) {
            setSessionModalSubject(firstDue);
            setSessionModalTargetDate(todayStr);
          } else {
            setActiveTab('calendar');
          }
        }}
        onQuickAddSubject={() => {
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
        onClose={() => setSessionModalSubject(null)}
        onSubmitLog={handleSubmitSessionLog}
      />
    </div>
  );
}
