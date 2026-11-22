// Linking words (connectors) and grammar lessons. Everything in English.

export const CATEGORIES = {
  addition:   { name: "Addition", color: "#2f855a", desc: "Add another idea that supports or continues the previous one." },
  contrast:   { name: "Contrast", color: "#c05621", desc: "Show that two ideas are different or opposite." },
  concession: { name: "Concession", color: "#b7791f", desc: "Admit a fact, then say something that is surprising in light of it." },
  cause:      { name: "Cause / Reason", color: "#2b6cb0", desc: "Explain why something happens." },
  result:     { name: "Result / Consequence", color: "#6b46c1", desc: "Show what happens because of something." },
  purpose:    { name: "Purpose", color: "#00838f", desc: "Explain the aim or intention behind an action." },
  example:    { name: "Example", color: "#2c7a7b", desc: "Introduce examples or specific cases." },
  condition:  { name: "Condition", color: "#9b2c2c", desc: "Say that one thing depends on another." },
  time:       { name: "Time / Sequence", color: "#4a5568", desc: "Order events in time or show when something happens." },
  emphasis:   { name: "Emphasis", color: "#b83280", desc: "Make a point stronger or highlight something important." },
  comparison: { name: "Comparison", color: "#276749", desc: "Show that two things are similar." },
  summary:    { name: "Summary / Conclusion", color: "#553c9a", desc: "Sum up or conclude an argument." },
};

// Groups of categories that can be confused with each other in a quiz.
const GROUPS = [["contrast", "concession"], ["addition", "emphasis", "comparison"], ["result", "summary"], ["cause"], ["purpose"], ["example"], ["condition"], ["time"]];
export const groupOf = (cat) => GROUPS.findIndex((g) => g.includes(cat));

// type: "adverb" = sentence connector (usually starts a sentence, followed by a comma)
//       "conj" = joins two clauses inside one sentence (subordinating/coordinating)
//       "prep" = followed by a noun / noun phrase / -ing form
export const CONNECTORS = [
  // addition
  { p: "moreover", cat: "addition", type: "adverb", m: "in addition to what has been said (formal)", use: "Starts a new sentence: “Sentence. Moreover, …”", ex: "The plan is expensive. Moreover, it would take ten years to complete." },
  { p: "furthermore", cat: "addition", type: "adverb", m: "also; adding a further point (formal)", use: "“Sentence. Furthermore, …”", ex: "The drug is cheap. Furthermore, it has very few side effects." },
  { p: "in addition", cat: "addition", type: "adverb", m: "also, as an extra point", use: "“Sentence. In addition, …” or “In addition to + noun/-ing”", ex: "In addition to the new airport, the government will build two bridges." },
  { p: "additionally", cat: "addition", type: "adverb", m: "as an extra fact", use: "“Sentence. Additionally, …”", ex: "Additionally, the company will hire 500 new workers." },
  { p: "besides", cat: "addition", type: "adverb", m: "also; used to add a stronger reason", use: "“Besides, …” (adverb) or “besides + noun/-ing” (preposition)", ex: "I don't want to go out. Besides, it's raining." },
  { p: "what's more", cat: "addition", type: "adverb", m: "and more importantly (informal)", use: "“Sentence. What's more, …”", ex: "The phone is cheap. What's more, the battery lasts two days." },
  { p: "as well as", cat: "addition", type: "prep", m: "and also; in addition to", use: "“X as well as Y” — followed by a noun or -ing", ex: "The storm damaged homes as well as schools." },
  { p: "also", cat: "addition", type: "adverb", m: "too; in addition", use: "Usually before the main verb: “They also announced…”", ex: "Scientists also found traces of water." },
  // contrast
  { p: "however", cat: "contrast", type: "adverb", m: "but; in spite of this", use: "Starts a new sentence or follows a semicolon: “…; however, …”. It cannot join two clauses with only a comma.", ex: "Sales rose in spring. However, they fell sharply in the summer." },
  { p: "nevertheless", cat: "contrast", type: "adverb", m: "in spite of that (formal)", use: "“Sentence. Nevertheless, …”", ex: "The task was difficult. Nevertheless, the team finished on time." },
  { p: "nonetheless", cat: "contrast", type: "adverb", m: "in spite of that (formal)", use: "“Sentence. Nonetheless, …”", ex: "The results were disappointing; nonetheless, the project continued." },
  { p: "on the other hand", cat: "contrast", type: "adverb", m: "used to give the opposite side of an argument", use: "Often paired with “On the one hand, …”", ex: "City life is exciting. On the other hand, it can be very expensive." },
  { p: "in contrast", cat: "contrast", type: "adverb", m: "showing a clear difference", use: "“In contrast, …” / “In contrast to + noun”", ex: "The north is dry. In contrast, the south gets heavy rain." },
  { p: "by contrast", cat: "contrast", type: "adverb", m: "showing a clear difference", use: "“By contrast, …”", ex: "Exports grew by 5%. By contrast, imports fell." },
  { p: "whereas", cat: "contrast", type: "conj", m: "while; compared with the fact that", use: "Joins two clauses in one sentence: “X, whereas Y.”", ex: "Some species migrate, whereas others stay all year." },
  { p: "instead", cat: "contrast", type: "adverb", m: "as an alternative; in place of", use: "“Instead, …” or “instead of + noun/-ing”", ex: "Instead of building new roads, the city invested in trains." },
  { p: "conversely", cat: "contrast", type: "adverb", m: "in the opposite way", use: "“Conversely, …”", ex: "Warm air rises. Conversely, cold air sinks." },
  { p: "on the contrary", cat: "contrast", type: "adverb", m: "used to say that the opposite is true", use: "Rejects the previous idea: “It isn't X. On the contrary, it is Y.”", ex: "The economy is not shrinking. On the contrary, it is growing fast." },
  { p: "yet", cat: "contrast", type: "conj", m: "but; even so", use: "“X, yet Y.” — similar to “but”, slightly more surprising", ex: "The task seemed simple, yet nobody could solve it." },
  { p: "unlike", cat: "contrast", type: "prep", m: "different from", use: "“Unlike + noun, …”", ex: "Unlike its rivals, the company kept its prices low." },
  // concession
  { p: "although", cat: "concession", type: "conj", m: "despite the fact that", use: "Followed by a full clause (subject + verb): “Although it rained, we went out.”", ex: "Although the economy grew, unemployment remained high." },
  { p: "even though", cat: "concession", type: "conj", m: "despite the fact that (stronger than although)", use: "Followed by a clause", ex: "Even though he was tired, he kept working." },
  { p: "though", cat: "concession", type: "conj", m: "although (less formal); also used at the end of a sentence", use: "“Though + clause, …” or “…, though.”", ex: "The film was long. I enjoyed it, though." },
  { p: "despite", cat: "concession", type: "prep", m: "without being affected by", use: "Followed by a noun or -ing — NOT a clause: “Despite the rain…”, “Despite being tired…”. Never “despite of”.", ex: "Despite the warnings, many people stayed in the city." },
  { p: "in spite of", cat: "concession", type: "prep", m: "without being affected by", use: "Followed by a noun or -ing: “In spite of the cost, …”", ex: "In spite of the cold, thousands joined the march." },
  { p: "even so", cat: "concession", type: "adverb", m: "however; despite what has just been said", use: "“Sentence. Even so, …”", ex: "The plan has risks. Even so, it is our best option." },
  { p: "admittedly", cat: "concession", type: "adverb", m: "used to accept that something is true", use: "Often followed later by “but”", ex: "Admittedly, the new system is expensive, but it saves time." },
  { p: "albeit", cat: "concession", type: "conj", m: "although (formal); used before an adjective/adverb/phrase", use: "“X, albeit + adjective/phrase”", ex: "The economy is recovering, albeit slowly." },
  { p: "regardless of", cat: "concession", type: "prep", m: "without being affected by", use: "Followed by a noun: “regardless of the cost”", ex: "Everyone can apply, regardless of age." },
  // cause
  { p: "because of", cat: "cause", type: "prep", m: "as a result of", use: "Followed by a noun: “because of the storm” (compare: “because + clause”)", ex: "The flight was cancelled because of bad weather." },
  { p: "because", cat: "cause", type: "conj", m: "for the reason that", use: "Followed by a clause: “because it was raining”", ex: "The bridge closed because it was damaged." },
  { p: "due to", cat: "cause", type: "prep", m: "caused by; because of", use: "Followed by a noun: “due to heavy rain”", ex: "The delay was due to a technical problem." },
  { p: "owing to", cat: "cause", type: "prep", m: "because of (formal)", use: "Followed by a noun", ex: "Owing to the strike, all trains were cancelled." },
  { p: "thanks to", cat: "cause", type: "prep", m: "because of (usually a positive cause)", use: "Followed by a noun", ex: "Thanks to the new vaccine, cases have fallen." },
  { p: "as a result of", cat: "cause", type: "prep", m: "because of", use: "Followed by a noun: “as a result of the war”", ex: "Prices rose as a result of the drought." },
  // result
  { p: "therefore", cat: "result", type: "adverb", m: "for that reason", use: "“Sentence. Therefore, …” or “…, and therefore …”", ex: "The road was icy. Therefore, the race was postponed." },
  { p: "consequently", cat: "result", type: "adverb", m: "as a result", use: "“Sentence. Consequently, …”", ex: "The factory closed. Consequently, hundreds lost their jobs." },
  { p: "as a result", cat: "result", type: "adverb", m: "because of this", use: "“Sentence. As a result, …” (without “of”)", ex: "It didn't rain for months. As a result, crops failed." },
  { p: "as a consequence", cat: "result", type: "adverb", m: "because of this (formal)", use: "“As a consequence, …”", ex: "As a consequence, the law was changed." },
  { p: "thus", cat: "result", type: "adverb", m: "as a result; in this way (formal)", use: "“…, thus + -ing” or “Thus, …”", ex: "The new engine uses less fuel, thus reducing costs." },
  { p: "hence", cat: "result", type: "adverb", m: "for this reason (formal)", use: "Often followed by a noun: “…, hence the name.”", ex: "The island is shaped like a horse, hence its name." },
  { p: "accordingly", cat: "result", type: "adverb", m: "as a result; in a suitable way", use: "“Accordingly, …”", ex: "The rules changed, and we acted accordingly." },
  // purpose
  { p: "in order to", cat: "purpose", type: "prep", m: "with the aim of", use: "Followed by the base verb: “in order to save money”", ex: "The bank cut rates in order to boost growth." },
  { p: "so as to", cat: "purpose", type: "prep", m: "with the aim of", use: "Followed by the base verb; negative: “so as not to”", ex: "She left early so as not to miss the train." },
  { p: "so that", cat: "purpose", type: "conj", m: "in order that", use: "Followed by a clause, often with can/could/will/would", ex: "They built a wall so that the town would be safe from floods." },
  // example
  { p: "for example", cat: "example", type: "adverb", m: "used to give an example", use: "“For example, …” or “…, for example, …”", ex: "Many birds, for example swallows, fly south in winter." },
  { p: "for instance", cat: "example", type: "adverb", m: "for example", use: "Same as “for example”", ex: "Some countries, for instance Norway, rely on hydropower." },
  { p: "such as", cat: "example", type: "prep", m: "like; for example", use: "Followed by nouns: “fruit such as apples and pears”", ex: "Metals such as copper and gold conduct electricity." },
  { p: "including", cat: "example", type: "prep", m: "used to list some items of a group", use: "“…, including X and Y”", ex: "Ten people, including two children, were rescued." },
  { p: "namely", cat: "example", type: "adverb", m: "that is to say; specifically", use: "Introduces exact details", ex: "Two countries, namely France and Spain, voted against it." },
  { p: "in particular", cat: "example", type: "adverb", m: "especially", use: "Highlights one example", ex: "Young people in particular use the app every day." },
  // condition
  { p: "unless", cat: "condition", type: "conj", m: "except if; if … not", use: "“Unless + positive clause” = “if … not”", ex: "The project will fail unless it gets more funding." },
  { p: "provided that", cat: "condition", type: "conj", m: "only if", use: "Followed by a clause", ex: "You can borrow the car provided that you return it today." },
  { p: "as long as", cat: "condition", type: "conj", m: "only if; on condition that", use: "Followed by a clause", ex: "The plan will work as long as everyone cooperates." },
  { p: "in case", cat: "condition", type: "conj", m: "as a precaution, because something might happen", use: "“Take an umbrella in case it rains.” (not the same as “if”)", ex: "Keep some water in case the power goes off." },
  { p: "otherwise", cat: "condition", type: "adverb", m: "if not; or else", use: "“Do X; otherwise, Y will happen.”", ex: "We must act now; otherwise, it will be too late." },
  { p: "whether", cat: "condition", type: "conj", m: "used for two alternatives", use: "“whether … or (not)”", ex: "It is unclear whether the law will pass." },
  // time
  { p: "meanwhile", cat: "time", type: "adverb", m: "at the same time; while this happens", use: "“Meanwhile, …”", ex: "The police searched the area. Meanwhile, the suspect left the country." },
  { p: "subsequently", cat: "time", type: "adverb", m: "afterwards; later (formal)", use: "“…, and was subsequently …”", ex: "He was arrested and subsequently released." },
  { p: "eventually", cat: "time", type: "adverb", m: "in the end, after a long time", use: "A false friend in many languages: it does NOT mean “possibly”. It means “in the end”.", ex: "After years of talks, they eventually signed the deal." },
  { p: "previously", cat: "time", type: "adverb", m: "before; earlier", use: "“…, previously …”", ex: "The museum was previously a train station." },
  { p: "initially", cat: "time", type: "adverb", m: "at the beginning", use: "Often contrasted with later events", ex: "Initially, the plan was popular." },
  { p: "afterwards", cat: "time", type: "adverb", m: "later; after that", use: "“Afterwards, …”", ex: "We had dinner and afterwards went for a walk." },
  { p: "until", cat: "time", type: "conj", m: "up to the time when", use: "“until + clause/noun/time”", ex: "The museum will stay closed until next year." },
  { p: "by the time", cat: "time", type: "conj", m: "when; not later than", use: "Often with past perfect: “By the time we arrived, the film had started.”", ex: "By the time help arrived, the fire had spread." },
  { p: "at the same time", cat: "time", type: "adverb", m: "simultaneously; also used for contrast", use: "“At the same time, …”", ex: "The city is growing. At the same time, it is becoming more expensive." },
  { p: "finally", cat: "time", type: "adverb", m: "after a long time; or the last point in a list", use: "“Finally, …”", ex: "Finally, the rain stopped." },
  // emphasis
  { p: "indeed", cat: "emphasis", type: "adverb", m: "really; used to confirm and strengthen a point", use: "“Indeed, …”", ex: "The task was hard. Indeed, few people completed it." },
  { p: "in fact", cat: "emphasis", type: "adverb", m: "actually; used to add a stronger or surprising detail", use: "“In fact, …”", ex: "It wasn't cheap. In fact, it was the most expensive option." },
  { p: "notably", cat: "emphasis", type: "adverb", m: "especially; in a way that is worth noticing", use: "“…, notably X”", ex: "Several countries, notably Japan, invested heavily." },
  { p: "particularly", cat: "emphasis", type: "adverb", m: "especially", use: "Before the thing being emphasised", ex: "Prices rose, particularly in big cities." },
  { p: "especially", cat: "emphasis", type: "adverb", m: "more than usual; particularly", use: "“…, especially X”", ex: "Car sales fell, especially in Europe." },
  { p: "above all", cat: "emphasis", type: "adverb", m: "most importantly", use: "“Above all, …”", ex: "Above all, the plan must be safe." },
  { p: "undoubtedly", cat: "emphasis", type: "adverb", m: "certainly; without any doubt", use: "“Undoubtedly, …”", ex: "It was undoubtedly the worst storm in decades." },
  // comparison
  { p: "similarly", cat: "comparison", type: "adverb", m: "in a similar way", use: "“Similarly, …”", ex: "Germany cut taxes. Similarly, France reduced fuel prices." },
  { p: "likewise", cat: "comparison", type: "adverb", m: "in the same way", use: "“Likewise, …”", ex: "Parents must follow the rules; likewise, teachers must set an example." },
  { p: "in the same way", cat: "comparison", type: "adverb", m: "similarly", use: "“In the same way, …”", ex: "In the same way, plants need light to grow." },
  { p: "compared with", cat: "comparison", type: "prep", m: "when measured against", use: "Followed by a noun", ex: "Compared with last year, sales are up 10%." },
  { p: "compared to", cat: "comparison", type: "prep", m: "when measured against", use: "Followed by a noun", ex: "Compared to cars, bicycles are much cheaper." },
  // summary
  { p: "in conclusion", cat: "summary", type: "adverb", m: "to finish; finally (formal writing)", use: "Starts the final paragraph", ex: "In conclusion, the evidence supports the theory." },
  { p: "overall", cat: "summary", type: "adverb", m: "considering everything", use: "“Overall, …”", ex: "Overall, the year was a success." },
  { p: "in short", cat: "summary", type: "adverb", m: "in a few words", use: "“In short, …”", ex: "In short, the project failed." },
  { p: "ultimately", cat: "summary", type: "adverb", m: "finally; in the end; at the most basic level", use: "“Ultimately, …”", ex: "Ultimately, the decision belongs to the voters." },
  { p: "to sum up", cat: "summary", type: "adverb", m: "to summarise", use: "“To sum up, …”", ex: "To sum up, the plan has more benefits than risks." },
  { p: "all in all", cat: "summary", type: "adverb", m: "considering everything", use: "“All in all, …”", ex: "All in all, it was a good decision." },
];

// Build one regex that finds connectors (longest phrases first).
const sorted = [...CONNECTORS].sort((a, b) => b.p.length - a.p.length);
const CONN_RE = new RegExp("\\b(" + sorted.map((c) => c.p.replace(/'/g, "['’]").replace(/ /g, "\\s+")).join("|") + ")\\b", "gi");
const byPhrase = Object.fromEntries(CONNECTORS.map((c) => [c.p, c]));

export function findConnectors(sentence) {
  const out = [];
  CONN_RE.lastIndex = 0;
  let m;
  while ((m = CONN_RE.exec(sentence))) {
    const key = m[0].toLowerCase().replace(/\s+/g, " ").replace("’", "'");
    const c = byPhrase[key];
    if (!c) continue;
    // "also", "until", "yet", "including", "though", "finally": only count clear uses to avoid noise
    if (key === "yet" && !/,\s*yet\b/i.test(sentence.slice(Math.max(0, m.index - 2), m.index + 4))) continue;
    out.push({ start: m.index, end: m.index + m[0].length, c });
  }
  return out;
}

export const LESSONS = [
  {
    id: "although-despite-however",
    title: "Although vs. Despite vs. However",
    level: "B1–B2",
    html: `
<p>All three show <b>contrast</b>, but they follow different grammar patterns. This is one of the most common mistakes for learners.</p>
<table class="g-table">
<tr><th>Word</th><th>Followed by</th><th>Example</th></tr>
<tr><td><b>although / even though</b></td><td>a full clause (subject + verb)</td><td><i>Although <u>it was raining</u>, the match continued.</i></td></tr>
<tr><td><b>despite / in spite of</b></td><td>a noun, pronoun or -ing form</td><td><i>Despite <u>the rain</u>, the match continued.</i><br><i>Despite <u>being tired</u>, she kept running.</i></td></tr>
<tr><td><b>however</b></td><td>starts a new sentence (+ comma)</td><td><i>It was raining. <u>However,</u> the match continued.</i></td></tr>
</table>
<h4>Common mistakes</h4>
<ul>
<li>✗ <s>Despite of the rain…</s> → ✓ <b>Despite</b> the rain… / <b>In spite of</b> the rain…</li>
<li>✗ <s>Despite it was raining…</s> → ✓ <b>Despite the fact that</b> it was raining… / <b>Although</b> it was raining…</li>
<li>✗ <s>It was raining, however the match continued.</s> → ✓ It was raining; <b>however,</b> the match continued.</li>
</ul>
<h4>Trick</h4>
<p>If the next part has its own verb, use <b>although</b>. If it is just a "thing", use <b>despite</b>.</p>`,
  },
  {
    id: "because-due-to",
    title: "Because vs. Because of vs. Due to",
    level: "B1",
    html: `
<p>All of these explain a <b>reason</b>.</p>
<ul>
<li><b>because</b> + clause: <i>The flight was delayed <u>because the weather was bad</u>.</i></li>
<li><b>because of</b> + noun: <i>The flight was delayed <u>because of the bad weather</u>.</i></li>
<li><b>due to</b> + noun: <i>The delay was <u>due to the bad weather</u>.</i> (often after the verb <i>be</i>)</li>
<li><b>owing to</b> / <b>as a result of</b> + noun (formal): <i>Owing to the strike, the factory closed.</i></li>
<li><b>since / as</b> + clause (the reason is already known): <i>As it was late, we went home.</i></li>
</ul>
<h4>Showing the result instead</h4>
<p>Reason → result: <i>The weather was bad. <b>Therefore / Consequently / As a result,</b> the flight was delayed.</i></p>
<p>Note: <b>as a result</b> (no "of") starts a sentence; <b>as a result of</b> needs a noun.</p>`,
  },
  {
    id: "sentence-connectors-punctuation",
    title: "Punctuation with linking words",
    level: "B2",
    html: `
<p>Linking words belong to three grammar types. The type decides the punctuation.</p>
<h4>1. Conjunctions — join two clauses in ONE sentence</h4>
<p><b>and, but, so, yet, or</b> (usually with a comma before): <i>Prices rose, <b>but</b> wages stayed the same.</i></p>
<p><b>although, because, while, whereas, unless, if, when</b>: <i><b>Although</b> prices rose, wages stayed the same.</i> / <i>Wages stayed the same <b>although</b> prices rose.</i> (Comma when the clause comes first.)</p>
<h4>2. Sentence adverbs — connect TWO sentences</h4>
<p><b>however, therefore, moreover, consequently, nevertheless, in addition, for example</b>: use a full stop or semicolon before and a comma after.</p>
<p><i>Prices rose. <b>However,</b> wages stayed the same.</i><br><i>Prices rose; <b>however,</b> wages stayed the same.</i></p>
<p>✗ <s>Prices rose, however wages stayed the same.</s> (This is a "comma splice".)</p>
<h4>3. Prepositions — followed by a noun or -ing</h4>
<p><b>despite, in spite of, because of, due to, instead of, in addition to, as well as</b>: <i><b>Despite</b> rising prices, people kept shopping.</i></p>`,
  },
  {
    id: "passive-news",
    title: "The passive voice in news",
    level: "B1–B2",
    html: `
<p>News articles use the <b>passive</b> very often, because the action or the victim is more important than who did it, or the doer is unknown.</p>
<p>Form: <b>be + past participle</b></p>
<ul>
<li>Present: <i>The bridge <b>is used</b> by 50,000 cars a day.</i></li>
<li>Past: <i>Three people <b>were injured</b> in the explosion.</i></li>
<li>Present perfect: <i>A new species <b>has been discovered</b>.</i></li>
<li>Future: <i>The results <b>will be announced</b> tomorrow.</i></li>
<li>Modal: <i>The law <b>could be changed</b> next year.</i></li>
</ul>
<h4>Reporting with the passive</h4>
<p>Journalists use these to report information without naming the source:</p>
<ul>
<li><i>It <b>is believed</b> that the fire started in the kitchen.</i></li>
<li><i>The painting <b>is said to be</b> worth $10 million.</i></li>
<li><i>The suspect <b>is thought to have left</b> the country.</i></li>
</ul>
<p>Add the doer with <b>by</b> only when it is important: <i>The novel was written <b>by</b> a 19-year-old student.</i></p>`,
  },
  {
    id: "reported-speech",
    title: "Reporting verbs (say, claim, argue…)",
    level: "B2",
    html: `
<p>Articles constantly report what people said. Choosing the right verb shows the writer's attitude.</p>
<table class="g-table">
<tr><th>Verb</th><th>Meaning</th><th>Pattern</th></tr>
<tr><td>say / state</td><td>neutral</td><td>say (that) …</td></tr>
<tr><td>claim</td><td>say something is true, without proof</td><td>claim (that) … / claim to + verb</td></tr>
<tr><td>argue / contend</td><td>give reasons for an opinion</td><td>argue that …</td></tr>
<tr><td>insist</td><td>say firmly, even if others disagree</td><td>insist that … / insist on + -ing</td></tr>
<tr><td>admit / acknowledge</td><td>agree that something (bad) is true</td><td>admit (that) … / admit + -ing</td></tr>
<tr><td>deny</td><td>say something is not true</td><td>deny + -ing / deny that …</td></tr>
<tr><td>warn</td><td>tell about a danger</td><td>warn (sb) that … / warn sb not to …</td></tr>
<tr><td>urge</td><td>strongly advise</td><td>urge sb to + verb</td></tr>
<tr><td>suggest</td><td>propose an idea</td><td>suggest + -ing / suggest that sb (should) …</td></tr>
<tr><td>reveal / disclose</td><td>make secret information known</td><td>reveal that …</td></tr>
</table>
<h4>Backshift</h4>
<p>Direct: <i>"We <b>are</b> ready," the minister said.</i> → Reported: <i>The minister said they <b>were</b> ready.</i></p>
<p>In news, the tense often stays the same if the fact is still true: <i>She said the company <b>is</b> growing.</i></p>`,
  },
  {
    id: "relative-clauses",
    title: "Relative clauses: who, which, that, whose",
    level: "B1–B2",
    html: `
<p>Relative clauses give more information about a noun.</p>
<ul>
<li><b>who</b> — people: <i>The scientist <b>who</b> made the discovery won a prize.</i></li>
<li><b>which</b> — things/animals: <i>The bridge, <b>which</b> opened in 1932, is being repaired.</i></li>
<li><b>that</b> — people or things (only in defining clauses, no commas): <i>The vaccine <b>that</b> they developed works well.</i></li>
<li><b>whose</b> — possession: <i>The writer <b>whose</b> book became a film lives in Paris.</i></li>
<li><b>where / when</b> — place / time: <i>the city <b>where</b> she was born</i>, <i>the year <b>when</b> the war ended</i></li>
</ul>
<h4>Defining vs. non-defining</h4>
<p><b>Defining</b> (no commas) tells us <i>which one</i>: <i>The students <b>who passed</b> the exam got a certificate.</i> (only some students)</p>
<p><b>Non-defining</b> (with commas) adds extra information: <i>The students, <b>who passed</b> the exam, got a certificate.</i> (all of them)</p>
<p>You cannot use <b>that</b> in non-defining clauses: ✗ <s>Istanbul, that is a huge city, …</s> → ✓ Istanbul, <b>which</b> is a huge city, …</p>`,
  },
  {
    id: "present-perfect-news",
    title: "Present perfect vs. past simple in news",
    level: "B1–B2",
    html: `
<p>News stories often <b>start</b> with the present perfect (new information, time not given) and then <b>continue</b> with the past simple (details, specific time).</p>
<p><i>A powerful earthquake <b>has struck</b> southern Japan. The quake <b>hit</b> at 3:15 a.m. local time and <b>lasted</b> about 40 seconds.</i></p>
<ul>
<li><b>Present perfect</b> (have/has + past participle): news, result now, no finished time: <i>Scientists <b>have found</b> water on the planet.</i></li>
<li><b>Past simple</b>: finished time (yesterday, in 2019, last week, at 3 p.m.): <i>They <b>found</b> it last year.</i></li>
</ul>
<p>Signal words — present perfect: <i>just, already, yet, so far, recently, since, for</i>. Past simple: <i>ago, yesterday, in + year, last…</i></p>`,
  },
  {
    id: "articles-the",
    title: "Articles: a / an / the / no article",
    level: "B1",
    html: `
<ul>
<li><b>a / an</b> — one of many, first mention: <i>A company announced a new phone.</i></li>
<li><b>the</b> — specific, already known, or unique: <i><b>The</b> company said <b>the</b> phone will cost $500.</i> <i><b>the</b> sun, <b>the</b> government, <b>the</b> internet</i></li>
<li><b>no article</b> — general plural or uncountable: <i><b>Climate change</b> affects <b>farmers</b> everywhere.</i></li>
</ul>
<h4>Names and places</h4>
<ul>
<li>No article: most countries, cities, continents (<i>Turkey, Paris, Asia</i>)</li>
<li><b>the</b>: plural or "union" names (<i>the United States, the Netherlands, the UK, the European Union</i>), rivers, seas, oceans (<i>the Nile, the Black Sea</i>), groups of islands and mountain ranges (<i>the Alps</i>)</li>
<li>Historical periods/events often take <b>the</b>: <i>the Renaissance, the Cold War, the Industrial Revolution</i> — but <i>World War II</i>.</li>
</ul>`,
  },
];
