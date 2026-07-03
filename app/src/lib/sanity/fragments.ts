export const mediaAssetFragment = `{
  "medium": {
    _index,
    "type": select(_type == "imageAsset" => "image", _type == "videoAsset" => "video"),

    "_id": select(
      _type == "imageAsset" => file.asset->_id,
      _type == "videoAsset" => file.asset->assetId,
      true => null
    ),

    "url": select(_type == "imageAsset" => file.asset->url, true => null),
    "lqip": select(_type == "imageAsset" => file.asset->metadata.lqip, true => null),
    "width": select(_type == "imageAsset" => file.asset->metadata.dimensions.width, true => null),
    "height": select(_type == "imageAsset" => file.asset->metadata.dimensions.height, true => null),
    "altText": select(_type == "imageAsset" => altText, true => null),

    "copyright": select(
      _type == "imageAsset" => copyright,
      true => null
    ),
  }
}`;
