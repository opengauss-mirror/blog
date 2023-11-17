import type { App } from 'vue';
import Tag from './src/tag';

Tag.install = function (app: App) {
  app.component(Tag.name, Tag);
};

export { Tag };
