import './study.css';
import { countingSteps, studyTable, type Fact } from './engine';
import type { ReadingStatus } from './audio';

export type StudyState = { table: number; term: number; masked: boolean; revealed: Set<number> };
export const createStudy = (table: number): StudyState => ({ table, term: 0, masked: false, revealed: new Set() });

function numberedPoints(values: number[], color: string, label: string): string {
  return `<div class="study-group ${color}"><p>${label}</p><div class="study-points" aria-label="${values.length} point${values.length > 1 ? 's' : ''}">${values.map(n => `<span aria-hidden="true">${n}</span>`).join('') || '<span class="study-zero" aria-hidden="true">0</span>'}</div></div>`;
}

function explanation(f: Fact): string {
  const steps = countingSteps(f);
  return `<div class="study-counting">${numberedPoints(Array.from({ length: f.a }, (_, i) => i + 1), 'mint', `Je commence avec ${f.a}.`)}${numberedPoints(steps, 'peach', f.b === 0 ? 'Je n’ajoute aucun point.' : `J’ajoute ${f.b} point${f.b > 1 ? 's' : ''}.`)}</div>
    <div class="study-explanation"><p>${f.b === 0 ? `Ajouter 0 ne change rien : je garde ${f.a}.` : `Je pars de ${f.a}, puis je compte ${steps.join(', ')}.`}</p><strong>Il y a ${f.a + f.b} point${f.a + f.b > 1 ? 's' : ''} en tout.</strong></div>
    ${f.b < 10 ? `<p class="study-pattern">Pour passer à la ligne suivante, j’ajoute 1 au résultat :<br><strong>${f.a + f.b} + 1 = ${f.a + f.b + 1}</strong></p>` : '<p class="study-pattern">Tu as parcouru toute la table, de + 0 à + 10. Tu peux la relire autant que tu veux.</p>'}`;
}

export function renderStudy(state: StudyState, automatic = false, reading: ReadingStatus = 'idle'): string {
  const facts = studyTable(state.table);
  const f = facts[state.term];
  const visible = !state.masked || state.revealed.has(state.term);
  return `<section class="study-page">
    <div class="study-heading"><button class="text-button" data-action="home">← Retour au jardin</button><p class="eyebrow">J’APPRENDS MES TABLES</p><h1 tabindex="-1">La table de ${state.table}</h1><p>Je lis, je comprends, puis je mémorise. À mon rythme.</p></div>
    <div class="study-table-picker" aria-label="Choisir une table à apprendre">${Array.from({ length: 10 }, (_, i) => `<button class="table ${state.table === i + 1 ? 'chosen' : ''}" data-study-table="${i + 1}" aria-label="Apprendre la table de ${i + 1}" aria-pressed="${state.table === i + 1}">${i + 1}</button>`).join('')}</div>
    <div class="study-tabs" aria-label="Façon d’apprendre"><button data-study-phase="read" aria-pressed="${!state.masked}" class="${!state.masked ? 'chosen' : ''}">1. Je lis la table</button><button data-study-phase="recall" aria-pressed="${state.masked}" class="${state.masked ? 'chosen' : ''}">2. Je cache les résultats</button></div>
    <p class="study-instructions">${state.masked ? 'Essaie de retrouver un résultat dans ta tête, puis affiche la réponse pour vérifier tranquillement.' : 'Les réponses sont déjà écrites. Lis chaque ligne et regarde comment le résultat grandit de 1.'}</p>
    <section class="study-audio" aria-label="Écouter la table">
      <div><h2>J’apprends aussi en écoutant</h2><p>Une voix lit chaque addition, puis te laisse le temps de la répéter.</p></div>
      <button class="audio-toggle" data-action="audio-toggle" role="switch" aria-checked="${automatic}" aria-label="Lecture automatique"><span aria-hidden="true">${automatic ? '🔊' : '🔈'}</span> Lecture automatique : ${automatic ? 'activée' : 'désactivée'}</button>
      <div class="audio-actions"><button class="secondary" data-action="audio-read" ${!visible ? 'disabled' : ''}>${!state.masked && automatic ? 'Écouter la table d’ici' : 'Écouter cette addition'}</button><button class="text-button" data-action="audio-stop" ${['idle', 'error'].includes(reading) ? 'disabled' : ''}>Pause</button></div>
      <p id="audio-status" class="audio-status" role="status" aria-live="polite">${audioMessage(state, reading)}</p>
      <small>Voix : <a href="https://lingualibre.org/wiki/Q142683" target="_blank" rel="noopener">Poslovitch · Lingua Libre</a> · <a href="./audio/CREDITS.txt" target="_blank" rel="noopener">Sources des sons</a></small>
    </section>
    <div class="study-layout"><section class="study-example" aria-label="Comprendre une addition">
      <p class="eyebrow">${visible ? 'JE COMPRENDS CETTE ADDITION' : 'JE ME RAPPELLE LA RÉPONSE'}</p>
      <h2 class="equation study-equation" aria-label="${f.a} plus ${f.b} égale ${visible ? f.a + f.b : 'combien ?'}"><span>${f.a}</span><span class="operator">+</span><span>${f.b}</span><span class="operator">=</span><span class="${visible ? 'study-sum' : 'unknown'}">${visible ? f.a + f.b : '?'}</span></h2>
      ${visible ? explanation(f) : '<div class="study-recall"><p>Prends le temps de réfléchir.<br>Tu peux regarder la réponse dès que tu veux.</p><button class="primary" data-study-reveal="true">Voir la réponse</button></div>'}
      ${state.masked && visible ? '<button class="text-button" data-study-reveal="false">Cacher à nouveau cette réponse</button>' : ''}
      <div class="study-navigation"><button class="secondary" data-study-step="-1" ${state.term === 0 ? 'disabled' : ''} aria-label="Addition précédente">← Précédente</button><span>${state.term + 1} / 11</span><button class="secondary" data-study-step="1" ${state.term === 10 ? 'disabled' : ''} aria-label="Addition suivante">Suivante →</button></div>
    </section><section class="study-list" aria-label="La table complète"><h2>Ma table, dans l’ordre</h2><p>Touche une ligne pour la comprendre.</p><ol>${facts.map(row => { const shown = !state.masked || state.revealed.has(row.b); return `<li><button class="study-row ${state.term === row.b ? 'active' : ''}" data-study-term="${row.b}" ${state.term === row.b ? 'aria-current="step"' : ''} aria-label="${row.a} plus ${row.b} ${shown ? `égale ${row.a + row.b}` : 'résultat caché'}"><span>${row.a} <span class="operator">+</span> ${row.b}</span><span class="operator">=</span><strong>${shown ? row.a + row.b : '?'}</strong></button></li>`; }).join('')}</ol></section></div>
    <div class="study-bottom"><p>Ici, tu peux apprendre sans score et sans chronomètre.</p><button class="primary" data-action="study-practice">Je suis prête à m’entraîner →</button></div>
  </section>`;
}

export function audioMessage(state: StudyState, status: ReadingStatus): string {
  if (status === 'error') return 'La lecture n’a pas démarré. Touche « Écouter » pour réessayer.';
  if (state.masked && !state.revealed.has(state.term)) return 'Le son attend que tu révèles la réponse.';
  if (status === 'loading') return 'La voix se prépare…';
  if (status === 'playing') return `J’écoute : ${state.table} + ${state.term}, ${state.table + state.term}.`;
  if (status === 'waiting') return 'À toi de répéter… La ligne suivante arrive.';
  return 'Touche « Écouter » pour commencer ou reprendre. Le son peut être coupé à tout moment.';
}
