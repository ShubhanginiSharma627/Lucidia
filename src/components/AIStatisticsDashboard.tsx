import React, { useState } from 'react';
import { Subject, Category, RevisionLog, RevisionSchedule, AIAnalysisResult } from '../types';
import { calculateCurrentRetention, formatInterval } from '../services/spacedRepetition';
import { Brain, Sparkles, TrendingUp, Target, ShieldCheck, Zap, Layers, Clock, ArrowRight } from 'lucide-react';

interface AIStatisticsDashboardProps {
  subjects: Subject[];
  categories: Category[];
  logs: RevisionLog[];
  schedules: RevisionSchedule[];
  aiAnalysis: AIAnalysisResult | null;
  onRefreshAIAnalysis: () => Promise<void>;
  isAnalyzing: boolean;
  onApplyScheduleRecommendation: (multiplier: number, retention: number) => void;
}

export const AIStatisticsDashboard: React.FC<AIStatisticsDashboardProps> = ({
  subjects,
  categories,
  logs,
  schedules,
  aiAnalysis,
  onRefreshAIAnalysis,
  isAnalyzing,
  onApplyScheduleRecommendation,
}) => {
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  const filteredSubjects = selectedCategoryFilter === 'all'
    ? subjects
    : subjects.filter(s => s.categoryId === selectedCategoryFilter);

  const filteredLogs = selectedCategoryFilter === 'all'
    ? logs
    : logs.filter(l => l.categoryId === selectedCategoryFilter);

  const totalSubjects = filteredSubjects.length;
  const masteredSubjects = filteredSubjects.filter(s => s.intervalDays >= 30).length;
  const dueSubjects = filteredSubjects.filter(s => s.status === 'due').length;

  const now = new Date();
  const avgRetention = filteredSubjects.length > 0
    ? (filteredSubjects.reduce((acc, s) => acc + calculateCurrentRetention(s, now), 0) / filteredSubjects.length) * 100
    : 0;

  const recentLogs = filteredLogs.slice(-40);
  const correctReviews = recentLogs.filter(l => l.rating >= 3).length;
  const accuracyRate = recentLogs.length > 0 ? Math.round((correctReviews / recentLogs.length) * 100) : 0;

  // Total study time logged
  const totalMinutesStudied = logs.reduce((acc, l) => acc + (l.durationMinutes || 0), 0);

  // Configurable longitudinal history range (7 or 14 days)
  const [historyDays, setHistoryDays] = useState<7 | 14>(14);

  const dailyHistory: {
    date: string;
    dayLabel: string;
    dateLabel: string;
    count: number;
    minutes: number;
    accuracy: number | null;
  }[] = [];

  for (let i = historyDays - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const dateStr = d.toISOString().slice(0, 10);
    const dayLogs = filteredLogs.filter(l => l.revisedDate === dateStr);
    const dayCorrect = dayLogs.filter(l => l.rating >= 3).length;
    const dayAccuracy = dayLogs.length > 0 ? Math.round((dayCorrect / dayLogs.length) * 100) : null;
    const dayMinutes = dayLogs.reduce((acc, l) => acc + (l.durationMinutes || 0), 0);

    dailyHistory.push({
      date: dateStr,
      dayLabel: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dateLabel: `${d.getMonth() + 1}/${d.getDate()}`,
      count: dayLogs.length,
      minutes: dayMinutes,
      accuracy: dayAccuracy,
    });
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-5 sm:space-y-8">
      {/* Top Banner & AI Run CTA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-6 bg-slate-900/90 border border-slate-800 rounded-2xl relative overflow-hidden shadow-2xl">
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Brain className="w-4 h-4" />
            <span>Integrated AI Cognitive Learning Intelligence</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-2">
            Subject Memory Retention & Spacing Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
            Ebbinghaus forgetting curve modeling, synaptic stability indices, and Gemini-powered cognitive audits across your subject revision calendar.
          </p>
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 shrink-0">
          <select
            value={selectedCategoryFilter}
            onChange={e => setSelectedCategoryFilter(e.target.value)}
            className="min-h-[44px] px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-medium text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Categories ({subjects.length})</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <button
            onClick={onRefreshAIAnalysis}
            disabled={isAnalyzing}
            className="min-h-[44px] flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800/50 rounded-xl shadow-sm transition-all active:scale-[0.98]"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>{isAnalyzing ? 'Analyzing Retention Patterns...' : 'Run Cognitive Audit'}</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-5 bg-slate-900/70 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Estimated Retention Rate</span>
            <Target className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-emerald-400 font-mono tabular-nums">
            {totalSubjects > 0 ? `${avgRetention.toFixed(1)}%` : '--'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Current memory retrievability index
          </div>
        </div>

        <div className="p-5 bg-slate-900/70 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Revision Evaluation Accuracy</span>
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-indigo-300 font-mono tabular-nums">
            {recentLogs.length > 0 ? `${accuracyRate}%` : '--'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Across recent {recentLogs.length} revision sessions
          </div>
        </div>

        <div className="p-5 bg-slate-900/70 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Mastered Subjects</span>
            <Zap className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white font-mono tabular-nums">
            {masteredSubjects}
            <span className="text-xs font-normal text-slate-500 ml-1.5 font-sans">
              / {totalSubjects} ({totalSubjects > 0 ? Math.round((masteredSubjects / totalSubjects) * 100) : 0}%)
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Interval &gt; 30 days on calendar
          </div>
        </div>

        <div className="p-5 bg-slate-900/70 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Total Study Time</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-amber-400 font-mono tabular-nums">
            {Math.round(totalMinutesStudied / 60)}h {totalMinutesStudied % 60}m
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Recorded in study session logs
          </div>
        </div>
      </div>

      {/* AI Cognitive Coach Insights Panel */}
      {aiAnalysis && (
        <div className="bg-indigo-950/20 border border-indigo-500/30 rounded-2xl p-6 sm:p-7 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-indigo-500/20">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Lucidia Intel — Cognitive Audit & Diagnostic
                </h3>
                <div className="text-xs text-indigo-300/80">
                  Evaluated at {new Date(aiAnalysis.analyzedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">Cognitive Load:</span>
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                  aiAnalysis.cognitiveLoadRisk === 'Optimal'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                }`}
              >
                {aiAnalysis.cognitiveLoadRisk}
              </span>
            </div>
          </div>

          <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap bg-slate-950/40 p-4 rounded-xl border border-slate-800">
            {aiAnalysis.cognitiveAudit}
          </div>

          {aiAnalysis.scheduleRecommendations && (
            <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                  Algorithmic Schedule Tuning
                </div>
                <div className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                  {aiAnalysis.scheduleRecommendations.rationale}
                </div>
                <div className="flex items-center gap-3 text-xs font-mono text-slate-400 pt-1">
                  <span>Recommended Multiplier: <strong className="text-white">{aiAnalysis.scheduleRecommendations.recommendedMultiplier}x</strong></span>
                  <span>·</span>
                  <span>Target Retention: <strong className="text-emerald-400">{Math.round(aiAnalysis.scheduleRecommendations.recommendedRetentionTarget * 100)}%</strong></span>
                </div>
              </div>

              <button
                onClick={() => onApplyScheduleRecommendation(
                  aiAnalysis.scheduleRecommendations.recommendedMultiplier,
                  aiAnalysis.scheduleRecommendations.recommendedRetentionTarget
                )}
                className="px-3.5 py-2 text-xs font-semibold text-indigo-200 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 rounded-lg whitespace-nowrap shrink-0 transition-colors"
              >
                Apply to Active Schedule
              </button>
            </div>
          )}

          {aiAnalysis.subjectInsights && aiAnalysis.subjectInsights.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-3">
                Subject Tactical Guidance
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {aiAnalysis.subjectInsights.map((insight, idx) => (
                  <div key={idx} className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                    <div className="text-xs font-bold text-slate-200">
                      {insight.subjectName}
                    </div>
                    <div className="text-xs text-amber-300/90">
                      <strong>Diagnosis:</strong> {insight.issue}
                    </div>
                    <div className="text-xs text-slate-400">
                      <strong>Recommendation:</strong> {insight.recommendation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Longitudinal Visualizers Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          {/* Longitudinal Study Time & Accuracy */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>{historyDays}-Day Revision Sessions & Recall Accuracy</span>
                </h3>
                <div className="text-xs text-slate-400 mt-0.5">
                  Daily logged revision volume (bars) and evaluation accuracy % (line)
                </div>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                {/* 7D / 14D Range Switcher */}
                <div className="flex items-center bg-slate-950/80 border border-slate-800 rounded-lg p-0.5 text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => setHistoryDays(7)}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      historyDays === 7 ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    7 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => setHistoryDays(14)}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      historyDays === 14 ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    14 Days
                  </button>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-3 text-xs text-slate-400 bg-slate-950/70 border border-slate-800/80 rounded-lg px-3 py-1.5 whitespace-nowrap">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-indigo-500 rounded-sm" />
                    Sessions
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-1 bg-emerald-400 rounded-full" />
                    Accuracy %
                  </span>
                </div>
              </div>
            </div>

            {/* Scrollable Container on Mobile */}
            <div className="w-full overflow-x-auto pb-2 scrollbar-thin">
              {(() => {
                const chartWidth = historyDays === 7 ? 480 : 700;
                const chartHeight = 175;
                const slotWidth = chartWidth / historyDays;
                const barWidth = historyDays === 7 ? 36 : 24;
                const maxCount = Math.max(4, ...dailyHistory.map(d => d.count));
                const baselineY = 135;
                const maxBarHeight = 88;

                // Active points with actual logs & valid accuracy
                const activePoints = dailyHistory
                  .map((day, idx) => {
                    if (day.count === 0 || day.accuracy === null) return null;
                    const x = idx * slotWidth + slotWidth / 2;
                    const normAcc = Math.max(0, Math.min(1, day.accuracy / 100));
                    const y = baselineY - normAcc * 95;
                    return { x, y, day };
                  })
                  .filter((p): p is { x: number; y: number; day: typeof dailyHistory[0] } => p !== null);

                return (
                  <svg
                    className="w-full h-52 overflow-visible"
                    style={{ minWidth: historyDays === 7 ? '360px' : '560px' }}
                    viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                    preserveAspectRatio="xMidYMid meet"
                  >
                    <defs>
                      <linearGradient id="subjBarGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity="0.9" />
                        <stop offset="100%" stopColor="#3730a3" stopOpacity="0.3" />
                      </linearGradient>
                      <filter id="emeraldGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#10b981" floodOpacity="0.5" />
                      </filter>
                    </defs>

                    {/* Horizontal reference dashed lines */}
                    <line x1="10" y1="40" x2={chartWidth - 10} y2="40" stroke="#1e293b" strokeDasharray="4 4" strokeWidth="1" />
                    <line x1="10" y1="88" x2={chartWidth - 10} y2="88" stroke="#1e293b" strokeDasharray="4 4" strokeWidth="1" />
                    <line x1="10" y1={baselineY} x2={chartWidth - 10} y2={baselineY} stroke="#334155" strokeWidth="1" />

                    {/* Bars and labels */}
                    {dailyHistory.map((day, idx) => {
                      const xCenter = idx * slotWidth + slotWidth / 2;
                      const xBar = xCenter - barWidth / 2;
                      const barHeight = day.count > 0 ? Math.max(6, (day.count / maxCount) * maxBarHeight) : 3;
                      const yBar = baselineY - barHeight;

                      return (
                        <g key={day.date} className="group">
                          {/* Base slot indicator / filled bar */}
                          <rect
                            x={xBar}
                            y={yBar}
                            width={barWidth}
                            height={barHeight}
                            rx="4"
                            fill={day.count > 0 ? 'url(#subjBarGradient)' : '#1e293b'}
                            className="transition-all hover:opacity-100"
                          />

                          {/* Session count label */}
                          <text
                            x={xCenter}
                            y={day.count > 0 ? yBar - 6 : baselineY - 8}
                            textAnchor="middle"
                            fill={day.count > 0 ? '#cbd5e1' : '#475569'}
                            fontSize="11"
                            fontWeight={day.count > 0 ? '700' : '500'}
                          >
                            {day.count}
                          </text>

                          {/* Day abbreviation (e.g. Fri) */}
                          <text
                            x={xCenter}
                            y={baselineY + 16}
                            textAnchor="middle"
                            fill="#94a3b8"
                            fontSize="10"
                            fontWeight="500"
                          >
                            {day.dayLabel}
                          </text>

                          {/* Date label (e.g. 11/12) */}
                          <text
                            x={xCenter}
                            y={baselineY + 28}
                            textAnchor="middle"
                            fill="#64748b"
                            fontSize="9"
                            fontFamily="monospace"
                          >
                            {day.dateLabel}
                          </text>
                        </g>
                      );
                    })}

                    {/* Accuracy Polyline & Glowing Dots (Rendered only when active days exist) */}
                    {activePoints.length >= 2 && (
                      <polyline
                        fill="none"
                        stroke="#34d399"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={activePoints.map(p => `${p.x},${p.y}`).join(' ')}
                        filter="url(#emeraldGlow)"
                      />
                    )}

                    {activePoints.map((pt, i) => (
                      <g key={i}>
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r="4"
                          fill="#0f172a"
                          stroke="#34d399"
                          strokeWidth="2.5"
                        />
                        <text
                          x={pt.x}
                          y={pt.y - 8}
                          textAnchor="middle"
                          fill="#6ee7b7"
                          fontSize="9"
                          fontWeight="700"
                          fontFamily="monospace"
                        >
                          {pt.day.accuracy}%
                        </text>
                      </g>
                    ))}
                  </svg>
                );
              })()}
            </div>

            {/* Helpful indicator when no sessions are logged yet */}
            {dailyHistory.reduce((acc, d) => acc + d.count, 0) === 0 && (
              <div className="mt-2 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
                  <span>No revisions logged in this window. Practice your calendar reviews to plot recall trends.</span>
                </span>
              </div>
            )}
          </div>

          {/* Ebbinghaus Forgetting Curve Simulator */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-emerald-400" />
                  <span>Subject Retention Decay Model: R = e^(-t / S)</span>
                </h3>
                <div className="text-xs text-slate-400">
                  Comparing memory half-life across subject revision stages
                </div>
              </div>
            </div>

            <div className="w-full overflow-x-auto pb-2 scrollbar-thin">
              <svg className="w-full h-48 min-w-[540px] overflow-visible" viewBox="0 0 700 180" preserveAspectRatio="xMidYMid meet">
                <line x1="40" y1="20" x2="680" y2="20" stroke="#334155" strokeDasharray="3 3" />
                <text x="35" y="24" textAnchor="end" fill="#64748b" fontSize="10" fontFamily="monospace">100%</text>

                <line x1="40" y1="45" x2="680" y2="45" stroke="#059669" strokeDasharray="2 2" strokeOpacity="0.4" />
                <text x="35" y="49" textAnchor="end" fill="#34d399" fontSize="9" fontFamily="monospace">90% Target</text>

                <line x1="40" y1="100" x2="680" y2="100" stroke="#334155" strokeDasharray="3 3" />
                <text x="35" y="104" textAnchor="end" fill="#64748b" fontSize="10" fontFamily="monospace">50%</text>

                <line x1="40" y1="160" x2="680" y2="160" stroke="#475569" />
                <text x="35" y="164" textAnchor="end" fill="#64748b" fontSize="10" fontFamily="monospace">0%</text>

                {[0, 5, 10, 15, 20, 25, 30].map(day => {
                  const x = 40 + (day / 30) * 640;
                  return (
                    <g key={day}>
                      <line x1={x} y1="160" x2={x} y2="165" stroke="#64748b" />
                      <text x={x} y="177" textAnchor="middle" fill="#64748b" fontSize="10" fontFamily="monospace">
                        Day {day}
                      </text>
                    </g>
                  );
                })}

                {/* Stage 1 (S = 2 days) */}
                {(() => {
                  const S = 2.0;
                  const pts = Array.from({ length: 31 }, (_, day) => {
                    const ret = Math.exp(-day / S);
                    const x = 40 + (day / 30) * 640;
                    const y = 160 - ret * 140;
                    return `${x},${y}`;
                  }).join(' ');

                  return <polyline fill="none" stroke="#f43f5e" strokeWidth="2" strokeDasharray="4 2" points={pts} />;
                })()}

                {/* Stage 2 (S = 7 days) */}
                {(() => {
                  const S = 7.0;
                  const pts = Array.from({ length: 31 }, (_, day) => {
                    const ret = Math.exp(-day / S);
                    const x = 40 + (day / 30) * 640;
                    const y = 160 - ret * 140;
                    return `${x},${y}`;
                  }).join(' ');

                  return <polyline fill="none" stroke="#fbbf24" strokeWidth="2" points={pts} />;
                })()}

                {/* Stage 3+ (S = 30 days) */}
                {(() => {
                  const S = 30.0;
                  const pts = Array.from({ length: 31 }, (_, day) => {
                    const ret = Math.exp(-day / S);
                    const x = 40 + (day / 30) * 640;
                    const y = 160 - ret * 140;
                    return `${x},${y}`;
                  }).join(' ');

                  return <polyline fill="none" stroke="#38bdf8" strokeWidth="2.5" points={pts} />;
                })()}
              </svg>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 mt-2 pt-4 border-t border-slate-800 text-xs text-slate-400">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-rose-500" />
                  Stage 1 (S ≈ 2d)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-amber-400" />
                  Stage 2 (S ≈ 7d)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-sky-400" />
                  Stage 3+ (S ≈ 30d)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Category Consolidation Breakdown */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Category Retention Health</span>
            </h3>

            <div className="space-y-3">
              {categories.map(cat => {
                const subsInCat = subjects.filter(s => s.categoryId === cat.id);
                const masteredInCat = subsInCat.filter(s => s.intervalDays >= 30).length;
                const ratio = subsInCat.length > 0 ? (masteredInCat / subsInCat.length) * 100 : 0;

                return (
                  <div key={cat.id} className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-200">{cat.name}</span>
                      <span className="font-mono text-emerald-400">{Math.round(ratio)}% mastered</span>
                    </div>

                    <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                      <div className="h-full bg-indigo-500" style={{ width: `${ratio}%` }} />
                    </div>

                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                      <span>{subsInCat.length} subjects</span>
                      <span>{masteredInCat} consolidated</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
