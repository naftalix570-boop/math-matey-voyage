type Kind = "click" | "correct" | "wrong" | "win" | "levelup" | "box" | "coin";

let ctx: AudioContext | null = null;

function tone(freqs: number[], dur = 0.12, type: OscillatorType = "sine") {
  if (typeof window === "undefined") return;
  try {
    ctx =
      ctx ??
      new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const now = ctx.currentTime;
    freqs.forEach((f, i) => {
      const osc = ctx!.createOscillator();
      const gain = ctx!.createGain();
      osc.type = type;
      osc.frequency.value = f;
      const start = now + i * dur;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.18, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
      osc.connect(gain).connect(ctx!.destination);
      osc.start(start);
      osc.stop(start + dur + 0.02);
    });
  } catch {
    /* audio not available */
  }
}

export function playSound(kind: Kind, enabled = true) {
  if (!enabled) return;
  switch (kind) {
    case "click":
      return tone([440], 0.05, "triangle");
    case "correct":
      return tone([660, 880], 0.1);
    case "wrong":
      return tone([220, 165], 0.14, "sine");
    case "win":
      return tone([523, 659, 784, 1046], 0.13);
    case "levelup":
      return tone([659, 784, 988, 1319], 0.12);
    case "box":
      return tone([300, 500, 900], 0.1, "square");
    case "coin":
      return tone([1046, 1568], 0.07, "triangle");
  }
}
