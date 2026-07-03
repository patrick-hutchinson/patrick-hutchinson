import {defineType} from 'sanity'

export const mediaAsset = defineType({
  name: 'mediaAsset',
  title: 'Media',
  type: 'array',
  of: [{type: 'imageAsset'}, {type: 'videoAsset'}],
  validation: (rule) => rule.max(1),
})
