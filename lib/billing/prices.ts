/* Central LK price table (EUR per unit) plus detailed tariff tables. */
import type { PriceTable, AUBTable } from './calc';

/**
 * Berliner Pflegesystem 2025 - Offizielle Preise
 * Quelle: Vorlage_Korrekturblatt_.xlsx
 */

export const PRICES: PriceTable = {
  LK01: 25.51,      // Erweiterte kleine Körperpflege
  LK02: 17.01,      // Kleine Körperpflege
  LK03a: 38.30,     // Erweiterte große Körperpflege
  LK03b: 51.02,     // Erweiterte große Körperpflege m. Baden
  LK04: 34.01,      // Große Körperpflege
  LK05: 8.50,       // Lagern/Betten
  LK06: 21.30,      // Hilfe bei der Nahrungsaufnahme
  LK07a: 6.77,      // Darm- und Blasenentleerung
  LK07b: 17.01,     // Darm- und Blasenentleerung erweitert
  LK08a: 5.94,      // Hilfestelll. beim Verl.o.Wiederaufs. d. Wohng.
  LK08b: 5.94,      // Hilfestellung beim Wiederaufsuchen der Wohnung
  LK09: 51.02,      // Begleitung ausser Haus
  LK11a: 7.43,      // Kleine Reinigung der Wohnung
  LK11b: 22.29,     // Große Reinigung der Wohnung
  LK12: 39.62,      // Wechseln u. Waschen der Kleidung
  LK13: 19.81,      // Einkaufen
  LK14: 22.29,      // Zubereitung warme Mahlzeit
  LK15: 7.43,       // Zubereitung kleine Mahlzeit
  LK17a: 5.37,      // Einsatzpauschale
  LK17b: 10.73,     // Einsatzpauschale WE
  LK20: 8.26,       // Häusliche Betreuung §124 SGB XI
  'LK20_HH': 8.26,  // Häusliche Betreuung §124 SGB XI (Haushaltsbuch)
  'LK20.1': 8.26,   // Häusliche Betreuung §124 SGB XI
  'LK20.2': 8.26,   // Häusliche Betreuung §124 SGB XI (Haushaltsbuch)
};

/**
 * Ausbildungsumlage (AUB) pro LK
 * Wird 1:1 je Stück berechnet
 */
export const AUB: AUBTable = {
  LK01: 0.59,
  LK02: 0.39,
  LK03a: 0.88,
  LK03b: 1.17,
  LK04: 0.78,
  LK05: 0.20,
  LK06: 0.49,
  LK07a: 0.16,
  LK07b: 0.39,
  LK08a: 0.14,
  LK08b: 0.14,
  LK09: 1.17,
  LK11a: 0.17,
  LK11b: 0.51,
  LK12: 0.91,
  LK13: 0.46,
  LK14: 0.51,
  LK15: 0.17,
  LK17a: 0.12,
  LK17b: 0.25,
  LK20: 0.19,
  'LK20_HH': 0.19,
  'LK20.1': 0.19,
  'LK20.2': 0.19,
};

/**
 * ZINV (Zusätzliche Investitionskosten)
 * 3,38% auf Zwischensumme (LK + AUB)
 */
export const ZINV_RATE = 0.0338;

export const prices: Record<string, number> = {
  LK01: 13.12,
  LK02: 17.54,
  LK03a: 23.90,
  LK03b: 26.70,
  LK04: 20.55,
  LK05: 5.40,
  LK06: 3.60,
  LK07a: 4.25,
  LK07b: 6.20,
  LK11b: 8.90,
  LK12: 9.20,
  LK13: 7.30,
  LK14: 9.62,
  LK15: 7.44,
  LK17a: 3.50,
  LK17b: 4.10,
  LK20: 8.26,
  LK20_HH: 8.26,
};
