import './base.css';
import './style.css';
import { h, toast, copyText, loadJSON, saveJSON, langToggle } from './ui';
import { dicts, type Lang, type Dict } from './i18n';
import { CURRENCIES, cur, split, money, type RoundMode } from './calc';

interface Person { name: string; weight: number }
interface State {
  lang: Lang; amount: string; people: number; tip: number; tipCustom: boolean;
  unitIdx: number; mode: RoundMode; currency: string; uneven: boolean; persons: Person[];
}
const KEY = 'warikan:v1';
const st: State = loadJSON<State>(KEY, {
  lang: 'ja', amount: '', people: 2, tip: 0, tipCustom: false, unitIdx: 1, mode: 'up', currency: 'JPY', uneven: false, persons: [],
});
let t: Dict = dicts[st.lang];
const save = () => saveJSON(KEY, st);
const app = document.getElementById('app')!;
const WEIGHTS = [0.5, 1, 1.5, 2, 3];

function setLang(l: Lang) { st.lang = l; t = dicts[l]; document.documentElement.lang = l; document.title = t.app; save(); render(); }
function syncPersons() {
  while (st.persons.length < st.people) st.persons.push({ name: '', weight: 1 });
  st.persons.length = st.people;
}
const amountNum = () => {
  const v = parseFloat(st.amount.replace(/[^\d.]/g, ''));
  return Number.isFinite(v) && v > 0 ? v : 0;
};
const personName = (i: number) => st.persons[i]?.name.trim() || t.person(i + 1);
const fmtW = (w: number) => '×' + w;

function compute() {
  const c = cur(st.currency);
  syncPersons();
  const weights = st.uneven ? st.persons.map((p) => p.weight) : Array(st.people).fill(1);
  const unit = c.units[Math.min(st.unitIdx, c.units.length - 1)];
  return { c, r: split(amountNum(), st.tip, weights, unit, st.mode, c.decimals) };
}

function resultText(): string {
  const { c, r } = compute();
  const m = (v: number) => money(v, c, st.lang);
  const lines = [t.textHead];
  lines.push(`${t.total}: ${m(amountNum())}` + (st.tip ? `（${t.withTip(st.tip)} ${m(r.total)}）` : ''));
  lines.push(t.splitN(st.people));
  if (st.uneven) {
    st.persons.forEach((p, i) => lines.push(`・${personName(i)} ${fmtW(p.weight)}: ${m(r.shares[i])}`));
  } else {
    lines.push(`${t.perPerson}: ${m(r.shares[0])}`);
  }
  if (r.diff !== 0) lines.push(t.diffLine(m(r.collected), (r.diff > 0 ? '+' : '') + m(r.diff)));
  return lines.join('\n');
}

let resultEl: HTMLElement;
function renderResult() {
  const { c, r } = compute();
  const m = (v: number) => money(v, c, st.lang);
  const has = amountNum() > 0;
  const diff = !has ? '' : r.diff > 0 ? t.surplus(m(r.diff)) : r.diff < 0 ? t.short(m(-r.diff)) : t.exact;
  const body = !has
    ? [h('p', { class: 'res-empty' }, t.enterAmount)]
    : st.uneven
      ? [h('ul', { class: 'shares' }, ...st.persons.map((p, i) =>
          h('li', {}, h('span', { class: 'sh-name' }, personName(i)), h('span', { class: 'sh-w' }, fmtW(p.weight)), h('span', { class: 'sh-amt' }, m(r.shares[i])))))]
      : [h('div', { class: 'res-label' }, t.perPerson), h('div', { class: 'res-big' }, m(r.shares[0]))];
  resultEl.replaceChildren(
    ...body,
    has ? h('div', { class: 'res-meta' },
      h('span', {}, `${t.total} ${m(r.total)}`), h('span', {}, `${t.collected} ${m(r.collected)}`)) : '',
    has ? h('div', { class: 'res-diff' + (r.diff < 0 ? ' neg' : '') }, diff) : '',
    h('div', { class: 'row' },
      h('button', { class: 'btn line grow', disabled: !has, onclick: async () => toast((await copyText(resultText())) ? t.copied : t.copyFail) }, t.copyLine),
      h('button', { class: 'btn grow', disabled: !has, onclick: async () => {
        const text = resultText();
        if (navigator.share) { try { await navigator.share({ text }); return; } catch (e) { if ((e as Error).name === 'AbortError') return; } }
        toast((await copyText(text)) ? t.copied : t.copyFail);
      } }, t.share),
    ),
  );
  save();
}

function seg<T extends string | number>(opts: [T, string][], val: T, set: (v: T) => void, cls = '') {
  return h('div', { class: 'seg ' + cls }, ...opts.map(([v, lab]) =>
    h('button', { 'aria-pressed': String(v === val), onclick: () => set(v) }, lab)));
}

function render() {
  const c = cur(st.currency);
  syncPersons();
  resultEl = h('section', { class: 'card result' });

  const amt = h('input', { class: 'amount-input', inputmode: c.decimals ? 'decimal' : 'numeric', placeholder: '0', 'aria-label': t.amount, autocomplete: 'off', value: st.amount });
  amt.oninput = () => { st.amount = amt.value.replace(/[^\d.,]/g, '').replace(/,/g, ''); if (amt.value !== st.amount) amt.value = st.amount; renderResult(); };

  const peopleOut = h('output', { class: 'people-num' }, String(st.people));
  const setPeople = (n: number) => { st.people = Math.max(1, Math.min(99, n)); peopleOut.textContent = String(st.people); if (st.uneven) render(); else renderResult(); };

  const tipOpts = [0, 5, 10, 15, 20];
  const tipCustomInp = h('input', { class: 'input tip-custom', inputmode: 'decimal', value: st.tipCustom ? String(st.tip) : '', placeholder: '%', 'aria-label': t.custom });
  tipCustomInp.oninput = () => { st.tip = Math.max(0, Math.min(100, parseFloat(tipCustomInp.value) || 0)); renderResult(); };

  const persons = st.uneven ? h('div', { class: 'persons' }, ...st.persons.map((p, i) => {
    const nm = h('input', { class: 'input name', placeholder: t.person(i + 1), value: p.name, 'aria-label': t.namePh });
    nm.oninput = () => { p.name = nm.value; renderResult(); };
    return h('div', { class: 'person' }, nm,
      h('div', { class: 'seg w' }, ...WEIGHTS.map((w) => h('button', { 'aria-pressed': String(p.weight === w), onclick: () => { p.weight = w; render(); } }, fmtW(w)))));
  })) : '';

  app.replaceChildren(
    h('header', { class: 'topbar' }, h('span', { class: 'logo' }, c.symbol), h('h1', {}, t.app), langToggle(st.lang, setLang)),
    h('main', {},
      h('section', { class: 'card' },
        h('label', { class: 'field' }, t.amount,
          h('div', { class: 'amount-wrap' }, h('span', { class: 'amount-sym' }, c.symbol), amt,
            h('button', { class: 'clear', 'aria-label': t.reset, onclick: () => { st.amount = ''; amt.value = ''; amt.focus(); renderResult(); } }, '×'))),
      ),
      h('section', { class: 'card people' },
        h('div', { class: 'lbl' }, t.people),
        h('div', { class: 'stepper' },
          h('button', { class: 'step', 'aria-label': '−', onclick: () => setPeople(st.people - 1) }, '−'),
          h('div', { class: 'people-val' }, peopleOut, h('span', { class: 'unit' }, t.personUnit)),
          h('button', { class: 'step', 'aria-label': '+', onclick: () => setPeople(st.people + 1) }, '+'),
        ),
      ),
      resultEl,
      h('section', { class: 'card stack' },
        h('div', { class: 'lbl' }, t.tip),
        h('div', { class: 'row' },
          seg<number | string>([...tipOpts.map((p) => [p, p + '%'] as [number, string]), ['c', t.custom]], st.tipCustom ? 'c' : st.tip, (v) => {
            if (v === 'c') { st.tipCustom = true; } else { st.tipCustom = false; st.tip = v as number; }
            render();
          }, 'grow tipseg'),
        ),
        st.tipCustom ? h('div', { class: 'row' }, tipCustomInp, h('span', { class: 'muted' }, '%')) : '',
        h('div', { class: 'lbl' }, t.rounding),
        seg(c.units.map((u, i) => [i, c.symbol + u.toLocaleString('en-US')] as [number, string]), Math.min(st.unitIdx, c.units.length - 1), (v) => { st.unitIdx = v; render(); }),
        seg<RoundMode>([['up', t.up], ['down', t.down], ['nearest', t.nearest]], st.mode, (v) => { st.mode = v; render(); }),
        h('label', { class: 'chk' }, h('input', { type: 'checkbox', checked: st.uneven, onchange: (e: Event) => { st.uneven = (e.target as HTMLInputElement).checked; render(); } }), t.uneven),
        persons,
        h('label', { class: 'field cur' }, t.currency,
          (() => {
            const s = h('select', { class: 'input' }, ...CURRENCIES.map((x) => h('option', { value: x.code }, `${x.code}  ${x.symbol}`)));
            s.value = st.currency;
            s.onchange = () => { st.currency = s.value; render(); };
            return s;
          })()),
      ),
      h('p', { class: 'foot' }, t.privacy),
    ),
  );
  renderResult();
}
document.documentElement.lang = st.lang;
document.title = t.app;
render();
