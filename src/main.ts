import './style.css';
import { ALL_FACTS, choices, freshProgress, hint, makeDeck, mastered, parseProgress, record, shuffle, type Fact, type Mode, type Progress } from './engine';
import { garden, icon, sprout } from './art';
import { audioMessage, createStudy, renderStudy } from './study';
import { TableReader } from './audio';

const root = document.querySelector<HTMLDivElement>('#app')!;
const STORAGE = 'jardin-additions-v1';
let persistent = true;
let progress: Progress;
try { progress = parseProgress(localStorage.getItem(STORAGE)); } catch { progress = freshProgress(); persistent = false; }
const modes: Record<Mode, { title: string; text: string; tag: string }> = {
  study: { title: 'J’apprends mes tables', text: 'Lis ou écoute les additions et leurs réponses, dans l’ordre. Puis cache les résultats pour mémoriser.', tag: 'Pour commencer, même si tu ne connais pas la table' },
  learn: { title: 'Je découvre', text: 'Des petits points pour comprendre et compter.', tag: 'Avec de l’aide' },
  practice: { title: 'Je m’entraîne', text: 'Trouve la somme, à ton rythme.', tag: 'Sans chronomètre' },
  missing: { title: 'Le nombre caché', text: 'Retrouve le nombre qui s’est caché.', tag: 'Petit détective' },
  challenge: { title: 'Le défi minute', text: 'Une minute pour faire fleurir tes additions.', tag: 'Quand tu te sens prête' },
};
let view: 'home' | 'study' | 'game' | 'result' | 'progress' = 'home';
let selected = [1, 2, 3];
let selectedMode: Mode = 'study';
let study = createStudy(1);
let automaticReading = false;
try {
  const settings = JSON.parse(localStorage.getItem('jardin-additions-settings') || 'null');
  if (Array.isArray(settings?.tables)) {
    const tables = [...new Set<number>(settings.tables.filter((n: unknown) => typeof n === 'number' && Number.isInteger(n) && n >= 1 && n <= 10))].sort((a, b) => a - b);
    if (tables.length) selected = tables;
  }
  if (Object.hasOwn(modes, settings?.mode)) selectedMode = settings.mode;
  if (Number.isInteger(settings?.studyTable) && settings.studyTable >= 1 && settings.studyTable <= 10) study = createStudy(settings.studyTable);
  automaticReading = settings?.automaticReading === true;
} catch { /* Optional preferences may be absent or damaged. */ }
const saveSettings = () => { try { localStorage.setItem('jardin-additions-settings', JSON.stringify({ tables: selected, mode: selectedMode, studyTable: study.table, automaticReading })); } catch { persistent = false; } };
const voice = document.createElement('audio');
voice.id = 'table-voice';
voice.hidden = true;
document.body.append(voice);
const reader = new TableReader(voice, status => {
  if (view !== 'study') return;
  const message = root.querySelector('#audio-status');
  if (message) message.textContent = audioMessage(study, status);
  const pause = root.querySelector<HTMLButtonElement>('[data-action="audio-stop"]');
  if (pause) pause.disabled = status === 'idle' || status === 'error';
});
function readStudy(): void {
  if (view !== 'study' || document.hidden || root.querySelector('dialog[open]') || (study.masked && !study.revealed.has(study.term))) return;
  reader.read(study.table, study.term, automaticReading && !study.masked && study.term < 10 ? () => {
    if (view !== 'study' || document.hidden || study.masked || !automaticReading || root.querySelector('dialog[open]')) { reader.stop(); return; }
    const focused = document.activeElement;
    const attribute = focused instanceof HTMLButtonElement ? ['data-action', 'data-study-table', 'data-study-phase', 'data-study-term', 'data-study-step'].find(name => focused.hasAttribute(name)) : undefined;
    const focusSelector = attribute ? `[${attribute}="${CSS.escape(focused!.getAttribute(attribute)!)}"]:not(:disabled)` : null;
    study.term++;
    render();
    if (focusSelector) root.querySelector<HTMLElement>(focusSelector)?.focus({ preventScroll: true });
    readStudy();
  } : undefined);
}
function refreshStudy(): void {
  reader.stop();
  render();
  if (automaticReading) readStudy();
}
let game: { mode: Exclude<Mode, 'study'>; review: Fact[] | null; deck: Fact[]; fact: Fact; options: number[]; hidden: 'a' | 'b'; rounds: number; correct: number; assisted: boolean; failed: boolean; solved: boolean; input: string; wrongOptions: number[]; errors: Fact[]; help: boolean; message: string; remaining: number; paused: boolean; last: number } | null = null;
type InstallEvent = Event & { prompt(): Promise<void>; userChoice: Promise<{ outcome: string }> };
let installEvent: InstallEvent | null = null;
let offlineReady = false;
const save = () => { try { localStorage.setItem(STORAGE, JSON.stringify(progress)); } catch { persistent = false; } };
const pill = () => `<span class="status"><span class="status-dot"></span>${offlineReady ? 'Prêt hors connexion' : 'Un petit pas à la fois'}</span>`;
const header = () => `<header class="header"><button class="brand" data-action="home" aria-label="Le Jardin des additions, accueil"><span class="brand-icon">${sprout}</span><span>Le Jardin<span class="brand-sub">DES ADDITIONS</span></span></button><nav aria-label="Navigation"><button class="nav-button ${view === 'progress' ? 'active' : ''}" data-action="progress">${icon('star')}<span>Mon jardin</span></button><button class="nav-button install" data-action="install"><span aria-hidden="true">↓</span><span>Installer</span></button></nav></header>`;
const footer = () => `<footer><span>De 1 + 0 à 10 + 10 · Apprendre en douceur</span><button data-action="parents">Le coin des parents</button></footer>`;
function render(focus = false): void {
  if (view !== 'study' && reader.status !== 'idle') reader.stop();
  root.innerHTML = `${header()}<main id="main">${view === 'home' ? home() : view === 'study' ? renderStudy(study, automaticReading, reader.status) : view === 'game' ? play() : view === 'result' ? result() : gardenProgress()}</main>${footer()}<dialog id="dialog"></dialog>`;
  if (focus) root.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
}
function home(): string {
  const count = mastered(progress);
  return `<section class="hero"><div class="hero-copy"><p class="eyebrow">LE BONHEUR D’APPRENDRE</p><h1 tabindex="-1">Les petits calculs<br>font les <em>grands jardins.</em></h1><p>Un peu de curiosité, quelques additions…<br>et chaque jour, tu grandis !</p>${pill()}</div>${garden}</section>
  <div class="home-grid"><section class="choose"><div class="section-heading"><div><p class="eyebrow">À TOI DE JOUER</p><h2>Quelle aventure aujourd’hui ?</h2></div><span class="tiny">5 façons d’apprendre</span></div><div class="modes">${(Object.keys(modes) as Mode[]).map(m => `<button class="mode-card ${m} ${selectedMode === m ? 'selected' : ''}" data-mode="${m}" aria-pressed="${selectedMode === m}"><span class="mode-icon">${icon(m)}</span><span class="mode-content"><strong>${modes[m].title}</strong><span>${modes[m].text}</span><small>${modes[m].tag}</small></span><span class="mode-check" aria-hidden="true">${selectedMode === m ? '✓' : '↗'}</span></button>`).join('')}</div>
  <section class="table-picker"><div class="picker-heading"><h3>${selectedMode === 'study' ? 'La table que je veux apprendre' : 'Mes tables à explorer'}</h3>${selectedMode === 'study' ? '' : `<button class="text-button" data-action="all-tables">${selected.length === 10 ? 'Tables 1, 2, 3' : 'Toutes les tables'}</button>`}</div><div class="table-buttons" aria-label="Choisir les tables">${Array.from({ length: 10 }, (_, i) => `<button data-table="${i + 1}" class="table ${(selectedMode === 'study' ? study.table === i + 1 : selected.includes(i + 1)) ? 'chosen' : ''}" aria-pressed="${selectedMode === 'study' ? study.table === i + 1 : selected.includes(i + 1)}" aria-label="Table de ${i + 1}">${i + 1}</button>`).join('')}</div><p class="small-note">${selectedMode === 'study' ? `De ${study.table} + 0 à ${study.table} + 10, avec toutes les réponses.` : selected.length === 10 ? 'Toutes les additions, de 1 + 0 à 10 + 10.' : `Tables ${selected.join(', ')} · Chaque table va de + 0 à + 10.`}</p></section>
  <button class="primary start" data-action="start">${selectedMode === 'study' ? 'J’apprends ma table' : 'C’est parti !'} <span aria-hidden="true">→</span></button><p class="start-note">${selectedMode === 'study' ? 'Je lis les réponses, puis je les cache. Sans score ni chronomètre.' : selectedMode === 'challenge' ? '60 secondes · Tu peux faire une pause.' : '10 petits calculs · Tout le temps qu’il te faut.'}</p></section>
  <aside class="growth"><div class="growth-top"><span class="eyebrow">MON PETIT JARDIN</span>${sprout}</div><h2>Ça pousse, ça pousse !</h2><p>Chaque addition apprise est<br>une nouvelle petite fleur.</p><div class="garden-pots" aria-hidden="true">${[0, 1, 2].map((_, i) => `<span class="pot ${count >= (i + 1) * 10 ? 'bloom' : ''}"><span>${count >= (i + 1) * 10 ? '✿' : '♧'}</span><i></i></span>`).join('')}</div><div class="growth-count"><strong>${count}</strong><span>additions bien apprises<br>sur 110</span></div><div class="meter" role="progressbar" aria-label="Additions apprises" aria-valuenow="${count}" aria-valuemin="0" aria-valuemax="110"><span style="width:${count / 110 * 100}%"></span></div><p class="growth-tip">Trois bonnes réponses sans indice<br>pour faire fleurir une addition.</p><button class="secondary" data-action="progress">Voir mon jardin ${icon('star')}</button><div class="encouragement">« Tu n’as pas besoin d’aller vite.<br>Tu as juste besoin d’essayer. »</div></aside></div>`;
}
function start(mode = selectedMode, revision?: Fact[]): void {
  selectedMode = mode;
  saveSettings();
  if (mode === 'study') { reader.stop(); study = createStudy(study.table); game = null; view = 'study'; render(true); if (automaticReading) readStudy(); return; }
  const deck = revision?.length ? shuffle(revision) : makeDeck(selected, progress);
  const fact = deck.shift()!;
  game = { mode, review: revision?.length ? [...revision] : null, deck, fact, options: choices(fact.a + fact.b), hidden: Math.random() < .5 ? 'a' : 'b', rounds: 0, correct: 0, assisted: mode === 'learn', failed: false, solved: false, input: '', wrongOptions: [], errors: [], help: mode === 'learn', message: '', remaining: 60000, paused: false, last: performance.now() };
  view = 'game'; render(true);
}
function expected(): number { return !game ? 0 : game.mode === 'missing' ? game.fact[game.hidden] : game.fact.a + game.fact.b; }
function dots(n: number, color: string): string { return `<div class="dot-group ${color}"><span class="dot-label">${n === 0 ? 'Aucun point' : `${n} point${n > 1 ? 's' : ''}`}</span><div class="dots" aria-hidden="true">${Array.from({ length: n }, () => '<i></i>').join('') || '<span>∅</span>'}</div></div>`; }
function play(): string {
  const g = game!;
  const { a, b } = g.fact;
  const missing = g.mode === 'missing';
  return `<section class="play-section"><div class="play-top"><button class="text-button" data-action="quit">← Quitter</button><span>${modes[g.mode].title}</span>${g.mode === 'challenge' ? `<button class="timer" data-action="pause" aria-label="${g.paused ? 'Reprendre le défi' : 'Mettre le défi en pause'}"><span id="timer">${Math.ceil(g.remaining / 1000)}</span> s · ${g.paused ? 'Reprendre' : 'Pause'}</button>` : `<span>${g.rounds + 1} / 10</span>`}</div>
  <div class="round-track" aria-label="${g.rounds} calculs terminés">${g.mode === 'challenge' ? `<span style="width:${g.remaining / 600}%"></span>` : Array.from({ length: 10 }, (_, i) => `<i class="${i < g.rounds ? 'done' : i === g.rounds ? 'current' : ''}"></i>`).join('')}</div>
  <div class="exercise-card"><p class="eyebrow">${missing ? 'QUEL NOMBRE SE CACHE ICI ?' : g.mode === 'learn' ? 'COMPTE LES POINTS ET TROUVE LA SOMME' : 'À TOI DE TROUVER LA SOMME'}</p><h1 tabindex="-1" class="equation" aria-label="${missing ? `${g.hidden === 'a' ? 'Nombre manquant' : a} plus ${g.hidden === 'b' ? 'nombre manquant' : b} égale ${a + b}` : `${a} plus ${b} égale combien ?`}"><span>${missing && g.hidden === 'a' ? '<b class="unknown">?</b>' : a}</span><span class="operator">+</span><span>${missing && g.hidden === 'b' ? '<b class="unknown">?</b>' : b}</span><span class="operator">=</span><span>${missing ? a + b : '<b class="unknown">?</b>'}</span></h1>
  ${g.paused ? '<div class="pause-panel"><h2>Une petite pause 🌿</h2><p>Le temps s’est arrêté. Reprends quand tu veux.</p><button class="primary" data-action="pause">Reprendre le défi</button></div>' : `<div class="answer-area">${g.help ? `<div class="hint"><div class="counting">${dots(a, 'mint')}<span class="operator">+</span>${dots(b, 'peach')}</div><p>${hint(g.fact)}</p>${missing ? `<p>Le groupe caché complète les points pour arriver à ${a + b}.</p>` : ''}</div>` : ''}
  ${g.mode === 'learn' || g.mode === 'challenge' ? `<div class="answers">${g.options.map(n => `<button data-answer="${n}" ${g.solved || g.wrongOptions.includes(n) ? 'disabled' : ''} class="answer ${g.solved && n === expected() ? 'right' : g.wrongOptions.includes(n) ? 'wrong' : ''}" aria-label="Répondre ${n}">${n}</button>`).join('')}</div>` : `<div class="number-display" role="status" aria-label="Réponse saisie"><span>${g.input || '…'}</span></div><div class="keypad" aria-label="Clavier de réponse">${[1, 2, 3, 4, 5, 6, 7, 8, 9, '⌫', 0, 'OK'].map(n => `<button data-key="${n}" ${g.solved ? 'disabled' : ''} class="${n === 'OK' ? 'key-ok' : ''}" aria-label="${n === '⌫' ? 'Effacer un chiffre' : n === 'OK' ? 'Valider la réponse' : n}">${n}</button>`).join('')}</div>`}
  <div class="feedback ${g.solved ? 'success' : g.failed ? 'retry' : ''}" role="status" aria-live="polite">${g.message || (g.mode === 'learn' ? 'Tu peux compter avec les petits points.' : 'Prends ton temps. Tu peux le faire !')}</div>
  ${g.solved ? `<button class="primary next" data-action="next">${g.mode !== 'challenge' && g.rounds === 9 ? 'Voir mon jardin' : 'Addition suivante'} →</button>` : !g.help ? '<button class="text-button hint-button" data-action="hint">Un petit coup de pouce ?</button>' : ''}</div>`}
  </div><p class="below-card">${g.mode === 'challenge' ? `${g.correct} bonne${g.correct > 1 ? 's' : ''} réponse${g.correct > 1 ? 's' : ''} · Les erreurs aident aussi à apprendre.` : 'Une erreur ? C’est une nouvelle occasion d’apprendre.'}</p></section>`;
}
function answer(value: number): void {
  const g = game;
  if (!g || view !== 'game' || g.solved || g.paused || (g.mode === 'challenge' && g.remaining <= 0)) return;
  if (value === expected()) {
    const independent = !g.assisted && !g.failed;
    if (g.mode !== 'learn' && !g.failed) record(progress, g.fact, independent);
    if (g.mode !== 'learn' && g.assisted && !g.errors.some(f => f.key === g.fact.key)) g.errors.push(g.fact);
    if (independent || g.mode === 'learn') g.correct++;
    g.solved = true;
    g.message = `${g.fact.a} + ${g.fact.b} = ${g.fact.a + g.fact.b}. ${g.failed || g.assisted ? 'Bien joué, tu as trouvé !' : 'Bravo, une petite fleur de plus !'}`;
    save(); render(); root.querySelector<HTMLElement>('.next')?.focus({ preventScroll: true });
  } else {
    if (!g.failed && g.mode !== 'learn') {
      record(progress, g.fact, false);
      if (!g.errors.some(f => f.key === g.fact.key)) g.errors.push(g.fact);
      g.deck.splice(Math.min(3, g.deck.length), 0, g.fact);
    }
    g.failed = true; g.input = ''; g.wrongOptions.push(value);
    g.message = 'Pas encore… Essaie une autre réponse. Tu peux demander un indice.';
    save(); render();
  }
}
function next(): void {
  const g = game!;
  if (!g.solved || g.paused) return;
  g.rounds++;
  if (g.mode !== 'challenge' && g.rounds >= 10) { finish(); return; }
  if (!g.deck.length) {
    g.deck = g.review ? shuffle(g.review) : makeDeck(selected, progress);
    if (g.deck.length > 1 && g.deck[0].key === g.fact.key) [g.deck[0], g.deck[1]] = [g.deck[1], g.deck[0]];
  }
  g.fact = g.deck.shift()!; g.hidden = Math.random() < .5 ? 'a' : 'b';
  g.options = choices(g.fact.a + g.fact.b); g.solved = false; g.failed = false; g.assisted = g.mode === 'learn'; g.help = g.mode === 'learn'; g.input = ''; g.wrongOptions = []; g.message = '';
  render(true);
}
function finish(): void {
  if (!game || view !== 'game') return;
  if (game.solved && game.mode === 'challenge') game.rounds++;
  progress.sessions++; progress.stars += game.correct;
  if (game.mode === 'challenge') progress.best = Math.max(progress.best, game.correct);
  save(); view = 'result'; render(true);
}
function result(): string {
  const g = game!;
  return `<section class="result-card"><div class="result-flower" aria-hidden="true">✿</div><p class="eyebrow">UNE JOLIE ÉTAPE DE PLUS</p><h1 tabindex="-1">Bravo pour tes efforts !</h1><p>${g.mode === 'learn' ? 'Tu as exploré 10 additions avec les petits points.' : `Tu as trouvé ${g.correct} réponse${g.correct > 1 ? 's' : ''} sans indice du premier coup${g.mode === 'challenge' ? ' en une minute' : ' sur 10'}.`}</p><div class="result-stats"><div><strong>${g.correct}</strong><span>${g.mode === 'learn' ? 'additions découvertes' : 'petites étoiles'}</span></div><div><strong>${mastered(progress)}</strong><span>additions bien apprises</span></div></div><p>${g.errors.length ? 'Les additions qui demandent un peu de soin :' : 'Ton jardin grandit à chaque essai. Reviens le faire pousser !'}</p>${g.errors.length ? `<div class="review-facts">${g.errors.map(f => `<span>${f.a} + ${f.b} = ${f.a + f.b}</span>`).join('')}</div><button class="primary" data-action="review">Revoir ces additions tranquillement</button>` : '<button class="primary" data-action="start">Encore une petite partie →</button>'}<button class="secondary" data-action="home">Retour au jardin</button></section>`;
}
function gardenProgress(): string {
  return `<section class="progress-page"><p class="eyebrow">CHAQUE PETIT PAS COMPTE</p><h1 tabindex="-1">Mon jardin d’additions</h1><p>${mastered(progress)} fleurs sur 110 · ${progress.stars} étoiles récoltées · ${progress.sessions} parties terminées</p><div class="legend"><span>○ À découvrir</span><span class="growing">◔ En train de pousser</span><span class="flowered">✿ Bien apprise</span></div><div class="matrix-wrap"><table class="matrix"><caption>Mes tables : trois bonnes réponses consécutives sans indice pour faire fleurir une case.</caption><thead><tr><th scope="col">+</th>${Array.from({ length: 11 }, (_, b) => `<th scope="col">${b}</th>`).join('')}</tr></thead><tbody>${Array.from({ length: 10 }, (_, i) => `<tr><th scope="row">${i + 1}</th>${Array.from({ length: 11 }, (_, b) => { const f = ALL_FACTS.find(f => f.a === i + 1 && f.b === b)!; const n = progress.facts[f.key]?.streak || 0; return `<td><button class="fact-cell ${n >= 3 ? 'flowered' : n ? 'growing' : ''}" data-fact="${f.key}" aria-label="${f.a} plus ${f.b}, ${n} bonnes réponses consécutives sur 3"><span aria-hidden="true">${n >= 3 ? '✿' : n ? '◔' : '○'}</span></button></td>`; }).join('')}</tr>`).join('')}</tbody></table></div><p class="small-note">Touche une case pour revoir son addition et une astuce.</p><button class="primary" data-action="home">Choisir une aventure →</button></section>`;
}
function dialog(content: string): void {
  reader.stop();
  const d = root.querySelector<HTMLDialogElement>('#dialog')!;
  d.innerHTML = `${content}<button class="secondary" data-action="close">Fermer</button>`;
  d.showModal();
}
function handleKey(key: string): void {
  const g = game;
  if (!g || g.solved || g.paused || !['practice', 'missing'].includes(g.mode)) return;
  if (key === 'OK') { if (g.input !== '') answer(Number(g.input)); return; }
  if (key === '⌫') g.input = g.input.slice(0, -1);
  else if (/^\d$/.test(key) && g.input.length < 2) g.input = g.input === '0' ? key : g.input + key;
  const display = root.querySelector('.number-display span'); if (display) display.textContent = g.input || '…';
}
root.addEventListener('click', async (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button');
  if (!button || button.disabled) return;
  if (button.dataset.mode) { selectedMode = button.dataset.mode as Mode; saveSettings(); render(); root.querySelector<HTMLElement>(`[data-mode="${selectedMode}"]`)?.focus({ preventScroll: true }); return; }
  if (button.dataset.table) { const n = Number(button.dataset.table); if (selectedMode === 'study') study = createStudy(n); else selected = selected.includes(n) ? selected.length > 1 ? selected.filter(i => i !== n) : selected : [...selected, n].sort((a, b) => a - b); saveSettings(); render(); root.querySelector<HTMLElement>(`[data-table="${n}"]`)?.focus({ preventScroll: true }); return; }
  if (button.dataset.studyTable) { study = createStudy(Number(button.dataset.studyTable)); saveSettings(); refreshStudy(); return; }
  if (button.dataset.studyPhase) { study.masked = button.dataset.studyPhase === 'recall'; study.revealed.clear(); refreshStudy(); root.querySelector<HTMLElement>(`[data-study-phase="${button.dataset.studyPhase}"]`)?.focus({ preventScroll: true }); return; }
  if (button.dataset.studyTerm !== undefined) { study.term = Number(button.dataset.studyTerm); refreshStudy(); root.querySelector<HTMLElement>(`[data-study-term="${study.term}"]`)?.focus({ preventScroll: true }); return; }
  if (button.dataset.studyStep) { study.term = Math.max(0, Math.min(10, study.term + Number(button.dataset.studyStep))); refreshStudy(); root.querySelector<HTMLElement>(`[data-study-step="${button.dataset.studyStep}"]:not(:disabled)`)?.focus({ preventScroll: true }); return; }
  if (button.dataset.studyReveal) { if (button.dataset.studyReveal === 'true') study.revealed.add(study.term); else study.revealed.delete(study.term); refreshStudy(); root.querySelector<HTMLElement>('[data-study-reveal]')?.focus({ preventScroll: true }); return; }
  if (button.dataset.answer !== undefined) { answer(Number(button.dataset.answer)); return; }
  if (button.dataset.key) { handleKey(button.dataset.key); return; }
  if (button.dataset.fact) { const f = ALL_FACTS.find(f => f.key === button.dataset.fact)!; dialog(`<h2>${f.a} + ${f.b} = ${f.a + f.b}</h2><div class="counting">${dots(f.a, 'mint')}<span>+</span>${dots(f.b, 'peach')}</div><p>${hint(f)}</p>`); return; }
  switch (button.dataset.action) {
    case 'audio-toggle': automaticReading = !automaticReading; saveSettings(); reader.stop(); render(); root.querySelector<HTMLElement>('[data-action="audio-toggle"]')?.focus({ preventScroll: true }); if (automaticReading) readStudy(); break;
    case 'audio-read': readStudy(); break;
    case 'audio-stop': reader.stop(); break;
    case 'home': case 'progress':
      if (view === 'game') { dialog('<h2>Quitter cette partie ?</h2><p>Tes additions déjà travaillées sont sauvegardées. Tu pourras commencer une nouvelle partie.</p><button class="primary" data-action="confirm-quit">Quitter la partie</button>'); break; }
      view = button.dataset.action === 'home' ? 'home' : 'progress'; render(true); break;
    case 'all-tables': selected = selected.length === 10 ? [1, 2, 3] : Array.from({ length: 10 }, (_, i) => i + 1); saveSettings(); render(); break;
    case 'start': start(); break;
    case 'study-practice': selected = [study.table]; start('practice'); break;
    case 'next': next(); break;
    case 'hint': game!.help = true; game!.assisted = true; render(); break;
    case 'pause': game!.paused = !game!.paused; game!.last = performance.now(); render(); break;
    case 'review': start('learn', game!.errors); break;
    case 'quit': dialog('<h2>Quitter cette partie ?</h2><p>Tes additions déjà travaillées sont sauvegardées.</p><button class="primary" data-action="confirm-quit">Quitter la partie</button>'); break;
    case 'confirm-quit': view = 'home'; game = null; render(true); break;
    case 'close': root.querySelector<HTMLDialogElement>('#dialog')!.close(); break;
    case 'install':
      if (installEvent) { await installEvent.prompt(); await installEvent.userChoice; installEvent = null; }
      else dialog('<p class="eyebrow">TON JARDIN À PORTÉE DE MAIN</p><h2>Installer le jeu</h2><p><strong>Sur iPhone ou iPad :</strong> ouvre ce jeu dans Safari, touche Partager, puis « Sur l’écran d’accueil ». Active « Ouvrir comme app web » si cette option apparaît.</p><p><strong>Sur Android :</strong> ouvre ce jeu dans Chrome, puis le menu ⋮ et « Installer l’application » ou « Ajouter à l’écran d’accueil ».</p><p>Ouvre le jeu une première fois avec Internet et attends « Prêt hors connexion ». Tu pourras ensuite jouer sans réseau. La progression reste sur cet appareil.</p>');
      break;
    case 'parents': dialog(`<p class="eyebrow">LE COIN DES PARENTS</p><h2>Apprendre à son rythme</h2><p>Le jeu travaille les 110 additions de 1 + 0 à 10 + 10. Commencez par « J’apprends mes tables » : toutes les réponses sont présentées dans l’ordre et expliquées avec des points numérotés. Votre enfant peut ensuite cacher les résultats et les révéler à son rythme, sans évaluation.</p><p>La lecture sonore utilise les enregistrements de <a href="https://lingualibre.org/wiki/Q142683" target="_blank" rel="noopener">Poslovitch sur Lingua Libre</a>. « 3 + 5 = 8 » se lit « trois plus cinq, huit ». Activez « Lecture automatique » pour parcourir la table avec une pause entre les lignes ; le choix est conservé sur cet appareil. Les résultats cachés ne sont pas lus avant d’être révélés. Les sons fonctionnent aussi hors connexion après le premier chargement. <a href="./audio/CREDITS.txt" target="_blank" rel="noopener">Sources et licences des sons</a>.</p><p>Une fleur correspond à trois réponses consécutives justes, sans indice et du premier coup. Les erreurs reviennent après quelques calculs. Lire ou révéler une réponse dans le mode d’apprentissage ne modifie pas les fleurs ni les scores. Le mode découverte ne modifie pas les fleurs.</p><p>Le défi dure 60 secondes, avec une pause possible. Il se met en pause quand l’application passe en arrière-plan. Record : ${progress.best} réponses.</p><p>${persistent ? 'La progression est enregistrée uniquement sur cet appareil, dans ce navigateur. Aucun compte, aucune publicité ni suivi.' : 'Le navigateur bloque la sauvegarde : la progression ne sera conservée que pendant cette visite.'}</p><button class="danger" data-action="reset">Effacer la progression…</button>`); break;
    case 'reset': dialog('<h2>Recommencer le jardin ?</h2><p>Les fleurs, étoiles et records de cet appareil seront effacés.</p><button class="danger" data-action="confirm-reset">Oui, effacer la progression</button>'); break;
    case 'confirm-reset': progress = freshProgress(); save(); view = 'home'; game = null; render(true); break;
  }
});
document.addEventListener('keydown', event => {
  if (view !== 'game' || root.querySelector('dialog[open]')) return;
  if (/^\d$/.test(event.key) || event.key === 'Backspace') { event.preventDefault(); handleKey(event.key === 'Backspace' ? '⌫' : event.key); }
  const target = event.target as HTMLElement;
  if (event.key === 'Enter' && (target.tagName !== 'BUTTON' || target.hasAttribute('data-key'))) { event.preventDefault(); if (game?.solved) next(); else handleKey('OK'); }
});
setInterval(() => {
  if (view !== 'game' || game?.mode !== 'challenge') return;
  const g = game, now = performance.now(), delta = now - g.last; g.last = now;
  if (g.paused || document.hidden || root.querySelector('dialog[open]')) return;
  g.remaining = Math.max(0, g.remaining - delta);
  if (g.remaining <= 0) { finish(); return; }
  const timer = root.querySelector('#timer'); if (timer) timer.textContent = String(Math.ceil(g.remaining / 1000));
  const track = root.querySelector<HTMLElement>('.round-track span'); if (track) track.style.width = `${g.remaining / 600}%`;
}, 150);
document.addEventListener('visibilitychange', () => { if (document.hidden) reader.stop(); if (game?.mode === 'challenge' && view === 'game') { game.paused = true; game.last = performance.now(); render(); } });
window.addEventListener('pagehide', () => reader.stop());
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvent = e as InstallEvent; });
window.addEventListener('appinstalled', () => { installEvent = null; });
render();
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).then(async registration => {
    void registration.update().catch(() => { /* The installed version stays usable offline. */ });
    await navigator.serviceWorker.ready;
    offlineReady = true;
    if (view === 'home') render();
  }).catch(() => { offlineReady = false; });
}
