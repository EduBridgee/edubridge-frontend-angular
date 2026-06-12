import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.edubridge.app',
  appName: 'EduBridge',
  webDir: 'dist/edubridge-frontend/browser',
  server: {
    androidScheme: 'https',
    hostname: 'localhost'
  }
};

export default config;
