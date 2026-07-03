import {defineField, defineType} from 'sanity'

export const home = defineType({
  name: 'home',
  type: 'document',
  fields: [
    defineField({
      name: 'selection',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{type: 'experience'}, {type: 'project'}, {type: 'publicity'}],
        },
      ],
    }),
  ],
  preview: {
    prepare: () => ({title: 'Home'}),
  },
})
