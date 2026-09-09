import {defineMigration, set} from 'sanity/migrate'

const TRANSLATIONS: Record<string, string> = {
  'Creative Direction': 'Kreativdirektion',
  Design: 'Gestaltung',
  'Motion Design': 'Motiondesign',
}

function isInternationalizedStringArray(node: unknown) {
  return (
    Array.isArray(node) &&
    node.some((item) => item?._type === 'internationalizedArrayStringValue')
  )
}

export default defineMigration({
  title: 'Translate remaining project string values',
  documentTypes: ['project'],
  migrate: {
    array(node) {
      if (!isInternationalizedStringArray(node)) return

      const englishValue = node.find((item) => item?.language === 'en')?.value
      const germanItem = node.find((item) => item?.language === 'de')
      const germanValue = englishValue ? TRANSLATIONS[englishValue] : null

      if (!germanValue || !germanItem || germanItem.value === germanValue) return

      return set(
        node.map((item) =>
          item?.language === 'de'
            ? {
                ...item,
                value: germanValue,
              }
            : item,
        ),
      )
    },
  },
})
