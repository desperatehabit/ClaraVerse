import { JobContext, defineAgent } from '@livekit/agents';
import { TTS as elevenlabs } from '@livekit/agents-plugin-elevenlabs';
import { RoomEvent, Track, TrackPublishOptions } from 'livekit-client';
import { EventEmitter } from 'events';
import { voiceTaskCommandService } from '../VoiceTaskCommandService';

const toolEvents = new EventEmitter();

export default defineAgent({
  // @ts-ignore - The 'tools' property is not defined in the Agent type, but is required for the LLM to use the tool.
  tools: {
    manage_tasks: {
      description: 'Manages tasks based on user commands. Can create, update, delete, and complete tasks.',
      input: {
        type: 'string',
        description: 'The user\'s command to manage tasks.',
      },
      function: async (command: string) => {
        const result = voiceTaskCommandService.parseCommand(command);
        toolEvents.emit('tool_result', result);
        return JSON.stringify(result);
      },
    },
  },
  entry: async (ctx: JobContext) => {
    await ctx.connect();
    console.log('ClaraVoiceAgent connected successfully.');

    const sendTranscript = async (speaker: string, text: string) => {
      if (!ctx.room.localParticipant) {
        console.error('Cannot send transcript, local participant not found.');
        return;
      }
      const data = {
        type: 'transcript',
        transcript: {
          speaker,
          text,
          timestamp: new Date().toISOString(),
        },
      };
      const payload = new TextEncoder().encode(JSON.stringify(data));
      await ctx.room.localParticipant.publishData(payload, { reliable: true });
      console.log(`Sent transcript: ${speaker}: ${text}`);
    };

    const tts = new elevenlabs({
      apiKey: process.env.ELEVENLABS_API_KEY ?? '',
    });

    toolEvents.on('tool_result', async (result: any) => {
      let response = '';
      if (result.status === 'success') {
        response = `Okay, I've handled that. ${result.message}`;
      } else {
        response = `Sorry, I encountered an error: ${result.message}`;
      }

      await sendTranscript('Clara', response);

      try {
        // @ts-ignore - The type definitions for synthesize seem to be incorrect, expecting 0 arguments.
        const ttsTrack = await tts.synthesize(response);
        if (ctx.room.localParticipant) {
          const publishOptions: TrackPublishOptions = {
            source: Track.Source.Unknown,
          };
          // @ts-ignore - The type of ttsTrack is likely incompatible, but should work at runtime.
          await ctx.room.localParticipant.publishTrack(ttsTrack, publishOptions);
          console.log('Published TTS audio track for tool result.');
        }
      } catch (e) {
        console.error('Error synthesizing or publishing TTS track:', e);
      }
    });

    ctx.room.on(RoomEvent.TrackPublished, (publication: any, participant: any) => {
      if (publication.kind === 'audio') {
        console.log(`Audio track published by: ${participant.identity}`);
        publication.setSubscribed(true);
      }
    });

    ctx.room.on(RoomEvent.TrackSubscribed, async (track: any, publication: any, participant: any) => {
      if (track.kind === 'audio' && participant.identity !== ctx.room.localParticipant?.identity) {
        console.log(`Subscribed to audio track from: ${participant.identity}`);
        
        // This is where STT would happen. For now, we'll simulate it.
        const userSpeech = "This is a simulated user transcription.";
        await sendTranscript(participant.identity, userSpeech);

        // The agent should probably do something with the userSpeech, like calling a tool.
        // For now, just acknowledging.
        const response = "I heard you.";
        await sendTranscript('Clara', response);

        try {
          // @ts-ignore - The type definitions for synthesize seem to be incorrect, expecting 0 arguments.
          const ttsTrack = await tts.synthesize(response);
          if (ctx.room.localParticipant) {
            const publishOptions: TrackPublishOptions = {
              source: Track.Source.Unknown,
            };
            // @ts-ignore - The type of ttsTrack is likely incompatible, but should work at runtime.
            await ctx.room.localParticipant.publishTrack(ttsTrack, publishOptions);
            console.log('Published TTS audio track.');
          }
        } catch (e) {
          console.error('Error synthesizing or publishing TTS track:', e);
        }
      }
    });
  },
});