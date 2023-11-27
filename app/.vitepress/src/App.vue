<script setup lang="ts">
import { computed } from 'vue';
import { useData } from 'vitepress';

import LayoutBlog from '@/layouts/LayoutBlog.vue';

const { frontmatter } = useData();
const isCustomLayout = computed(() => {
  return frontmatter.value.category === 'blog';
});
</script>

<template>
  <main>
    <component :is="LayoutBlog" v-if="isCustomLayout"></component>
    <Content v-else />
  </main>
</template>

<style lang="scss" scoped>
#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
main {
  min-height: calc(100vh - 280px);
  background-color: var(--o-color-bg1);
  &::after {
    content: '';
    display: table;
  }
  @media (max-width: 1100px) {
    min-height: calc(100vh - 329px);
  }
}
</style>
