export type Mode = 'study' | 'learn' | 'practice' | 'missing' | 'challenge';
export type Fact = { a: number; b: number; key: string };
export type Memory = { attempts: number; streak: number; correct: number };
export type Progress = { version: 1; facts: Record<string, Memory>; sessions: number; stars: number; best: number };
export const ALL_FACTS: Fact[] = Array.from({ length: 10 }, (_, i) => Array.from({ length: 11 }, (_, b) => ({ a: i + 1, b, key: `${i + 1}+${b}` }))).flat();
export const studyTable = (table: number): Fact[] => ALL_FACTS.filter(f => f.a === table);
export const countingSteps = (f: Fact): number[] => Array.from({ length: f.b }, (_, i) => f.a + i + 1);
export const freshProgress = (): Progress => ({ version: 1, facts: {}, sessions: 0, stars: 0, best: 0 });
export function parseProgress(raw: string | null): Progress {
  try {
    const p = JSON.parse(raw || 'null');
    if (!p || p.version !== 1) return freshProgress();
    const count = (v: unknown) => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0 ? v : 0;
    const facts: Progress['facts'] = {};
    for (const f of ALL_FACTS) {
      const m = p.facts?.[f.key];
      if (m && typeof m === 'object') facts[f.key] = { attempts: count(m.attempts), correct: Math.min(count(m.correct), count(m.attempts)), streak: Math.min(3, count(m.streak)) };
    }
    return { version: 1, facts, sessions: count(p.sessions), stars: count(p.stars), best: count(p.best) };
  } catch { return freshProgress(); }
}
export const mastered = (p: Progress) => ALL_FACTS.filter(f => (p.facts[f.key]?.streak || 0) >= 3).length;
export function record(p: Progress, f: Fact, independent: boolean): void {
  const m = p.facts[f.key] || { attempts: 0, correct: 0, streak: 0 };
  p.facts[f.key] = { attempts: m.attempts + 1, correct: m.correct + Number(independent), streak: independent ? Math.min(3, m.streak + 1) : 0 };
}
export function shuffle<T>(items: T[], random = Math.random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}
export function makeDeck(tables: number[], p: Progress, random = Math.random): Fact[] {
  const deck = shuffle(ALL_FACTS.filter(f => tables.includes(f.a)), random);
  // Random order within learning levels: every selected fact appears before a fresh cycle.
  return deck.sort((a, b) => (p.facts[a.key]?.streak || 0) - (p.facts[b.key]?.streak || 0));
}
export function choices(answer: number, random = Math.random): number[] {
  const close = shuffle(Array.from({ length: 21 }, (_, i) => i).filter(i => i !== answer && Math.abs(i - answer) <= 4), random);
  return shuffle([answer, ...close.slice(0, 3)], random);
}
export function hint(f: Fact): string {
  if (f.b === 0) return `Ajouter 0 ne change pas le nombre : tu gardes ${f.a}.`;
  if (f.a === f.b) return `C’est un double : deux groupes de ${f.a}.`;
  if (f.a + f.b > 10 && f.a < 10) return `De ${f.a} à 10, il manque ${10 - f.a}. Coupe ${f.b} en ${10 - f.a} et ${f.b - (10 - f.a)}.`;
  return `Pars de ${Math.max(f.a, f.b)} et avance de ${Math.min(f.a, f.b)} pas.`;
}
