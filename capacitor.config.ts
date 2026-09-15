import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sahebpaper.erp',
  appName: 'Saheb Paper',
  webDir: 'dist',
  server: {
    url: 'https://thakordhruv097-spec.github.io/saheb-paper/',
    androidScheme: 'https',
    cleartext: true
  }
};

export default config;
