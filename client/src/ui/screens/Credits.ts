import { Screen } from '../Screen';
import { button, h } from '../dom';

export class CreditsScreen extends Screen {
  constructor(close: () => void) {
    super('credits');
    const panel = h('div', 'panel');
    panel.append(
      h('h2', 'heading', 'CREDITS'),
      h('p', 'credits', 'Built with Three.js, Rapier and a hand-written voxel engine.<br/>Every sound is synthesized. Every block is a colour.<br/>No textures were harmed.'),
      button('BACK', 'primary', close)
    );
    this.el.append(panel);
  }
}
