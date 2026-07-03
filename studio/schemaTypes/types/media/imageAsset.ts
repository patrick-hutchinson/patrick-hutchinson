import {defineType, defineField} from 'sanity'

const formatDate = (value?: string) => {
  const date = value ? new Date(value) : new Date()
  if (Number.isNaN(date.getTime())) return new Date().toLocaleDateString()
  return date.toLocaleDateString()
}

const formatMegabytes = (bytes?: number) => {
  if (typeof bytes !== 'number' || Number.isNaN(bytes) || bytes <= 0) return null
  const mb = bytes / (1024 * 1024)
  return `${mb.toFixed(2)}MB`
}

export const imageAsset = defineType({
  name: 'imageAsset',
  title: 'Image',
  type: 'object',
  fields: [
    defineField({
      name: 'file',
      title: 'File',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({
      title: 'Title (Displayed in the Archive)',
      name: 'altText',
      type: 'string',
    }),
  ],
  preview: {
    select: {
      file: 'file',
      altText: 'altText',
      copyright: 'copyright',
      uploadedAt: 'file.asset._createdAt',
      size: 'file.asset.size',
    },
    prepare({file, altText, copyright, uploadedAt, size}) {
      const title = altText?.trim() || 'Image'
      const subtitleParts = [copyright?.trim() || `Uploaded ${formatDate(uploadedAt)}`]
      const sizeLabel = formatMegabytes(size)

      if (sizeLabel) subtitleParts.push(sizeLabel)
      if (typeof size === 'number' && size > 2 * 1024 * 1024) {
        subtitleParts.push('⚠️ File is above 2 MB')
      }

      const subtitle = subtitleParts.join(' • ')

      return {
        title,
        media: file,
        subtitle,
      }
    },
  },
})
