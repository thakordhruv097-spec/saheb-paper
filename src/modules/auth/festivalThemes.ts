/**
 * Festival Theme System for Login Page
 * Automatically detects and applies Indian festival themes based on calendar dates
 * Merges modern industrial paper warehouse aesthetics with festive elegance
 */

export interface FestivalTheme {
  id: string;
  name: string;
  displayName: string;
  dateRange: {
    month: number; // 1-12
    startDay: number;
    endDay: number;
    extendToNextMonth?: boolean;
  };
  bgImage: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    gradient: string;
    background: string;
    cardBg: string;
  };
  headline: {
    line1: string;
    line2: string;
    line3: string;
    line4?: string;
  };
  description: string;
  tagline: string;
  bottomSlogan: string;
  icons: {
    feature1: string;
    feature2: string;
    feature3: string;
  };
  aiImagePrompt: string;
  backgroundOpacity: number;
}

export const DEFAULT_THEME: FestivalTheme = {
  id: 'default',
  name: 'Default',
  displayName: 'Classic Industrial',
  dateRange: { month: 0, startDay: 0, endDay: 0 },
  bgImage: 'login_bg_default.webp',
  colors: {
    primary: '#5E3BE8',
    secondary: '#4E27E0',
    accent: '#6C4FE0',
    gradient: 'from-[#5E3BE8] to-[#4E27E0]',
    background: '#EFEFFD',
    cardBg: 'from-white via-[#FCFBFF] to-[#F5F3FF]',
  },
  headline: {
    line1: 'Efficient',
    line2: 'Paper Management',
    line3: 'for a Brighter',
    line4: 'Tomorrow',
  },
  description:
    "Streamline your operations, track production, manage inventory and empower your business with Saheb Paper's smart management system.",
  tagline: 'Grow with Paper',
  bottomSlogan: 'PAPER FOR A BETTER TOMORROW',
  icons: {
    feature1: 'factory',
    feature2: 'shield',
    feature3: 'trending',
  },
  aiImagePrompt:
    'Modern industrial paper mill warehouse background. Clean organized paper rolls stacked professionally, bright natural lighting, industrial architecture, professional photography, minimalist aesthetic, color palette purple 5E3BE8 and white, 8K quality, no text, clean composition suitable for login page UI background. Premium business environment, spacious warehouse with visible paper manufacturing equipment.',
  backgroundOpacity: 0.15,
};

export const FESTIVAL_THEMES: FestivalTheme[] = [
  // 1. New Year (January 1 - 5)
  {
    id: 'new-year',
    name: 'New Year',
    displayName: 'New Year Celebration',
    dateRange: { month: 1, startDay: 1, endDay: 5 },
    bgImage: 'login_bg_new_year.webp',
    colors: {
      primary: '#6366F1',
      secondary: '#8B5CF6',
      accent: '#EC4899',
      gradient: 'from-[#6366F1] via-[#8B5CF6] to-[#EC4899]',
      background: '#F5F3FF',
      cardBg: 'from-indigo-50 via-purple-50 to-pink-50',
    },
    headline: {
      line1: 'Welcome',
      line2: 'a Prosperous',
      line3: 'New Year',
      line4: 'with Saheb Paper',
    },
    description:
      'Step into the new year with innovative paper manufacturing solutions, unmatched precision, and renewed ambition.',
    tagline: 'Happy New Year',
    bottomSlogan: 'INNOVATION FOR TOMORROW',
    icons: {
      feature1: 'sparkle',
      feature2: 'trending',
      feature3: 'star',
    },
    aiImagePrompt:
      'Futuristic celebration background for New Year in paper warehouse. Confetti, subtle fireworks, champagne bubbles, glowing lights. Indigo 6366F1, purple 8B5CF6, pink EC4899.',
    backgroundOpacity: 0.16,
  },

  // 2. Makar Sankranti / Uttarayan (January 12 - 16)
  {
    id: 'makar-sankranti',
    name: 'Makar Sankranti',
    displayName: 'Uttarayan - Kite Festival',
    dateRange: { month: 1, startDay: 12, endDay: 16 },
    bgImage: 'login_bg_makar_sankranti.webp',
    colors: {
      primary: '#00BCD4',
      secondary: '#FF5722',
      accent: '#FFEB3B',
      gradient: 'from-[#00BCD4] via-[#FF5722] to-[#FFEB3B]',
      background: '#F0F9FF',
      cardBg: 'from-cyan-50 via-orange-50 to-yellow-50',
    },
    headline: {
      line1: 'Soar High',
      line2: 'Like a Kite',
      line3: 'in Business',
      line4: 'this Uttarayan',
    },
    description:
      'Let your business reach new heights this harvest festival. May the skies of success be forever in your favor.',
    tagline: 'Kai Po Che',
    bottomSlogan: 'FLY TOWARDS SUCCESS',
    icons: {
      feature1: 'kite',
      feature2: 'sun',
      feature3: 'harvest',
    },
    aiImagePrompt:
      'Scenic login background for Makar Sankranti kite festival. Clear blue sky filled with colorful kites in cyan 00BCD4, orange FF5722, yellow FFEB3B. Kite strings, sun rays, harvest symbols.',
    backgroundOpacity: 0.18,
  },

  // 3. Pongal (January 13 - 17)
  {
    id: 'pongal',
    name: 'Pongal',
    displayName: 'Pongal Harvest Festival',
    dateRange: { month: 1, startDay: 13, endDay: 17 },
    bgImage: 'login_bg_pongal.webp',
    colors: {
      primary: '#F59E0B',
      secondary: '#10B981',
      accent: '#EF4444',
      gradient: 'from-[#F59E0B] via-[#10B981] to-[#EF4444]',
      background: '#FFFBEB',
      cardBg: 'from-amber-50 via-emerald-50 to-red-50',
    },
    headline: {
      line1: 'Harvesting',
      line2: 'Prosperity & Joy',
      line3: 'this Pongal',
      line4: 'Season',
    },
    description:
      'May the harvest festival fill your industry with overflowing abundance, good fortune, and sustainable growth.',
    tagline: 'Happy Pongal',
    bottomSlogan: 'HARVEST OF EXCELLENCE',
    icons: {
      feature1: 'harvest',
      feature2: 'sun',
      feature3: 'pot',
    },
    aiImagePrompt:
      'Traditional Pongal harvest celebration merged with modern paper warehouse. Clay pongal pot overflowing with sweet rice, sugarcane stalks, turmeric plant, traditional kolam patterns. Warm amber F59E0B, fresh green 10B981, vibrant red EF4444.',
    backgroundOpacity: 0.16,
  },

  // 4. Republic Day (January 24 - 28)
  {
    id: 'republic-day',
    name: 'Republic Day',
    displayName: 'Republic Day (26 Jan)',
    dateRange: { month: 1, startDay: 24, endDay: 28 },
    bgImage: 'login_bg_republic_day.webp',
    colors: {
      primary: '#FF9933',
      secondary: '#138808',
      accent: '#000080',
      gradient: 'from-[#FF9933] via-white to-[#138808]',
      background: '#FFF9F5',
      cardBg: 'from-orange-50 via-white to-green-50',
    },
    headline: {
      line1: 'Celebrating',
      line2: 'the Constitution &',
      line3: 'Nation Building',
      line4: 'with Pride',
    },
    description:
      'Dedicated to the spirit of the Indian Republic. Engineering high-quality kraft paper to drive domestic manufacturing forward.',
    tagline: 'Vande Mataram',
    bottomSlogan: 'POWERING INDUSTRIAL INDIA',
    icons: {
      feature1: 'flag',
      feature2: 'chakra',
      feature3: 'shield',
    },
    aiImagePrompt:
      'Dignified Republic Day celebration in industrial paper mill warehouse. Saffron FF9933, white, and India green 138808 tricolor aesthetic, navy blue Ashoka Chakra details.',
    backgroundOpacity: 0.16,
  },

  // 5. Maha Shivratri (February 26 - 28)
  {
    id: 'mahashivratri',
    name: 'Maha Shivratri',
    displayName: 'Maha Shivratri',
    dateRange: { month: 2, startDay: 26, endDay: 28 },
    bgImage: 'login_bg_default.webp',
    colors: {
      primary: '#4A148C',
      secondary: '#0288D1',
      accent: '#FFB300',
      gradient: 'from-[#4A148C] via-[#0288D1] to-[#FFB300]',
      background: '#F3E5F5',
      cardBg: 'from-purple-50 via-blue-50 to-amber-50',
    },
    headline: {
      line1: 'Divine Blessings',
      line2: 'New Beginnings',
      line3: 'Maha Shivratri',
      line4: '',
    },
    description: 'May Lord Shiva bless your business with strength, prosperity and eternal growth.',
    tagline: 'Har Har Mahadev',
    bottomSlogan: 'DIVINE STRENGTH',
    icons: {
      feature1: 'om',
      feature2: 'trishul',
      feature3: 'damaru',
    },
    aiImagePrompt: 'Spiritual login background for Maha Shivratri.',
    backgroundOpacity: 0.16,
  },

  // 6. Holi (March 10 - 20)
  {
    id: 'holi',
    name: 'Holi',
    displayName: 'Holi - Festival of Colors',
    dateRange: { month: 3, startDay: 10, endDay: 20 },
    bgImage: 'login_bg_holi.webp',
    colors: {
      primary: '#E91E63',
      secondary: '#9C27B0',
      accent: '#FF9800',
      gradient: 'from-[#E91E63] via-[#9C27B0] to-[#FF9800]',
      background: '#FFF5F8',
      cardBg: 'from-pink-50 via-purple-50 to-orange-50',
    },
    headline: {
      line1: 'Add Colors',
      line2: 'of Success',
      line3: 'to Your Business',
      line4: 'this Holi',
    },
    description:
      'Celebrate the vibrant festival of colors with growth and innovation. May your business bloom with colorful opportunities.',
    tagline: 'Holi Hai',
    bottomSlogan: 'COLORS OF PROGRESS',
    icons: {
      feature1: 'color',
      feature2: 'sparkle',
      feature3: 'heart',
    },
    aiImagePrompt:
      'Vibrant modern login background for Holi festival. Colorful powder clouds gulal in pink E91E63, purple 9C27B0, and orange FF9800. Abstract color splashes, traditional Indian patterns.',
    backgroundOpacity: 0.18,
  },

  // 7. Independence Day (August 13 - 17)
  {
    id: 'independence-day',
    name: 'Independence Day',
    displayName: 'Independence Day (15 Aug)',
    dateRange: { month: 8, startDay: 13, endDay: 17 },
    bgImage: 'login_bg_independence_day.webp',
    colors: {
      primary: '#FF9933',
      secondary: '#138808',
      accent: '#000080',
      gradient: 'from-[#FF9933] via-white to-[#138808]',
      background: '#FFF9F5',
      cardBg: 'from-orange-50 via-white to-green-50',
    },
    headline: {
      line1: 'Proudly Made',
      line2: 'in India',
      line3: 'Powering Progress',
      line4: 'Nationwide',
    },
    description:
      'Saluting the spirit of an independent, self-reliant India. Delivering world-class paper manufacturing from Gujarat to the nation.',
    tagline: 'Jai Hind',
    bottomSlogan: 'MAKE IN INDIA EXCELLENCE',
    icons: {
      feature1: 'flag',
      feature2: 'chakra',
      feature3: 'factory',
    },
    aiImagePrompt:
      'Patriotic Indian Independence Day celebration inside modern paper warehouse. Indian tricolor theme with rich saffron FF9933, crisp white, and India green 138808. Navy blue Ashoka Chakra details.',
    backgroundOpacity: 0.16,
  },

  // 8. Ganesh Chaturthi (August 25 - September 5)
  {
    id: 'ganesh-chaturthi',
    name: 'Ganesh Chaturthi',
    displayName: 'Ganesh Chaturthi',
    dateRange: { month: 8, startDay: 25, endDay: 31, extendToNextMonth: true },
    bgImage: 'login_bg_ganesh_chaturthi.webp',
    colors: {
      primary: '#FF9800',
      secondary: '#E91E63',
      accent: '#8BC34A',
      gradient: 'from-[#FF9800] via-[#E91E63] to-[#8BC34A]',
      background: '#FFF8F0',
      cardBg: 'from-orange-50 via-pink-50 to-green-50',
    },
    headline: {
      line1: 'Begin with',
      line2: 'Lord Ganesha',
      line3: 'Remover of',
      line4: 'Obstacles',
    },
    description:
      'Invoke the blessings of Lord Ganesha for wisdom, prosperity, and obstacle-free growth in your business endeavors.',
    tagline: 'Ganpati Bappa Morya',
    bottomSlogan: 'AUSPICIOUS BEGINNINGS',
    icons: {
      feature1: 'ganesha',
      feature2: 'modak',
      feature3: 'flower',
    },
    aiImagePrompt:
      'Elegant login background for Ganesh Chaturthi. Lord Ganesha elements, modak sweets, lotus flowers, marigold decorations, incense smoke. Color palette: saffron orange FF9800, pink E91E63, fresh green 8BC34A.',
    backgroundOpacity: 0.16,
  },

  // 9. Navratri (September 25 - October 15)
  {
    id: 'navratri',
    name: 'Navratri',
    displayName: 'Navratri Celebration',
    dateRange: { month: 9, startDay: 25, endDay: 30, extendToNextMonth: true },
    bgImage: 'login_bg_navratri.webp',
    colors: {
      primary: '#D32F2F',
      secondary: '#F57C00',
      accent: '#FBC02D',
      gradient: 'from-[#D32F2F] via-[#F57C00] to-[#FBC02D]',
      background: '#FFF5F5',
      cardBg: 'from-red-50 via-orange-50 to-yellow-50',
    },
    headline: {
      line1: 'Nine Nights',
      line2: 'of Energy',
      line3: 'Devotion &',
      line4: 'Celebration',
    },
    description:
      'Celebrate the triumph of good over evil. May Goddess Durga bless your business with invincible energy and continuous triumph.',
    tagline: 'Jai Mata Di',
    bottomSlogan: 'ENERGY OF TRIUMPH',
    icons: {
      feature1: 'dandiya',
      feature2: 'diya',
      feature3: 'flower',
    },
    aiImagePrompt:
      'Festive Navratri celebration background in paper warehouse. Traditional decorative dandiya sticks crossed gracefully, glowing brass diya lamps, marigold garlands, rangoli patterns. Deep red D32F2F, festive orange F57C00, golden yellow FBC02D.',
    backgroundOpacity: 0.16,
  },

  // 10. Diwali - Festival of Lights (October 20 - November 8)
  {
    id: 'diwali',
    name: 'Diwali',
    displayName: 'Diwali Festival of Lights',
    dateRange: { month: 10, startDay: 20, endDay: 31, extendToNextMonth: true },
    bgImage: 'login_bg_diwali.webp',
    colors: {
      primary: '#FF6B35',
      secondary: '#F7931E',
      accent: '#FFD23F',
      gradient: 'from-[#FF6B35] via-[#F7931E] to-[#FFD23F]',
      background: '#FFF9F0',
      cardBg: 'from-amber-50 via-orange-50 to-yellow-50',
    },
    headline: {
      line1: 'Illuminate Your',
      line2: 'Business Journey',
      line3: 'this Diwali',
      line4: 'with Saheb Paper',
    },
    description:
      'May this Festival of Lights bring prosperity, growth, and endless success to your paper business. Wishing you a bright and profitable Diwali.',
    tagline: 'Shubh Deepavali',
    bottomSlogan: 'LIGHT UP TOMORROW',
    icons: {
      feature1: 'diya',
      feature2: 'sparkle',
      feature3: 'firework',
    },
    aiImagePrompt:
      'Premium modern login page background with Diwali theme. Elegant golden diyas oil lamps with warm glowing flames, intricate rangoli patterns in orange, red and gold colors, subtle bokeh lights, marigold flowers. Deep orange FF6B35, golden F7931E, bright yellow FFD23F.',
    backgroundOpacity: 0.16,
  },

  // 11. Christmas (December 20 - 27)
  {
    id: 'christmas',
    name: 'Christmas',
    displayName: 'Christmas & Holiday Season',
    dateRange: { month: 12, startDay: 20, endDay: 27 },
    bgImage: 'login_bg_christmas.webp',
    colors: {
      primary: '#DC2626',
      secondary: '#059669',
      accent: '#EAB308',
      gradient: 'from-[#DC2626] via-[#059669] to-[#EAB308]',
      background: '#FEF2F2',
      cardBg: 'from-red-50 via-emerald-50 to-amber-50',
    },
    headline: {
      line1: 'Warm Wishes',
      line2: 'for a Joyful',
      line3: 'Holiday Season',
      line4: 'from Saheb Paper',
    },
    description:
      'Wishing you and your teams peace, prosperity, and festive joy this Christmas. Thank you for partnering with us.',
    tagline: 'Merry Christmas',
    bottomSlogan: 'SEASON OF GRATITUDE',
    icons: {
      feature1: 'tree',
      feature2: 'star',
      feature3: 'bell',
    },
    aiImagePrompt:
      'Warm and festive Christmas winter holiday background in industrial paper mill warehouse. Tasteful Christmas pine garland, warm golden fairy lights, red Christmas ornaments, snowflakes, subtle golden bells. Deep Christmas red DC2626, pine green 059669, warm gold EAB308.',
    backgroundOpacity: 0.16,
  },
];

/**
 * 11 High-Res Login Page Themes
 */
export const THEME_COLLECTION_11 = [
  {
    id: 'diwali',
    name: 'Diwali',
    displayName: 'Diwali - Festival of Lights',
    bgImage: 'login_bg_diwali.webp',
    colors: { primary: '#FF6B35', secondary: '#F7931E', accent: '#FFD23F' },
    description: 'Golden diyas, rangoli patterns, marigold flowers & bokeh lights',
  },
  {
    id: 'holi',
    name: 'Holi',
    displayName: 'Holi - Festival of Colors',
    bgImage: 'login_bg_holi.webp',
    colors: { primary: '#E91E63', secondary: '#9C27B0', accent: '#FF9800' },
    description: 'Vibrant gulal powder clouds, energetic splashes & dynamic celebration',
  },
  {
    id: 'navratri',
    name: 'Navratri',
    displayName: 'Navratri Celebration',
    bgImage: 'login_bg_navratri.webp',
    colors: { primary: '#D32F2F', secondary: '#F57C00', accent: '#FBC02D' },
    description: 'Dandiya sticks, traditional patterns, diya lamps & marigold garlands',
  },
  {
    id: 'ganesh-chaturthi',
    name: 'Ganesh Chaturthi',
    displayName: 'Ganesh Chaturthi',
    bgImage: 'login_bg_ganesh_chaturthi.webp',
    colors: { primary: '#FF9800', secondary: '#E91E63', accent: '#8BC34A' },
    description: 'Lord Ganesha motifs, modak sweets, lotus flowers & sacred incense',
  },
  {
    id: 'independence-day',
    name: 'Independence Day',
    displayName: 'Independence Day (15 Aug)',
    bgImage: 'login_bg_independence_day.webp',
    colors: { primary: '#FF9933', secondary: '#FFFFFF', accent: '#138808' },
    description: 'Tricolor saffron-white-green, Ashoka Chakra & Made in India pride',
  },
  {
    id: 'republic-day',
    name: 'Republic Day',
    displayName: 'Republic Day (26 Jan)',
    bgImage: 'login_bg_republic_day.webp',
    colors: { primary: '#FF9933', secondary: '#FFFFFF', accent: '#138808' },
    description: 'Constitution symbols, patriotic tricolor & nation building theme',
  },
  {
    id: 'makar-sankranti',
    name: 'Makar Sankranti',
    displayName: 'Makar Sankranti / Uttarayan',
    bgImage: 'login_bg_makar_sankranti.webp',
    colors: { primary: '#00BCD4', secondary: '#FF5722', accent: '#FFEB3B' },
    description: 'Colorful kites soaring, sun rays & harvest celebration symbols',
  },
  {
    id: 'pongal',
    name: 'Pongal',
    displayName: 'Pongal Harvest Festival',
    bgImage: 'login_bg_pongal.webp',
    colors: { primary: '#F59E0B', secondary: '#10B981', accent: '#EF4444' },
    description: 'Sugarcane, golden rice harvest, pongal pot & kolam floor art',
  },
  {
    id: 'new-year',
    name: 'New Year',
    displayName: 'New Year Celebration',
    bgImage: 'login_bg_new_year.webp',
    colors: { primary: '#6366F1', secondary: '#8B5CF6', accent: '#EC4899' },
    description: 'Festive confetti, fireworks, champagne bubbles & futuristic mood',
  },
  {
    id: 'christmas',
    name: 'Christmas',
    displayName: 'Christmas & Winter Holiday',
    bgImage: 'login_bg_christmas.webp',
    colors: { primary: '#DC2626', secondary: '#059669', accent: '#EAB308' },
    description: 'Christmas pine trees, glowing golden bells, snowflakes & warm holiday glow',
  },
  {
    id: 'default',
    name: 'Default',
    displayName: 'Saheb Paper Classic Industrial',
    bgImage: 'login_bg_default.webp',
    colors: { primary: '#5E3BE8', secondary: '#4E27E0', accent: '#6C4FE0' },
    description: 'Clean modern warehouse, organized paper reels & professional engineering',
  },
];

// Helper function to check if a date falls within festival range
export function getFestivalTheme(date: Date = new Date()): FestivalTheme | null {
  const month = date.getMonth() + 1; // 1-12
  const day = date.getDate();

  for (const theme of FESTIVAL_THEMES) {
    const { month: festMonth, startDay, endDay, extendToNextMonth } = theme.dateRange;

    if (month === festMonth && day >= startDay && day <= endDay) {
      return theme;
    }

    if (extendToNextMonth) {
      const nextMonth = festMonth === 12 ? 1 : festMonth + 1;
      // In first 10 days of next month
      if (month === nextMonth && day <= 10) {
        return theme;
      }
    }
  }

  return null;
}

export function getThemeById(id: string): FestivalTheme {
  if (id === 'default') return DEFAULT_THEME;
  const found = FESTIVAL_THEMES.find((t) => t.id === id);
  return found || DEFAULT_THEME;
}

export function getActiveThemeColors(date?: Date) {
  const festivalTheme = getFestivalTheme(date);
  if (festivalTheme) {
    return festivalTheme.colors;
  }
  return DEFAULT_THEME.colors;
}

export function getAntigravityPrompt(festivalName?: string): string {
  if (!festivalName) {
    const currentFestival = getFestivalTheme();
    if (currentFestival) {
      return currentFestival.aiImagePrompt;
    }
  } else {
    const festival = FESTIVAL_THEMES.find((t) => t.name.toLowerCase() === festivalName.toLowerCase());
    if (festival) {
      return festival.aiImagePrompt;
    }
  }

  return DEFAULT_THEME.aiImagePrompt;
}
