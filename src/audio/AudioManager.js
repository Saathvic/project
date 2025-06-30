export class AudioManager {
  constructor() {
    this.audioContext = null;
    this.sounds = {};
    this.enabled = false;
    
    this.initAudio();
  }

  async initAudio() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.enabled = true;
      
      // Create simple ambient sounds
      this.createAmbientSounds();
    } catch (error) {
      console.log('Audio not supported or blocked');
      this.enabled = false;
    }
  }

  createAmbientSounds() {
    if (!this.enabled) return;
    
    // Create subtle wind sound
    this.createWindSound();
  }

  createWindSound() {
    if (!this.audioContext) return;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(80, this.audioContext.currentTime);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, this.audioContext.currentTime);
    
    gainNode.gain.setValueAtTime(0.02, this.audioContext.currentTime);
    
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.start();
    
    // Add subtle frequency modulation
    setInterval(() => {
      if (this.audioContext && oscillator.frequency) {
        const variation = 80 + Math.sin(Date.now() * 0.001) * 10;
        oscillator.frequency.setValueAtTime(variation, this.audioContext.currentTime);
      }
    }, 100);
  }

  playSound(type) {
    if (!this.enabled || !this.audioContext) return;
    
    // Simple sound effects using oscillators
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    switch (type) {
      case 'harvest':
        oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(220, this.audioContext.currentTime + 0.3);
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        break;
      case 'water':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.05, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
        break;
      case 'fix':
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(300, this.audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.08, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
        break;
    }
    
    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.5);
  }
}