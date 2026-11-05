import { useState, useMemo, useEffect } from 'react';
import {
  getFestivalTheme,
  getThemeById,
  DEFAULT_THEME,
  THEME_COLLECTION_11,
  FestivalTheme,
} from './festivalThemes';

/**
 * Hook to automatically detect and apply festival themes,
 * with optional manual override for previewing all 11 themes.
 */
export function useFestivalTheme() {
  const [selectedThemeId, setSelectedThemeId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('saheb_login_theme_override');
      return saved || 'auto';
    } catch {
      return 'auto';
    }
  });

  const calendarTheme = useMemo(() => {
    const today = new Date();
    return getFestivalTheme(today);
  }, []);

  const activeTheme: FestivalTheme = useMemo(() => {
    if (selectedThemeId && selectedThemeId !== 'auto') {
      return getThemeById(selectedThemeId);
    }
    return calendarTheme || DEFAULT_THEME;
  }, [selectedThemeId, calendarTheme]);

  const setThemeOverride = (id: string) => {
    setSelectedThemeId(id);
    try {
      if (id === 'auto') {
        localStorage.removeItem('saheb_login_theme_override');
      } else {
        localStorage.setItem('saheb_login_theme_override', id);
      }
    } catch {
      // Ignore storage errors
    }
  };

  const isFestivalActive = activeTheme.id !== 'default';

  return {
    activeTheme,
    selectedThemeId,
    setThemeOverride,
    isFestivalActive,
    allThemes: THEME_COLLECTION_11,
    colors: activeTheme.colors,
  };
}

/**
 * Dynamic styles based on festival theme
 */
export function getFestivalStyles(theme: FestivalTheme | null) {
  const current = theme || DEFAULT_THEME;
  return {
    primaryColor: current.colors.primary,
    secondaryColor: current.colors.secondary,
    accentColor: current.colors.accent,
    gradientClass: current.colors.gradient,
    bgColor: current.colors.background,
    cardBgClass: current.colors.cardBg,
    textColor: '#1E1B4B',
    headline: current.headline,
    description: current.description,
    tagline: current.tagline,
    bottomSlogan: current.bottomSlogan,
    festivalIcons: current.icons,
    bgImage: current.bgImage,
  };
}
