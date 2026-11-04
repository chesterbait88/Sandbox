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
    shader.uniforms.uOutline = { value: [RENDER.outlineWidth, RENDER.outlineStrength] };
    shader.uniforms.uBevel = { value: [RENDER.bevelWidth, RENDER.bevelStrength] };
    shader.uniforms.uHatch = { value: [RENDER.hatchLines, RENDER.hatchStrength] };
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        '#include <common>\nvarying vec3 vWPos;\nvarying vec3 vNrm;\nattribute float emit;\nvarying float vEmit;'
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
#ifdef USE_INSTANCING
vWPos = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;
vNrm = normalize((instanceMatrix * vec4(normal, 0.0)).xyz);
#else
vWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
vNrm = normal;
#endif
vEmit = emit;`
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        '#include <common>\nvarying vec3 vWPos;\nvarying vec3 vNrm;\nvarying float vEmit;\nuniform float uJitter;\nuniform float uVoxel;\nuniform vec2 uOutline;\nuniform vec2 uBevel;\nuniform vec2 uHatch;'
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
vec3 vpos = (vWPos - vNrm * uVoxel * 0.1) / uVoxel;
vec3 vc = floor(vpos);
float hsh = fract(sin(dot(vc, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
diffuseColor.rgb *= 1.0 + (hsh * 2.0 - 1.0) * uJitter;
// Position inside the voxel on the face's two in-plane axes.
vec3 an = abs(vNrm);
vec3 lf = fract(vpos);
vec2 uv = an.x > 0.5 ? lf.zy : (an.y > 0.5 ? lf.xz : lf.xy);
vec2 dEdge = min(uv, 1.0 - uv);
float edge = min(dEdge.x, dEdge.y);
float px = fwidth(edge);
float ow = max(uOutline.x, px * 1.2);
float outline = 1.0 - smoothstep(ow * 0.5, ow, edge);
float fade = clamp(1.0 - px * 6.0, 0.0, 1.0);
diffuseColor.rgb *= 1.0 - outline * uOutline.y * (0.4 + 0.6 * fade);
float bevel = max(1.0 - smoothstep(0.0, uBevel.x, uv.x), 1.0 - smoothstep(0.0, uBevel.x, 1.0 - uv.y));
diffuseColor.rgb *= 1.0 + bevel * uBevel.y * (1.0 - outline) * fade;
if (uHatch.x > 0.0) {
  float hl = abs(fract((uv.x + uv.y) * uHatch.x) - 0.5) * 2.0;
  float hatch = 1.0 - smoothstep(0.75, 0.95, hl);
  diffuseColor.rgb *= 1.0 - hatch * uHatch.y * fade * (1.0 - outline);
}`
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
