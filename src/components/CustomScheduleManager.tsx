import React, { useState, useEffect } from 'react';
import { RevisionSchedule, Category, Subject } from '../types';
import { simulateScheduleProgression } from '../services/spacedRepetition';
import { getSubjectCategoryIds } from '../services/colors';
import { Sliders, Plus, Check, Calendar, Layers, Trash2 } from 'lucide-react';

interface CustomScheduleManagerProps {
  schedules: RevisionSchedule[];
  categories: Category[];
  subjects: Subject[];
  onSaveSchedule: (schedule: RevisionSchedule) => void;
  onDeleteSchedule: (scheduleId: string) => void;
  onAssignScheduleToSubject: (subjectId: string, scheduleId: string) => void;
  onAssignScheduleToCategory: (categoryId: string, scheduleId: string) => void;
}

const DEFAULT_LADDER = [1, 3, 7, 14, 30, 60, 120];

export const CustomScheduleManager: React.FC<CustomScheduleManagerProps> = ({
  schedules,
  categories,
  subjects,
  onSaveSchedule,
  onDeleteSchedule,
  onAssignScheduleToSubject,
  onAssignScheduleToCategory,
}) => {
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>(schedules[0]?.id || 'lucidia-adaptive');
  const [isEditing, setIsEditing] = useState(false);

  const currentSchedule = schedules.find(s => s.id === selectedScheduleId) || schedules[0];
  const [formData, setFormData] = useState<RevisionSchedule>(currentSchedule);
  const [ladderInputText, setLadderInputText] = useState<string>(
    (currentSchedule?.customStepsLadder || DEFAULT_LADDER).join(', ')
  );

  // Keep selectedScheduleId valid if a schedule is deleted or schedules sync from cloud
  useEffect(() => {
    if (!isEditing) {
      const matched = schedules.find(s => s.id === selectedScheduleId);
      if (matched) {
        setFormData(matched);
        setLadderInputText((matched.customStepsLadder || DEFAULT_LADDER).join(', '));
      } else if (schedules[0]) {
        setSelectedScheduleId(schedules[0].id);
        setFormData(schedules[0]);
        setLadderInputText((schedules[0].customStepsLadder || DEFAULT_LADDER).join(', '));
      }
    }
  }, [schedules, selectedScheduleId, isEditing]);

  const handleSelectSchedule = (id: string) => {
    setSelectedScheduleId(id);
    const target = schedules.find(s => s.id === id);
    if (target) {
      setFormData(target);
      setLadderInputText((target.customStepsLadder || DEFAULT_LADDER).join(', '));
      setIsEditing(false);
    }
  };

  const handleCreateNew = () => {
    const newId = `custom-schedule-${Date.now()}`;
    const newSchedule: RevisionSchedule = {
      id: newId,
      name: 'Custom Revision Curve',
      description: 'Personalized interval expansion pacing tailored for my syllabus milestones.',
      isPreset: false,
      algorithm: 'sm2_custom',
      learningSteps: [1, 2],
      graduatingInterval: 1,
      easyInterval: 3,
      intervalMultiplier: 2.2,
      easyBonus: 1.3,
      hardPenalty: 0.8,
      lapseResetPercentage: 15,
      maximumInterval: 365,
      targetRetention: 0.90,
      useCustomSteps: true,
      customStepsLadder: [1, 3, 7, 14, 30, 60, 120],
      createdAt: new Date().toISOString(),
    };
    setFormData(newSchedule);
    setLadderInputText((newSchedule.customStepsLadder || DEFAULT_LADDER).join(', '));
    setSelectedScheduleId(newId);
    setIsEditing(true);
  };

  const handleSave = () => {
    // Parse final ladder input cleanly on save
    const parsed = ladderInputText
      .split(/[\s,]+/)
      .map(n => Math.round(parseFloat(n.trim())))
      .filter(n => !isNaN(n) && n > 0);

    const scheduleToSave: RevisionSchedule = {
      ...formData,
      customStepsLadder: parsed.length > 0 ? parsed : (formData.customStepsLadder || DEFAULT_LADDER),
    };
    onSaveSchedule(scheduleToSave);
    setFormData(scheduleToSave);
    setLadderInputText((scheduleToSave.customStepsLadder || DEFAULT_LADDER).join(', '));
    setIsEditing(false);
  };

  const activeScheduleToSimulate = isEditing ? formData : (currentSchedule || formData);
  const simulationSteps = simulateScheduleProgression(activeScheduleToSimulate, 8);

  const assignedSubjects = subjects.filter(s => s.scheduleId === activeScheduleToSimulate.id);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-5 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-1 flex items-center gap-2.5">
            <Sliders className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400 shrink-0" />
            <span>Custom Revision Schedules</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Configure spaced repetition curves, interval multipliers, and assign them directly to categories and subjects.
          </p>
        </div>

        <button
          onClick={handleCreateNew}
          className="min-h-[42px] flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-sm transition-all whitespace-nowrap shrink-0 self-stretch sm:self-start md:self-auto active:scale-[0.98]"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>New Custom Schedule</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6 lg:gap-8">
        {/* Left Column: Schedule Selection List */}
        <div className="md:col-span-5 lg:col-span-4 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Available Schedules ({schedules.length})
          </div>

          {schedules.map(schedule => {
            const isSelected = schedule.id === selectedScheduleId;
            const subjectCount = subjects.filter(s => s.scheduleId === schedule.id).length;

            return (
              <div
                key={schedule.id}
                onClick={() => handleSelectSchedule(schedule.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-indigo-950/30 border-indigo-500/50 shadow-md shadow-indigo-950/40'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <h3 className={`text-sm font-semibold ${isSelected ? 'text-indigo-300' : 'text-slate-200'}`}>
                    {schedule.name}
                  </h3>
                  {schedule.isPreset && (
                    <span className="text-[10px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded font-mono">
                      Preset
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                  {schedule.description}
                </p>

                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>Mult: {schedule.intervalMultiplier.toFixed(1)}x</span>
                  <span>·</span>
                  <span>Target: {Math.round(schedule.targetRetention * 100)}%</span>
                  <span>·</span>
                  <span>{subjectCount} {subjectCount === 1 ? 'subject' : 'subjects'}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Schedule Editor & Live Simulation */}
        <div className="md:col-span-7 lg:col-span-8 space-y-6">
          {/* Schedule Configuration Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-indigo-400" />
                  <span>{isEditing ? 'Editing Schedule Parameters' : activeScheduleToSimulate.name}</span>
                </h2>
                <div className="text-xs text-slate-400 mt-1">
                  Algorithm: <span className="font-mono text-slate-300">{activeScheduleToSimulate.algorithm}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!isEditing ? (
                  <button
                    onClick={() => {
                      setFormData(currentSchedule);
                      setLadderInputText((currentSchedule.customStepsLadder || DEFAULT_LADDER).join(', '));
                      setIsEditing(true);
                    }}
                    className="px-3.5 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    Customize Parameters
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-all"
                    >
                      Save Configuration
                    </button>
                  </>
                )}

                {!activeScheduleToSimulate.isPreset && !isEditing && (
                  <button
                    onClick={() => onDeleteSchedule(activeScheduleToSimulate.id)}
                    title="Delete schedule"
                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Editing Form vs Read-only parameters */}
            {isEditing ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Schedule Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Algorithm Model</label>
                    <select
                      value={formData.algorithm}
                      onChange={e => {
                        const nextAlgo = e.target.value as RevisionSchedule['algorithm'];
                        const shouldEnableCustomSteps =
                          nextAlgo === 'fixed_intervals' ? true : formData.useCustomSteps;
                        setFormData({
                          ...formData,
                          algorithm: nextAlgo,
                          useCustomSteps: shouldEnableCustomSteps,
                          customStepsLadder:
                            formData.customStepsLadder && formData.customStepsLadder.length > 0
                              ? formData.customStepsLadder
                              : DEFAULT_LADDER,
                        });
                      }}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="sm2_custom">SM-2 Adaptive (Ease Factor Multiplier)</option>
                      <option value="fsrs_custom">FSRS Cognitive Decay Modeling</option>
                      <option value="exponential_custom">Exponential Expansion</option>
                      <option value="fixed_intervals">Fixed Interval Ladder</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Description & Purpose</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Mathematical Sliders Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                  <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl">
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="font-semibold text-slate-300">Interval Multiplier</span>
                      <span className="font-mono text-indigo-400">{formData.intervalMultiplier.toFixed(2)}x</span>
                    </div>
                    <input
                      type="range"
                      min="1.2"
                      max="3.5"
                      step="0.05"
                      value={formData.intervalMultiplier}
                      onChange={e => setFormData({ ...formData, intervalMultiplier: parseFloat(e.target.value) })}
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                    <div className="text-[11px] text-slate-500 mt-1">
                      Controls how rapidly calendar spacing expands on consecutive Good revisions.
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl">
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="font-semibold text-slate-300">Target Retention Rate</span>
                      <span className="font-mono text-emerald-400">{Math.round(formData.targetRetention * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.80"
                      max="0.98"
                      step="0.01"
                      value={formData.targetRetention}
                      onChange={e => setFormData({ ...formData, targetRetention: parseFloat(e.target.value) })}
                      className="w-full accent-emerald-500 cursor-pointer"
                    />
                    <div className="text-[11px] text-slate-500 mt-1">
                      Higher targets compress calendar intervals to avoid forgetting risk.
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl">
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="font-semibold text-slate-300">Easy Rating Bonus</span>
                      <span className="font-mono text-indigo-300">{formData.easyBonus.toFixed(2)}x</span>
                    </div>
                    <input
                      type="range"
                      min="1.1"
                      max="2.0"
                      step="0.05"
                      value={formData.easyBonus}
                      onChange={e => setFormData({ ...formData, easyBonus: parseFloat(e.target.value) })}
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                    <div className="text-[11px] text-slate-500 mt-1">
                      Additional spacing jump when rating comprehension "Easy".
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl">
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="font-semibold text-slate-300">Lapse Memory Retention %</span>
                      <span className="font-mono text-amber-400">{formData.lapseResetPercentage}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      step="5"
                      value={formData.lapseResetPercentage}
                      onChange={e => setFormData({ ...formData, lapseResetPercentage: parseInt(e.target.value, 10) })}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                    <div className="text-[11px] text-slate-500 mt-1">
                      Portion of interval preserved when rating "Again".
                    </div>
                  </div>
                </div>

                {/* Custom Step Ladder Array */}
                <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-200">
                        Custom Step Interval Sequence (Days)
                      </label>
                      <p className="text-[11px] text-slate-500">
                        Explicit sequence of days (comma-separated) for milestone pacing.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          useCustomSteps: !(formData.useCustomSteps || formData.algorithm === 'fixed_intervals'),
                        })
                      }
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors flex items-center gap-1.5 ${
                        formData.useCustomSteps || formData.algorithm === 'fixed_intervals'
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                          : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          formData.useCustomSteps || formData.algorithm === 'fixed_intervals'
                            ? 'bg-emerald-400'
                            : 'bg-slate-600'
                        }`}
                      />
                      <span>
                        {formData.useCustomSteps || formData.algorithm === 'fixed_intervals'
                          ? 'Custom Steps Active'
                          : 'Use Custom Steps'}
                      </span>
                    </button>
                  </div>

                  <input
                    type="text"
                    value={ladderInputText}
                    onChange={e => {
                      const raw = e.target.value;
                      setLadderInputText(raw);
                      const parsed = raw
                        .split(/[\s,]+/)
                        .map(n => Math.round(parseFloat(n.trim())))
                        .filter(n => !isNaN(n) && n > 0);
                      if (parsed.length > 0) {
                        const maxParsed = Math.max(...parsed);
                        setFormData({
                          ...formData,
                          useCustomSteps: true,
                          customStepsLadder: parsed,
                          maximumInterval: Math.max(formData.maximumInterval, maxParsed),
                        });
                      } else {
                        setFormData({
                          ...formData,
                          customStepsLadder: [],
                        });
                      }
                    }}
                    placeholder="e.g. 1, 3, 7, 14, 30, 60, 120"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                  />

                  {/* Live Parsed Steps Preview */}
                  {formData.customStepsLadder && formData.customStepsLadder.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mr-1">
                        Active Sequence:
                      </span>
                      {formData.customStepsLadder.map((days, idx) => (
                        <span
                          key={`${idx}-${days}`}
                          className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/15 border border-indigo-500/30 text-indigo-300"
                        >
                          S{idx + 1}: {days}d
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-950/50 border border-slate-800/80 rounded-xl">
                  <div className="text-[11px] text-slate-500">Multiplier</div>
                  <div className="text-lg font-bold text-white font-mono">{activeScheduleToSimulate.intervalMultiplier.toFixed(2)}x</div>
                </div>
                <div className="p-3 bg-slate-950/50 border border-slate-800/80 rounded-xl">
                  <div className="text-[11px] text-slate-500">Target Retention</div>
                  <div className="text-lg font-bold text-emerald-400 font-mono">
                    {Math.round(activeScheduleToSimulate.targetRetention * 100)}%
                  </div>
                </div>
                <div className="p-3 bg-slate-950/50 border border-slate-800/80 rounded-xl">
                  <div className="text-[11px] text-slate-500">Easy Bonus</div>
                  <div className="text-lg font-bold text-indigo-300 font-mono">{activeScheduleToSimulate.easyBonus.toFixed(2)}x</div>
                </div>
                <div className="p-3 bg-slate-950/50 border border-slate-800/80 rounded-xl">
                  <div className="text-[11px] text-slate-500">Max Interval</div>
                  <div className="text-lg font-bold text-slate-300 font-mono">{activeScheduleToSimulate.maximumInterval}d</div>
                </div>
              </div>
            )}
          </div>

          {/* Live Schedule Progression Simulator Visualizer */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  <span>Subject Interval Progression Simulation</span>
                </h3>
                <div className="text-xs text-slate-400">
                  Projected calendar spacing expansion over consecutive Good revisions
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {(activeScheduleToSimulate.useCustomSteps || activeScheduleToSimulate.algorithm === 'fixed_intervals') &&
                  activeScheduleToSimulate.customStepsLadder &&
                  activeScheduleToSimulate.customStepsLadder.length > 0 && (
                    <div className="text-[11px] font-mono text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 px-2.5 py-1 rounded-md">
                      Custom Steps ({activeScheduleToSimulate.customStepsLadder.slice(0, 5).join(', ')}
                      {activeScheduleToSimulate.customStepsLadder.length > 5 ? ', …' : ''})
                    </div>
                  )}
                <div className="text-xs font-mono text-emerald-400/90 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md">
                  30d Milestone at Review #{simulationSteps.find(s => s.intervalDays >= 30)?.step || 5}
                </div>
              </div>
            </div>

            <div className="space-y-2.5 mb-4">
              {simulationSteps.map(step => {
                const maxIntervalInSim = simulationSteps[simulationSteps.length - 1]?.intervalDays || 100;
                const percentage = Math.min(100, Math.max(6, (step.intervalDays / maxIntervalInSim) * 100));

                return (
                  <div key={step.step} className="flex items-center gap-3 text-xs">
                    <span className="w-16 font-mono text-slate-400 shrink-0">Stage #{step.step}</span>
                    <div className="flex-1 h-6 bg-slate-950 rounded-md overflow-hidden relative border border-slate-800/80">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-md transition-all duration-300 flex items-center justify-end px-2"
                        style={{ width: `${percentage}%`, minWidth: '2.75rem' }}
                      >
                        <span className="font-mono text-[11px] text-white font-semibold tabular-nums drop-shadow whitespace-nowrap">
                          {step.formatted}
                        </span>
                      </div>
                    </div>
                    <span className="w-16 text-right font-mono text-slate-400 text-[11px] tabular-nums shrink-0">
                      {step.intervalDays}d
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Assigned Categories & Subjects */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>Assigned Categories & Subjects ({assignedSubjects.length})</span>
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Apply this revision schedule to entire categories or individual academic subjects:
            </p>

            {/* Category Bulk Assignment */}
            <div className="space-y-2 pt-1">
              <div className="text-xs font-semibold text-slate-300">Assign to Entire Category:</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {categories.map(cat => {
                  const subsInCat = subjects.filter(s => getSubjectCategoryIds(s).includes(cat.id));
                  const isAllAssigned = subsInCat.length > 0 && subsInCat.every(s => s.scheduleId === activeScheduleToSimulate.id);

                  return (
                    <div
                      key={cat.id}
                      className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between gap-2"
                    >
                      <div className="truncate">
                        <div className="text-xs font-semibold text-slate-200 truncate">{cat.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{subsInCat.length} subjects</div>
                      </div>

                      <button
                        onClick={() => onAssignScheduleToCategory(cat.id, activeScheduleToSimulate.id)}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors shrink-0 ${
                          isAllAssigned
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                      >
                        {isAllAssigned ? 'Active' : 'Apply'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Subject Direct Assignment */}
            <div className="space-y-2 pt-3 border-t border-slate-800">
              <div className="text-xs font-semibold text-slate-300">Individual Subject Overrides:</div>
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {subjects.map(subject => {
                  const isAssigned = subject.scheduleId === activeScheduleToSimulate.id;

                  return (
                    <div
                      key={subject.id}
                      className="flex items-center justify-between p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl"
                    >
                      <div className="truncate mr-2">
                        <div className="text-xs font-medium text-slate-200 truncate">{subject.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono truncate">
                          {subject.categoryNames && subject.categoryNames.length > 0
                            ? subject.categoryNames.join(', ')
                            : subject.categoryName}
                          {' · '}Stage {subject.revisionStage} ({subject.intervalDays}d)
                        </div>
                      </div>

                      <button
                        onClick={() => onAssignScheduleToSubject(subject.id, activeScheduleToSimulate.id)}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors shrink-0 flex items-center gap-1 ${
                          isAssigned
                            ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                      >
                        {isAssigned ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>Active</span>
                          </>
                        ) : (
                          <span>Assign</span>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
