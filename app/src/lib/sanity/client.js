import {createClient} from "@sanity/client";

const config = {
  projectId: "4w6ym7wy",
  dataset: "production",
  apiVersion: "2025-09-23",
};

let previewClient;
let productionClient;

export function getPreviewClient() {
  if (!previewClient) {
    previewClient = createClient({
      ...config,
      useCdn: false,
      token: process.env.SANITY_READ_TOKEN,
      perspective: "drafts",
    });
  }

  return previewClient;
}

export function getProductionClient() {
  if (!productionClient) {
    productionClient = createClient({
      ...config,
      useCdn: true,
    });
  }

  return productionClient;
}
