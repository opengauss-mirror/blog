import type { App } from 'vue';
import Timeline from './src/timeline';

Timeline.install = function (app: App) {
  app.component(Timeline.name, Timeline);
};

export { Timeline };
