import type { App } from 'vue';
import Tree from './OTree.vue';
Tree.install = function (app: App) {
  app.component('OTree', Tree);
};

export { Tree };
