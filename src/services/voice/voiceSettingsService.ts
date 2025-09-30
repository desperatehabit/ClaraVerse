import { VoiceSettings, VoiceProvider } from '../../types/voice';

const VOICE_SETTINGS_KEY = 'voiceSettings';

export const AVAILABLE_PROVIDERS: VoiceProvider[] = [
  {
    id: 'livekit',
    name: 'LiveKit',
    settings: [
      { key: 'liveKitUrl', label: 'LiveKit URL', type: 'text' },
      { key: 'liveKitApiKey', label: 'API Key', type: 'password' },
      { key: 'liveKitApiSecret', label: 'API Secret', type: 'password' },
    ],
  },
];

export const getVoiceSettings = (): Partial<VoiceSettings> => {
  try {
    const settings = localStorage.getItem(VOICE_SETTINGS_KEY);
    if (settings) {
      const parsedSettings = JSON.parse(settings);
      // Migration for old settings structure
      if (
        'liveKitUrl' in parsedSettings ||
        'liveKitApiKey' in parsedSettings ||
        'liveKitApiSecret' in parsedSettings
      ) {
        const migratedSettings: Partial<VoiceSettings> = {
          ...parsedSettings,
          activeProviderId: 'livekit',
          providerSettings: {
            livekit: {
              liveKitUrl: parsedSettings.liveKitUrl,
              liveKitApiKey: parsedSettings.liveKitApiKey,
              liveKitApiSecret: parsedSettings.liveKitApiSecret,
            },
          },
        };
        delete migratedSettings.liveKitUrl;
        delete migratedSettings.liveKitApiKey;
        delete migratedSettings.liveKitApiSecret;
        saveVoiceSettings(migratedSettings as VoiceSettings);
        return migratedSettings;
      }
      return parsedSettings;
    }
  } catch (error) {
    console.error('Error reading voice settings from local storage', error);
  }
  return {
    activeProviderId: 'livekit',
    providerSettings: {
      livekit: {},
    },
  };
};

export const saveVoiceSettings = (settings: VoiceSettings) => {
  try {
    localStorage.setItem(VOICE_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving voice settings to local storage', error);
  }
};

export const getAvailableVoiceProviders = (): VoiceProvider[] => {
  return AVAILABLE_PROVIDERS;
};