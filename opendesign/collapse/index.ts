import type { App } from 'vue';
import Collapse from './OCollapse.vue';
import CollapseItem from './OCollapseItem.vue';
Collapse.install = function (app: App) {
  app.component('OCollapse', Collapse);
};
CollapseItem.install = function (app: App) {
  app.component('OCollapseItem', CollapseItem);
};
export { Collapse, CollapseItem };
