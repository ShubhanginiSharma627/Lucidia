import React, { useState } from 'react';
import { Subject, Rating, RevisionSchedule } from '../types';
import { calculateNextSubjectRevision, formatInterval, formatDateToYYYYMMDD } from '../services/spacedRepetition';
import { calculateSessionTokens } from '../services/gamification';
import { X, Check, Clock, Sparkles, AlertCircle, Coins } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl space-y-4 sm:space-y-5 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-800">
          <div>
            <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider font-mono">
              {subject.categoryNames && subject.categoryNames.length > 0
                ? subject.categoryNames.join(' · ')
                : subject.categoryName}
            </span>
            <h3 className="text-base font-bold text-white leading-snug">
              Log Revision: {subject.name}
            </h3>
          </div>

          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Rating Buttons */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Recall & Comprehension Rating
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* 1: Again */}
              <button
                type="button"
                onClick={() => setRating(1)}
                className={`min-h-[50px] p-2 sm:p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center ${
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
                className={`min-h-[50px] p-2 sm:p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center ${
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
                className={`min-h-[50px] p-2 sm:p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center ${
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
                className={`min-h-[50px] p-2 sm:p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center ${
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
          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
            <span className="text-slate-400">Next Calendar Revision Date:</span>
            <div className="font-mono text-right">
              <span className="font-bold text-white">{calculation.nextDueDate}</span>
              <span className="text-slate-500 ml-1.5">(+{formatInterval(calculation.intervalDays)})</span>
            </div>
          </div>

          {/* Gamified Token Reward Preview */}
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-amber-300 font-medium">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>Session Reward:</span>
            </span>
            <span className="font-mono font-bold text-amber-400">
              +{tokenEst.totalTokens} Synaptic Tokens
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Duration Slider */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-semibold text-slate-300">Study Duration</span>
                <span className="font-mono text-emerald-400 font-bold">{durationMinutes} mins</span>
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
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Session Date
              </label>
              <input
                type="date"
                value={revisedDate}
                onChange={e => setRevisedDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Notes / Feynman Summary */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Revision Notes & Active Recall Insights (Optional)
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Mastered the core proof, but need to re-verify boundary condition during next review..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 sm:gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto min-h-[44px] px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto min-h-[44px] px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
            >
              <Check className="w-4 h-4" />
              <span>Record & Book Next Date</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
