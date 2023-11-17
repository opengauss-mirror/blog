import type { App } from 'vue';
import Drawer from './ODrawer.vue';

Drawer.install = function (app: App) {
  app.component('ODrawer', Drawer);
};
export { Drawer };
