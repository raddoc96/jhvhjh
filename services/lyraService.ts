export enum LyraConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  SETUP_COMPLETE = 'setup_complete',
  ERROR = 'error',
}

export enum LyraPlaybackStatus {
  STOPPED = 'stopped',
  PLAYING = 'playing',
  PAUSED = 'paused',
  BUFFERING = 'buffering',
}

export class LyraService {
  public isPlaying: boolean = false;
  public currentPrompts: any[] = [];
  constructor(
    private geminiService: any,
    private onConnectionStatusChange: (status: LyraConnectionStatus, message?: string) => void,
    private onPlaybackStatusChange: (status: LyraPlaybackStatus, message?: string) => void,
    private onPromptFiltered: (reason: string, text: string) => void
  ) {}

  async connect() {
    this.onConnectionStatusChange(LyraConnectionStatus.SETUP_COMPLETE);
  }

  async reset() {
    this.onConnectionStatusChange(LyraConnectionStatus.DISCONNECTED);
  }

  async updateMusicForSlide(slideText: string) {
    console.log(`Updating music for slide with text: ${slideText}`);
  }

  play() {
    this.isPlaying = true;
    this.onPlaybackStatusChange(LyraPlaybackStatus.PLAYING);
  }

  pause() {
    this.isPlaying = false;
    this.onPlaybackStatusChange(LyraPlaybackStatus.PAUSED);
  }

  stop() {
    this.isPlaying = false;
    this.onPlaybackStatusChange(LyraPlaybackStatus.STOPPED);
  }
}
