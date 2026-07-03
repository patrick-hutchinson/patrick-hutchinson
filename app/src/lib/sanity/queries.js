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
      year,
      description,
      credits[]{
        role,
        entries
      },
      coverMedia[0] ${mediaAssetFragment},
      gallery[] ${mediaAssetFragment},
      slug
    },

    _type == "experience" => {
      _id,
      _type,
      title,
      year,
      location,
      thumbnail[0] ${mediaAssetFragment},
      link,
    },

    _type == "publicity" => {
      _id,
      _type,
      title,
      year,
      location,
      thumbnail[0] ${mediaAssetFragment},
      link,
    }
  }
}`;

export const infoQuery = `*[_type=="info"][0]{
  description,
  contact[]{
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
