import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import * as THREE from "three";

import { getLocalizedPath } from "@/lib/i18n";

import styles from "./CylinderView.module.css";
import { TITLE_KERNING } from "./titleKerning";

const CYLINDER_RADIUS = 2.15;
const CYLINDER_BODY_RADIUS = CYLINDER_RADIUS - 0.035;
const CYLINDER_WIDTH = 8.2;
const TEXT_HEIGHT = 0.75;
const TEXT_CURVE_SEGMENTS = 16;
const SCROLL_SPEED = 0.0032;
const DRAG_SPEED = 0.008;
const SCROLL_RESISTANCE = 0.12;
const DRAG_RESISTANCE = 0.12;
const ROTATION_INERTIA = 0.88;
const ROTATION_EASE = 0.085;
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
const HIT_HEIGHT_MULTIPLIER = 0.72;
const HIT_WIDTH_PADDING = 0.18;
const ROW_POOL_BUFFER = 4;
const VISIBLE_ANGLE_MIN = -Math.PI / 2;
const VISIBLE_ANGLE_MAX = Math.PI / 2;

const BACKGROUND = "ffffff;";
const FOREFROUND = "000000";
const DEFAULT_LAYOUT = {
  letterSpacing: -5,
  lineHeight: 0.68,
  position: {
    x: 0,
    y: 0,
    z: 0,
  },
  rotation: {
    x: 0,
    y: 0.487,
    z: 3.141,
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

function makeCylinderTextMaterial(texture) {
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
        vec3 color = mix(texel.rgb, hoverColor, hoverAmount * titleMask);

        gl_FragColor = vec4(color * shade, texel.a);
      }
    `,
    side: THREE.FrontSide,
    toneMapped: false,
    transparent: true,
    uniforms: {
      map: { value: texture },
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

function getLoopIndex(index, length) {
  return ((index % length) + length) % length;
}

function getProjectForVirtualIndex(projects, virtualIndex) {
  return projects[getLoopIndex(virtualIndex, projects.length)];
}

function updateRowMesh({ hitHeight, hitMesh, letterSpacing, mesh, project, virtualIndex }) {
  const { texture, aspect } = makeTextTexture(project, letterSpacing);
  const width = Math.min(TEXT_HEIGHT * aspect, CYLINDER_WIDTH);
  const geometry = makeCurvedTextGeometry(width, TEXT_HEIGHT);
  const material = makeCylinderTextMaterial(texture);
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
  hitMesh.geometry = hitGeometry;
  hitMesh.userData.project = project;
  hitMesh.userData.virtualIndex = virtualIndex;
  hitMesh.userData.visualMesh = mesh;
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

function applyLayout(group, layout) {
  group.position.set(layout.position.x, layout.position.y, layout.position.z);
  group.rotation.set(layout.rotation.x, layout.rotation.y, layout.rotation.z);
}

function roundCoordinate(value) {
  return Math.round(value * 1000) / 1000;
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
  const layoutRef = useRef(cloneLayout(DEFAULT_LAYOUT));
  const [layout, setLayout] = useState(() => cloneLayout(DEFAULT_LAYOUT));
  const [isDragging, setIsDragging] = useState(false);
  const [isClickable, setIsClickable] = useState(false);

  const projects = useMemo(
    () =>
      array
        .filter((entry) => entry?._type === "project" && entry?.slug?.current && entry?.title)
        .map((entry) => ({
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

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current || !projects.length) return undefined;

    const canvas = canvasRef.current;
    const container = containerRef.current;
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
      applyLayout(group, layoutRef.current);
      scene.add(group);

      const cylinderGeometry = new THREE.CylinderGeometry(
        CYLINDER_BODY_RADIUS,
        CYLINDER_BODY_RADIUS,
        CYLINDER_WIDTH,
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

      const angleStep = (TEXT_HEIGHT * layoutRef.current.lineHeight) / CYLINDER_RADIUS;
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
      const hitHeight = Math.max(0.08, TEXT_HEIGHT * layoutRef.current.lineHeight * HIT_HEIGHT_MULTIPLIER);
      const meshes = [];
      const hitMeshes = [];
      const initialBaseVirtualIndex =
        Math.floor((VISIBLE_ANGLE_MIN - rotationRef.current.current) / angleStep) - ROW_POOL_BUFFER;

      Array.from({ length: totalRows }, (_, index) => {
        const virtualIndex = initialBaseVirtualIndex + index;
        const project = getProjectForVirtualIndex(projects, virtualIndex);
        const { texture, aspect } = makeTextTexture(project, layoutRef.current.letterSpacing);
        const width = Math.min(TEXT_HEIGHT * aspect, CYLINDER_WIDTH);
        const geometry = makeCurvedTextGeometry(width, TEXT_HEIGHT);
        const material = makeCylinderTextMaterial(texture);
        const mesh = new THREE.Mesh(geometry, material);
        const hitGeometry = makeCurvedTextGeometry(Math.min(width + HIT_WIDTH_PADDING, CYLINDER_WIDTH), hitHeight, {
          heightSegments: 4,
          widthSegments: 1,
        });
        const hitMesh = new THREE.Mesh(hitGeometry, hitMaterial);

        mesh.userData = {
          index,
          project,
          virtualIndex,
        };
        hitMesh.userData = {
          index,
          project,
          visualMesh: mesh,
          virtualIndex,
        };

        group.add(mesh);
        group.add(hitMesh);
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
        const currentAngleStep = (TEXT_HEIGHT * layoutRef.current.lineHeight) / CYLINDER_RADIUS;
        const baseVirtualIndex = Math.floor((VISIBLE_ANGLE_MIN - current) / currentAngleStep) - ROW_POOL_BUFFER;

        meshes.forEach((mesh, index) => {
          const hitMesh = hitMeshes[index];
          const virtualIndex = baseVirtualIndex + index;
          const project = getProjectForVirtualIndex(projects, virtualIndex);

          if (mesh.userData.virtualIndex !== virtualIndex) {
            updateRowMesh({
              hitHeight,
              hitMesh,
              letterSpacing: layoutRef.current.letterSpacing,
              mesh,
              project,
              virtualIndex,
            });
          }

          const angle = virtualIndex * currentAngleStep + current;
          const frontness = (Math.cos(angle) + 1) / 2;

          mesh.visible = frontness >= 0.5;
          mesh.position.set(0, 0, 0);
          mesh.rotation.set(angle, 0, 0);
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
          hitMesh.rotation.set(angle, 0, 0);
          hitMesh.userData.frontness = frontness;
        });
      };

      const render = () => {
        const rotation = rotationRef.current;
        rotation.target += rotation.velocity;
        rotation.velocity *= ROTATION_INERTIA;
        if (Math.abs(rotation.velocity) < VELOCITY_STOP_THRESHOLD) rotation.velocity = 0;
        rotation.current += (rotation.target - rotation.current) * ROTATION_EASE;
        applyLayout(group, layoutRef.current);
        updateMeshes();

        if (!pointerRef.current.dragging && pointerClientRef.current) {
          const rect = container.getBoundingClientRect();
          pointer.x = ((pointerClientRef.current.x - rect.left) / rect.width) * 2 - 1;
          pointer.y = -(((pointerClientRef.current.y - rect.top) / rect.height) * 2 - 1);
          raycaster.setFromCamera(pointer, camera);

          const [hit] = raycaster.intersectObjects(hitMeshes, false);
          hoveredMeshRef.current = hit?.object?.userData?.visualMesh || null;
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
  }, [projects, layout.letterSpacing, layout.lineHeight]);

  const getIntersectedMesh = useCallback((clientX, clientY) => {
    const sceneState = sceneStateRef.current;
    if (!sceneState) return null;

    const rect = sceneState.container.getBoundingClientRect();
    sceneState.pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    sceneState.pointer.y = -(((clientY - rect.top) / rect.height) * 2 - 1);
    sceneState.raycaster.setFromCamera(sceneState.pointer, sceneState.camera);

    const [hit] = sceneState.raycaster.intersectObjects(sceneState.hitMeshes, false);
    return hit?.object?.userData?.visualMesh || null;
  }, []);

  const handleWheel = useCallback((event) => {
    event.preventDefault();
    rotationRef.current.velocity += event.deltaY * SCROLL_SPEED * SCROLL_RESISTANCE;
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
        rotationRef.current.velocity -= deltaY * DRAG_SPEED * DRAG_RESISTANCE;
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
