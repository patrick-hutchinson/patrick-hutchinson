import { mediaAssetFragment } from "./fragments";

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
      description,
      credits[]{
        role,
        entries
      },
      coverMedia[0] ${mediaAssetFragment},
      gallery[]{
        _key,
        media[] ${mediaAssetFragment}
      },
      slug
    },

    _type == "experience" => {
      _id,
      _type,
      title,
      scheduling,
      thumbnail[0] ${mediaAssetFragment},
      link,
    },

    _type == "publicity" => {
      _id,
      _type,
      title,
      scheduling,
      thumbnail[0] ${mediaAssetFragment},
      link,
    }
  }
}`;

export const projectSlugsQuery = `*[_type=="project" && defined(slug.current)]{
  "slug": slug.current
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
  description,
  credits[]{
    role,
    entries
  },
  coverMedia[0] ${mediaAssetFragment},
  gallery[]{
    _key,
    media[] ${mediaAssetFragment}
  },
  link,
  slug
}`;

export const infoQuery = `*[_type=="info"][0]{
  description,
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
  }
}`;

export const experienceQuery = `*[_type=="experience"] | order(coalesce(scheduling.year, year) desc, title asc){
  _id,
  _type,
  title,
  scheduling,
  year,
  location,
  thumbnail[0] ${mediaAssetFragment},
  link,
}`;

export const publicityQuery = `*[_type=="publicity"] | order(coalesce(scheduling.year, year) desc, title asc){
  _id,
  _type,
  title,
  scheduling,
  year,
  location,
  thumbnail[0] ${mediaAssetFragment},
  link,
}`;
