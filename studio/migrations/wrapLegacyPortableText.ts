import {defineMigration, set} from 'sanity/migrate'

const DEFAULT_LANGUAGE = 'en'
const PORTABLE_TEXT_FIELDS = new Set(['description', 'selectedClients'])

function isPortableTextArray(node: unknown) {
  return Array.isArray(node) && node.some((item) => item?._type === 'block')
}

function isInternationalizedArray(node: unknown) {
  return (
    Array.isArray(node) &&
    node.some(
      (item) =>
        typeof item?._type === 'string' &&
        item._type.startsWith('internationalizedArray') &&
        item._type.endsWith('Value'),
    )
  )
}

export default defineMigration({
  title: 'Wrap legacy Portable Text in internationalized arrays',
  documentTypes: ['project', 'info'],
  migrate: {
    array(node, path) {
      const fieldName = typeof path[0] === 'string' ? path[0] : null

      if (!fieldName || path.length !== 1 || !PORTABLE_TEXT_FIELDS.has(fieldName)) return
      if (!isPortableTextArray(node) || isInternationalizedArray(node)) return

      return set([
        {
          _key: `${DEFAULT_LANGUAGE}_${fieldName}`,
          _type: 'internationalizedArrayPortableTextValue',
          language: DEFAULT_LANGUAGE,
          value: node,
        },
      ])
    },
  },
})
