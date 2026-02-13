import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fokko.app',
  appName: 'Fokko',
  webDir: 'dist',
  plugins: {
    StatusBar: {
      backgroundColor: '#0f1219',
      style: 'DARK',
    },
    SplashScreen: {
      backgroundColor: '#0f1219',
      launchAutoHide: true,
      launchShowDuration: 500,
      showSpinner: false,
    },
  },
};

export default config;
