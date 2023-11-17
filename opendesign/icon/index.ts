import type { App } from 'vue';
import Icon from './OIcon.vue';

Icon.install = function (app: App) {
  app.component('OIcon', Icon);
};

export { Icon };
