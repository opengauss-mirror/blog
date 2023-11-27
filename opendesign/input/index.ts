import type { App } from 'vue';
import Input from './OInput.vue';
Input.install = function (app: App) {
  app.component('OInput', Input);
};

export { Input };
