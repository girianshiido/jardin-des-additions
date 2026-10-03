export type ReadingStatus = 'idle' | 'loading' | 'playing' | 'waiting' | 'error';

/** One reusable player: a new request cancels speech and any pending next line. */
export class TableReader {
  status: ReadingStatus = 'idle';
  private generation = 0;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private detach: (() => void) | undefined;

  constructor(private media: HTMLAudioElement, private changed: (status: ReadingStatus) => void) {
    media.preload = 'auto';
  }

  private setStatus(status: ReadingStatus): void {
    this.status = status;
    this.changed(status);
  }

  stop(): void {
    this.generation++;
    clearTimeout(this.timer);
    this.detach?.();
    this.detach = undefined;
    this.media.pause();
    this.setStatus('idle');
  }

  read(a: number, b: number, next?: () => void): void {
    this.stop();
    const generation = this.generation;
    const failed = () => {
      if (generation !== this.generation) return;
      this.stop();
      this.setStatus('error');
    };
    const ended = () => {
      if (generation !== this.generation) return;
      if (!next) { this.stop(); return; }
      this.setStatus('waiting');
      this.timer = setTimeout(() => {
        if (generation === this.generation) next();
      }, 3000);
    };
    this.media.addEventListener('ended', ended);
    this.media.addEventListener('error', failed);
    this.detach = () => {
      this.media.removeEventListener('ended', ended);
      this.media.removeEventListener('error', failed);
    };
    this.media.src = `./audio/${a}-${b}.mp3`;
    this.setStatus('loading');
    // Called in the child's tap handler, allowing audio on mobile browsers.
    void this.media.play().then(() => {
      if (generation === this.generation) this.setStatus('playing');
    }).catch(failed);
  }
}
