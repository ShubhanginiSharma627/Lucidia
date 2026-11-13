import React, { useState } from 'react';
import { Subject, Category, RevisionSchedule } from '../types';
import { formatInterval, formatDateToYYYYMMDD, simulateScheduleProgression } from '../services/spacedRepetition';
import { subjectMatchesCategories } from './MultiCategorySelect';
import {
  COLOR_PALETTE,
  getColorClasses,
  getDotColorClass,
  getSubjectCategoryIds,
  getSubjectCategories,
  getSubjectColor,
} from '../services/colors';
import { Plus, Search, BookOpen, Trash2, Edit3, Check, ChevronRight } from 'lucide-react';
import { ModalShell } from './ModalShell';

interface SubjectCategoryManagerProps {
  categories: Category[];
  subjects: Subject[];
  schedules: RevisionSchedule[];
  onSaveCategory: (category: Category) => void;
  onDeleteCategory: (categoryId: string) => void;
  onSaveSubject: (subject: Subject) => void;
  onDeleteSubject: (subjectId: string) => void;
  onOpenLogSession: (subject: Subject) => void;
  isAddModalOpenInitially?: boolean;
  preselectedDateForNew?: string;
}

export const SubjectCategoryManager: React.FC<SubjectCategoryManagerProps> = ({
  categories,
  subjects,
  schedules,
  onSaveCategory,
  onDeleteCategory,
  onSaveSubject,
  onDeleteSubject,
  onOpenLogSession,
  isAddModalOpenInitially = false,
  preselectedDateForNew,
}) => {
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedSubjectCategoryIds, setSelectedSubjectCategoryIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'due' | 'mastered'>('all');
  const [detailSubjectId, setDetailSubjectId] = useState<string | null>(null);

  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryForm, setCategoryForm] = useState<Partial<Category>>({
    name: '',
    color: 'indigo',
    description: '',
  });

  // Subject Modal State
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(isAddModalOpenInitially);
  const [isAlreadyRevising, setIsAlreadyRevising] = useState(false);
  const [hasManuallyEditedDate, setHasManuallyEditedDate] = useState(Boolean(preselectedDateForNew));
  const [subjectForm, setSubjectForm] = useState<Partial<Subject>>({
    name: '',
    categoryId: categories[0]?.id || '',
    categoryIds: categories[0]?.id ? [categories[0].id] : [],
    scheduleId: schedules[0]?.id || 'lucidia-adaptive',
    revisionStage: 0,
    intervalDays: 1,
    nextDueDate: preselectedDateForNew || formatDateToYYYYMMDD(new Date()),
    notes: '',
  });

  const detailSubject = detailSubjectId ? subjects.find(s => s.id === detailSubjectId) || null : null;

  const todayStr = formatDateToYYYYMMDD(new Date());

  const getStageIntervalForSchedule = (scheduleId: string | undefined, stage: number): number => {
    if (stage < 1) return 1;
    const targetSchedule = schedules.find(s => s.id === scheduleId) || schedules[0];
    if (!targetSchedule) return 1;
    const progression = simulateScheduleProgression(targetSchedule, stage);
    return progression[stage - 1]?.intervalDays || 1;
  };

  const addDaysToTodayStr = (days: number): string => {
    const base = new Date(todayStr + 'T00:00:00');
    return formatDateToYYYYMMDD(new Date(base.getTime() + days * 24 * 60 * 60 * 1000));
  };

  // Filtered Subjects (supports multi-category selection)
  const filteredSubjects = subjects.filter(subject => {
    // Multi-Category filter
    if (!subjectMatchesCategories(subject, selectedCategoryIds)) {
      return false;
    }

    // Status filter
    if (statusFilter === 'due' && subject.nextDueDate > todayStr) {
      return false;
    }
    if (statusFilter === 'mastered' && subject.intervalDays < 30) {
      return false;
    }

  // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const catNamesJoined = getSubjectCategories(subject, categories)
        .map(c => c.name.toLowerCase())
        .join(' ');
      return (
        subject.name.toLowerCase().includes(q) ||
        catNamesJoined.includes(q) ||
        (subject.notes || '').toLowerCase().includes(q)
      );
    }

    return true;
  });

  const handleOpenNewSubject = () => {
    const defaultCatId = categories[0]?.id || '';
    setSubjectForm({
      id: `subj-${Date.now()}`,
      name: '',
      categoryId: defaultCatId,
      categoryName: categories[0]?.name || '',
      categoryIds: defaultCatId ? [defaultCatId] : [],
      categoryNames: categories[0]?.name ? [categories[0].name] : [],
      color: undefined,
      scheduleId: schedules[0]?.id || 'lucidia-adaptive',
      revisionStage: 0,
      intervalDays: 1,
      stability: 1.0,
      difficulty: 5.0,
      nextDueDate: todayStr,
      status: 'scheduled',
      notes: '',
      createdAt: new Date().toISOString(),
    });
    setSelectedSubjectCategoryIds(defaultCatId ? [defaultCatId] : []);
    setIsAlreadyRevising(false);
    setHasManuallyEditedDate(false);
    setNewCategoryInline('');
    setNewCategoryInlineColor('indigo');
    setIsSubjectModalOpen(true);
  };

  const [newCategoryInline, setNewCategoryInline] = useState('');
  const [newCategoryInlineColor, setNewCategoryInlineColor] = useState('indigo');

  const handleEditSubject = (subj: Subject) => {
    setSubjectForm({ ...subj });
    const initialCats = getSubjectCategoryIds(subj);
    setSelectedSubjectCategoryIds(initialCats);
    setIsAlreadyRevising((subj.revisionStage ?? 0) >= 1);
    setHasManuallyEditedDate(true);
    setNewCategoryInline('');
    setIsSubjectModalOpen(true);
  };

  const handleEditCategory = (cat: Category) => {
    setCategoryForm({ ...cat });
    setIsCategoryModalOpen(true);
  };

  const handleToggleSubjectCategory = (catId: string) => {
    if (selectedSubjectCategoryIds.includes(catId)) {
      setSelectedSubjectCategoryIds(prev => prev.filter(id => id !== catId));
    } else {
      setSelectedSubjectCategoryIds(prev => [...prev, catId]);
    }
  };

  const handleInlineAddCategory = () => {
    const trimmed = newCategoryInline.trim();
    if (!trimmed) return;
    const existing = categories.find(c => c.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      if (!selectedSubjectCategoryIds.includes(existing.id)) {
        setSelectedSubjectCategoryIds(prev => [...prev, existing.id]);
      }
      setNewCategoryInline('');
      return;
    }
    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name: trimmed,
      color: newCategoryInlineColor || 'indigo',
      description: '',
      createdAt: new Date().toISOString(),
    };
    onSaveCategory(newCat);
    setSelectedSubjectCategoryIds(prev => [...prev, newCat.id]);
    setNewCategoryInline('');
  };

  const handleSaveSubjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectForm.name) return;

    let targetCatIds = [...selectedSubjectCategoryIds];
    let targetCatNames: string[] = [];

    if (newCategoryInline.trim()) {
      const trimmed = newCategoryInline.trim();
      const newCat: Category = {
        id: `cat-${Date.now()}`,
        name: trimmed,
        color: newCategoryInlineColor || 'indigo',
        description: '',
        createdAt: new Date().toISOString(),
      };
      onSaveCategory(newCat);
      targetCatIds = [...targetCatIds, newCat.id];
      targetCatNames = targetCatIds.map(id => (id === newCat.id ? newCat.name : categories.find(c => c.id === id)?.name || '')).filter(Boolean);
    } else {
      targetCatNames = targetCatIds.map(id => categories.find(c => c.id === id)?.name).filter(Boolean) as string[];
    }

    if (targetCatIds.length === 0 && categories[0]) {
      targetCatIds = [categories[0].id];
      targetCatNames = [categories[0].name];
    }

    if (targetCatIds.length === 0) return;

    const primaryCatId = targetCatIds[0];
    const primaryCatName = targetCatNames[0] || 'General';
    const targetScheduleId = subjectForm.scheduleId || schedules[0]?.id || 'lucidia-adaptive';
    const effectiveStage = isAlreadyRevising ? Math.max(1, subjectForm.revisionStage ?? 1) : 0;
    const effectiveInterval = isAlreadyRevising
      ? getStageIntervalForSchedule(targetScheduleId, effectiveStage)
      : 1;
    const effectiveNextDueDate = subjectForm.nextDueDate || todayStr;
    const existingSubject = subjects.find(s => s.id === subjectForm.id);
    let effectiveLastRevisedAt = subjectForm.lastRevisedAt;
    if (effectiveStage >= 1) {
      const stageOrDateChanged =
        !existingSubject ||
        existingSubject.revisionStage !== effectiveStage ||
        existingSubject.nextDueDate !== effectiveNextDueDate ||
        existingSubject.scheduleId !== targetScheduleId;
      if (stageOrDateChanged || !effectiveLastRevisedAt) {
        const dueDateObj = new Date(effectiveNextDueDate + 'T00:00:00');
        effectiveLastRevisedAt = new Date(
          dueDateObj.getTime() - effectiveInterval * 24 * 60 * 60 * 1000
        ).toISOString();
      }
    }

    const saved: Subject = {
      id: subjectForm.id || `subj-${Date.now()}`,
      name: subjectForm.name,
      categoryId: primaryCatId,
      categoryName: primaryCatName,
      categoryIds: targetCatIds,
      categoryNames: targetCatNames,
      color: subjectForm.color || undefined,
      scheduleId: targetScheduleId,
      revisionStage: effectiveStage,
      intervalDays: effectiveInterval,
      stability: effectiveStage >= 1 ? Number(effectiveInterval.toFixed(1)) : 1.0,
      difficulty: subjectForm.difficulty ?? 5.0,
      nextDueDate: effectiveNextDueDate,
      status: effectiveInterval >= 30 ? 'mastered' : 'scheduled',
      notes: subjectForm.notes || '',
      createdAt: subjectForm.createdAt || new Date().toISOString(),
      lastRevisedAt: effectiveLastRevisedAt,
    };

    onSaveSubject(saved);
    setNewCategoryInline('');
    setIsSubjectModalOpen(false);
  };

  const handleSaveCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name) return;

    const savedCat: Category = {
      id: categoryForm.id || `cat-${Date.now()}`,
      name: categoryForm.name,
      color: categoryForm.color || 'indigo',
      description: categoryForm.description || '',
      createdAt: categoryForm.createdAt || new Date().toISOString(),
    };

    onSaveCategory(savedCat);
    setIsCategoryModalOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-5 sm:space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-1 flex items-center gap-2">
            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400 shrink-0" />
            <span>Academic Categories & Subjects</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Define subject curricula, schedule revision milestones, and track memory consolidation stages.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-nowrap shrink-0 self-stretch sm:self-start md:self-auto">
          <button
            onClick={() => {
              setCategoryForm({
                name: '',
                color: 'indigo',
                description: '',
              });
              setIsCategoryModalOpen(true);
            }}
            className="flex-1 sm:flex-none min-h-[42px] flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl transition-colors whitespace-nowrap shrink-0 active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span>New Category</span>
          </button>

          <button
            onClick={handleOpenNewSubject}
            className="flex-1 sm:flex-none min-h-[42px] flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-sm transition-all whitespace-nowrap shrink-0 active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span>New Subject</span>
          </button>
        </div>
      </div>

      {/* Categories Horizontal Scroller / Multi-Category Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setSelectedCategoryIds([])}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 border flex items-center gap-1.5 ${
            selectedCategoryIds.length === 0
              ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
              : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white'
          }`}
        >
          {selectedCategoryIds.length === 0 && <Check className="w-3 h-3" />}
          <span>All Categories</span>
          <span className="text-[11px] font-mono opacity-80">({subjects.length})</span>
        </button>

        {categories.map(cat => {
          const isSelected = selectedCategoryIds.includes(cat.id);
          const count = subjects.filter(s => getSubjectCategoryIds(s).includes(cat.id)).length;

          const handleTogglePill = () => {
            if (selectedCategoryIds.length === 0) {
              setSelectedCategoryIds([cat.id]);
            } else if (selectedCategoryIds.includes(cat.id)) {
              const next = selectedCategoryIds.filter(id => id !== cat.id);
              setSelectedCategoryIds(next);
            } else {
              setSelectedCategoryIds([...selectedCategoryIds, cat.id]);
            }
          };

          return (
            <div
              key={cat.id}
              className={`flex items-center gap-1.5 pl-3 pr-2 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 border ${
                isSelected
                  ? 'bg-indigo-950/70 text-white border-indigo-500 shadow-sm ring-1 ring-indigo-500/30'
                  : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <button
                onClick={handleTogglePill}
                className="flex items-center gap-1.5"
              >
                {isSelected && <Check className="w-3 h-3 text-indigo-400" />}
                <span className={`w-2 h-2 rounded-full ${getDotColorClass(cat.color)}`} />
                <span>{cat.name}</span>
                <span className="text-[11px] font-mono text-slate-500">({count})</span>
              </button>

              <button
                onClick={() => handleEditCategory(cat)}
                title="Edit category"
                className="text-slate-600 hover:text-indigo-300 ml-1 p-0.5 rounded transition-colors"
              >
                <Edit3 className="w-3 h-3" />
              </button>

              <button
                onClick={() => onDeleteCategory(cat.id)}
                title="Delete category"
                className="text-slate-600 hover:text-rose-400 p-0.5 rounded transition-colors"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Main Container: Search, Filter, and Compact Subject List */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4 sm:space-y-5">
        {/* Search & Filter Sub-Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search subjects, notes, or syllabus concepts..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg shrink-0">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                statusFilter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({subjects.length})
            </button>
            <button
              onClick={() => setStatusFilter('due')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                statusFilter === 'due' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Due Now
            </button>
            <button
              onClick={() => setStatusFilter('mastered')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                statusFilter === 'mastered' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Mastered (&gt;30d)
            </button>
          </div>
        </div>

        {/* Compact Subjects List */}
        {filteredSubjects.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            No subjects found matching your criteria.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/70 border border-slate-800/80 rounded-xl bg-slate-950/50 overflow-hidden">
            {filteredSubjects.map(subject => {
              const subjectCats = getSubjectCategories(subject, categories);
              const subjectAccent = getSubjectColor(subject, categories);
              const assignedSchedule = schedules.find(s => s.id === subject.scheduleId);
              const isDue = subject.nextDueDate <= todayStr;
              const visibleCats = subjectCats.slice(0, 2);
              const extraCatsCount = subjectCats.length - visibleCats.length;

              return (
                <div
                  key={subject.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setDetailSubjectId(subject.id)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setDetailSubjectId(subject.id);
                    }
                  }}
                  className={`group flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 px-3.5 sm:px-4 py-3 transition-colors cursor-pointer focus:outline-none focus-visible:bg-slate-900 ${
                    isDue
                      ? 'bg-indigo-950/20 hover:bg-indigo-950/35'
                      : 'hover:bg-slate-900/70'
                  }`}
                >
                  {/* Main Title, Badges & Tabular Due Info */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${getDotColorClass(subjectAccent)}`} />
                      <h3 className="text-sm font-semibold text-slate-100 truncate max-w-full">
                        {subject.name}
                      </h3>

                      <div className="flex flex-wrap items-center gap-1">
                        {visibleCats.map(cat => (
                          <span
                            key={cat.id}
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border whitespace-nowrap ${getColorClasses(cat.color)}`}
                          >
                            {cat.name}
                          </span>
                        ))}
                        {extraCatsCount > 0 && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-slate-700 bg-slate-900 text-slate-400 whitespace-nowrap">
                            +{extraCatsCount}
                          </span>
                        )}
                        {assignedSchedule && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-slate-700/80 bg-slate-900/90 text-slate-400 whitespace-nowrap">
                            {assignedSchedule.name}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 pl-[18px] text-[11px] font-mono tabular-nums text-slate-400">
                      <span>Stage {subject.revisionStage}</span>
                      <span aria-hidden="true" className="text-slate-600">·</span>
                      <span>{formatInterval(subject.intervalDays)}</span>
                      <span aria-hidden="true" className="text-slate-600">·</span>
                      <span className={isDue ? 'text-indigo-400 font-semibold' : 'text-slate-300'}>
                        {isDue ? 'Due Today' : `Next: ${subject.nextDueDate}`}
                      </span>
                    </div>
                  </div>

                  {/* Row Actions: Direct Log Button + Detail Affordance */}
                  <div className="flex items-center justify-end gap-2 pl-[18px] sm:pl-0 shrink-0">
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        onOpenLogSession(subject);
                      }}
                      className={`min-h-[38px] px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 active:scale-[0.98] ${
                        isDue
                          ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-600/25'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      <span>{isDue ? 'Log Due' : 'Log Early'}</span>
                    </button>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors shrink-0" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Subject Details Popup Modal */}
      {detailSubject && (() => {
        const subjectCats = getSubjectCategories(detailSubject, categories);
        const subjectAccent = getSubjectColor(detailSubject, categories);
        const assignedSchedule = schedules.find(s => s.id === detailSubject.scheduleId);
        const isDue = detailSubject.nextDueDate <= todayStr;

        return (
          <ModalShell
            isOpen={Boolean(detailSubject)}
            onClose={() => setDetailSubjectId(null)}
            maxWidthClass="max-w-lg"
            closeAriaLabel="Close subject details"
            headerContent={
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${getDotColorClass(subjectAccent)}`} />
                  <h3 className="text-base sm:text-lg font-bold text-white leading-snug break-words">
                    {detailSubject.name}
                  </h3>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {subjectCats.map(cat => (
                    <span
                      key={cat.id}
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded border inline-block ${getColorClasses(cat.color)}`}
                    >
                      {cat.name}
                    </span>
                  ))}
                  {assignedSchedule && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-slate-700/80 bg-slate-950/80 text-slate-300">
                      {assignedSchedule.name}
                    </span>
                  )}
                </div>
              </div>
            }
          >
            {/* Scrollable Body */}
            <div className="flex-1 min-h-0 min-w-0 max-w-full overflow-y-auto overflow-x-hidden px-4 sm:px-5 py-3.5 space-y-4">
              {/* Stage / Interval / Next Revision Metrics */}
              <div className="grid grid-cols-3 gap-2 sm:gap-2.5 p-2.5 sm:p-3 bg-slate-950/70 border border-slate-800 rounded-xl font-mono tabular-nums min-w-0">
                <div className="min-w-0">
                  <span className="block text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Stage</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-200 block truncate">Stage {detailSubject.revisionStage}</span>
                </div>
                <div className="min-w-0">
                  <span className="block text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Interval</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-200 block truncate">{formatInterval(detailSubject.intervalDays)}</span>
                </div>
                <div className="min-w-0">
                  <span className="block text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Next Revision</span>
                  <span className={`text-xs sm:text-sm font-bold block truncate ${isDue ? 'text-indigo-400' : 'text-slate-200'}`}>
                    {isDue ? 'Due Today' : detailSubject.nextDueDate}
                  </span>
                </div>
              </div>

              {/* Syllabus Notes */}
              <div className="space-y-1.5 min-w-0">
                <div className="text-xs font-semibold text-slate-300">
                  Syllabus Notes &amp; Concepts
                </div>
                <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl text-xs sm:text-sm leading-relaxed min-w-0">
                  {detailSubject.notes && detailSubject.notes.trim() ? (
                    <p className="text-slate-200 whitespace-pre-wrap break-words">{detailSubject.notes}</p>
                  ) : (
                    <p className="text-slate-500 italic">No syllabus notes added for this subject yet.</p>
                  )}
                </div>
                {detailSubject.lastRevisedAt && (
                  <p className="text-[11px] font-mono text-slate-500">
                    Last revised: {detailSubject.lastRevisedAt.split('T')[0]}
                  </p>
                )}
              </div>
            </div>

            {/* Sticky Footer Actions (Stacked cleanly on mobile, single row on sm+) */}
            <div className="shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 sm:px-5 py-3 bg-slate-900/95 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  const subj = detailSubject;
                  setDetailSubjectId(null);
                  onOpenLogSession(subj);
                }}
                className={`w-full sm:w-auto sm:order-2 min-h-[40px] px-4 py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-[0.98] ${
                  isDue
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-600/30'
                    : 'bg-indigo-600/90 hover:bg-indigo-500 text-white'
                }`}
              >
                <Check className="w-4 h-4 shrink-0" />
                <span>{isDue ? 'Log Due Revision Session' : 'Log Early Revision'}</span>
              </button>

              <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto sm:order-1">
                <button
                  type="button"
                  onClick={() => {
                    const subj = detailSubject;
                    setDetailSubjectId(null);
                    handleEditSubject(subj);
                  }}
                  className="min-h-[38px] px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const id = detailSubject.id;
                    setDetailSubjectId(null);
                    onDeleteSubject(id);
                  }}
                  className="min-h-[38px] px-3 py-1.5 text-xs font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </ModalShell>
        );
      })()}

      {/* Category Create / Edit Modal */}
      <ModalShell
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title={categoryForm.id ? 'Edit Category' : 'Create Category'}
        maxWidthClass="max-w-md"
        closeAriaLabel="Close category modal"
      >
        <form onSubmit={handleSaveCategorySubmit} className="flex flex-col flex-1 min-h-0 min-w-0 max-w-full">
          <div className="flex-1 min-h-0 min-w-0 max-w-full overflow-y-auto overflow-x-hidden px-4 sm:px-5 py-3.5 space-y-3.5">
            <div className="min-w-0">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Category Name
              </label>
              <input
                type="text"
                value={categoryForm.name}
                onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })}
                placeholder="e.g. Cognitive Neuroscience"
                className="w-full min-w-0 max-w-full box-border px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div className="min-w-0">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-300">
                  Accent Color
                </label>
                <span className="text-[11px] font-mono text-slate-400 capitalize">
                  {categoryForm.color || 'indigo'}
                </span>
              </div>
              <div className="grid grid-cols-6 gap-1.5 p-2 bg-slate-950/70 border border-slate-800 rounded-xl">
                {COLOR_PALETTE.map(option => {
                  const isActive = (categoryForm.color || 'indigo') === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setCategoryForm({ ...categoryForm, color: option.id })}
                      title={option.label}
                      className={`h-8 rounded-lg flex items-center justify-center transition-all border ${
                        isActive
                          ? `bg-slate-800 border-white/60 ring-2 ${option.ringClass}`
                          : 'bg-slate-900/70 border-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-full ${option.swatchClass} flex items-center justify-center`}>
                        {isActive && <Check className="w-2.5 h-2.5 text-slate-950 stroke-[3]" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="min-w-0">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Description (Optional)
              </label>
              <textarea
                rows={2}
                value={categoryForm.description}
                onChange={e => setCategoryForm({ ...categoryForm, description: e.target.value })}
                placeholder="Summary of this academic domain..."
                className="w-full min-w-0 max-w-full box-border px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="shrink-0 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-2.5 px-4 sm:px-5 py-3 bg-slate-900/95 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsCategoryModalOpen(false)}
              className="w-full sm:w-auto min-h-[40px] px-4 py-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto min-h-[40px] px-5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-sm transition-all active:scale-[0.98]"
            >
              Save Category
            </button>
          </div>
        </form>
      </ModalShell>

      {/* Subject Create / Edit Modal */}
      <ModalShell
        isOpen={isSubjectModalOpen}
        onClose={() => setIsSubjectModalOpen(false)}
        title={
          subjectForm.id?.startsWith('subj-') && subjects.some(s => s.id === subjectForm.id)
            ? 'Edit Subject'
            : 'Create New Subject'
        }
        maxWidthClass="max-w-lg"
        closeAriaLabel="Close subject form"
      >
        <form onSubmit={handleSaveSubjectSubmit} className="flex flex-col flex-1 min-h-0 min-w-0 max-w-full">
          {/* Scrollable Body */}
          <div className="flex-1 min-h-0 min-w-0 max-w-full overflow-y-auto overflow-x-hidden px-4 sm:px-5 py-3.5 space-y-3">
            <div className="min-w-0">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Subject Name / Topic
              </label>
              <input
                type="text"
                value={subjectForm.name}
                onChange={e => setSubjectForm({ ...subjectForm, name: e.target.value })}
                placeholder="e.g. Distributed Consensus & Paxos"
                className="w-full min-w-0 max-w-full box-border px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div className="min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <label className="block text-xs font-semibold text-slate-300">
                  Academic Categories <span className="text-slate-500 font-normal">(select one or more)</span>
                </label>
                <span className="text-[11px] text-indigo-400 font-medium shrink-0">
                  {selectedSubjectCategoryIds.length} selected
                </span>
              </div>

              {categories.length > 0 && (
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-slate-950/70 border border-slate-800 rounded-xl">
                  {categories.map(c => {
                    const isSelected = selectedSubjectCategoryIds.includes(c.id);
                    const isPrimary = selectedSubjectCategoryIds[0] === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleToggleSubjectCategory(c.id)}
                        className={`min-h-[30px] px-2 py-0.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all border ${
                          isSelected
                            ? 'bg-indigo-600/25 border-indigo-500 text-indigo-200 shadow-xs'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${getDotColorClass(c.color)}`} />
                        <span>{c.name}</span>
                        {isSelected && <Check className="w-3 h-3 text-indigo-400 ml-0.5" />}
                        {isPrimary && (
                          <span className="text-[9px] uppercase tracking-wider bg-indigo-500/30 text-indigo-300 px-1 py-0.5 rounded font-semibold ml-0.5">
                            Primary
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Inline Quick-Add Category (Stacks onto two clean lines on narrow phones) */}
              <div className="mt-1.5 flex flex-col sm:flex-row sm:items-center gap-1.5 min-w-0 max-w-full">
                <input
                  type="text"
                  value={newCategoryInline}
                  onChange={e => setNewCategoryInline(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleInlineAddCategory();
                    }
                  }}
                  placeholder={
                    categories.length === 0
                      ? 'Type category (e.g. Science)'
                      : 'Quick-add another category...'
                  }
                  className="w-full sm:flex-1 min-w-0 max-w-full box-border px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
                <div className="flex items-center gap-1.5 w-full sm:w-auto shrink-0">
                  <select
                    value={newCategoryInlineColor}
                    onChange={e => setNewCategoryInlineColor(e.target.value)}
                    aria-label="New category color"
                    className="flex-1 sm:flex-initial min-w-0 px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    {COLOR_PALETTE.map(opt => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleInlineAddCategory}
                    disabled={!newCategoryInline.trim()}
                    className="min-h-[34px] px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-indigo-300 border border-slate-700 transition-colors shrink-0 whitespace-nowrap"
                  >
                    + Add
                  </button>
                </div>
              </div>

              {categories.length > 0 && selectedSubjectCategoryIds.length === 0 && !newCategoryInline.trim() && (
                <p className="text-[11px] text-amber-400 mt-1">
                  Please select at least one category for this subject.
                </p>
              )}
            </div>

            {/* Subject Accent Color Swatch Picker */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-300">
                  Subject Accent Color
                </label>
                <span className="text-[11px] font-mono text-slate-400 capitalize">
                  {subjectForm.color || 'Auto (Category)'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-950/70 border border-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setSubjectForm({ ...subjectForm, color: undefined })}
                  className={`h-7 px-2 rounded-lg text-[11px] font-medium border transition-all ${
                    !subjectForm.color
                      ? 'bg-indigo-600/25 border-indigo-500 text-indigo-200'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Auto
                </button>
                {COLOR_PALETTE.map(option => {
                  const isActive = subjectForm.color === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setSubjectForm({ ...subjectForm, color: option.id })}
                      title={option.label}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all border ${
                        isActive
                          ? `bg-slate-800 border-white/60 ring-2 ${option.ringClass}`
                          : 'bg-slate-900/70 border-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded-full ${option.swatchClass} flex items-center justify-center`}>
                        {isActive && <Check className="w-2.5 h-2.5 text-slate-950 stroke-[3]" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="min-w-0">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Revision Schedule Model
              </label>
              <select
                value={subjectForm.scheduleId}
                onChange={e => {
                  const nextScheduleId = e.target.value;
                  if (isAlreadyRevising) {
                    const stage = Math.max(1, subjectForm.revisionStage || 1);
                    const nextInterval = getStageIntervalForSchedule(nextScheduleId, stage);
                    setSubjectForm({
                      ...subjectForm,
                      scheduleId: nextScheduleId,
                      revisionStage: stage,
                      intervalDays: nextInterval,
                      stability: nextInterval,
                      nextDueDate: hasManuallyEditedDate
                        ? subjectForm.nextDueDate
                        : addDaysToTodayStr(nextInterval),
                    });
                  } else {
                    setSubjectForm({ ...subjectForm, scheduleId: nextScheduleId });
                  }
                }}
                className="w-full min-w-0 max-w-full box-border px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                {schedules.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Already Revising Toggle + Expandable Stage Selector */}
            <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2.5 min-w-0">
              <div className="flex items-center justify-between gap-3 min-w-0">
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-slate-200">
                    Already Revising
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Start directly at an active stage instead of Stage 0.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isAlreadyRevising}
                  onClick={() => {
                    const nextEnabled = !isAlreadyRevising;
                    setIsAlreadyRevising(nextEnabled);
                    if (nextEnabled) {
                      const nextStage = Math.max(1, subjectForm.revisionStage || 1);
                      const nextInterval = getStageIntervalForSchedule(subjectForm.scheduleId, nextStage);
                      setSubjectForm({
                        ...subjectForm,
                        revisionStage: nextStage,
                        intervalDays: nextInterval,
                        stability: nextInterval,
                        nextDueDate: hasManuallyEditedDate
                          ? subjectForm.nextDueDate
                          : addDaysToTodayStr(nextInterval),
                      });
                    } else {
                      setSubjectForm({
                        ...subjectForm,
                        revisionStage: 0,
                        intervalDays: 1,
                        stability: 1.0,
                        nextDueDate: hasManuallyEditedDate
                          ? subjectForm.nextDueDate
                          : (preselectedDateForNew || todayStr),
                      });
                    }
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    isAlreadyRevising ? 'bg-indigo-600' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${
                      isAlreadyRevising ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {isAlreadyRevising && (() => {
                const selectedScheduleObj =
                  schedules.find(s => s.id === subjectForm.scheduleId) || schedules[0];
                const stageProgression = selectedScheduleObj
                  ? simulateScheduleProgression(selectedScheduleObj, 12)
                  : [];
                const activeStage = Math.max(1, subjectForm.revisionStage || 1);
                const activeInterval = getStageIntervalForSchedule(subjectForm.scheduleId, activeStage);

                return (
                  <div className="pt-2 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-2.5 min-w-0">
                    <div className="min-w-0">
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Current Revision Stage
                      </label>
                      <select
                        value={activeStage}
                        onChange={e => {
                          const nextStage = parseInt(e.target.value, 10) || 1;
                          const nextInterval = getStageIntervalForSchedule(subjectForm.scheduleId, nextStage);
                          setSubjectForm({
                            ...subjectForm,
                            revisionStage: nextStage,
                            intervalDays: nextInterval,
                            stability: nextInterval,
                            nextDueDate: hasManuallyEditedDate
                              ? subjectForm.nextDueDate
                              : addDaysToTodayStr(nextInterval),
                          });
                        }}
                        className="w-full min-w-0 max-w-full box-border px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                      >
                        {Array.from({ length: 12 }, (_, idx) => idx + 1).map(stageNum => {
                          const stepDays = stageProgression[stageNum - 1]?.intervalDays;
                          return (
                            <option key={stageNum} value={stageNum}>
                              Stage {stageNum}
                              {stepDays !== undefined ? ` (${formatInterval(stepDays)})` : ''}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div className="min-w-0">
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Schedule Interval
                      </label>
                      <div className="px-2.5 py-1.5 bg-slate-900/80 border border-slate-800 rounded-lg flex items-center justify-between gap-2 min-w-0">
                        <span className="text-xs font-bold font-mono tabular-nums text-indigo-300 truncate">
                          {formatInterval(activeInterval)} ({activeInterval}d)
                        </span>
                        <span className="text-[10px] text-slate-500 whitespace-nowrap shrink-0">
                          Auto-filled
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                <label className="block text-xs font-semibold text-slate-300">
                  {isAlreadyRevising ? 'Next Revision Date on Calendar' : 'First / Next Revision Date on Calendar'}
                </label>
                {isAlreadyRevising && (
                  <button
                    type="button"
                    onClick={() => {
                      setHasManuallyEditedDate(true);
                      setSubjectForm({ ...subjectForm, nextDueDate: todayStr });
                    }}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium whitespace-nowrap"
                  >
                    Set to Today
                  </button>
                )}
              </div>
              <input
                type="date"
                value={subjectForm.nextDueDate}
                onChange={e => {
                  setHasManuallyEditedDate(true);
                  setSubjectForm({ ...subjectForm, nextDueDate: e.target.value });
                }}
                className="block w-full min-w-0 max-w-full box-border px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div className="min-w-0">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Syllabus Notes / Concepts to Revise
              </label>
              <textarea
                rows={2}
                value={subjectForm.notes}
                onChange={e => setSubjectForm({ ...subjectForm, notes: e.target.value })}
                placeholder="e.g. Master leader election, quorum validation, and log compaction..."
                className="w-full min-w-0 max-w-full box-border px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="shrink-0 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-2.5 px-4 sm:px-5 py-3 bg-slate-900/95 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsSubjectModalOpen(false)}
              className="w-full sm:w-auto min-h-[40px] px-4 py-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={categories.length > 0 && selectedSubjectCategoryIds.length === 0 && !newCategoryInline.trim()}
              className="w-full sm:w-auto min-h-[40px] px-5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-sm transition-all active:scale-[0.98]"
            >
              Save Subject
            </button>
          </div>
        </form>
      </ModalShell>
    </div>
  );
};
