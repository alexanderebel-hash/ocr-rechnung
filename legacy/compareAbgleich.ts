import { BewilligungsEintrag, RechnungEintrag } from "./approvalsTypes";

export interface AbgleichZeile extends BewilligungsEintrag {
  /** Tatsächlich erbrachte Anzahl (laut Rechnung) */
  erbrachteAnzahl: number | null;
  /** Differenz zwischen erbrachter und bewilligter Anzahl */
  delta: number | null;
  /** Ergebnis-Kategorie */
  abweichung:
    | "OK"
    | "ZU_WENIG"
    | "ZU_VIEL"
    | "NICHT_BEWILLIGT"
    | "NICHT_ERBRACHT";
}

/**
 * Vergleicht zwei Datensätze (Bewilligung + Rechnung)
 * und berechnet je LK:
 *  - bewilligt (Monat, optional via Wochen→Monat)
 *  - erbracht
 *  - Delta
 *  - Status / Abweichung
 */
export function vergleicheBewilligungMitRechnung(
  bew: BewilligungsEintrag[],
  rch: RechnungEintrag[],
  opts?: { ableitungMonatAusWoche?: boolean; faktorWochenZuMonat?: number }
): AbgleichZeile[] {
  const faktor = opts?.faktorWochenZuMonat ?? 4.3;

  const key = (s: string) => (s || "").trim().toUpperCase();
  const rchMap = new Map<string, RechnungEintrag>();
  for (const r of rch) rchMap.set(key(r.lkCode), r);

  const rows: AbgleichZeile[] = bew.map((b) => {
    const k = key(b.lkCode);
    const r = rchMap.get(k) ?? null;

    const bewProMonat =
      b.bewilligtProMonat != null
        ? b.bewilligtProMonat
        : opts?.ableitungMonatAusWoche && b.bewilligtProWoche != null
        ? Math.round((b.bewilligtProWoche as number) * faktor)
        : null;

    const erbrachte = r?.anzahlImMonat ?? null;

    let abweichung: AbgleichZeile["abweichung"] = "OK";
    let delta: number | null = null;

    if (bewProMonat == null && erbrachte == null) {
      abweichung = "NICHT_ERBRACHT";
    } else if (bewProMonat == null && erbrachte != null) {
      abweichung = "NICHT_BEWILLIGT";
      delta = erbrachte;
    } else if (bewProMonat != null && erbrachte == null) {
      abweichung = "NICHT_ERBRACHT";
      delta = -bewProMonat;
    } else {
      delta = (erbrachte as number) - (bewProMonat as number);
      abweichung = delta === 0 ? "OK" : delta > 0 ? "ZU_VIEL" : "ZU_WENIG";
    }

    return {
      ...b,
      bewilligtProMonat: bewProMonat ?? null,
      erbrachteAnzahl: erbrachte,
      delta,
      abweichung,
    };
  });

  // Ergänze Positionen, die nur in der Rechnung vorkommen
  for (const r of rch) {
    const k = key(r.lkCode);
    const exists = rows.some((z) => key(z.lkCode) === k);
    if (!exists) {
      rows.push({
        lkCode: r.lkCode,
        leistungsbezeichnung: r.leistungsbezeichnung || "",
        bewilligtProWoche: null,
        bewilligtProMonat: null,
        erbrachteAnzahl: r.anzahlImMonat,
        delta: r.anzahlImMonat,
        abweichung: "NICHT_BEWILLIGT",
      });
    }
  }

  return rows;
}
