<script setup lang="ts">
import { useData } from 'vitepress';
import AppMdHead from './AppMdHead.vue';

const { frontmatter } = useData();
</script>

<template>
  <div class="markdown">
    <AppMdHead :frontmatter="frontmatter" />
    <Content />
  </div>
</template>

<style lang="scss" scoped>
:deep(.markdown-body-title) {
  .page-title {
    font-weight: 300;
  }
}
</style>
