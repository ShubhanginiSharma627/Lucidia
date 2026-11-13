import React, { useState, useRef, useEffect } from 'react';
import { Category, Subject } from '../types';
import { getDotColorClass, subjectMatchesCategories as sharedSubjectMatchesCategories, getSubjectCategoryIds } from '../services/colors';
import { Filter, ChevronDown, Check } from 'lucide-react';

export const subjectMatchesCategories = sharedSubjectMatchesCategories;

export function getCategoryColorDot(color: string): string {
  return getDotColorClass(color);
}

interface MultiCategorySelectProps {
  categories: Category[];
  selectedCategoryIds: string[]; // empty or ['all'] means all
  onChange: (selectedIds: string[]) => void;
  subjects?: Subject[];
  className?: string;
  align?: 'left' | 'right';
  placeholder?: string;
}

export const MultiCategorySelect: React.FC<MultiCategorySelectProps> = ({
  categories,
  selectedCategoryIds,
  onChange,
  subjects = [],
  className = '',
  align = 'left',
  placeholder = 'Categories',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const isAllSelected = selectedCategoryIds.length === 0 || selectedCategoryIds.includes('all');

  // Compute subject count per category
  const categoryCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    for (const cat of categories) {
      counts[cat.id] = subjects.filter(s => getSubjectCategoryIds(s).includes(cat.id)).length;
    }
    return counts;
  }, [categories, subjects]);

  const handleToggleCategory = (catId: string) => {
    if (isAllSelected) {
      // Transition from All to just this one category
      onChange([catId]);
    } else {
      if (selectedCategoryIds.includes(catId)) {
        const next = selectedCategoryIds.filter(id => id !== catId);
        // If nothing left selected, revert to all
        onChange(next.length === 0 ? [] : next);
      } else {
        const next = [...selectedCategoryIds, catId];
        // If all individual categories are selected, simplify to all ([])
        if (next.length === categories.length) {
          onChange([]);
        } else {
          onChange(next);
        }
      }
    }
  };

  const handleSelectAll = () => {
    onChange([]);
  };

  const handleClear = () => {
    onChange([]);
  };

  // Determine button trigger label
  const renderLabel = () => {
    if (isAllSelected) {
      return (
        <span className="flex items-center gap-1.5 truncate">
          <span>All Categories</span>
          <span className="text-[11px] text-slate-400 font-mono">({categories.length})</span>
        </span>
      );
    }
    if (selectedCategoryIds.length === 1) {
      const cat = categories.find(c => c.id === selectedCategoryIds[0]);
      if (cat) {
        return (
          <span className="flex items-center gap-1.5 truncate">
            <span className={`w-2 h-2 rounded-full shrink-0 ${getCategoryColorDot(cat.color)}`} />
            <span className="truncate">{cat.name}</span>
          </span>
        );
      }
    }
    // Multiple categories selected
    const selectedCats = categories.filter(c => selectedCategoryIds.includes(c.id));
    return (
      <span className="flex items-center gap-1.5 truncate">
        <span className="flex -space-x-1 shrink-0">
          {selectedCats.slice(0, 3).map(c => (
            <span
              key={c.id}
              className={`w-2.5 h-2.5 rounded-full border border-slate-900 ${getCategoryColorDot(c.color)}`}
            />
          ))}
        </span>
        <span className="truncate font-semibold text-indigo-300">
          {selectedCategoryIds.length} Categories
        </span>
      </span>
    );
  };

  return (
    <div ref={dropdownRef} className={`relative inline-block ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={`min-h-[40px] px-3 py-1.5 rounded-xl border text-xs font-medium transition-all flex items-center justify-between gap-2.5 bg-slate-900 shadow-sm whitespace-nowrap shrink-0 ${
          !isAllSelected
            ? 'border-indigo-500/80 text-slate-100 ring-1 ring-indigo-500/30'
            : 'border-slate-700 hover:border-slate-600 text-slate-200'
        }`}
      >
        <span className="flex items-center gap-2 truncate">
          <Filter className={`w-3.5 h-3.5 shrink-0 ${!isAllSelected ? 'text-indigo-400' : 'text-slate-400'}`} />
          {renderLabel()}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-indigo-400' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu Popover (Bottom sheet on mobile, anchored popover on sm+) */}
      {isOpen && (
        <>
          <div
            onClick={() => setIsOpen(false)}
            className="sm:hidden fixed inset-0 z-[74] bg-black/60 backdrop-blur-[1px]"
            aria-hidden="true"
          />
          <div
            className={`fixed inset-x-0 bottom-0 z-[75] w-full max-w-full max-h-[78dvh] flex flex-col rounded-t-2xl sm:rounded-2xl sm:inset-x-auto sm:bottom-auto sm:absolute sm:top-full sm:mt-1.5 sm:z-50 sm:w-72 sm:max-w-[90vw] bg-slate-900/95 backdrop-blur-xl border-t sm:border border-slate-700/80 shadow-2xl p-3 sm:p-2.5 space-y-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:pb-2.5 animate-fade-in ${
              align === 'right' ? 'sm:right-0' : 'sm:left-0'
            }`}
          >
            {/* Mobile grab handle */}
            <div className="sm:hidden flex justify-center pb-1 shrink-0">
              <span className="w-9 h-1 rounded-full bg-slate-700/80" aria-hidden="true" />
            </div>

            {/* Header & Quick Action Toggles */}
            <div className="shrink-0 flex items-center justify-between px-1.5 pb-2 border-b border-slate-800 text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <span>Filter Categories</span>
                {!isAllSelected && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-500/20 text-indigo-300 font-mono font-bold">
                    {selectedCategoryIds.length}
                  </span>
                )}
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                    isAllSelected
                      ? 'text-indigo-400 bg-indigo-500/10'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  All
                </button>
                {!isAllSelected && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="px-2 py-0.5 rounded text-[11px] text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Categories List with Multi-Choice Checkboxes */}
            <div className="flex-1 min-h-0 max-h-[48dvh] sm:max-h-60 overflow-y-auto overflow-x-hidden space-y-1 pr-1 scrollbar-thin">
              {categories.length === 0 ? (
                <div className="text-center py-4 text-xs text-slate-500">
                  No categories created yet
                </div>
              ) : (
                categories.map(cat => {
                  const isChecked = isAllSelected || selectedCategoryIds.includes(cat.id);
                  const count = categoryCounts[cat.id] || 0;

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleToggleCategory(cat.id)}
                      className={`w-full min-w-0 flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors ${
                        isChecked
                          ? 'bg-indigo-950/40 text-slate-100 hover:bg-indigo-900/40'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0 ${
                            isChecked
                              ? 'bg-indigo-600 border-indigo-500 text-white'
                              : 'border-slate-700 bg-slate-950'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>

                        <span className={`w-2 h-2 rounded-full shrink-0 ${getCategoryColorDot(cat.color)}`} />
                        <span className="truncate font-medium">{cat.name}</span>
                      </div>

                      <span className="text-[10px] text-slate-500 font-mono ml-2 shrink-0">
                        ({count})
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            {/* Active Filter Helper Hint + Mobile Done */}
            <div className="shrink-0 pt-1.5 border-t border-slate-800/80 px-1 text-[11px] text-slate-400 flex items-center justify-between gap-2">
              <span className="truncate">
                {isAllSelected
                  ? 'Showing all subjects'
                  : `Showing ${selectedCategoryIds.length} of ${categories.length} categories`}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                {!isAllSelected && (
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-indigo-400 hover:text-indigo-300 font-medium"
                  >
                    Show All
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="sm:hidden px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
