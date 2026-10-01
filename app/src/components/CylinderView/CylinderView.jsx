import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import * as THREE from "three";

import { getLocalizedPath } from "@/lib/i18n";
import { getMediumPreviewImageUrl, getProjectThumbnailMedia, getVideoRenditionUrl } from "@/lib/media/projectThumbnails";

import styles from "./CylinderView.module.css";
import { TITLE_KERNING } from "./titleKerning";

const CYLINDER_RADIUS = 2.15;
const CYLINDER_BODY_RADIUS = CYLINDER_RADIUS - 0.035;
const CYLINDER_WIDTH = 8.2;
const IMAGE_CYLINDER_WIDTH = 5.2;
const TEXT_HEIGHT = 0.75;
const TEXT_CURVE_SEGMENTS = 16;
const SCROLL_SPEED = 0.0032;
const DRAG_SPEED = 0.008;
const SCROLL_RESISTANCE = 0.12;
const DRAG_RESISTANCE = 0.12;
const ROTATION_INERTIA = 0.88;
const ROTATION_EASE = 0.085;
const POINTER_ROTATION_MAX = 0.7;
const POINTER_ROTATION_EASE = 0.08;
const MODE_TRANSITION_DURATION = 950;
const VELOCITY_STOP_THRESHOLD = 0.00001;
const CAMERA_Z = 7.6;
const CYLINDER_SHADE_WHITE_AT = 0.88;
const CYLINDER_SHADE_BLACK_AT = 0.38;
const CYLINDER_SHADE_POWER = 1.45;
const TITLE_TEXTURE_FONT_SIZE = 150;
const META_TEXTURE_FONT_SIZE = 34;
const META_TEXTURE_GAP = 18;
const META_TEXTURE_COLOR = "#9c9c9d";
const TITLE_TEXTURE_FONT_FAMILY = "NeueHaasGroteskDisplay, Arial, Helvetica, sans-serif";
const META_TEXTURE_FONT_FAMILY = "NeueHaasGroteskText, Arial, Helvetica, sans-serif";
const TITLE_HOVER_EASE = 0.14;
const TITLE_HOVER_COLOR = new THREE.Color(META_TEXTURE_COLOR);
const TITLE_HOVER_MIN_FRONTNESS = 0.54;
const TITLE_HOVER_SWITCH_MARGIN = 0.08;
const HIT_HEIGHT_MULTIPLIER = 0.72;
const HIT_WIDTH_PADDING = 0.18;
const ROW_POOL_BUFFER = 4;
const VISIBLE_ANGLE_MIN = -Math.PI / 2;
const VISIBLE_ANGLE_MAX = Math.PI / 2;
const CYLINDER_MODES = {
  IMAGES: "images",
  TITLES: "titles",
};
const MEDIA_ATLAS_WIDTH = 2048;

const BACKGROUND = "ffffff;";
const FOREFROUND = "000000";
const DEFAULT_LAYOUT = {
  letterSpacing: -5,
  lineHeight: 0.66,
  position: {
    x: 0,
    y: 0,
    z: -2.25,
  },
  rotation: {
    x: -0.05,
    y: 0.487,
    z: 0.096,
  },
};

const LAYOUT_CONTROLS = [
  { group: "spacing", key: "lineHeight", label: "Line Height", max: 2.6, min: 0.3, step: 0.01 },
  { group: "spacing", key: "letterSpacing", label: "Letter Spacing", max: 40, min: -40, step: 1 },
  { group: "position", key: "x", label: "Translate X", max: 4, min: -4, step: 0.01 },
  { group: "position", key: "y", label: "Translate Y", max: 3, min: -3, step: 0.01 },
  { group: "position", key: "z", label: "Translate Z", max: 4, min: -4, step: 0.01 },
  { group: "rotation", key: "x", label: "Rotate X", max: Math.PI, min: -Math.PI, step: 0.001 },
  { group: "rotation", key: "y", label: "Rotate Y", max: Math.PI, min: -Math.PI, step: 0.001 },
  { group: "rotation", key: "z", label: "Rotate Z", max: Math.PI, min: -Math.PI, step: 0.001 },
];

function getKerningAdjustment(characters, index, pairs = {}) {
  if (index === 0) return 0;

  const previous = characters[index - 1];
  const current = characters[index];
  return pairs[`${previous}${current}`] || pairs[`${previous} ${current}`] || 0;
}

function getSpacedTextWidth(context, text, letterSpacing, pairs) {
  const characters = Array.from(text);

  return characters.reduce((width, character, index) => {
    return (
      width +
      context.measureText(character).width +
      (index > 0 ? letterSpacing : 0) +
      getKerningAdjustment(characters, index, pairs)
    );
  }, 0);
}

function drawSpacedText(context, text, x, y, letterSpacing, pairs) {
  const characters = Array.from(text);

  characters.forEach((character, index) => {
    if (index > 0) x += letterSpacing + getKerningAdjustment(characters, index, pairs);
    context.fillText(character, x, y);
    x += context.measureText(character).width;
  });
}

function getProjectDate(project) {
  return project.scheduling?.year
    ? `${project.scheduling?.month}‘${project.scheduling.year.slice(2)}`
    : project.scheduling?.month || "";
}

function makeTextTexture(project, letterSpacing) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  const title = project.title;
  const kerning = TITLE_KERNING[project.slug] || {};
  const titleLetterSpacing = letterSpacing + (kerning.letterSpacing || 0);
  const titleKerningPairs = kerning.pairs || {};
  const date = getProjectDate(project);
  const location = project.scheduling?.location || "";
  const paddingX = 28;
  const paddingY = 14;
  const titleFont = `bold ${TITLE_TEXTURE_FONT_SIZE}px ${TITLE_TEXTURE_FONT_FAMILY}`;
  const metaFont = `bold ${META_TEXTURE_FONT_SIZE}px ${META_TEXTURE_FONT_FAMILY}`;

  context.font = titleFont;
  const titleWidth = getSpacedTextWidth(context, title, titleLetterSpacing, titleKerningPairs);
  context.font = metaFont;
  const dateWidth = date ? context.measureText(date).width : 0;
  const locationWidth = location ? context.measureText(location).width : 0;
  const textWidth =
    titleWidth + (dateWidth ? dateWidth + META_TEXTURE_GAP : 0) + (locationWidth ? locationWidth + META_TEXTURE_GAP : 0);
  canvas.width = Math.ceil(textWidth + paddingX * 2);
  canvas.height = Math.ceil(TITLE_TEXTURE_FONT_SIZE + paddingY * 2);

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.textBaseline = "middle";
  context.translate(canvas.width, 0);
  context.scale(-1, 1);

  let cursorX = paddingX;
  const centerY = canvas.height / 2 + TITLE_TEXTURE_FONT_SIZE * 0.02;

  context.font = metaFont;
  context.fillStyle = META_TEXTURE_COLOR;
  if (date) {
    context.fillText(date, cursorX, centerY);
    cursorX += dateWidth + META_TEXTURE_GAP;
  }

  context.font = titleFont;
  context.fillStyle = "#ffffff";
  drawSpacedText(context, title, cursorX, centerY, titleLetterSpacing, titleKerningPairs);
  cursorX += titleWidth + META_TEXTURE_GAP;

  if (location) {
    context.font = metaFont;
    context.fillStyle = META_TEXTURE_COLOR;
    context.fillText(location, cursorX, centerY);
    cursorX += locationWidth;
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  return {
    texture,
    aspect: canvas.width / canvas.height,
  };
}

function getMediumAspect(medium) {
  if (medium?.width && medium?.height) return medium.width / medium.height;
  if (medium?.aspect_ratio) {
    const [width, height] = String(medium.aspect_ratio).split(":").map(Number);
    if (width && height) return width / height;
  }
  return 16 / 9;
}

function drawImageCover(context, image, canvasWidth, canvasHeight) {
  const imageRatio = image.naturalWidth / image.naturalHeight;
  const canvasRatio = canvasWidth / canvasHeight;
  const drawHeight = imageRatio > canvasRatio ? canvasHeight : canvasWidth / imageRatio;
  const drawWidth = imageRatio > canvasRatio ? canvasHeight * imageRatio : canvasWidth;
  const drawX = (canvasWidth - drawWidth) / 2;
  const drawY = (canvasHeight - drawHeight) / 2;

  context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
}

function makeImageTexture(project, isMobile) {
  const medium = getProjectThumbnailMedia(project, isMobile);
  const src = getMediumPreviewImageUrl(medium, 1600);
  const aspect = getMediumAspect(medium);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  canvas.height = 900;
  canvas.width = Math.max(1, Math.round(canvas.height * aspect));
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  if (src) {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.decoding = "async";
    image.onload = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      drawImageCover(context, image, canvas.width, canvas.height);
      texture.needsUpdate = true;
    };
    image.src = src;
  }

  return {
    texture,
    aspect,
  };
}

function makeCurvedTextGeometry(width, height, options = {}) {
  const widthSegments = options.widthSegments ?? Math.max(8, Math.ceil(width * 5));
  const heightSegments = options.heightSegments ?? TEXT_CURVE_SEGMENTS;
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];

  for (let yIndex = 0; yIndex <= heightSegments; yIndex += 1) {
    const v = yIndex / heightSegments;
    const localY = (v - 0.5) * height;
    const theta = localY / CYLINDER_RADIUS;
    const y = Math.sin(theta) * CYLINDER_RADIUS;
    const z = Math.cos(theta) * CYLINDER_RADIUS;
    const normalY = Math.sin(theta);
    const normalZ = Math.cos(theta);

    for (let xIndex = 0; xIndex <= widthSegments; xIndex += 1) {
      const u = xIndex / widthSegments;
      const x = (u - 0.5) * width;

      positions.push(x, y, z);
      normals.push(0, normalY, normalZ);
      uvs.push(u, 1 - v);
    }
  }

  for (let yIndex = 0; yIndex < heightSegments; yIndex += 1) {
    for (let xIndex = 0; xIndex < widthSegments; xIndex += 1) {
      const a = yIndex * (widthSegments + 1) + xIndex;
      const b = a + widthSegments + 1;
      const c = b + 1;
      const d = a + 1;

      indices.push(a, d, b, b, d, c);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();

  return geometry;
}

function makeCylinderStripGeometry(width, thetaMin, thetaMax, options = {}) {
  const widthSegments = options.widthSegments ?? 1;
  const heightSegments = options.heightSegments ?? 96;
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];

  for (let yIndex = 0; yIndex <= heightSegments; yIndex += 1) {
    const v = yIndex / heightSegments;
    const theta = thetaMin + (thetaMax - thetaMin) * v;
    const y = Math.sin(theta) * CYLINDER_RADIUS;
    const z = Math.cos(theta) * CYLINDER_RADIUS;
    const normalY = Math.sin(theta);
    const normalZ = Math.cos(theta);

    for (let xIndex = 0; xIndex <= widthSegments; xIndex += 1) {
      const u = xIndex / widthSegments;
      const x = (u - 0.5) * width;

      positions.push(x, y, z);
      normals.push(0, normalY, normalZ);
      uvs.push(u, v);
    }
  }

  for (let yIndex = 0; yIndex < heightSegments; yIndex += 1) {
    for (let xIndex = 0; xIndex < widthSegments; xIndex += 1) {
      const a = yIndex * (widthSegments + 1) + xIndex;
      const b = a + widthSegments + 1;
      const c = b + 1;
      const d = a + 1;

      indices.push(a, d, b, b, d, c);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();

  return geometry;
}

function drawImageContain(context, image, x, y, width, height, aspect) {
  const imageAspect = image?.naturalWidth && image?.naturalHeight ? image.naturalWidth / image.naturalHeight : aspect;
  const drawWidth = Math.min(width, height * imageAspect);
  const drawHeight = drawWidth / imageAspect;
  const drawX = x + (width - drawWidth) / 2;
  const drawY = y + (height - drawHeight) / 2;

  context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
}

function drawMediaAtlasRow(context, row, source) {
  context.fillStyle = "#000000";
  context.fillRect(0, row.startY, MEDIA_ATLAS_WIDTH, row.pixelHeight);
  drawImageContain(context, source, 0, row.startY, MEDIA_ATLAS_WIDTH, row.pixelHeight, row.aspect);
}

function loadAtlasVideo(row, atlas) {
  if (!row.videoSrc) return null;

  const video = document.createElement("video");
  video.crossOrigin = "anonymous";
  video.loop = true;
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  row.video = video;

  const handleLoaded = () => {
    if (atlas.playVideos) video.play().catch(() => {});
    row.hasDrawnVideoFrame = false;
    atlas.texture.needsUpdate = true;
  };

  video.addEventListener("loadeddata", handleLoaded, { once: true });
  video.src = row.videoSrc;
  video.load();

  return video;
}

function updateMediaAtlasVideos(atlas) {
  let hasUpdated = false;

  atlas.rows.forEach((row) => {
    const video = row.video;
    if (!video || video.readyState < 2) return;
    if (!atlas.playVideos) {
      if (!video.paused) video.pause();
      return;
    }

    if (video.paused) video.play().catch(() => {});
    if (!row.hasDrawnVideoFrame && video.currentTime <= 0.03) return;

    try {
      drawMediaAtlasRow(atlas.context, row, video);
      row.hasDrawnVideoFrame = true;
      hasUpdated = true;
    } catch {
      row.video.pause();
      row.video = null;
    }
  });

  if (hasUpdated) atlas.texture.needsUpdate = true;
}

function setMediaAtlasVideoPlayback(atlas, shouldPlay) {
  atlas.playVideos = shouldPlay;

  atlas.rows.forEach((row) => {
    if (!row.video) return;
    if (shouldPlay) {
      row.video.play().catch(() => {});
    } else {
      row.video.pause();
    }
  });
}

function disposeMediaAtlas(atlas) {
  atlas.rows.forEach((row) => {
    if (!row.video) return;
    row.video.pause();
    row.video.removeAttribute("src");
    row.video.load();
    row.video = null;
  });
}

function getMediaWorldHeight(aspect) {
  return IMAGE_CYLINDER_WIDTH / Math.max(aspect, 0.01);
}

function findMediaRowByUnit(rows, unitValue) {
  if (!rows.length) return null;

  const atlasY = wrapUnit(unitValue) * rows[rows.length - 1].endY;
  return rows.find((row) => atlasY >= row.startY && atlasY < row.endY) || rows[rows.length - 1];
}

function makeMediaAtlas(projects, isMobile, options = {}) {
  const rows = projects.map((project) => {
    const medium = getProjectThumbnailMedia(project, isMobile);
    const aspect = getMediumAspect(medium);
    const pixelHeight = Math.max(1, Math.round(MEDIA_ATLAS_WIDTH / aspect));
    const worldHeight = getMediaWorldHeight(aspect);

    return {
      aspect,
      hasDrawnVideoFrame: false,
      pixelHeight,
      project,
      src: getMediumPreviewImageUrl(medium, 1600),
      video: null,
      videoSrc: medium?.type === "video" ? getVideoRenditionUrl(medium) : null,
      worldHeight,
    };
  });
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  const totalPixelHeight = rows.reduce((height, row) => height + row.pixelHeight, 0);
  const totalWorldHeight = rows.reduce((height, row) => height + row.worldHeight, 0);

  canvas.width = MEDIA_ATLAS_WIDTH;
  canvas.height = Math.max(1, totalPixelHeight);
  context.fillStyle = "#000000";
  context.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  const atlas = {
    context,
    playVideos: options.playVideos !== false,
    rows,
    texture,
    totalWorldHeight: Math.max(getMediaWorldHeight(16 / 9), totalWorldHeight),
  };

  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.RepeatWrapping;

  let currentY = 0;
  rows.forEach((row) => {
    const y = currentY;
    row.startY = y;
    row.endY = y + row.pixelHeight;
    currentY = row.endY;

    context.fillStyle = "#000000";
    context.fillRect(0, y, canvas.width, row.pixelHeight);

    if (!row.src && !row.videoSrc) return;

    const image = new Image();
    image.crossOrigin = "anonymous";
    image.decoding = "async";
    image.onload = () => {
      drawMediaAtlasRow(context, row, image);
      texture.needsUpdate = true;
    };
    if (row.src) image.src = row.src;

    loadAtlasVideo(row, atlas);
  });

  return atlas;
}

function makeCylinderTextMaterial(texture, options = {}) {
  return new THREE.ShaderMaterial({
    alphaTest: 0.08,
    depthTest: false,
    depthWrite: false,
    fragmentShader: `
      uniform sampler2D map;
      uniform float shadeWhiteAt;
      uniform float shadeBlackAt;
      uniform float shadePower;
      uniform float hoverAmount;
      uniform float hoverEnabled;
      uniform vec3 hoverColor;
      varying vec2 vUv;
      varying vec3 vViewNormal;

      void main() {
        vec4 texel = texture2D(map, vUv);
        if (texel.a < 0.08) discard;

        float facing = clamp(vViewNormal.z, 0.0, 1.0);
        float shade = smoothstep(shadeBlackAt, shadeWhiteAt, facing);
        shade = pow(shade, shadePower);
        float titleMask = smoothstep(0.72, 0.96, max(max(texel.r, texel.g), texel.b));
        vec3 color = mix(texel.rgb, hoverColor, hoverEnabled * hoverAmount * titleMask);

        gl_FragColor = vec4(color * shade, texel.a);
      }
    `,
    side: THREE.FrontSide,
    toneMapped: false,
    transparent: true,
    uniforms: {
      map: { value: texture },
      hoverEnabled: { value: options.hoverEnabled ? 1 : 0 },
      hoverAmount: { value: 0 },
      hoverColor: { value: TITLE_HOVER_COLOR },
      shadeBlackAt: { value: CYLINDER_SHADE_BLACK_AT },
      shadePower: { value: CYLINDER_SHADE_POWER },
      shadeWhiteAt: { value: CYLINDER_SHADE_WHITE_AT },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vViewNormal;

      void main() {
        vUv = uv;
        vViewNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
  });
}

function makeCylinderMediaMaterial(texture) {
  return new THREE.ShaderMaterial({
    depthTest: false,
    depthWrite: false,
    fragmentShader: `
      uniform sampler2D map;
      uniform float shadeWhiteAt;
      uniform float shadeBlackAt;
      uniform float shadePower;
      uniform float scrollOffset;
      uniform float visibleRepeat;
      varying vec2 vUv;
      varying vec3 vViewNormal;

      void main() {
        vec2 uv = vec2(vUv.x, fract(vUv.y * visibleRepeat + scrollOffset));
        vec4 texel = texture2D(map, uv);
        float facing = clamp(vViewNormal.z, 0.0, 1.0);
        float shade = smoothstep(shadeBlackAt, shadeWhiteAt, facing);
        shade = pow(shade, shadePower);

        gl_FragColor = vec4(texel.rgb * shade, 1.0);
      }
    `,
    side: THREE.FrontSide,
    toneMapped: false,
    transparent: false,
    uniforms: {
      map: { value: texture },
      scrollOffset: { value: 0 },
      shadeBlackAt: { value: CYLINDER_SHADE_BLACK_AT },
      shadePower: { value: CYLINDER_SHADE_POWER },
      shadeWhiteAt: { value: CYLINDER_SHADE_WHITE_AT },
      visibleRepeat: { value: 1 },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vViewNormal;

      void main() {
        vUv = uv;
        vViewNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
  });
}

function getLoopIndex(index, length) {
  return ((index % length) + length) % length;
}

function getProjectForVirtualIndex(projects, virtualIndex) {
  return projects[getLoopIndex(virtualIndex, projects.length)];
}

function wrapUnit(value) {
  return ((value % 1) + 1) % 1;
}

function getModeMetrics(mode, layout) {
  const height = TEXT_HEIGHT;
  const lineHeight = mode === CYLINDER_MODES.IMAGES ? 1 : layout.lineHeight;

  return {
    angleStep: (height * lineHeight) / CYLINDER_RADIUS,
    height,
    hitHeight: Math.max(0.08, height * lineHeight * HIT_HEIGHT_MULTIPLIER),
  };
}

function makeProjectTexture(project, { isMobile, letterSpacing, mode }) {
  return mode === CYLINDER_MODES.IMAGES ? makeImageTexture(project, isMobile) : makeTextTexture(project, letterSpacing);
}

function setTitleRowRotation(mesh, angle, mode) {
  mesh.rotation.set(angle, 0, mode === CYLINDER_MODES.TITLES ? Math.PI : 0);
}

function getStableTitleHit(intersections, currentMesh = null) {
  const candidates = [];
  const seen = new Set();

  intersections.forEach((hit) => {
    const hitMesh = hit.object;
    const visualMesh = hitMesh.userData?.visualMesh;
    if (!visualMesh || seen.has(visualMesh)) return;

    const frontness = hitMesh.userData?.frontness ?? 0;
    if (frontness < TITLE_HOVER_MIN_FRONTNESS) return;

    seen.add(visualMesh);
    candidates.push({
      distance: hit.distance,
      frontness,
      visualMesh,
    });
  });

  if (!candidates.length) return null;

  candidates.sort((a, b) => b.frontness - a.frontness || a.distance - b.distance);

  const currentCandidate = candidates.find((candidate) => candidate.visualMesh === currentMesh);
  const bestCandidate = candidates[0];

  if (currentCandidate && currentCandidate.frontness >= bestCandidate.frontness - TITLE_HOVER_SWITCH_MARGIN) {
    return currentCandidate.visualMesh;
  }

  return bestCandidate.visualMesh;
}

function updateRowMesh({ hitHeight, hitMesh, isMobile, letterSpacing, mesh, mode, project, rowHeight, virtualIndex }) {
  const { texture, aspect } = makeProjectTexture(project, { isMobile, letterSpacing, mode });
  const width = Math.min(rowHeight * aspect, CYLINDER_WIDTH);
  const geometry = makeCurvedTextGeometry(width, rowHeight);
  const material = makeCylinderTextMaterial(texture, { hoverEnabled: mode === CYLINDER_MODES.TITLES });
  const hitGeometry = makeCurvedTextGeometry(Math.min(width + HIT_WIDTH_PADDING, CYLINDER_WIDTH), hitHeight, {
    heightSegments: 4,
    widthSegments: 1,
  });

  mesh.geometry?.dispose();
  mesh.material?.uniforms?.map?.value?.dispose();
  mesh.material?.dispose();
  hitMesh.geometry?.dispose();

  mesh.geometry = geometry;
  mesh.material = material;
  mesh.userData.project = project;
  mesh.userData.virtualIndex = virtualIndex;
  mesh.userData.mode = mode;
  hitMesh.geometry = hitGeometry;
  hitMesh.userData.project = project;
  hitMesh.userData.virtualIndex = virtualIndex;
  hitMesh.userData.visualMesh = mesh;
  hitMesh.userData.mode = mode;
}

function createTitleTransitionSide({ isMobile, layout, projects }) {
  const group = new THREE.Group();
  const metrics = getModeMetrics(CYLINDER_MODES.TITLES, layout);
  const angleStep = metrics.angleStep;
  const totalRows = Math.ceil((VISIBLE_ANGLE_MAX - VISIBLE_ANGLE_MIN) / angleStep) + ROW_POOL_BUFFER * 2;
  const meshes = [];
  const hitMeshes = [];

  Array.from({ length: totalRows }, (_, index) => {
    const mesh = new THREE.Mesh();
    const hitMesh = new THREE.Mesh();

    mesh.userData = {
      index,
      mode: CYLINDER_MODES.TITLES,
      project: null,
      virtualIndex: null,
    };

    updateRowMesh({
      hitHeight: metrics.hitHeight,
      hitMesh,
      isMobile,
      letterSpacing: layout.letterSpacing,
      mesh,
      mode: CYLINDER_MODES.TITLES,
      project: getProjectForVirtualIndex(projects, index),
      rowHeight: metrics.height,
      virtualIndex: index,
    });

    if (mesh.material?.uniforms?.hoverEnabled) mesh.material.uniforms.hoverEnabled.value = 0;
    group.add(mesh);
    meshes.push(mesh);
    hitMeshes.push(hitMesh);
  });

  const update = (current, layoutRefValue) => {
    const currentMetrics = getModeMetrics(CYLINDER_MODES.TITLES, layoutRefValue);
    const currentAngleStep = currentMetrics.angleStep;
    const baseVirtualIndex = Math.floor((VISIBLE_ANGLE_MIN - current) / currentAngleStep) - ROW_POOL_BUFFER;

    meshes.forEach((mesh, index) => {
      const hitMesh = hitMeshes[index];
      const virtualIndex = baseVirtualIndex + index;
      const project = getProjectForVirtualIndex(projects, virtualIndex);

      if (mesh.userData.virtualIndex !== virtualIndex || mesh.userData.mode !== CYLINDER_MODES.TITLES) {
        updateRowMesh({
          hitHeight: currentMetrics.hitHeight,
          hitMesh,
          isMobile,
          letterSpacing: layoutRefValue.letterSpacing,
          mesh,
          mode: CYLINDER_MODES.TITLES,
          project,
          rowHeight: currentMetrics.height,
          virtualIndex,
        });
        if (mesh.material?.uniforms?.hoverEnabled) mesh.material.uniforms.hoverEnabled.value = 0;
      }

      const angle = virtualIndex * currentAngleStep + current;
      const frontness = (Math.cos(angle) + 1) / 2;

      mesh.visible = frontness >= 0.5;
      mesh.position.set(0, 0, 0);
      setTitleRowRotation(mesh, angle, CYLINDER_MODES.TITLES);
      mesh.renderOrder = 1 + Math.round(frontness * 1000);
    });
  };

  const dispose = () => {
    disposeMeshes(meshes);
    hitMeshes.forEach((mesh) => mesh.geometry?.dispose());
  };

  return { dispose, group, update };
}

function createImageTransitionSide({ atlas, material, width }) {
  const group = new THREE.Group();
  const geometry = makeCylinderStripGeometry(width, VISIBLE_ANGLE_MIN, VISIBLE_ANGLE_MAX);
  const mesh = new THREE.Mesh(geometry, material);
  const visibleWorldHeight = (VISIBLE_ANGLE_MAX - VISIBLE_ANGLE_MIN) * CYLINDER_RADIUS;

  material.uniforms.visibleRepeat.value = visibleWorldHeight / atlas.totalWorldHeight;
  group.add(mesh);

  return {
    dispose: () => {
      geometry.dispose();
      material.uniforms.map.value?.dispose();
      material.dispose();
      disposeMediaAtlas(atlas);
    },
    group,
    material,
    setVideoPlayback: (shouldPlay) => setMediaAtlasVideoPlayback(atlas, shouldPlay),
    update: (current) => {
      material.uniforms.scrollOffset.value = wrapUnit((current * CYLINDER_RADIUS) / atlas.totalWorldHeight);
      updateMediaAtlasVideos(atlas);
    },
  };
}

function disposeMeshes(meshes) {
  meshes.forEach((mesh) => {
    mesh.geometry?.dispose();
    mesh.material?.map?.dispose();
    mesh.material?.uniforms?.map?.value?.dispose();
    mesh.material?.dispose();
  });
}

function cloneLayout(layout) {
  return {
    letterSpacing: layout.letterSpacing,
    lineHeight: layout.lineHeight,
    position: { ...layout.position },
    rotation: { ...layout.rotation },
  };
}

function applyLayout(group, layout, rotationOffset = { x: 0, y: 0 }, transitionRotationX = 0, baseRotationX = 0) {
  group.position.set(layout.position.x, layout.position.y, layout.position.z);
  group.rotation.set(rotationOffset.x + baseRotationX + transitionRotationX, rotationOffset.y, layout.rotation.z);
}

function roundCoordinate(value) {
  return Math.round(value * 1000) / 1000;
}

function updatePointerRotationOffset(pointerRotation, pointerClient, container) {
  let targetX = 0;
  let targetY = 0;

  if (pointerClient) {
    const rect = container.getBoundingClientRect();
    const normalizedX = Math.min(1, Math.max(-1, ((pointerClient.x - rect.left) / Math.max(rect.width, 1)) * 2 - 1));
    const normalizedY = Math.min(1, Math.max(-1, ((pointerClient.y - rect.top) / Math.max(rect.height, 1)) * 2 - 1));

    targetY = -normalizedX * POINTER_ROTATION_MAX;
    targetX = -normalizedY * POINTER_ROTATION_MAX;
  }

  pointerRotation.target.x = targetX;
  pointerRotation.target.y = targetY;
  pointerRotation.current.x += (pointerRotation.target.x - pointerRotation.current.x) * POINTER_ROTATION_EASE;
  pointerRotation.current.y += (pointerRotation.target.y - pointerRotation.current.y) * POINTER_ROTATION_EASE;

  return pointerRotation.current;
}

function easeInOutCubic(value) {
  return value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

function getModeTransitionRotation(transition, now) {
  if (!transition.active) return 0;

  const progress = Math.min(1, (now - transition.startedAt) / MODE_TRANSITION_DURATION);

  if (progress >= 1) {
    return Math.PI;
  }

  return easeInOutCubic(progress) * Math.PI;
}

function shouldCompleteModeTransition(transition, now) {
  return (
    transition.active &&
    transition.targetMode &&
    now - transition.startedAt >= MODE_TRANSITION_DURATION
  );
}

export default function CylinderView({ array = [], language = "en" }) {
  const router = useRouter();
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const meshesRef = useRef([]);
  const hitMeshesRef = useRef([]);
  const hoveredMeshRef = useRef(null);
  const pointerClientRef = useRef(null);
  const sceneStateRef = useRef(null);
  const pointerRef = useRef({
    dragging: false,
    moved: false,
    lastY: 0,
    pointerId: null,
  });
  const rotationRef = useRef({
    current: 0,
    target: 0,
    velocity: 0,
  });
  const pointerRotationRef = useRef({
    current: { x: 0, y: 0 },
    target: { x: 0, y: 0 },
  });
  const transitionRotationBaseRef = useRef(0);
  const contentRotationRef = useRef(0);
  const modeTransitionRef = useRef({
    active: false,
    startedAt: 0,
    swapped: false,
    targetMode: null,
  });
  const layoutRef = useRef(cloneLayout(DEFAULT_LAYOUT));
  const [layout, setLayout] = useState(() => cloneLayout(DEFAULT_LAYOUT));
  const [isDragging, setIsDragging] = useState(false);
  const [isClickable, setIsClickable] = useState(false);
  const [cylinderMode, setCylinderMode] = useState(CYLINDER_MODES.TITLES);

  const projects = useMemo(
    () =>
      array
        .filter((entry) => entry?._type === "project" && entry?.slug?.current && entry?.title)
        .map((entry) => ({
          ...entry,
          scheduling: entry.scheduling,
          slug: entry.slug.current,
          title: entry.title.toUpperCase(),
        })),
    [array],
  );

  const navigateToProject = useCallback(
    (project) => {
      if (!project?.slug) return;
      router.push(getLocalizedPath(`/projects/${project.slug}`, language), undefined, { scroll: false });
    },
    [language, router],
  );

  const startModeTransition = useCallback(
    (nextMode) => {
      if (nextMode === cylinderMode) return;

      modeTransitionRef.current = {
        active: true,
        startedAt: performance.now(),
        swapped: false,
        targetMode: nextMode,
      };
      hoveredMeshRef.current = null;
      setIsClickable(false);
    },
    [cylinderMode],
  );

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current || !projects.length) return undefined;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    const isMobile = window.matchMedia?.("(max-width: 748px)").matches || false;
    let cancelled = false;
    let animationFrame = 0;
    let cleanupScene = () => {};

    const setupScene = async () => {
      await document.fonts?.ready;
      if (cancelled) return;

      const renderer = new THREE.WebGLRenderer({
        alpha: false,
        antialias: true,
        canvas,
      });
      renderer.setClearColor(0x000000, 1);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
      camera.position.set(0, 0, CAMERA_Z);
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.035);
      const keyLight = new THREE.DirectionalLight(0xffffff, 4.8);
      const fillLight = new THREE.DirectionalLight(0xffffff, 0.08);
      keyLight.position.set(0, 0, 5);
      fillLight.position.set(0, -2.5, 1.8);
      scene.add(ambientLight, keyLight, fillLight);

      const raycaster = new THREE.Raycaster();
      const pointer = new THREE.Vector2();
      const group = new THREE.Group();
      applyLayout(group, layoutRef.current, { x: 0, y: 0 }, 0, transitionRotationBaseRef.current);
      scene.add(group);
      const contentGroup = new THREE.Group();
      contentGroup.rotation.x = contentRotationRef.current;
      group.add(contentGroup);

      const cylinderWidth = cylinderMode === CYLINDER_MODES.IMAGES ? IMAGE_CYLINDER_WIDTH : CYLINDER_WIDTH;
      const cylinderGeometry = new THREE.CylinderGeometry(
        CYLINDER_BODY_RADIUS,
        CYLINDER_BODY_RADIUS,
        cylinderWidth,
        96,
        1,
        false,
      );
      const cylinderMaterial = new THREE.MeshBasicMaterial({
        color: 0x000000,
        depthWrite: true,
        side: THREE.FrontSide,
      });
      const cylinderBody = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
      cylinderBody.rotation.z = Math.PI / 2;
      cylinderBody.renderOrder = 0;
      group.add(cylinderBody);

      if (cylinderMode === CYLINDER_MODES.IMAGES) {
        const atlas = makeMediaAtlas(projects, isMobile);
        const visibleWorldHeight = (VISIBLE_ANGLE_MAX - VISIBLE_ANGLE_MIN) * CYLINDER_RADIUS;
        const stripGeometry = makeCylinderStripGeometry(IMAGE_CYLINDER_WIDTH, VISIBLE_ANGLE_MIN, VISIBLE_ANGLE_MAX);
        const stripMaterial = makeCylinderMediaMaterial(atlas.texture);
        const stripMesh = new THREE.Mesh(stripGeometry, stripMaterial);
        let incomingTitleSide = null;

        stripMaterial.uniforms.visibleRepeat.value = visibleWorldHeight / atlas.totalWorldHeight;
        contentGroup.add(stripMesh);

        sceneStateRef.current = {
          camera,
          container,
          media: {
            atlas,
            mesh: stripMesh,
            visibleWorldHeight,
          },
          pointer,
          raycaster,
          renderer,
          scene,
          group,
        };

        const resize = () => {
          const { width, height } = container.getBoundingClientRect();
          renderer.setSize(width, height, false);
          camera.aspect = width / Math.max(height, 1);
          camera.updateProjectionMatrix();
        };

        const render = () => {
          const now = performance.now();
          const transition = modeTransitionRef.current;

          const rotation = rotationRef.current;
          rotation.target += rotation.velocity;
          rotation.velocity *= ROTATION_INERTIA;
          if (Math.abs(rotation.velocity) < VELOCITY_STOP_THRESHOLD) rotation.velocity = 0;
          rotation.current += (rotation.target - rotation.current) * ROTATION_EASE;
          const pointerRotation = updatePointerRotationOffset(
            pointerRotationRef.current,
            pointerClientRef.current,
            container,
          );
          applyLayout(
            group,
            layoutRef.current,
            pointerRotation,
            getModeTransitionRotation(transition, now),
            transitionRotationBaseRef.current,
          );
          stripMaterial.uniforms.scrollOffset.value = wrapUnit(
            (rotation.current * CYLINDER_RADIUS) / atlas.totalWorldHeight,
          );
          setMediaAtlasVideoPlayback(atlas, !transition.active);
          updateMediaAtlasVideos(atlas);

          if (transition.active && transition.targetMode === CYLINDER_MODES.TITLES) {
            if (!incomingTitleSide) {
              incomingTitleSide = createTitleTransitionSide({ isMobile, layout: layoutRef.current, projects });
              incomingTitleSide.group.rotation.x = contentRotationRef.current - Math.PI;
              group.add(incomingTitleSide.group);
            }
            incomingTitleSide.group.visible = true;
            incomingTitleSide.update(rotation.current, layoutRef.current);
          } else if (incomingTitleSide) {
            incomingTitleSide.group.visible = false;
          }

          if (shouldCompleteModeTransition(transition, now)) {
            transitionRotationBaseRef.current += Math.PI;
            contentRotationRef.current -= Math.PI;
            transition.active = false;
            const nextMode = transition.targetMode;
            transition.targetMode = null;
            setCylinderMode(nextMode);
          }

          renderer.render(scene, camera);
          animationFrame = window.requestAnimationFrame(render);
        };

        resize();
        animationFrame = window.requestAnimationFrame(render);
        window.addEventListener("resize", resize);

        cleanupScene = () => {
          window.cancelAnimationFrame(animationFrame);
          window.removeEventListener("resize", resize);
          scene.remove(group);
          cylinderGeometry.dispose();
          cylinderMaterial.dispose();
          disposeMediaAtlas(atlas);
          incomingTitleSide?.dispose();
          stripGeometry.dispose();
          stripMaterial.uniforms.map.value?.dispose();
          stripMaterial.dispose();
          renderer.dispose();
          sceneStateRef.current = null;
        };
        return;
      }

      const initialMetrics = getModeMetrics(cylinderMode, layoutRef.current);
      const angleStep = initialMetrics.angleStep;
      const visibleAngleRange = VISIBLE_ANGLE_MAX - VISIBLE_ANGLE_MIN;
      const totalRows = Math.ceil(visibleAngleRange / angleStep) + ROW_POOL_BUFFER * 2;
      const hitMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        depthTest: false,
        depthWrite: false,
        opacity: 0,
        side: THREE.DoubleSide,
        transparent: true,
      });
      const hitHeight = initialMetrics.hitHeight;
      const meshes = [];
      const hitMeshes = [];
      let incomingImageSide = null;
      const initialBaseVirtualIndex =
        Math.floor((VISIBLE_ANGLE_MIN - rotationRef.current.current) / angleStep) - ROW_POOL_BUFFER;

      Array.from({ length: totalRows }, (_, index) => {
        const virtualIndex = initialBaseVirtualIndex + index;
        const project = getProjectForVirtualIndex(projects, virtualIndex);
        const { texture, aspect } = makeProjectTexture(project, {
          isMobile,
          letterSpacing: layoutRef.current.letterSpacing,
          mode: cylinderMode,
        });
        const width = Math.min(initialMetrics.height * aspect, CYLINDER_WIDTH);
        const geometry = makeCurvedTextGeometry(width, initialMetrics.height);
        const material = makeCylinderTextMaterial(texture, { hoverEnabled: cylinderMode === CYLINDER_MODES.TITLES });
        const mesh = new THREE.Mesh(geometry, material);
        const hitGeometry = makeCurvedTextGeometry(Math.min(width + HIT_WIDTH_PADDING, CYLINDER_WIDTH), hitHeight, {
          heightSegments: 4,
          widthSegments: 1,
        });
        const hitMesh = new THREE.Mesh(hitGeometry, hitMaterial);

        mesh.userData = {
          index,
          mode: cylinderMode,
          project,
          virtualIndex,
        };
        hitMesh.userData = {
          index,
          mode: cylinderMode,
          project,
          visualMesh: mesh,
          virtualIndex,
        };

        contentGroup.add(mesh);
        contentGroup.add(hitMesh);
        meshes.push(mesh);
        hitMeshes.push(hitMesh);
      });

      meshesRef.current = meshes;
      hitMeshesRef.current = hitMeshes;
      sceneStateRef.current = {
        camera,
        container,
        hitMeshes,
        meshes,
        pointer,
        raycaster,
        renderer,
        scene,
        group,
      };

      const resize = () => {
        const { width, height } = container.getBoundingClientRect();
        renderer.setSize(width, height, false);
        camera.aspect = width / Math.max(height, 1);
        camera.updateProjectionMatrix();
      };

      const updateMeshes = () => {
        const { current } = rotationRef.current;
        const metrics = getModeMetrics(cylinderMode, layoutRef.current);
        const currentAngleStep = metrics.angleStep;
        const baseVirtualIndex = Math.floor((VISIBLE_ANGLE_MIN - current) / currentAngleStep) - ROW_POOL_BUFFER;

        meshes.forEach((mesh, index) => {
          const hitMesh = hitMeshes[index];
          const virtualIndex = baseVirtualIndex + index;
          const project = getProjectForVirtualIndex(projects, virtualIndex);

          if (mesh.userData.virtualIndex !== virtualIndex || mesh.userData.mode !== cylinderMode) {
            updateRowMesh({
              hitHeight: metrics.hitHeight,
              hitMesh,
              isMobile,
              letterSpacing: layoutRef.current.letterSpacing,
              mesh,
              mode: cylinderMode,
              project,
              rowHeight: metrics.height,
              virtualIndex,
            });
          }

          const angle = virtualIndex * currentAngleStep + current;
          const frontness = (Math.cos(angle) + 1) / 2;

          mesh.visible = frontness >= 0.5;
          mesh.position.set(0, 0, 0);
          setTitleRowRotation(mesh, angle, cylinderMode);
          if (mesh.material?.uniforms?.hoverAmount) {
            const targetHover = mesh === hoveredMeshRef.current ? 1 : 0;
            mesh.material.uniforms.hoverAmount.value +=
              (targetHover - mesh.material.uniforms.hoverAmount.value) * TITLE_HOVER_EASE;
          }
          mesh.renderOrder = 1 + Math.round(frontness * 1000);
        });

        hitMeshes.forEach((hitMesh) => {
          const angle = hitMesh.userData.virtualIndex * currentAngleStep + current;
          const frontness = (Math.cos(angle) + 1) / 2;

          hitMesh.visible = frontness >= 0.5;
          hitMesh.position.set(0, 0, 0);
          setTitleRowRotation(hitMesh, angle, cylinderMode);
          hitMesh.userData.frontness = frontness;
        });
      };

      const render = () => {
        const now = performance.now();
        const transition = modeTransitionRef.current;

        const rotation = rotationRef.current;
        rotation.target += rotation.velocity;
        rotation.velocity *= ROTATION_INERTIA;
        if (Math.abs(rotation.velocity) < VELOCITY_STOP_THRESHOLD) rotation.velocity = 0;
        rotation.current += (rotation.target - rotation.current) * ROTATION_EASE;
        const pointerRotation = updatePointerRotationOffset(pointerRotationRef.current, pointerClientRef.current, container);
        applyLayout(
          group,
          layoutRef.current,
          pointerRotation,
          getModeTransitionRotation(transition, now),
          transitionRotationBaseRef.current,
        );
        updateMeshes();

        if (transition.active && transition.targetMode === CYLINDER_MODES.IMAGES) {
          if (!incomingImageSide) {
            const incomingAtlas = makeMediaAtlas(projects, isMobile, { playVideos: false });
            const incomingMaterial = makeCylinderMediaMaterial(incomingAtlas.texture);
            incomingImageSide = createImageTransitionSide({
              atlas: incomingAtlas,
              material: incomingMaterial,
              width: IMAGE_CYLINDER_WIDTH,
            });
            incomingImageSide.group.rotation.x = contentRotationRef.current - Math.PI;
            group.add(incomingImageSide.group);
          }
          incomingImageSide.group.visible = true;
          incomingImageSide.update(rotation.current);
        } else if (incomingImageSide) {
          incomingImageSide.group.visible = false;
        }

        if (shouldCompleteModeTransition(transition, now)) {
          incomingImageSide?.setVideoPlayback?.(true);
          transitionRotationBaseRef.current += Math.PI;
          contentRotationRef.current -= Math.PI;
          transition.active = false;
          const nextMode = transition.targetMode;
          transition.targetMode = null;
          setCylinderMode(nextMode);
        }

        if (!transition.active && !pointerRef.current.dragging && pointerClientRef.current) {
          const rect = container.getBoundingClientRect();
          pointer.x = ((pointerClientRef.current.x - rect.left) / rect.width) * 2 - 1;
          pointer.y = -(((pointerClientRef.current.y - rect.top) / rect.height) * 2 - 1);
          raycaster.setFromCamera(pointer, camera);

          const hits = raycaster.intersectObjects(hitMeshes, false);
          hoveredMeshRef.current = getStableTitleHit(hits, hoveredMeshRef.current);
        }

        renderer.render(scene, camera);
        animationFrame = window.requestAnimationFrame(render);
      };

      resize();
      updateMeshes();
      animationFrame = window.requestAnimationFrame(render);
      window.addEventListener("resize", resize);

      cleanupScene = () => {
        window.cancelAnimationFrame(animationFrame);
        window.removeEventListener("resize", resize);
        scene.remove(group);
        cylinderGeometry.dispose();
        cylinderMaterial.dispose();
        hitMaterial.dispose();
        incomingImageSide?.dispose();
        disposeMeshes(meshes);
        hitMeshes.forEach((mesh) => mesh.geometry?.dispose());
        renderer.dispose();
        meshesRef.current = [];
        hitMeshesRef.current = [];
        sceneStateRef.current = null;
      };
    };

    setupScene();

    return () => {
      cancelled = true;
      cleanupScene();
    };
  }, [cylinderMode, projects, layout.letterSpacing, layout.lineHeight]);

  const getIntersectedMesh = useCallback((clientX, clientY) => {
    const sceneState = sceneStateRef.current;
    if (!sceneState) return null;

    const rect = sceneState.container.getBoundingClientRect();
    sceneState.pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    sceneState.pointer.y = -(((clientY - rect.top) / rect.height) * 2 - 1);
    sceneState.raycaster.setFromCamera(sceneState.pointer, sceneState.camera);

    if (sceneState.media) {
      const [hit] = sceneState.raycaster.intersectObject(sceneState.media.mesh, false);
      if (!hit?.uv) return null;

      const material = sceneState.media.mesh.material;
      const sampledV = wrapUnit(hit.uv.y * material.uniforms.visibleRepeat.value + material.uniforms.scrollOffset.value);
      const project = findMediaRowByUnit(sceneState.media.atlas.rows, sampledV)?.project;

      return project ? { userData: { project } } : null;
    }

    const hits = sceneState.raycaster.intersectObjects(sceneState.hitMeshes, false);
    return getStableTitleHit(hits, hoveredMeshRef.current);
  }, []);

  const handleWheel = useCallback((event) => {
    event.preventDefault();
    rotationRef.current.velocity -= event.deltaY * SCROLL_SPEED * SCROLL_RESISTANCE;
  }, []);

  const handlePointerDown = useCallback((event) => {
    pointerRef.current = {
      dragging: true,
      moved: false,
      lastY: event.clientY,
      pointerId: event.pointerId,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
  }, []);

  const handlePointerMove = useCallback(
    (event) => {
      const pointerState = pointerRef.current;
      pointerClientRef.current = {
        x: event.clientX,
        y: event.clientY,
      };

      if (pointerState.dragging) {
        const deltaY = event.clientY - pointerState.lastY;
        pointerState.lastY = event.clientY;
        pointerState.moved = pointerState.moved || Math.abs(deltaY) > 2;
        rotationRef.current.velocity += deltaY * DRAG_SPEED * DRAG_RESISTANCE;
        hoveredMeshRef.current = null;
        setIsClickable(false);
        return;
      }

      const mesh = getIntersectedMesh(event.clientX, event.clientY);
      hoveredMeshRef.current = mesh;
      setIsClickable(Boolean(mesh?.userData?.project));
    },
    [getIntersectedMesh],
  );

  const handlePointerUp = useCallback(
    (event) => {
      const pointerState = pointerRef.current;
      const wasClick = pointerState.dragging && !pointerState.moved;

      if (pointerState.pointerId !== null) {
        event.currentTarget.releasePointerCapture(pointerState.pointerId);
      }

      pointerRef.current = {
        dragging: false,
        moved: false,
        lastY: 0,
        pointerId: null,
      };
      setIsDragging(false);

      if (wasClick) {
        const mesh = getIntersectedMesh(event.clientX, event.clientY);
        if (mesh?.userData?.project) navigateToProject(mesh.userData.project);
      }
    },
    [getIntersectedMesh, navigateToProject],
  );

  const handlePointerLeave = useCallback(() => {
    hoveredMeshRef.current = null;
    pointerClientRef.current = null;
    if (!pointerRef.current.dragging) setIsClickable(false);
  }, []);

  const handleLayoutChange = useCallback((group, key, value) => {
    const nextLayout = cloneLayout(layoutRef.current);
    if (group === "spacing") {
      nextLayout[key] = Number(value);
    } else {
      nextLayout[group][key] = Number(value);
    }
    layoutRef.current = nextLayout;
    setLayout(nextLayout);
  }, []);

  const resetLayout = useCallback(() => {
    const nextLayout = cloneLayout(DEFAULT_LAYOUT);
    layoutRef.current = nextLayout;
    setLayout(nextLayout);
  }, []);

  const coordinateOutput = useMemo(
    () =>
      JSON.stringify(
        {
          letterSpacing: roundCoordinate(layout.letterSpacing),
          lineHeight: roundCoordinate(layout.lineHeight),
          position: {
            x: roundCoordinate(layout.position.x),
            y: roundCoordinate(layout.position.y),
            z: roundCoordinate(layout.position.z),
          },
          rotation: {
            x: roundCoordinate(layout.rotation.x),
            y: roundCoordinate(layout.rotation.y),
            z: roundCoordinate(layout.rotation.z),
          },
        },
        null,
        2,
      ),
    [layout],
  );

  return (
    <section
      aria-label="3D project list"
      className={[styles.cylinder, isDragging ? styles.dragging : "", isClickable ? styles.clickable : ""]
        .filter(Boolean)
        .join(" ")}
      onPointerDown={handlePointerDown}
      onPointerLeave={handlePointerLeave}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onWheel={handleWheel}
      ref={containerRef}
    >
      <canvas className={styles.canvas} ref={canvasRef} />
      <div
        className={styles.modeToggle}
        onPointerDown={(event) => event.stopPropagation()}
        onPointerMove={(event) => event.stopPropagation()}
        onPointerUp={(event) => event.stopPropagation()}
        onWheel={(event) => event.stopPropagation()}
      >
        <button
          className={cylinderMode === CYLINDER_MODES.TITLES ? styles.modeToggleButtonActive : styles.modeToggleButton}
          onClick={() => startModeTransition(CYLINDER_MODES.TITLES)}
          type="button"
        >
          Titles
        </button>
        <button
          className={cylinderMode === CYLINDER_MODES.IMAGES ? styles.modeToggleButtonActive : styles.modeToggleButton}
          onClick={() => startModeTransition(CYLINDER_MODES.IMAGES)}
          type="button"
        >
          Images
        </button>
      </div>
      <div
        className={styles.controls}
        onPointerDown={(event) => event.stopPropagation()}
        onPointerMove={(event) => event.stopPropagation()}
        onPointerUp={(event) => event.stopPropagation()}
        onWheel={(event) => event.stopPropagation()}
      >
        <div className={styles.controlsHeader}>
          <span>3D Controls</span>
          <button className={styles.resetButton} onClick={resetLayout} type="button">
            Reset
          </button>
        </div>
        <div className={styles.controlGrid}>
          {LAYOUT_CONTROLS.map((control) => (
            <label className={styles.control} key={`${control.group}-${control.key}`}>
              <span>{control.label}</span>
              <input
                max={control.max}
                min={control.min}
                onChange={(event) => handleLayoutChange(control.group, control.key, event.target.value)}
                step={control.step}
                type="range"
                value={control.group === "spacing" ? layout[control.key] : layout[control.group][control.key]}
              />
              <output>
                {(control.group === "spacing" ? layout[control.key] : layout[control.group][control.key]).toFixed(3)}
              </output>
            </label>
          ))}
        </div>
        <pre className={styles.coordinates}>{coordinateOutput}</pre>
      </div>
      <ul aria-hidden="true" className={styles.fallbackLinks}>
        {projects.map((project) => (
          <li key={project.slug}>{project.title}</li>
        ))}
      </ul>
    </section>
  );
}
