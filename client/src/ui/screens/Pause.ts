import { Screen } from '../Screen';
import { button, h } from '../dom';
import type { Flow } from '../../game/Flow';

export class PauseScreen extends Screen {
  constructor(flow: Flow, openSettings: () => void) {
    super('pause');
    const panel = h('div', 'panel');
    panel.append(h('h2', 'heading', 'PAUSED'));
    const stack = h('div', 'stack');
    stack.append(button('RESUME', 'primary big', () => flow.resume()), button('SETTINGS', '', openSettings), button('QUIT TO MENU', 'danger', () => flow.quitToMenu()));
    panel.append(stack);
    this.el.append(panel);
  }
}
