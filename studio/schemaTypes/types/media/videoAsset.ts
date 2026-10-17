import {defineType, defineField} from 'sanity'
import {createElement} from 'react'

export const videoAsset = defineType({
  name: 'videoAsset',
  title: 'Video',
  type: 'object',
  fields: [
    defineField({
      name: 'file',
      title: 'File',
      type: 'mux.video',
      options: {
        collapsible: false,
        collapsed: false,
      },
    }),
    defineField({
      name: 'caption',
      type: 'internationalizedArrayString',
    }),
    defineField({
      name: 'subcaption',
      type: 'internationalizedArrayString',
    }),
    defineField({
      name: 'altText',
      title: 'Alt Text (Wichtig für SEO and Barrierefreiheit)',
      type: 'string',
    }),
  ],
  preview: {
    select: {
      playbackId: 'file.asset.playbackId',
    },
    prepare({playbackId}) {
      return {
        title: 'MUX Video',
        media: playbackId
          ? createElement('img', {
              src: `https://image.mux.com/${encodeURIComponent(playbackId)}/thumbnail.jpg?time=0&width=160&fit_mode=preserve`,
              alt: 'MUX Video thumbnail',
              style: {width: '100%', height: '100%', objectFit: 'cover'},
            })
          : undefined,
      }
    },
  },
})
