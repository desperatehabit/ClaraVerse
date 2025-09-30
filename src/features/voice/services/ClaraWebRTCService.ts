import {
  ConnectionState,
  createLocalAudioTrack,
  LocalAudioTrack,
  LocalParticipant,
  LocalTrack,
  LocalTrackPublication,
  Participant,
  RemoteParticipant,
  RemoteTrack,
  RemoteTrackPublication,
  Room,
  RoomEvent,
  Track,
} from 'livekit-client';
import { EventEmitter } from 'events';

class ClaraWebRTCService extends EventEmitter {
  private room: Room | null = null;
  private localAudioTrack: LocalAudioTrack | null = null;
  private remoteAudioTracks = new Map<string, HTMLAudioElement>();
  public connectionState: ConnectionState = ConnectionState.Disconnected;

  constructor() {
    super();
  }

  public async connect(url: string, token: string): Promise<void> {
    this.room = new Room({
      adaptiveStream: true,
      dynacast: true,
    });

    this.room.on(RoomEvent.ConnectionStateChanged, this.onConnectionStateChanged);
    this.room.on(RoomEvent.ParticipantConnected, this.onParticipantConnected);
    this.room.on(RoomEvent.ParticipantDisconnected, this.onParticipantDisconnected);
    this.room.on(RoomEvent.TrackSubscribed, this.onTrackSubscribed);
    this.room.on(RoomEvent.TrackUnsubscribed, this.onTrackUnsubscribed);

    try {
      await this.room.connect(url, token);
      console.log('Connected to LiveKit room:', this.room.name);
      await this.publishLocalAudio();
    } catch (error) {
      console.error('Failed to connect to LiveKit room:', error);
      this.emit('error', 'Failed to connect to LiveKit room.');
    }
  }

  public async disconnect(): Promise<void> {
    if (this.room) {
      await this.room.disconnect();
      this.room = null;
      this.localAudioTrack?.stop();
      this.localAudioTrack = null;
      this.clearRemoteTracks();
      console.log('Disconnected from LiveKit room.');
    }
  }

  public getLocalAudioStream(): MediaStream | null {
    return this.localAudioTrack?.mediaStream || null;
  }

  private async publishLocalAudio(): Promise<void> {
    try {
      this.localAudioTrack = await createLocalAudioTrack();
      if (this.room && this.room.localParticipant && this.localAudioTrack) {
        await this.room.localParticipant.publishTrack(this.localAudioTrack);
        console.log('Local audio track published.');
      }
    } catch (error) {
      console.error('Error getting or publishing local audio track:', error);
      this.emit('error', 'Error accessing microphone.');
    }
  }

  private onConnectionStateChanged = (state: ConnectionState): void => {
    this.connectionState = state;
    this.emit('connection-state-changed', state);
    console.log('Connection state changed:', state);
  };

  private onParticipantConnected = (participant: RemoteParticipant): void => {
    console.log('Participant connected:', participant.identity);
  };

  private onParticipantDisconnected = (participant: RemoteParticipant): void => {
    console.log('Participant disconnected:', participant.identity);
  };

  private onTrackSubscribed = (
    track: RemoteTrack,
    publication: RemoteTrackPublication,
    participant: RemoteParticipant
  ): void => {
    if (track.kind === Track.Kind.Audio) {
      const audioElement = track.attach();
      document.body.appendChild(audioElement);
      this.remoteAudioTracks.set(participant.sid, audioElement);
      console.log(`Audio track subscribed for participant: ${participant.identity}`);
    }
  };

  private onTrackUnsubscribed = (
    track: RemoteTrack,
    publication: RemoteTrackPublication,
    participant: RemoteParticipant
  ): void => {
    if (track.kind === Track.Kind.Audio) {
      const audioElement = this.remoteAudioTracks.get(participant.sid);
      if (audioElement) {
        audioElement.remove();
        this.remoteAudioTracks.delete(participant.sid);
        console.log(`Audio track unsubscribed for participant: ${participant.identity}`);
      }
    }
  };

  private clearRemoteTracks(): void {
    this.remoteAudioTracks.forEach((audioElement) => {
      audioElement.remove();
    });
    this.remoteAudioTracks.clear();
  }

  // Placeholder for generating a token via IPC
  public async getJoinToken(roomName: string, participantName: string): Promise<string> {
    console.log('Requesting join token for', { roomName, participantName });
    if (window.electron && window.electron.voice) {
      return window.electron.voice.generateToken(participantName, roomName);
    }
    console.warn('Electron voice API not available. Using dummy token.');
    return 'dummy-token-for-testing';
  }
}

export default new ClaraWebRTCService();