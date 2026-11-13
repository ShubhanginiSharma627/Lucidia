import React, { useState, useMemo } from 'react';
import { User } from 'firebase/auth';
import { Subject, Category, RevisionLog, RevisionSchedule } from '../types';
import { formatDateToYYYYMMDD, formatInterval } from '../services/spacedRepetition';
import { MultiCategorySelect, subjectMatchesCategories } from './MultiCategorySelect';
import { getColorClasses, getDotColorClass, getSubjectColor, getSubjectCategories } from '../services/colors';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Plus,
  Check,
  AlertCircle,
  X,
} from 'lucide-react';

interface RevisionCalendarProps {
  subjects: Subject[];
  categories: Category[];
  logs: RevisionLog[];
  schedules: RevisionSchedule[];
  user: User | null;
  isFocusBannerDismissed?: boolean;
  onDismissFocusBanner?: () => void;
  onOpenLogSession: (subject: Subject, targetDate?: string) => void;
  onOpenAddSubject: (preselectedDate?: string) => void;
}

export const RevisionCalendar: React.FC<RevisionCalendarProps> = ({
  subjects,
  categories,
  logs,
  schedules,
  user,
  isFocusBannerDismissed = false,
  onDismissFocusBanner,
  onOpenLogSession,
  onOpenAddSubject,
}) => {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => formatDateToYYYYMMDD(new Date()));
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  const todayStr = formatDateToYYYYMMDD(new Date());

  // Top 3 most overdue past-due subjects before today (shown only when signed in)
  const mostOverdueData = useMemo(() => {
    const todayMs = new Date(todayStr + 'T00:00:00').getTime();
    const pastDue = subjects
      .filter(s => s.nextDueDate < todayStr)
      .sort((a, b) => {
        const byDate = a.nextDueDate.localeCompare(b.nextDueDate);
        if (byDate !== 0) return byDate;
        if (a.revisionStage !== b.revisionStage) return a.revisionStage - b.revisionStage;
        return a.name.localeCompare(b.name);
      });

    const topOverdue = pastDue.slice(0, 3).map(subject => {
      const dueMs = new Date(subject.nextDueDate + 'T00:00:00').getTime();
      const daysOverdue = Math.max(1, Math.round((todayMs - dueMs) / (1000 * 60 * 60 * 24)));
      return { subject, daysOverdue };
    });

    return {
      topOverdue,
      totalOverdueCount: pastDue.length,
    };
  }, [subjects, todayStr]);

  const showFocusBanner =
    Boolean(user) && !isFocusBannerDismissed && mostOverdueData.topOverdue.length > 0;

  // Filter subjects by chosen multiple categories
  const filteredSubjects = useMemo(() => {
    return subjects.filter(s => subjectMatchesCategories(s, selectedCategoryIds));
  }, [subjects, selectedCategoryIds]);

  // Year and Month
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Month navigation
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleGoToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDateStr(formatDateToYYYYMMDD(now));
  };

  // Generate calendar grid dates
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sunday
    const daysInMonth = lastDayOfMonth.getDate();

    const days: { date: Date; dateStr: string; isCurrentMonth: boolean }[] = [];

    // Preceding padding days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        date: d,
        dateStr: formatDateToYYYYMMDD(d),
        isCurrentMonth: false,
      });
    }

    // Days of current month
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      days.push({
        date: d,
        dateStr: formatDateToYYYYMMDD(d),
        isCurrentMonth: true,
      });
    }

    // Trailing padding days to fill 35 or 42 grid cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({
        date: d,
        dateStr: formatDateToYYYYMMDD(d),
        isCurrentMonth: false,
      });
    }

    return days;
  }, [year, month]);

  // Scheduled subjects and logs for the currently inspected day
  const selectedDaySubjects = useMemo(() => {
    return filteredSubjects.filter(s => s.nextDueDate === selectedDateStr);
  }, [filteredSubjects, selectedDateStr]);

  const selectedDayLogs = useMemo(() => {
    return logs.filter(l => l.revisedDate === selectedDateStr);
  }, [logs, selectedDateStr]);

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 py-4 sm:py-8 space-y-4 sm:space-y-6 overflow-hidden">
      {/* Top Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-1 flex items-center gap-2 sm:gap-2.5">
            <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400 shrink-0" />
            <span>Spaced Revision Calendar</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Interactive schedule for academic topics and subjects paced across expanding intervals.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-nowrap shrink-0 self-start md:self-auto">
          {/* Multi-Category Filter */}
          <MultiCategorySelect
            categories={categories}
            selectedCategoryIds={selectedCategoryIds}
            onChange={setSelectedCategoryIds}
            subjects={subjects}
            align="right"
          />

          <button
            onClick={() => onOpenAddSubject(selectedDateStr)}
            className="min-h-[40px] flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-sm transition-all whitespace-nowrap shrink-0 active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Subject</span>
          </button>
        </div>
      </div>

      {/* Today's Focus Banner (Logged-in users with past-due subjects) */}
      {showFocusBanner && (
        <section
          aria-label="Today's Focus"
          className="bg-slate-900/90 border border-amber-500/35 rounded-2xl p-3.5 sm:p-4 shadow-lg space-y-3 min-w-0 max-w-full"
        >
          <div className="flex items-start justify-between gap-3 min-w-0">
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 min-w-0">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <h2 className="text-sm font-bold text-white tracking-tight">
                  Today&apos;s Focus
                </h2>
                <span aria-hidden="true" className="text-slate-600 text-xs">·</span>
                <span className="text-xs font-mono tabular-nums text-amber-300/90">
                  {mostOverdueData.totalOverdueCount > 3
                    ? `Top 3 of ${mostOverdueData.totalOverdueCount} overdue`
                    : `${mostOverdueData.topOverdue.length} overdue ${
                        mostOverdueData.topOverdue.length === 1 ? 'subject' : 'subjects'
                      }`}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Prioritize your oldest missed revisions first—tap any topic to log a catch-up session.
              </p>
            </div>

            {onDismissFocusBanner && (
              <button
                type="button"
                onClick={onDismissFocusBanner}
                aria-label="Dismiss Today's Focus banner"
                className="min-w-[34px] min-h-[34px] flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 min-w-0">
            {mostOverdueData.topOverdue.map(({ subject, daysOverdue }) => {
              const subjectAccent = getSubjectColor(subject, categories);
              const primaryCategory = getSubjectCategories(subject, categories)[0];

              return (
                <button
                  key={subject.id}
                  type="button"
                  onClick={() => onOpenLogSession(subject, todayStr)}
                  className="text-left p-3 bg-slate-950/75 hover:bg-slate-950 border border-slate-800 hover:border-amber-500/45 rounded-xl transition-all flex items-center justify-between gap-2.5 min-w-0 active:scale-[0.99]"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${getDotColorClass(subjectAccent)}`} />
                      <span className="text-xs sm:text-sm font-semibold text-slate-100 truncate">
                        {subject.name}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 pl-4 text-[11px] font-mono tabular-nums text-slate-400">
                      <span className="text-amber-400 font-semibold">
                        {daysOverdue}d overdue
                      </span>
                      <span aria-hidden="true" className="text-slate-600">·</span>
                      <span>Stage {subject.revisionStage}</span>
                      {primaryCategory && (
                        <>
                          <span aria-hidden="true" className="text-slate-600">·</span>
                          <span className="truncate max-w-[120px]">{primaryCategory.name}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <span className="text-xs font-semibold text-indigo-300 shrink-0 whitespace-nowrap">
                    Log
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Zero subjects banner */}
      {subjects.length === 0 && (
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-400">
          <div>
            <strong className="text-slate-200">Revision Calendar Ready:</strong> No subjects scheduled yet. Add your curriculum subjects to begin pacing spaced revisions across future dates.
          </div>
          <button
            onClick={() => onOpenAddSubject(todayStr)}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg whitespace-nowrap shrink-0 transition-colors"
          >
            Add First Subject
          </button>
        </div>
      )}

      {/* Main Grid: Calendar Month Grid (Left 7-8 cols) & Selected Day Drawer (Right 4-5 cols) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 lg:gap-6">
        {/* Calendar Grid Container */}
        <div className="md:col-span-7 lg:col-span-8 bg-slate-900/80 border border-slate-800 rounded-2xl p-3 sm:p-4 lg:p-6 shadow-xl space-y-3 sm:space-y-4 overflow-hidden">
          {/* Month Navigation Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 sm:gap-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-100 font-mono">
                {currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </h2>
              <button
                onClick={handleGoToday}
                className="px-2.5 py-1 text-xs font-semibold text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-md transition-colors"
              >
                Today
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePrevMonth}
                className="min-w-[36px] min-h-[36px] flex items-center justify-center p-1.5 text-slate-400 hover:text-white bg-slate-950 border border-slate-800 rounded-lg hover:bg-slate-800 transition-colors"
                title="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="min-w-[36px] min-h-[36px] flex items-center justify-center p-1.5 text-slate-400 hover:text-white bg-slate-950 border border-slate-800 rounded-lg hover:bg-slate-800 transition-colors"
                title="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider py-1 font-mono">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Day Cells Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {calendarDays.map((cell, idx) => {
              const isSelected = cell.dateStr === selectedDateStr;
              const isToday = cell.dateStr === todayStr;

              // Find subjects due on this date
              const daySubjects = filteredSubjects.filter(s => s.nextDueDate === cell.dateStr);
              // Find logs on this date
              const dayLogs = logs.filter(l => l.revisedDate === cell.dateStr);

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDateStr(cell.dateStr)}
                  className={`min-h-[58px] sm:min-h-[76px] lg:min-h-[92px] p-1 sm:p-1.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500/50'
                      : cell.isCurrentMonth
                      ? 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-950'
                      : 'bg-slate-950/30 border-slate-900/60 opacity-40 hover:opacity-75'
                  }`}
                >
                  {/* Date number & Today tag */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[11px] sm:text-xs font-mono font-semibold ${
                        isToday
                          ? 'w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] sm:text-xs'
                          : cell.isCurrentMonth
                          ? 'text-slate-300'
                          : 'text-slate-600'
                      }`}
                    >
                      {cell.date.getDate()}
                    </span>

                    {dayLogs.length > 0 && (
                      <span title="Study logged on this date">
                        <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-400" />
                      </span>
                    )}
                  </div>

                  {/* Scheduled subjects chips */}
                  <div className="mt-0.5 sm:mt-1 flex-1 overflow-hidden">
                    {/* Mobile: compact colored dots */}
                    <div className="flex sm:hidden flex-wrap gap-1 mt-1 justify-center">
                      {daySubjects.slice(0, 3).map(sub => {
                        const color = getSubjectColor(sub, categories);
                        return (
                          <span
                            key={sub.id}
                            className={`w-1.5 h-1.5 rounded-full ${getDotColorClass(color)}`}
                          />
                        );
                      })}
                      {daySubjects.length > 3 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                      )}
                    </div>

                    {/* Tablet & Desktop: detailed label chips */}
                    <div className="hidden sm:block space-y-1">
                      {daySubjects.slice(0, 2).map(sub => {
                        const color = getSubjectColor(sub, categories);
                        const catNames = getSubjectCategories(sub, categories).map(c => c.name).join(', ');
                        return (
                          <div
                            key={sub.id}
                            className={`text-[10px] font-medium px-1.5 py-0.5 rounded border truncate ${getColorClasses(color)}`}
                            title={`${sub.name} (${catNames})`}
                          >
                            {sub.name}
                          </div>
                        );
                      })}

                      {daySubjects.length > 2 && (
                        <div className="text-[9px] font-mono text-slate-500 pl-1">
                          +{daySubjects.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Daily Load Meter */}
                  {daySubjects.length > 0 && (
                    <div className="w-full h-0.5 bg-slate-800 rounded-full overflow-hidden mt-0.5 sm:mt-1">
                      <div
                        className={`h-full ${
                          daySubjects.length >= 4
                            ? 'bg-rose-500'
                            : daySubjects.length >= 2
                            ? 'bg-amber-400'
                            : 'bg-indigo-400'
                        }`}
                        style={{ width: `${Math.min(100, daySubjects.length * 25)}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Inspector & Study Logger Drawer */}
        <div className="md:col-span-5 lg:col-span-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 sm:p-4 lg:p-6 shadow-xl space-y-3 sm:space-y-4 lg:space-y-5 flex flex-col justify-between overflow-hidden">
          <div className="space-y-4">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-indigo-400 font-mono">
                  {selectedDateStr === todayStr ? 'Today\'s Agenda' : 'Date Inspector'}
                </div>
                <h3 className="text-base font-bold text-white font-mono">
                  {new Date(selectedDateStr + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </h3>
              </div>

              <button
                onClick={() => onOpenAddSubject(selectedDateStr)}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-950 border border-slate-800 rounded-lg transition-colors"
                title="Schedule a subject for this date"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Scheduled Subjects for this Date */}
            <div>
              <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
                <span>Scheduled for Revision ({selectedDaySubjects.length})</span>
              </div>

              {selectedDaySubjects.length === 0 ? (
                <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl text-center text-xs text-slate-500">
                  No subjects scheduled for this date.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {selectedDaySubjects.map(subject => {
                    const subjectCats = getSubjectCategories(subject, categories);
                    const subjectAccent = getSubjectColor(subject, categories);
                    const schedule = schedules.find(s => s.id === subject.scheduleId);

                    return (
                      <div
                        key={subject.id}
                        className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex flex-wrap items-center gap-1 mb-1.5">
                              {subjectCats.map(cat => (
                                <span
                                  key={cat.id}
                                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border inline-block ${getColorClasses(cat.color)}`}
                                >
                                  {cat.name}
                                </span>
                              ))}
                            </div>
                            <h4 className="text-xs font-semibold text-slate-100 leading-snug flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full shrink-0 ${getDotColorClass(subjectAccent)}`} />
                              <span>{subject.name}</span>
                            </h4>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                          <span>Stage {subject.revisionStage} ({formatInterval(subject.intervalDays)})</span>
                          <span>·</span>
                          <span>{schedule?.name.split(' ')[0] || 'SM-2'}</span>
                        </div>

                        {/* Action: Log Revision */}
                        <button
                          onClick={() => onOpenLogSession(subject, selectedDateStr)}
                          className="w-full min-h-[44px] py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98]"
                        >
                          <Check className="w-4 h-4" />
                          <span>Log Revision Session</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Study Session Logs for this Date */}
            <div>
              <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Recorded Sessions on this Date ({selectedDayLogs.length})</span>
              </div>

              {selectedDayLogs.length === 0 ? (
                <div className="p-3 bg-slate-950/40 border border-slate-800/60 rounded-xl text-center text-xs text-slate-500">
                  No revision sessions logged on this day.
                </div>
              ) : (
                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                  {selectedDayLogs.map(log => (
                    <div
                      key={log.id}
                      className="p-2.5 bg-slate-950/60 border border-slate-800/80 rounded-xl text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-200 truncate max-w-[170px]">
                          {log.subjectName}
                        </span>
                        <span className="text-[11px] font-mono text-emerald-400 font-bold">
                          {log.durationMinutes}m
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 font-mono">
                        <span>Rating: {log.rating === 1 ? 'Again' : log.rating === 2 ? 'Hard' : log.rating === 3 ? 'Good' : 'Easy'}</span>
                        <span>·</span>
                        <span>New Interval: {formatInterval(log.newInterval)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Schedule Footer */}
          <div className="pt-3 border-t border-slate-800">
            <button
              onClick={() => onOpenAddSubject(selectedDateStr)}
              className="w-full min-h-[44px] py-2.5 bg-slate-950 hover:bg-slate-800 text-slate-300 font-semibold text-xs rounded-xl border border-slate-800 transition-colors flex items-center justify-center gap-1.5 active:scale-[0.98]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Schedule New Subject on this Date</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
