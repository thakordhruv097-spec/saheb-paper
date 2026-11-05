import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sahebpaper.app',
  appName: 'Saheb Paper',
  webDir: 'dist',
  server: {
    url: 'https://thakordhruv097-spec.github.io/saheb-paper/',
    cleartext: true,
    androidScheme: 'https',
    allowNavigation: [
      'thakordhruv097-spec.github.io',
      '*.supabase.co'
    ]
  }
};

export default config;
