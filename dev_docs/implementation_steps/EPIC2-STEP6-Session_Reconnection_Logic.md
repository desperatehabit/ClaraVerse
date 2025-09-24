[EPIC 2 - Step 6 - Robust Session & Reconnection Logic]
1. Primary Task:
   - Enhance the stability of the voice system by implementing automatic reconnection logic on both the client and server. This ensures that if a user's network connection briefly drops, the voice session can recover gracefully without requiring the user to manually restart it. (Source: project_planv2.md, Section 4.2, 7.1)

2. File Locations:
- To be Modified:
- electron/services/voice/ClaraVoiceAgent.ts: To monitor participant connection quality and handle server-side reconnection attempts.
- src/features/voice/services/ClaraWebRTCService.ts: To implement client-side connection state monitoring and an exponential backoff strategy for reconnection attempts.
     - src/features/voice/state/voiceStore.ts: To add a 'reconnecting' state for UI feedback.

3. UI/Component Specification:
   - SessionControls.tsx: The status indicator should now display a "Reconnecting..." message when the connectionState in the voiceStore is set to 'reconnecting'. This provides clear feedback to the user that the system is attempting to recover.

4. State Management Logic:
   - voiceStore.ts:
     - The ConnectionState type will be updated to include 'reconnecting'.
     - The connect action will need to be aware of this state to prevent multiple connection attempts.

5. Data Model & Schema:
- The AgentSession interface on the server will be updated to track reconnection attempts.
typescript      // electron/services/voice/types.ts      export interface AgentSession {        // ... existing fields        reconnectionAttempts: number;      }

6. Backend Interaction Logic:
   - ClaraVoiceAgent.ts:
     - Implement a setupReconnectionMonitoring(sessionId, participant) method as outlined in the spec.
     - This method will listen for the connectionQualityChanged event from the LiveKit SDK.
     - If quality becomes 'poor', it will trigger the reconnection logic, which involves attempting to re-establish the audio pipeline. It will use the reconnectionAttempts on the session to cap the number of retries before giving up.
   - ClaraWebRTCService.ts:
     - The service will listen for the disconnected event from the livekit-client Room.
     - On disconnection, instead of immediately cleaning up, it will enter a reconnecting state.
     - It will implement a scheduleReconnection() method that uses an exponential backoff algorithm (e.g., retrying after 1s, 2s, 4s, 8s) to attempt to call room.connect() again.
     - If reconnection succeeds, the state returns to connected. If it fails after a set number of attempts (e.g., 5), it will transition to a permanent failed state.

7. Relevant Documentation & Examples:
   - Client-Side Exponential Backoff (ClaraWebRTCService.ts):
     ```typescript
     private reconnectAttempts = 0;
     private maxReconnectAttempts = 5;

     private handleDisconnect() {
       if (this.reconnectAttempts >= this.maxReconnectAttempts) {
         console.error('💥 Max reconnection attempts reached.');
         this.updateState('failed'); // Update Zustand store
         return;
       }
       this.updateState('reconnecting');
       const delay = Math.pow(2, this.reconnectAttempts) * 1000;
       console.log(🔄 Scheduling reconnection in ${delay}ms);

       setTimeout(() => {
         this.reconnectAttempts++;
         this.connect(...); // Attempt to connect again
       }, delay);
     }
     ```

8. Error Handling:
   - Permanent Failure: If reconnection fails after all attempts, the client must transition to a final failed state.
     - UI Feedback: The UI should show a persistent error message like "Connection lost. Please check your internet and try starting a new session." The "Start Session" button should be re-enabled.
   - Server-Side Cleanup: If the server fails to reconnect with a participant after its max attempts, it must fully clean up the session to prevent orphaned resources.

9. Coding Standards & Verification:
   - The state transitions (disconnected -> reconnecting -> connected / failed) must be managed carefully to avoid race conditions.
   - Verification Checklist:
     - 1. Start a voice session and confirm it is connected.
     - 2. Simulate a network interruption on the client machine (e.g., disable Wi-Fi for 5 seconds).
     - 3. Verify the UI status changes to "Reconnecting...".
     - 4. Re-enable the network connection.
     - 5. Verify that the client automatically reconnects without user intervention and the UI status returns to "Connected".
     - 6. Simulate a longer network outage (e.g., 30+ seconds).
     - 7. Verify that after several attempts, the UI transitions to a final "Failed" state with an appropriate error message.
     - 8. Check the server logs to confirm that the ClaraVoiceAgent also detected the poor connection and eventually cleaned up the session after the client failed to return.