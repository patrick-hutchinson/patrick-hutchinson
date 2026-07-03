import {defineType, defineArrayMember} from 'sanity'

export const portableText = defineType({
  name: 'portableText',
  title: 'Rich Text',
  type: 'array',
  of: [
    // ---- TEXT BLOCK ----
    defineArrayMember({
      type: 'block',
      // styles: [{title: 'Normal', value: 'normal'}],
      lists: [
        {title: 'Bullet', value: 'bullet'},
        {title: 'Numbered', value: 'number'},
      ],
      marks: {
        decorators: [
          {title: 'Emphasis', value: 'em'},
          {title: 'Strong', value: 'strong'},
        ],
        annotations: [
          {
            name: 'link',
            title: 'Link',
            type: 'link',
          },
        ],
      },
    }),
  ],
})
