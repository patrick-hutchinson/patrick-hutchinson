import { useRouter } from "next/router";
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { DeviceContext } from "@/context/DeviceContext";
import {
  getMediumPreviewImageUrl,
  getProjectThumbnailMedia,
  getVideoRenditionUrl,
  preloadImageUrl,
} from "@/lib/media/projectThumbnails";

import styles from "./ImageView.module.css";

const ASPECT_DESKTOP = 1920 / 1080;
const ASPECT_MOBILE = 1080 / 1920;
const DPR_CAP = 1.5;
const IMAGE_WIDTH_RATIO = 0.66;
const INERTIA = 0.08;
const ITEM_GAP_RATIO = 0.04;
const ENTRY_SCROLL_OFFSET_ITEMS = 13;
const PROGRAMMATIC_SCROLL_DURATION = 1100;
const SCROLL_SENSITIVITY = 1;
const MOBILE_SCROLL_SENSITIVITY = 4;
const SCREEN_EDGE_SCALE = 1;
const TEXTURE_TEXT_SCALE = 2;
const VELOCITY_DECAY = 0.92;
const VELOCITY_EASE = 0.11;
const VISIBLE_CYCLES = [-1, 0, 1, 2];

const VERTEX_SHADER = `
attribute vec2 a_position;

uniform vec2 u_resolution;
uniform vec4 u_drawRect;

varying vec2 v_screenPixel;

void main() {
  vec2 pixel = u_drawRect.xy + a_position * u_drawRect.zw;
  vec2 clip = (pixel / u_resolution) * 2.0 - 1.0;

  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
  v_screenPixel = pixel;
}
`;

const FRAGMENT_SHADER = `
precision highp float;

uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform vec2 u_uvScale;
uniform vec2 u_uvOffset;
uniform vec4 u_sourceRect;
uniform float u_velocity;

varying vec2 v_screenPixel;

void main() {
  float speed = clamp(abs(u_velocity) / 300.0, 0.0, 1.0);
  float direction = sign(u_velocity);
  vec2 centered = v_screenPixel / u_resolution - 0.5;
  float aspect = u_resolution.x / u_resolution.y;

  centered.x *= aspect;

  float radius = length(centered);
  float lens = 1.0 - speed * 0.32 * (1.0 - smoothstep(0.0, 1.34, radius));
  float horizontalPull = 1.0 - speed * 0.24 * (1.0 - smoothstep(0.0, 1.02, abs(centered.y)));

  centered.x /= horizontalPull;
  centered.y += direction * speed * 0.34 * (1.0 - smoothstep(0.0, 1.08, abs(centered.x))) * (0.78 - abs(centered.y));
  centered /= lens;
  centered.x /= aspect;

  vec2 sourcePixel = (centered + 0.5) * u_resolution;
  vec2 itemUv = (sourcePixel - u_sourceRect.xy) / u_sourceRect.zw;
  vec2 sourceUv = vec2(itemUv.x, 1.0 - itemUv.y);
  vec2 mediaUv = sourceUv * u_uvScale + u_uvOffset;

  if (itemUv.x < 0.0 || itemUv.x > 1.0 || itemUv.y < 0.0 || itemUv.y > 1.0 ||
      mediaUv.x < 0.0 || mediaUv.x > 1.0 || mediaUv.y < 0.0 || mediaUv.y > 1.0) {
    discard;
  }

  gl_FragColor = texture2D(u_texture, mediaUv);
}
`;

function wrap(value, max) {
  if (max <= 0) return 0;
  return ((value % max) + max) % max;
}

function easeInOutSmootherStep(progress) {
  const t = Math.min(1, Math.max(0, progress));

  return t * t * t * (t * (t * 6 - 15) + 10);
}

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function createProgram(gl) {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);

  if (!vertexShader || !fragmentShader) return null;

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }

  return program;
}

function getCoverUv(imageWidth, imageHeight, frameWidth, frameHeight) {
  const imageAspect = imageWidth / imageHeight;
  const frameAspect = frameWidth / frameHeight;

  if (imageAspect > frameAspect) {
    const scaleX = frameAspect / imageAspect;
    return {
      offset: [(1 - scaleX) / 2, 0],
      scale: [scaleX, 1],
    };
  }

  const scaleY = imageAspect / frameAspect;
  return {
    offset: [0, (1 - scaleY) / 2],
    scale: [1, scaleY],
  };
}

function createTexture(gl, image) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

  return texture;
}

function updateTexture(gl, texture, source) {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
}

function getCssVariable(name, fallback) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

function getPixelValue(value, fallback) {
  const parsed = parseFloat(value);
  if (!Number.isFinite(parsed)) return fallback;

  if (typeof value === "string" && value.endsWith("rem")) {
    return parsed * (parseFloat(getComputedStyle(document.documentElement).fontSize) || 10);
  }

  return parsed;
}

function getReleaseYear(project) {
  return project?.scheduling?.year ? `‘${project.scheduling.year.slice(0, 2)}` : "";
}

function getLineHeight(variableName, fallback, fontSize) {
  const lineHeightValue = getCssVariable(variableName, fallback);
  const lineHeightNumber = getPixelValue(lineHeightValue, parseFloat(fallback));

  return lineHeightValue.endsWith("px") || lineHeightValue.endsWith("rem") ? lineHeightNumber : fontSize * lineHeightNumber;
}

function createMetadataTexture(gl, project) {
  const title = project?.title || "";
  const year = getReleaseYear(project);
  const location = project?.scheduling?.location || "";
  const fineprintSize = getPixelValue(getCssVariable("--font-size-fineprint", "12.5px"), 12.5);
  const h4Size = getPixelValue(getCssVariable("--font-size-4", "17.5px"), 17.5);
  const fineprintLineHeight = getLineHeight("--line-height-fineprint", "13.5px", fineprintSize);
  const h4LineHeight = getLineHeight("--line-height-4", "17.5px", h4Size);
  const lineHeight = Math.max(fineprintLineHeight, h4LineHeight);
  const family = "NeueHaasGroteskText, Arial, Helvetica, sans-serif";
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) return null;

  const gap = h4Size * 0.35;
  const padding = 2;
  const parts = [
    { color: "#9c9c9d", font: `500 ${fineprintSize}px ${family}`, text: year },
    { color: getCssVariable("--foreground", "#0a0a0a"), font: `bold ${h4Size}px ${family}`, text: title },
    { color: "#9c9c9d", font: `500 ${fineprintSize}px ${family}`, text: location },
  ].filter((part) => part.text);

  if (!parts.length) return null;

  const measuredWidth = parts.reduce((width, part, index) => {
    context.font = part.font;
    return width + context.measureText(part.text).width + (index > 0 ? gap : 0);
  }, 0);

  const width = Math.max(1, Math.ceil((measuredWidth + padding * 2) * TEXTURE_TEXT_SCALE));
  const height = Math.max(1, Math.ceil(lineHeight * TEXTURE_TEXT_SCALE));

  canvas.width = width;
  canvas.height = height;

  context.scale(TEXTURE_TEXT_SCALE, TEXTURE_TEXT_SCALE);
  context.clearRect(0, 0, width, height);
  context.textBaseline = "middle";

  let x = padding;
  parts.forEach((part, index) => {
    if (index > 0) x += gap;

    context.fillStyle = part.color;
    context.font = part.font;
    context.fillText(part.text, x, lineHeight / 2);
    x += context.measureText(part.text).width;
  });

  return {
    height,
    pixelRatio: TEXTURE_TEXT_SCALE,
    texture: createTexture(gl, canvas),
    width,
  };
}

function createSafeMetadataTexture(gl, project) {
  try {
    return createMetadataTexture(gl, project);
  } catch {
    return null;
  }
}

function loadImage(url) {
  return new Promise((resolve) => {
    if (!url) {
      resolve(null);
      return;
    }

    const image = new Image();
    image.crossOrigin = "anonymous";
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = url;
  });
}

function loadVideo(url) {
  return new Promise((resolve) => {
    if (!url) {
      resolve(null);
      return;
    }

    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";

    const resolveVideo = () => {
      video.removeEventListener("loadeddata", resolveVideo);
      video.removeEventListener("error", resolveNull);
      video.play().catch(() => {});
      resolve(video);
    };

    const resolveNull = () => {
      video.removeEventListener("loadeddata", resolveVideo);
      video.removeEventListener("error", resolveNull);
      resolve(null);
    };

    video.addEventListener("loadeddata", resolveVideo, { once: true });
    video.addEventListener("error", resolveNull, { once: true });
    video.src = url;
    video.load();
  });
}

async function loadTextureEntry(gl, item) {
  if (item.medium?.type === "video") {
    const previewImage = await loadImage(item.previewUrl);

    if (previewImage) {
      const entry = {
        hasUploadedVideoFrame: false,
        height: previewImage.naturalHeight || previewImage.height || 1080,
        metadata: createSafeMetadataTexture(gl, item.project),
        source: null,
        texture: createTexture(gl, previewImage),
        type: "video",
        width: previewImage.naturalWidth || previewImage.width || 1920,
      };

      loadVideo(getVideoRenditionUrl(item.medium)).then((video) => {
        if (!video) return;

        entry.source = video;
        entry.width = video.videoWidth || entry.width;
        entry.height = video.videoHeight || entry.height;
      });

      return entry;
    }

    const video = await loadVideo(getVideoRenditionUrl(item.medium));
    if (!video) return null;

    return {
      hasUploadedVideoFrame: false,
      height: video.videoHeight || 1080,
      metadata: createSafeMetadataTexture(gl, item.project),
      source: video,
      texture: createTexture(gl, video),
      type: "video",
      width: video.videoWidth || 1920,
    };
  }

  const image = await loadImage(item.medium?.url || item.previewUrl);
  if (!image) return null;

  return {
    height: image.naturalHeight || image.height,
    metadata: createSafeMetadataTexture(gl, item.project),
    source: image,
    texture: createTexture(gl, image),
    type: "image",
    width: image.naturalWidth || image.width,
  };
}

function drawTextureRect(state, texture, rect, sourceRect, uv, velocity, drawPadding = 0) {
  const { gl } = state;

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.uniform4f(
    state.uniforms.drawRect,
    rect.x - drawPadding,
    rect.y - drawPadding,
    rect.width + drawPadding * 2,
    rect.height + drawPadding * 2,
  );
  gl.uniform4f(state.uniforms.sourceRect, sourceRect.x, sourceRect.y, sourceRect.width, sourceRect.height);
  gl.uniform2f(state.uniforms.uvScale, uv.scale[0], uv.scale[1]);
  gl.uniform2f(state.uniforms.uvOffset, uv.offset[0], uv.offset[1]);
  gl.uniform1f(state.uniforms.velocity, velocity);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

const ImageView = ({ array }) => {
  const { isMobile } = useContext(DeviceContext);
  const router = useRouter();
  const imageViewRef = useRef(null);
  const canvasRef = useRef(null);
  const frameRef = useRef(null);
  const glState = useRef(null);
  const preloadedImages = useRef([]);
  const rafRef = useRef(null);
  const activeIndexRef = useRef(0);
  const activeImageRect = useRef(null);
  const listMetrics = useRef(null);
  const programmaticScroll = useRef(null);
  const hasPlayedEntryAnimation = useRef(false);
  const scrollCurrent = useRef(0);
  const scrollTarget = useRef(0);
  const touchY = useRef(null);
  const velocity = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [hasWebGl, setHasWebGl] = useState(true);
  const [isImageHovered, setIsImageHovered] = useState(false);

  const projects = useMemo(
    () =>
      array.filter(
        (entry) =>
          entry?._type === "project" &&
          entry?.slug?.current &&
          (entry?.thumbnail?.medium ||
            entry?.thumbnail_mobile?.medium ||
            entry?.coverMedia?.medium ||
            entry?.coverMedia_mobile?.medium),
      ),
    [array],
  );

  const items = useMemo(
    () =>
      projects.map((project) => {
        const medium = getProjectThumbnailMedia(project, isMobile);
        const previewUrl = getMediumPreviewImageUrl(medium, isMobile ? 1080 : 1920);

        return {
          medium,
          previewUrl,
          project,
        };
      }),
    [isMobile, projects],
  );

  useEffect(() => {
    preloadedImages.current = items.map((item) => preloadImageUrl(item.previewUrl)).filter(Boolean);
  }, [items]);

  const navigateToActiveProject = useCallback(() => {
    const project = projects[activeIndex];
    if (!project?.slug?.current) return;

    router.push(`/projects/${project.slug.current}`, undefined, { scroll: false });
  }, [activeIndex, projects, router]);

  const updateActiveIndex = useCallback((nextIndex) => {
    if (activeIndexRef.current === nextIndex) return;

    activeIndexRef.current = nextIndex;
    setActiveIndex(nextIndex);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !items.length) return undefined;

    const gl = canvas.getContext("webgl", { alpha: true, antialias: true });
    if (!gl) {
      setHasWebGl(false);
      return undefined;
    }

    const program = createProgram(gl);
    if (!program) {
      setHasWebGl(false);
      return undefined;
    }

    const positionBuffer = gl.createBuffer();
    const textures = new Array(items.length).fill(null);
    let isDisposed = false;

    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]), gl.STATIC_DRAW);
    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const state = {
      attributes: {
        position: gl.getAttribLocation(program, "a_position"),
      },
      gl,
      positionBuffer,
      program,
      textures,
      uniforms: {
        drawRect: gl.getUniformLocation(program, "u_drawRect"),
        resolution: gl.getUniformLocation(program, "u_resolution"),
        sourceRect: gl.getUniformLocation(program, "u_sourceRect"),
        texture: gl.getUniformLocation(program, "u_texture"),
        uvOffset: gl.getUniformLocation(program, "u_uvOffset"),
        uvScale: gl.getUniformLocation(program, "u_uvScale"),
        velocity: gl.getUniformLocation(program, "u_velocity"),
      },
    };

    glState.current = state;

    items.forEach((item, index) => {
      loadTextureEntry(gl, item)
        .then((entry) => {
          if (isDisposed || !entry) {
            entry?.source?.pause?.();
            return;
          }

          textures[index] = entry;
        })
        .catch((entry) => {
          entry?.source?.pause?.();
        });
    });

    return () => {
      isDisposed = true;
      window.cancelAnimationFrame(rafRef.current);
      textures.forEach((entry) => {
        entry?.source?.pause?.();
        if (entry?.texture) gl.deleteTexture(entry.texture);
        if (entry?.metadata?.texture) gl.deleteTexture(entry.metadata.texture);
      });
      gl.deleteBuffer(positionBuffer);
      gl.deleteProgram(program);
      glState.current = null;
    };
  }, [items]);

  useEffect(() => {
    if (!items.length) return undefined;

    const render = () => {
      const canvas = canvasRef.current;
      const state = glState.current;
      const gl = state?.gl;
      const frame = frameRef.current;

      if (!canvas || !gl || !state || !frame) {
        rafRef.current = window.requestAnimationFrame(render);
        return;
      }

      const rect = frame.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
      const width = Math.max(1, Math.round(rect.width * dpr));
      const height = Math.max(1, Math.round(rect.height * dpr));

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }

      const aspectRatio = isMobile ? ASPECT_MOBILE : ASPECT_DESKTOP;
      const imageWidth = rect.width * IMAGE_WIDTH_RATIO * dpr;
      const imageHeight = imageWidth / aspectRatio;
      const margin = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--margin")) || 0;
      const fontSize = getPixelValue(getCssVariable("--font-size-4", "17.5px"), 17.5);
      const captionGap = margin * 0.4 * dpr;
      const captionHeight = (fontSize + margin * 0.8) * dpr;
      const itemHeight = imageHeight + captionGap + captionHeight;
      const itemGap = imageHeight * ITEM_GAP_RATIO;
      const itemStride = itemHeight + itemGap;
      const listHeight = itemStride * items.length;
      const now = performance.now();
      listMetrics.current = { itemStride, listHeight };

      if (!hasPlayedEntryAnimation.current) {
        const entryOffset = itemStride * Math.min(ENTRY_SCROLL_OFFSET_ITEMS, Math.max(items.length - 1, 0));

        hasPlayedEntryAnimation.current = true;
        scrollCurrent.current = entryOffset;
        scrollTarget.current = entryOffset;
        programmaticScroll.current = {
          duration: PROGRAMMATIC_SCROLL_DURATION,
          from: entryOffset,
          start: now,
          to: 0,
        };
      }

      if (programmaticScroll.current) {
        const { duration, from, start, to } = programmaticScroll.current;
        const progress = Math.min(1, (now - start) / duration);
        const easedProgress = easeInOutSmootherStep(progress);

        scrollTarget.current = from + (to - from) * easedProgress;

        if (progress >= 1) {
          scrollTarget.current = to;
          programmaticScroll.current = null;
        }
      }

      const previousScroll = scrollCurrent.current;
      scrollCurrent.current += (scrollTarget.current - scrollCurrent.current) * INERTIA;

      const scrollDelta = scrollCurrent.current - previousScroll;
      velocity.current = velocity.current * VELOCITY_DECAY + scrollDelta * VELOCITY_EASE;

      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(state.program);
      gl.uniform2f(state.uniforms.resolution, width, height);
      gl.uniform1i(state.uniforms.texture, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, state.positionBuffer);
      gl.enableVertexAttribArray(state.attributes.position);
      gl.vertexAttribPointer(state.attributes.position, 2, gl.FLOAT, false, 0, 0);

      const centerY = height / 2;
      let closestIndex = activeIndexRef.current;
      let closestDistance = Number.POSITIVE_INFINITY;
      const drawPadding = Math.min(height * 0.26, imageHeight * 0.7);
      const scrollOffset = wrap(scrollCurrent.current, listHeight);
      let closestRect = null;

      for (const cycle of VISIBLE_CYCLES) {
        for (let index = 0; index < items.length; index += 1) {
          const textureEntry = state.textures[index];

          const y = cycle * listHeight + index * itemStride - scrollOffset + (height - itemHeight) / 2;
          if (y > height + itemHeight || y + itemHeight < -itemHeight) continue;

          const itemCenterDistance = Math.abs(y + itemHeight / 2 - centerY);
          const centerProgress = 1 - Math.min(itemCenterDistance / (height / 2 + itemHeight / 2), 1);
          const scaleProgress = centerProgress * centerProgress * (3 - 2 * centerProgress);
          const itemScale = SCREEN_EDGE_SCALE + (1 - SCREEN_EDGE_SCALE) * scaleProgress;
          const scaledImageWidth = imageWidth * itemScale;
          const scaledImageHeight = imageHeight * itemScale;
          const scaledX = isMobile ? (width - scaledImageWidth) / 2 : 0;
          const scaledY = y + (imageHeight - scaledImageHeight) / 2;

          if (!textureEntry?.texture) continue;

          if (itemCenterDistance < closestDistance) {
            closestDistance = itemCenterDistance;
            closestIndex = index;
            closestRect = {
              bottom: rect.top + (scaledY + scaledImageHeight) / dpr,
              left: rect.left + scaledX / dpr,
              right: rect.left + (scaledX + scaledImageWidth) / dpr,
              top: rect.top + scaledY / dpr,
            };
          }

          const coverUv = getCoverUv(textureEntry.width, textureEntry.height, scaledImageWidth, scaledImageHeight);

          gl.activeTexture(gl.TEXTURE0);
          if (
            textureEntry.type === "video" &&
            textureEntry.source?.readyState >= 2 &&
            (textureEntry.hasUploadedVideoFrame || textureEntry.source.currentTime > 0.05)
          ) {
            updateTexture(gl, textureEntry.texture, textureEntry.source);
            textureEntry.hasUploadedVideoFrame = true;
          }

          drawTextureRect(
            state,
            textureEntry.texture,
            { height: scaledImageHeight, width: scaledImageWidth, x: scaledX, y: scaledY },
            { height: scaledImageHeight, width: scaledImageWidth, x: scaledX, y: scaledY },
            coverUv,
            velocity.current,
            drawPadding,
          );

          if (textureEntry.metadata?.texture) {
            const metadataWidth = Math.min(
              (textureEntry.metadata.width / textureEntry.metadata.pixelRatio) * dpr,
              scaledImageWidth,
            );
            const metadataHeight = (textureEntry.metadata.height / textureEntry.metadata.pixelRatio) * dpr;
            const metadataX = scaledX;
            const metadataY = scaledY + scaledImageHeight + captionGap;

            drawTextureRect(
              state,
              textureEntry.metadata.texture,
              { height: metadataHeight, width: metadataWidth, x: metadataX, y: metadataY },
              { height: metadataHeight, width: metadataWidth, x: metadataX, y: metadataY },
              { offset: [0, 0], scale: [1, 1] },
              velocity.current,
              drawPadding,
            );
          }
        }
      }

      updateActiveIndex(closestIndex);
      activeImageRect.current = closestRect;
      rafRef.current = window.requestAnimationFrame(render);
    };

    rafRef.current = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(rafRef.current);
    };
  }, [isMobile, items.length, updateActiveIndex]);

  const handleWheel = useCallback(
    (event) => {
      event.preventDefault();
      programmaticScroll.current = null;
      scrollTarget.current += event.deltaY * (isMobile ? MOBILE_SCROLL_SENSITIVITY : SCROLL_SENSITIVITY);
    },
    [isMobile],
  );

  const handleTouchStart = (event) => {
    touchY.current = event.touches[0]?.clientY ?? null;
  };

  const handleTouchMove = useCallback(
    (event) => {
      if (touchY.current === null) return;

      event.preventDefault();

      const nextTouchY = event.touches[0]?.clientY;
      if (typeof nextTouchY !== "number") return;

      programmaticScroll.current = null;
      scrollTarget.current += (touchY.current - nextTouchY) * (isMobile ? MOBILE_SCROLL_SENSITIVITY : SCROLL_SENSITIVITY);
      touchY.current = nextTouchY;
    },
    [isMobile],
  );

  const handleTouchEnd = () => {
    touchY.current = null;
  };

  const handleClick = (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;

    const rect = activeImageRect.current;
    if (
      !rect ||
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    ) {
      return;
    }

    navigateToActiveProject();
  };

  const handlePointerMove = (event) => {
    if (event.pointerType === "touch") return;

    const rect = activeImageRect.current;
    const nextIsImageHovered = Boolean(
      rect &&
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom,
    );

    setIsImageHovered((currentIsImageHovered) =>
      currentIsImageHovered === nextIsImageHovered ? currentIsImageHovered : nextIsImageHovered,
    );
  };

  const handlePointerLeave = (event) => {
    if (event.pointerType === "touch") return;

    setIsImageHovered(false);
  };

  const scrollToIndex = (index) => {
    const metrics = listMetrics.current;
    if (!metrics) return;

    const currentOffset = wrap(scrollTarget.current, metrics.listHeight);
    const targetOffset = index * metrics.itemStride;
    let delta = targetOffset - currentOffset;

    if (delta > metrics.listHeight / 2) delta -= metrics.listHeight;
    if (delta < -metrics.listHeight / 2) delta += metrics.listHeight;

    programmaticScroll.current = {
      duration: PROGRAMMATIC_SCROLL_DURATION,
      from: scrollTarget.current,
      start: performance.now(),
      to: scrollTarget.current + delta,
    };
  };

  const handleIndicatorClick = (event, index) => {
    event.preventDefault();
    event.stopPropagation();
    scrollToIndex(index);
  };

  useEffect(() => {
    const handleWindowKeyDown = (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !projects.length) return;

      if (event.key === "ArrowDown" || event.key === "ArrowRight") {
        event.preventDefault();
        event.stopPropagation();
        scrollToIndex((activeIndexRef.current + 1) % projects.length);
        return;
      }

      if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
        event.preventDefault();
        event.stopPropagation();
        scrollToIndex((activeIndexRef.current - 1 + projects.length) % projects.length);
      }
    };

    window.addEventListener("keydown", handleWindowKeyDown, true);

    return () => {
      window.removeEventListener("keydown", handleWindowKeyDown, true);
    };
  }, [projects.length]);

  const handleKeyDown = (event) => {
    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      event.preventDefault();
      scrollToIndex((activeIndex + 1) % projects.length);
      return;
    }

    if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      event.preventDefault();
      scrollToIndex((activeIndex - 1 + projects.length) % projects.length);
      return;
    }

    if (event.key !== "Enter" && event.key !== " ") return;

    event.preventDefault();
    navigateToActiveProject();
  };

  useEffect(() => {
    const node = imageViewRef.current;
    if (!node) return undefined;

    node.addEventListener("wheel", handleWheel, { passive: false });
    node.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      node.removeEventListener("wheel", handleWheel);
      node.removeEventListener("touchmove", handleTouchMove);
    };
  }, [handleTouchMove, handleWheel]);

  if (!projects.length) return null;

  return (
    <div
      className={[styles.imageView, isImageHovered ? styles.imageViewClickable : null].filter(Boolean).join(" ")}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onPointerLeave={handlePointerLeave}
      onPointerMove={handlePointerMove}
      onTouchEnd={handleTouchEnd}
      onTouchStart={handleTouchStart}
      ref={imageViewRef}
      role="link"
      tabIndex={0}
    >
      <div className={styles.canvasFrame} ref={frameRef}>
        <canvas aria-hidden="true" className={styles.canvas} ref={canvasRef} />
      </div>
      {!isMobile ? (
        <div aria-label="Project position" className={styles.positionIndicator}>
          {items.map((item, index) => (
            <button
              aria-label={`Scroll to ${item.project.title}`}
              className={[styles.positionThumbnailButton, index === activeIndex ? styles.positionThumbnailActive : null]
                .filter(Boolean)
                .join(" ")}
              key={item.project._id}
              onClick={(event) => handleIndicatorClick(event, index)}
              onMouseLeave={(event) => event.currentTarget.blur()}
              type="button"
            >
              <img
                alt=""
                className={[styles.positionThumbnail, index === activeIndex ? styles.positionThumbnailActive : null]
                  .filter(Boolean)
                  .join(" ")}
                draggable={false}
                src={item.previewUrl}
              />
            </button>
          ))}
        </div>
      ) : null}
      {!hasWebGl ? (
        <div className={styles.fallback}>
          {[...items, ...items, ...items].map((item, index) => (
            <div className={styles.fallbackItem} key={`${item.project._id}-${index}`}>
              <img alt="" className={styles.fallbackImage} draggable={false} src={item.previewUrl} />
              <div className={styles.fallbackMetadata}>
                <span className={styles.metadataYear} typo="fineprint">
                  {getReleaseYear(item.project)}
                </span>
                <span className={styles.metadataTitle} typo="h4">
                  {item.project.title}
                </span>
                <span className={styles.metadataLocation} typo="fineprint">
                  {item.project.scheduling?.location}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default ImageView;
