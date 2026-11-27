import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type * as ThreeTypes from "three";
import {
  AlertTriangle,
  Clock,
  Move,
  RefreshCw,
  Send,
  Share2,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { showToast, useLang, useT, useTheme } from "@/lib/store";
import { copyToClipboard, formatRelativeTime } from "@/lib/utils";

const LOCAL_KEY = "diorhc_3d_guestbook_msg";
const DEFAULT_MESSAGE = "DIORHC+";
const MAX_LEN = 40;
const API_BASE = (
  import.meta.env.PUBLIC_GUESTBOOK_API_URL ||
  "https://diorhc-3d-guestbook.dior-hcr.workers.dev"
).replace(/\/+$/, "");

const SUPPORTED_CHAR_TEST = /^[0-9A-Za-zА-Яа-яЁё\s.,:;!?'"`\-–—()\[\]{}/\\|+=<>~#@%^&_]*$/u;

const PALETTES = {
  dark: {
    fog: 0x09090b,
    text: 0xa3e635,
    cursor: 0x38bdf8,
    rim: 0x38bdf8,
  },
  light: {
    fog: 0xfafafa,
    text: 0x4d7c0f,
    cursor: 0x0284c7,
    rim: 0x0284c7,
  },
} as const;

interface GuestbookPayload {
  message?: string;
  updatedAt?: string | null;
}

interface VoxelCharEntry {
  // One InstancedMesh per character: a single draw call for all its cubes.
  group: ThreeTypes.InstancedMesh;
  material: ThreeTypes.MeshPhongMaterial;
  targetZ: number;
  currentZ: number;
  width: number;
}

function sanitizeMessage(raw: string): string {
  return raw.replace(/\s+/g, " ").trim().slice(0, MAX_LEN);
}

export default function VoxelGuestbook3D() {
  const t = useT();
  const lang = useLang();
  const theme = useTheme();

  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [message, setMessage] = useState<string>(DEFAULT_MESSAGE);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [fromQuery, setFromQuery] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string>("");
  const [sceneReady, setSceneReady] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const messageRef = useRef<string>(DEFAULT_MESSAGE);
  const themeRef = useRef(theme);
  const syncTextFnRef = useRef<((val: string) => void) | null>(null);
  const updateThemeFnRef = useRef<((mode: "dark" | "light") => void) | null>(
    null
  );

  messageRef.current = message;
  themeRef.current = theme;

  const hasUnsupportedChars = useMemo(
    () => !SUPPORTED_CHAR_TEST.test(message),
    [message]
  );

  const fetchLatest = useCallback(async (showFeedback = false) => {
    if (showFeedback) setRefreshing(true);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    try {
      const res = await fetch(`${API_BASE}/api/message`, {
        signal: controller.signal,
      });
      if (!res.ok) return;
      const data = (await res.json()) as GuestbookPayload;
      if (data.message) {
        const clean = sanitizeMessage(data.message);
        if (clean) {
          setMessage(clean);
          setFromQuery(false);
        }
      }
      setUpdatedAt(data.updatedAt ?? null);
      if (showFeedback) {
        showToast(t.contact.refreshedToast);
      }
    } catch {
      /* graceful offline fallback */
    } finally {
      clearTimeout(timer);
      if (showFeedback) setRefreshing(false);
    }
  }, [t.contact.refreshedToast]);

  // Initial load: ?msg= -> Worker API -> localStorage -> DEFAULT_MESSAGE
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryMsg = params.get("msg");
    if (queryMsg) {
      const clean = sanitizeMessage(queryMsg);
      if (clean) {
        setMessage(clean);
        setFromQuery(true);
      }
    } else {
      try {
        const localSaved = localStorage.getItem(LOCAL_KEY);
        if (localSaved) {
          const cleanLocal = sanitizeMessage(localSaved);
          if (cleanLocal) setMessage(cleanLocal);
        }
      } catch {
        /* ignore */
      }
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    fetch(`${API_BASE}/api/message`, { signal: controller.signal })
      .then((res) => (res.ok ? (res.json() as Promise<GuestbookPayload>) : null))
      .then((data) => {
        if (!data) return;
        if (!queryMsg && data.message) {
          const clean = sanitizeMessage(data.message);
          if (clean) setMessage(clean);
        }
        setUpdatedAt(data.updatedAt ?? null);
      })
      .catch(() => {})
      .finally(() => clearTimeout(timer));
  }, []);

  useEffect(() => {
    syncTextFnRef.current?.(message);
  }, [message]);

  useEffect(() => {
    updateThemeFnRef.current?.(theme);
  }, [theme]);

  // Dynamic import("three") + VOXEL_FONT only when canvas nears viewport
  useEffect(() => {
    const containerEl = wrapperRef.current;
    if (!containerEl) return;

    let disposed = false;
    let cleanupThree: (() => void) | undefined;

    const mountScene = async () => {
      if (disposed || cleanupThree) return;
      try {
        const [THREE, { VOXEL_FONT }] = await Promise.all([
          import("three"),
          import("@/data/voxelFont"),
        ]);
        if (disposed) return;

        const initW = containerEl.clientWidth || 720;
        const initH = containerEl.clientHeight || 320;

        const scene = new THREE.Scene();
        const initPal = PALETTES[themeRef.current];
        scene.fog = new THREE.Fog(initPal.fog, 30, 300);

        const camera = new THREE.PerspectiveCamera(
          70,
          initW / Math.max(1, initH),
          0.1,
          800
        );
        camera.position.set(2, -1, 34);

        const renderer = new THREE.WebGLRenderer({
          antialias: window.devicePixelRatio < 2,
          alpha: true,
          powerPreference: "high-performance",
          stencil: false,
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(initW, initH);
        renderer.setClearColor(0x000000, 0);
        containerEl.appendChild(renderer.domElement);

        const ambient = new THREE.AmbientLight(0x404040, 1.0);
        scene.add(ambient);
        const hemi = new THREE.HemisphereLight(0xffffff, 0x27272a, 0.55);
        scene.add(hemi);
        const keyLight = new THREE.DirectionalLight(0xffffff, 1.45);
        keyLight.position.set(16, 28, 80);
        scene.add(keyLight);
        const rimLight = new THREE.PointLight(initPal.rim, 1.1, 160);
        rimLight.position.set(-24, -14, 30);
        scene.add(rimLight);

        const sharedBoxGeo = new THREE.BoxGeometry(1, 1, 1);
        const rootGroup = new THREE.Group();
        scene.add(rootGroup);

        const cursorMat = new THREE.MeshPhongMaterial({
          color: initPal.cursor,
          emissive: initPal.cursor,
          emissiveIntensity: 0.65,
          transparent: true,
          opacity: 0.78,
        });
        const placeCubes = (
          mesh: ThreeTypes.InstancedMesh,
          coords: ReadonlyArray<readonly [number, number]>
        ) => {
          const m = new THREE.Matrix4();
          coords.forEach(([px, py], i) => {
            m.makeTranslation(px, -py, 0);
            mesh.setMatrixAt(i, m);
          });
          mesh.instanceMatrix.needsUpdate = true;
          mesh.computeBoundingSphere();
        };

        const cursorCoords: ReadonlyArray<readonly [number, number]> =
          VOXEL_FONT["|"] || [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]];
        const cursorGroup = new THREE.InstancedMesh(
          sharedBoxGeo,
          cursorMat,
          cursorCoords.length
        );
        placeCubes(cursorGroup, cursorCoords);
        cursorGroup.position.z = -0.8;
        rootGroup.add(cursorGroup);

        const activeEntries: VoxelCharEntry[] = [];
        const exitingEntries: VoxelCharEntry[] = [];
        let totalWidth = 0;
        let totalLines = 1;

        const buildEntries = (rawText: string) => {
          while (activeEntries.length > 0) {
            const old = activeEntries.pop()!;
            old.targetZ = -45;
            exitingEntries.push(old);
          }

          const textChars = (rawText || "").split("");
          let offsetX = 0;
          let offsetY = 0;
          let maxLineW = 0;
          totalLines = 1;

          const pal = PALETTES[themeRef.current];

          textChars.forEach((ch, idx) => {
            if (ch === "\n") {
              maxLineW = Math.max(maxLineW, offsetX);
              offsetX = 0;
              offsetY -= 7;
              totalLines++;
              return;
            }
            const coords = VOXEL_FONT[ch] ?? VOXEL_FONT[ch.toUpperCase()];
            if (!coords || coords.length === 0) {
              offsetX += 3.5;
              return;
            }

            const mat = new THREE.MeshPhongMaterial({
              color: pal.text,
              emissive: pal.text,
              emissiveIntensity: 0.42,
              transparent: true,
              opacity: 0.96,
              shininess: 120,
            });
            const grp = new THREE.InstancedMesh(sharedBoxGeo, mat, coords.length);
            placeCubes(grp, coords);
            let charW = 0;
            for (const [px] of coords) if (px > charW) charW = px;
            charW += 1;

            const startZ = 34 + Math.min(idx, 10) * 3.2;
            grp.position.set(offsetX, offsetY, startZ);
            rootGroup.add(grp);

            activeEntries.push({
              group: grp,
              material: mat,
              targetZ: 0,
              currentZ: startZ,
              width: charW,
            });

            offsetX += charW + 1.2;
          });

          maxLineW = Math.max(maxLineW, offsetX);
          totalWidth = Math.max(4, maxLineW - 1.2);
          cursorGroup.position.set(offsetX + 0.5, offsetY, -0.5);
        };

        syncTextFnRef.current = buildEntries;
        buildEntries(messageRef.current);

        updateThemeFnRef.current = (mode) => {
          const pal = PALETTES[mode];
          if (scene.fog) scene.fog.color.setHex(pal.fog);
          rimLight.color.setHex(pal.rim);
          cursorMat.color.setHex(pal.cursor);
          cursorMat.emissive.setHex(pal.cursor);
          activeEntries.forEach((entry) => {
            entry.material.color.setHex(pal.text);
            entry.material.emissive.setHex(pal.text);
          });
        };

        let hoverX = 0;
        let hoverY = 0;
        let dragRotX = 0;
        let dragRotY = 0;
        let dragging = false;
        let dragStartX = 0;
        let dragStartY = 0;

        const onPointerDown = (e: PointerEvent) => {
          dragging = true;
          setIsDragging(true);
          dragStartX = e.clientX;
          dragStartY = e.clientY;
          containerEl.setPointerCapture?.(e.pointerId);
        };

        const onPointerMove = (e: PointerEvent) => {
          const rect = containerEl.getBoundingClientRect();
          if (rect.width && rect.height) {
            hoverX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
            hoverY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
          }
          if (dragging) {
            const dx = e.clientX - dragStartX;
            const dy = e.clientY - dragStartY;
            dragStartX = e.clientX;
            dragStartY = e.clientY;
            dragRotY = Math.max(-0.85, Math.min(0.85, dragRotY + dx * 0.006));
            dragRotX = Math.max(-0.5, Math.min(0.5, dragRotX + dy * 0.005));
          }
        };

        const onPointerUp = (e: PointerEvent) => {
          if (!dragging) return;
          dragging = false;
          setIsDragging(false);
          containerEl.releasePointerCapture?.(e.pointerId);
        };

        containerEl.addEventListener("pointerdown", onPointerDown);
        containerEl.addEventListener("pointermove", onPointerMove, {
          passive: true,
        });
        containerEl.addEventListener("pointerup", onPointerUp);
        containerEl.addEventListener("pointercancel", onPointerUp);

        const handleResize = () => {
          const w = containerEl.clientWidth;
          const h = containerEl.clientHeight;
          if (!w || !h) return;
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        };

        const ro = new ResizeObserver(handleResize);
        ro.observe(containerEl);

        let isVisible = true;
        let rafId: number | null = null;
        let lastTime = performance.now();

        const tick = (now: number) => {
          if (!isVisible || document.hidden) {
            rafId = null;
            return;
          }
          rafId = requestAnimationFrame(tick);
          const dt = Math.min(0.05, (now - lastTime) / 1000);
          lastTime = now;
          const lerp = 1 - Math.exp(-9 * dt);

          for (const entry of activeEntries) {
            entry.currentZ += (entry.targetZ - entry.currentZ) * lerp;
            entry.group.position.z = entry.currentZ;
          }

          for (let i = exitingEntries.length - 1; i >= 0; i--) {
            const entry = exitingEntries[i];
            entry.currentZ += (entry.targetZ - entry.currentZ) * lerp;
            entry.group.position.z = entry.currentZ;
            entry.material.opacity += (0 - entry.material.opacity) * lerp;
            if (entry.material.opacity < 0.03) {
              rootGroup.remove(entry.group);
              entry.group.dispose();
              entry.material.dispose();
              exitingEntries.splice(i, 1);
            }
          }

          cursorGroup.visible = Math.floor(now / 520) % 2 === 0;

          if (!dragging) {
            dragRotX *= 0.94;
            dragRotY *= 0.94;
          }

          const breathY = Math.sin(now * 0.0014) * 0.3;
          const centerX = -totalWidth / 2;
          const centerY = (totalLines - 1) * 3.5 + 2 + breathY;
          const targetZ = Math.max(24, totalWidth * 0.72 + 12);

          rootGroup.position.x += (centerX - rootGroup.position.x) * lerp;
          rootGroup.position.y += (centerY - rootGroup.position.y) * lerp;

          const targetRotY = dragRotY + hoverX * 0.14;
          const targetRotX = dragRotX - hoverY * 0.09;
          rootGroup.rotation.y += (targetRotY - rootGroup.rotation.y) * 0.1;
          rootGroup.rotation.x += (targetRotX - rootGroup.rotation.x) * 0.1;
          camera.position.z += (targetZ - camera.position.z) * 0.07;

          renderer.render(scene, camera);
        };

        const startLoop = () => {
          if (!rafId && isVisible && !document.hidden) {
            lastTime = performance.now();
            rafId = requestAnimationFrame(tick);
          }
        };

        const stopLoop = () => {
          if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
          }
        };

        const visObs = new IntersectionObserver(
          (entries) => {
            isVisible = Boolean(entries[0]?.isIntersecting);
            if (isVisible) startLoop();
            else stopLoop();
          },
          { threshold: 0.05 }
        );
        visObs.observe(containerEl);

        const onVisibility = () => {
          if (document.hidden) stopLoop();
          else startLoop();
        };
        document.addEventListener("visibilitychange", onVisibility);

        setSceneReady(true);
        startLoop();

        cleanupThree = () => {
          stopLoop();
          visObs.disconnect();
          ro.disconnect();
          document.removeEventListener("visibilitychange", onVisibility);
          containerEl.removeEventListener("pointerdown", onPointerDown);
          containerEl.removeEventListener("pointermove", onPointerMove);
          containerEl.removeEventListener("pointerup", onPointerUp);
          containerEl.removeEventListener("pointercancel", onPointerUp);

          sharedBoxGeo.dispose();
          cursorMat.dispose();
          cursorGroup.dispose();
          [...activeEntries, ...exitingEntries].forEach((e) => {
            e.group.dispose();
            e.material.dispose();
          });
          if (renderer.domElement.parentNode === containerEl) {
            containerEl.removeChild(renderer.domElement);
          }
          renderer.dispose();
          renderer.forceContextLoss();
        };
      } catch (err) {
        console.error("Three.js dynamic load failed:", err);
      }
    };

    const lazyObs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          lazyObs.disconnect();
          void mountScene();
        }
      },
      { rootMargin: "220px" }
    );
    lazyObs.observe(containerEl);

    return () => {
      disposed = true;
      lazyObs.disconnect();
      cleanupThree?.();
    };
  }, []);

  const handleLeaveMessage = async () => {
    const clean = sanitizeMessage(message);
    if (!clean) {
      showToast(t.contact.emptyToast);
      return;
    }

    setMessage(clean);
    setFromQuery(false);
    try {
      localStorage.setItem(LOCAL_KEY, clean);
    } catch {
      /* ignore */
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: clean }),
      });
      if (res.status === 429) {
        setStatusMsg(t.contact.rateLimitToast);
        showToast(t.contact.rateLimitToast);
      } else if (res.ok) {
        const data = (await res.json()) as GuestbookPayload;
        setUpdatedAt(data.updatedAt ?? new Date().toISOString());
        setStatusMsg(t.contact.savedGlobal);
        showToast(t.contact.savedGlobal);
      } else if (res.status === 400) {
        // Rejected by the server (content filter or invalid text): not saved anywhere public.
        setStatusMsg(t.contact.rejectedToast);
        showToast(t.contact.rejectedToast);
      } else {
        setStatusMsg(t.contact.savedLocal);
        showToast(t.contact.savedLocal);
      }
    } catch {
      setStatusMsg(t.contact.savedLocal);
      showToast(t.contact.savedLocal);
    } finally {
      setSaving(false);
    }
  };

  const handleShareLink = async () => {
    const clean = sanitizeMessage(message) || DEFAULT_MESSAGE;
    const url = new URL(window.location.href);
    url.searchParams.set("msg", clean);
    url.hash = "contact";
    const ok = await copyToClipboard(url.toString());
    if (ok) {
      setStatusMsg(t.contact.sharedToast);
      showToast(t.contact.sharedToast);
    }
  };

  const relativeTime = formatRelativeTime(updatedAt, lang);

  return (
    <div className="space-y-4">
      {/* 3D Canvas Stage */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--shadow-md)]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] px-4 py-2 text-xs text-[var(--text-muted)]">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 font-mono-code">
              <Sparkles className="h-3.5 w-3.5 text-[var(--accent)]" />
              {t.contact.modeGlobal}
            </span>
            {relativeTime && (
              <span className="hidden items-center gap-1 font-mono-code text-[11px] sm:inline-flex">
                <Clock className="h-3 w-3" />
                {t.contact.updatedPrefix}: {relativeTime}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {fromQuery && (
              <Badge variant="default">{t.contact.currentFromQuery}</Badge>
            )}
            <span className="hidden items-center gap-1 font-mono-code text-[11px] sm:inline-flex">
              <Move className="h-3 w-3" />
              {t.contact.dragHint}
            </span>
            <button
              type="button"
              onClick={() => void fetchLatest(true)}
              aria-label={t.contact.refreshBtn}
              title={t.contact.refreshBtn}
              className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-[var(--border-subtle)] text-[var(--text-secondary)] transition-colors hover:border-[var(--accent-border)] hover:text-[var(--accent)] cursor-pointer"
            >
              <RefreshCw
                className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>

        <div
          ref={wrapperRef}
          id="contact-canvas-wrapper"
          className={`relative h-[250px] w-full select-none sm:h-[330px] ${
            isDragging ? "cursor-grabbing touch-none" : "cursor-grab"
          }`}
          role="img"
          aria-label={`${t.ui.voxelLabel}: ${message}`}
        >
          {!sceneReady && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center font-mono-code text-xs text-[var(--text-muted)]">
              {message}
            </div>
          )}
        </div>
      </div>

      {/* Input & Controls */}
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 focus-within:border-[var(--accent-border)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label htmlFor="guestbookInput" className="sr-only">
            {t.contact.placeholder}
          </label>
          <textarea
            ref={inputRef}
            id="guestbookInput"
            rows={1}
            maxLength={MAX_LEN}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value.replace(/[\r\n]+/g, " "));
              setFromQuery(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                e.preventDefault();
                if (!saving) void handleLeaveMessage();
              }
            }}
            placeholder={t.contact.placeholder}
            className="min-h-[42px] w-full flex-1 resize-none overflow-hidden bg-transparent px-2.5 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none sm:text-base"
          />

          <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end">
            <span className="font-mono-code text-xs text-[var(--text-muted)]">
              {message.length}/{MAX_LEN}
            </span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleShareLink}
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>{t.contact.shareBtn}</span>
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={saving}
              onClick={handleLeaveMessage}
            >
              <Send className="h-3.5 w-3.5" />
              <span>{t.contact.leaveBtn}</span>
            </Button>
          </div>
        </div>

        {hasUnsupportedChars && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-500">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span>{t.contact.unsupportedChars}</span>
          </p>
        )}
      </div>

      {statusMsg && (
        <p
          role="status"
          aria-live="polite"
          className="text-center text-xs text-[var(--accent)] sm:text-sm"
        >
          {statusMsg}
        </p>
      )}
    </div>
  );
}
