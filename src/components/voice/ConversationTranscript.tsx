import * as React from 'react';
import { useVoiceContext } from '../../contexts/Voice/VoiceContext';

const ConversationTranscript: React.FC = () => {
  const { transcript } = useVoiceContext();

  return (
    <div>
      <h2>Conversation Transcript</h2>
      {transcript.map((entry, index) => (
        <p key={index}>
          <strong>{entry.speaker}:</strong> {entry.text}
        </p>
      ))}
    </div>
  );
};

export default ConversationTranscript;