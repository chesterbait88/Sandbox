import * as THREE from 'three';
import { RENDER, THEMES, WORLD_SIZE_M, type ThemeId } from '@vw/config';

/** Renderer, scene, camera, sun and sky. Theme colours are applied with setTheme(). */
export class GameRenderer {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly sun: THREE.DirectionalLight;
  readonly hemi: THREE.HemisphereLight;
  readonly overlayScene = new THREE.Scene();
  readonly overlayCamera: THREE.PerspectiveCamera;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.autoClear = false;

    this.camera = new THREE.PerspectiveCamera(RENDER.fov, window.innerWidth / window.innerHeight, RENDER.near, RENDER.far);
    this.overlayCamera = new THREE.PerspectiveCamera(RENDER.fov, window.innerWidth / window.innerHeight, 0.01, 10);

    this.sun = new THREE.DirectionalLight('#ffffff', RENDER.sunIntensity);
    this.sun.castShadow = true;
    const half = Math.max(WORLD_SIZE_M.x, WORLD_SIZE_M.z) * 0.75;
    const sc = this.sun.shadow.camera;
    sc.left = -half;
    sc.right = half;
    sc.top = half;
    sc.bottom = -half;
    sc.near = 1;
    sc.far = 400;
    this.sun.shadow.mapSize.set(RENDER.shadowMapSize, RENDER.shadowMapSize);
    this.sun.shadow.bias = RENDER.shadowBias;
    this.sun.shadow.normalBias = RENDER.shadowNormalBias;
    this.sun.position.set(WORLD_SIZE_M.x * 0.5 + 60, 120, WORLD_SIZE_M.z * 0.5 - 40);
    this.sun.target.position.set(WORLD_SIZE_M.x * 0.5, 0, WORLD_SIZE_M.z * 0.5);
    this.scene.add(this.sun, this.sun.target);
    this.hemi = new THREE.HemisphereLight('#cfe2f3', '#5a4a3a', RENDER.hemiIntensity);
    this.scene.add(this.hemi);
    this.overlayScene.add(new THREE.HemisphereLight('#ffffff', '#555555', 1.2));
    const ol = new THREE.DirectionalLight('#ffffff', 1.5);
    ol.position.set(1, 2, 1);
    this.overlayScene.add(ol);

    window.addEventListener('resize', () => this.resize());
  }

  resize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.overlayCamera.aspect = w / h;
    this.overlayCamera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  setFov(fov: number): void {
    this.camera.fov = fov;
    this.camera.updateProjectionMatrix();
  }

  setTheme(theme: ThemeId): void {
    const t = THEMES[theme];
    this.scene.background = new THREE.Color(t.sky);
    this.scene.fog = new THREE.FogExp2(t.fog, t.fogDensity);
    this.sun.color.set(t.sun);
    this.hemi.color.set(t.horizon);
  }

  render(): void {
    this.renderer.clear();
    this.renderer.render(this.scene, this.camera);
    this.renderer.clearDepth();
    this.renderer.render(this.overlayScene, this.overlayCamera);
  }
}
