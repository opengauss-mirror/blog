import type { App } from 'vue';
import Search from './OSearch.vue';
Search.install = function (app: App) {
  app.component('OSearch', Search);
};

export { Search };
