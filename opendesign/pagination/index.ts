import type { App } from 'vue';
import Pagination from './OPagination.vue';
Pagination.install = function (app: App) {
  app.component('OPagination', Pagination);
};

export { Pagination };