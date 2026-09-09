import {defineField, defineType} from 'sanity'

export const experience = defineType({
  name: 'experience',
  type: 'document',
  fields: [
    defineField({name: 'title', type: 'internationalizedArrayString'}),
    defineField({name: 'year', type: 'string'}),
    defineField({name: 'location', type: 'internationalizedArrayString'}),
    defineField({name: 'thumbnail', type: 'mediaAsset'}),
    defineField({name: 'gallery', type: 'gallery'}),
    defineField({name: 'link', type: 'link'}),
  ],
})
