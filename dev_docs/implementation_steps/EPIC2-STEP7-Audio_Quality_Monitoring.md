[EPIC 2 - Step 7 - Audio Quality Monitoring & Adaptive Bitrate]
1. Primary Task:
   - Implement mechanisms to monitor the quality of the WebRTC connection and, in the future, adapt to changing network conditions. The initial implementation will focus on collecting and logging key metrics like latency, packet loss, and jitter. (Source: project_planv2.md, Section 4.2)

2. File Locations:
- To be Modified:
- electron/services/voice/ClaraVoiceAgent.ts: To log audio quality metrics received from the client.
- src/features/voice/services/ClaraWebRTCService.ts: To periodically get WebRTC stats and log them.
     - src/features/voice/services/types.ts: To add the AudioQuality and WebRTCMetrics interfaces.

3. UI/Component Specification:
   - Inferred UI Element: A small, non-intrusive "Connection Quality" indicator could be added to the VoiceView.
     - Layout: A simple text display or an icon (e.g., signal bars) in the corner of the screen.
     - Content: It would display a simplified status like "Excellent", "Good", or "Poor" based on the collected metrics. This is a "nice-to-have" for the MVP but the data collection is essential.

[EPIC 2 - Step 7 - Audio Quality Monitoring & Adaptive Bitrate]
1. Primary Task:
   - Implement mechanisms to monitor the quality of the WebRTC connection and, in the future, adapt to changing network conditions. The initial implementation will focus on collecting and logging key metrics like latency, packet loss, and jitter. (Source: project_planv2.md, Section 4.2)

2. File Locations:
- To be Modified:
- electron/services/voice/ClaraVoiceAgent.ts: To log audio quality metrics received from the client.
- src/features/voice/services/ClaraWebRTCService.ts: To periodically get WebRTC stats and log them.
     - src/features/voice/services/types.ts: To add the AudioQuality and WebRTCMetrics interfaces.

3. UI/Component Specification:
   - Inferred UI Element: A small, non-intrusive "Connection Quality" indicator could be added to the VoiceView.
     - Layout: A simple text display or an icon (e.g., signal bars) in the corner of the screen.
     - Content: It would display a simplified status like "Excellent", "Good", or "Poor" based on the collected metrics. This is a "nice-to-have" for the MVP but the data collection is essential.

4. State Management Logic:
   - voiceStore.ts:
     - New State:
       - qualityMetrics: WebRTCMetrics | null
       - qualityStatus: 'excellent' | 'good' | 'poor'
     - New Action:
       - updateQualityMetrics(metrics: WebRTCMetrics): An action to update the store with the latest metrics from the ClaraWebRTCService.

5. Data Model & Schema:
   - Implement the AudioQuality and WebRTCMetrics interfaces as defined in project_planv2.md, Section 4.2, to structure the collected statistics.
     typescript      // src/features/voice/services/types.ts      export interface WebRTCMetrics {        latency: number;     // Round trip time in ms        packetLoss: number;  // Percentage        jitter: number;     // Buffer delay variation        bitrate: number;     // Inbound bitrate in bps      }      

6. Backend Interaction Logic:
   - ClaraWebRTCService.ts:
     - Implement a startQualityMonitoring() method that uses setInterval.
     - Every few seconds (e.g., 5s), the interval callback will call peerConnection.getStats().
     - It will then parse the resulting RTCStatsReport to extract the key metrics (round trip time, packets lost, jitter).
     - The extracted metrics will be used to call the updateQualityMetrics action in the voiceStore.
     - Adaptive Bitrate (Future-proofing): If the packet loss or latency exceeds predefined thresholds (as specified in ClaraWebRTCService.config), the service should log a warning: "Quality degradation detected. Future implementation will adapt bitrate here."

7. Relevant Documentation & Examples:
   - getStats() API Usage (ClaraWebRTCService.ts):
     ```typescript
     private async monitorConnectionQuality() {
       if (!this.peerConnection) return;
       const stats = await this.peerConnection.getStats();
       let metrics: Partial<WebRTCMetrics> = {};

       stats.forEach(report => {
         if (report.type === 'remote-inbound-rtp' && report.kind === 'audio') {
           metrics.jitter = report.jitter;
           metrics.packetLoss = (report.packetsLost / report.packetsReceived) * 100;
         }
         if (report.type === 'candidate-pair' && report.state === 'succeeded') {
           metrics.latency = report.currentRoundTripTime * 1000;
         }
       });
       this.voiceStore.updateQualityMetrics(metrics as WebRTCMetrics);
     }
     ```

8. Error Handling:
   - The getStats() API is very stable and unlikely to fail. The main risk is misinterpreting the stats report.
   - If the stats report is missing expected fields, the parsing logic should handle the undefined values gracefully (e.g., defaulting them to 0) to prevent crashes.

9. Coding Standards & Verification:
   - The quality monitoring should run on a setInterval that is properly cleaned up (clearInterval) when the connection is terminated.
   - Verification Checklist:
     - 1. After connecting a voice session, open the browser's developer console.
     - 2. Verify that logs containing the quality metrics (latency, jitter, packet loss) are printed every few seconds.
     - 3. In the React DevTools, inspect the voiceStore and confirm that the qualityMetrics state is being updated.
     - 4. (Optional) If a UI indicator is built, verify that it reflects the state of the connection.
     - 5. Use a network throttling tool (like the one in Chrome DevTools) to simulate a poor network.
     - 6. Verify that the logged metrics reflect the degraded conditions (higher latency, increased packet loss).
     - 7. Verify the "Quality degradation detected" log message appears.

4. State Management Logic:
   - voiceStore.ts:
     - New State:
       - qualityMetrics: WebRTCMetrics | null
       - qualityStatus: 'excellent' | 'good' | 'poor'
     - New Action:
       - updateQualityMetrics(metrics: WebRTCMetrics): An action to update the store with the latest metrics from the ClaraWebRTCService.

5. Data Model & Schema:
   - Implement the AudioQuality and WebRTCMetrics interfaces as defined in project_planv2.md, Section 4.2, to structure the collected statistics.
     typescript      // src/features/voice/services/types.ts      export interface WebRTCMetrics {        latency: number;     // Round trip time in ms        packetLoss: number;  // Percentage        jitter: number;     // Buffer delay variation        bitrate: number;     // Inbound bitrate in bps      }      

6. Backend Interaction Logic:
   - ClaraWebRTCService.ts:
     - Implement a startQualityMonitoring() method that uses setInterval.
     - Every few seconds (e.g., 5s), the interval callback will call peerConnection.getStats().
     - It will then parse the resulting RTCStatsReport to extract the key metrics (round trip time, packets lost, jitter).
     - The extracted metrics will be used to call the updateQualityMetrics action in the voiceStore.
     - Adaptive Bitrate (Future-proofing): If the packet loss or latency exceeds predefined thresholds (as specified in ClaraWebRTCService.config), the service should log a warning: "Quality degradation detected. Future implementation will adapt bitrate here."

7. Relevant Documentation & Examples:
   - getStats() API Usage (ClaraWebRTCService.ts):
     ```typescript
     private async monitorConnectionQuality() {
       if (!this.peerConnection) return;
       const stats = await this.peerConnection.getStats();
       let metrics: Partial<WebRTCMetrics> = {};

       stats.forEach(report => {
         if (report.type === 'remote-inbound-rtp' && report.kind === 'audio') {
           metrics.jitter = report.jitter;
           metrics.packetLoss = (report.packetsLost / report.packetsReceived) * 100;
         }
         if (report.type === 'candidate-pair' && report.state === 'succeeded') {
           metrics.latency = report.currentRoundTripTime * 1000;
         }
       });
       this.voiceStore.updateQualityMetrics(metrics as WebRTCMetrics);
     }
     ```

8. Error Handling:
   - The getStats() API is very stable and unlikely to fail. The main risk is misinterpreting the stats report.
   - If the stats report is missing expected fields, the parsing logic should handle the undefined values gracefully (e.g., defaulting them to 0) to prevent crashes.

9. Coding Standards & Verification:
   - The quality monitoring should run on a setInterval that is properly cleaned up (clearInterval) when the connection is terminated.
   - Verification Checklist:
     - 1. After connecting a voice session, open the browser's developer console.
     - 2. Verify that logs containing the quality metrics (latency, jitter, packet loss) are printed every few seconds.
     - 3. In the React DevTools, inspect the voiceStore and confirm that the qualityMetrics state is being updated.
     - 4. (Optional) If a UI indicator is built, verify that it reflects the state of the connection.
     - 5. Use a network throttling tool (like the one in Chrome DevTools) to simulate a poor network.
     - 6. Verify that the logged metrics reflect the degraded conditions (higher latency, increased packet loss).
     - 7. Verify the "Quality degradation detected" log message appears.