import {defineField, defineType} from 'sanity'

export const publicity = defineType({
  name: 'publicity',
  type: 'document',
  fields: [
    defineField({name: 'title', type: 'string'}),
    defineField({name: 'year', type: 'string'}),
    defineField({name: 'location', type: 'string'}),
    defineField({name: 'thumbnail', type: 'mediaAsset'}),
    defineField({name: 'gallery', type: 'gallery'}),
    defineField({name: 'link', type: 'link'}),
  ],
})
