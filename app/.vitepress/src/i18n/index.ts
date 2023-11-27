import { computed } from 'vue';
import { useData } from 'vitepress';

import common from './common';

const i18n: { [key: string]: any } = {
  zh: {
    common: common.zh,
  },
  en: {
    common: common.en,
  },
};

export function useI18n() {
  const { lang } = useData();
  return computed(() => i18n[lang.value]);
}

export default i18n;
