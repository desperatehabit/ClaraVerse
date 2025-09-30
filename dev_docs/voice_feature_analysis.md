be .# Voice Feature Implementation Plan: A Simplified Approach

**Date**: 2025-09-27
**Status**: New Strategy Adopted
**Priority**: High

## 1. Executive Summary

This document outlines a revised, simplified, and more robust implementation plan for the ClaraVerse voice feature. The previous approach involved a complex, custom-built WebRTC and voice agent solution that was proving to be a significant bottleneck.

We are pivoting to a new strategy centered on the **`livekit/agents-js`** framework. This allows us to leverage a powerful, production-ready toolkit for real-time voice processing, dramatically reducing complexity and accelerating development. This document supersedes all previous analysis and planning documents for the voice feature.

### Key Advantages of the New Approach:

-   **Reduced Complexity:** No need to build and maintain a custom WebRTC service or a complex agent server from scratch.
-   **Faster Implementation:** `livekit/agents-js` provides the core infrastructure, allowing us to focus on application-specific logic.
-   **Improved Robustness:** We benefit from the stability and performance of a widely-used, open-source framework.
-   **Clear Path to Completion:** The new plan is broken down into clear, achievable phases.

---

## 2. Core Technology Shift: `livekit/agents-js`

The entire real-time voice infrastructure will be built on the `livekit/agents-js` framework. This is a fundamental shift that eliminates the need for the previously planned `ClaraVoiceAgent.ts` and `ClaraWebRTCService.ts` as custom components.

### Backend Simplification:

-   **`electron/services/voice/ClaraVoiceAgent.ts`** will be redefined as a simple agent using the `defineAgent` and `voice.AgentSession` constructs from `@livekit/agents`.
-   This agent will run as a separate Node.js process, managed by the main Electron app, ensuring stability and separation of concerns.

### Frontend Integration:

-   The frontend will use the standard **`livekit-client`** SDK to join a LiveKit room and interact with the agent.
-   The existing `VoiceContext.tsx` will continue to manage the voice state in the UI, adapting to the LiveKit data streams.

---

## 3. Task Logic as a "Tool"

A key part of this new strategy is to treat our existing, functional task logic as a "tool" that the LiveKit agent can use.

-   The logic in **`VoiceTaskProcessor.ts`** and **`VoiceTaskCommandService.ts`** will be exposed to the LiveKit agent.
-   The agent's LLM will be responsible for deciding when to call this tool based on the user's speech. This is a powerful and flexible approach that allows for easy expansion in the future.

---

## 4. Local Development Setup: Running LiveKit Server

For local development and testing, a LiveKit server instance is required. The most straightforward way to run a local server is by using Docker.

### Prerequisites

-  N/A

### Steps to Run the Server

1.  The following command downloads the latest livekit server:
        ``curl -sSL https://get.livekit.io | bash``

2.  **Running the Server:**
    livekit-server --dev

    Starts an instance of the server running in development mode. The api key/secret pair is as follows:

    API key: devkey
    API secret: secret

3.  **Verify the Server is Running:**
    Once the container is running, you can access the LiveKit webhook dashboard at `http://localhost:7880`. You should see a simple interface confirming that the server is active.

### Connection Details

-   **Server URL:** `ws://localhost:7880`
-   **API Key:** `devkey`
-   **API Secret:** `devsecret`

These are the credentials you will use in the `VoiceSettingsPanel.tsx` to connect the ClaraVerse application to your local LiveKit instance.

---

## 5. Revised Implementation Phases

The implementation is now broken down into three clear, sequential phases:

### Phase 1: Basic Agent & Frontend Integration

The goal of this phase is to establish a basic, end-to-end voice conversation.

-   **Tasks:**
    1.  Set up a basic LiveKit Agent using `@livekit/agents-js`.
    2.  Integrate the `livekit-client` into the React frontend.
    3.  Establish a basic voice conversation between the user and the agent.

### Phase 2: Task Integration via Tools

With the basic voice pipeline in place, we will now integrate our task management logic.

-   **Tasks:**
    1.  Expose the existing `VoiceTaskCommandService` functionality as a tool that the LiveKit agent's LLM can call.
    2.  Implement the logic for the agent to process the tool's output and respond to the user.

### Phase 3: UI Polish and Refinement

The final phase is focused on refining the user experience.

-   **Tasks:**
    1.  Integrate the `VoiceSettingsPanel.tsx` to configure the LiveKit connection (e.g., server URL, credentials).
    2.  Refine UI components like `AudioVisualization.tsx` and `ConversationTranscript.tsx` to work with LiveKit data streams.

---

## 6. Conclusion

This new, simplified plan provides a clear and confident path forward for the voice feature. By leveraging the `livekit/agents-js` framework, we can deliver a robust and powerful voice experience to our users in a fraction of the time and with significantly less complexity than the previous approach.