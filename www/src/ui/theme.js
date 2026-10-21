/** Light / dark / system theme handling. */
import { setSystemBars } from '../core/platform.js';
const mq = globalThis.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : null;
let current = 'system';

export function applyTheme(mode = 'system') {
  current = mode;
  const dark = mode === 'dark' || (mode === 'system' && mq && mq.matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', dark ? '#151314' : '#f7f3ef');
  setSystemBars(dark);
}

if (mq) mq.addEventListener('change', () => current === 'system' && applyTheme('system'));
