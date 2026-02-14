// Sound effects using Web Audio API
class SoundManager {
  constructor() {
    this.enabled = true;
    this.audioContext = null;
    this.sounds = {};
  }

  init() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.createSounds();
    } catch (e) {
      console.log('Web Audio API not supported');
    }
  }

  createSounds() {
    // Card play sound
    this.sounds.cardPlay = () => {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      osc.connect(gain);
      gain.connect(this.audioContext.destination);
      osc.frequency.value = 400;
      gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
      osc.start();
      osc.stop(this.audioContext.currentTime + 0.1);
    };

    // Card draw sound
    this.sounds.cardDraw = () => {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      osc.connect(gain);
      gain.connect(this.audioContext.destination);
      osc.frequency.value = 300;
      gain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
      osc.start();
      osc.stop(this.audioContext.currentTime + 0.15);
    };

    // UNO call sound
    this.sounds.uno = () => {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      osc.connect(gain);
      gain.connect(this.audioContext.destination);
      osc.type = 'square';
      osc.frequency.value = 600;
      gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
      osc.start();
      osc.stop(this.audioContext.currentTime + 0.3);
    };

    // Win sound
    this.sounds.win = () => {
      const notes = [523, 659, 784, 1047];
      notes.forEach((freq, i) => {
        setTimeout(() => {
          const osc = this.audioContext.createOscillator();
          const gain = this.audioContext.createGain();
          osc.connect(gain);
          gain.connect(this.audioContext.destination);
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
          osc.start();
          osc.stop(this.audioContext.currentTime + 0.2);
        }, i * 100);
      });
    };

    // Error sound
    this.sounds.error = () => {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      osc.connect(gain);
      gain.connect(this.audioContext.destination);
      osc.type = 'sawtooth';
      osc.frequency.value = 200;
      gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
      osc.start();
      osc.stop(this.audioContext.currentTime + 0.2);
    };
  }

  play(soundName) {
    if (!this.enabled || !this.audioContext || !this.sounds[soundName]) return;
    try {
      this.sounds[soundName]();
    } catch (e) {
      console.log('Error playing sound:', e);
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }
}

const soundManager = new SoundManager();
