[EPIC 2 - Step 1 - LiveKit Agent Server Implementation]
1. Primary Task:
   - Implement the foundational backend infrastructure for the real-time voice system. This involves creating the main ClaraVoiceAgent class that will run on the server. The initial implementation will focus on handling the lifecycle of a voice session: creating a new session when a user joins a voice chat, tracking that session, and cleaning it up when the user leaves. (Source: project_planv2.md, Section 4.2)

2. File Locations:
- To be Created (Inferred backend service structure):
- electron/services/voice/: A new directory for all voice-related services.
- electron/services/voice/ClaraVoiceAgent.ts: The main class for the LiveKit agent logic.
- electron/services/voice/types.ts: To store shared interfaces like AgentSession.
- To be Modified:
- electron/index.cjs: To instantiate and initialize the ClaraVoiceAgent service so it can connect to the LiveKit server.

3. UI/Component Specification:
   - Not applicable. This is a backend-only implementation step with no user-facing UI.

4. State Management Logic:
   - Not applicable for the frontend. All state for this step is managed within the backend ClaraVoiceAgent class, specifically the sessions: Map<string, AgentSession> property which will store the state for each active voice conversation.

5. Data Model & Schema:
- The implementation will use the AgentSession interface to model the state of each voice connection, as defined in project_planv2.md, Section 4.2.
typescript      // electron/services/voice/types.ts      export interface AgentSession {        sessionId: string;        participantId: string;        startTime: Date;        messageCount: number;        connectionState: 'connecting' | 'connected' | 'reconnecting' | 'error' | 'closed';        // Other fields like audioQuality and context will be added in later steps      }

6. Backend Interaction Logic:
   - The ClaraVoiceAgent will need to connect to a LiveKit server instance.
   - ClaraVoiceAgent.ts:
     - The constructor will initialize the connection to the LiveKit server and set up listeners for room events.
     - Implement the onParticipantJoined(participant: Participant) method. This method will:
       1. Generate a unique sessionId.
       2. Create a new AgentSession object with initial values.
       3. Store the new session in the this.sessions Map.
       4. Log a confirmation message that the session has been created.
     - Implement the onParticipantLeft(participant: Participant) method. This method will:
       1. Find the sessionId associated with the leaving participant's ID.
       2. Call a cleanupSession(sessionId) helper method.
       3. The cleanupSession method will log that the session is being terminated and remove it from the this.sessions Map.

7. Relevant Documentation & Examples:
   - The implementation should follow the structure laid out in project_planv2.md, Section 4.2. The focus is on the session lifecycle methods.
```typescript
// electron/services/voice/ClaraVoiceAgent.ts
import { Room, Participant } from 'livekit-server-sdk';
import { AgentSession } from './types';

     class ClaraVoiceAgent {
       private sessions: Map<string, AgentSession> = new Map();
       private room: Room; // To be initialized

       constructor() {
         // TODO: Initialize LiveKit Room connection and listeners
         // this.room.on('participantJoined', this.onParticipantJoined);
         // this.room.on('participantLeft', this.onParticipantLeft);
       }

       public async onParticipantJoined(participant: Participant) {
         try {
           console.log(🎤 Participant joined: ${participant.identity});
           const sessionId = session_${Date.now()}_${participant.identity};
           const session: AgentSession = {
             sessionId,
             participantId: participant.identity,
             startTime: new Date(),
             messageCount: 0,
             connectionState: 'connecting',
           };
           this.sessions.set(sessionId, session);
           console.log(✅ Session ${sessionId} initialized successfully);
         } catch (error) {
           console.error('❌ Failed to initialize participant session:', error);
         }
       }

       public async onParticipantLeft(participant: Participant) {
           // Find session by participant.identity and call cleanupSession
       }

       private cleanupSession(sessionId: string) {
           const session = this.sessions.get(sessionId);
           if (session) {
             console.log(🧹 Cleaning up session ${sessionId});
             this.sessions.delete(sessionId);
           }
       }
     }
     ```

8. Error Handling:
   - LiveKit Connection Failure: If the initial connection to the LiveKit server fails in the constructor, the application should log a critical error.
     - User-Facing Message (for developer): "Critical: ClaraVoiceAgent failed to connect to the LiveKit server. Voice features will be unavailable."
   - Session Creation Failure: The onParticipantJoined method should be wrapped in a try...catch block. If creating the session object fails for any reason, the error should be logged, and the system should gracefully handle the fact that this participant will not have an active session.
     - User-Facing Message (for developer): "Failed to initialize session for participant {participant.identity}. Error: {error.message}"

9. Coding Standards & Verification:
   - The ClaraVoiceAgent should be designed as a singleton or instantiated only once in the main process.
   - All asynchronous operations should use async/await.
   - Verification Checklist:
     - 1. The ClaraVoiceAgent.ts file and its related types are created.
     - 2. The service is successfully initialized in the Electron main process at startup.
     - 3. Using a LiveKit client (e.g., a test script or a simple web client), connect to the specified LiveKit room.
     - 4. Verify that the onParticipantJoined method is triggered and a log message appears in the Electron main process console confirming a new session was created.
     - 5. Verify that the sessions Map in the ClaraVoiceAgent now contains one entry.
     - 6. Disconnect the LiveKit client.
     - 7. Verify that the onParticipantLeft method is triggered and the log message for cleanupSession appears.
     - 8. Verify that the sessions Map is now empty.