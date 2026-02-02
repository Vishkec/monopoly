let audioContext;

const createContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
};

const playTone = (frequency, duration = 0.2, type = "square") => {
  createContext();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.value = 0.12;
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start();
  gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration);
  oscillator.stop(audioContext.currentTime + duration);
};

export const playDiceSound = () => {
  playTone(420, 0.15, "triangle");
  setTimeout(() => playTone(520, 0.1, "triangle"), 80);
};

export const playCashSound = () => {
  playTone(660, 0.12, "square");
  setTimeout(() => playTone(880, 0.12, "square"), 90);
};

export const playJailSound = () => {
  playTone(180, 0.35, "sawtooth");
};
