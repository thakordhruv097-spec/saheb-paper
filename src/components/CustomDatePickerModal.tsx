import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useDateFilter, type TimeframeMode } from '../context/DateFilterContext';

interface CustomDatePickerProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (dateStr: string) => void;
  onClose: () => void;
  align?: 'left' | 'right';
  allowFuture?: boolean;
  triggerRef?: React.RefObject<HTMLElement | null>;
  showTimeframe?: boolean;
  timeframe?: TimeframeMode;
  onTimeframeChange?: (tf: TimeframeMode) => void;
}

type ViewMode = 'days' | 'months' | 'years';

const calculatePopoverStyle = (
  triggerEl: HTMLElement | null,
  align: 'left' | 'right'
): React.CSSProperties => {
  let targetEl = triggerEl;
  if (!targetEl && typeof document !== 'undefined') {
    const active = document.activeElement as HTMLElement;
    if (active && active !== document.body) {
      targetEl = active;
    }
  }

  if (!targetEl || targetEl === document.body) {
    const top = 70;
    const left = align === 'right' ? Math.max(10, window.innerWidth - 300) : 20;
    return {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      zIndex: 999999,
      transformOrigin: align === 'right' ? 'top right' : 'top left',
    };
  }

  const rect = targetEl.getBoundingClientRect();
  const popoverWidth = 288; // w-72
  const popoverHeight = 360;
  const spaceBelow = window.innerHeight - rect.bottom;
  const openUpward = spaceBelow < popoverHeight && rect.top > popoverHeight;

  let top = openUpward ? rect.top - popoverHeight - 6 : rect.bottom + 6;
  if (top < 10) top = 10;

  // Center horizontally directly on the middle of the calendar button/icon
  const buttonCenterX = rect.left + rect.width / 2;
  let left = buttonCenterX - popoverWidth / 2;

  if (left + popoverWidth > window.innerWidth - 10) {
    left = window.innerWidth - popoverWidth - 10;
  }
  if (left < 10) left = 10;

  const originY = openUpward ? 'bottom' : 'top';

  return {
    position: 'fixed',
    top: `${top}px`,
    left: `${left}px`,
    zIndex: 999999,
    transformOrigin: `${originY} center`,
  };
};

export const CustomDatePickerModal: React.FC<CustomDatePickerProps> = ({
  selectedDate,
  onSelectDate,
  onClose,
  align = 'left',
  allowFuture = false,
  triggerRef,
  showTimeframe = true,
  timeframe: propTimeframe,
  onTimeframeChange,
}) => {
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>(() =>
    calculatePopoverStyle(triggerRef?.current || null, align)
  );

  let dateFilterContext: ReturnType<typeof useDateFilter> | null = null;
  try {
    dateFilterContext = useDateFilter();
  } catch {
    dateFilterContext = null;
  }

  const activeTimeframe: TimeframeMode = propTimeframe || dateFilterContext?.timeframe || 'day';

  const handleTimeframeSelect = (tf: TimeframeMode) => {
    if (onTimeframeChange) {
      onTimeframeChange(tf);
    } else if (dateFilterContext) {
      dateFilterContext.setTimeframe(tf);
    }
    if (tf === 'month') {
      setViewMode('months');
    } else if (tf === 'day' || tf === 'week') {
      setViewMode('days');
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const updatePosition = () => {
      setPopoverStyle(calculatePopoverStyle(triggerRef?.current || null, align));
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [align, triggerRef]);

  const initialDate = selectedDate ? new Date(selectedDate) : new Date();
  const validInitialDate = isNaN(initialDate.getTime()) ? new Date() : initialDate;

  const [viewMode, setViewMode] = useState<ViewMode>('days');
  const [viewYear, setViewYear] = useState<number>(validInitialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(validInitialDate.getMonth()); // 0-11
  const [yearBlockStart, setYearBlockStart] = useState<number>(
    Math.floor(validInitialDate.getFullYear() / 12) * 12
  );
  const [tempSelectedDate, setTempSelectedDate] = useState<string>(selectedDate);

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  const getSystemTodayStr = (): string => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const todayStr = getSystemTodayStr();
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // Navigation handlers per View Mode
  const handlePrev = () => {
    if (viewMode === 'days') {
      if (viewMonth === 0) {
        setViewMonth(11);
        setViewYear(prev => prev - 1);
      } else {
        setViewMonth(prev => prev - 1);
      }
    } else if (viewMode === 'months') {
      setViewYear(prev => prev - 1);
    } else if (viewMode === 'years') {
      setYearBlockStart(prev => prev - 12);
    }
  };

  const handleNext = () => {
    if (viewMode === 'days') {
      if (viewMonth === 11) {
        setViewMonth(0);
        setViewYear(prev => prev + 1);
      } else {
        setViewMonth(prev => prev + 1);
      }
    } else if (viewMode === 'months') {
      setViewYear(prev => prev + 1);
    } else if (viewMode === 'years') {
      setYearBlockStart(prev => prev + 12);
    }
  };

  const handleHeaderLabelClick = () => {
    if (viewMode === 'days') {
      setViewMode('months');
    } else if (viewMode === 'months') {
      setYearBlockStart(Math.floor(viewYear / 12) * 12);
      setViewMode('years');
    }
  };

  const handleSetToday = () => {
    const freshTodayStr = getSystemTodayStr();
    const todayDate = new Date();
    setViewYear(todayDate.getFullYear());
    setViewMonth(todayDate.getMonth());
    setViewMode('days');
    setTempSelectedDate(freshTodayStr);
    onSelectDate(freshTodayStr);
    onClose();
  };

  const handleDateCellClick = (dateStr: string) => {
    setTempSelectedDate(dateStr);
    onSelectDate(dateStr);
    onClose();
  };

  const handleMonthCellClick = (monthIndex: number) => {
    setViewMonth(monthIndex);
    setViewMode('days');
  };

  const handleYearCellClick = (yearVal: number) => {
    setViewYear(yearVal);
    setViewMode('months');
  };

  const handleApply = () => {
    onSelectDate(tempSelectedDate);
    onClose();
  };

  // Calendar Days calculation for Days View
  const rawFirstDay = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sun
  const firstDayOfMonth = rawFirstDay === 0 ? 6 : rawFirstDay - 1; // 0 = Mon
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const calendarDays = [];
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const prevDay = daysInPrevMonth - i;
    const prevMonthIdx = viewMonth === 0 ? 11 : viewMonth - 1;
    const prevYearVal = viewMonth === 0 ? viewYear - 1 : viewYear;
    const mmStr = String(prevMonthIdx + 1).padStart(2, '0');
    const ddStr = String(prevDay).padStart(2, '0');
    calendarDays.push({
      dayNum: prevDay,
      dateStr: `${prevYearVal}-${mmStr}-${ddStr}`,
      isCurrentMonth: false,
    });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const mmStr = String(viewMonth + 1).padStart(2, '0');
    const ddStr = String(d).padStart(2, '0');
    calendarDays.push({
      dayNum: d,
      dateStr: `${viewYear}-${mmStr}-${ddStr}`,
      isCurrentMonth: true,
    });
  }

  const totalCells = Math.ceil(calendarDays.length / 7) * 7;
  const nextPaddingCount = totalCells - calendarDays.length;
  for (let n = 1; n <= nextPaddingCount; n++) {
    const nextMonthIdx = viewMonth === 11 ? 0 : viewMonth + 1;
    const nextYearVal = viewMonth === 11 ? viewYear + 1 : viewYear;
    const mmStr = String(nextMonthIdx + 1).padStart(2, '0');
    const ddStr = String(n).padStart(2, '0');
    calendarDays.push({
      dayNum: n,
      dateStr: `${nextYearVal}-${mmStr}-${ddStr}`,
      isCurrentMonth: false,
    });
  }

  // Disable future navigation check
  const isNextDisabled =
    !allowFuture &&
    (viewMode === 'days'
      ? viewYear > currentYear || (viewYear === currentYear && viewMonth >= currentMonth)
      : viewMode === 'months'
      ? viewYear >= currentYear
      : yearBlockStart >= currentYear);

  // Years array for Years View (12 years block)
  const yearsBlock = Array.from({ length: 12 }, (_, i) => yearBlockStart + i);

  return ReactDOM.createPortal(
    <>
      {/* Invisible backdrop click catcher (no dark screen blur) */}
      <div data-custom-datepicker="true" className="fixed inset-0 z-[999998]" onClick={onClose} />

      {/* Small Popover Date Picker positioned directly below calendar button */}
      <div
        ref={popoverRef}
        data-custom-datepicker="true"
        style={popoverStyle}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-3.5 shadow-2xl w-72 font-sans space-y-3 animate-in fade-in zoom-in-95 duration-150 select-none"
      >
        {/* Top Timeframe Selector Tabs (Day | Week | Month | All) */}
        {showTimeframe && (
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/90 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 gap-1 shrink-0">
            {(['day', 'week', 'month', 'all'] as const).map(tf => {
              const isActive = activeTimeframe === tf;
              return (
                <button
                  key={tf}
                  type="button"
                  onClick={() => handleTimeframeSelect(tf)}
                  className={`flex-1 py-1 text-xs font-black rounded-xl capitalize transition-all cursor-pointer text-center ${
                    isActive
                      ? 'bg-gradient-to-r from-[#6C4FE0] to-[#7C3AED] text-white shadow-sm shadow-[#6C4FE0]/30'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/50'
                  }`}
                >
                  {tf === 'day' ? 'Day' : tf === 'week' ? 'Week' : tf === 'month' ? 'Month' : 'All'}
                </button>
              );
            })}
          </div>
        )}

        {/* Navigation Header */}
        <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={handlePrev}
            className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
            title="Previous"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>

          {/* Header Label (Clickable to change view mode) */}
          <button
            type="button"
            onClick={handleHeaderLabelClick}
            disabled={viewMode === 'years'}
            className={`px-2.5 py-1 rounded-xl text-xs font-black tracking-tight transition cursor-pointer flex items-center gap-1 ${
              viewMode === 'years'
                ? 'text-slate-900 dark:text-white cursor-default'
                : 'text-slate-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:text-primary dark:hover:text-blue-400'
            }`}
          >
            {viewMode === 'days' && (
              <span>{months[viewMonth]} {viewYear}</span>
            )}
            {viewMode === 'months' && (
              <span>{viewYear}</span>
            )}
            {viewMode === 'years' && (
              <span>{yearBlockStart} - {yearBlockStart + 11}</span>
            )}
          </button>

          <button
            type="button"
            onClick={handleNext}
            disabled={isNextDisabled}
            className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:pointer-events-none"
            title="Next"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* 1. DAYS VIEW */}
        {viewMode === 'days' && (
          <div className="space-y-2">
            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-0.5 text-center">
              {weekDays.map((wd, i) => (
                <div key={`${wd}-${i}`} className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase py-0.5">
                  {wd}
                </div>
              ))}
            </div>

            {/* Calendar Days Grid */}
            <div className="grid grid-cols-7 gap-0.5 text-center">
              {calendarDays.map((cell, idx) => {
                const isSelected = cell.dateStr === tempSelectedDate;
                const isToday = cell.dateStr === todayStr;
                const isFuture = !allowFuture && cell.dateStr > todayStr;

                return (
                  <button
                    key={`${cell.dateStr}-${idx}`}
                    type="button"
                    disabled={isFuture}
                    onClick={() => !isFuture && handleDateCellClick(cell.dateStr)}
                    className={`h-7 w-7 rounded-xl mx-auto flex items-center justify-center text-[11px] font-extrabold transition ${
                      isFuture
                        ? 'opacity-45 text-slate-400 dark:text-slate-500 cursor-not-allowed pointer-events-none select-none'
                        : isSelected
                        ? 'bg-primary text-white font-black shadow-sm shadow-blue-600/40 scale-105 cursor-pointer'
                        : isToday
                        ? 'bg-blue-50 dark:bg-blue-950/50 text-primary dark:text-blue-400 font-extrabold border border-blue-200 dark:border-blue-800 cursor-pointer'
                        : cell.isCurrentMonth
                        ? 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer'
                        : 'text-slate-300 dark:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer'
                    }`}
                  >
                    {cell.dayNum}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. MONTHS VIEW (3-Column Grid of 12 Months) */}
        {viewMode === 'months' && (
          <div className="grid grid-cols-3 gap-2 py-1">
            {months.map((mName, mIdx) => {
              const isSelectedMonth = mIdx === viewMonth;
              const isFutureMonth = !allowFuture && (viewYear > currentYear || (viewYear === currentYear && mIdx > currentMonth));

              return (
                <button
                  key={mName}
                  type="button"
                  disabled={isFutureMonth}
                  onClick={() => !isFutureMonth && handleMonthCellClick(mIdx)}
                  className={`py-2 rounded-2xl text-xs font-black transition cursor-pointer text-center ${
                    isFutureMonth
                      ? 'opacity-45 text-slate-400 dark:text-slate-500 cursor-not-allowed pointer-events-none select-none'
                      : isSelectedMonth
                      ? 'bg-primary text-white shadow-sm shadow-blue-600/40 scale-102'
                      : 'bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-primary dark:hover:text-blue-400 border border-slate-200/60 dark:border-slate-800'
                  }`}
                >
                  {mName}
                </button>
              );
            })}
          </div>
        )}

        {/* 3. YEARS VIEW (3-Column Grid of 12-Year Block) */}
        {viewMode === 'years' && (
          <div className="grid grid-cols-3 gap-2 py-1">
            {yearsBlock.map((yrVal) => {
              const isSelectedYear = yrVal === viewYear;
              const isFutureYear = !allowFuture && yrVal > currentYear;

              return (
                <button
                  key={yrVal}
                  type="button"
                  disabled={isFutureYear}
                  onClick={() => !isFutureYear && handleYearCellClick(yrVal)}
                  className={`py-2 rounded-2xl text-xs font-black font-mono transition cursor-pointer text-center ${
                    isFutureYear
                      ? 'opacity-45 text-slate-400 dark:text-slate-500 cursor-not-allowed pointer-events-none select-none'
                      : isSelectedYear
                      ? 'bg-primary text-white shadow-sm shadow-blue-600/40 scale-102'
                      : 'bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-primary dark:hover:text-blue-400 border border-slate-200/60 dark:border-slate-800'
                  }`}
                >
                  {yrVal}
                </button>
              );
            })}
          </div>
        )}

        {/* Action Bar (Today, Cancel, Apply) */}
        <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={handleSetToday}
            className="text-[11px] font-extrabold text-primary dark:text-blue-400 hover:underline cursor-pointer"
          >
            Today
          </button>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-3.5 py-1 text-[11px] font-extrabold text-white bg-primary hover:bg-blue-700 rounded-lg shadow-xs transition cursor-pointer"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};
