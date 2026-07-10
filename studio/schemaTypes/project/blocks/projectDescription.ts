import {defineField, defineType} from 'sanity'

export const projectDescription = defineType({
  name: 'projectDescription',
  title: 'Project Description',
  type: 'object',
  fields: [
    defineField({
      name: 'text',
      title: 'Text',
      type: 'portableText',
    }),
  ],
  preview: {
    prepare() {
      return {
        title: 'Project Description',
      }
    },
  },
})
