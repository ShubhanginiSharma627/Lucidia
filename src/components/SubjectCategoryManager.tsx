import React, { useState } from 'react';
import { Subject, Category, RevisionSchedule } from '../types';
import { formatInterval, formatDateToYYYYMMDD } from '../services/spacedRepetition';
import { Plus, Search, Filter, BookOpen, Trash2, Edit3, Check, Layers, Clock, AlertCircle } from 'lucide-react';

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
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'due' | 'mastered'>('all');

  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryForm, setCategoryForm] = useState<Partial<Category>>({
    name: '',
    color: 'indigo',
    description: '',
  });

  // Subject Modal State
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(isAddModalOpenInitially);
  const [subjectForm, setSubjectForm] = useState<Partial<Subject>>({
    name: '',
    categoryId: categories[0]?.id || '',
    scheduleId: schedules[0]?.id || 'lucidia-adaptive',
    nextDueDate: preselectedDateForNew || formatDateToYYYYMMDD(new Date()),
    notes: '',
  });

  const todayStr = formatDateToYYYYMMDD(new Date());

  // Filtered Subjects
  const filteredSubjects = subjects.filter(subject => {
    // Category filter
    if (selectedCategoryFilter !== 'all' && subject.categoryId !== selectedCategoryFilter) {
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
      return (
        subject.name.toLowerCase().includes(q) ||
        subject.categoryName.toLowerCase().includes(q) ||
        (subject.notes || '').toLowerCase().includes(q)
      );
    }

    return true;
  });

  // Category Colors
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'emerald':
        return 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300';
      case 'amber':
        return 'bg-amber-500/15 border-amber-500/30 text-amber-300';
      case 'violet':
        return 'bg-violet-500/15 border-violet-500/30 text-violet-300';
      case 'rose':
        return 'bg-rose-500/15 border-rose-500/30 text-rose-300';
      case 'sky':
        return 'bg-sky-500/15 border-sky-500/30 text-sky-300';
      case 'indigo':
      default:
        return 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300';
    }
  };

  const handleOpenNewSubject = () => {
    setSubjectForm({
      id: `subj-${Date.now()}`,
      name: '',
      categoryId: categories[0]?.id || '',
      categoryName: categories[0]?.name || '',
      scheduleId: schedules[0]?.id || 'lucidia-adaptive',
      revisionStage: 0,
      intervalDays: 1,
      stability: 1.0,
      difficulty: 5.0,
      nextDueDate: preselectedDateForNew || todayStr,
      status: 'scheduled',
      notes: '',
      createdAt: new Date().toISOString(),
    });
    setIsSubjectModalOpen(true);
  };

  const [newCategoryInline, setNewCategoryInline] = useState('');

  const handleEditSubject = (subj: Subject) => {
    setSubjectForm({ ...subj });
    setNewCategoryInline('');
    setIsSubjectModalOpen(true);
  };

  const handleSaveSubjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectForm.name) return;

    let targetCatId = subjectForm.categoryId;
    let targetCatName = '';

    if (!targetCatId && newCategoryInline.trim()) {
      const newCat: Category = {
        id: `cat-${Date.now()}`,
        name: newCategoryInline.trim(),
        color: 'indigo',
        description: '',
        createdAt: new Date().toISOString(),
      };
      onSaveCategory(newCat);
      targetCatId = newCat.id;
      targetCatName = newCat.name;
    } else {
      const matchedCat = categories.find(c => c.id === targetCatId);
      targetCatName = matchedCat?.name || 'General';
    }

    if (!targetCatId) return;

    const saved: Subject = {
      id: subjectForm.id || `subj-${Date.now()}`,
      name: subjectForm.name,
      categoryId: targetCatId,
      categoryName: targetCatName,
      scheduleId: subjectForm.scheduleId || schedules[0]?.id || 'lucidia-adaptive',
      revisionStage: subjectForm.revisionStage ?? 0,
      intervalDays: subjectForm.intervalDays ?? 1,
      stability: subjectForm.stability ?? 1.0,
      difficulty: subjectForm.difficulty ?? 5.0,
      nextDueDate: subjectForm.nextDueDate || todayStr,
      status: (subjectForm.intervalDays || 1) >= 30 ? 'mastered' : 'scheduled',
      notes: subjectForm.notes || '',
      createdAt: subjectForm.createdAt || new Date().toISOString(),
      lastRevisedAt: subjectForm.lastRevisedAt,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-1 flex items-center gap-2">
            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400" />
            <span>Academic Categories & Subjects</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Define subject curricula, schedule revision milestones, and track memory consolidation stages.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
          <button
            onClick={() => {
              setCategoryForm({
                name: '',
                color: 'indigo',
                description: '',
              });
              setIsCategoryModalOpen(true);
            }}
            className="flex-1 sm:flex-none min-h-[44px] flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-900 hover:bg-slate-850 border border-slate-700 rounded-xl transition-colors active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Category</span>
          </button>

          <button
            onClick={handleOpenNewSubject}
            className="flex-1 sm:flex-none min-h-[44px] flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-sm transition-all active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Subject</span>
          </button>
        </div>
      </div>

      {/* Categories Horizontal Scroller / Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setSelectedCategoryFilter('all')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 border ${
            selectedCategoryFilter === 'all'
              ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
              : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white'
          }`}
        >
          All Categories ({subjects.length})
        </button>

        {categories.map(cat => {
          const isSelected = selectedCategoryFilter === cat.id;
          const count = subjects.filter(s => s.categoryId === cat.id).length;

          return (
            <div
              key={cat.id}
              className={`flex items-center gap-1.5 pl-3 pr-2 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 border ${
                isSelected
                  ? 'bg-slate-800 text-white border-indigo-500 shadow-sm'
                  : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <button
                onClick={() => setSelectedCategoryFilter(cat.id)}
                className="flex items-center gap-1.5"
              >
                <span className={`w-2 h-2 rounded-full bg-${cat.color}-400`} />
                <span>{cat.name}</span>
                <span className="text-[11px] font-mono text-slate-500">({count})</span>
              </button>

              <button
                onClick={() => onDeleteCategory(cat.id)}
                title="Delete category"
                className="text-slate-600 hover:text-rose-400 ml-1 p-0.5 rounded transition-colors"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Main Container: Search, Filter, and Subject Grid */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
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
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                statusFilter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({subjects.length})
            </button>
            <button
              onClick={() => setStatusFilter('due')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                statusFilter === 'due' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Due Now
            </button>
            <button
              onClick={() => setStatusFilter('mastered')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                statusFilter === 'mastered' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Mastered (&gt;30d)
            </button>
          </div>
        </div>

        {/* Subjects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSubjects.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500 text-sm">
              No subjects found matching your criteria.
            </div>
          ) : (
            filteredSubjects.map(subject => {
              const category = categories.find(c => c.id === subject.categoryId);
              const schedule = schedules.find(s => s.id === subject.scheduleId);
              const isDue = subject.nextDueDate <= todayStr;
              const color = category?.color || 'indigo';

              return (
                <div
                  key={subject.id}
                  className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                    isDue
                      ? 'bg-slate-950/90 border-indigo-500/40 shadow-md shadow-indigo-950/30'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border inline-block mb-1.5 ${getColorClasses(color)}`}>
                          {subject.categoryName}
                        </span>
                        <h3 className="text-base font-bold text-slate-100 leading-snug">
                          {subject.name}
                        </h3>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleEditSubject(subject)}
                          className="min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                          title="Edit subject"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteSubject(subject.id)}
                          className="min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                          title="Delete subject"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {subject.notes && (
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {subject.notes}
                      </p>
                    )}
                  </div>

                  {/* Metadata and Log Action */}
                  <div className="space-y-3 pt-3 border-t border-slate-800/80">
                    <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-500 font-mono">
                      <div>
                        <span className="block text-slate-600 text-[10px]">STAGE</span>
                        <span className="font-bold text-slate-300">Stage {subject.revisionStage}</span>
                      </div>
                      <div>
                        <span className="block text-slate-600 text-[10px]">INTERVAL</span>
                        <span className="font-bold text-slate-300">{formatInterval(subject.intervalDays)}</span>
                      </div>
                      <div>
                        <span className="block text-slate-600 text-[10px]">NEXT REVISION</span>
                        <span className={`font-bold ${isDue ? 'text-indigo-400' : 'text-slate-300'}`}>
                          {isDue ? 'Due Today' : subject.nextDueDate}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => onOpenLogSession(subject)}
                      className={`w-full min-h-[44px] py-2 px-3 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] ${
                        isDue
                          ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-600/30'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800'
                      }`}
                    >
                      <Check className="w-4 h-4" />
                      <span>{isDue ? 'Log Due Revision Session' : 'Log Early Revision'}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Category Create Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white mb-4">Create Category</h3>

            <form onSubmit={handleSaveCategorySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="e.g. Cognitive Neuroscience"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Accent Color
                </label>
                <select
                  value={categoryForm.color}
                  onChange={e => setCategoryForm({ ...categoryForm, color: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="indigo">Indigo</option>
                  <option value="emerald">Emerald</option>
                  <option value="amber">Amber</option>
                  <option value="violet">Violet</option>
                  <option value="rose">Rose</option>
                  <option value="sky">Sky Blue</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  value={categoryForm.description}
                  onChange={e => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  placeholder="Summary of this academic domain..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="min-h-[44px] px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-sm transition-all active:scale-[0.98]"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subject Create / Edit Modal */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white mb-4">
              {subjectForm.id?.startsWith('subj-') && subjects.some(s => s.id === subjectForm.id)
                ? 'Edit Subject'
                : 'Create New Subject'}
            </h3>

            <form onSubmit={handleSaveSubjectSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Subject Name / Topic
                </label>
                <input
                  type="text"
                  value={subjectForm.name}
                  onChange={e => setSubjectForm({ ...subjectForm, name: e.target.value })}
                  placeholder="e.g. Distributed Consensus & Paxos"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Academic Category
                  </label>
                  {categories.length > 0 ? (
                    <select
                      value={subjectForm.categoryId || ''}
                      onChange={e => setSubjectForm({ ...subjectForm, categoryId: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                      required
                    >
                      <option value="">Select Category...</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={newCategoryInline}
                      onChange={e => setNewCategoryInline(e.target.value)}
                      placeholder="Type category (e.g. Science)"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                      required
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Revision Schedule Model
                  </label>
                  <select
                    value={subjectForm.scheduleId}
                    onChange={e => setSubjectForm({ ...subjectForm, scheduleId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    {schedules.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  First / Next Revision Date on Calendar
                </label>
                <input
                  type="date"
                  value={subjectForm.nextDueDate}
                  onChange={e => setSubjectForm({ ...subjectForm, nextDueDate: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Syllabus Notes / Concepts to Revise
                </label>
                <textarea
                  rows={3}
                  value={subjectForm.notes}
                  onChange={e => setSubjectForm({ ...subjectForm, notes: e.target.value })}
                  placeholder="e.g. Master leader election, quorum validation, and log compaction..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSubjectModalOpen(false)}
                  className="min-h-[44px] px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-sm transition-all active:scale-[0.98]"
                >
                  Save Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
