const { defineAgent, voice } = require('@livekit/agents');

async function agentEntrypoint(ctx) {
  const { roomName, token } = JSON.parse(process.argv);

  // No VAD, STT, LLM, or TTS plugins are needed for Phase 1
  const session = new voice.AgentSession(ctx);

  session.on('trackSubscribed', (track) => {
    console.log('Agent received audio track:', track.sid);
    // In Phase 1, we just log that we've received the track.
    // No audio processing will be done yet.
  });

  // The agent is now running and waiting for a track.
  await ctx.connect(roomName, token);
}

const agent = defineAgent({
  entrypoint: agentEntrypoint,
  // No tools are needed for Phase 1
  tools: {},
});

module.exports = agent;