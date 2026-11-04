import * as THREE from 'three';
import { RENDER } from '@vw/config';
import './ui/styles.css';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
scene.background = new THREE.Color('#6a8fc9');
const camera = new THREE.PerspectiveCamera(RENDER.fov, window.innerWidth / window.innerHeight, RENDER.near, RENDER.far);
camera.position.set(2.5, 2, 3.5);
camera.lookAt(0, 0, 0);

const sun = new THREE.DirectionalLight('#ffffff', RENDER.sunIntensity);
sun.position.set(5, 10, 4);
scene.add(sun);
scene.add(new THREE.HemisphereLight('#cfe2f3', '#5a4a3a', RENDER.hemiIntensity));

const cube = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({ color: '#c0392b' }));
scene.add(cube);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const ui = document.getElementById('ui')!;
ui.innerHTML = '<div class="phase0">Voxel Wreck — phase 0 scaffold</div>';

renderer.setAnimationLoop((t) => {
  cube.rotation.y = t * 0.0006;
  cube.rotation.x = t * 0.0003;
  renderer.render(scene, camera);
});
