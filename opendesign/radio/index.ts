import type { App } from 'vue';
import Radio from './src/radio';
import RadioGroup from './src/radio-group';

Radio.install = function (app: App) {
  app.component(Radio.name, Radio);
};

RadioGroup.install = function (app: App) {
  app.component(RadioGroup.name, RadioGroup);
};

export { Radio, RadioGroup };
