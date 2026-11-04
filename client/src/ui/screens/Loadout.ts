import * as THREE from 'three';
import { SCORING, VIEW_MODEL, WEAPONS } from '@vw/config';
import { Screen } from '../Screen';
import { button, fmt, h } from '../dom';
import type { Flow } from '../../game/Flow';
import type { Game } from '../../game/Game';
import { buildModelMesh } from '../../player/ViewModel';
import { THEMES } from '@vw/config';

/** The briefing: eight slots with spinning voxel models rendered through scissored viewports. */
export class LoadoutScreen extends Screen {
  private slots: { el: HTMLElement; view: HTMLElement; model: THREE.Group }[] = [];
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(30, 1, 0.01, 10);
  private arena: HTMLElement;
  private t = 0;

  constructor(private flow: Flow, private game: Game) {
    super('loadout');
    this.el.append(h('h2', 'heading', 'YOUR LOADOUT'));
    this.arena = h('p', 'brief', '');
    this.el.append(this.arena);
    const row = h('div', 'slots');
    this.scene.add(new THREE.HemisphereLight('#ffffff', '#445', 1.4));
    const dl = new THREE.DirectionalLight('#ffffff', 1.6);
    dl.position.set(1, 2, 2);
    this.scene.add(dl);
    this.camera.position.set(0, 0.25, 1.6);
    this.camera.lookAt(0, 0, 0);
    for (const w of WEAPONS) {
      const slot = h('div', 'slot');
      const view = h('div', 'slot-view');
      const ammo = Number.isFinite(w.totalAmmo) ? (w.kind === 'thrown' || w.kind === 'placed' ? `${w.totalAmmo}` : `${w.magSize} / ${w.totalAmmo}`) : '∞';
      slot.append(h('div', 'slot-num', String(w.slot)), view, h('div', 'slot-name', w.name.toUpperCase()), h('div', 'slot-role', w.role), h('div', 'slot-ammo', ammo));
      row.append(slot);
      const model = buildModelMesh(w.model, VIEW_MODEL.size, VIEW_MODEL.voxelM);
      model.visible = false;
      this.scene.add(model);
      this.slots.push({ el: slot, view, model });
    }
    const nav = h('div', 'nav');
    nav.append(button('BACK', '', () => flow.toWorldPicker()), button('DEPLOY', 'primary big', () => void flow.deploy()));
    this.el.append(row, nav);
  }

  protected override onShow(): void {
    const total = this.game.score.arenaTotal || this.game.world.structures.reduce((a, s) => a + s.totalValue, 0);
    this.arena.innerHTML = `${THEMES[this.flow.theme].name.toUpperCase()} · SEED ${this.flow.seed} · ${SCORING.roundSeconds / 60} MINUTES · <b>${fmt(total)}</b> POINTS STANDING`;
  }

  /** Render the spinning models into each slot's viewport. Called after the main render. */
  renderViews(renderer: THREE.WebGLRenderer, dt: number): void {
    if (!this.visible) return;
    this.t += dt;
    const H = renderer.domElement.clientHeight;
    const pr = renderer.getPixelRatio();
    renderer.setScissorTest(true);
    for (const s of this.slots) {
      const r = s.view.getBoundingClientRect();
      if (r.width < 4) continue;
      s.model.visible = true;
      s.model.rotation.set(0.35, this.t * 1.2, 0);
      this.camera.aspect = r.width / r.height;
      this.camera.updateProjectionMatrix();
      renderer.setViewport(r.left * pr, (H - r.bottom) * pr, r.width * pr, r.height * pr);
      renderer.setScissor(r.left * pr, (H - r.bottom) * pr, r.width * pr, r.height * pr);
      renderer.render(this.scene, this.camera);
      s.model.visible = false;
    }
    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, renderer.domElement.clientWidth * pr, H * pr);
  }
}
