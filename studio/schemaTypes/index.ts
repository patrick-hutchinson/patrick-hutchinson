import {site} from './site'

// Types
import {imageAsset} from './types/media/imageAsset'
import {link} from './types/link'
import {mediaAsset} from './types/media/mediaAsset'
import {portableText} from './types/portableText'
import {videoAsset} from './types/media/videoAsset'
import {category} from './types/category'
import {project} from './project/project'
import {experience} from './experience'
import {publicity} from './publicity'
import {pages} from './pages'
import {gallery, galleryRow} from './types/media/gallery'
import {projectFullscreenMedium} from './project/blocks/projectFullscreenMedium'
import {projectScaleGallery} from './project/blocks/projectScaleGallery'

const types = [
  imageAsset,
  videoAsset,
  mediaAsset,
  portableText,
  link,
  category,
  gallery,
  galleryRow,
]
const objects = [project, experience, publicity]
const blocks = [projectFullscreenMedium, projectScaleGallery]

export const schemaTypes = [site, ...types, ...objects, ...blocks, ...pages]
