import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { WsApi } from './useWebsocket';

export function AvatarViewer({ ws }: { ws: WsApi }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const meshRef = useRef<THREE.SkinnedMesh | THREE.Mesh | null>(null);
  const morphTargetsRef = useRef<Record<string, number>>({});
  const textureRef = useRef<THREE.Texture | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 1.2, 2.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.0);
    hemi.position.set(0, 1, 0);
    scene.add(hemi);
    const dir = new THREE.DirectionalLight(0xffffff, 1.0);
    dir.position.set(3, 10, 10);
    scene.add(dir);

    const loader = new GLTFLoader();
    loader.load('/head.glb', (gltf: any) => {
      const root = gltf.scene as THREE.Group;
      root.traverse((obj: THREE.Object3D) => {
        const asMesh = obj as THREE.Mesh;
        if ((asMesh as any).isMesh) {
          meshRef.current = asMesh;
          if ((asMesh as any).morphTargetDictionary) {
            morphTargetsRef.current = (asMesh as any).morphTargetDictionary as Record<string, number>;
          }
        }
      });
      scene.add(root);
    });

    const onResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', onResize);

    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      container.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    ws.onFacialAnimation = (frames) => {
      const mesh = meshRef.current as any;
      if (!mesh || !mesh.morphTargetInfluences || !mesh.morphTargetDictionary) return;
      for (const frame of frames) {
        const coeffs = frame.coefficients;
        for (const [name, val] of Object.entries(coeffs)) {
          const idx = mesh.morphTargetDictionary[name];
          if (typeof idx === 'number') {
            mesh.morphTargetInfluences[idx] = THREE.MathUtils.clamp(val, 0, 1);
          }
        }
      }
    };
  }, [ws]);

  useEffect(() => {
    if (!ws.lastEnhancedImage) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const tex = new THREE.Texture(img);
      tex.needsUpdate = true;
      textureRef.current = tex;
      const mesh = meshRef.current as any;
      if (mesh && mesh.material) {
        const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
        if (mat && 'map' in mat) {
          (mat as any).map = tex;
          (mat as any).needsUpdate = true;
        }
      }
    };
    img.src = ws.lastEnhancedImage;
  }, [ws.lastEnhancedImage]);

  return <div ref={containerRef} className="w-full h-full" />;
}