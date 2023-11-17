import type { App } from 'vue';
import Table from './OTable.vue';
import TableColumn from './OTableColumn.vue';
Table.install = function (app: App) {
  app.component('OTable', Table);
};
TableColumn.install = function (app: App) {
  app.component('OTableColumn', TableColumn);
};
export { Table, TableColumn };
