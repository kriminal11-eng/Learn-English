// Local persistence (localStorage) + spaced repetition scheduling.
const KEY = "learn-english.v1";
const DAY = 86400000;

const DEFAULT = {
  settings: { dailyCount: 5, highlights: 10, rate: 0.95, voice: "", categories: ["world", "tech", "history", "science", "featured"], showGrammar: true, theme: "auto" },
  words: {},   // lemma -> word record
  known: {},   // lemma -> timestamp (words you already know; never highlighted)
  read: {},    // articleId -> timestamp
  log: {},     // "YYYY-MM-DD" -> {read, reviewed, quiz, correct}
  quiz: { total: 0, correct: 0 },
};

let state;
try {
  state = JSON.parse(localStorage.getItem(KEY)) || {};
} catch { state = {}; }
state = { ...structuredClone(DEFAULT), ...state, settings: { ...DEFAULT.settings, ...(state.settings || {}) } };

export const db = state;
export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { console.warn("save failed", e); }
}
export const today = () => new Date().toLocaleDateString("sv-SE"); // YYYY-MM-DD in local time
export function bump(field, n = 1) {
  const d = (state.log[today()] ||= { read: 0, reviewed: 0, quiz: 0, correct: 0, added: 0 });
  d[field] = (d[field] || 0) + n;
  save();
}

export function streak() {
  let n = 0;
  const d = new Date();
  const active = (k) => { const l = state.log[k]; return l && (l.read || l.reviewed || l.quiz); };
  if (!active(d.toLocaleDateString("sv-SE"))) d.setDate(d.getDate() - 1);
  while (active(d.toLocaleDateString("sv-SE"))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

// ---- words ---------------------------------------------------------------
export function addWord(lemma, senses, ctx) {
  const now = Date.now();
  let w = state.words[lemma];
  if (!w) {
    w = state.words[lemma] = { w: lemma, senses: senses || [], ctx: [], added: now, lastSeen: now, seen: 1,
      srs: { ease: 2.5, interval: 0, reps: 0, lapses: 0, due: now } };
    delete state.known[lemma];
    bump("added");
  }
  if (senses?.length && !w.senses?.length) w.senses = senses;
  if (ctx) addContext(w, ctx);
  save();
  return w;
}

export function addContext(w, ctx) {
  if (!ctx?.sentence) return;
  if (w.ctx.some((c) => c.sentence === ctx.sentence)) return;
  w.ctx.unshift(ctx);
  w.ctx = w.ctx.slice(0, 6);
}

export function removeWord(lemma) { delete state.words[lemma]; save(); }
export function markKnown(lemma) { delete state.words[lemma]; state.known[lemma] = Date.now(); save(); }
export function unmarkKnown(lemma) { delete state.known[lemma]; save(); }

export function exposure(lemma, ctx) {
  const w = state.words[lemma];
  if (!w) return;
  w.lastSeen = Date.now();
  w.seen = (w.seen || 0) + 1;
  addContext(w, ctx);
  save();
}

// status for highlighting inside articles
export function wordStatus(lemma) {
  if (state.known[lemma]) return "known";
  const w = state.words[lemma];
  if (!w) return "new";
  const now = Date.now();
  const sinceSeen = now - (w.lastSeen || w.added);
  const mastered = w.srs.interval >= 21;
  // due for review, or not met in a long time → show it again
  if (w.srs.due <= now || sinceSeen > (mastered ? 30 : 10) * DAY) return "review";
  return "learning";
}

export function mastery(w) {
  const i = w.srs.interval;
  if (i >= 21) return { label: "Mastered", level: 4 };
  if (i >= 7) return { label: "Strong", level: 3 };
  if (i >= 2) return { label: "Growing", level: 2 };
  if (w.srs.reps > 0) return { label: "Learning", level: 1 };
  return { label: "New", level: 0 };
}

export const dueWords = () => Object.values(state.words).filter((w) => w.srs.due <= Date.now()).sort((a, b) => a.srs.due - b.srs.due);

// grade: 0 = again, 1 = hard, 2 = good, 3 = easy  (simplified SM-2)
export function review(lemma, grade) {
  const w = state.words[lemma];
  if (!w) return;
  const s = w.srs;
  const now = Date.now();
  if (grade === 0) {
    s.reps = 0; s.lapses++; s.interval = 0;
    s.ease = Math.max(1.3, s.ease - 0.2);
    s.due = now + 10 * 60000;
  } else {
    if (s.reps === 0) s.interval = [0, 1, 1, 3][grade];
    else if (s.reps === 1) s.interval = [0, 2, 3, 6][grade];
    else s.interval = Math.round(s.interval * s.ease * [0, 0.7, 1, 1.35][grade]) || 1;
    s.ease = Math.max(1.3, s.ease + [0, -0.15, 0, 0.15][grade]);
    s.reps++;
    s.due = now + s.interval * DAY;
  }
  w.lastSeen = now;
  save();
}

export function nextDueLabel(w) {
  const d = w.srs.due - Date.now();
  if (d <= 0) return "due now";
  if (d < 3600000) return `in ${Math.ceil(d / 60000)} min`;
  if (d < DAY) return `in ${Math.ceil(d / 3600000)} h`;
  return `in ${Math.round(d / DAY)} d`;
}

export function exportData() { return JSON.stringify(state, null, 1); }
export function importData(json) {
  const data = JSON.parse(json);
  if (!data || typeof data !== "object" || !data.words) throw new Error("Not a backup file");
  Object.keys(state).forEach((k) => delete state[k]);
  Object.assign(state, structuredClone(DEFAULT), data, { settings: { ...DEFAULT.settings, ...(data.settings || {}) } });
  save();
}
