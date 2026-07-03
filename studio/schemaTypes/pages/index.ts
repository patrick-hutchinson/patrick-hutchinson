import type {SchemaTypeDefinition} from 'sanity'

type PageSchemaModule = Record<string, SchemaTypeDefinition>

const pageModules = import.meta.glob<PageSchemaModule>(['./*.ts', '!./index.ts'], {
  eager: true,
})

export const pages = Object.values(pageModules)
  .flatMap((module) => Object.values(module))
  .filter((schema) => schema?.type === 'document' && typeof schema.name === 'string')

export const pageReferenceTypes = pages.map(({name}) => ({type: name}))
