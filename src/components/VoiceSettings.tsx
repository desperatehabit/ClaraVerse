import React, { useState } from 'react';
import { Settings, Mic, Volume2, Save, RotateCcw, TestTube } from 'lucide-react';
import { useVoiceContext } from '../contexts/Voice/VoiceContext';
import { VoiceSettings as VoiceSettingsType } from '../types/voice';

interface VoiceSettingsProps {
  onClose?: () => void;
}

const VoiceSettings: React.FC<VoiceSettingsProps> = ({ onClose }) => {
  const voice = useVoiceContext();
  const [localSettings, setLocalSettings] = useState<VoiceSettingsType>(voice.settings);
  const [hasChanges, setHasChanges] = useState(false);
  const [isTestingTTS, setIsTestingTTS] = useState(false);

  const handleSettingChange = (key: keyof VoiceSettingsType, value: VoiceSettingsType[keyof VoiceSettingsType]) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    setHasChanges(JSON.stringify(newSettings) !== JSON.stringify(voice.settings));
  };

  const handleSaveSettings = async () => {
    try {
      await voice.updateSettings(localSettings);
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save voice settings:', error);
    }
  };

  const handleResetSettings = async () => {
    try {
      await voice.resetSettings();
      setLocalSettings(voice.settings);
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to reset voice settings:', error);
    }
  };

  const handleTestTTS = async () => {
    if (!localSettings.ttsEnabled) return;

    setIsTestingTTS(true);
    try {
      await voice.speak('This is a test of the text-to-speech system. If you can hear this, the voice settings are working correctly.', {
        voice: localSettings.ttsVoice,
        speed: localSettings.ttsSpeed,
      });
    } catch (error) {
      console.error('TTS test failed:', error);
    } finally {
      setIsTestingTTS(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
            <Mic className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Voice Settings</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Configure voice input and output preferences</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveSettings}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
              <button
                onClick={handleResetSettings}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            </div>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Voice Status */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${voice.isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="font-medium text-gray-800 dark:text-white">
              Voice Status: {voice.isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <button
            onClick={voice.isConnected ? voice.disconnect : voice.connect}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              voice.isConnected
                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
                : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
            }`}
          >
            {voice.isConnected ? 'Disconnect' : 'Connect'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Voice Activity Detection */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <Mic className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Voice Activity Detection</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={localSettings.vadEnabled}
                  onChange={(e) => handleSettingChange('vadEnabled', e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Enable Voice Activity Detection</span>
              </label>
            </div>

            {localSettings.vadEnabled && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sensitivity: {localSettings.vadSensitivity}
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.1"
                    value={localSettings.vadSensitivity}
                    onChange={(e) => handleSettingChange('vadSensitivity', parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Threshold: {localSettings.vadThreshold}
                  </label>
                  <input
                    type="range"
                    min="0.05"
                    max="0.5"
                    step="0.05"
                    value={localSettings.vadThreshold}
                    onChange={(e) => handleSettingChange('vadThreshold', parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Text-to-Speech */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <Volume2 className="w-5 h-5 text-green-500" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Text-to-Speech</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={localSettings.ttsEnabled}
                  onChange={(e) => handleSettingChange('ttsEnabled', e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Enable Text-to-Speech</span>
              </label>
            </div>

            {localSettings.ttsEnabled && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Engine
                  </label>
                  <select
                    value={localSettings.ttsEngine}
                    onChange={(e) => handleSettingChange('ttsEngine', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="auto">Auto</option>
                    <option value="kokoro">Kokoro</option>
                    <option value="gtts">Google TTS</option>
                    <option value="pyttsx3">System TTS</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Voice
                  </label>
                  <select
                    value={localSettings.ttsVoice}
                    onChange={(e) => handleSettingChange('ttsVoice', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="af_sarah">Sarah (English)</option>
                    <option value="af_nicole">Nicole (English)</option>
                    <option value="af_dan">Dan (English)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Speed: {localSettings.ttsSpeed}x
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={localSettings.ttsSpeed}
                    onChange={(e) => handleSettingChange('ttsSpeed', parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={localSettings.ttsAutoPlay}
                      onChange={(e) => handleSettingChange('ttsAutoPlay', e.target.checked)}
                      className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Auto-play responses</span>
                  </label>
                </div>

                <button
                  onClick={handleTestTTS}
                  disabled={isTestingTTS || !localSettings.ttsEnabled}
                  className="w-full px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-green-200 dark:hover:bg-green-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <TestTube className="w-4 h-4" />
                  {isTestingTTS ? 'Testing...' : 'Test TTS'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Speech-to-Text */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <Mic className="w-5 h-5 text-purple-500" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Speech-to-Text</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={localSettings.sttEnabled}
                  onChange={(e) => handleSettingChange('sttEnabled', e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Enable Speech Recognition</span>
              </label>
            </div>

            {localSettings.sttEnabled && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Engine
                  </label>
                  <select
                    value={localSettings.sttEngine}
                    onChange={(e) => handleSettingChange('sttEngine', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="whisper">Whisper</option>
                    <option value="google">Google</option>
                    <option value="azure">Azure</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Language
                  </label>
                  <select
                    value={localSettings.sttLanguage}
                    onChange={(e) => handleSettingChange('sttLanguage', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="it">Italian</option>
                  </select>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Audio Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <Settings className="w-5 h-5 text-orange-500" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Audio Settings</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={localSettings.noiseReduction}
                  onChange={(e) => handleSettingChange('noiseReduction', e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Noise Reduction</span>
              </label>
            </div>

            <div>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={localSettings.echoCancellation}
                  onChange={(e) => handleSettingChange('echoCancellation', e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Echo Cancellation</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Voice Activation Threshold: {localSettings.voiceActivationThreshold}
              </label>
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.1"
                value={localSettings.voiceActivationThreshold}
                onChange={(e) => handleSettingChange('voiceActivationThreshold', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Behavior Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <Settings className="w-5 h-5 text-indigo-500" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Behavior Settings</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={localSettings.autoStartVoiceMode}
                onChange={(e) => handleSettingChange('autoStartVoiceMode', e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Auto-start voice mode on app launch</span>
            </label>
          </div>

          <div>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={localSettings.pushToTalk}
                onChange={(e) => handleSettingChange('pushToTalk', e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Push-to-talk mode</span>
            </label>
            {localSettings.pushToTalk && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Press {localSettings.pushToTalkKey} to activate voice
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceSettings;