import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.reprise.coach',
  appName: 'RepRise Coach',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
