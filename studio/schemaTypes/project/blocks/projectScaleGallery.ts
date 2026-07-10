import {defineField, defineType} from 'sanity'
import GalleryDropzoneInput from '../../../components/GalleryDropzoneInput'

export const projectScaleGallery = defineType({
  name: 'projectScaleGallery',
  title: 'Image & Video Gallery',
  type: 'object',
  fields: [
    defineField({
      name: 'media',
      title: 'Media',
      type: 'array',
      of: [{type: 'imageAsset'}, {type: 'videoAsset'}],
      components: {
        input: GalleryDropzoneInput,
      },
    }),
  ],
  preview: {
    prepare() {
      return {
        title: 'Image & Video Gallery',
      }
    },
  },
})
