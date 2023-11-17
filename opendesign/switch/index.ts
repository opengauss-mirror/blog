import type { App } from 'vue';
import Switch from './OSwitch.vue';
Switch.install = function (app: App) {
  app.component('OSwitch', Switch);
};

export { Switch };
