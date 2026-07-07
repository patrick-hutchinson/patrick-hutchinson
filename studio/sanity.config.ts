import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'

import {muxInput} from 'sanity-plugin-mux-input'

import {structure} from './structure'

export default defineConfig({
  name: 'default',
  title: 'patrickhutchinson-studio',

  projectId: '4w6ym7wy',
  dataset: 'production',

  plugins: [structureTool({structure}), visionTool(), muxInput()],

  schema: {
    types: schemaTypes,
  },
})
