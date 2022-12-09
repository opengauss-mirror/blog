import { defineStore } from 'pinia';

export const useCommon = defineStore('common', {
  state: () => ({
    theme: 'light',
    iconMenuShow: true,
  }),
});
