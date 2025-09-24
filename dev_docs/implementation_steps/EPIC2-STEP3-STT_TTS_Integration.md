[EPIC 2 - Step 3 - Integration with STT/TTS Services]
1. Primary Task:
   - Bridge the gap between the raw audio stream and actionable text. This involves modifying the ClaraVoiceAgent to take the incoming audio data from a participant, forward it to the existing Speech-to-Text (STT) service to get a transcription, and prepare the system to eventually send a text response back to a Text-to-Speech (TTS) service. (Source: project_planv2.md, Sections 4.2, 7.1)

2. File Locations:
- To be Modified:
- electron/services/voice/ClaraVoiceAgent.ts: This is the primary location for the new logic.
   - To be Interfaced With (Existing services):
     - claraVoiceService.ts: The existing STT service.
     - claraTTSService.ts: The existing TTS service.

3. UI/Component Specification:
   - Not applicable. This is a backend-only integration step.

4. State Management Logic:
   - Not applicable for the frontend.

5. Data Model & Schema:
- The AgentSession will be updated to include conversation history to provide context for future AI interactions.
```typescript
// electron/services/voice/types.ts
export interface VoiceMessage {
       role: 'user' | 'assistant';
       content: string;
       timestamp: Date;
     }

     export interface AgentSession {
       // ... existing fields
       conversationHistory: VoiceMessage[];
     }
     ```

6. Backend Interaction Logic:
   - ClaraVoiceAgent.ts:
     - A new method setupAudioPipeline(participant: Participant, session: AgentSession) will be created. It's called from onParticipantJoined. This method will subscribe to the participant's audio track.
     - A new method onAudioReceived(audioData: AudioBuffer, sessionId: string) will be implemented. This is the event handler for when new audio chunks arrive.
       1. It will take the audioData.
       2. It will call the existing STT service (e.g., claraVoiceService.transcribe(audioData)).
       3. It will receive the transcribed text string.
       4. For this step, it will simply log the transcribed text to the console (e.g., User said: "{transcription}").
       5. It will add the transcription to the conversationHistory within the corresponding AgentSession.
     - Placeholder for TTS: A placeholder method streamAudioResponse(audioResponse: AudioBuffer, sessionId: string) will be created but left empty. It will be implemented in a later step to send the synthesized speech back to the client.

7. Relevant Documentation & Examples:
   - LiveKit Track Subscription:
     typescript      // In ClaraVoiceAgent.ts, within setupAudioPipeline            // Find the participant's audio track      const audioTrack = participant.getTrack(Track.Source.Microphone);            if (audioTrack) {        // The 'livekit-server-sdk' would provide a way to get the raw audio stream.        // This might involve setting up a data pipe or event listener on the track.        // For this example, we assume an event `on('audio_data', ...)` exists.        audioTrack.on('audio_data', (audioBuffer: AudioBuffer) => {          this.onAudioReceived(audioBuffer, session.sessionId);        });      }      
   - STT Service Call:
     ```typescript
     // In ClaraVoiceAgent.ts
     // Assume claraVoiceService is injected or imported
     
     private async onAudioReceived(audioData: AudioBuffer, sessionId: string) {
       const session = this.sessions.get(sessionId);
       if (!session) return;

       try {
         const transcription = await this.claraVoiceService.transcribe(audioData);
         if (transcription) {
           console.log([${sessionId}] User said: "${transcription}");
           session.conversationHistory.push({
             role: 'user',
             content: transcription,
             timestamp: new Date(),
           });
         }
       } catch (error) {
         console.error([${sessionId}] STT processing failed:, error);
       }
     }
     ```

8. Error Handling:
   - No Audio Track: If a participant joins without a published audio track, participant.getTrack() will be null. The system should log this and not proceed with setting up the audio pipeline for that user.
   - STT Failure: The claraVoiceService.transcribe method could fail (e.g., service is down, audio is corrupt).
     - Logic: The onAudioReceived method must have a try...catch block around the transcription call.
     - User-Facing Message (for developer): A log message should be printed to the console: "STT processing failed for session {sessionId}. Error: {error.message}". The system should continue running and process the next audio chunk.

9. Coding Standards & Verification:
   - The agent should handle audio as a stream and not assume a single, complete recording.
   - The integration with existing services should be done via dependency injection or a clear import mechanism.
   - Verification Checklist:
     - 1. Connect a client and start streaming audio as in the previous step.
     - 2. Verify that the setupAudioPipeline method is called when the participant joins.
     - 3. Speak into the microphone on the client device.
     - 4. Verify that the Electron main process console shows the logs from onAudioReceived, including the correctly transcribed text (e.g., [session_123] User said: "Hello world").
     - 5. Inspect the AgentSession object in a debugger and confirm that the conversationHistory array is being populated with the transcriptions.
     - 6. If the STT service is manually disabled, verify that error logs are printed but the agent continues to run without crashing.