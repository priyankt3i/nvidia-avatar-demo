import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
export function AvatarViewer({ ws }) {
    const containerRef = useRef(null);
    const meshRef = useRef(null);
    const morphTargetsRef = useRef({});
    const textureRef = useRef(null);
    useEffect(() => {
        if (!containerRef.current)
            return;
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
        loader.load('/head.glb', (gltf) => {
            const root = gltf.scene;
            root.traverse((obj) => {
                const asMesh = obj;
                if (asMesh.isMesh) {
                    meshRef.current = asMesh;
                    if (asMesh.morphTargetDictionary) {
                        morphTargetsRef.current = asMesh.morphTargetDictionary;
                    }
                }
            });
            scene.add(root);
        });
        const onResize = () => {
            if (!container)
                return;
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
            const mesh = meshRef.current;
            if (!mesh || !mesh.morphTargetInfluences || !mesh.morphTargetDictionary)
                return;
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
        if (!ws.lastEnhancedImage)
            return;
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const tex = new THREE.Texture(img);
            tex.needsUpdate = true;
            textureRef.current = tex;
            const mesh = meshRef.current;
            if (mesh && mesh.material) {
                const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
                if (mat && 'map' in mat) {
                    mat.map = tex;
                    mat.needsUpdate = true;
                }
            }
        };
        img.src = ws.lastEnhancedImage;
    }, [ws.lastEnhancedImage]);
    return _jsx("div", { ref: containerRef, className: "w-full h-full" });
}
