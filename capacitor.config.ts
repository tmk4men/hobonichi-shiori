import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.hobonichi.shiori',
  appName: 'ほぼ日のしおり',
  webDir: 'dist',
  backgroundColor: '#efe9d8',
  android: {
    allowMixedContent: false,
  },
};

export default config;
