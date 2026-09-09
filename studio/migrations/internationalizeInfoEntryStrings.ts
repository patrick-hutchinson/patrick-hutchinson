import {defineMigration, set} from 'sanity/migrate'

const INFO_ENTRY_STRING_FIELDS = new Set(['title', 'location'])

const TRANSLATIONS: Record<string, string> = {
  'Amsterdam, The Netherlands': 'Amsterdam, Niederlande',
  'Artist in Residency at -1 Digital Lab (Nieuwe Instituut)':
    'Artist in Residence im -1 Digital Lab (Nieuwe Instituut)',
  "Best Dutch Book Design 21' Jury Member": "Jurymitglied Best Dutch Book Design 21'",
  'Best Dutch Book Design 21’ Jury Member ‘22': 'Jurymitglied Best Dutch Book Design 21’ ‘22',
  'Best Graduation Project: Dutch Design Yearbook 23-24':
    'Best Graduation Project: Dutch Design Yearbook 23-24',
  'BA Graphic Design, Royal Academy of Art (KABK)': 'BA Grafikdesign, Royal Academy of Art (KABK)',
  'Exchange Semester, Aalto University': 'Auslandssemester, Aalto University',
  "Featured: BNO Dutch Design Yearbook '23-'24": "Vorgestellt: BNO Dutch Design Yearbook '23-'24",
  'Graduation from Graphic Design Bachelors at KABK':
    'Abschluss im Bachelor Grafikdesign an der KABK',
  'Guest Lecturer — Desina Festival': 'Gastdozent — Desina Festival',
  'Head of Creative Coding at Studio Es': 'Head of Creative Coding bei Studio Es',
  'Helsinki, Finland': 'Helsinki, Finnland',
  'Internship at GG–OFFICE': 'Praktikum bei GG–OFFICE',
  'Internship at Studio Es': 'Praktikum bei Studio Es',
  'Internship, GG–OFFICE': 'Praktikum, GG–OFFICE',
  'Internship, Studio Es': 'Praktikum, Studio Es',
  'Joining GG—OFFICE as a guest speaker at Desina Festival':
    'Gastvortrag für GG—OFFICE beim Desina Festival',
  'Joining Studio Es as Head Creative Coder': 'Einstieg bei Studio Es als Head Creative Coder',
  'Modica, Sicily, Italy': 'Modica, Sizilien, Italien',
  'Naples, Italy': 'Neapel, Italien',
  'Rotterdam, Netherlands': 'Rotterdam, Niederlande',
  'Rotterdam, The Netherlands': 'Rotterdam, Niederlande',
  'Semester Abroad at Aalto University': 'Auslandssemester an der Aalto University',
  'Panel guest — NADD Open Day, Het Nieuwe Instituut':
    'Panelgast — NADD Open Day, Het Nieuwe Instituut',
  'Speaker at the NADD Open Day, Nieuwe Instituut':
    'Vortrag beim NADD Open Day, Nieuwe Instituut',
  'The Hague, The Netherlands': 'Den Haag, Niederlande',
  'Vienna, Austria': 'Wien, Österreich',
}

function translateString(value: string) {
  return TRANSLATIONS[value] || value
}

function toInternationalizedString(value: string, keyPrefix: string) {
  return [
    {
      _key: `${keyPrefix}_en`,
      _type: 'internationalizedArrayStringValue',
      language: 'en',
      value,
    },
    {
      _key: `${keyPrefix}_de`,
      _type: 'internationalizedArrayStringValue',
      language: 'de',
      value: translateString(value),
    },
  ]
}

export default defineMigration({
  title: 'Internationalize info entry titles and locations',
  documentTypes: ['experience', 'publicity'],
  migrate: {
    string(node, path) {
      const fieldName = path.at(-1)

      if (typeof fieldName !== 'string' || !INFO_ENTRY_STRING_FIELDS.has(fieldName) || !node.trim()) return

      return set(toInternationalizedString(node, fieldName))
    },
  },
})
