[EPIC 2 - Step 4 - Dedicated Voice UI Development]
1. Primary Task:
   - Create the dedicated, user-facing interface for the voice mode. This includes components for starting and stopping a voice session, displaying the conversation transcript in real-time, and providing visual feedback that the system is listening. (Source: project_planv2.md, Section 4.2)

2. File Locations:
   - To be Created:
     - src/features/voice/routes/VoiceView.tsx: The main container component for the voice mode screen.
     - src/features/voice/components/SessionControls.tsx: A component with buttons to connect/disconnect the voice call.
     - src/features/voice/components/TranscriptDisplay.tsx: A component to show the list of user and assistant messages.
     - src/features/voice/components/AudioVisualizer.tsx: A component to provide real-time visual feedback of the microphone audio level.
   - To be Modified:
     - src/routes.tsx (or equivalent): To add a new route (e.g., /voice) that renders VoiceView.
     - src/components/Sidebar.tsx (or main navigation): To add a navigation link to the new /voice route.

3. UI/Component Specification:
   - VoiceView.tsx:
     - Layout: A single-column layout. At the top, it renders SessionControls. The main central area is occupied by TranscriptDisplay. At the bottom, it renders AudioVisualizer.
   - SessionControls.tsx:
     - Content: A single button that toggles between "Start Voice Session" and "End Voice Session". A status indicator (e.g., a colored dot and text) should display the current connectionState from the voiceStore (e.g., "Disconnected", "Connecting...", "Connected").
     - Interaction: The button will call the connect() or disconnect() actions from the voiceStore.
   - TranscriptDisplay.tsx:
     - Content: It will render a list of VoiceMessage objects. It should visually distinguish between messages from the 'user' and the 'assistant' (e.g., different alignment or background colors). The display should automatically scroll to the bottom as new messages are added.
   - AudioVisualizer.tsx:
     - Content: A simple visual component (e.g., a pulsating circle or a bar that changes height) that represents the microphone's input volume.
     - Logic: It will use the Web Audio API (AnalyserNode) on the local microphone's MediaStreamTrack to get real-time frequency data and update its visualization in a requestAnimationFrame loop.

4. State Management Logic:
   - voiceStore.ts: The UI components will heavily rely on the state managed here.
     - The SessionControls component will read connectionState and error, and call connect/disconnect.
     - The TranscriptDisplay will need a new state property: transcript: VoiceMessage[], and a new action addMessageToTranscript(message: VoiceMessage). A data channel from the LiveKit server will be used later to push messages to the client. For now, we can add placeholder messages.

5. Data Model & Schema:
   - The UI will consume the VoiceMessage type to render the transcript.

6. Backend Interaction Logic:
   - The SessionControls component will trigger the client-side ClaraWebRTCService via the voiceStore actions to initiate and terminate the connection to the LiveKit server.

7. Relevant Documentation & Examples:
   - Web Audio API for Visualization (AudioVisualizer.tsx):
     ```tsx
     import React, { useEffect, useRef } from 'react';

     export const AudioVisualizer = ({ stream }: { stream: MediaStream }) => {
       const canvasRef = useRef<HTMLCanvasElement>(null);

       useEffect(() => {
         if (!stream || !canvasRef.current) return;
         const audioContext = new AudioContext();
         const analyser = audioContext.createAnalyser();
         const source = audioContext.createMediaStreamSource(stream);
         source.connect(analyser);
         
         // ... animation loop using requestAnimationFrame and analyser.getByteFrequencyData()
       }, [stream]);

       return <canvas ref={canvasRef} />;
     };
     ```

8. Error Handling:
   - UI Feedback: The SessionControls component must display any connection errors stored in the voiceStore.error property.
     - Example Message: "Failed to connect: Microphone access was denied."
   - Visualizer Failure: If the MediaStream is not available, the AudioVisualizer should simply render nothing or a static "no signal" state.

9. Coding Standards & Verification:
   - Components should be purely presentational where possible, with all logic handled by the Zustand store and services.
   - The AudioVisualizer should be efficient and not cause performance issues.
   - Verification Checklist:
     - 1. A new "Voice" link appears in the main navigation and leads to the /voice route.
     - 2. The VoiceView component renders with its three child components.
     - 3. The SessionControls button initially says "Start Voice Session" and the status is "Disconnected".
     - 4. Clicking the "Start" button triggers the connect action, the status changes to "Connecting...", and the microphone permission prompt appears.
     - 5. After granting permission, the status changes to "Connected", and the button text changes to "End Voice Session".
     - 6. When connected, the AudioVisualizer actively moves in response to sound from the microphone.
     - 7. The TranscriptDisplay is visible but empty.
     - 8. Clicking "End Voice Session" disconnects the client, the status returns to "Disconnected", and the visualizer stops.