import {defineField, defineType} from 'sanity'

export const site = defineType({
  name: 'site',
  title: 'Site',
  type: 'document',

  fields: [
    defineField({
      name: 'title',
      title: 'Website Name',
      description: 'As seen on Google Search Results and Tab Bar',
      type: 'string',
    }),
    defineField({
      name: 'description',
      title: 'Website Description',
      type: 'string',
      description: 'As seen on Google Search Results (max. 160 characters)',
      validation: (Rule) => Rule.max(160),
    }),
    defineField({
      name: 'favicon',
      title: 'Favicon Source Image',
      description:
        'Upload a square image (recommended 512x512 or larger). The site will generate all favicon sizes from this source.',
      type: 'image',
      options: {
        hotspot: false,
      },
    }),
    defineField({
      name: 'focusColors',
      title: 'Focus Color Pairs',
      description: 'Color pairs used as the pool for randomly selected focus states.',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'focusColorPair',
          title: 'Focus Color Pair',
          fields: [
            defineField({
              name: 'background',
              title: 'Background Color',
              type: 'string',
              validation: (Rule) =>
                Rule.required()
                  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, {
                    name: 'hex color',
                    invert: false,
                  })
                  .error('Use a hex color, for example #f00000.'),
            }),
            defineField({
              name: 'foreground',
              title: 'Font Color',
              type: 'string',
              validation: (Rule) =>
                Rule.required()
                  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, {
                    name: 'hex color',
                    invert: false,
                  })
                  .error('Use a hex color, for example #ffffff.'),
            }),
          ],
          preview: {
            select: {
              background: 'background',
              foreground: 'foreground',
            },
            prepare: ({background, foreground}) => ({
              title: background || 'Focus color',
              subtitle: foreground ? `Font: ${foreground}` : undefined,
            }),
          },
        },
      ],
    }),
    defineField({
      name: 'address',
      type: 'object',
      options: {
        columns: 3,
      },
      fields: [
        {
          name: 'street',
          title: 'Street',
          type: 'string',
          options: {columns: 3}, // full width
        },
        {
          name: 'postcode',
          title: 'Post code',
          type: 'string',
        },
        {
          name: 'city',
          title: 'City',
          type: 'string',
        },
        {
          name: 'country',
          title: 'Country',
          type: 'string',
        },
      ],
    }),
    defineField({
      name: 'email',
      type: 'string',
    }),
    defineField({
      name: 'phone',
      type: 'string',
    }),
    defineField({
      name: 'VAT',
      type: 'string',
    }),
  ],
  preview: {
    prepare: () => ({title: 'Site'}),
  },
})
