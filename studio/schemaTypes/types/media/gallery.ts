import {defineType} from 'sanity'
import GalleryDropzoneInput from '../../../components/GalleryDropzoneInput'

export const gallery = defineType({
  name: 'gallery',
  title: 'Image & Video Gallery',
  type: 'array',
  of: [{type: 'imageAsset'}, {type: 'videoAsset'}],
  options: {layout: 'default'},
  components: {
    input: GalleryDropzoneInput,
  },
})
