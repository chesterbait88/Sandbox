import * as THREE from 'three';
import { RENDER, VOXEL_SIZE } from '@vw/config';

/**
 * Lambert material with vertex colours plus a per-voxel brightness jitter computed in the
 * fragment shader from world position, so greedy-merged quads still show per-voxel variation
 * and the jitter is stable across remeshes. `emit` attribute makes neon glow.
 */
function patch(mat: THREE.Material, voxelSize: number): void {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uJitter = { value: RENDER.colorJitter };
    shader.uniforms.uVoxel = { value: voxelSize };
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        '#include <common>\nvarying vec3 vWPos;\nvarying vec3 vNrm;\nattribute float emit;\nvarying float vEmit;'
      )
      .replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvNrm = normal;\nvEmit = emit;'
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        '#include <common>\nvarying vec3 vWPos;\nvarying vec3 vNrm;\nvarying float vEmit;\nuniform float uJitter;\nuniform float uVoxel;'
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
vec3 vc = floor((vWPos - vNrm * uVoxel * 0.1) / uVoxel);
float hsh = fract(sin(dot(vc, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
diffuseColor.rgb *= 1.0 + (hsh * 2.0 - 1.0) * uJitter;`
      )
      .replace(
        '#include <emissivemap_fragment>',
        '#include <emissivemap_fragment>\ntotalEmissiveRadiance += diffuseColor.rgb * vEmit * 1.6;'
      );
  };
}

export function createOpaqueMaterial(voxelSize = VOXEL_SIZE): THREE.MeshLambertMaterial {
  const m = new THREE.MeshLambertMaterial({ vertexColors: true });
  patch(m, voxelSize);
  return m;
}

export function createTransparentMaterial(voxelSize = VOXEL_SIZE): THREE.MeshLambertMaterial {
  const m = new THREE.MeshLambertMaterial({ vertexColors: true, transparent: true, opacity: 0.55, depthWrite: false });
  patch(m, voxelSize);
  return m;
}

export function buildGeometry(b: { position: Float32Array; normal: Float32Array; color: Uint8Array; emit: Uint8Array; index: Uint32Array }): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(b.position, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(b.normal, 3));
  g.setAttribute('color', new THREE.BufferAttribute(b.color, 3, true));
  g.setAttribute('emit', new THREE.BufferAttribute(b.emit, 1, true));
  g.setIndex(new THREE.BufferAttribute(b.index, 1));
  g.computeBoundingSphere();
  return g;
}
