// Bundled WordNet-based dictionary, sharded by first letter and loaded on demand.
const shards = {};

async function shard(letter) {
  if (!/^[a-z]$/.test(letter)) return { w: {}, f: {} };
  if (!shards[letter]) shards[letter] = fetch(`data/dict/${letter}.json`).then((r) => (r.ok ? r.json() : { w: {}, f: {} })).catch(() => ({ w: {}, f: {} }));
  return shards[letter];
}

export function candidates(w) {
  const c = [];
  const add = (x) => x && x.length > 1 && !c.includes(x) && c.push(x);
  if (w.endsWith("ies")) add(w.slice(0, -3) + "y");
  if (w.endsWith("ied")) add(w.slice(0, -3) + "y");
  if (w.endsWith("es")) add(w.slice(0, -2));
  if (w.endsWith("s")) add(w.slice(0, -1));
  if (w.endsWith("ed")) { add(w.slice(0, -2)); add(w.slice(0, -1)); }
  if (w.endsWith("ing")) { add(w.slice(0, -3)); add(w.slice(0, -3) + "e"); }
  if (/(.)\1(ed|ing)$/.test(w)) add(w.replace(/(.)\1(ed|ing)$/, "$1"));
  if (w.endsWith("ly")) { add(w.slice(0, -2)); if (w.endsWith("ily")) add(w.slice(0, -3) + "y"); }
  if (w.endsWith("er")) { add(w.slice(0, -2)); add(w.slice(0, -1)); }
  if (w.endsWith("est")) { add(w.slice(0, -3)); add(w.slice(0, -2)); }
  return c;
}

// Returns {w: lemma, z, s: senses} or null
export async function lookup(word) {
  word = word.toLowerCase().replace(/[’']s$/, "").replace(/[^a-z'-]/g, "");
  if (!word) return null;
  const d = await shard(word[0]);
  const lemma = d.f[word];
  if (lemma) {
    const d2 = await shard(lemma[0]);
    if (d2.w[lemma]) return { w: lemma, ...d2.w[lemma] };
  }
  if (d.w[word]) return { w: word, ...d.w[word] };
  for (const c of candidates(word)) {
    const d2 = await shard(c[0]);
    if (d2.w[c]) return { w: c, ...d2.w[c] };
  }
  return null;
}
