import type { App } from 'vue';
import { createPinia } from 'pinia';

import '@/shared/styles/index.scss';

import Layout from '@/App.vue';
import NotFound from '@/NotFound.vue';

export default {
  Layout,
  NotFound,
  enhanceApp({ app }: { app: App }) {
    app.use(createPinia());
  },
};
