import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {internationalizedArray} from 'sanity-plugin-internationalized-array'
import {schemaTypes} from './schemaTypes'

import {muxInput} from 'sanity-plugin-mux-input'

import {structure} from './structure'

export default defineConfig({
  name: 'default',
  title: 'patrickhutchinson-studio',

  projectId: '4w6ym7wy',
  dataset: 'production',

  plugins: [
    structureTool({structure}),
    visionTool(),
    muxInput(),
    internationalizedArray({
      languages: [
        {id: 'en', title: 'English'},
        {id: 'de', title: 'German'},
      ],
      defaultLanguages: ['en'],
      fieldTypes: ['portableText', 'string'],
    }),
  ],

  schema: {
    types: schemaTypes,
  },
})
