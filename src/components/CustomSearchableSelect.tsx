import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
  badge?: string;
  badgeColor?: string;
}

interface CustomSearchableSelectProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  required?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  hideSearch?: boolean;
}

export const CustomSearchableSelect: React.FC<CustomSearchableSelectProps> = ({
  label,
  placeholder = 'Select Option...',
  value,
  onChange,
  options,
  required = false,
  className = '',
  size = 'md',
  hideSearch,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const isSmall = size === 'sm';
  const showSearch = hideSearch !== undefined ? !hideSearch : options.length > 5;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = useMemo(() => {
    return options.find(o => o.value === value);
  }, [options, value]);

  const filteredOptions = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return options;
    return options.filter(
      o =>
        o.label.toLowerCase().includes(q) ||
        (o.sublabel && o.sublabel.toLowerCase().includes(q)) ||
        (o.badge && o.badge.toLowerCase().includes(q))
    );
  }, [options, searchQuery]);

  return (
    <div className={`relative ${isOpen ? 'z-40' : 'z-auto'} ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        title={selectedOption ? selectedOption.label : placeholder}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full ${
          isSmall
            ? 'py-1.5 px-2.5 rounded-xl text-xs'
            : 'py-3 px-3.5 rounded-2xl text-xs'
        } bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold dark:text-white flex items-center justify-between gap-2 text-left cursor-pointer focus:ring-2 focus:ring-primary transition shadow-xs`}
      >
        {selectedOption ? (
          <div className="flex items-center gap-2 truncate min-w-0 flex-1">
            <span className="font-black text-slate-900 dark:text-white truncate">{selectedOption.label}</span>
            {selectedOption.badge && (
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border shrink-0 ${
                selectedOption.badgeColor || 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20'
              }`}>
                {selectedOption.badge}
              </span>
            )}
            {selectedOption.sublabel && (
              <span className="text-[11px] font-mono text-slate-400 shrink-0 truncate hidden sm:inline">
                ({selectedOption.sublabel})
              </span>
            )}
          </div>
        ) : (
          <span className="text-slate-400 font-normal truncate">{placeholder}</span>
        )}
        <ChevronDown className={`${isSmall ? 'h-3.5 w-3.5' : 'h-4 w-4'} text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Floating Searchable Menu */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-full min-w-[240px] max-w-[calc(100vw-2rem)] bg-white dark:bg-[#091124] border border-slate-200 dark:border-slate-700/90 rounded-2xl shadow-2xl shadow-slate-900/15 dark:shadow-black/60 z-[9999] p-2 space-y-1.5 max-h-60 sm:max-h-72 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-150">
          {/* Search Bar */}
          {showSearch && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Type to search..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-slate-400"
                autoFocus
              />
            </div>
          )}

          {/* Options List */}
          <div className="space-y-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(o => {
                const isSelected = o.value === value;
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => {
                      onChange(o.value);
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                    className={`w-full ${isSmall ? 'p-2 rounded-lg' : 'p-2.5 rounded-xl'} text-left flex flex-col gap-1 transition cursor-pointer ${
                      isSelected
                        ? 'bg-primary text-white font-bold shadow-xs'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 w-full">
                      <span className="text-xs font-bold tracking-tight leading-snug">{o.label}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {o.badge && (
                          <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700'
                          }`}>
                            {o.badge}
                          </span>
                        )}
                        {isSelected && (
                          <Check className="h-3.5 w-3.5 shrink-0 text-white" />
                        )}
                      </div>
                    </div>
                    {o.sublabel && (
                      <span className={`text-[11px] leading-tight break-words ${
                        isSelected ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'
                      }`}>
                        {o.sublabel}
                      </span>
                    )}
                  </button>
                );
              })
            ) : (
              <div className="p-3 text-center text-xs text-slate-400">
                No matching options found.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
