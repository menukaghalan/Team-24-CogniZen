import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as FileSystem from 'expo-file-system';

type NoteSpec = {
  freq: number;
  dur: number;
  gain: number;
  gapMs?: number;
};

function writeStr(view: DataView, offset: number, value: string) {
  for (let i = 0; i < value.length; i += 1) {
    view.setUint8(offset + i, value.charCodeAt(i));
  }
}

function buildWav(note: NoteSpec, sr = 22050): ArrayBuffer {
  const samples = Math.floor(sr * note.dur);
  const buf = new ArrayBuffer(44 + samples * 2);
  const view = new DataView(buf);
  const attackSamples = Math.floor(sr * 0.005);

  writeStr(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples * 2, true);
  writeStr(view, 8, 'WAVE');
  writeStr(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sr, true);
  view.setUint32(28, sr * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(view, 36, 'data');
  view.setUint32(40, samples * 2, true);

  for (let i = 0; i < samples; i += 1) {
    const t = i / sr;
    const attack = i < attackSamples ? i / Math.max(attackSamples, 1) : 1;
    const decay = Math.max(0, 1 - i / Math.max(samples, 1));
    const envelope = attack * decay * decay;
    const wave =
      Math.sin(2 * Math.PI * note.freq * t) +
      0.12 * Math.sin(2 * Math.PI * note.freq * 2 * t);
    const sample = (wave / 1.12) * note.gain * envelope;

    view.setInt16(
      44 + i * 2,
      Math.max(-32767, Math.min(32767, Math.round(sample * 32767))),
      true,
    );
  }

  return buf;
}

function bufToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let value = '';

  for (let i = 0; i < bytes.length; i += 1) {
    value += String.fromCharCode(bytes[i]);
  }

  return btoa(value);
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const TONES = {
  intro: [
    { freq: 392, dur: 0.08, gain: 0.08, gapMs: 58 },
    { freq: 523.25, dur: 0.08, gain: 0.08, gapMs: 62 },
    { freq: 659.25, dur: 0.1, gain: 0.08 },
  ],
  open: [
    { freq: 440, dur: 0.06, gain: 0.1, gapMs: 44 },
    { freq: 587.33, dur: 0.09, gain: 0.11 },
  ],
  close: [
    { freq: 587.33, dur: 0.06, gain: 0.09, gapMs: 38 },
    { freq: 440, dur: 0.08, gain: 0.09 },
  ],
  tap: [{ freq: 783.99, dur: 0.06, gain: 0.095 }],
  confirm: [
    { freq: 523.25, dur: 0.06, gain: 0.1, gapMs: 46 },
    { freq: 698.46, dur: 0.1, gain: 0.11 },
  ],
} as const satisfies Record<string, NoteSpec[]>;

export type ToneType = keyof typeof TONES;

let cache: Partial<Record<string, AudioPlayer>> = {};
let audioReady = false;

async function ensureAudio() {
  if (audioReady) {
    return;
  }

  await setAudioModeAsync({
    playsInSilentMode: false,
    allowsRecording: false,
    shouldPlayInBackground: false,
    interruptionMode: 'mixWithOthers',
    interruptionModeAndroid: 'duckOthers',
    shouldRouteThroughEarpiece: false,
  });

  audioReady = true;
}

async function loadTone(toneType: ToneType, noteIndex: number, note: NoteSpec): Promise<AudioPlayer> {
  const key = `${toneType}_${noteIndex}`;
  if (cache[key]) {
    return cache[key] as AudioPlayer;
  }

  await ensureAudio();

  const cacheDirectory = FileSystem.cacheDirectory;
  if (!cacheDirectory) {
    throw new Error('Cache directory unavailable');
  }

  const path = `${cacheDirectory}cognizen_tone_${key}.wav`;
  const base64 = bufToBase64(buildWav(note));

  await FileSystem.writeAsStringAsync(path, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const player = createAudioPlayer({ uri: path });
  player.volume = 0.34;
  cache[key] = player;
  return player;
}

export async function playTone(type: ToneType = 'tap'): Promise<void> {
  try {
    const notes = TONES[type] as readonly NoteSpec[];

    for (let i = 0; i < notes.length; i += 1) {
      const note = notes[i];
      const player = await loadTone(type, i, note);
      await player.seekTo(0);
      player.play();

      if (i < notes.length - 1) {
        await wait(note.gapMs ?? Math.max(34, Math.round(note.dur * 700)));
      }
    }
  } catch {
    // Non-critical. Tone playback should never block the UI.
  }
}

export function preloadTones(): void {
  (Object.keys(TONES) as ToneType[]).forEach((toneType) => {
    TONES[toneType].forEach((note, noteIndex) => {
      loadTone(toneType, noteIndex, note).catch(() => {});
    });
  });
}

