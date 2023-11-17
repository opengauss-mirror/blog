import type { App } from 'vue';
import DatePicker from './ODatePicker.vue';
DatePicker.install = function (app: App) {
  app.component('ODatePicker', DatePicker);
};

export { DatePicker };
