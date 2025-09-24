[EPIC 2 - Step 8 - Health Checks & Performance Monitoring]
1. Primary Task:
   - Implement a background health monitoring system in the ClaraVoiceAgent to ensure server-side stability. This system will periodically check for stuck or long-running sessions and monitor resource usage to prevent memory leaks and ensure the agent remains healthy. (Source: project_planv2.md, Section 4.2)

2. File Locations:
- To be Modified:
- electron/services/voice/ClaraVoiceAgent.ts: To add the health check interval and logic.
- electron/services/voice/types.ts: To add the PerformanceMetrics interface.

3. UI/Component Specification:
   - Not applicable. This is a backend-only, non-visible feature.

4. State Management Logic:
   - Not applicable for the frontend.

5. Data Model & Schema:
- Implement the PerformanceMetrics interface as defined in project_planv2.md, Section 4.2. This will be attached to the ClaraVoiceAgent instance itself to track overall agent health.
typescript      // electron/services/voice/types.ts      export interface PerformanceMetrics {        audioLatency: number;        processingTime: number;        memoryUsage: number;        errorCount: number;        reconnectionCount: number;      }

6. Backend Interaction Logic:
   - ClaraVoiceAgent.ts:
     - In the constructor, create a setInterval that calls a new performHealthCheck() method every 30 seconds.
     - The destroy() method of the class must clear this interval using clearInterval.
     - performHealthCheck():
       1. Check for Stuck Sessions: Iterate over the this.sessions Map. If a session's startTime is older than a defined threshold (e.g., 30 minutes), log a warning. This helps identify sessions that may not have been cleaned up properly.
       2. Monitor Memory: Use Node.js's process.memoryUsage() to get the current heap size and store it in this.metrics.memoryUsage.
       3. Log Summary: Print a summary log of the agent's health: 🏥 Health check - Active Sessions: {X}, Total Errors: {Y}, Memory Usage: {Z}MB.
     - The errorCount and reconnectionCount metrics will be incremented in the respective error handling and reconnection logic sections implemented previously.

7. Relevant Documentation & Examples:
   - Node.js process.memoryUsage():
     ```typescript
     // In ClaraVoiceAgent.ts
     private performHealthCheck() {
       // 1. Check for stuck sessions
       const now = Date.now();
       this.sessions.forEach((session, sessionId) => {
         const sessionAgeMinutes = (now - session.startTime.getTime()) / 60000;
         if (sessionAgeMinutes > 30) {
           console.warn(⚠️ Session ${sessionId} has been active for over 30 minutes.);
         }
       });

       // 2. Monitor Memory
       this.metrics.memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024; // In MB

       // 3. Log Summary
       console.log(
         🏥 Health check - Sessions: ${this.sessions.size}, Errors: ${this.metrics.errorCount}, Memory: ${this.metrics.memoryUsage.toFixed(2)}MB
       );
     }
     ```

8. Error Handling:
   - This feature is the error handling. Its purpose is to detect problems rather than cause them. The primary risk is the health check itself causing performance issues if it's too intensive, but the planned checks (iteration and memory check) are very lightweight.

9. Coding Standards & Verification:
   - The health check interval must be managed properly to avoid multiple intervals running simultaneously.
   - Verification Checklist:
     - 1. Run the application and leave it idle.
     - 2. Check the Electron main process console.
     - 3. Verify that the "🏥 Health check" log message appears automatically every 30 seconds.
     - 4. Connect a client to start a voice session.
     - 5. Verify that the next health check log shows "Sessions: 1".
     - 6. Manually trigger an error (e.g., by disabling the STT service) and verify that the next health check log shows "Errors: 1".
     - 7. Disconnect the client and close the application. Verify that no errors related to the setInterval are thrown on exit.