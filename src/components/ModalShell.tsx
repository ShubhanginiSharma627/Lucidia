import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalShellProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  headerContent?: React.ReactNode;
  maxWidthClass?: string;
  hideOnDesktop?: boolean;
  closeAriaLabel?: string;
  children: React.ReactNode;
}

const DESKTOP_MAX_WIDTH_MAP: Record<string, string> = {
  'max-w-sm': 'sm:max-w-sm',
  'max-w-md': 'sm:max-w-md',
  'max-w-lg': 'sm:max-w-lg',
  'max-w-xl': 'sm:max-w-xl',
  'max-w-2xl': 'sm:max-w-2xl',
};

export const ModalShell: React.FC<ModalShellProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  headerContent,
  maxWidthClass = 'max-w-lg',
  hideOnDesktop = false,
  closeAriaLabel = 'Close dialog',
  children,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  const desktopMaxWidthClass = DESKTOP_MAX_WIDTH_MAP[maxWidthClass] || 'sm:max-w-lg';

  return createPortal(
    <div
      onClick={onClose}
      className={`fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-5 overflow-hidden ${
        hideOnDesktop ? 'md:hidden' : ''
      }`}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={e => e.stopPropagation()}
        className={`bg-slate-900 border-t sm:border border-slate-800 rounded-t-2xl sm:rounded-2xl w-full min-w-0 max-w-full ${desktopMaxWidthClass} max-h-[88dvh] sm:max-h-[84dvh] flex flex-col shadow-2xl overflow-hidden pb-[env(safe-area-inset-bottom)]`}
      >
        {/* Mobile bottom-sheet grab handle cue */}
        <div className="sm:hidden flex justify-center pt-2 pb-0.5 shrink-0 bg-slate-900">
          <span className="w-9 h-1 rounded-full bg-slate-700/80" aria-hidden="true" />
        </div>

        {/* Sticky Modal Header */}
        <div className="shrink-0 min-w-0 flex items-center justify-between gap-3 px-4 sm:px-5 py-2.5 sm:py-3 bg-slate-900 border-b border-slate-800">
          <div className="min-w-0 flex-1">
            {headerContent ? (
              headerContent
            ) : (
              <>
                {subtitle && <div className="mb-0.5 min-w-0">{subtitle}</div>}
                {title && (
                  <h3 className="text-base sm:text-lg font-bold text-white leading-snug truncate">
                    {title}
                  </h3>
                )}
              </>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={closeAriaLabel}
            className="min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Slot (caller provides scrollable body & optional sticky footer) */}
        <div className="flex flex-col flex-1 min-h-0 min-w-0 max-w-full overflow-hidden">{children}</div>
      </div>
    </div>,
    document.body
  );
};
