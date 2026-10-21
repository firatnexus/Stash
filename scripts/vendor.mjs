// Copies the @capacitor/core browser runtime into www/vendor so the web layer
// can use registerPlugin() without a bundler. Run after upgrading Capacitor.
import { copyFileSync, mkdirSync } from 'node:fs';
mkdirSync(new URL('../www/vendor/', import.meta.url), { recursive: true });
copyFileSync(new URL('../node_modules/@capacitor/core/dist/capacitor.js', import.meta.url), new URL('../www/vendor/capacitor.js', import.meta.url));
console.log('Copied @capacitor/core -> www/vendor/capacitor.js');
