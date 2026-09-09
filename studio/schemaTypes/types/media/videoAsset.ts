import {defineType, defineField} from 'sanity'

export const videoAsset = defineType({
  name: 'videoAsset',
  title: 'Video',
  type: 'object',
  fields: [
    defineField({
      name: 'file',
      title: 'File',
      type: 'mux.video',
      options: {
        collapsible: false,
        collapsed: false,
      },
    }),
    defineField({
      name: 'caption',
      type: 'internationalizedArrayString',
    }),
    defineField({
      name: 'subcaption',
      type: 'internationalizedArrayString',
    }),
    defineField({
      name: 'altText',
      title: 'Alt Text (Wichtig für SEO and Barrierefreiheit)',
      type: 'string',
    }),
  ],
  preview: {
    select: {
      video: 'video',
      subtitle: 'copyright',
    },
    prepare({video, subtitle}) {
      return {
        media: video,
        subtitle: subtitle,
      }
    },
  },
})
