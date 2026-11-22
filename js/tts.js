// Text-to-speech with the browser's built-in Web Speech API (free, works offline on most phones).
import { db } from "./store.js";

const synth = window.speechSynthesis;
export const supported = !!synth;
let voices = [];
function loadVoices() { voices = synth ? synth.getVoices().filter((v) => /^en[-_]/i.test(v.lang)) : []; }
if (synth) { loadVoices(); synth.onvoiceschanged = loadVoices; }
export const englishVoices = () => { loadVoices(); return voices; };

function pickVoice() {
  loadVoices();
  return voices.find((v) => v.voiceURI === db.settings.voice) ||
    voices.find((v) => /en-US/i.test(v.lang) && /google|natural|premium|enhanced/i.test(v.name)) ||
    voices.find((v) => /en-GB/i.test(v.lang) && /google|natural/i.test(v.name)) ||
    voices.find((v) => /en-US/i.test(v.lang)) || voices[0];
}

function utter(text, rate) {
  const u = new SpeechSynthesisUtterance(text);
  const v = pickVoice();
  if (v) { u.voice = v; u.lang = v.lang; } else u.lang = "en-US";
  u.rate = rate ?? db.settings.rate;
  return u;
}

export function speakWord(text) {
  if (!synth) return;
  player.stop();
  synth.cancel();
  synth.speak(utter(text, Math.min(db.settings.rate, 0.9)));
}

// Reads a list of sentences one by one (long utterances get cut off on Android).
export const player = {
  sentences: [], index: 0, playing: false, onchange: null, _token: 0,
  load(sentences) { this.stop(); this.sentences = sentences; this.index = 0; },
  play(from) {
    if (!synth || !this.sentences.length) return;
    if (from != null) this.index = from;
    if (this.index >= this.sentences.length) this.index = 0;
    synth.cancel();
    this.playing = true;
    const token = ++this._token;
    const next = () => {
      if (token !== this._token || !this.playing) return;
      if (this.index >= this.sentences.length) { this.playing = false; this.index = 0; this._emit(); return; }
      this._emit();
      const u = utter(this.sentences[this.index]);
      u.onend = () => { if (token !== this._token) return; this.index++; next(); };
      u.onerror = (e) => { if (token !== this._token) return; if (e.error === "interrupted" || e.error === "canceled") return; this.index++; next(); };
      synth.speak(u);
    };
    next();
  },
  pause() { this.playing = false; this._token++; synth?.cancel(); this._emit(); },
  stop() { this.playing = false; this._token++; synth?.cancel(); this.index = 0; this._emit(); },
  skip(d) { const i = Math.max(0, Math.min(this.sentences.length - 1, this.index + d)); if (this.playing) this.play(i); else { this.index = i; this._emit(); } },
  _emit() { this.onchange?.(this); },
};
