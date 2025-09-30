import * as React from 'react';
import { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import { Room, RoomEvent, LocalTrackPublication, RemoteTrackPublication, Participant, Track } from 'livekit-client';
import { AccessToken } from 'livekit-server-sdk';
import { VoiceContextType, VoiceState, VoiceSettings } from '../../types/voice';
import { getVoiceSettings, saveVoiceSettings } from '../../services/voice/voiceSettingsService';

// Initial voice settings
const defaultVoiceSettings: VoiceSettings = {
  liveKitUrl: '',
  liveKitApiKey: '',
  liveKitApiSecret: '',
  vadEnabled: true,
  vadSensitivity: 0.6,
  vadThreshold: 0.15,
  ttsEnabled: true,
  ttsEngine: 'kokoro',
  ttsVoice: 'af_sarah',
  ttsSpeed: 1.0,
  ttsAutoPlay: true,
  sttEnabled: true,
  sttEngine: 'whisper',
  sttLanguage: 'en',
  audioInputDevice: null,
  audioOutputDevice: null,
  noiseReduction: true,
  echoCancellation: true,
  autoStartVoiceMode: false,
  pushToTalk: false,
  pushToTalkKey: 'Space',
  voiceActivationThreshold: 0.3,
};

// Initial voice state
const initialVoiceState: VoiceState = {
  // Core state
  isEnabled: false,
  isListening: false,
  isProcessing: false,
  isSpeaking: false,

  // Connection state
  isConnected: false,
  connectionStatus: 'disconnected',
  localTrack: null,

  // Audio levels
  inputLevel: 0,
  outputLevel: 0,

  // Error state
  error: null,

  // Settings
  settings: defaultVoiceSettings,

  // Session info
  sessionId: null,
  lastActivity: null,
  transcript: [],
};

// Voice actions
type VoiceAction =
  | { type: 'SET_ENABLED'; payload: boolean }
  | { type: 'SET_LISTENING'; payload: boolean }
  | { type: 'SET_PROCESSING'; payload: boolean }
  | { type: 'SET_SPEAKING'; payload: boolean }
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'SET_CONNECTION_STATUS'; payload: VoiceState['connectionStatus'] }
  | { type: 'SET_INPUT_LEVEL'; payload: number }
  | { type: 'SET_OUTPUT_LEVEL'; payload: number }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SETTINGS'; payload: Partial<VoiceSettings> }
  | { type: 'SET_LOCAL_TRACK'; payload: LocalTrackPublication | null }
  | { type: 'RESET_SETTINGS' }
  | { type: 'SET_SESSION_ID'; payload: string | null }
  | { type: 'SET_LAST_ACTIVITY'; payload: Date | null }
  | { type: 'ADD_TRANSCRIPT_ENTRY'; payload: any }
  | { type: 'RESET_STATE' };

// Voice reducer
const voiceReducer = (state: VoiceState, action: VoiceAction): VoiceState => {
  switch (action.type) {
    case 'SET_ENABLED':
      return { ...state, isEnabled: action.payload };

    case 'SET_LISTENING':
      return { ...state, isListening: action.payload };

    case 'SET_PROCESSING':
      return { ...state, isProcessing: action.payload };

    case 'SET_SPEAKING':
      return { ...state, isSpeaking: action.payload };

    case 'SET_CONNECTED':
      return { ...state, isConnected: action.payload };

    case 'SET_CONNECTION_STATUS':
      return { ...state, connectionStatus: action.payload };

    case 'SET_INPUT_LEVEL':
      return { ...state, inputLevel: action.payload };

    case 'SET_OUTPUT_LEVEL':
      return { ...state, outputLevel: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'SET_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };
    case 'SET_LOCAL_TRACK':
      return { ...state, localTrack: action.payload };

    case 'RESET_SETTINGS':
      return { ...state, settings: defaultVoiceSettings };

    case 'SET_SESSION_ID':
      return { ...state, sessionId: action.payload };

    case 'SET_LAST_ACTIVITY':
      return { ...state, lastActivity: action.payload };
    case 'ADD_TRANSCRIPT_ENTRY':
      return { ...state, transcript: [...state.transcript, action.payload] };

    case 'RESET_STATE':
      return initialVoiceState;

    default:
      return state;
  }
};

// Create the context
const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

interface VoiceProviderProps {
  children: ReactNode;
}

export const VoiceProvider = ({ children }: VoiceProviderProps) => {
  const [state, dispatch] = useReducer(voiceReducer, initialVoiceState);
  const roomRef = React.useRef<Room | null>(null);

  useEffect(() => {
    const loadedSettings = getVoiceSettings();
    dispatch({ type: 'SET_SETTINGS', payload: loadedSettings });
  }, []);

  // Core actions
  const enable = useCallback(async () => {
    if (roomRef.current) {
      return;
    }

    try {
      dispatch({ type: 'SET_ERROR', payload: null });
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'connecting' });

      const { liveKitUrl, liveKitApiKey, liveKitApiSecret } = state.settings;

      if (!liveKitUrl || !liveKitApiKey || !liveKitApiSecret) {
        throw new Error('LiveKit settings are not configured.');
      }
      const roomName = 'clara-voice-room';
      const participantName = `user-${Math.random().toString(36).substring(7)}`;

      const at = new AccessToken(liveKitApiKey, liveKitApiSecret, {
        identity: participantName,
      });
      at.addGrant({ roomJoin: true, room: roomName, canPublish: true, canSubscribe: true });
      const token = await at.toJwt();

      const room = new Room();
      roomRef.current = room;

      room.on(RoomEvent.TrackSubscribed, (track: Track, publication: RemoteTrackPublication, participant: Participant) => {
        if (track.kind === Track.Kind.Audio) {
          const audioElement = document.createElement('audio');
          track.attach(audioElement);
          audioElement.play().catch(e => console.error('Error playing audio:', e));
        }
      });

      room.on(RoomEvent.DataReceived, (payload: Uint8Array, participant?: Participant) => {
        const data = JSON.parse(new TextDecoder().decode(payload));
        if (data.type === 'transcript') {
          dispatch({ type: 'ADD_TRANSCRIPT_ENTRY', payload: data.transcript });
        }
      });

      room.on(RoomEvent.ActiveSpeakersChanged, (speakers: Participant[]) => {
        const localSpeaker = speakers.find((p) => p.isLocal);
        const remoteSpeaker = speakers.find((p) => !p.isLocal);

        dispatch({
          type: 'SET_INPUT_LEVEL',
          payload: localSpeaker?.audioLevel ?? 0,
        });
        dispatch({
          type: 'SET_OUTPUT_LEVEL',
          payload: remoteSpeaker?.audioLevel ?? 0,
        });
      });
 
       await room.connect(liveKitUrl, token, {
         autoSubscribe: true,
      });
      await room.localParticipant.setMicrophoneEnabled(true);

      const localTrackPublication = Array.from(
        room.localParticipant.getTrackPublications().values()
      ).find((track) => track.kind === Track.Kind.Audio);

      if (localTrackPublication) {
        dispatch({ type: 'SET_LOCAL_TRACK', payload: localTrackPublication as LocalTrackPublication });
      }

      dispatch({ type: 'SET_ENABLED', payload: true });
      dispatch({ type: 'SET_CONNECTED', payload: true });
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'connected' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to enable voice';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'error' });
      console.error('Failed to connect to LiveKit:', error);
      throw error;
    }
  }, []);

  const disable = useCallback(async () => {
    if (roomRef.current) {
      try {
        await roomRef.current.disconnect();
      } catch (error) {
        console.error('Error disconnecting from LiveKit:', error);
      } finally {
        roomRef.current = null;
        dispatch({ type: 'RESET_STATE' });
      }
    }
  }, []);

  const toggle = useCallback(async () => {
    if (state.isEnabled) {
      await disable();
    } else {
      await enable();
    }
  }, [state.isEnabled, enable, disable]);

  // Audio control
  const startListening = useCallback(async () => {
    if (!roomRef.current) return;
    await roomRef.current.localParticipant.setMicrophoneEnabled(true);
    dispatch({ type: 'SET_LISTENING', payload: true });
  }, []);

  const stopListening = useCallback(async () => {
    if (!roomRef.current) return;
    await roomRef.current.localParticipant.setMicrophoneEnabled(false);
    dispatch({ type: 'SET_LISTENING', payload: false });
  }, []);

  const sendAudio = useCallback(async (audioBlob: Blob) => {
    // This is now handled by the livekit-client automatically
  }, []);

  // TTS control
  const speak = useCallback(async (text: string, options?: { voice?: string; speed?: number }) => {
    // This will be handled by the agent in a later phase
  }, []);

  const stopSpeaking = useCallback(async () => {
    // This will be handled by the agent in a later phase
  }, []);

  // Settings
  const updateSettings = useCallback(async (newSettings: Partial<VoiceSettings>) => {
    const updatedSettings = { ...state.settings, ...newSettings };
    dispatch({ type: 'SET_SETTINGS', payload: newSettings });
    saveVoiceSettings(updatedSettings);
  }, [state.settings]);

  const resetSettings = useCallback(async () => {
    dispatch({ type: 'RESET_SETTINGS' });
    saveVoiceSettings(defaultVoiceSettings);
  }, []);

  // Connection
  const connect = useCallback(async () => {
    await enable();
  }, [enable]);

  const disconnect = useCallback(async () => {
    await disable();
  }, [disable]);

  // Health check
  const checkHealth = useCallback(async (): Promise<boolean> => {
    return roomRef.current?.state === 'connected';
  }, []);

  // Computed properties
  const isReady = state.isConnected && !state.error;
  const canListen = state.isEnabled && state.isConnected && !state.isListening && !state.isProcessing;
  const canSpeak = state.isEnabled && state.isConnected && state.settings.ttsEnabled;
  const isActive = state.isListening || state.isSpeaking || state.isProcessing;

  const contextValue: VoiceContextType = {
    // State
    ...state,
    room: roomRef.current,

    // Actions
    enable,
    disable,
    toggle,
    startListening,
    stopListening,
    sendAudio,
    speak,
    stopSpeaking,
    updateSettings,
    resetSettings,
    connect,
    disconnect,
    checkHealth,

    // Computed properties
    isReady,
    canListen,
    canSpeak,
    isActive,
  };

  return (
    <VoiceContext.Provider value={contextValue}>
      {children}
    </VoiceContext.Provider>
  );
};

// Hook for consuming the voice context
export const useVoiceContext = (): VoiceContextType => {
  const context = useContext(VoiceContext);
  if (context === undefined) {
    throw new Error('useVoiceContext must be used within a VoiceProvider');
  }
  return context;
};

export default VoiceContext;