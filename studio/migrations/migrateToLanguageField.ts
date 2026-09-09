import {migrateToLanguageField} from 'sanity-plugin-internationalized-array/migrations'

const DOCUMENT_TYPES = ['project', 'info']

export default migrateToLanguageField(DOCUMENT_TYPES)
