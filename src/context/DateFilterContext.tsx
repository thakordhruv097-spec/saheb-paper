import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

export type TimeframeMode = 'day' | 'week' | 'month' | 'all';

interface DateFilterContextType {
  timeframe: TimeframeMode;
  setTimeframe: (mode: TimeframeMode) => void;
  selectedDate: string; // YYYY-MM-DD
  setSelectedDate: (date: string) => void;
  handlePrevDate: () => void;
  handleNextDate: () => void;
  systemToday: string; // YYYY-MM-DD (actual current system date)
  dateTick: number; // Increments on date change / midnight rollover
}

const DateFilterContext = createContext<DateFilterContextType | undefined>(undefined);

export const getSystemTodayStr = (): string => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export const getDateRangeForTimeframe = (selectedDate: string, timeframe: TimeframeMode): { startStr: string; endStr: string; label: string } => {
  if (timeframe === 'all') {
    return { startStr: '1970-01-01', endStr: '2099-12-31', label: 'All Time' };
  }
  if (timeframe === 'day') {
    return { startStr: selectedDate, endStr: selectedDate, label: `Day (${selectedDate})` };
  }
  if (timeframe === 'month') {
    const monthPrefix = selectedDate.substring(0, 7);
    const [y, m] = monthPrefix.split('-').map(Number);
    const lastDay = new Date(y, m, 0).getDate();
    return {
      startStr: `${monthPrefix}-01`,
      endStr: `${monthPrefix}-${String(lastDay).padStart(2, '0')}`,
      label: `Month (${monthPrefix})`,
    };
  }
  if (timeframe === 'week') {
    const parts = selectedDate.split('-').map(Number);
    const [y, m, d] = parts;
    const startDt = new Date(y, m - 1, d - 6);
    const startStr = `${startDt.getFullYear()}-${String(startDt.getMonth() + 1).padStart(2, '0')}-${String(startDt.getDate()).padStart(2, '0')}`;
    return {
      startStr,
      endStr: selectedDate,
      label: `Week (${startStr} ~ ${selectedDate})`,
    };
  }
  return { startStr: selectedDate, endStr: selectedDate, label: selectedDate };
};

export const isDateInTimeframe = (targetDateStr: string | undefined, selectedDate: string, timeframe: TimeframeMode): boolean => {
  if (!targetDateStr) return false;
  if (timeframe === 'all') return true;
  const target = targetDateStr.substring(0, 10);
  if (timeframe === 'day') return target === selectedDate;
  if (timeframe === 'month') return target.startsWith(selectedDate.substring(0, 7));
  if (timeframe === 'week') {
    const { startStr, endStr } = getDateRangeForTimeframe(selectedDate, 'week');
    return target >= startStr && target <= endStr;
  }
  return true;
};

export const DateFilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [timeframe, setTimeframeState] = useState<TimeframeMode>(() => {
    const saved = localStorage.getItem('saheb_selected_timeframe');
    if (saved === 'day' || saved === 'week' || saved === 'month' || saved === 'all') return saved;
    return 'day';
  });

  const [systemToday, setSystemToday] = useState<string>(() => getSystemTodayStr());
  const [dateTick, setDateTick] = useState<number>(0);

  const [selectedDate, setSelectedDateState] = useState<string>(() => {
    const todayStr = getSystemTodayStr();
    const savedDate = localStorage.getItem('saheb_selected_date');
    // If in day timeframe, always default to actual current system date on session load
    if (timeframe === 'day') {
      localStorage.setItem('saheb_selected_date', todayStr);
      return todayStr;
    }
    if (savedDate) {
      return savedDate;
    }
    localStorage.setItem('saheb_selected_date', todayStr);
    return todayStr;
  });

  const lastKnownTodayRef = useRef<string>(systemToday);

  // Background midnight checker: runs every 15 seconds + on window focus / tab visibility change
  useEffect(() => {
    const checkDateRollover = () => {
      const currentSystemToday = getSystemTodayStr();
      const lastKnown = lastKnownTodayRef.current;

      if (currentSystemToday !== lastKnown) {
        lastKnownTodayRef.current = currentSystemToday;
        setSystemToday(currentSystemToday);

        setSelectedDateState((prevSelected) => {
          if (prevSelected === lastKnown || timeframe === 'day') {
            localStorage.setItem('saheb_selected_date', currentSystemToday);
            return currentSystemToday;
          }
          return prevSelected;
        });

        setDateTick((prev) => prev + 1);

        window.dispatchEvent(
          new CustomEvent('saheb_date_changed', {
            detail: { previousDate: lastKnown, newDate: currentSystemToday },
          })
        );
      }
    };

    const intervalId = setInterval(checkDateRollover, 15000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkDateRollover();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', checkDateRollover);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', checkDateRollover);
    };
  }, [timeframe]);

  const setTimeframe = (mode: TimeframeMode) => {
    setTimeframeState(mode);
    localStorage.setItem('saheb_selected_timeframe', mode);
  };

  const handleSetSelectedDate = (date: string) => {
    const todayStr = getSystemTodayStr();
    const finalDate = date > todayStr ? todayStr : date;
    setSelectedDateState(finalDate);
    localStorage.setItem('saheb_selected_date', finalDate);
  };

  const handlePrevDate = () => {
    const parts = selectedDate.split('-').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return;
    const [y, m, d] = parts;
    const dt = new Date(y, m - 1, d);

    if (timeframe === 'day') dt.setDate(dt.getDate() - 1);
    else if (timeframe === 'week') dt.setDate(dt.getDate() - 7);
    else if (timeframe === 'month') dt.setMonth(dt.getMonth() - 1);
    else if (timeframe === 'all') dt.setFullYear(dt.getFullYear() - 1);

    const prevStr = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
    handleSetSelectedDate(prevStr);
  };

  const handleNextDate = () => {
    const todayStr = getSystemTodayStr();
    if (selectedDate >= todayStr) return;

    const parts = selectedDate.split('-').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return;
    const [y, m, d] = parts;
    const dt = new Date(y, m - 1, d);

    if (timeframe === 'day') dt.setDate(dt.getDate() + 1);
    else if (timeframe === 'week') dt.setDate(dt.getDate() + 7);
    else if (timeframe === 'month') dt.setMonth(dt.getMonth() + 1);
    else if (timeframe === 'all') dt.setFullYear(dt.getFullYear() + 1);

    const nextStr = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
    handleSetSelectedDate(nextStr > todayStr ? todayStr : nextStr);
  };

  return (
    <DateFilterContext.Provider
      value={{
        timeframe,
        setTimeframe,
        selectedDate,
        setSelectedDate: handleSetSelectedDate,
        handlePrevDate,
        handleNextDate,
        systemToday,
        dateTick,
      }}
    >
      {children}
    </DateFilterContext.Provider>
  );
};

export const useDateFilter = () => {
  const context = useContext(DateFilterContext);
  if (!context) {
    throw new Error('useDateFilter must be used within a DateFilterProvider');
  }
  return context;
};

