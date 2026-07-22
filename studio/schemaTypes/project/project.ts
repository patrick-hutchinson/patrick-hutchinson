import {defineField, defineType, defineArrayMember} from 'sanity'

export const project = defineType({
  name: 'project',
  title: 'Project',
  type: 'document',

  fields: [
    defineField({
      name: 'title',
      title: 'Project Title',
      type: 'string',
    }),
    defineField({
      name: 'description',
      title: 'Project Description',
      type: 'portableText',
    }),

    defineField({
      name: 'scheduling',
      type: 'object',
      options: {columns: 3},
      fields: [
        {name: 'month', type: 'string'},
        {name: 'year', type: 'string'},
        {name: 'location', type: 'string'},
      ],
    }),

    defineField({
      name: 'client',
      type: 'string',
    }),
    defineField({
      name: 'categories',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'category'}]}],
      options: {
        sortable: true,
      },
      validation: (Rule) => Rule.unique(),
    }),
    defineField({name: 'thumbnail', title: 'Thumbnail', type: 'mediaAsset'}),
    defineField({name: 'thumbnail_mobile', title: 'Thumbnail (Mobile)', type: 'mediaAsset'}),
    defineField({name: 'coverMedia', title: 'Cover Media', type: 'mediaAsset'}),
    defineField({name: 'coverMedia_mobile', title: 'Cover Media (Mobile)', type: 'mediaAsset'}),

    defineField({
      name: 'pageBuilder',
      title: 'Page Builder',
      type: 'array',
      of: [
        defineArrayMember({name: 'projectFullscreenMedium', type: 'projectFullscreenMedium'}),
        defineArrayMember({name: 'projectScaleGallery', type: 'projectScaleGallery'}),
      ],
    }),

    // defineField({
    //   name: 'gallery',
    //   title: 'Gallery',
    //   type: 'array',
    //   of: [{type: 'galleryRow'}],
    //   validation: (Rule) => Rule.required(),
    // }),
    defineField({
      name: 'credits',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({name: 'role', title: 'Role', type: 'string'}),
            defineField({
              name: 'entries',
              title: 'Entries',
              type: 'array',
              of: [{type: 'string', name: 'entry'}],
            }),
          ],
        },
      ],
    }),
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
    defineField({name: 'link', type: 'link'}),
    defineField({
      name: 'slug',
      title: 'slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      title: 'title',
    },
    prepare({title}) {
      return {
        title,
      }
    },
  },
})
