import React, { useState, useEffect } from 'react';
import {
  getVoiceSettings,
  saveVoiceSettings,
  getAvailableVoiceProviders,
} from '../../../services/voice/voiceSettingsService';
import { VoiceProvider, VoiceSettings } from '../../../types/voice';

// Local FormInput component based on the style guide
const FormInput = ({
  label,
  name,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  name: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
}) => {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
      >
        {label}
      </label>
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full px-4 py-2 rounded-lg bg-white/50 border border-gray-200 focus:outline-none focus:border-sakura-300 dark:bg-gray-800/50 dark:border-gray-700 dark:text-gray-100 transition-colors"
      />
    </div>
  );
};

// Local FormSelect component based on the style guide
const FormSelect = ({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      <select
        value={value}
        onChange={onChange}
        className="w-full px-4 py-2 rounded-lg bg-white/50 border border-gray-200 focus:outline-none focus:border-sakura-300 dark:bg-gray-800/50 dark:border-gray-700 dark:text-gray-100"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

const VoiceSettingsPanel: React.FC = () => {
  const [providers, setProviders] = useState<VoiceProvider[]>([]);
  const [activeProviderId, setActiveProviderId] = useState<string>('');
  const [settings, setSettings] = useState<VoiceSettings | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      const availableProviders = await getAvailableVoiceProviders();
      setProviders(availableProviders);

      const currentSettings = await getVoiceSettings();
      // Ensure a full settings object to satisfy the type, merging with loaded settings
      const fullSettings: VoiceSettings = {
        vadEnabled: false,
        vadSensitivity: 0,
        vadThreshold: 0,
        ttsEnabled: false,
        ttsEngine: 'auto',
        ttsVoice: '',
        ttsSpeed: 1,
        ttsAutoPlay: false,
        sttEnabled: false,
        sttEngine: 'whisper',
        sttLanguage: 'en',
        audioInputDevice: null,
        audioOutputDevice: null,
        noiseReduction: false,
        echoCancellation: false,
        autoStartVoiceMode: false,
        pushToTalk: false,
        pushToTalkKey: 'Space',
        voiceActivationThreshold: 0,
        providerSettings: {},
        ...currentSettings,
      };
      setSettings(fullSettings);

      const activeId =
        fullSettings.activeProviderId ||
        (availableProviders.length > 0 ? availableProviders[0]?.id : '');
      setActiveProviderId(activeId);
    };

    loadSettings();
  }, []);

  const handleProviderChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setActiveProviderId(event.target.value);
  };

  const handleSettingsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    if (settings && activeProviderId) {
      const newProviderSettings = {
        ...(settings.providerSettings || {}),
        [activeProviderId]: {
          ...(settings.providerSettings?.[activeProviderId] || {}),
          [name]: value,
        },
      };
      setSettings({
        ...settings,
        providerSettings: newProviderSettings,
      });
    }
  };

  const handleSave = () => {
    if (settings && activeProviderId) {
      const settingsToSave: VoiceSettings = {
        ...settings,
        activeProviderId: activeProviderId,
      };
      saveVoiceSettings(settingsToSave);
      alert('Settings saved!');
    }
  };

  if (!settings) {
    return <div>Loading...</div>;
  }

  const selectedProvider = providers.find((p) => p.id === activeProviderId);
  const currentProviderSettings =
    settings.providerSettings?.[activeProviderId] || {};

  return (
    <div className="glassmorphic rounded-xl p-6 space-y-4">
      <h2 className="text-lg font-semibold">Voice Settings</h2>
      <FormSelect
        label="Voice Provider"
        value={activeProviderId}
        onChange={handleProviderChange}
        options={providers.map((p) => ({ value: p.id, label: p.name }))}
      />

      {selectedProvider &&
        selectedProvider.settings.map((field) => (
          <FormInput
            key={field.key}
            label={field.label}
            name={field.key}
            value={currentProviderSettings[field.key] || ''}
            onChange={handleSettingsChange}
            type={field.type}
          />
        ))}

      <button
        onClick={handleSave}
        className="px-4 py-2 bg-sakura-500 text-white rounded-lg"
      >
        Save Settings
      </button>
    </div>
  );
};

export default VoiceSettingsPanel;