import type { App } from 'vue';
import Container from './src/container';

Container.install = function (app: App) {
  app.component(Container.name, Container);
};

export { Container };
