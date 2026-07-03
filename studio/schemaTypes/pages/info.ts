import {defineField, defineType} from 'sanity'

export const info = defineType({
  name: 'info',
  type: 'document',
  fields: [
    defineField({name: 'description', type: 'portableText'}),
    defineField({name: 'selectedClients', type: 'portableText'}),
    defineField({
      name: 'contact',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {name: 'platform', title: 'Platform', type: 'string'},
            {name: 'link', title: 'url', type: 'string'},
          ],
        },
      ],
    }),
    defineField({name: 'VATNumber', type: 'string'}),
    defineField({name: 'CV', type: 'file'}),
  ],

  preview: {
    prepare: () => ({title: 'Archive'}),
  },
})
