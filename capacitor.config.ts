import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.hibinoshiori.diary',
  appName: 'ひびのしおり',
  webDir: 'dist',
  backgroundColor: '#efe9d8',
  android: {
    allowMixedContent: false,
  },
};

export default config;
