/* lib/billing/calc.ts
   Korrekte Abrechnungslogik nach DomusVita-Regeln
   - Sonderregel 1: LK14 -> LK15 (mit AUB 15)
   - Sonderregel 2: LK04 ↔ LK02 (kombinierbar bei bew. LK04)
   - Sonderregel 3: LK03a ↔ LK01 (kombinierbar bei bew. LK03a)
   - 5‑Wochen‑Regel für wöchentliche Bewilligungen
   - ZINV 3,38 % auf Zwischensumme (LK + AUB), BA‑Abzug (Pflegekasse)
   - Ausgabe: BA‑Rechnung & Privatrechnung (je Positionen + Summen)
*/

export type LKCode =
  | 'LK01' | 'LK02' | 'LK03a' | 'LK04' | 'LK07a' | 'LK11b' | 'LK12' | 'LK13' | 'LK14' | 'LK15'
  | string; // toleranter Parser

export type Einheit = 'x/Woche' | 'x/Monat' | string;

export type BewilligungsPosten = {
  code: LKCode;
  menge: number;          // Anzahl lt. Bewilligung (z. B. 1 bei "1x/Woche")
  einheit: Einheit;       // 'x/Woche' oder 'x/Monat'
};

export type Rechnungsposten = {
  code: LKCode;
  menge: number;          // erkannte Anzahl (erbracht)
  einzelpreis?: number;   // € (optional – sonst aus priceTable)
  aubPreis?: number;      // € (optional – sonst aus aubTable)
};

export type Bewilligung = {
  klient?: { nachname?: string; vorname?: string };
  zeitraum?: { von?: string; bis?: string }; // TT.MM.JJJJ
  leistungen: BewilligungsPosten[];
};

export type Invoice = {
  zeitraum?: { monat?: string }; // 'YYYY-MM' (optional; wenn fehlt, 5‑Wochen-Regel anhand Datum von Bewilligung)
  positionen: Rechnungsposten[];
};

export type PriceTable = Partial<Record<LKCode, number>>;
export type AUBTable = Partial<Record<LKCode, number>>;

export type ComputeOptions = {
  month?: string;               // 'YYYY-MM' – Monat der Abrechnung
  pflegekassenBudget?: number;  // z. B. 796.00
  zinvSatz?: number;            // default 0.0338
  priceTable: PriceTable;       // Preise €/Stück
  aubTable: AUBTable;           // AUB €/Stück (1:1 pro LK‑Stück)
};

export type CalcLine = {
  code: LKCode;
  text?: string;
  menge: number;
  einzelpreis: number;
  summe: number;
  isAUB?: boolean;
};

export type CalcResult = {
  debug: any;
  ba: {
    positionen: CalcLine[];
    zwischensumme: number;
    zinv: number;
    gesamt: number;
    pflegekassenAbzug: number;
    rechnungsbetrag: number;
  };
  privat: {
    positionen: CalcLine[];
    zwischensumme: number;
    zinv: number;
    gesamt: number;
    rechnungsbetrag: number;
  };
};

const EUR = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const nz = (n: any) => (Number.isFinite(+n) ? +n : 0);
const norm = (s: string): LKCode => String(s).trim().toUpperCase().replace(/\s+/g, '').replace('LK03A', 'LK03a');

function parseMonthOrFallback(bew?: Bewilligung, optMonth?: string): { y: number; m: number } {
  // bevorzugt options.month 'YYYY-MM'
  if (optMonth && /^\d{4}-\d{2}$/.test(optMonth)) {
    const [y, m] = optMonth.split('-').map(Number);
    return { y, m };
  }
  // sonst aus bewilligung.zeitraum.von -> 'TT.MM.JJJJ'
  const von = bew?.zeitraum?.von || '';
  const m = von.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (m) {
    return { y: +m[3], m: +m[2] };
  }
  // Fallback: aktueller Monat (serverzeit)
  const d = new Date();
  return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1 };
}

/** Hat der Monat 5 Vorkommen irgendeines Wochentages? (typisch = "5 Wochen") */
function hasFiveOccurrencesInMonth(y: number, m: number): boolean {
  const first = new Date(Date.UTC(y, m - 1, 1));
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const counts = Array(7).fill(0);
  for (let d = 1; d <= days; d++) {
    const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0..6 (So..Sa)
    counts[wd]++;
  }
  return counts.some(c => c >= 5);
}

/** Wochenfaktor für "x/Woche": standard 4.33, bei 5‑Wochen‑Monat = 5 */
function weeklyFactor(y: number, m: number): number {
  return hasFiveOccurrencesInMonth(y, m) ? 5 : 4.33;
}

/** Bewilligte Monatsmenge aus (menge, einheit) berechnen */
function toMonthlyApproved(menge: number, einheit: Einheit, y: number, m: number): number {
  const n = nz(menge);
  const unit = String(einheit || '').toLowerCase();
  if (unit.includes('woche')) return Math.floor(n * weeklyFactor(y, m));
  // default: bereits monatlich
  return Math.floor(n);
}

/** Preisauflösung (aus Tabelle oder Posten) */
function resolvePrice(code: LKCode, postenPrice: number | undefined, table: PriceTable): number {
  const c = norm(code);
  if (Number.isFinite(postenPrice)) return nz(postenPrice);
  return nz(table[c] ?? 0);
}
function resolveAUB(code: LKCode, postenAub: number | undefined, table: AUBTable): number {
  const c = norm(code);
  if (Number.isFinite(postenAub)) return nz(postenAub);
  return nz(table[c] ?? 0);
}

/** Hauptfunktion: berechnet BA- & Privatrechnung */
export function computeCorrection(
  bew: Bewilligung,
  inv: Invoice,
  opt: ComputeOptions
): CalcResult {
  const zinv = nz(opt.zinvSatz ?? 0.0338);
  const budget = nz(opt.pflegekassenBudget ?? 0);
  const { y, m } = parseMonthOrFallback(bew, opt.month);

  // 1) Bewilligung -> Monatslimits je LK
  const limit = new Map<LKCode, number>();
  for (const b of bew.leistungen || []) {
    if (!b) continue;
    const code = norm(b.code);
    const lim = toMonthlyApproved(nz(b.menge), b.einheit, y, m);
    limit.set(code, (limit.get(code) ?? 0) + lim);
  }

  // 2) Erbrachte Mengen je LK (aus OCR-Rechnung)
  const erbracht = new Map<LKCode, number>();
  const priceOver = new Map<LKCode, number>(); // evtl. vom OCR erkannte Preise (selten)
  const aubOver = new Map<LKCode, number>();
  for (const p of inv.positionen || []) {
    const code = norm(p.code);
    if (!code) continue;
    erbracht.set(code, (erbracht.get(code) ?? 0) + nz(p.menge));
    if (Number.isFinite(p.einzelpreis)) priceOver.set(code, nz(p.einzelpreis));
    if (Number.isFinite(p.aubPreis)) aubOver.set(code, nz(p.aubPreis));
  }

  // 3) Abrechenbare Mengen initial: min(erbracht, limit)
  const baMenge = new Map<LKCode, number>();
  const privatMenge = new Map<LKCode, number>();
  const allCodes = new Set<LKCode>([...erbracht.keys(), ...limit.keys()]);
  for (const c of allCodes) {
    const e = nz(erbracht.get(c));
    const l = nz(limit.get(c));
    const bill = Math.min(e, l);
    baMenge.set(c, bill);
    privatMenge.set(c, Math.max(0, e - bill));
  }

  // ---------- SONDERREGELN ----------

  // SR1: LK14 -> LK15
  {
    const e14 = nz(erbracht.get('LK14'));
    const e15 = nz(erbracht.get('LK15'));
    const l15 = nz(limit.get('LK15'));
    if (e14 > 0 || e15 > 0) {
      if (e14 + e15 <= l15) {
        // alles in LK15, LK14 = 0
        baMenge.set('LK14', 0);
        privatMenge.set('LK14', 0); // 14 verschwindet, wird über 15 abgerechnet
        baMenge.set('LK15', e14 + e15);
        privatMenge.set('LK15', 0);
      } else {
        // 14 nicht abrechenbar, 15 auf Limit
        baMenge.set('LK14', 0);
        privatMenge.set('LK14', e14);
        const bill15 = Math.min(e15, l15);
        baMenge.set('LK15', bill15);
        privatMenge.set('LK15', Math.max(0, e15 - bill15));
      }
    }
  }

  // SR2: LK04 ↔ LK02 (nur wenn LK04 bewilligt)
  {
    const l04 = nz(limit.get('LK04'));
    const e04 = nz(erbracht.get('LK04'));
    const e02 = nz(erbracht.get('LK02'));
    if (l04 > 0 && (e02 > 0 || e04 > 0)) {
      const bill04 = Math.min(e04, l04);
      const rest = Math.max(0, l04 - bill04); // verbleibende bewilligte Menge
      const bill02 = Math.min(e02, rest);

      baMenge.set('LK04', bill04);
      baMenge.set('LK02', bill02);
      privatMenge.set('LK04', Math.max(0, e04 - bill04));
      privatMenge.set('LK02', Math.max(0, e02 - bill02));
    } else if (l04 === 0 && e02 > 0) {
      // LK04 nicht bewilligt -> LK02 nicht durch SR2 legitimiert
      baMenge.set('LK02', 0);
      privatMenge.set('LK02', e02);
    }
  }

  // SR3: LK03a ↔ LK01 (nur wenn LK03a bewilligt)
  {
    const l03a = nz(limit.get('LK03a'));
    const e03a = nz(erbracht.get('LK03a'));
    const e01 = nz(erbracht.get('LK01'));
    if (l03a > 0 && (e01 > 0 || e03a > 0)) {
      const bill03a = Math.min(e03a, l03a);
      const rest = Math.max(0, l03a - bill03a);
      const bill01 = Math.min(e01, rest);

      baMenge.set('LK03a', bill03a);
      baMenge.set('LK01', bill01);
      privatMenge.set('LK03a', Math.max(0, e03a - bill03a));
      privatMenge.set('LK01', Math.max(0, e01 - bill01));
    } else if (l03a === 0 && e01 > 0) {
      // LK03a nicht bewilligt -> LK01 nicht durch SR3 legitimiert
      baMenge.set('LK01', 0);
      privatMenge.set('LK01', e01);
    }
  }

  // 4) Positionen + Summen bilden (BA & Privat)
  const mkPos = (code: LKCode, menge: number, price: number, isAUB = false): CalcLine | null => {
    if (menge <= 0) return null;
    const sum = EUR(menge * price);
    return { code, menge, einzelpreis: EUR(price), summe: sum, isAUB };
  };

  const priceOf = (c: LKCode) => resolvePrice(c, priceOver.get(c), opt.priceTable);
  const aubOf = (c: LKCode) => resolveAUB(c, aubOver.get(c), opt.aubTable);

  const baLines: CalcLine[] = [];
  const privatLines: CalcLine[] = [];

  const everyCode = new Set<LKCode>([
    ...baMenge.keys(),
    ...privatMenge.keys(),
    ...erbracht.keys(),
    ...limit.keys(),
  ]);

  for (const c0 of everyCode) {
    const c = norm(c0);

    // SR1: AUB immer nach Ziel-LK abrechnen, d.h. für 14->15 die AUB von 15
    const aubCode = (c === 'LK14') ? ('LK15' as LKCode) : c;

    const baQty = nz(baMenge.get(c));
    const prQty = nz(privatMenge.get(c));
    const p = priceOf(c);
    const aub = aubOf(aubCode);

    // BA-Positionen
    const baP = mkPos(c, baQty, p, false);
    const baA = mkPos(`${aubCode}-AUB`, baQty, aub, true);
    if (baP) baLines.push(baP);
    if (baA && aub > 0) baLines.push(baA);

    // Privat-Positionen
    const prP = mkPos(c, prQty, p, false);
    const prA = mkPos(`${aubCode}-AUB`, prQty, aub, true);
    if (prP) privatLines.push(prP);
    if (prA && aub > 0) privatLines.push(prA);
  }

  // Summen BA
  const baZw = EUR(baLines.reduce((s, x) => s + x.summe, 0));
  const baZinv = EUR(baZw * zinv);
  const baGes = EUR(baZw + baZinv);
  const baAbzug = Math.min(baGes, budget);
  const baBetrag = EUR(baGes - baAbzug);

  // Summen Privat (inkl. anteiliger ZINV)
  const prZw = EUR(privatLines.reduce((s, x) => s + x.summe, 0));
  const prZinv = EUR(prZw * zinv);
  const prGes = EUR(prZw + prZinv);

  // Wenn BA‑Betrag negativ (sollte aufgrund min() nicht passieren), schieben wir Differenz in Privat
  // oder wenn Budget größer als BA‑Gesamt war -> Differenz bleibt ohne weitere Umbuchung (BA wird 0)
  const privatEndbetrag = EUR(prGes + Math.max(0, budget - baGes));

  return {
    debug: {
      month: `${y}-${String(m).padStart(2, '0')}`,
      weeklyFactor: weeklyFactor(y, m),
      limit: Object.fromEntries(limit),
      erbracht: Object.fromEntries(erbracht),
      baMenge: Object.fromEntries(baMenge),
      privatMenge: Object.fromEntries(privatMenge),
    },
    ba: {
      positionen: baLines,
      zwischensumme: baZw,
      zinv: baZinv,
      gesamt: baGes,
      pflegekassenAbzug: EUR(baAbzug),
      rechnungsbetrag: baBetrag,
    },
    privat: {
      positionen: privatLines,
      zwischensumme: prZw,
      zinv: prZinv,
      gesamt: prGes,
      rechnungsbetrag: privatEndbetrag,
    },
  };
}
