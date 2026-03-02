// Web Audio API sound effects – no external files needed

let ctx: AudioContext | null = null;

const getCtx = (): AudioContext => {
  if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  return ctx;
};

const play = (fn: (ac: AudioContext) => void) => {
  try { fn(getCtx()); } catch {}
};

/** Short pleasant "tick" – task toggle */
export const playTaskComplete = () =>
  play((ac) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.connect(g); g.connect(ac.destination);
    o.type = "sine";
    o.frequency.setValueAtTime(880, ac.currentTime);
    o.frequency.exponentialRampToValueAtTime(1320, ac.currentTime + 0.08);
    g.gain.setValueAtTime(0.18, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.22);
    o.start(ac.currentTime);
    o.stop(ac.currentTime + 0.22);
  });

/** Short descending – task un-toggle */
export const playTaskUncomplete = () =>
  play((ac) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.connect(g); g.connect(ac.destination);
    o.type = "sine";
    o.frequency.setValueAtTime(660, ac.currentTime);
    o.frequency.exponentialRampToValueAtTime(440, ac.currentTime + 0.1);
    g.gain.setValueAtTime(0.1, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.18);
    o.start(ac.currentTime);
    o.stop(ac.currentTime + 0.18);
  });

/** Triple ascending chime – timer / focus session finished */
export const playTimerDone = () =>
  play((ac) => {
    const notes = [523, 659, 784];
    notes.forEach((freq, i) => {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.connect(g); g.connect(ac.destination);
      o.type = "sine";
      const t = ac.currentTime + i * 0.18;
      o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.22, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      o.start(t);
      o.stop(t + 0.35);
    });
  });

/** Soft pop – pin / star action */
export const playPop = () =>
  play((ac) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.connect(g); g.connect(ac.destination);
    o.type = "sine";
    o.frequency.setValueAtTime(1046, ac.currentTime);
    o.frequency.exponentialRampToValueAtTime(600, ac.currentTime + 0.1);
    g.gain.setValueAtTime(0.12, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.15);
    o.start(ac.currentTime);
    o.stop(ac.currentTime + 0.15);
  });
