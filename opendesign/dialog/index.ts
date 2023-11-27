import type { App } from 'vue';
import Dialog from './ODialog.vue';
Dialog.install = function (app: App) {
  app.component('ODialog', Dialog);
};

export { Dialog };
