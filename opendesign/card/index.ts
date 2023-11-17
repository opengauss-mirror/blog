import type { App } from 'vue';
import Card from './OCard.vue';
Card.install = function (app: App) {
  app.component('OCard', Card);
};

export { Card };
