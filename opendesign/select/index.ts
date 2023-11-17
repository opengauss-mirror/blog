import type { App } from 'vue';
import Select from './OSelect.vue';
import Option from './OOption.vue';
Select.install = function (app: App) {
  app.component('OSelect', Select);
};
Option.install = function (app: App) {
  app.component('OOption', Option);
};

export { Select, Option };
