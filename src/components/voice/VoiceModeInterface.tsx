import React, { useState, useEffect } from 'react';
import { ConnectionState } from 'livekit-client';
import ClaraWebRTCService from '../../features/voice/services/ClaraWebRTCService';
import AudioVisualization from './AudioVisualization';
import ConversationTranscript from './ConversationTranscript';
import ClaraAIIntegrationService from '../../services/voice/ClaraAIIntegrationService';

const VoiceModeInterface: React.FC = () => {
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    ClaraWebRTCService.connectionState
  );
  const [transcript, setTranscript] = useState<string>('');

  useEffect(() => {
    const handleConnectionStateChange = (state: ConnectionState) => {
      setConnectionState(state);
    };

    const handleTranscriptUpdate = (newTranscript: string) => {
      setTranscript(newTranscript);
    };

    ClaraWebRTCService.on('connection-state-changed', handleConnectionStateChange);
    ClaraAIIntegrationService.on('transcript:interim', handleTranscriptUpdate);
    ClaraAIIntegrationService.on('transcript:final', handleTranscriptUpdate);

    // Automatically connect on component mount
    handleConnect();

    return () => {
      ClaraWebRTCService.off('connection-state-changed', handleConnectionStateChange);
      ClaraAIIntegrationService.off('transcript:interim', handleTranscriptUpdate);
      ClaraAIIntegrationService.off('transcript:final', handleTranscriptUpdate);
      // Disconnect on component unmount
      handleDisconnect();
    };
  }, []);

  const handleConnect = async () => {
    try {
      const token = await ClaraWebRTCService.getJoinToken('default-room', 'user');
      // Assuming a local LiveKit server for now
      await ClaraWebRTCService.connect('ws://localhost:7880', token);
      const stream = ClaraWebRTCService.getLocalAudioStream();
      if (stream) {
        ClaraAIIntegrationService.startTranscription(stream);
      }
    } catch (error) {
      console.error('Error connecting to voice service:', error);
    }
  };

  const handleDisconnect = () => {
    ClaraWebRTCService.disconnect();
    ClaraAIIntegrationService.stopTranscription();
  };

  return (
    <div>
      <h1>Voice Mode Interface</h1>
      <p>Connection Status: {connectionState}</p>
      <button onClick={handleConnect} disabled={connectionState === ConnectionState.Connected}>
        Connect
      </button>
      <button onClick={handleDisconnect} disabled={connectionState === ConnectionState.Disconnected}>
        Disconnect
      </button>
      <AudioVisualization />
      <ConversationTranscript transcript={transcript} />
    </div>
  );
};

export default VoiceModeInterface;