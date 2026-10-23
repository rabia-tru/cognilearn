import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cognilearn.app',
  appName: 'CogniLearn',
  webDir: 'dist',
  server: {
    cleartext: true,
    allowNavigation: [
      'localhost:3000',
      '10.0.2.2:3000',
      '192.168.54.240:3000',
      '192.168.18.174:3000',
      'http://localhost:3000',
      'http://10.0.2.2:3000',
      'http://192.168.54.240:3000',
      'http://192.168.18.174:3000'
    ],
  },
};

export default config;
