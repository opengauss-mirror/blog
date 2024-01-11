import type { App } from 'vue';

import '@/shared/styles/element-plus/index.scss';
import '@/shared/styles/index.scss';

import Layout from '@/App.vue';
import NotFound from '@/NotFound.vue';

import ElementPlus from 'element-plus';
import OpenDesign from 'opendesign';
import 'element-plus/theme-chalk/dark/css-vars.css';

export default {
  Layout,
  NotFound,
  enhanceApp({ app }: { app: App }) {
    if (typeof global !== 'undefined') {
      // @ts-ignore
      global.window = {};
    }

    app.use(ElementPlus);
    app.use(OpenDesign);
  },
};
