"""Build the compact learner dictionary from WordNet 3.1.

Usage: python scripts/build_dict.py /path/to/wordnet/dict
(The WordNet files come from the `wordnet-db` npm package:  npm pack wordnet-db)

Output: data/dict/<letter>.json  — one shard per first letter, lazy-loaded by the app
        {"w": {word: entry}, "f": {inflected_form: lemma}}
entry = {"z": zipf_frequency, "s": [[pos, definition, example, [synonyms]], ...]}
"""
import json, os, re, sys
from collections import defaultdict
import simplemma
from wordfreq import zipf_frequency, top_n_list

WN = sys.argv[1] if len(sys.argv) > 1 else "wn/package/dict"
OUT = os.path.join(os.path.dirname(__file__), "..", "data", "dict")
POS_FILES = {"n": "noun", "v": "verb", "a": "adj", "r": "adv"}
POS_NAME = {"n": "noun", "v": "verb", "a": "adjective", "s": "adjective", "r": "adverb"}
WORD_RE = re.compile(r"^[a-z][a-z'-]*[a-z]$")
MAX_SENSES = 3
MAX_SYN = 6

synsets = {}  # (pos, offset) -> dict(words, gloss, similar)
for p, name in POS_FILES.items():
    with open(os.path.join(WN, "data." + name), encoding="utf-8", errors="replace") as fh:
        for line in fh:
            if line.startswith(" "):
                continue
            head, _, gloss = line.partition("|")
            parts = head.split()
            off, ss_type = parts[0], parts[2]
            nw = int(parts[3], 16)
            words = [re.sub(r"\(.*\)$", "", parts[4 + 2 * i]).lower() for i in range(nw)]
            i = 4 + 2 * nw
            np_ = int(parts[i]); i += 1
            similar = []
            for _ in range(np_):
                sym, poff, ppos = parts[i], parts[i + 1], parts[i + 2]
                if sym == "&":
                    similar.append(("a" if ppos == "s" else ppos, poff))
                i += 4
            gloss = gloss.strip()
            examples = re.findall(r'"([^"]+)"', gloss)
            definition = re.split(r';\s*"', gloss)[0].strip().rstrip(";").strip()
            synsets[(p, off)] = {"t": ss_type, "w": words, "d": definition,
                                 "e": examples[0] if examples else "", "sim": similar}

index = defaultdict(list)  # lemma -> [(pos, [offsets], tagcount)]
for p, name in POS_FILES.items():
    with open(os.path.join(WN, "index." + name), encoding="utf-8") as fh:
        for line in fh:
            if line.startswith(" "):
                continue
            parts = line.split()
            lemma = parts[0]
            n_syn, n_ptr = int(parts[2]), int(parts[3])
            tag = int(parts[5 + n_ptr])
            offs = parts[6 + n_ptr: 6 + n_ptr + n_syn]
            index[lemma].append((p, offs, tag))

entries = {}
for lemma, posl in index.items():
    if not WORD_RE.match(lemma):
        continue
    z = zipf_frequency(lemma, "en")
    if z < 2.0:
        continue
    posl.sort(key=lambda x: -x[2])
    senses = []
    # round-robin across parts of speech, most-used first
    queues = [[(p, o) for o in offs] for p, offs, _ in posl]
    while len(senses) < MAX_SENSES and any(queues):
        for q in queues:
            if q and len(senses) < MAX_SENSES:
                p, off = q.pop(0)
                ss = synsets[(p, off)]
                syn = [w for w in ss["w"] if w != lemma and "_" not in w]
                if len(syn) < 2:
                    for sp, so in ss["sim"]:
                        syn += [w for w in synsets.get((sp, so), {}).get("w", []) if w != lemma and "_" not in w]
                syn = list(dict.fromkeys(syn))[:MAX_SYN]
                senses.append([POS_NAME[ss["t"]], ss["d"], ss["e"], syn])
    entries[lemma] = {"z": round(z, 2), "s": senses}

forms = {}
for w in top_n_list("en", 80000):
    if not WORD_RE.match(w) or w in entries:
        continue
    lem = simplemma.lemmatize(w, lang="en").lower()
    if lem != w and lem in entries:
        forms[w] = lem

os.makedirs(OUT, exist_ok=True)
shards = defaultdict(lambda: {"w": {}, "f": {}})
for w, e in entries.items():
    shards[w[0]]["w"][w] = e
for f, l in forms.items():
    shards[f[0]]["f"][f] = l
total = 0
for letter, data in shards.items():
    path = os.path.join(OUT, letter + ".json")
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(data, fh, ensure_ascii=False, separators=(",", ":"))
    total += os.path.getsize(path)
print(f"{len(entries)} words, {len(forms)} forms, {total/1e6:.1f} MB in {len(shards)} shards")
