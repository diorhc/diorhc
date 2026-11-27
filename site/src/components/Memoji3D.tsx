import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { useT, useTheme } from "@/lib/store";
import { cn, withBase } from "@/lib/utils";

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/**
 * Computes fast per-vertex topological Ambient Occlusion / cavity shading
 * directly from mesh curvature (2-pass triangle neighbor smoothing) and stores
 * it in `color` vertex attribute.
 */
function applyCavityAO(
  T: typeof import("three"),
  geometry: import("three").BufferGeometry
) {
  geometry.computeVertexNormals();
  const posAttr = geometry.getAttribute("position");
  const normAttr = geometry.getAttribute("normal");
  const index = geometry.getIndex();
  if (!posAttr || !normAttr || !index) return;

  const vCount = posAttr.count;
  const idxArr = index.array;

  const sumX = new Float32Array(vCount);
  const sumY = new Float32Array(vCount);
  const sumZ = new Float32Array(vCount);
  const counts = new Uint16Array(vCount);

  for (let i = 0; i < idxArr.length; i += 3) {
    const a = idxArr[i];
    const b = idxArr[i + 1];
    const c = idxArr[i + 2];

    const ax = posAttr.getX(a), ay = posAttr.getY(a), az = posAttr.getZ(a);
    const bx = posAttr.getX(b), by = posAttr.getY(b), bz = posAttr.getZ(b);
    const cx = posAttr.getX(c), cy = posAttr.getY(c), cz = posAttr.getZ(c);

    sumX[a] += bx + cx; sumY[a] += by + cy; sumZ[a] += bz + cz; counts[a] += 2;
    sumX[b] += ax + cx; sumY[b] += ay + cy; sumZ[b] += az + cz; counts[b] += 2;
    sumX[c] += ax + bx; sumY[c] += ay + by; sumZ[c] += az + bz; counts[c] += 2;
  }

  let aoField = new Float32Array(vCount);
  for (let v = 0; v < vCount; v++) {
    const cnt = counts[v];
    if (cnt === 0) {
      aoField[v] = 0.85;
      continue;
    }
    const dx = posAttr.getX(v) - sumX[v] / cnt;
    const dy = posAttr.getY(v) - sumY[v] / cnt;
    const dz = posAttr.getZ(v) - sumZ[v] / cnt;
    const cavity =
      dx * normAttr.getX(v) + dy * normAttr.getY(v) + dz * normAttr.getZ(v);
    aoField[v] = clamp(0.84 + cavity * 14.0, 0.42, 1.12);
  }

  // Two quick neighbor-smoothing passes for organic sculptural gradients
  for (let pass = 0; pass < 2; pass++) {
    const accum = new Float32Array(vCount);
    const wCount = new Uint16Array(vCount);
    for (let i = 0; i < idxArr.length; i += 3) {
      const a = idxArr[i];
      const b = idxArr[i + 1];
      const c = idxArr[i + 2];
      accum[a] += aoField[b] + aoField[c]; wCount[a] += 2;
      accum[b] += aoField[a] + aoField[c]; wCount[b] += 2;
      accum[c] += aoField[a] + aoField[b]; wCount[c] += 2;
    }
    const next = new Float32Array(vCount);
    for (let v = 0; v < vCount; v++) {
      next[v] =
        wCount[v] > 0 ? aoField[v] * 0.45 + (accum[v] / wCount[v]) * 0.55 : aoField[v];
    }
    aoField = next;
  }

  const colors = new Float32Array(vCount * 3);
  for (let v = 0; v < vCount; v++) {
    const c = clamp(aoField[v], 0.42, 1.12);
    colors[v * 3] = c;
    colors[v * 3 + 1] = c;
    colors[v * 3 + 2] = c;
  }
  geometry.setAttribute("color", new T.BufferAttribute(colors, 3));
}

export function Memoji3D() {
  const theme = useTheme();
  const t = useT();
  const prefersReducedMotion = useReducedMotion();

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const sceneRef = useRef<{
    scene: import("three").Scene;
    material: import("three").MeshPhysicalMaterial;
    rimUniforms: {
      uRimColor: { value: import("three").Color };
      uRimStrength: { value: number };
    };
    rim: import("three").DirectionalLight;
    backRim: import("three").DirectionalLight;
    fill: import("three").DirectionalLight;
    key: import("three").DirectionalLight;
    ambient: import("three").AmbientLight;
  } | null>(null);

  const [ready, setReady] = useState(false);
  // The poster (a still frame of the same model) is shown first; the 3D scene
  // only loads once the hero is on screen and the browser is idle.
  const [enabled, setEnabled] = useState(false);
  const [dragging, setDragging] = useState(false);

  const pointerTarget = useRef({ yaw: 0, pitch: 0 });
  const spinState = useRef({
    dragging: false,
    lastX: 0,
    lastY: 0,
    yaw: 0,
    pitch: 0.04,
    velYaw: 0,
    velPitch: 0,
    lastInteractAt: 0,
  });

  const glbSrc = withBase("models/memoji.glb");
  const posterDark = withBase("models/memoji-poster-dark.webp");
  const posterLight = withBase("models/memoji-poster-light.webp");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    // Data saver or 2G: keep the poster, load 3D on tap. ("3g" is left out:
    // Chrome's estimate reports it on plenty of fast connections.)
    const conn = (
      navigator as Navigator & {
        connection?: { saveData?: boolean; effectiveType?: string };
      }
    ).connection;
    if (conn?.saveData || /2g$/.test(conn?.effectiveType ?? "")) return;

    let idleId = 0;
    let timeoutId = 0;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        io.disconnect();
        if ("requestIdleCallback" in window) {
          idleId = window.requestIdleCallback(() => setEnabled(true), {
            timeout: 2000,
          });
        } else {
          timeoutId = globalThis.setTimeout(() => setEnabled(true), 300);
        }
      },
      { rootMargin: "120px" }
    );
    io.observe(container);
    return () => {
      io.disconnect();
      if (idleId) window.cancelIdleCallback(idleId);
      if (timeoutId) globalThis.clearTimeout(timeoutId);
    };
  }, []);

  // Live theme sync for studio lighting, gunmetal/titanium tones, and Fresnel rim
  useEffect(() => {
    const ctx = sceneRef.current;
    if (!ctx) return;
    const isLight = theme === "light";

    ctx.scene.environmentIntensity = isLight ? 1.2 : 1.15;
    ctx.material.color.setHex(isLight ? 0x7c8494 : 0x5c6373);
    ctx.material.metalness = isLight ? 0.48 : 0.56;
    ctx.material.roughness = isLight ? 0.32 : 0.34;
    ctx.material.clearcoat = isLight ? 0.24 : 0.28;
    ctx.material.clearcoatRoughness = isLight ? 0.28 : 0.26;

    ctx.rimUniforms.uRimColor.value.setHex(isLight ? 0x4d7c0f : 0xa3e635);
    ctx.rimUniforms.uRimStrength.value = isLight ? 0.22 : 0.32;

    ctx.rim.color.setHex(isLight ? 0x4d7c0f : 0xa3e635);
    ctx.rim.intensity = isLight ? 1.4 : 2.6;
    ctx.backRim.color.setHex(isLight ? 0x0284c7 : 0x38bdf8);
    ctx.backRim.intensity = isLight ? 0.65 : 0.95;
    ctx.fill.color.setHex(isLight ? 0x0284c7 : 0x38bdf8);
    ctx.ambient.intensity = isLight ? 0.72 : 0.42;
  }, [theme]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!enabled || !container || !canvas) return;

    let disposed = false;
    let rafId = 0;
    let isVisible = true;
    let renderer: import("three").WebGLRenderer | null = null;
    let pmrem: import("three").PMREMGenerator | null = null;
    let envRT: import("three").WebGLRenderTarget | null = null;
    let modelRoot: import("three").Group | null = null;
    let sculptMat: import("three").MeshPhysicalMaterial | null = null;
    const geometries: Array<import("three").BufferGeometry> = [];
    let resizeObs: ResizeObserver | null = null;
    let visObs: IntersectionObserver | null = null;
    const cleanupFns: Array<() => void> = [];

    (async () => {
      try {
        const [THREE, { GLTFLoader }, { RoomEnvironment }] = await Promise.all([
          import("three"),
          import("three/examples/jsm/loaders/GLTFLoader.js"),
          import("three/examples/jsm/environments/RoomEnvironment.js"),
        ]);
        if (disposed) return;

        const w = Math.max(container.clientWidth, 160);
        const h = Math.max(container.clientHeight, 160);

        renderer = new THREE.WebGLRenderer({
          canvas,
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(w, h, false);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.08;

        const scene = new THREE.Scene();
        const isLight =
          document.documentElement.getAttribute("data-theme") === "light";

        pmrem = new THREE.PMREMGenerator(renderer);
        const roomEnv = new RoomEnvironment();
        envRT = pmrem.fromScene(roomEnv, 0.04);
        roomEnv.dispose();
        scene.environment = envRT.texture;
        scene.environmentIntensity = isLight ? 1.2 : 1.15;

        const camera = new THREE.PerspectiveCamera(29, w / h, 0.1, 30);
        camera.position.set(0, 0.04, 5.5);

        const ambient = new THREE.AmbientLight(0xffffff, isLight ? 0.72 : 0.42);
        scene.add(ambient);

        const keyLight = new THREE.DirectionalLight(0xfffaf2, 2.1);
        keyLight.position.set(2.6, 3.2, 4.2);
        scene.add(keyLight);

        const fillLight = new THREE.DirectionalLight(
          isLight ? 0x0284c7 : 0x38bdf8,
          0.95
        );
        fillLight.position.set(-3.2, 0.5, 2.4);
        scene.add(fillLight);

        const rimLight = new THREE.DirectionalLight(
          isLight ? 0x4d7c0f : 0xa3e635,
          isLight ? 1.4 : 2.6
        );
        rimLight.position.set(2.0, 2.4, -3.2);
        scene.add(rimLight);

        const backRim = new THREE.DirectionalLight(
          isLight ? 0x0284c7 : 0x38bdf8,
          isLight ? 0.65 : 0.95
        );
        backRim.position.set(-1.8, -1.5, -2.8);
        scene.add(backRim);

        const gltfLoader = new GLTFLoader();
        const gltf = await new Promise<
          import("three/examples/jsm/loaders/GLTFLoader.js").GLTF
        >((resolve, reject) => gltfLoader.load(glbSrc, resolve, undefined, reject));

        if (disposed) return;

        const meshGroup = gltf.scene;
        meshGroup.traverse((child) => {
          if ((child as import("three").Mesh).isMesh) {
            const mesh = child as import("three").Mesh;
            applyCavityAO(THREE, mesh.geometry);
            geometries.push(mesh.geometry);
          }
        });

        const rawBox = new THREE.Box3().setFromObject(meshGroup);
        const rawCenter = rawBox.getCenter(new THREE.Vector3());
        const rawSize = rawBox.getSize(new THREE.Vector3());
        const uniformScale = 2.38 / Math.max(rawSize.y, 0.001);

        meshGroup.position.set(
          -rawCenter.x * uniformScale,
          -rawCenter.y * uniformScale,
          -rawCenter.z * uniformScale
        );
        meshGroup.scale.setScalar(uniformScale);

        const rimUniforms = {
          uRimColor: { value: new THREE.Color(isLight ? 0x4d7c0f : 0xa3e635) },
          uRimStrength: { value: isLight ? 0.22 : 0.32 },
        };

        sculptMat = new THREE.MeshPhysicalMaterial({
          color: isLight ? 0x7c8494 : 0x5c6373,
          vertexColors: true,
          metalness: isLight ? 0.48 : 0.56,
          roughness: isLight ? 0.32 : 0.34,
          clearcoat: isLight ? 0.24 : 0.28,
          clearcoatRoughness: isLight ? 0.28 : 0.26,
          envMapIntensity: isLight ? 1.2 : 1.15,
        });

        sculptMat.onBeforeCompile = (shader) => {
          shader.uniforms.uRimColor = rimUniforms.uRimColor;
          shader.uniforms.uRimStrength = rimUniforms.uRimStrength;

          shader.fragmentShader = shader.fragmentShader
            .replace(
              "#include <common>",
              `#include <common>
              uniform vec3 uRimColor;
              uniform float uRimStrength;`
            )
            .replace(
              "#include <emissivemap_fragment>",
              `#include <emissivemap_fragment>
              vec3 rimN = normalize(vNormal);
              vec3 rimV = normalize(vViewPosition);
              float fresnel = pow(1.0 - clamp(dot(rimN, rimV), 0.0, 1.0), 3.0);
              totalEmissiveRadiance += uRimColor * (fresnel * uRimStrength);`
            );
        };

        meshGroup.traverse((child) => {
          if ((child as import("three").Mesh).isMesh) {
            (child as import("three").Mesh).material = sculptMat!;
          }
        });

        sceneRef.current = {
          scene,
          material: sculptMat,
          rimUniforms,
          rim: rimLight,
          backRim,
          fill: fillLight,
          key: keyLight,
          ambient,
        };

        const pivot = new THREE.Group();
        pivot.add(meshGroup);
        scene.add(pivot);
        modelRoot = pivot;

        renderer.render(scene, camera);
        setReady(true);

        const handleResize = () => {
          if (!renderer || !container) return;
          const nw = container.clientWidth;
          const nh = container.clientHeight;
          if (nw < 10 || nh < 10) return;
          camera.aspect = nw / nh;
          camera.updateProjectionMatrix();
          renderer.setSize(nw, nh, false);
          if (prefersReducedMotion) renderer.render(scene, camera);
        };

        resizeObs = new ResizeObserver(handleResize);
        resizeObs.observe(container);

        const onWindowPointerMove = (e: PointerEvent) => {
          if (prefersReducedMotion || spinState.current.dragging) return;
          const rect = container.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          const nx = clamp(
            (e.clientX - cx) / Math.max(window.innerWidth * 0.45, 260),
            -1,
            1
          );
          const ny = clamp(
            (e.clientY - cy) / Math.max(window.innerHeight * 0.45, 260),
            -1,
            1
          );
          pointerTarget.current = {
            yaw: nx * 0.3,
            pitch: ny * 0.16,
          };
        };

        window.addEventListener("pointermove", onWindowPointerMove, { passive: true });
        cleanupFns.push(() =>
          window.removeEventListener("pointermove", onWindowPointerMove)
        );

        const onCanvasDown = (e: PointerEvent) => {
          spinState.current.dragging = true;
          spinState.current.lastX = e.clientX;
          spinState.current.lastY = e.clientY;
          spinState.current.velYaw = 0;
          spinState.current.velPitch = 0;
          spinState.current.lastInteractAt = performance.now();
          setDragging(true);
          try {
            canvas.setPointerCapture(e.pointerId);
          } catch {
            /* ignore */
          }
        };

        const onCanvasMove = (e: PointerEvent) => {
          if (!spinState.current.dragging) return;
          const dx = e.clientX - spinState.current.lastX;
          const dy = e.clientY - spinState.current.lastY;
          spinState.current.lastX = e.clientX;
          spinState.current.lastY = e.clientY;

          const dYaw = dx * 0.011;
          const dPitch = dy * 0.008;
          spinState.current.yaw += dYaw;
          spinState.current.pitch = clamp(spinState.current.pitch + dPitch, -0.65, 0.65);
          spinState.current.velYaw = dYaw;
          spinState.current.velPitch = dPitch;
          spinState.current.lastInteractAt = performance.now();
        };

        const endDrag = (e: PointerEvent) => {
          if (!spinState.current.dragging) return;
          spinState.current.dragging = false;
          spinState.current.lastInteractAt = performance.now();
          setDragging(false);
          try {
            if (canvas.hasPointerCapture(e.pointerId)) {
              canvas.releasePointerCapture(e.pointerId);
            }
          } catch {
            /* ignore */
          }
        };

        canvas.addEventListener("pointerdown", onCanvasDown);
        canvas.addEventListener("pointermove", onCanvasMove);
        canvas.addEventListener("pointerup", endDrag);
        canvas.addEventListener("pointercancel", endDrag);
        cleanupFns.push(() => {
          canvas.removeEventListener("pointerdown", onCanvasDown);
          canvas.removeEventListener("pointermove", onCanvasMove);
          canvas.removeEventListener("pointerup", endDrag);
          canvas.removeEventListener("pointercancel", endDrag);
        });

        visObs = new IntersectionObserver(
          (entries) => {
            isVisible = Boolean(entries[0]?.isIntersecting);
          },
          { threshold: 0.05 }
        );
        visObs.observe(container);

        if (prefersReducedMotion) return;

        const animate = (now: number) => {
          rafId = requestAnimationFrame(animate);
          if (!isVisible || document.hidden || !renderer || !modelRoot) return;

          const st = spinState.current;
          if (!st.dragging) {
            st.yaw += st.velYaw;
            st.pitch = clamp(st.pitch + st.velPitch, -0.65, 0.65);
            st.velYaw *= 0.93;
            st.velPitch *= 0.91;

            const idleMs = now - st.lastInteractAt;
            if (idleMs > 3500 || st.lastInteractAt === 0) {
              const twoPi = Math.PI * 2;
              let diffYaw = (pointerTarget.current.yaw - st.yaw) % twoPi;
              if (diffYaw > Math.PI) diffYaw -= twoPi;
              if (diffYaw < -Math.PI) diffYaw += twoPi;
              st.yaw += diffYaw * 0.06;
              st.pitch += (pointerTarget.current.pitch - st.pitch) * 0.06;
            }
          }

          const tSec = now * 0.001;
          modelRoot.rotation.y = st.yaw;
          modelRoot.rotation.x = st.pitch;
          modelRoot.position.y = Math.sin(tSec * 1.4) * 0.035;

          renderer.render(scene, camera);
        };

        rafId = requestAnimationFrame(animate);
      } catch {
        setReady(false);
      }
    })();

    return () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      cleanupFns.forEach((fn) => fn());
      resizeObs?.disconnect();
      visObs?.disconnect();
      sceneRef.current = null;
      sculptMat?.dispose();
      geometries.forEach((g) => g.dispose());
      envRT?.dispose();
      pmrem?.dispose();
      renderer?.dispose();
    };
  }, [enabled, prefersReducedMotion, glbSrc]);

  return (
    <div
      ref={containerRef}
      onClick={enabled ? undefined : () => setEnabled(true)}
      className="relative mx-auto aspect-square w-full max-w-[200px] sm:max-w-[320px] lg:max-w-[430px]"
    >
      {/* Ambient radial studio glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-4 rounded-full bg-[radial-gradient(circle_at_52%_44%,var(--accent-soft),transparent_64%)] blur-2xl"
      />

      {/* Soft grounded float shadow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-4 left-1/2 h-6 w-[44%] -translate-x-1/2 rounded-full bg-black/30 opacity-45 blur-xl dark:bg-black/55"
      />

      {/* Still frame of the model: instant first paint and the fallback when
          WebGL or the model fails. Only the visible theme's image is fetched. */}
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 z-10 bg-contain bg-center bg-no-repeat transition-opacity duration-500 dark:hidden",
          ready && "opacity-0"
        )}
        style={{ backgroundImage: `url("${posterLight}")` }}
      />
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 z-10 hidden bg-contain bg-center bg-no-repeat transition-opacity duration-500 dark:block",
          ready && "opacity-0"
        )}
        style={{ backgroundImage: `url("${posterDark}")` }}
      />

      {/* Full 360-degree interactive WebGL Titanium Sculpture */}
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={t.ui.memojiLabel}
        className={cn(
          "relative z-10 block h-full w-full touch-pan-y transition-opacity duration-500",
          ready ? "opacity-100" : "opacity-0",
          dragging ? "cursor-grabbing" : "cursor-grab"
        )}
      />
    </div>
  );
}
