import type { App } from 'vue';
import Tabs from './OTabs.vue';
import TabPane from './OTabPane.vue';
Tabs.install = function (app: App) {
  app.component('OTabs', Tabs);
};
TabPane.install = function (app: App) {
  app.component('OTabPane', TabPane);
};

export { Tabs, TabPane };
