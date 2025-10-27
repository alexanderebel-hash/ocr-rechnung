/* lib/billing/prices.ts */
import type { PriceTable, AUBTable } from './calc';

export const PRICES: PriceTable = {
  LK01: 13.31,      // Erweiterte Kleine Körperpflege
  LK02: 9.18,       // Kleine Körperpflege
  LK03a: 19.97,     // Erweiterte Große Körperpflege
  LK04: 16.64,      // Große Körperpflege
  LK07a: 6.77,      // Hilfe beim Aufstehen/Zubettgehen
  LK11b: 18.80,     // Hilfe bei der Nahrungsaufnahme (besonders aufwändig)
  LK12: 9.41,       // Hilfe bei der Nahrungsaufnahme
  LK13: 4.45,       // Hilfe beim Verlassen/Wiederaufsuchen der Wohnung
  LK14: 22.29,      // Warme Mahlzeit (wird zu LK15)
  LK15: 4.80,       // Kleine Mahlzeit
  LK17a: 20.85,     // Hauswirtschaftliche Versorgung (aufwändig)
  LK17b: 26.47,     // Hauswirtschaftliche Versorgung (besonders aufwändig)
  'LK20_HH': 7.87,  // Hausbesuch (hauswirtschaftlich)
  'LK20.1': 7.87,   // Hausbesuch (pflegerisch)
  'LK20.2': 7.87,   // Hausbesuch (pflegerisch)
};

export const AUB: AUBTable = {
  // AUB ist 1:1 je Stück
  LK01: 0.15,
  LK02: 0.15,
  LK03a: 0.15,
  LK04: 0.15,
  LK07a: 0.15,
  LK11b: 0.15,
  LK12: 0.15,
  LK13: 0.15,
  LK14: 0,          // nicht direkt abrechnen (wird zu LK15)
  LK15: 0.17,       // wichtig für SR1
  LK17a: 0.15,
  LK17b: 0.15,
  'LK20_HH': 0.15,
  'LK20.1': 0.15,
  'LK20.2': 0.15,
};
