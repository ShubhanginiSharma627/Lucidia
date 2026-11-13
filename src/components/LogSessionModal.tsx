import React, { useState, useEffect } from 'react';
import { Subject, Rating, RevisionSchedule } from '../types';
import { calculateNextSubjectRevision, formatInterval, formatDateToYYYYMMDD } from '../services/spacedRepetition';
import { calculateSessionTokens } from '../services/gamification';
import { Check, Coins } from 'lucide-react';
import { ModalShell } from './ModalShell';

interface LogSessionModalProps {
  subject: Subject | null;
  schedules: RevisionSchedule[];
  targetDate?: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmitLog: (
    subject: Subject,
    rating: Rating,
    durationMinutes: number,
    notes: string,
    revisedDate: string
  ) => void;
  currentStreak?: number;
}

export const LogSessionModal: React.FC<LogSessionModalProps> = ({
  subject,
  schedules,
  targetDate,
  isOpen,
  onClose,
  onSubmitLog,
  currentStreak = 0,
}) => {
  const [rating, setRating] = useState<Rating>(3); // default Good
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [notes, setNotes] = useState('');
  const [revisedDate, setRevisedDate] = useState(() => targetDate || formatDateToYYYYMMDD(new Date()));

  useEffect(() => {
    if (isOpen) {
      setRating(3);
      setDurationMinutes(25);
      setNotes('');
      setRevisedDate(targetDate || formatDateToYYYYMMDD(new Date()));
    }
  }, [isOpen, subject?.id, targetDate]);

  if (!isOpen || !subject) return null;

  const schedule = schedules.find(s => s.id === subject.scheduleId) || schedules[0];
  const calculation = calculateNextSubjectRevision(subject, rating, schedule, new Date(revisedDate + 'T00:00:00'));
  const isMasteredLeap = calculation.intervalDays >= 30;
  const tokenEst = calculateSessionTokens(subject, rating, currentStreak, isMasteredLeap);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitLog(subject, rating, durationMinutes, notes, revisedDate);
    onClose();
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      maxWidthClass="max-w-lg"
      closeAriaLabel="Close log session dialog"
      subtitle={
        <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider font-mono block truncate">
          {subject.categoryNames && subject.categoryNames.length > 0
            ? subject.categoryNames.join(' · ')
            : subject.categoryName}
        </span>
      }
      title={`Log Revision: ${subject.name}`}
    >
      <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 min-w-0 max-w-full">
        {/* Scrollable Body */}
        <div className="flex-1 min-h-0 min-w-0 max-w-full overflow-y-auto overflow-x-hidden px-4 sm:px-5 py-3.5 space-y-3.5">
          {/* Rating Buttons */}
          <div className="min-w-0">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Recall &amp; Comprehension Rating
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* 1: Again */}
              <button
                type="button"
                onClick={() => setRating(1)}
                className={`min-h-[46px] p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center ${
                  rating === 1
                    ? 'bg-rose-500/20 border-rose-500 text-rose-200 ring-1 ring-rose-500/50'
                    : 'bg-slate-950/70 border-slate-800 text-rose-400/80 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-semibold">Again</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Reset Stage</div>
              </button>

              {/* 2: Hard */}
              <button
                type="button"
                onClick={() => setRating(2)}
                className={`min-h-[46px] p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center ${
                  rating === 2
                    ? 'bg-amber-500/20 border-amber-500 text-amber-200 ring-1 ring-amber-500/50'
                    : 'bg-slate-950/70 border-slate-800 text-amber-400/80 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-semibold">Hard</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Slow Spacing</div>
              </button>

              {/* 3: Good */}
              <button
                type="button"
                onClick={() => setRating(3)}
                className={`min-h-[46px] p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center ${
                  rating === 3
                    ? 'bg-indigo-500/25 border-indigo-500 text-indigo-200 ring-1 ring-indigo-500/50'
                    : 'bg-slate-950/70 border-slate-800 text-indigo-400/80 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-semibold">Good</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Standard Pace</div>
              </button>

              {/* 4: Easy */}
              <button
                type="button"
                onClick={() => setRating(4)}
                className={`min-h-[46px] p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center ${
                  rating === 4
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500/50'
                    : 'bg-slate-950/70 border-slate-800 text-emerald-400/80 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-semibold">Easy</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Bonus Leap</div>
              </button>
            </div>
          </div>

          {/* Next Revision Projection Banner */}
          <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between text-xs gap-2 min-w-0">
            <span className="text-slate-400">Next Calendar Revision Date:</span>
            <div className="font-mono text-right tabular-nums shrink-0">
              <span className="font-bold text-white">{calculation.nextDueDate}</span>
              <span className="text-slate-500 ml-1.5">(+{formatInterval(calculation.intervalDays)})</span>
            </div>
          </div>

          {/* Gamified Token Reward Preview */}
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex flex-wrap items-center justify-between text-xs gap-2 min-w-0">
            <span className="flex items-center gap-1.5 text-amber-300 font-medium">
              <Coins className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Session Reward:</span>
            </span>
            <span className="font-mono font-bold text-amber-400 tabular-nums shrink-0">
              +{tokenEst.totalTokens} Synaptic Tokens
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
            {/* Duration Slider */}
            <div className="min-w-0">
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-semibold text-slate-300">Study Duration</span>
                <span className="font-mono text-emerald-400 font-bold tabular-nums">{durationMinutes} mins</span>
              </div>
              <input
                type="range"
                min="5"
                max="120"
                step="5"
                value={durationMinutes}
                onChange={e => setDurationMinutes(parseInt(e.target.value, 10))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* Date Revised */}
            <div className="min-w-0">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Session Date
              </label>
              <input
                type="date"
                value={revisedDate}
                onChange={e => setRevisedDate(e.target.value)}
                className="block w-full min-w-0 max-w-full box-border px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Notes / Feynman Summary */}
          <div className="min-w-0">
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Revision Notes &amp; Active Recall Insights (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Mastered the core proof, but need to re-verify boundary condition during next review..."
              className="w-full min-w-0 max-w-full box-border px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="shrink-0 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-2.5 px-4 sm:px-5 py-3 bg-slate-900/95 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto min-h-[40px] px-4 py-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="w-full sm:w-auto min-h-[40px] px-5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
          >
            <Check className="w-4 h-4 shrink-0" />
            <span>Record &amp; Book Next Date</span>
          </button>
        </div>
      </form>
    </ModalShell>
  );
};
