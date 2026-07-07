import {defineField, defineType} from 'sanity'
import GalleryDropzoneInput from '../../../components/GalleryDropzoneInput'

export const gallery = defineType({
  name: 'gallery',
  title: 'Image & Video Gallery',
  type: 'array',
  of: [{type: 'imageAsset'}, {type: 'videoAsset'}],
  components: {
    input: GalleryDropzoneInput,
  },
})

export const galleryRow = defineType({
  name: 'galleryRow',
  title: 'Gallery Row',
  type: 'object',
  fields: [
    defineField({
      name: 'media',
      title: 'Media',
      type: 'gallery',
      validation: (Rule) => Rule.required().min(1),
    }),
  ],
  preview: {
    select: {
      media: 'media',
      previewImage: 'media.0.file',
    },
    prepare({media, previewImage}) {
      const count = media?.length || 0

      return {
        title: `Gallery row`,
        subtitle: `${count} media item${count === 1 ? '' : 's'}`,
        media: previewImage,
      }
    },
  },
})
