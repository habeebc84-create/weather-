export class AmbientAudio {
  private ctx: AudioContext | null = null;
  private noiseSource: AudioBufferSourceNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private gainNode: GainNode | null = null;
  private lfo: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
  }

  playWeather(mood: string) {
    this.stop();
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') {
       this.ctx.resume();
    }

    // Sunny or minor conditions might just use a very quiet ambient pad or nothing
    if (mood === 'sunny' || mood === 'clear') {
       return; // Prefer silence for clear weather in minimalist app
    }

    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
       output[i] = Math.random() * 2 - 1; // Basic white noise
    }

    this.noiseSource = this.ctx.createBufferSource();
    this.noiseSource.buffer = noiseBuffer;
    this.noiseSource.loop = true;

    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = 'lowpass';

    this.gainNode = this.ctx.createGain();
    
    // Connect chain
    this.noiseSource.connect(this.filter);
    this.filter.connect(this.gainNode);
    this.gainNode.connect(this.ctx.destination);

    // Sculpt sound based on mood
    if (mood === 'rain' || mood === 'storm') {
      this.filter.frequency.value = 1000;
      this.gainNode.gain.value = mood === 'storm' ? 0.3 : 0.15;
    } else if (mood === 'snow') {
      this.filter.frequency.value = 400; // Muffled
      this.gainNode.gain.value = 0.05;
    } else if (mood === 'wind' || mood === 'cloudy' || mood === 'fog') {
      // Wind effect
      this.filter.frequency.value = 300;
      this.gainNode.gain.value = 0.1;
      
      this.lfo = this.ctx.createOscillator();
      this.lfo.type = 'sine';
      this.lfo.frequency.value = 0.15; // Slow sweep
      
      this.lfoGain = this.ctx.createGain();
      this.lfoGain.gain.value = 500; // Sweep up to 800hz
      
      this.lfo.connect(this.lfoGain);
      this.lfoGain.connect(this.filter.frequency);
      this.lfo.start();
    }

    this.noiseSource.start();
  }

  stop() {
    if (this.noiseSource) {
      try { this.noiseSource.stop(); } catch(e) {}
      this.noiseSource.disconnect();
      this.noiseSource = null;
    }
    if (this.lfo) {
      try { this.lfo.stop(); } catch(e) {}
      this.lfo.disconnect();
      this.lfo = null;
    }
    if (this.filter) {
      this.filter.disconnect();
      this.filter = null;
    }
    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }
  }

  setMute(mute: boolean) {
    if (!this.ctx) return;
    if (mute) {
      if (this.ctx.state === 'running') this.ctx.suspend();
    } else {
      if (this.ctx.state === 'suspended') this.ctx.resume();
    }
  }
}

export const ambientAudio = new AmbientAudio();
