import './study.css';
import { countingSteps, studyTable, type Fact } from './engine';

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

export function renderStudy(state: StudyState): string {
  const facts = studyTable(state.table);
  const f = facts[state.term];
  const visible = !state.masked || state.revealed.has(state.term);
  return `<section class="study-page">
    <div class="study-heading"><button class="text-button" data-action="home">← Retour au jardin</button><p class="eyebrow">J’APPRENDS MES TABLES</p><h1 tabindex="-1">La table de ${state.table}</h1><p>Je lis, je comprends, puis je mémorise. À mon rythme.</p></div>
    <div class="study-table-picker" aria-label="Choisir une table à apprendre">${Array.from({ length: 10 }, (_, i) => `<button class="table ${state.table === i + 1 ? 'chosen' : ''}" data-study-table="${i + 1}" aria-label="Apprendre la table de ${i + 1}" aria-pressed="${state.table === i + 1}">${i + 1}</button>`).join('')}</div>
    <div class="study-tabs" aria-label="Façon d’apprendre"><button data-study-phase="read" aria-pressed="${!state.masked}" class="${!state.masked ? 'chosen' : ''}">1. Je lis la table</button><button data-study-phase="recall" aria-pressed="${state.masked}" class="${state.masked ? 'chosen' : ''}">2. Je cache les résultats</button></div>
    <p class="study-instructions">${state.masked ? 'Essaie de retrouver un résultat dans ta tête, puis affiche la réponse pour vérifier tranquillement.' : 'Les réponses sont déjà écrites. Lis chaque ligne et regarde comment le résultat grandit de 1.'}</p>
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
