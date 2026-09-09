import { localizedString, mediaAssetFragment } from "./fragments";

const localizedPortableText = (fieldName) => `"${fieldName}": coalesce(
  ${fieldName}[_type == "internationalizedArrayPortableTextValue" && language == $language][0].value,
  ${fieldName}[_type == "internationalizedArrayPortableTextValue" && language == "en"][0].value,
  ${fieldName}[_type == "internationalizedArrayPortableTextValue" && language == "de"][0].value,
  ${fieldName}[_type == "internationalizedArrayPortableTextValue"][0].value,
  ${fieldName}[_key == $language][0].value,
  ${fieldName}[_key == "en"][0].value,
  ${fieldName}[_key == "de"][0].value,
  ${fieldName}[0].value,
  ${fieldName}
)`;

export const siteQuery = `*[_type=="site"][0]{
  title,
  favicon{
    asset->{
      url
    }
  },
  description,
  address,
  email,
  phone,
  socials[]{
    platform,
    link
  },
}`;

export const homeQuery = `*[_type=="home"][0]{
  selection[]->{
    _type == "project" => {
      _id,
      _type,
      title,
      client,
      categories[]->{
        _id,
        name,
      },
      scheduling,
      ${localizedPortableText("description")},
      credits[]{
        "role": ${localizedString("role")},
        entries
      },
      thumbnail[0] ${mediaAssetFragment},
      thumbnail_mobile[0] ${mediaAssetFragment},
      coverMedia[0] ${mediaAssetFragment},
      coverMedia_mobile[0] ${mediaAssetFragment},
      gallery[]{
        _key,
        media[] ${mediaAssetFragment}
      },
      slug
    },

    _type == "experience" => {
      _id,
      _type,
      "title": ${localizedString("title")},
      scheduling,
      thumbnail[0] ${mediaAssetFragment},
      gallery[] ${mediaAssetFragment},
      link,
    },

    _type == "publicity" => {
      _id,
      _type,
      "title": ${localizedString("title")},
      scheduling,
      thumbnail[0] ${mediaAssetFragment},
      gallery[] ${mediaAssetFragment},
      link,
    }
  }
}`;

export const projectSlugsQuery = `*[_type=="project" && defined(slug.current)]{
  "slug": slug.current
}`;

export const projectNavigationQuery = `*[_type=="home"][0].selection[]->{
  _id,
  _type,
  title,
  thumbnail[0] ${mediaAssetFragment},
  thumbnail_mobile[0] ${mediaAssetFragment},
  coverMedia[0] ${mediaAssetFragment},
  coverMedia_mobile[0] ${mediaAssetFragment},
  pageBuilder[]{
    _key,
    _type,
    _type == "projectFullscreenMedium" => {
      medium[0] ${mediaAssetFragment}
    },
    _type == "projectScaleGallery" => {
      media[] ${mediaAssetFragment}
    }
  },
  slug
}`;

export const projectQuery = `*[_type=="project" && slug.current == $slug][0]{
  _id,
  _type,
  title,
  client,
  categories[]->{
    _id,
    name,
  },
  scheduling,
  ${localizedPortableText("description")},
  credits[]{
    "role": ${localizedString("role")},
    entries
  },
  thumbnail[0] ${mediaAssetFragment},
  thumbnail_mobile[0] ${mediaAssetFragment},
  coverMedia[0] ${mediaAssetFragment},
  coverMedia_mobile[0] ${mediaAssetFragment},
  pageBuilder[]{
    _key,
    _type,
    _type == "projectFullscreenMedium" => {
      "caption": ${localizedString("caption")},
      "subcaption": ${localizedString("subcaption")},
      medium[0] ${mediaAssetFragment}
    },
    _type == "projectScaleGallery" => {
      media[] ${mediaAssetFragment}
    }
  },
  gallery[]{
    _key,
    media[] ${mediaAssetFragment}
  },
  link,
  slug
}`;

export const infoQuery = `*[_type=="info"][0]{
  ${localizedPortableText("description")},
  ${localizedPortableText("selectedClients")},
  socials[]{
    platform,
    link
  },
  VATNumber,
  CV{
    asset->{
      _id,
      url,
      originalFilename
    }
  },
  recommendations{
    asset->{
      _id,
      url,
      originalFilename
    }
  },
  Recommendations{
    asset->{
      _id,
      url,
      originalFilename
    }
  }
}`;

export const experienceQuery = `*[_type=="experience"] | order(coalesce(scheduling.year, year) desc, ${localizedString("title")} asc){
  _id,
  _type,
  "title": ${localizedString("title")},
  scheduling,
  year,
  "location": ${localizedString("location")},
  thumbnail[0] ${mediaAssetFragment},
  gallery[] ${mediaAssetFragment},
  link,
}`;

export const publicityQuery = `*[_type=="publicity"] | order(coalesce(scheduling.year, year) desc, ${localizedString("title")} asc){
  _id,
  _type,
  "title": ${localizedString("title")},
  scheduling,
  year,
  "location": ${localizedString("location")},
  thumbnail[0] ${mediaAssetFragment},
  gallery[] ${mediaAssetFragment},
  link,
}`;
