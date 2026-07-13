// Generates simple WAV sound effects for the Truth and Dare game
const fs = require("fs");
const path = require("path");

const SAMPLE_RATE = 22050;
const outDir = path.join(__dirname, "..", "assets", "sounds");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

function writeWav(filePath, samples) {
  const buffer = Buffer.alloc(44 + samples.length * 2);
  const view = new DataView(buffer.buffer);
  const writeStr = (offset, str) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };
  const dataLen = samples.length * 2;
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataLen, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, dataLen, true);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-32768, Math.min(32767, Math.round(samples[i] * 32767)));
    view.setInt16(44 + i * 2, s, true);
  }
  fs.writeFileSync(filePath, buffer);
}

function genTone(freq, duration, volume = 0.3) {
  const len = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / SAMPLE_RATE;
    const envelope = Math.min(1, (len - i) / (SAMPLE_RATE * 0.05)); // 50ms fade out
    samples[i] = Math.sin(2 * Math.PI * freq * t) * volume * envelope;
  }
  return samples;
}

function genSquare(freq, duration, volume = 0.3) {
  const len = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / SAMPLE_RATE;
    const envelope = Math.min(1, (len - i) / (SAMPLE_RATE * 0.05));
    samples[i] = (Math.sin(2 * Math.PI * freq * t) >= 0 ? 1 : -1) * volume * envelope;
  }
  return samples;
}

function genNoise(duration, volume = 0.2) {
  const len = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const envelope = Math.min(1, (len - i) / (SAMPLE_RATE * 0.1));
    samples[i] = (Math.random() * 2 - 1) * volume * envelope;
  }
  return samples;
}

function genRisingArpeggio(duration, volume = 0.25) {
  const notes = [261.63, 329.63, 392.00]; // C4, E4, G4
  const len = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(len);
  const noteLen = len / notes.length;
  for (let i = 0; i < len; i++) {
    const noteIdx = Math.min(Math.floor(i / noteLen), notes.length - 1);
    const localI = i - noteIdx * noteLen;
    const envelope = Math.min(1, (noteLen - localI) / (SAMPLE_RATE * 0.1));
    const t = i / SAMPLE_RATE;
    // Add slight harmonic richness
    samples[i] = (Math.sin(2 * Math.PI * notes[noteIdx] * t) * 0.7 +
      Math.sin(2 * Math.PI * notes[noteIdx] * 2 * t) * 0.3) * volume * envelope;
  }
  return samples;
}

function genDescendingTone(startFreq, endFreq, duration, volume = 0.3) {
  const len = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / SAMPLE_RATE;
    const freq = startFreq + (endFreq - startFreq) * (i / len);
    const envelope = Math.min(1, (len - i) / (SAMPLE_RATE * 0.08));
    samples[i] = Math.sin(2 * Math.PI * freq * t) * volume * envelope;
  }
  return samples;
}

function genSweep(startFreq, endFreq, duration, volume = 0.25) {
  const len = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(len);
  let phase = 0;
  for (let i = 0; i < len; i++) {
    const t = i / SAMPLE_RATE;
    const freq = startFreq + (endFreq - startFreq) * (i / len);
    const envelope = Math.min(1, (len - i) / (SAMPLE_RATE * 0.05));
    phase += freq / SAMPLE_RATE;
    samples[i] = Math.sin(2 * Math.PI * phase) * volume * envelope;
  }
  return samples;
}

function genDrumroll(duration, volume = 0.15) {
  const len = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / SAMPLE_RATE;
    const envelope = Math.pow(t / duration, 3); // crescendo
    samples[i] = (Math.random() * 2 - 1) * volume * envelope;
  }
  return samples;
}

function genCrash(duration, volume = 0.25) {
  const len = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const envelope = Math.exp(-i / (SAMPLE_RATE * 0.15)); // fast decay
    const noise = Math.random() * 2 - 1;
    const tone = Math.sin(2 * Math.PI * 8000 * (i / SAMPLE_RATE));
    samples[i] = (noise * 0.7 + tone * 0.3) * volume * envelope;
  }
  return samples;
}

function genTwoTone(freq1, freq2, duration, volume = 0.3) {
  const len = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(len);
  const halfLen = len / 2;
  for (let i = 0; i < len; i++) {
    const t = i / SAMPLE_RATE;
    const freq = i < halfLen ? freq1 : freq2;
    const localI = i < halfLen ? i : i - halfLen;
    const envelope = Math.min(1, (halfLen - localI) / (SAMPLE_RATE * 0.05));
    samples[i] = Math.sin(2 * Math.PI * freq * t) * volume * envelope;
  }
  return samples;
}

function genClick(duration, volume = 0.4) {
  const len = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const envelope = Math.exp(-i / (SAMPLE_RATE * 0.01));
    samples[i] = (Math.random() * 2 - 1) * volume * envelope;
  }
  return samples;
}

// ─── Generate all sound files ──────────────────────────────────────────────

// game_start.mp3 - use WAV instead (will convert below)
writeWav(path.join(outDir, "game_start.wav"), genRisingArpeggio(2.0, 0.25));
console.log("✓ game_start.wav");

// round_start.wav
writeWav(path.join(outDir, "round_start.wav"), genTone(523.25, 0.8, 0.3)); // C5
console.log("✓ round_start.wav");

// mode_select.wav - double click
const click1 = genClick(0.08, 0.3);
const click2 = genClick(0.08, 0.3);
const combinedClick = new Float32Array(click1.length + Math.floor(SAMPLE_RATE * 0.12) + click2.length);
combinedClick.set(click1);
combinedClick.set(click2, click1.length + Math.floor(SAMPLE_RATE * 0.12));
writeWav(path.join(outDir, "mode_select.wav"), combinedClick);
console.log("✓ mode_select.wav");

// send.wav
writeWav(path.join(outDir, "send.wav"), genSweep(600, 200, 0.4, 0.25));
console.log("✓ send.wav");

// question_received.wav
writeWav(path.join(outDir, "question_received.wav"), genTwoTone(440, 554.37, 0.6, 0.25));
console.log("✓ question_received.wav");

// submit.wav
writeWav(path.join(outDir, "submit.wav"), genTone(880, 0.25, 0.25));
console.log("✓ submit.wav");

// reveal.wav - drumroll + crash
const drumroll = genDrumroll(2.0, 0.12);
const crash = genCrash(0.5, 0.2);
const combined = new Float32Array(drumroll.length + Math.floor(SAMPLE_RATE * 0.1) + crash.length);
combined.set(drumroll);
combined.set(crash, drumroll.length + Math.floor(SAMPLE_RATE * 0.1));
writeWav(path.join(outDir, "reveal.wav"), combined);
console.log("✓ reveal.wav");

// pop.wav
writeWav(path.join(outDir, "pop.wav"), genTone(1200, 0.12, 0.3));
console.log("✓ pop.wav");

// next_round.wav
writeWav(path.join(outDir, "next_round.wav"), genSweep(300, 900, 0.7, 0.2));
console.log("✓ next_round.wav");

// fail.wav
writeWav(path.join(outDir, "fail.wav"), genDescendingTone(400, 150, 0.8, 0.3));
console.log("✓ fail.wav");

// disconnect.wav
writeWav(path.join(outDir, "disconnect.wav"), genDescendingTone(250, 80, 0.7, 0.25));
console.log("✓ disconnect.wav");

// tick.wav
writeWav(path.join(outDir, "tick.wav"), genClick(0.04, 0.5));
console.log("✓ tick.wav");

console.log("\n✨ All sounds generated in assets/sounds/");
