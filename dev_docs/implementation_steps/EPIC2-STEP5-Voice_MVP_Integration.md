[EPIC 2 - Step 5 - Voice MVP Integration & Command Processing]
1. Primary Task:
   - Complete the main loop for the Voice MVP. This involves connecting the transcribed text from the ClaraVoiceAgent to the AI processing layer (Llama.cpp), getting a text response, synthesizing it back into audio using the TTS service, and streaming that audio back to the client to be played. It also includes handling a basic voice command to create a task. (Source: project_planv2.md, Section 3.4, 7.1)

2. File Locations:
- To be Modified:
- electron/services/voice/ClaraVoiceAgent.ts: To add AI and TTS processing logic.
- src/features/voice/services/ClaraWebRTCService.ts: To handle receiving and playing back the audio from the agent.
     - src/features/voice/state/voiceStore.ts: To manage the playback of received audio.

3. UI/Component Specification:
   - The TranscriptDisplay.tsx component will now display real messages as they are processed. No new UI components are needed.

4. State Management Logic:
   - voiceStore.ts:
     - The store will need a way to receive both the user's transcribed message and the assistant's response message from the backend to update the transcript state. This will be accomplished using a LiveKit DataChannel.

5. Data Model & Schema:
   - The system will use the VoiceMessage interface to pass transcript updates over the DataChannel.

6. Backend Interaction Logic:
   - ClaraVoiceAgent.ts - onAudioReceived() method enhancement:
     1. After getting the transcription from the STT service, send the user's message to the client over a DataChannel so it appears in the transcript immediately.
     2. AI Processing: Send the transcription to the existing Llama.cpp service.
       - Command Handling: If the transcription contains keywords like "create a task", it should call the taskService.createTaskFromNLP method implemented in the previous epic.
       - General Response: For other inputs, it gets a conversational response.
     3. TTS Synthesis: Take the text response from the AI and send it to claraTTSService.synthesize(). This returns an AudioBuffer.
     4. Send the assistant's text response over the DataChannel to the client for the transcript.
     5. Stream Audio Back: Use the streamAudioResponse(audioBuffer, sessionId) method to publish the synthesized audio on a new audio track that the client is subscribed to.
   - Client-Side - ClaraWebRTCService.ts:
     - The service must now subscribe to remote audio tracks and DataChannel messages from the agent.
     - When a new remote audio track is received (the agent's TTS response), it should create an <audio> element and play it.
     - When a message arrives on the DataChannel (a transcript update), it should call the addMessageToTranscript action in the voiceStore.

7. Relevant Documentation & Examples:
   - LiveKit DataChannel:
     ```typescript
     // Agent side (server-sdk)
     // Send a message
     await agentParticipant.sendData(payload, DataPacket_Kind.RELIABLE);

     // Client side (client-sdk)
     room.on(RoomEvent.DataReceived, (payload, participant) => {
       // Decode payload and update transcript
     });
         - **AI Integration in `onAudioReceived`:**      typescript
     // ... after getting transcription
     
     // Send user message to UI
     await this.sendTranscriptUpdate({ role: 'user', content: transcription, ... });
     
     let aiResponseText: string;
     if (transcription.toLowerCase().includes('create task')) {
       const taskData = await this.taskService.processNaturalLanguageTask(transcription);
       await this.taskService.createTask(taskData);
       aiResponseText = OK, I've created the task: ${taskData.title};
     } else {
       aiResponseText = await this.llamaService.generate(User said: ${transcription});
     }
     
     // Send assistant message to UI
     await this.sendTranscriptUpdate({ role: 'assistant', content: aiResponseText, ... });

     const audioResponse = await this.claraTTSService.synthesize(aiResponseText);
     await this.streamAudioResponse(audioResponse, sessionId);
     ```

8. Error Handling:
   - AI/TTS Failure: If the Llama.cpp or TTS service fails, the onAudioReceived method must catch the error.
     - Logic: It should generate a fallback TTS response, such as "I'm having trouble thinking right now. Please try again."
     - UI Feedback: The user will hear the fallback audio and see the error message in the transcript.
   - Audio Playback Failure: If the client fails to play the received audio, the error should be logged in the client's console. The transcript will still be correct.

9. Coding Standards & Verification:
   - The entire loop from user speech to assistant response should be tested for latency.
   - The AI command parsing should be simple and robust for this MVP stage.
   - Verification Checklist:
     - 1. Start a voice session from the UI.
     - 2. Speak a general phrase like "Hello, how are you?".
     - 3. Verify the TranscriptDisplay shows your transcribed message almost immediately.
     - 4. Verify that a few moments later, you hear an audio response from the assistant.
     - 5. Verify the TranscriptDisplay updates with the assistant's text response.
     - 6. Speak a command: "Create task to buy milk".
     - 7. Verify you hear a confirmation like "OK, I've created the task: buy milk".
     - 8. Navigate to the Personal Tasks UI and verify that the new task "buy milk" now exists.
     - 9. If the AI service is disabled, verify that you hear and see the fallback error message.