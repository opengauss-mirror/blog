<script setup lang="ts">
import { useData } from 'vitepress';
import type { Component } from 'vue';
import { computed } from 'vue';

import AppHeader from '@/components/AppHeader.vue';
import LayoutBlog from '@/layouts/LayoutBlog.vue';
import LayoutNews from '@/layouts/LayoutNews.vue';

import categories from '@/data/common/category';

const { frontmatter } = useData();

const compMapping: {
  [name: string]: Component;
} = {
  blog: LayoutBlog,
  news: LayoutNews,
};

const isCustomLayout = computed(() => {
  return (
    !!frontmatter.value.category &&
    categories.indexOf(frontmatter.value.category) !== -1
  );
});
const comp = computed(() => {
  return compMapping[frontmatter.value.category];
});
</script>

<template>
  <AppHeader />
  <main>
    <component :is="comp" v-if="isCustomLayout"></component>
    <Content v-else />
  </main>
</template>

<style lang="scss" scoped>
#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

main {
  position: relative;
  min-height: calc(100vh - 339px);
  background-color: var(--o-color-bg1);
  margin-top: 80px;
  overflow: hidden;

  @media (max-width: 1100px) {
    margin-top: 48px;
  }
}
</style>
