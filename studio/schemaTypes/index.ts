import {site} from './site'

// Types
import {imageAsset} from './types/media/imageAsset'
import {link} from './types/link'
import {mediaAsset} from './types/media/mediaAsset'
import {portableText} from './types/portableText'
import {videoAsset} from './types/media/videoAsset'
import {category} from './types/category'
import {project} from './project'
import {experience} from './experience'
import {publicity} from './publicity'
import {pages} from './pages'
import {gallery} from './types/media/gallery'

const types = [imageAsset, videoAsset, mediaAsset, portableText, link, category, gallery]
const objects = [project, experience, publicity]

export const schemaTypes = [site, ...types, ...objects, ...pages]
