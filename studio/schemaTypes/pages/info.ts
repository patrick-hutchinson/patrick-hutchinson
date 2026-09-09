import {defineField, defineType} from 'sanity'

export const info = defineType({
  name: 'info',
  type: 'document',
  fields: [
    defineField({name: 'description', type: 'internationalizedArrayPortableText'}),
    defineField({name: 'selectedClients', type: 'internationalizedArrayPortableText'}),
    defineField({
      name: 'socials',
      title: 'Socials',
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
    defineField({name: 'recommendations', type: 'file'}),
  ],

  preview: {
    prepare: () => ({title: 'Info'}),
  },
})
