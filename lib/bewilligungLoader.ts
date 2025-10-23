import { parseExcelBewilligung } from './excelParser'

const bewilligungMapping: Record<string, string> = {
  'Alijevic': 'Bewilligung Alijevic 01.01.25-31.12.25.xlsx',
  'Block': 'Bewilligung Block 16.05.25-30.04.26.xlsx',
  'Bollweber': 'Bewilligung Bollweber 01.01.25-31.12.25.xlsx',
  'Budach': 'Bewilligung Budach 01.08.25-31.07.26.xlsx',
  'Dreßler': 'Bewilligung Dreßler 01.04.25-31.03.26.xlsx',
  'Ewert': 'Bewilligung Ewert 01.01.25-31.12.25.xlsx',
  'Fialkowski': 'Bewilligung Fialkowski 01.06.25-30.11.25.xlsx',
  'Fritzsche': 'Bewilligung Fritzsche 24.07.25-30.06.26.xlsx',
  'Grapenhin': 'Bewilligung Grapenhin 20.08.25-31.07.26.xlsx',
  'Gullatz': 'Bewilligung Gullatz 02-12-2025.xlsx',
  'Hennings': 'Bewilligung Hennings 19.01.25-31.01.26.xlsx',
  'Hensler': 'Bewilligung Hensler 17.06.25-30.09.25.xlsx',
  'Konjetzky': 'Bewilligung Konjetzky 16.08.25-31.12.25.xlsx',
  'Köpke': 'Bewilligung Köpke 01.06.25-31.12.25.xlsx',
  'Mankowski': 'Bewilligung Mankowski 01.06.25-31.12.25.xlsx',
  'Nakoinz': 'Bewilligung Nakoinz 01.04.25-31.03.226.xlsx',
  'Ortmann': 'Bewilligung Ortmann 01.06.25-01.06.26.xlsx',
  'Plümpe': 'Bewilligung Plümpe 01.12.24-30.11.25.xlsx',
  'Rudek': 'Bewilligung Rudek 01.01.25-31.12.25.xlsx',
  'Schlotzhauer': 'Bewilligung Schlotzhauer 01.08.25-31.07.26.xlsx',
  'Schmideder': 'Bewilligung Schmideder 01.07.25-30.06.26.xlsx',
  'Sommermann': 'Bewilligung Sommermann 01.02.25-31.12.25.xlsx',
  'Sweidan': 'Bewilligung Sweidan 01.04.25-31.10.25.xlsx',
  'Tschida': 'Bewilligung Tschida 01.01.25-31.12.25.xlsx'
}

export async function loadBewilligungForKlient(nachname: string) {
  const filename = bewilligungMapping[nachname]
  if (!filename) {
    console.error(`❌ Keine Bewilligung für ${nachname} gefunden`)
    return null
  }

  try {
    const result = await parseExcelBewilligung(`/Bewilligungen/${filename}`)
    console.log(`✅ Excel-Bewilligung geladen für ${nachname}:`, result)
    return result
  } catch (error) {
    console.error(`❌ Fehler beim Laden der Excel-Bewilligung für ${nachname}:`, error)
    return null
  }
}

export function getAllKlientenNames(): string[] {
  return Object.keys(bewilligungMapping).sort()
}
