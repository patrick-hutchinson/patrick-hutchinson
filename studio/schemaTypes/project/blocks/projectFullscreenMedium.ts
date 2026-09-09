import {defineField, defineType} from 'sanity'

export const projectFullscreenMedium = defineType({
  name: 'projectFullscreenMedium',
  title: 'Fullscreen Medium',
  type: 'object',
  fields: [
    defineField({
      name: 'medium',
      title: 'Medium',
      type: 'mediaAsset',
    }),
    defineField({name: 'caption', type: 'internationalizedArrayString'}),
    defineField({name: 'subcaption', type: 'internationalizedArrayString'}),
  ],
  preview: {
    prepare() {
      return {
        title: 'Fullscreen Medium',
      }
    },
  },
})
