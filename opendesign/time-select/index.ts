import type { App } from 'vue';
import TimeSelect from './OTimeSelect.vue';
TimeSelect.install = function (app: App) {
  app.component('OTimeSelect', TimeSelect);
};

export { TimeSelect };
