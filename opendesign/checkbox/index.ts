import type { App } from 'vue';
import Checkbox from './src/checkbox';
import CheckboxGroup from './src/checkbox-group';

Checkbox.install = function (app: App) {
  app.component(Checkbox.name, Checkbox);
};

CheckboxGroup.install = function (app: App) {
  app.component(CheckboxGroup.name, CheckboxGroup);
};

export { Checkbox, CheckboxGroup };
